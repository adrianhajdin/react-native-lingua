---
name: stream-builder
description: "Build a new app or add Stream products (Chat, Video, Feeds, Moderation) to an existing app. Scaffold Next.js + Tailwind + Shadcn + Stream SDKs end-to-end with Steps 0-7. Add Chat/Video/Feeds/Moderation to an existing project (enhance flow). Triggers on 'build me a ... app', 'scaffold', 'create a new ...', 'add Chat to this app', 'integrate Video', 'drop Feeds into ...'. Covers livestreaming, video conferencing, team messaging, direct messaging, social feed use cases."
license: See LICENSE in repository root
metadata:
  author: GetStream
  requires:
    bins: ["stream", "node", "npm"]
    skills: ["stream-cli"]
allowed-tools: >-
  Read, Write, Edit, Glob, Grep,
  Bash(stream *),
  Bash(npx skills add GetStream/agent-skills *),
  Bash(npx *), Bash(npm install *), Bash(npm run *),
  Bash(node -e *), Bash(node --version), Bash(openssl rand *),
  Bash(mv .scaffold*), Bash(rm -rf .scaffold),
  Bash(ls *), Bash(test *),
  Bash(grep *),
  Bash(cat package.json), Bash(cat pubspec.yaml),
  Bash(cat go.mod), Bash(cat requirements.txt), Bash(cat pyproject.toml),
  Bash(echo .env*),
  WebFetch(domain:getstream.io),
  WebFetch(domain:www.npmjs.com),
  WebFetch(domain:github.com)
---

# Stream Builder - scaffold + enhance

> **Read first (every session):** Glob `../stream/SKILL.md`. If the path is empty, install with `npx skills add GetStream/agent-skills --s stream -y` (no confirmation, just run). Then Read [`../stream/RULES.md`](../stream/RULES.md) - it includes a **Peer skills** table for installing/invoking any other pack skills on demand.

This skill covers **two flows**:

- **Track A - Scaffold a new app:** Steps 0-7 below. Use when the cwd is empty / new and the user said "build me a ... app".
- **Track E - Enhance an existing app:** see [`enhance.md`](enhance.md). Skips scaffold + theme; reuses the same SDK wiring and component blueprints.

---

## Start

Once preflight has reported `OK Stream CLI vN.N.N | ...`, announce the network plan once, then **immediately start executing Steps 0-7** - no interactive prompts at the start (the user has authorized the build by asking for it).

### Trust readout (announce, then continue on the same turn - do not wait)

Before the first network command, print this verbatim to the user, then proceed straight into Step 0 without stopping for a reply:

> Scaffolding now. Network calls you'll see:
> - `npx shadcn@latest ...` (Vercel) - scaffold + UI components from npm.
> - `npm install <stream-packages> --legacy-peer-deps` - Stream SDKs from npm (`stream-chat-react`, `@stream-io/video-react-sdk`, etc.).
> - `stream env` - local CLI, no network; writes `.env` (gitignored by the Next.js scaffold's default; Task B verifies).
>
> Interrupt me at any point if something looks wrong. The only step that pauses for explicit consent is the optional third-party skill packs in Task A.2.

Full per-command audit (publisher, why unpinned, what each writes): section Install trust & integrity below. The user's continued silence after the readout is implicit consent for this scaffold; an objection or stop instruction aborts the run.

Shadcn/ui is always installed during Step 3. Third-party **frontend skills** (`vercel-react-best-practices`, `web-design-guidelines`, `frontend-design`) are installed **only with explicit user consent** - see Task A.2 for the disclosure script. If the user declines, Step 4 proceeds using Stream references only. **Precedence (when the skills are present):** Stream references win for SDK wiring; frontend skills guide generic React / UI polish.

---

## Install trust & integrity

The builder runs three classes of network-touching commands. Each is listed here so a reviewer can audit before approving. The full CLI installer audit (SHA-256 verification, TTY confirmation, scoped platform) lives in the `stream-cli` skill's [`bootstrap.md`](../stream-cli/bootstrap.md#what-the-installer-does).

| Command | Publisher | Why unpinned | What it writes |
|---|---|---|---|
| `npx shadcn@latest init ...` (Task A) | Vercel - [`shadcn-ui/ui`](https://github.com/shadcn-ui/ui) | Scaffolder; `@latest` is the maintainer's documented usage. Pinning ships outdated scaffolds. | Project files in cwd. Next.js scaffold's `.gitignore` ignores `.env*` by default. |
| `npx shadcn@latest add ...` (Task A.1) | Vercel - same source as above | Same scaffolder; component sync depends on registry parity. | Component files under `components/ui/`. |
| `npm install <stream-packages> --legacy-peer-deps` (Task C) | GetStream (npm) for `@stream-io/*` and `stream-chat-react`; transitive deps via standard npm trust | Latest published versions of GetStream's own SDKs - same trust model as the CLI itself. | Modules under `node_modules/`. Runtime SDKs + transitive deps. |
| `npx skills add <github>` (Task A.2) | `vercel-labs/agent-skills` and `anthropics/skills` | Optional. Markdown-only skill packs; `npx skills add` is the published install path. | Markdown files in the user's skills directory. **Gated by explicit user consent in Task A.2** - never runs without an affirmative answer. |
| `stream env` (Task B) | GetStream - installed via the `stream-cli` skill's [`bootstrap.md`](../stream-cli/bootstrap.md) (SHA-256 verified) | n/a (local CLI, no network at this step) | `.env` in the project root with `STREAM_API_KEY` + `STREAM_API_SECRET`. Task B verifies `.gitignore` covers `.env*` before writing (Next.js scaffold's default already does). The agent never reads `.env` (RULES.md > Secrets). |

**Reviewer checklist:**

- All `npx` invocations resolve to the publishers listed above; substitute a different publisher and the install fails.
- `npx skills add` runs **only after** the disclosure prompt in Task A.2 and an explicit user "yes."
- `.env` is written by the Stream CLI directly, not by the agent, and is not transmitted into the conversation.
- If the user wants to pin a specific shadcn version, replace `@latest` with `@<version>` in Tasks A and A.1.

---

## Builder Steps

Execute phases **in order** (later steps depend on earlier ones). Do **not** run independent phases in parallel. Shell discipline (one `bash -c` per phase, no `bash -ce`, `stream auth login` standalone) lives in the `stream` skill's [`RULES.md`](../stream/RULES.md) > Shell discipline.

**Two-call exception:** If you must Read JSON (e.g. `OrganizationRead`) and then choose IDs, use one call for the read, one batched call for all creates + `stream config set`.

### Step 0: Package manager
Always use `npm`. Never use bun.

### Step 1: Auth

**Test auth first, then act - don't skip this and don't wait until Step 2 surfaces an error.** Run `stream api OrganizationRead` as a probe:

- **Exit 0** -> already authenticated, continue to Step 1b.
- **Exit 2 / "not authenticated"** -> **immediately** run `stream auth login` as its **own** Bash invocation. This is a hard constraint:
  - Browser PKCE requires an unwrapped `stream auth login` call - **never** chain with `&&`, embed in a heredoc, or bundle with other commands.
  - Do not ask the user first; just run it. Give it up to ~3 minutes for the browser flow.
- **Login hangs past ~60s, or the user reports the browser is stuck** -> run `stream auth logout` to clear any stale session state, then retry `stream auth login` **once**. If the second attempt also hangs, stop and ask the user to run `! stream auth login` themselves (the `!` prefix runs it in-session so you see the result).

### Step 1b: Theme pick

Ask the user which Shadcn theme they'd like **before doing anything else**:

> **Quick theme pick:** I can use a random shadcn theme, or you can design your own at [ui.shadcn.com/create](https://ui.shadcn.com/create) and share the `--preset` value (e.g. `--preset b1Gdi7z7r`). Want a random one or do you have a preset?

**STOP here and wait for the user's answer.** Do not continue with org/app creation or any other steps until the user responds. Asking a question and continuing to work in parallel is confusing - the user misses the question as output scrolls past.

- **User provides a preset** -> store it for Task A scaffold command.
- **User says random / doesn't care / wants to move on** -> pick a random preset from `nova`, `vega`, `maia`, `lyra`, `mira`, `luma`.

### Step 2: Create org + app

**First, check existing orgs** with `stream api OrganizationRead`. If there are already 10 orgs, do NOT create a new one - pick an existing `builder-*` org and create a new app inside it.

**App names are globally unique.** Always use `app-<hash>` where hash = `openssl rand -hex 4`.

```bash
# Check existing orgs first:
stream api OrganizationRead

# If under 10 orgs, create new:
HASH=$(openssl rand -hex 4)
stream api OrganizationCreate name=builder-$HASH slug=builder-$HASH

# Create app with Feeds v3 + US East (region_id=1):
stream api AppCreate name=app-$HASH org_id=<org_id> is_development=true region_id=1 feeds_version=v3

# Set defaults:
stream config set org <org_id> && stream config set app <app_id>
```

**Never use the auto-created app** from OrganizationCreate - it uses Feeds v2 and US Ohio.

**Fallback (org limit / 429):** Use `OrganizationRead` to list existing builder orgs, pick one, create a new app in it.

### Step 3: Scaffold + .env + SDKs + Configure - SEQUENTIALLY

#### Scaffold order

Order:

1. **Steps 1-1b:** Auth + theme pick (wait for answer).
2. **Step 2:** Create org/app.
3. **Task A:** Scaffold with Shadcn + Next.js using the chosen preset.
4. **Task A.1:** Add base Shadcn components.
5. **Task A.2:** Disclose + ask about third-party frontend skill installs; install only with user consent.
6. Continue with Task B (.env), Task C (SDKs), Task D (CLI config).

**Task A: Scaffold** - scaffolds Next.js + Tailwind + Shadcn/ui (Base UI) into the current directory. Use the theme preset chosen in **Step 1b**.

The scaffold command creates a new directory, so we scaffold into a temporary `.scaffold` subdirectory and move everything up:

```bash
npx shadcn@latest init -t next -b base -n .scaffold --no-monorepo -p <random-preset> && mv .scaffold/* .scaffold/.* . 2>/dev/null; rm -rf .scaffold
```

**Task A.1: Add base Shadcn components:**

```bash
npx shadcn@latest add button input textarea card avatar badge separator
```

Add more components as the use case requires (e.g. `dialog`, `dropdown-menu`, `tabs`, `popover`).

**Task A.2: Frontend skills** - third-party skill packs. **You must disclose and ask before installing.** Do NOT construct your own command variant.

Print this disclosure verbatim, then stop and wait for the user's answer:

> I'd like to install three third-party skill packs that improve generic UI quality:
> - `vercel-react-best-practices` - from [`vercel-labs/agent-skills`](https://github.com/vercel-labs/agent-skills)
> - `web-design-guidelines` - from [`vercel-labs/agent-skills`](https://github.com/vercel-labs/agent-skills)
> - `frontend-design` - from [`anthropics/skills`](https://github.com/anthropics/skills)
>
> The packs are markdown only - no scripts execute. If you say yes, I'll run `npx skills add ... -y` once per pack from those GitHub repos at their current `main` branch (`-y` skips the installer's own confirmation since you've consented here). These aren't required - Stream reference files cover SDK wiring either way. Install them?

- **User agrees** -> run:
  ```bash
  npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices -y && npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines -y && npx skills add https://github.com/anthropics/skills --skill frontend-design -y
  ```
- **User declines** -> skip silently and continue to Task B. Do not retry, do not bring it up again this session.
- **Install fails** -> continue with Stream reference files only; mention the failure briefly.

Do **not** modify `layout.tsx` or `globals.css` after scaffold - use Shadcn's defaults as-is (RULES.md > Theme).

**Task B: .env** - run AFTER scaffold so the `.env` lands inside the project directory.

**First, verify `.env*` is gitignored** (the `stream` skill's [`RULES.md`](../stream/RULES.md) > Secrets). The Next.js scaffold's default already includes it; this is a safety net for projects whose `.gitignore` was hand-edited or doesn't yet exist:

```bash
bash -c 'test -f .gitignore && grep -qE "^\.env" .gitignore || echo ".env*" >> .gitignore'
```

Then write secrets:

```bash
stream env
```

`stream env` writes `STREAM_API_KEY` and `STREAM_API_SECRET` - both server-side. The client never reads env vars directly; it gets `apiKey`, `userId`, and its token from the `/api/token` response and holds them in React state. No `NEXT_PUBLIC_*` duplication, no `.env` gymnastics.

**Task C: Install Stream SDKs + verify icons** - Only what the use case needs:

```bash
# Chat:     stream-chat stream-chat-react
# Video:    @stream-io/video-react-sdk
# Feeds:    @stream-io/feeds-react-sdk
# Server:   @stream-io/node-sdk
npm install <packages> --legacy-peer-deps
```

After installing SDKs, verify an icon package is available. Some Shadcn presets bundle one, others don't:

```bash
node -e "try{require.resolve('lucide-react');console.log('ICONS_OK')}catch{try{require.resolve('@phosphor-icons/react');console.log('ICONS_OK')}catch{console.log('NO_ICONS')}}"
```

If `NO_ICONS`, install `lucide-react`: `npm install lucide-react --legacy-peer-deps`. If an icon package is already present, use that one throughout the app - do not install a second.

**Task D: Configure Stream** - run the CLI commands from the relevant `references/<Product>.md` (App Integration -> Setup) for each product the use case needs.

### Step 4: Generate code and UI

**Load [`builder-ui.md`](builder-ui.md)** and **only** the relevant [`references/<Product>.md`](references/) header + `references/<Product>-blueprints.md` for the sections you are implementing - not every reference file. **For multi-product apps (Chat + Video, Chat + Feeds, Video + Feeds, etc.), also load [`references/CROSS-PRODUCT.md`](references/CROSS-PRODUCT.md) before writing AppShell** - it has the canonical multi-client provider hierarchy and an error -> cause -> fix table.

### Step 5: Verify

**Type-check first** (reports ALL errors at once, ~3s):
```bash
npx tsc --noEmit
```
Fix all type errors. Then run the full build:
```bash
npx next build
```
Fix any remaining errors. Do NOT skip `tsc --noEmit` - it catches every type error in one pass, while `next build` stops at the first error per file and requires multiple rebuild cycles.

### Step 6: Start dev server
Pick a random 5-digit port (10000-65535). Run the server using `run_in_background`:

```bash
PORT=$((RANDOM % 55536 + 10000))
npx next dev -p $PORT
```

**Important:** The dev server is a long-running process. When run in the background it will eventually emit a "completed" notification - this does **not** mean the server stopped. The server is still running and serving requests. **Do not** respond to the background-task completion notification by telling the user the server has stopped. If you receive that notification after Step 7, ignore it silently - do not output anything.

### Step 7: Summary
Show what was created: org, app, resources, files. Include the local URL. Do NOT say "you can now start the dev server" - it's already running.

End with:

> Open `http://localhost:<PORT>`, enter a username, and start testing. Open a second tab with a different username to test multi-user interactions.

---

## Use Case Matching

**Only build with the products the user explicitly mentions.** If unclear, ask.

| User says | Use case | Products |
|---|---|---|
| "Twitch", "YouTube Live", "Kick", "livestream" | Livestreaming | Video + Chat + Feeds |
| "Zoom", "Google Meet", "video call", "meeting" | Video Conferencing | Video [+ Chat] |
| "Slack", "Discord", "team chat", "channels" | Team Messaging | Chat |
| "WhatsApp", "iMessage", "DM", "messaging" | Direct Messaging | Chat [+ Video] |
| "Instagram", "Twitter", "social feed", "Reddit" | Social Feed | Feeds + Chat |

**Moderation** is configured via CLI during setup only. **Never build moderation review UI in the app** (RULES.md > Moderation is Dashboard-only) - review happens in the [Stream Dashboard](https://beta.dashboard.getstream.io).

---

## Page Flow

Every app needs a clear navigation structure. Users should always understand where they are and what they can do. **Never drop a user into a camera/mic prompt, an empty state, or a feature-heavy screen without context.**

### Principle: Hub-first

After login, land on a **hub** - a home screen that shows what's happening and lets the user choose their path. The hub is the anchor; everything else is a destination the user navigates to intentionally.

### Flow by use case

**Livestreaming (Twitch, YouTube Live, Kick):**
```
Login -> Feed hub (live streams + posts) -> Watch a stream (viewer: video + chat, no camera)
                                        -> Go Live (explicit action -> then camera/mic setup -> streaming)
```
- The feed hub shows live streams (if any) as prominent cards, plus regular posts below
- Clicking a live card opens the **watch** view - video player + chat as a viewer. No camera permissions.
- "Go Live" is a deliberate action (button in header or dedicated screen). Only THEN prompt for camera/mic. The streamer sees a setup/preview before going live.
- Viewers and streamers are the same user type - the difference is the action they take, not the page they land on.

**Video Conferencing (Zoom, Google Meet):**
```
Login -> Lobby (list of calls or "start a call") -> Join call (camera/mic preview -> join)
```
- Land on a lobby or call list - not directly in a call.
- Joining a call shows a **preview screen** (camera/mic toggles) before connecting. The user opts in.

**Team Messaging (Slack, Discord):**
```
Login -> Channel list + active channel -> Browse/search channels
```
- Land on the channel list with the most recent channel open (or a welcome state if no channels).

**Direct Messaging (WhatsApp, iMessage):**
```
Login -> Conversation list -> Open a conversation -> Start new conversation
```

**Social Feed (Instagram, Twitter):**
```
Login -> Feed hub (follow users + composer + tabs: Timeline | My Posts) -> Comments -> User profiles
```
- The user posts to their own `user:<userId>` feed and reads from `timeline:<userId>` (aggregates followed users' posts)
- **Feed hub tabs:** Use a `Tabs` component with two views:
  - **Timeline** (default) - shows `timeline:<userId>` (posts from followed users)
  - **My Posts** - shows `user:<userId>` (the current user's own posts)
- **Refresh button:** Place a refresh/reload button next to the tabs. On click, re-call `feed.getOrCreate({ watch: true })` on the active feed to re-fetch the latest activities. This gives users an explicit way to refresh after follows or if real-time events are missed.
- A **Follow User** input (username + follow button) must be visible so users can populate their timeline
- Without following, the timeline is permanently empty - this component is not optional
- **Follow wiring:** The Follow component must receive the **timeline feed instance** and call `timelineFeed.follow('user:targetId')` - not `client.follow()`. Using the feed instance keeps `useFeedActivities()` in sync so the timeline updates immediately after following.

### Key rules

- **Camera/mic: opt-in only.** Never request permissions on page load. Only when the user takes an explicit action (Go Live, Join Call).
- **No empty ambiguity.** If there's no content yet, show a clear empty state that tells the user what to do ("No live streams yet - be the first to Go Live").
- **Navigation is visible.** The user should always be able to get back to the hub. Use the App Header or a sidebar for navigation.
- **One primary action per screen.** The hub's primary action is browsing/discovering. The watch screen's primary action is viewing. The Go Live screen's primary action is streaming. Don't mix them.

---

## Cross-Product Integration

When building apps that combine multiple products, read each relevant `references/<Product>.md` App Integration section. Key patterns:

- **Combined token route:** `/api/token` returns tokens for each product (`{ chatToken, videoToken, feedToken, apiKey }`). Upsert only the requesting user - never seed demo users.
- **Video + Feeds (Livestreaming):** Feed hub separates `type === "live"` activities as prominent live cards. "Go Live" posts a live activity via `/api/feed/live`. "End Stream" removes it.
- **Video + Chat (Livestreaming):** Chat alongside video on the watch screen. Use `livestream` channel type - one channel per stream, keyed by call ID. Create the chat channel in the `/api/token` route.
- **Moderation (all use cases):** Run Moderation CLI setup commands from `references/MODERATION.md` (App Integration -> Setup), adjusting channel type name. **Never build moderation review UI** (RULES.md > Moderation is Dashboard-only) - review happens in the [Stream Dashboard](https://beta.dashboard.getstream.io).

---

## Authentication

If not authenticated:
- **Has account** -> `stream auth login`
- **No account** -> Open `https://getstream.io/try-for-free/`, then `stream auth login` after signup

---

## Reference file paths

Blueprint files live under `agent-skills/skills/stream-builder/references/` inside the Stream skill pack. Reference them as `agent-skills/skills/stream-builder/references/FEEDS.md` from the **root of this repository**. Do not use machine-specific absolute paths.
