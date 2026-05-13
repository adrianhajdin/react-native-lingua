---
name: stream-docs
description: "Search live Stream SDK documentation for Chat, Video, Feeds, and Moderation. Look up how a Stream React/iOS/Android/Node/Flutter/Unity/Angular hook, component, or method works. Answer how-to questions about any Stream SDK across every framework and version. Triggers on 'docs', 'documentation', explicit SDK tokens (Chat React, Video iOS, Feeds Node, Moderation), and 'how do I ... in <framework>' phrasing. Answers come verbatim from getstream.io with citations - no CLI required."
license: See LICENSE in repository root
metadata:
  author: GetStream
allowed-tools: >-
  Read, Glob, Grep,
  WebFetch(domain:getstream.io),
  Bash(npx skills add GetStream/agent-skills *),
  Bash(grep *), Bash(ls *), Bash(test *),
  Bash(cat package.json), Bash(cat go.mod),
  Bash(cat requirements.txt), Bash(cat pyproject.toml)
---

# Stream - Docs search (live SDK documentation)

> **Read first (every session):** Glob `../stream/SKILL.md`. If the path is empty, install with `npx skills add GetStream/agent-skills --s stream -y` (no confirmation, just run). Then Read [`../stream/RULES.md`](../stream/RULES.md) - it includes a **Peer skills** table for installing/invoking any other pack skills on demand.

Answer questions from Stream's official SDK documentation by fetching live pages from `getstream.io`. Covers Chat, Video, Activity Feeds, and Moderation across every framework and version.

**Docs index:** `https://getstream.io/cli/llms.txt`

> **No CLI gate, no up-front shell.** This skill never invokes Write, Edit, npm, scaffold tools, or `Bash(stream *)`. Pure docs questions with an explicit SDK reach `WebFetch` without running *any* shell command. A small read-only probe runs **only on demand** - inside Step 1a below - when the SDK can't be resolved from the user's input. If the user's question requires running the CLI or building code, offer to switch - the user re-enters via the `stream` router, the `stream-cli` skill, or the `stream-builder` skill.

---

## Honesty rules (read before anything else)

These rules are non-negotiable. Read them before every response.

1. **Announce inference only when it happened.** If you picked an SDK/version from anything other than explicit user input, say so in the **first sentence** - but only on the turn the inference happened:
   - "Looking in **Chat React v13** (detected from your package.json)..."
   - "Inferring **Video** from your question about 'calls' - let me know if you meant something else..."

   On follow-ups within the same SDK, stay silent - the user knows what's loaded. Only re-announce when the SDK changes. For explicit input (e.g. `/stream Chat React v14`), no preamble is needed - go straight to the answer.

2. **Write for humans, not for the skill.** Users don't know (or care) how this skill works - they want their answer. No internal workflow terminology, status narration, or process commentary should ever appear in output. The answer itself proves the fetch worked.

   **Never say:**

   | Bad (leaks internals) | Why it's bad |
   |-----------------------|--------------|
   | "framework index", "CLI index", "the index" | Internal term - call it "the docs" or skip the label |
   | "slug", "per `llms.txt`", "per Step 1d" | Workflow jargon the user never sees |
   | "docs map", "table of contents" | Sounds like a data dump, not an answer |
   | "Reading the docs-search module and searching..." | Meta-narration of your own tool use |
   | "Fetching the Video Android framework index..." | Process commentary |
   | "the versioned URL returned 200", "index is in context now" | Fetch status - users assume success |
   | "Still in Chat React v14" on a follow-up | Redundant; users know they didn't switch |

   **When an SDK has just loaded** (explicit invocation like `/stream Video Android`), open with a warm human sentence, then get to the point. Good examples:

   - "**Video Android docs loaded.** Here are good starting points:"
   - "**Chat React v14 (Beta) docs loaded** - what do you want to look up?"
   - "Got the **Video iOS** docs. A few areas you can explore:"

   Then list actual pages/topics. Do **not** call it a "map", "index", or "TOC" - just present the content.

   **List formatting rules** (apply anywhere you emit links - SDK-loaded intros, "see also" notes, recovery messages):

   - **Every link is a markdown link with a short title:** `[Installation](https://getstream.io/chat/docs/sdk/react/basics/installation.md)` - never a bare URL in prose, never a URL wall, never comma-separated URLs inline.
   - **One link per line.** Readers scan vertically. Breaking five links onto one line hides four of them.
   - **Curate, don't dump.** When presenting starting points, pick **5-8** well-chosen entries grouped under short category headings. An exhaustive 30-URL inventory is a sitemap, not an intro. If the user wants the full index, they'll ask.
   - **Group with short bold headings, not prose prefixes.** Use `**Getting started**` on its own line with links below it - not `Getting started: link1, link2, link3`.

   Example - good:

   ```
   **Video Android docs loaded.** Here are good starting points:

   **Getting started**
   - [Installation](https://getstream.io/video/docs/android/basics/installation.md)
   - [Quickstart](https://getstream.io/video/docs/android/basics/quickstart.md)

   **Core APIs**
   - [Joining a call](https://getstream.io/video/docs/android/guides/joining-and-creating-calls.md)
   - [Call state](https://getstream.io/video/docs/android/guides/call-and-participant-state.md)

   What would you like to look up?
   ```

   Example - bad (URL wall):

   ```
   - Getting started: https://.../installation.md, https://.../quickstart.md, https://.../intro.md
   - Core APIs: https://.../call.md, https://.../state.md, https://.../participant.md
   ```

3. **Only answer from fetched content.** No training data, no assumptions, no "I think it's probably..." If you didn't fetch it in this conversation, you don't know it.

4. **Cite the source page URL** in every answer. Format: `Source: [Page Title](https://getstream.io/...)` - a complete, clickable URL.

5. **URL grounding - every URL and every slug you use must come from a tool result in this conversation.** Slugs come from `llms.txt` (fetched in Step 1b). Page URLs come from the framework index `WebFetch` in Step 2. Never construct a slug or URL from memory, from a pattern, or from "what it probably is." Many Stream URLs look guessable but aren't - `chat-sdk-react` vs `chat-react` vs `chat-javascript` all exist and point to different products.

   **No placeholders.** A citation must be a complete `https://` URL. Forbidden:
   - Ellipses: `https://getstream.io/video/docs/android/...` X
   - Patterns or templates: `https://getstream.io/chat/docs/sdk/{framework}/...` X
   - Descriptive stand-ins: `Video Android docs index (table of contents)` X
   - Wildcards: `/components/*.md` X

   If you don't have the exact page URL, your options are:
   - (a) Cite the **index URL** you actually fetched (e.g. `https://getstream.io/cli/docs/video-android.md`) - a real fetched URL is always valid
   - (b) Re-fetch the index asking for raw URLs
   - (c) Tell the user "I have the SDK overview but need to fetch the specific page for a precise link"

   A citation you made up isn't a citation - it's a fabrication dressed as one.

6. **If the docs don't cover it, say so.** Don't fill gaps with guesses. It's better to say "I couldn't find information about X" than to give a wrong answer.

7. **Don't invent cross-references.** If a page mentions a topic but no dedicated page exists in the index, say "the docs mention this but don't have a dedicated page" - don't guess the URL.

8. **Code examples from docs are authoritative.** Use them verbatim unless the user's context requires adaptation.

9. **Multi-page answers allowed**, but fetch at most 3 pages per question. If more are needed, point the user to the framework index URL instead.

---

## Invocation

This skill is reached through `/stream` (router routes here based on signals) or directly via `/stream-docs`. The same input shapes work either way:

```
/stream <Product> <Framework> [Version]    Load a specific SDK
/stream <question about the SDK>           Answer from the docs
/stream-docs <Product> <Framework>          Direct invocation (skips router)
```

Examples that route here:

```
/stream Chat React v14
/stream Video iOS
/stream Moderation
/stream how do I add reactions to messages?
/stream-docs Feeds Node
```

### Shortcut: SDK named with no question

If the user invokes `/stream Chat React v14` (or any product/framework/version) with no follow-up question, fetch `https://getstream.io/cli/llms.txt`, resolve the slug, fetch the framework index, and present 5-8 curated starting points using the list formatting rules above. Wait for the user to pick a topic.

### Shortcut: bare `/stream` with no args

That's handled by the `stream` router (it lists the sub-skills). Don't intercept it here.

---

## Step 1: Identify the SDK

### Precedence

1. **Explicit user input always wins.** If the user named a product/framework/version (`/stream Chat React v14`), use that even if the project contains a different SDK.
2. **Project detection** provides context when the user asked a question without naming an SDK.
3. **Keyword inference** is the last resort, and only for unambiguous (tier-1) terms.

### Resolution order for "question without named SDK"

Stop at the first step that gives a confident answer:

1. **Run project detection** (Step 1a below)
2. **Check for tier-1 keyword match** (Step 1c, unambiguous terms)
3. **Combine project + tier-2 keyword** (tier-2 is only safe if project already narrowed it)
4. **Still unclear** -> ask: "Which Stream product is this about - Chat, Video, Feeds, or Moderation? And which SDK/framework?"

### Step 1a - Project detection

**Check project signals first.** The `stream-cli` skill's [`preflight.md`](../stream-cli/preflight.md) > Project signals runs once per session for the CLI and builder skills, populating `PKG` (Stream npm packages with versions) and `NATIVE` (non-npm project files). If those signals are already in conversation context, use them directly - no extra probe.

Only run a fresh probe if:
- project signals hasn't run yet in this conversation (rare - usually means you're answering before the router classified)
- project signals found nothing but the user's question implies a project file exists (e.g., the user said "in my Flutter project" but `NATIVE` was empty when probed)
- A scaffold or install completed mid-conversation and may have added packages

#### Fallback probes (when project signals are missing)

npm:

```bash
grep -oE '"(stream-chat-react|stream-chat-react-native|stream-chat-expo|stream-chat-angular|stream-chat|@stream-io/video-react-sdk|@stream-io/video-react-native-sdk|@stream-io/video-client|@stream-io/node-sdk|@stream-io/stream-node|@stream-io/feeds-react-sdk)": *"[^"]*"' package.json 2>/dev/null
```

Non-npm:

```bash
ls pubspec.yaml go.mod requirements.txt pyproject.toml Podfile build.gradle 2>/dev/null
```

Either way, extract the **major version** from semver (e.g. `"stream-chat-react": "^13.2.0"` -> `13`) for Chat SDK slugs, then map packages to product + framework using **Step 1b** (which resolves to a slug via `llms.txt`).

#### Multiple SDKs detected

- **If a tier-1 keyword clearly matches one** -> use that one, announce the match
- **If ambiguous** -> ask: "I found **Chat React v13** and **Video React** in your project. Which is this question about?"

### Step 1b - Resolve to a slug via `llms.txt`

**You MUST fetch `https://getstream.io/cli/llms.txt` before constructing any `cli/docs/*.md` URL for the first time in a conversation.** `llms.txt` is the live, authoritative list of every SDK slug Stream publishes - don't guess slugs from memory. `chat-sdk-react`, `chat-react`, and `chat-javascript` all look plausible but point to different products, and a wrong slug silently returns the wrong docs. `llms.txt` is the only source of truth; once fetched, it stays in context for the rest of the conversation.

**Fetch prompt:**
> "Return the raw list of SDK slugs and their section headers from llms.txt, verbatim. Do not summarize."

Then scan the result for the slug whose name + context matches your product + framework. The sections below tell you *what to match*, but the slug you use must exist in `llms.txt`.

#### Slug-name patterns (scanning hints)

Slugs follow predictable patterns - use these to guide your scan, then verify the match exists in `llms.txt`:

- **Chat UI SDKs:** `chat-sdk-{framework}` (e.g. `chat-sdk-react`, `chat-sdk-ios`). Versioned - see **Step 1d**.
- **Chat low-level / server-side:** `chat-{framework}` (e.g. `chat-javascript`, `chat-node`, `chat-python`). No version suffix.
- **Video:** `video-{framework}` (e.g. `video-react`, `video-ios`, `video-api`). No version suffix.
- **Feeds (v3):** `activity-feeds-{framework}` (e.g. `activity-feeds-react`, `activity-feeds-node`). **Feeds v2 exists only for server-side languages** - append `-v2` to one of: `node`, `python`, `go-golang`, `java`, `ruby`, `php`, `dotnet-csharp`, `javascript`. There are no v2 slugs for React, React Native, iOS, Android, or Flutter.
- **Moderation:** `moderation-{framework}` (e.g. `moderation-node`, `moderation-python`). No version suffix.

If your constructed slug isn't in `llms.txt`, don't use it. If you can't find a match at all, tell the user the combination isn't in the docs and list what is available.

#### Framework-name normalization

Normalize user input to the tokens slugs use:

| User says | Use |
|-----------|-----|
| React | `react` |
| React Native | `react-native` |
| iOS, Swift | `ios` (Chat low-level: `ios-swift`) |
| Android, Kotlin | `android` |
| Flutter, Dart | `flutter` (Chat low-level: `flutter-dart`) |
| Angular | `angular` |
| Node, NodeJS, Node.js | `node` |
| Python | `python` |
| Go, Golang | `go-golang` |
| .NET, C#, CSharp | `dotnet-csharp` |
| PHP | `php` |
| Ruby | `ruby` |
| Java | `java` |
| JavaScript, JS | `javascript` |
| Unity | `unity` |
| Unreal | `unreal` |
| ESP32 | `esp32` |

#### npm packages -> product + framework

When Step 1a detected a package, map it to a product + framework, then find the matching slug in `llms.txt`:

| Package | Product + framework |
|---------|---------------------|
| `stream-chat-react` | Chat + React (UI) |
| `stream-chat-react-native` or `stream-chat-expo` | Chat + React Native (UI) |
| `stream-chat-angular` | Chat + Angular (UI) |
| `stream-chat` alone | Chat JS (client) or Chat Node (server) - see special case |
| `@stream-io/video-react-sdk` | Video + React |
| `@stream-io/video-react-native-sdk` | Video + React Native |
| `@stream-io/video-client` | Video + JavaScript |
| `@stream-io/node-sdk` | Video or Feeds - see special case |
| `@stream-io/stream-node` | Moderation + Node |
| `@stream-io/feeds-react-sdk` | Feeds + React |

For Chat UI packages, extract the major version from semver (e.g. `"stream-chat-react": "^13.2.0"` -> `13`) - you'll need it for Step 1d.

##### Special case: `stream-chat` alone

`stream-chat` is used both client-side (JS apps) and server-side (Node apps). If a UI wrapper is also present (`stream-chat-react`, `stream-chat-angular`, etc.), prefer the wrapper's product - `stream-chat` is just a peer dependency there.

If only `stream-chat` is detected:
- Server-side file importing it (e.g. `StreamChat.getInstance` in `api/` or `server/`) -> Chat + Node
- Otherwise -> default to Chat + JavaScript (client) and offer to switch: "Using **Chat JavaScript** docs (client-side). If you're asking about server-side Node usage, say so and I'll switch."

##### Special case: `@stream-io/node-sdk`

Serves both Video and Feeds v3. Probe usage:

```bash
grep -rE "from ['\"]@stream-io/node-sdk['\"]" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" . 2>/dev/null | head -20
grep -rE "\.(video|feeds)\." --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" . 2>/dev/null | grep -iE "streamclient|client\." | head -20
```

- `.video.` dominates -> Video + server
- `.feeds.` dominates -> Feeds + Node
- Both or neither -> ask

#### Non-npm project files -> product + framework

| File | Contains | Product + framework |
|------|----------|---------------------|
| `pubspec.yaml` | `stream_chat_flutter` | Chat + Flutter (UI) |
| `pubspec.yaml` | only `stream_chat` (no UI) | Chat + Flutter (low-level) |
| `Podfile` / `*.xcodeproj` | `StreamChat` | Chat + iOS (UI) |
| `Podfile` / `*.xcodeproj` | `StreamVideo` | Video + iOS |
| `build.gradle` | `io.getstream:stream-chat-android` | Chat + Android (UI) |
| `build.gradle` | `io.getstream:stream-video-android` | Video + Android |
| `requirements.txt` / `pyproject.toml` | `getstream` | Chat or Video + Python (ask if ambiguous) |
| `go.mod` | `github.com/GetStream/getstream-go` | Chat or Video + Go (ask if ambiguous) |

### Step 1c - Inference tiers

Only applies when the user asked a question without naming an SDK.

#### Tier 1: Unambiguous (proceed and announce)

Each keyword maps to exactly one product:

| Keywords | Product |
|----------|---------|
| "call state", "join a call", "make a call", "start a call", "ringing", "screen share", "screensharing" | Video |
| "HLS", "RTMP", "livestream viewer", "egress" | Video |
| "channel", "channel members", "message thread", "read receipts", "typing indicator", "unread count" | Chat |
| "activity", "follow feed", "aggregated feed", "timeline feed", "notification feed" | Feeds |
| "review queue", "flagged content", "block list", "moderation policy", "ban list" | Moderation |

#### Tier 2: Ambiguous (needs project context OR ask)

These appear across multiple products - **never infer from them alone**:

| Term | Possible products |
|------|-------------------|
| "notifications" | Chat push, Feeds notification feeds, Video ringing |
| "streaming" | Video streaming, Feeds activity stream |
| "messages" | Chat messages, Feeds comments |
| "users" | Any product |
| "reactions" | Chat message reactions, Feeds activity reactions |
| "moderation" without specifics | Dedicated Moderation product OR in-SDK moderation for Chat/Feeds |

When the only signal is a tier-2 keyword:
- Project detection resolved it -> use that, announce
- No project context -> ask

### Step 1d - Version handling (Chat SDKs only)

Video, Feeds, and Moderation slugs don't have version suffixes. Skip this step for those - if the user said something like `/stream Video Android Latest`, silently ignore the "Latest" token and use `video-android`. Don't ask about it and don't mention that "Latest" was meaningless - just proceed.

For Chat SDK slugs (`chat-sdk-*`):

1. **If the user specified a version** (e.g. `v14`) -> try the versioned URL first: `chat-sdk-react-v14.md`. If it returns 200, you're done. If it 404s, fall back to the base URL (`chat-sdk-react.md`) - this means the version the user named IS the current latest.

2. **If the user didn't specify a version, or said "latest"** -> use the base URL directly. It always returns the latest version. The `# Heading` line will announce which version that is (e.g. `# React v13 (Latest)`) - use this when citing.

3. **If the user asked for the latest by version number** (e.g. user said "v13" and v13 is current latest) -> the versioned URL will 404 (current latest is at base URL only). Fall back to base.

This approach costs 1 fetch in the common case, 2 only when falling back.

---

## Step 2: Fetch the framework index

Construct the URL from Step 1 and fetch it:

```
https://getstream.io/cli/docs/{slug}.md
```

**Fetch prompt matters.** `WebFetch` summarizes content by default, which drops the exact URLs you need for Step 3. On the first fetch, explicitly ask for the verbatim list - e.g.:

> "Return the top-level heading, and every page in the index as `Title - URL` with the exact URL as listed. Do not summarize."

**Verify after fetching.** Scan the tool result for actual `https://` URLs. If the response is a prose summary without URLs - even after you asked for them - the prompt failed. Re-fetch **once** with a stricter prompt (e.g. "Return the raw markdown content with zero summarization. I need the exact URLs."). If the second fetch still has no raw URLs, tell the user the index came back without URLs and stop - **do not proceed with constructed URLs**. This is rule #5 (URL grounding) in action: no URL goes into an answer unless you saw it verbatim in a tool result.

Getting the URLs on the first fetch lets follow-ups in the same SDK pick pages without re-fetching. If you need page URLs later for a specific topic and don't have them, re-fetch with a targeted prompt (e.g. "return exact URLs for any pages about MessageComposer, verbatim, no summary").

If the index 404s, see **Recovery** below.

---

## Step 3: Find and fetch the page

Scan the framework index for the title that best matches the user's question.

### Matching strategy

- Prefer exact keyword matches ("reactions" -> title containing "reaction")
- Fall back to broader topic ("custom reactions" -> "Message Interactions")
- Prefer pages that sound like the user's question type:
  - "How do I X?" -> Guides, How-Tos, Getting Started
  - "What is X?" -> Overview, Introduction, Concepts
  - "API for X?" -> Reference, API pages
- If multiple candidates, fetch the most specific one first
- **Fetch at most 3 pages per question**

Fetch the chosen page and answer from its content.

---

## Step 4: Answer

Apply the honesty rules (top of file). Every answer must:

1. Start with an inference announcement *only* if rule #1 required one (inference this turn, or SDK just switched) - otherwise go straight to the answer
2. Quote or paraphrase directly from fetched content
3. End with a source citation: `Source: [Page Title](https://getstream.io/...)`

### When the docs cover it partially

Quote what's there, then explicitly note what's missing:

> The docs describe how to add a reaction, but don't cover custom reaction UI rendering on this page. See also [Message Interactions](...).

### When the docs don't cover it at all

```
I couldn't find information about {topic} in the {SDK name} docs.

You can browse the full index at https://getstream.io/cli/docs/{slug}.md or try:
- A different framework (same question, different SDK)
- The broader product docs at https://getstream.io/{product}/
```

**Never fabricate an answer.**

---

## Cross-references to other skills

Full guidance lives in the `stream` skill's [`RULES.md`](../stream/RULES.md) > Cross-track follow-ups. This skill's specific guarantee: **never execute a cross-skill action from inside docs search** - only offer. The user re-routes by asking, which re-enters the router (or jumps to the named sub-skill). This keeps the no-side-effects promise intact even when a docs answer naturally enables a CLI run, scaffold, or integration.

---

## Recovery from failures

### 404 on framework index
The slug was wrong - but you already have `llms.txt` in context from Step 1b. Re-scan it:
1. Check spelling, version suffix, product prefix against `llms.txt` (verbatim)
2. Retry once with a corrected slug from `llms.txt`
3. If still 404 or no matching slug exists in `llms.txt`, tell the user the SDK isn't in the docs and list what's available

### 404 on Chat SDK versioned URL
The version the user named is the current latest - fall back to the base URL (`chat-sdk-react.md` instead of `chat-sdk-react-v13.md`). This is expected behavior, not a real failure.

### Fetched page doesn't answer the question
- Check the framework index for related pages (same section, similar title)
- Fetch one more page (within the 3-page limit)
- Still no answer -> tell the user which pages you checked and offer to try a different SDK

### Empty or malformed framework index
Fall back to `llms.txt`. This shouldn't happen under normal conditions - if it does, tell the user.

### User asks a follow-up that doesn't match any index page
Don't invent cross-references. Say: "That specific topic isn't in the {SDK} index. Want me to check a related SDK or the global index?"

---

## Conversation economy

- **`llms.txt` is fetched once per conversation** (in Step 1b). Don't re-fetch - it stays in context for every slug lookup after.
- **Within a conversation**, the framework index stays in context. Don't re-fetch for follow-ups on the same SDK.
- **Per question**, fetch at most 3 pages (doc pages, not counting `llms.txt` or the framework index).
- **Switching SDKs** - follow-up on a different SDK -> restart Step 1 cleanly (but `llms.txt` is still loaded, just pick a different slug).

---

## Worked example

**User:** `/stream how do I add reactions?` (in a React project with `stream-chat-react@^13.2.0`)

**Step 0 (in the `stream` router):** intent classifier - "how do I" + no operational verb + project context likely -> docs search, no CLI gate.

**Step 1 - Identify the SDK:**
- No explicit SDK -> Case B.
- Step 1a (project detection): finds `stream-chat-react@13`.
- Step 1b: fetch `llms.txt`, map `stream-chat-react` -> Chat + React (UI), find slug `chat-sdk-react` in `llms.txt`, major version 13.
- Step 1c (tiers): "reactions" is tier-2, but project already resolved to Chat - proceed.
- Step 1d (version): user didn't specify -> use base URL.
- Announce: "Looking in **Chat React** (detected from your package.json)..."

**Step 2 - Fetch the framework index:**
- `https://getstream.io/cli/docs/chat-sdk-react.md` -> 200.
- Heading confirms: `# React v13 (Latest)`.

**Step 3 - Find and fetch the page:**
- Scan index for "reaction" -> find "Message Interactions" and "Custom Reactions".
- User asked a basic how-to -> pick "Message Interactions" first (basic), not "Custom Reactions" (advanced).
- Fetch `https://getstream.io/chat/docs/sdk/react/.../message-interactions.md`.

**Step 4 - Answer:**
- Quote the add-reaction example from the page.
- Cite: `Source: [Message Interactions](https://getstream.io/chat/docs/sdk/react/.../message-interactions/)`

**Counterfactual - no project detected:**

Step 1c tier check on "reactions" -> tier-2 alone, no project context -> ask: "Is this about Chat message reactions or Feeds activity reactions?"
