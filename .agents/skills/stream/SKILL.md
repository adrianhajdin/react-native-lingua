---
name: stream
description: "Stream router for Chat, Video, Feeds, and Moderation. Use when the user wants to build a new app with Stream, scaffold a project, add Chat/Video/Feeds/Moderation to an existing app, integrate Stream, build for Swift/SwiftUI/UIKit/iOS/Xcode, query Stream data, list channels, list calls, show flagged messages, find users, run stream api / stream config / stream auth commands, install the Stream CLI, set up Stream, search Stream SDK documentation, look up Stream React/iOS/Android/Node/Flutter/Unity SDK methods, ask how-to questions about Stream hooks/components/methods, configure moderation blocklists or automod, set up webhooks, or anything tagged Chat React, Video iOS, Feeds Node, Moderation, etc. Routes to the right sub-skill based on the task."
license: See LICENSE in repository root
metadata:
  author: GetStream
allowed-tools: >-
  Read, Glob, Grep,
  Bash(npx skills add GetStream/agent-skills *)
---

# Stream - skill router

This skill picks the track from the user's input and delegates to a specialized sub-skill. **It does no scaffolding, CLI, or docs work itself** - those live in dedicated skills.

> **Read first:** [`RULES.md`](RULES.md). Non-negotiable rules apply, including the **Peer skills** procedure (Glob path + install command + install policy + Skill-vs-Read-inline rule).
>
> **Peer manifest:** [`peers.yaml`](peers.yaml) (schema: [`peers.schema.json`](peers.schema.json)) is the single source of truth for peer skill names, Glob paths, install commands, install policies (`silent` vs `ask`), routing signals, and decline fallbacks. Read it before installing or routing to a peer.
>
> **After picking a sub-skill:** follow the procedure in RULES.md > Peer skills - Glob the entry's `SKILL.md` path, install per its `install_policy` if missing (silently, or after explicit confirm for `ask` peers), then Skill tool (if listed) or Read inline. Do not call `Skill` before the Glob; it surfaces a confusing "Unknown skill" error. Do not stop after naming the track.

---

## By task

**Build a new app with Stream** -> use the `stream-builder` skill
- Empty/new directory + "build me a Chat/Video/Feeds app", "scaffold", "create a new ..."
- Covers Steps 0-7 (scaffold, theme, auth, env, SDK install, component generation)

**Add Stream to an existing app** -> use the `stream-builder` skill
- Existing project + "add Chat to this app", "integrate Video", "drop Feeds into ..."
- Same SDK wiring as scaffold; skips Next.js init and theme pick

**Build or integrate Stream in a platform-specific app** -> peer pack from [`peers.yaml`](peers.yaml)
- Match user input or cwd against each peer's `signals` (e.g. `swift` / `swiftui` / `.xcodeproj` -> `stream-swift`)
- Platform packs declare `install_policy: ask` - confirm install with the user once before adding
- On decline, route to the peer's `fallback_on_decline` (typically `stream-docs` for read-only lookups)

**Query Stream data via the CLI** -> use the `stream-cli` skill
- "list calls", "show channels", "any flagged", "find users"
- Literal CLI: `stream api ...`, `stream config ...`, `stream auth ...`
- Tricky bodies and filter syntax live in the sub-skill's cookbook
- **Required for every `stream api` call** - including ad-hoc "let me check" queries from inside other sub-skills. No guessing endpoint names from training data; route through `stream-cli` (or read `~/.stream/cache/API.md`) first. See [`RULES.md`](RULES.md) > CLI safety.

**Install the Stream CLI** -> use the `stream-cli` skill
- "install the CLI", "set up stream" with no project context
- Bootstrap (binary install, SHA-256 verification, TTY confirmation) ships with the CLI sub-skill

**Search Stream SDK documentation** -> use the `stream-docs` skill
- "docs", "documentation", explicit SDK token (`Chat React`, `Video iOS`, `Feeds Node`, `Moderation`)
- "how do I ... in <framework>", "how does <hook/component/method> work?", "what does <SDK thing> do?"
- No CLI needed - answers come from getstream.io with citations

---

## Pick a track

Scan the user's input for the signals below in order. The classifier is deterministic - no probes, no fetches, no CLI checks at this stage.

| Signal in user input | Sub-skill |
|---|---|
| Explicit SDK/framework token: `Chat React`, `Video iOS`, `Feeds Node`, `Moderation`, etc. (with or without version) | `stream-docs` |
| Words "docs" or "documentation" | `stream-docs` |
| "How do I {X} in {framework}?", "How does {hook/component/method} work?", "What does {SDK thing} do?" | `stream-docs` |
| Operational verbs + Stream noun: "list calls", "show channels", "any flagged", "find users", "check {anything}" | `stream-cli` |
| `stream api`, `stream config`, `stream auth` (literal CLI invocation) | `stream-cli` |
| "Install the CLI", "set up stream" with no project context | `stream-cli` |
| "Build me a ... app", "scaffold", "create a new ..." + Stream product, in an empty/new directory | `stream-builder` (web/Next.js) |
| "Add Chat/Video/Feeds to this app", "integrate Stream into" - existing project | `stream-builder` (web/Next.js) |
| Build/integration intent + a token matching a peer's `signals` in [`peers.yaml`](peers.yaml) (e.g. `swift`, `swiftui`, `.xcodeproj` -> `stream-swift`) | matching peer (confirm install if `install_policy: ask`) |
| Operational verb wrapped in how-to phrasing (e.g. "how do I list my calls?" - docs *or* CLI) | **Ask one disambiguator** |

**Track D carve-out.** `stream-docs` answers from documentation only - no preflight, no shell commands, no project inspection. Every other sub-skill runs preflight before doing real work.

**Docs vs platform packs.** A pure how-to or method-lookup question about an iOS/Android/etc. SDK symbol stays in `stream-docs` - don't pull in a platform pack for a documentation answer. Platform packs (e.g. `stream-swift`) are for *building or integrating* - scaffolding projects, wiring packages, generating views.

**Disambiguator.** If the input fits more than one row (typically operational verb + how-to phrasing), ask one short question and wait. Don't probe before the answer:

> Want me to look up the SDK method (docs) or run it now via CLI?

After the answer, route as if the user had given that signal directly.

**Bare `/stream` with no args.** List the sub-skills under "Quick navigation" briefly and wait for input. No shell execution.

---

## Quick navigation

If the user already knows what they want, skip the router and invoke a sub-skill directly:

- `/stream-builder` - scaffold a new web (Next.js) app, or add Chat/Video/Feeds/Moderation to an existing one
- `/stream-swift` - scaffold or integrate Stream into a Swift/SwiftUI/UIKit/iOS app (install confirmed first)
- `/stream-cli` - query Stream data via CLI, install the CLI, run `stream api / config / auth`
- `/stream-docs` - search live Stream SDK documentation (no CLI needed)

Platform-specific packs are declared in [`peers.yaml`](peers.yaml) - new platforms become available by adding an entry there.

Or describe the task and the router will pick.

---

## Hand-off

See preamble: install if missing, invoke via `Skill` tool, don't stop. Cross-cutting rules in [`RULES.md`](RULES.md) apply to every sub-skill, including **Cross-track follow-ups** (offer, don't auto-execute, the natural next action across track boundaries).

---

## Support

If the user asks for support or how to contact someone, direct them to [getstream.io/contact](https://getstream.io/contact/).
