---
name: Agent
description: Use when building real-time voice and video AI agents, integrating with 30+ AI providers, deploying to production with HTTP servers or Kubernetes, adding function calling and tool access, or handling complex conversation flows with event subscriptions.
metadata:
    mintlify-proj: agent
    version: "1.0"
---

# Vision Agents Skill

## Product Summary

Vision Agents is a Python framework for building real-time voice and video AI agents on Stream's edge network. Agents orchestrate LLMs, speech-to-text, text-to-speech, video processors, and external tools via a modular `Agent` class. The framework is provider-agnostic — swap Gemini for OpenAI, Deepgram for ElevenLabs, or any of 30+ integrations without rewriting agent logic. Deploy as a single-session console app or multi-session HTTP server with built-in metrics, horizontal scaling via Redis, and Kubernetes support. Key files: `main.py` (agent definition), `.env` (API keys), `pyproject.toml` (dependencies). Primary docs: https://visionagents.ai

## When to Use

Reach for this skill when:
- **Building voice agents** — Realtime speech-to-speech or custom STT/LLM/TTS pipelines
- **Adding video understanding** — Real-time video processing, object detection, VLM analysis
- **Integrating tools** — Function calling, MCP servers, RAG, external APIs
- **Deploying to production** — HTTP servers, session management, scaling, monitoring
- **Handling complex conversations** — Event subscriptions, interruption handling, turn detection
- **Connecting to phone networks** — Twilio integration for inbound/outbound calls
- **Choosing AI providers** — Evaluating which LLM, STT, TTS, or vision model to use

## Quick Reference

### Agent Constructor Parameters

| Parameter | Type | Required | Notes |
|-----------|------|----------|-------|
| `edge` | EdgeTransport | Yes | Stream or custom transport (e.g., `getstream.Edge()`) |
| `llm` | LLM \| AudioLLM \| Realtime | Yes | Language model (text, audio, or realtime) |
| `agent_user` | User | Yes | Agent identity: `User(name="Assistant", id="agent")` |
| `instructions` | str | No | System prompt; supports `@file.md` for file references |
| `stt` | STT | No | Speech-to-text (disabled in realtime mode) |
| `tts` | TTS | No | Text-to-speech (disabled in realtime mode) |
| `turn_detection` | TurnDetector | No | Manages conversation turns; auto-disabled if STT has built-in |
| `processors` | List[Processor] | No | Video/audio processors (YOLO, avatars, etc.) |
| `mcp_servers` | List[MCPBaseServer] | No | External tools via Model Context Protocol |
| `streaming_tts` | bool | No | Stream TTS chunks as sentences complete (default: False) |

### Core Methods

| Method | Purpose | Example |
|--------|---------|---------|
| `async join(call)` | Join a call (context manager) | `async with agent.join(call):` |
| `await simple_response(text)` | Send text to LLM, speak response | `await agent.simple_response("Hello")` |
| `await simple_audio_response(pcm)` | Send audio to realtime LLM | `await agent.simple_audio_response(audio_data)` |
| `await say(text)` | Speak text directly (bypass LLM) | `await agent.say("Welcome!")` |
| `await finish()` | Wait for call to end | `await agent.finish()` |
| `await close()` | Clean up resources | `await agent.close()` |
| `@agent.events.subscribe` | Subscribe to events | `@agent.events.subscribe async def on_join(event):` |

### CLI Commands

```bash
# Console mode (single agent, development)
uv run agent.py run [--call-id ID] [--debug] [--video-track-override /path/to/video.mp4]

# HTTP server mode (multi-session, production)
uv run agent.py serve [--host 0.0.0.0] [--port 8000] [--agents-log-level DEBUG]
```

### HTTP Server Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/calls/{call_id}/sessions` | Start agent session |
| DELETE | `/calls/{call_id}/sessions/{session_id}` | Close session |
| GET | `/calls/{call_id}/sessions/{session_id}` | Get session info |
| GET | `/calls/{call_id}/sessions/{session_id}/metrics` | Real-time metrics |
| GET | `/health` | Liveness check |
| GET | `/ready` | Readiness check |

### Plugin Installation

```bash
# Install only what you need
uv add "vision-agents[getstream,gemini,deepgram,elevenlabs]"
```

### Environment Variables

```bash
# Stream (required for transport)
STREAM_API_KEY=...
STREAM_API_SECRET=...

# LLM providers
GOOGLE_API_KEY=...           # Gemini
OPENAI_API_KEY=...           # OpenAI
XAI_API_KEY=...              # Grok

# Speech services
DEEPGRAM_API_KEY=...         # STT
ELEVENLABS_API_KEY=...       # TTS
```

## Decision Guidance

### Realtime vs Custom Pipeline

| Aspect | Realtime Model | Custom Pipeline |
|--------|---|---|
| **Setup** | Simplest — one plugin | More config (STT, LLM, TTS) |
| **Latency** | Lowest (speech-to-speech) | Slightly higher (3 hops) |
| **Control** | Limited (model-specific) | Full (swap any component) |
| **Providers** | Gemini, OpenAI, Qwen, xAI | Mix any LLM + STT + TTS |
| **Use when** | Speed matters, simple flows | Need specific providers or tools |

**Realtime example:**
```python
agent = Agent(
    edge=getstream.Edge(),
    llm=gemini.Realtime(),  # Built-in STT/TTS
    agent_user=User(name="Assistant", id="agent"),
)
```

**Custom pipeline example:**
```python
agent = Agent(
    edge=getstream.Edge(),
    llm=gemini.LLM(),
    stt=deepgram.STT(eager_turn_detection=True),
    tts=elevenlabs.TTS(),
    agent_user=User(name="Assistant", id="agent"),
)
```

### Deployment Mode

| Mode | Use When | Scaling |
|------|----------|---------|
| **Console** (`run`) | Development, testing, demos | Single agent only |
| **HTTP Server** (`serve`) | Production, multiple calls | Multi-session, horizontal scaling |

### Turn Detection

| Option | Best For | Notes |
|--------|----------|-------|
| **Built-in (Deepgram/ElevenLabs)** | Most cases | No extra plugin needed |
| **Smart Turn** | Custom pipelines | Silero VAD + Whisper features |
| **Vogent** | Advanced interruption | Neural turn completion prediction |
| **None** | Realtime models | Auto-handled by model |

## Workflow

### 1. Set Up Project

```bash
uv init --python 3.12 my-agent && cd my-agent
uv add "vision-agents[getstream,gemini,deepgram,elevenlabs]" python-dotenv
```

### 2. Create `.env` with API Keys

Get keys from:
- Stream: https://getstream.io/try-for-free/
- Google: https://aistudio.google.com/
- Deepgram: https://deepgram.com/
- ElevenLabs: https://elevenlabs.io/

```bash
STREAM_API_KEY=...
STREAM_API_SECRET=...
GOOGLE_API_KEY=...
DEEPGRAM_API_KEY=...
ELEVENLABS_API_KEY=...
```

### 3. Define Agent Factory & Join Logic

```python
from dotenv import load_dotenv
from vision_agents.core import Agent, AgentLauncher, User, Runner
from vision_agents.plugins import getstream, gemini, deepgram, elevenlabs

load_dotenv()

async def create_agent(**kwargs) -> Agent:
    agent = Agent(
        edge=getstream.Edge(),
        agent_user=User(name="Assistant", id="agent"),
        instructions="You're a helpful voice assistant.",
        llm=gemini.LLM(),
        stt=deepgram.STT(eager_turn_detection=True),
        tts=elevenlabs.TTS(),
    )
    
    # Register functions for tool calling
    @agent.llm.register_function(description="Get weather")
    async def get_weather(location: str) -> str:
        return f"Sunny in {location}"
    
    return agent

async def join_call(agent: Agent, call_type: str, call_id: str, **kwargs) -> None:
    call = await agent.create_call(call_type, call_id)
    async with agent.join(call):
        await agent.simple_response("Hello! How can I help?")
        await agent.finish()

if __name__ == "__main__":
    Runner(AgentLauncher(create_agent=create_agent, join_call=join_call)).cli()
```

### 4. Run & Test

```bash
# Development
uv run main.py run

# Production
uv run main.py serve --host 0.0.0.0 --port 8000
```

### 5. Add Event Handlers (Optional)

```python
from vision_agents.core.events import CallSessionParticipantJoinedEvent
from vision_agents.core.stt.events import STTTranscriptEvent

@agent.events.subscribe
async def on_join(event: CallSessionParticipantJoinedEvent):
    if event.participant.user.id != "agent":
        await agent.simple_response(f"Welcome, {event.participant.user.name}!")

@agent.events.subscribe
async def on_transcript(event: STTTranscriptEvent):
    print(f"User: {event.text}")
```

### 6. Deploy to Production

```bash
# Docker
docker buildx build --platform linux/amd64 -t vision-agent .
docker run -e STREAM_API_KEY=... vision-agent

# Kubernetes (see guides/kubernetes-deployment)
kubectl apply -f deployment.yaml
```

## Common Gotchas

- **Forgetting `load_dotenv()`** — API keys won't load. Always call `load_dotenv()` before creating agents.
- **Mixing realtime + STT/TTS** — Realtime models auto-disable STT/TTS. Don't pass both or you'll get conflicts.
- **Synchronous functions in `@register_function`** — Only async functions work. Use `async def` or wrap sync code with `asyncio.to_thread()`.
- **Not awaiting async calls** — `await agent.simple_response()`, `await agent.finish()`, etc. are all async. Missing `await` causes hangs.
- **Agent joins call twice** — The `Agent` can only join once. Reuse the same instance or create a new one.
- **Turn detection with built-in STT** — Deepgram and ElevenLabs STT include turn detection. Passing a separate `turn_detection` plugin is ignored (not an error, just redundant).
- **Missing `agent_user`** — The `User` object is required. Omitting it raises `TypeError`.
- **Realtime model without audio LLM** — Realtime models like `gemini.Realtime()` are `AudioLLM` instances. Don't use with custom STT/TTS.
- **Session limits in production** — Set `max_concurrent_sessions` and `agent_idle_timeout` in `AgentLauncher` to prevent resource exhaustion.
- **CORS issues** — Configure `ServeOptions(cors_allow_origins=[...])` for cross-origin requests.
- **Video override path doesn't exist** — `--video-track-override` silently fails if the file path is wrong. Verify the path exists.
- **Metrics not appearing** — Enable with `broadcast_metrics=True` in `Agent()` constructor.

## Verification Checklist

Before submitting agent code:

- [ ] All required API keys are in `.env` and loaded with `load_dotenv()`
- [ ] `create_agent()` and `join_call()` are async functions
- [ ] `Agent` has `edge`, `llm`, and `agent_user` parameters
- [ ] Event handlers use `@agent.events.subscribe` and are async
- [ ] Registered functions use `@llm.register_function()` and are async
- [ ] `await agent.join(call)` is used as a context manager
- [ ] `await agent.finish()` is called to wait for call end
- [ ] No synchronous function calls in async context (use `await` or `asyncio.to_thread()`)
- [ ] STT/TTS are not passed when using realtime LLM
- [ ] `Runner(AgentLauncher(...)).cli()` is the entry point
- [ ] Console mode works: `uv run agent.py run`
- [ ] Server mode works: `uv run agent.py serve`
- [ ] Metrics endpoint responds: `curl http://localhost:8000/calls/{call_id}/sessions/{session_id}/metrics`
- [ ] Health check passes: `curl http://localhost:8000/health`

## Resources

**Comprehensive navigation:** https://visionagents.ai/llms.txt

**Critical pages:**
- [Quickstart](https://visionagents.ai/introduction/quickstart) — 5-minute setup
- [Voice Agents Guide](https://visionagents.ai/introduction/voice-agents) — Realtime vs custom pipelines
- [Built-in HTTP Server](https://visionagents.ai/guides/http-server) — Production deployment, session management, API endpoints

---

> For additional documentation and navigation, see: https://visionagents.ai/llms.txt