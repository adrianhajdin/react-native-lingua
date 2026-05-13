---
name: stream-react-native
description: "Create, build, and integrate Stream Chat React Native apps in React Native Community CLI and Expo. Use for new RN/Expo Chat apps from scratch, existing app integration, Stream Chat RN, stream-chat-react-native, stream-chat-expo, migration/setup, channel list, message list, MessageComposer, attachment picker, image/file attachments, media picker, camera upload, audio messages, threads, thread list, React Navigation, Expo Router, theming, offline support, push notifications, and Chat customization. Chat only in v1; not for Stream Video, Feeds, or Moderation UI."
license: See LICENSE in repository root
compatibility: Supports new or existing React Native CLI and Expo apps that can run Stream Chat RN with React Native New Architecture. The `stream` CLI is the default credentials and requested demo-data path; pasted API key and token are accepted as fallback.
metadata:
  author: GetStream
allowed-tools: >-
  Read, Write, Edit, Glob, Grep,
  WebFetch(domain:getstream.io),
  Bash(ls *), Bash(find . *), Bash(grep *),
  Bash(cat package.json), Bash(cat app.json), Bash(cat app.config.js), Bash(cat app.config.ts),
  Bash(cat babel.config.js), Bash(cat metro.config.js),
  Bash(command -v stream), Bash(stream token *), Bash(stream config *),
  Bash(stream --safe api *), Bash(stream api *),
  Bash(npm view *), Bash(npm install *), Bash(yarn add *), Bash(pnpm add *),
  Bash(curl -Ls https://getstream.io/chat/docs/sdk/react-native/llms.txt),
  Bash(curl -Ls https://getstream.io/chat/docs/react-native/llms.txt),
  Bash(npx create-expo-app@latest *), Bash(npx create-expo-app *),
  Bash(npx @react-native-community/cli@latest init *),
  Bash(npx expo install *), Bash(npx expo prebuild *), Bash(npx expo start *),
  Bash(npm run *), Bash(yarn *), Bash(pnpm *),
  Bash(npx pod-install *), Bash(cd ios && pod install)
---

# Stream React Native - skill router + execution flow

**Rules:** Read **[`RULES.md`](RULES.md)** once per session. Every non-negotiable React Native Chat rule is stated there.

This file is the single entrypoint: intent classification, project detection, and module pointers for Stream Chat React Native work.

---

## Step 0: Intent classifier (mandatory first - never skip)

Before any tool call, decide the track from the user's input alone. Do not probe the filesystem first.

### Signals -> track

| Signal in user input | Track |
|---|---|
| "Build/create/scaffold a new React Native app", "create an Expo app", "new Stream Chat RN app", empty directory + React Native/Expo Chat | **A - New app** |
| "Add/integrate Stream Chat into this app", "wire Chat RN", "set up stream-chat-expo", "change/customize this Chat UI" | **B - Existing app** |
| `React Native`, `Expo`, `Expo Router`, `stream-chat-react-native`, `stream-chat-expo`, `Stream Chat RN`, `Chat React Native`, migration | **C - Reference lookup** if the user only asks how/docs; otherwise **B - Existing app** |
| Words "docs" or "documentation" around Stream Chat React Native / Expo work | **C - Reference lookup** |
| "How do I {X} in React Native/Expo?", "What does {SDK component/hook/prop} do?" | **C - Reference lookup** |
| "Install Stream packages", "set up Chat RN", "wire auth/token flow" with no broader feature request | **D - Bootstrap / setup** |
| Video, Feeds, Moderation review UI, or non-Chat Stream RN product | **Reject bundled scope** and route to live docs only if the user wants docs |
| Bare `/stream-react-native` with no args | List the tracks briefly and wait |

### Disambiguation flow

If the request is ambiguous between wiring code and reference lookup, ask one short question and wait:

> Do you want me to wire this into the project, or just map the React Native SDK pattern and files?

If the user wants a new app but did not name Expo or RN CLI, default to Expo because it is the shortest successful path. Use RN CLI when the user asks for it or when native project constraints require it.

### Scope rejection

This v1 skill bundles **Chat React Native only**. If the user asks for Stream Video, Feeds, or Moderation UI in React Native, say:

> The React Native skill currently bundles Chat references only. I can help with Chat RN here, or switch to live docs for Video/Feeds.

Do not invent missing React Native Video or Feeds API details from memory.

### After classification

- **Tracks A, B, D** -> run Project signals, then continue in [`builder.md`](builder.md) and [`sdk.md`](sdk.md). Run [`credentials.md`](credentials.md) before writing Chat connection code or creating requested demo data.
- **Track C** -> skip credentials and project probes if the product + runtime are explicit. Only run a read-only probe if RN CLI vs Expo is ambiguous and the answer affects the guidance.

---

## Step 0.5: Credentials, token, and demo data (tracks A, B, D only)

Use [`credentials.md`](credentials.md) once per session before writing code that connects to Stream Chat.

It resolves:

- Stream API key
- user id and display name
- user token or token provider plan
- optional demo data, only when requested, via Stream CLI calls such as `UpdateUsers`, `GetOrCreateChannel`, and `SendMessage`

For Track A, it is acceptable to scaffold the app first if the runtime or target directory must be resolved before credentials. Do not render a connected Chat UI until credentials or a token-provider plan are resolved.

---

## Project signals (tracks A/B/D - once per session; Track C on demand only)

Read-only local probe. Use it to detect empty/new workspace, RN CLI vs Expo, New Architecture hints, navigation setup, and existing Stream packages.

```bash
bash -c 'echo "=== PACKAGE ==="; test -f package.json && grep -oE "\"(stream-chat-react-native|stream-chat-expo|react-native|expo|@react-navigation/[^\"]+|expo-router|react-native-reanimated|react-native-worklets|react-native-teleport|@op-engineering/op-sqlite)\": *\"[^\"]*\"" package.json 2>/dev/null; echo "=== EXPO ==="; find . -maxdepth 2 \( -name "app.json" -o -name "app.config.js" -o -name "app.config.ts" -o -path "./app/_layout.*" \) -print 2>/dev/null; echo "=== NATIVE ==="; find . -maxdepth 2 \( -name "ios" -o -name "android" \) -type d -print 2>/dev/null; echo "=== CONFIG ==="; find . -maxdepth 2 \( -name "babel.config.js" -o -name "metro.config.js" \) -print 2>/dev/null; echo "=== EMPTY ==="; test -z "$(ls -A 2>/dev/null)" && echo "EMPTY_CWD" || echo "NON_EMPTY"'
```

Hold the result in conversation context. Do not re-run unless the user changes directory, packages are installed, or the project shape changes.

Use the result to produce a one-line status, for example:

- `Empty workspace detected - defaulting to Expo new app unless the user asked for RN CLI`
- `Expo app detected - stream-chat-expo absent - Expo Router present - ready for Chat setup`
- `RN CLI app detected - ios/android present - stream-chat-react-native installed - checking provider placement`
- `No RN/Expo app detected in a non-empty directory - create a new app in a child directory or ask before reusing this directory`

If there is no RN/Expo project and Track A applies, scaffold one through [`builder.md`](builder.md) > **2. New app scaffold**. If Track B/D applies in a non-RN directory, ask before creating a child app because that changes project ownership.

---

## Module map

| Track | Module(s) |
|---|---|
| A - New app | [`builder.md`](builder.md) + [`sdk.md`](sdk.md) + `llms.txt` docs lookup + Chat references |
| B - Existing app | [`builder.md`](builder.md) + [`sdk.md`](sdk.md) + `llms.txt` docs lookup + Chat references |
| C - Reference lookup | [`sdk.md`](sdk.md) + [`references/DOCS.md`](references/DOCS.md) + relevant Chat reference files |
| D - Bootstrap / setup | [`builder.md`](builder.md) + [`sdk.md`](sdk.md) + `llms.txt` docs lookup |

---

## Reference layout

Shared React Native and Expo patterns live in **[`sdk.md`](sdk.md)**.

Chat-specific setup, docs lookup, gotchas, and UI blueprints live under **`references/`**:

- **`llms.txt` docs lookup:** [`references/DOCS.md`](references/DOCS.md)
- **Chat setup/reference:** [`references/CHAT-REACT-NATIVE.md`](references/CHAT-REACT-NATIVE.md)
- **Chat screen/component blueprints:** [`references/CHAT-REACT-NATIVE-blueprints.md`](references/CHAT-REACT-NATIVE-blueprints.md)

Future React Native product coverage should stay in this naming family instead of creating more top-level skills:

- `VIDEO-REACT-NATIVE.md`
- `FEEDS-REACT-NATIVE.md`

If the requested product file is not bundled yet, say so plainly and only switch to live docs if the user asks.

---

## Track A - New app

**Full detail:** [`builder.md`](builder.md) - use the new-app path.

| Phase | Name | What you do |
|---|---|---|
| **A1** | Detect | Run Project signals. Empty workspace is valid for Track A. |
| **A2** | Choose lane | Default to Expo if unspecified; use RN CLI when requested. |
| **A3** | Scaffold | Create the app with current framework tooling; do not explain full RN/Expo environment setup. |
| **A4** | Install + wire | Use the primary `llms.txt` manifest to read Installation docs, verify npm dist-tags, install the selected package and peers, then wire providers and first Chat UI. |
| **A5** | Verify | Confirm install, Babel plugin, root providers, auth, and first rendered Chat screen. |

---

## Track B - Existing app

**Full detail:** [`builder.md`](builder.md) - use the existing-project path.

| Phase | Name | What you do |
|---|---|---|
| **B1** | Detect | Run Project signals and inspect existing app structure before editing. |
| **B2** | Preserve | Keep Expo/RN CLI lane, package manager, navigation stack, and auth architecture unless asked to migrate. |
| **B3** | Integrate | Use `llms.txt` lookup for the requested area, then load only the Chat reference/blueprint sections needed. |
| **B4** | Verify | Confirm the requested Stream Chat flow builds and renders in the existing app. |

---

## Track C - Reference lookup

Load only the relevant files:

- `llms.txt` manifest lookup rules -> [`references/DOCS.md`](references/DOCS.md)
- Shared lifecycle / auth / provider / runtime patterns -> [`sdk.md`](sdk.md)
- Chat RN setup and gotchas -> [`references/CHAT-REACT-NATIVE.md`](references/CHAT-REACT-NATIVE.md)
- Chat RN screen/component structure -> [`references/CHAT-REACT-NATIVE-blueprints.md`](references/CHAT-REACT-NATIVE-blueprints.md)

If the user asks for exact API details not bundled here, use [`references/DOCS.md`](references/DOCS.md) to fetch the right manifest and selected markdown page. If implementation still needs source-level confirmation, inspect the installed package under the target app's `node_modules` after dependencies are installed. Do not use machine-specific documentation paths.

---

## Track D - Bootstrap / setup

Use when the user wants package install and shared wiring more than a full feature build:

- detect RN CLI vs Expo
- use `llms.txt` lookup for Installation docs and verify current npm dist-tags
- install the correct Chat package and required peers
- add Reanimated/Worklets Babel plugin as the last plugin
- wrap the entry point with `GestureHandlerRootView`
- place `OverlayProvider` and `Chat` correctly
- wire `useCreateChatClient` or the app's backend token provider
- stop before product-specific UI if the user only asked for setup
