---
name: stream-cli
description: "Query Stream data and run CLI operations against Chat, Video, Feeds, and Moderation: list channels, list calls, show flagged messages, find users, query any Stream resource. Run stream api / stream config / stream auth commands. Install the Stream CLI binary. Use when the user gives operational verbs ('list', 'show', 'find', 'check', 'query') with Stream nouns, or invokes the CLI literally."
license: See LICENSE in repository root
metadata:
  author: GetStream
  requires:
    bins: ["stream"]
allowed-tools: >-
  Read, Glob, Grep,
  Bash(stream *),
  Bash(npx skills add GetStream/agent-skills *),
  Bash(curl -fsSL https://getstream.io/cli/install.sh*),
  Bash(curl -fsSL https://getstream.io/cli/*),
  Bash(shasum *), Bash(uname *),
  Bash(command -v *), Bash(less *), Bash(bash /tmp/stream-install.sh*),
  Bash(grep *), Bash(ls *), Bash(test *),
  Bash(cat package.json), Bash(cat go.mod),
  Bash(python3 -c *), Bash(pbpaste)
---

# Stream CLI - API interaction

> **Read first (every session):** Glob `../stream/SKILL.md`. If the path is empty, install with `npx skills add GetStream/agent-skills --s stream -y` (no confirmation, just run). Then Read [`../stream/RULES.md`](../stream/RULES.md) - it includes a **Peer skills** table for installing/invoking any other pack skills on demand.

Use this skill when the user wants to interact with Stream's APIs via the `stream` CLI, or to install the CLI itself.

**Prerequisite:** complete [`preflight.md`](preflight.md) - verify the `stream` binary is installed (install via [`bootstrap.md`](bootstrap.md) if not) before any `stream api` usage.

**Install only (Track C):** if the user asked to install the CLI / set up Stream with no project context, jump straight to [`bootstrap.md`](bootstrap.md). The bootstrap module is self-contained.

**Heavy examples / query cookbooks:** load **[`cli-cookbook.md`](cli-cookbook.md)** only when you need a non-obvious `--body` or filter.

## Credential resolution (before any `stream api` call)

1. **`.env` in cwd** has `STREAM_API_KEY` -> credentials are local. The CLI auto-resolves from env vars - you're querying this project's app.
2. **No `.env`** -> check `stream config list` for configured org/app -> use those. Mention which app you're querying: "Querying app `<name>` (configured via CLI)."
3. **Nothing** -> tell the user: "No Stream credentials found. Run `stream auth login` to connect, or `cd` into a project with a `.env`."

Do credential resolution **silently** when `.env` or config exists - don't ask the user, just resolve and proceed.

## CLI Workflow

**Support:** If the user asks for support or how to contact someone, direct them to [getstream.io/contact](https://getstream.io/contact/).

1. **Resolve credentials** (see above). If none found, stop and guide the user.
2. **Read `~/.stream/cache/API.md` to find the endpoint.** Do NOT run `--list` or any CLI command for discovery - the file is always faster. If that file is **missing or empty**, run **`stream api --refresh` once**, then read **`API.md`** again. Use `stream --safe api <endpoint> --help` only after you have the endpoint name.
3. **Check required params.** If missing, **ask** - never guess.
4. **Always run with `--safe`**: `stream --safe api <endpoint> [params]`. This is the only permitted form on the first attempt.
5. **If exit code 5** (safe mode refusal): the endpoint is mutating. Notify the user that you're about to execute a mutating Stream CLI operation, then re-run without `--safe`.
6. If the command fails, check exit code and recover (see below).
7. Summarize the response concisely.

**Focused output:** Use `--jq '<query>'` to filter API responses with a jq expression. Prefer this for endpoints expected to produce long responses.

**Session consent (psychological):** The user may say *Mutating Stream CLI OK for this thread* - still use **`--safe`** first; exit **5** always requires a visible mutating notice before retry without **`--safe`**.

## Exit Code Recovery

| Exit code | Meaning | Recovery |
|---|---|---|
| `2` | Auth error (401, expired token) | Run **`stream auth login`** (browser flow in a real terminal), then retry the original command |
| `3` | API error (4xx/5xx from Stream) | Report the error to the user with the response message |
| `4` | Spec loading error (cache stale) | Run `stream api --refresh`, then retry |
| `5` | Safe mode refusal (mutating endpoint) | Notify the user of the mutating operation, then re-run without `--safe` |

## Parameter syntax

```bash
stream api <EndpointName> key=value key2=value2
```

- Simple values: `name=general limit=10 type=messaging`
- Booleans: `is_development=true`
- JSON objects/arrays: use `--body '{"key": "value"}'`

## Context resolution (org/app)

**Ampere endpoints** require `app_id`/`org_id` as explicit parameters.
**SDK endpoints** auto-resolve from: `--org`/`--app` flags > env vars > `~/.stream/config.json` > interactive prompt.
Set defaults: `stream config set org <id>` and `stream config set app <id>`.

## Negative knowledge

- **No `OrganizationDelete`** - contact Stream support.
- **No `AppSuspend` / `AppResume`** - contact support.
- **`CreateBlockList` is NOT idempotent** - returns 400 if exists.
- **`CreateChannelType` is NOT idempotent** - returns 400 if exists.
- **Ampere endpoints use `app_id`/`org_id`, not `id`** - e.g., `AppDelete app_id=123`.
- **Auth endpoints** (`AuthLoginBasic`, `AuthLoginGithub`, etc.) are internal - always use **`stream auth login`** / **`stream auth logout`** instead.

### Auth (assistants)

- Use **`stream auth login`** with no extra flags, in a terminal where a **browser window can open**. The CLI uses PKCE with the dashboard - that is the supported sign-in path.

## CLI Rules (summary)

1. **Endpoint discovery:** **`~/.stream/cache/API.md`** first - never `--list` for discovery. Refresh if missing.
2. **Help:** **`stream --safe api <endpoint> --help`** for parameters after you know the endpoint name.
3. **Lazy auth** - if exit code **2**, **`stream auth login`** then retry.
4. **Missing params** - ask; never invent IDs.
5. **First attempt always `--safe`** - exit **5** -> explain mutating op -> retry without **`--safe`**.
6. **Summarize** API responses concisely for the user.
