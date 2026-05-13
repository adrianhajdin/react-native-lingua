# Preflight - probes for tracks A, B, C, E

Three short probes you run once at the start of a session before any builder, CLI, or bootstrap work. **Track D (docs search) skips this file entirely** - pure docs answers must not touch the user's filesystem or shell.

Run them in order. Stop and follow the recovery line if any step fails.

---

## 1. Project signals

A local-only probe - no CLI binary, no network. Tells the routing what kind of project you're standing in.

```bash
bash -c 'echo "=== PKG ==="; grep -oE "\"(stream-chat[^\"]*|@stream-io/[^\"]*)\": *\"[^\"]*\"" package.json 2>/dev/null; echo "=== NEXT ==="; test -f package.json && grep -q "\"next\"" package.json && echo "NEXTJS" || echo "NO_NEXT"; echo "=== NATIVE ==="; ls pubspec.yaml go.mod requirements.txt pyproject.toml Podfile build.gradle 2>/dev/null; echo "=== EMPTY ==="; test -z "$(ls -A 2>/dev/null)" && echo "EMPTY_CWD" || echo "NON_EMPTY"'
```

Result:
- **PKG:** Stream npm packages with versions (e.g. `"stream-chat-react": "^14.2.0"`) - empty if none.
- **NEXT:** `NEXTJS` if `next` is in `package.json`, else `NO_NEXT`.
- **NATIVE:** non-npm project files present (Flutter, Go, Python, iOS, Android).
- **EMPTY:** `EMPTY_CWD` if cwd is empty, else `NON_EMPTY`.

Hold the result in conversation context. Don't re-run unless a scaffold/install completed and added packages, the user changed directory mid-conversation, or a signal you need is missing (re-probe one specific file).

Don't print this as a heading. Surface a signal only when it changes what you say to the user (e.g. "I see Chat React v14 - looking up v14 docs.").

---

## 2. CLI gate

Verify the `stream` executable is installed before any further work in this session.

```bash
bash -c 'command -v stream >/dev/null 2>&1 && stream --version || echo "NOT_FOUND"'
```

- **`NOT_FOUND` or non-zero exit** -> **stop here.** Do not proceed to credentials, builder, `stream api`, or SDK wiring. Follow [`bootstrap.md`](bootstrap.md) (explain what the CLI is, ask the user once for permission to install, then run the install). Only after the user **declines** install may you offer read-only help from the `stream-builder` skill's [`sdk.md`](../stream-builder/sdk.md), or hand the user back to the `stream-docs` skill.
- **`stream --version` succeeds** -> continue to step 3.
- **Sandbox blocks the probe** -> say so plainly and ask the user to confirm `stream` is installed before continuing.

---

## 3. Credentials probe + auth check

Confirms the CLI is configured and authenticated. Project signals are already in context from step 1 - don't repeat them here.

```bash
bash -c 'echo "=== CLI ==="; command -v stream 2>/dev/null; stream --version 2>/dev/null || echo "NOT_FOUND"; echo "=== CONFIG ==="; stream config list 2>/dev/null || echo "NO_CONFIG"'
```

- **CLI state:** installed or not (should already be OK after the gate).
- **Config state:** CLI configured (`cli-configured`) or not (`NO_CONFIG`).

`.env` is intentionally NOT checked here - many sandboxes install a `PreToolUse` hook that blocks any bash command referencing `.env`, even inside a `bash -c` wrapper, which would silently fail this probe. For tracks A and E, you'll either create a fresh `.env` via `stream env` (builder Task B) or work in a project that already has one.

### Auth check (run only on tracks A, B, E that need to make `stream api` calls)

The probe above does NOT verify you're logged in - `stream config list` succeeds even when unauthenticated. Run one auth-requiring call **unpiped** so the exit code surfaces:

```bash
stream api OrganizationRead
```

Don't pipe through `head`/`tail`/`jq` here - the pipeline exit code is the last command's, which masks the auth failure. If output volume is a concern: `stream api OrganizationRead >/dev/null 2>&1; echo "exit=$?"`.

- **Exit 0** -> authenticated, continue. (Bonus: the output is reusable for builder Step 2's "check existing orgs".)
- **Exit 2 / "not authenticated"** -> run `stream auth login` per [`RULES.md`](../stream/RULES.md) > CLI safety (browser PKCE, standalone invocation, hang recovery).

---

## 4. One-line status

After the probes, show the user a single status line that combines project signals + CLI state. No heading, no bullets - one line:

- `OK Stream CLI v0.1.0 | app-a3f7b201 (Feeds + Chat) | Next.js + Chat React v14 | ~/stream-tv`
- `OK Stream CLI v0.1.0 | configured via CLI | no local project`
- `OK Stream CLI v0.1.0 | no credentials | empty dir (ready to scaffold)`
- `X Stream CLI not found - see bootstrap.md to install` (only if step 2 was skipped in error - go back and run it; do not route onward)
