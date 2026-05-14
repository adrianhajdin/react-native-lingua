import os
from typing import Optional

from dotenv import load_dotenv

# Load Stream keys from the parent repo .env
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
# Local .env adds OPENAI_API_KEY and can override any key
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)

from getstream.models import MemberRequest  # noqa: E402
from openai.types.realtime.realtime_transcription_session_audio_input_turn_detection_param import ServerVad  # noqa: E402
from vision_agents.core import Agent, AgentLauncher, User, Runner  # noqa: E402
from vision_agents.core.instructions import Instructions  # noqa: E402
from vision_agents.core.llm.events import (  # noqa: E402
    RealtimeAgentSpeechTranscriptionEvent,
    RealtimeUserSpeechTranscriptionEvent,
)
from vision_agents.plugins import getstream, openai  # noqa: E402

AGENT_USER_ID = "ai-teacher"

LANGUAGE_NAMES: dict[str, str] = {
    "es": "Spanish",
    "fr": "French",
    "ja": "Japanese",
    "de": "German",
}

DEFAULT_SYSTEM_PROMPT = (
    "You are a warm, energetic AI language teacher having a real voice conversation with a student. "
    "You operate in exactly two modes and NEVER mix them:\n"
    "TEACHING MODE: Say one word or phrase, its English meaning, and one pronunciation tip. "
    "End with a single question like 'Can you say that?' or 'Give it a try!'. "
    "Your turn is OVER at that question mark. Stop speaking. Output nothing else. "
    "Do NOT imagine what the student will say. Do NOT pre-write your reaction. Just stop.\n"
    "REACTING MODE: You have just received actual speech from the student in this turn. "
    "React to what they actually said — one sentence of praise or correction — "
    "then either ask them to try again or introduce the next word. Stop.\n"
    "ABSOLUTE RULES:\n"
    "- Never say 'Nice job', 'Perfect', 'Great', or any praise unless the student has "
    "ACTUALLY spoken in the current turn and you heard something from them.\n"
    "- Never continue past a question mark. Every question is a hard stop.\n"
    "- Never role-play the student's response or write what you imagine they said.\n"
    "- Keep every reply to one or two short sentences maximum.\n"
    "- Stay strictly within the current lesson's vocabulary."
)

def _require_env(var_name: str) -> None:
    if not os.getenv(var_name):
        raise RuntimeError(f"Missing required environment variable: {var_name}")

def _language_name_from_call_id(call_id: str) -> Optional[str]:
    # call_id format: lesson-{langCode}-lesson-{n}-{userId}
    parts = call_id.split("-")
    if len(parts) >= 2 and parts[0] == "lesson":
        return LANGUAGE_NAMES.get(parts[1])
    return None


async def create_agent(**kwargs) -> Agent:
    return Agent(
        edge=getstream.Edge(),
        llm=openai.Realtime(
            # server_vad fires on raw audio energy (~100 ms after mic opens) rather
            # than waiting for semantic speech intent detection (~500 ms+).
            # This means the agent stops speaking almost immediately when the user
            # presses the push-and-hold mic button, before they have said a word.
            realtime_session={
                "type": "realtime",
                "audio": {
                    "input": {
                        "transcription": {"model": "gpt-4o-mini-transcribe"},
                        "turn_detection": ServerVad(
                            type="server_vad",
                            threshold=0.4,         # low enough to catch ambient noise on mic open
                            prefix_padding_ms=200,  # capture brief audio before speech onset
                            silence_duration_ms=400, # commit turn after 400 ms of silence
                            interrupt_response=True, # stop agent audio the moment VAD fires
                        ),
                    }
                },
            }
        ),
        agent_user=User(name="AI Teacher", id=AGENT_USER_ID),
        instructions=DEFAULT_SYSTEM_PROMPT,
    )


async def join_call(agent: Agent, call_type: str, call_id: str, **kwargs) -> None:
    call = await agent.create_call(call_type, call_id)

    # Read lesson context packed into the call's custom data by the mobile app
    custom: dict = {}
    try:
        resp = await call.get()
        custom = resp.data.call.custom or {}
    except Exception as e:
        print(f"[agent] Warning: could not fetch call custom data: {e}")

    system_prompt  = custom.get("system_prompt") or DEFAULT_SYSTEM_PROMPT
    intro_message  = custom.get("intro_message")
    language_code  = custom.get("language") or ""
    lesson_title   = custom.get("lesson_title") or ""
    language_name  = LANGUAGE_NAMES.get(language_code) or _language_name_from_call_id(call_id) or "language"

    # Apply lesson-specific instructions before joining so the Realtime LLM receives them
    agent.instructions = Instructions(input_text=system_prompt)

    # Grant admin role + go live so the agent can publish audio
    try:
        await call.update_call_members(
            update_members=[MemberRequest(user_id=AGENT_USER_ID, role="admin")]
        )
    except Exception as e:
        print(f"[agent] Warning: could not set admin role: {e}")

    try:
        await call.go_live()
    except Exception as e:
        print(f"[agent] Warning: go_live failed (expected for default call type): {e}")

    # Accumulate transcript deltas and forward them as Stream custom events so the
    # mobile app can display real-time captions word-by-word as speech is generated.
    partial_agent: list[str] = []
    partial_user: list[str] = []

    async def on_transcript_event(event) -> None:
        if isinstance(event, RealtimeAgentSpeechTranscriptionEvent):
            if event.mode == "delta" and event.text:
                partial_agent.append(event.text)
                try:
                    await agent.send_custom_event({
                        "type": "transcript_partial",
                        "speaker": "agent",
                        "text": "".join(partial_agent),
                    })
                except Exception as e:
                    print(f"[agent] send_custom_event error: {e}")
            elif event.mode == "final":
                partial_agent.clear()

        elif isinstance(event, RealtimeUserSpeechTranscriptionEvent):
            if event.mode == "delta" and event.text:
                partial_user.append(event.text)
                try:
                    await agent.send_custom_event({
                        "type": "transcript_partial",
                        "speaker": "user",
                        "text": "".join(partial_user),
                    })
                except Exception as e:
                    print(f"[agent] send_custom_event error: {e}")
            elif event.mode == "final":
                partial_user.clear()

    agent.subscribe(on_transcript_event)

    async with agent.join(call):
        # Wait for the student to join (returns immediately if already present)
        await agent.wait_for_participant(timeout=60.0)

        if intro_message:
            context_parts = [f"A student just joined your {language_name} lesson"]
            if lesson_title:
                context_parts[0] += f" — '{lesson_title}'"
            context_parts[0] += "."
            context_parts.append(
                f"Deliver this greeting and NOTHING else: \"{intro_message}\" "
                f"After the greeting, ask the student one simple question to get them talking — "
                f"for example 'Are you ready to get started?' or 'Have you learned any {language_name} before?' "
                f"Then STOP and wait for the student's reply before teaching anything."
            )
            await agent.simple_response(" ".join(context_parts))
        else:
            await agent.simple_response(
                f"A student just joined your {language_name} lesson. "
                f"Greet them warmly and ask one short question — like 'Ready to learn some {language_name}?' "
                f"Then STOP and wait for their reply before you teach anything."
            )

        await agent.finish()


if __name__ == "__main__":
    _require_env("STREAM_API_KEY")
    _require_env("STREAM_API_SECRET")
    _require_env("OPENAI_API_KEY")

    Runner(AgentLauncher(create_agent=create_agent, join_call=join_call)).cli()
