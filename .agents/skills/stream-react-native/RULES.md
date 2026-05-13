# Stream React Native - non-negotiable rules

Every rule below is stated once. Other files reference this file - do not duplicate these rules inline.

---

## Target SDK version and scope

Target **Stream Chat React Native**.

- Follow the official docs for the current React Native New Architecture support matrix. When migration docs are stricter than the general New Architecture guide, use the stricter requirement.
- The bundled references assume the React Native **New Architecture**. Do not claim old-architecture support unless the docs for the selected package version explicitly say it is supported.
- This skill is Chat-only in v1. Do not implement or document React Native Video, Feeds, or Moderation UI from memory.

Use Stream `llms.txt` manifests as the docs authority. Start from [`references/DOCS.md`](references/DOCS.md), fetch the appropriate manifest, then fetch the selected markdown page before coding. Do not maintain or rely on hardcoded individual docs URLs. If a symbol must be verified in source, inspect the installed package in the target app's `node_modules` after install.

---

## Secrets and auth

Never put a Stream API secret in React Native code, Expo config, app config, native manifests, or chat. The client may receive the **API key** and a **user token**. The **API secret** stays server-side or inside the Stream CLI.

Default token model:

- Existing backend: use a backend-issued Stream token or token provider.
- Local dev/demo: use a CLI-generated token from [`credentials.md`](credentials.md).
- User-managed: accept a pasted API key/token if the user chooses that path.

Never use `devToken()` for production. Never invent credentials.

Prefer not to commit static user tokens. If the user wants a local-only demo and accepts a static token, keep the blast radius clear and avoid putting that token in shared docs or final summaries.

---

## Runtime lane ownership

Choose exactly one lane from the project or request:

- **RN CLI:** use `stream-chat-react-native`.
- **Expo:** use `stream-chat-expo`.

Do not install both packages unless the existing project already has a documented reason. Preserve the project's package manager (`npm`, `yarn`, `pnpm`) and navigation style.

For new app requests, default to Expo if the user did not choose a lane. Use RN CLI when the user asks for it or when native project constraints require it. Do not turn a non-empty unrelated directory into a new app without asking; create a child app directory instead when a name can be inferred.

---

## Package version and docs discipline

Before installing Stream Chat RN packages:

1. Use [`references/DOCS.md`](references/DOCS.md) to fetch the primary manifest and the manifest-selected `Installation` markdown page.
2. Run or consult `npm view stream-chat-react-native version dist-tags --json` and/or `npm view stream-chat-expo version dist-tags --json`.
3. Install `@latest` when the npm dist-tag matches the selected docs. If it does not, use the manifest-selected tag or exact version.

Before changing an existing Chat UI, fetch the manifest-selected markdown page that matches the requested change. Choose the implementation path from the docs and the existing app: theme for style-only changes, component overrides for UI slots, documented props/hooks for behavior, and optional native packages only for requested native capabilities.

---

## Required peer setup

For Chat RN, required setup includes:

- `react-native-gesture-handler`
- `react-native-reanimated`
- `react-native-teleport`
- `react-native-svg`
- `@react-native-community/netinfo`
- `react-native-worklets` for RN CLI when Reanimated 4+ is used
- `expo-image-manipulator` for Expo image compression
- `expo-dev-client` for Expo apps

The Reanimated or Worklets Babel plugin must be the last Babel plugin. Wrap the app entry point in `GestureHandlerRootView`.

`react-native-teleport` is required because `OverlayProvider` uses it for portal-hosted UI.

Expo Chat apps in this skill use a dev-client/native-build lane by default because the SDK includes native code. Do not target Expo Go for `stream-chat-expo` setup.

Optional native dependencies are capability-owned. Install them only for requested capabilities or when manifest-selected docs require them. The package matrix and install notes live in [`builder.md`](builder.md) and [`references/CHAT-REACT-NATIVE.md`](references/CHAT-REACT-NATIVE.md).

---

## Client lifetime and providers

Use `useCreateChatClient` for the normal Chat connection path. It creates a client, connects the user, returns `null` while connecting, and disconnects during cleanup. Never pass `null` to `<Chat client={...}>`.

Keep one stable `Chat` provider near the app root unless there is a strong reason to isolate contexts. Keep `OverlayProvider` stable and above navigation screens so long-press overlays, attachment picker, and image gallery can render above the active screen.

Do not create a `StreamChat` client:

- in a screen body
- in a component that remounts on every navigation
- per channel screen
- inside render-time factories or unstable callbacks

On sign-out, unmount or change the `useCreateChatClient` inputs. If offline support is enabled, reset the offline database before disconnecting.

---

## Navigation and overlay discipline

When using React Navigation or Expo Router:

- Place `OverlayProvider` above the navigation screens. With React Navigation, prefer `OverlayProvider` above `NavigationContainer`.
- Keep `Chat` high enough that screen transitions do not reconnect the client.
- Pass channel CIDs or ids through navigation params, not `Channel` instances.
- Recreate the `Channel` instance from `useChatContext().client` on the destination screen.
- Set `keyboardVerticalOffset` to the header height.
- Do not add `topInset` or `bottomInset` by default. Add them only when a specific layout or attachment-picker issue proves they are needed.

For threads, keep thread state explicit. When a thread screen is open, pass the same `thread` value to the main `Channel` and render the thread screen with `threadList`.

---

## Offline support

Offline support is opt-in.

- Install `@op-engineering/op-sqlite` only when requested.
- Pass `enableOfflineSupport` to `Chat`.
- Expo apps already use a dev-client/native-build lane. Expo Go is not a supported target for this skill.
- Access to threads in offline mode is not implemented in the referenced docs.
- On sign-out, run `chatClient.offlineDb.resetDB()` before `disconnectUser()` to avoid cross-user data leaks.

For offline-first boot, read the offline section in [`sdk.md`](sdk.md) before coding. The docs require starting `connectUser` before rendering Chat components but not blocking the UI on the promise.

---

## Reference discipline

Load only the React Native Chat files that match the request:

- [`references/DOCS.md`](references/DOCS.md) for `llms.txt` manifests and docs lookup routing
- [`sdk.md`](sdk.md) for shared RN/Expo, auth, provider, navigation, offline, and sign-out patterns
- [`references/CHAT-REACT-NATIVE.md`](references/CHAT-REACT-NATIVE.md) for Chat setup and gotchas
- [`references/CHAT-REACT-NATIVE-blueprints.md`](references/CHAT-REACT-NATIVE-blueprints.md) for concrete screen/component structure

### Blueprints are mandatory, on every turn

Before writing or editing any Stream Chat React Native screen, navigation handler, thread flow, theming override, offline flow, or component customization, open the matching section of [`references/CHAT-REACT-NATIVE-blueprints.md`](references/CHAT-REACT-NATIVE-blueprints.md) and follow its structure.

Use the **Request -> Blueprint section** table at the top of the blueprints file. If no section matches, say so before improvising. Do not rely on a blueprint read earlier in the session; re-read the relevant section before each Stream screen edit.

---

## CLI and shell discipline

Credentials and requested demo data use the `stream` binary. If the binary is missing, follow [`../stream-cli/bootstrap.md`](../stream-cli/bootstrap.md) instead of introducing a new installer flow.

For `stream api` calls, follow [`../stream/RULES.md`](../stream/RULES.md) > CLI safety: discover endpoints before running them, use `--safe` first for read operations, and only run mutating demo-data calls after the user explicitly asks for demo data.

Do not read or print `.env` files. Do not use `bash -ce` in probes.
