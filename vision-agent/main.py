import os
from typing import Optional

from dotenv import load_dotenv

# Load Stream keys from the parent repo .env
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
# Local .env adds OPENAI_API_KEY and can override any key
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)

from getstream.models import MemberRequest  # noqa: E402
from vision_agents.core import Agent, AgentLauncher, User, Runner  # noqa: E402
from vision_agents.core.instructions import Instructions  # noqa: E402
from vision_agents.plugins import getstream, openai  # noqa: E402

AGENT_USER_ID = "ai-teacher"

LANGUAGE_NAMES: dict[str, str] = {
    "es": "Spanish",
    "fr": "French",
    "ja": "Japanese",
    "de": "German",
}

DEFAULT_SYSTEM_PROMPT = (
    "You are a warm and encouraging AI language teacher conducting a voice lesson. "
    "You always speak English and teach the target language through English. "
    "Introduce vocabulary clearly, repeat each word twice, and ask the student to repeat after you. "
    "Give positive reinforcement and gently correct pronunciation mistakes. "
    "Keep your responses concise — this is an audio lesson, so speak naturally and at a comfortable pace."
)


def _language_name_from_call_id(call_id: str) -> Optional[str]:
    # call_id format: lesson-{langCode}-lesson-{n}-{userId}
    parts = call_id.split("-")
    if len(parts) >= 2 and parts[0] == "lesson":
        return LANGUAGE_NAMES.get(parts[1])
    return None


async def create_agent(**kwargs) -> Agent:
    return Agent(
        edge=getstream.Edge(),
        llm=openai.Realtime(),
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

    async with agent.join(call):
        # Wait for the student to join (returns immediately if already present)
        await agent.wait_for_participant(timeout=60.0)

        if intro_message:
            # Use the lesson's specific opening line, then continue the lesson
            context_parts = [f"A student just joined your {language_name} lesson."]
            if lesson_title:
                context_parts.append(f"The lesson is called '{lesson_title}'.")
            context_parts.append(
                f"Begin immediately with this exact greeting: \"{intro_message}\" "
                f"Then continue the lesson as described in your instructions."
            )
            await agent.simple_response(" ".join(context_parts))
        else:
            await agent.simple_response(
                f"A student just joined for a {language_name} lesson. "
                f"Greet them warmly in English, introduce yourself as their {language_name} teacher, "
                f"and begin today's lesson right away."
            )

        await agent.finish()


if __name__ == "__main__":
    Runner(AgentLauncher(create_agent=create_agent, join_call=join_call)).cli()
