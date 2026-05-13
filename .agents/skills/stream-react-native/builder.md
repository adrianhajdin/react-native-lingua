# Stream React Native - build and integration flow

Use this module after intent classification and the Project signals probe from [`SKILL.md`](SKILL.md). Run [`credentials.md`](credentials.md) before writing connected Chat code or creating requested demo data.

---

## 1. Detect the workspace

Start by understanding what kind of React Native project is in front of you:

- `EMPTY_CWD` -> valid Track A target; scaffold in the current directory or a named child directory
- no `package.json`, no Expo config, and non-empty directory -> ask before creating a child app
- `package.json` with `expo` or `app.json` / `app.config.*` -> Expo lane
- `package.json` with `react-native` and `ios/` + `android/` -> RN CLI lane
- `app/_layout.*` or `expo-router` -> Expo Router
- `@react-navigation/*` -> React Navigation
- `babel.config.js` -> required place for Reanimated/Worklets plugin

For Track A, default to Expo if the user did not specify Expo vs RN CLI. Keep the new-app guidance minimal: app creation, Stream package install, root providers, auth/token flow, first Chat screen, and verification. Do not explain full React Native, Expo, Xcode, Android Studio, simulator, device, or account setup.

---

## 2. New app scaffold

Use this when the user asks for a brand-new Chat RN app or the workspace is empty and Track A applies.

### Pick target directory

- If the user provided an app name, use it as the directory name.
- If the current directory is empty and the user asked to use it, scaffold into `.`.
- If the current directory is non-empty, create a child directory from the requested app name.
- If no app name can be inferred in a non-empty directory, ask one short question for the app directory name.

### Expo default lane

Replace `MyChatApp` with the target directory, or use `.` only when the current directory is empty and the user asked to scaffold in place.

```bash
npx create-expo-app@latest MyChatApp
cd MyChatApp
```

Then install Stream Chat for Expo with the selected package and mandatory peers:

```bash
npm view stream-chat-expo version dist-tags --json
npx expo install stream-chat-expo@latest @react-native-community/netinfo expo-dev-client expo-image-manipulator react-native-gesture-handler react-native-reanimated react-native-svg react-native-teleport
npx expo install react-native-safe-area-context
npx expo prebuild
```

Use `npx expo install` for Expo dependencies so versions match the Expo SDK. Add `react-native-safe-area-context` when using React Navigation or the provided screen blueprints. Expo Chat apps use a dev-client/native-build lane by default; do not target Expo Go.

### RN CLI lane

Use this only when the user asks for RN CLI or the project requirements point there:

Replace `MyChatApp` with the target directory, or use `.` only when the current directory is empty and the selected RN CLI supports in-place init.

```bash
npx @react-native-community/cli@latest init MyChatApp
cd MyChatApp
```

Then install Stream Chat for RN CLI with the selected package and mandatory peers:

```bash
npm view stream-chat-react-native version dist-tags --json
npm install stream-chat-react-native@latest @react-native-community/netinfo react-native-gesture-handler react-native-reanimated react-native-teleport react-native-worklets react-native-svg
npm install react-native-safe-area-context
npx pod-install
```

If the new app uses yarn or pnpm, translate package-manager commands without changing package names. Run pods after native dependency changes in RN CLI apps.

### New app continuation

After scaffold and packages:

1. Use [`references/DOCS.md`](references/DOCS.md) to fetch the primary manifest and selected `Installation` markdown page.
2. Confirm the installed Stream package matches the selected docs and npm dist-tag.
3. Run [`credentials.md`](credentials.md) or wire the app's token provider plan.
4. Configure Babel and root providers.
5. Implement the first screen set from [`references/CHAT-REACT-NATIVE-blueprints.md`](references/CHAT-REACT-NATIVE-blueprints.md): App Provider and Auth Gate, Navigation Shell if needed, Channel List Screen, and Channel Screen.
6. Start the dev server only when useful and feasible for the environment (`npx expo start --dev-client`, `npm run ios`, or `npm run android`).

---

## 3. Choose the integration lane

Resolve four things before editing an existing app:

1. **Runtime:** Expo or RN CLI
2. **Navigation:** React Navigation, Expo Router, existing custom navigation, or no navigation
3. **Scope:** setup only, core Chat screens, optional native capability, or customization
4. **Auth model:** backend token endpoint, CLI-generated local token, or pasted static token

If the user only asked for setup, stop after the shared wiring in [`sdk.md`](sdk.md).

---

## 4. Install packages

Use [`references/DOCS.md`](references/DOCS.md) first: fetch the primary manifest, select `Installation`, then fetch that markdown page.

Preserve the project's package manager. Use `npx expo install` for Expo packages so versions match the Expo SDK.

### RN CLI lane

Install the Chat SDK and required peers:

```bash
npm view stream-chat-react-native version dist-tags --json
npm install stream-chat-react-native@latest @react-native-community/netinfo react-native-gesture-handler react-native-reanimated react-native-teleport react-native-worklets react-native-svg
```

If the project uses yarn or pnpm, translate the command without changing package names.

Run pods after native dependencies change:

```bash
npx pod-install
```

### Expo lane

Install the Expo wrapper and compatible peers:

```bash
npm view stream-chat-expo version dist-tags --json
npx expo install stream-chat-expo@latest @react-native-community/netinfo expo-dev-client expo-image-manipulator react-native-gesture-handler react-native-reanimated react-native-svg react-native-teleport
```

Expo Chat apps use a dev-client/native-build lane by default because the SDK includes native code. If the app does not already have native projects, generate them:

```bash
npx expo prebuild
```

Run Expo through the dev client:

```bash
npx expo start --dev-client
```

Do not target Expo Go for `stream-chat-expo`. Also set `useNativeMultipartUpload={true}` on `Chat` when upload progress is required.

### Optional packages by capability

Optional dependencies are capability packages. They are not required for every Chat app. Install them only when the user asks for that capability, when selected manifest docs require them, or when an implemented blueprint needs native functionality beyond the core Chat UI.

How to add one:

1. Identify the requested capability from the user request and manifest-selected docs.
2. Pick the package from the matrix for the detected runtime lane.
3. Install with the project's package manager for RN CLI, or `npx expo install` for Expo.
4. Add required platform permissions or Expo config plugins from the selected package docs.
5. Run pods for RN CLI native installs. For Expo, keep the app in the dev-client/native-build lane and run prebuild when native config changes need to be regenerated.
6. Verify the capability in the existing app flow; do not leave unused optional packages installed.

| User asks for | RN CLI packages | Expo packages | Notes |
|---|---|---|---|
| React Navigation examples / safe areas | `react-native-safe-area-context` | `react-native-safe-area-context` | Needed for `SafeAreaProvider` and `useSafeAreaInsets`; navigation itself may already be installed |
| Native multipart upload progress | none beyond required Stream peers | none beyond Expo dev-client lane | Set `useNativeMultipartUpload={true}` on `Chat` |
| Attachment picker with built-in image media library | `@react-native-camera-roll/camera-roll` | `expo-media-library` | Enables gallery images in the SDK attachment picker |
| Native image picker / camera image upload | `react-native-image-picker` | `expo-image-picker` | Use for camera capture and native picker flows |
| File attachments / document picker | `@react-native-documents/picker` | `expo-document-picker` | Required for file picking |
| Attachment sharing outside the app | `react-native-blob-util react-native-share` | `expo-sharing` | Share downloaded attachments |
| Video playback / video attachments | `react-native-video` | `expo-video` | Optional media playback |
| Voice recording and audio attachments | `react-native-video react-native-audio-recorder-player react-native-blob-util` | Expo SDK 53+: `expo-audio`; Expo SDK 51/52: `expo-av` | Add microphone permissions/config plugins |
| Copy message | `@react-native-clipboard/clipboard` | `expo-clipboard` | Clipboard action support |
| Haptic feedback | `react-native-haptic-feedback` | `expo-haptics` | Optional tactile feedback |
| Offline support | `@op-engineering/op-sqlite` | `@op-engineering/op-sqlite` | Requires native code; Expo already uses the dev-client lane |
| High-performance message list | `@shopify/flash-list` | `@shopify/flash-list` | Use when large channels need FlashList |

After adding native optional packages, follow their platform permission steps. For Expo, keep the app in the dev-client/native-build lane and run `npx expo prebuild` when native config changes need to be regenerated.

---

## 5. Configure native/runtime requirements

### Babel plugin

Ensure the Reanimated or Worklets plugin is the last Babel plugin:

```js
module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    // other plugins
    "react-native-worklets/plugin",
  ],
};
```

Use `react-native-reanimated/plugin` if the project is still on Reanimated 3. Use `react-native-worklets/plugin` for Reanimated 4+.

### Entry point

Wrap the app entry point with `GestureHandlerRootView`.

For Expo Router, the entry point is usually `app/_layout.tsx`. For RN CLI, it is usually `App.tsx` or the component registered from `index.js`.

### Safe area

If navigation is used, install and place `SafeAreaProvider` near the root. Do not pass safe-area values into `Channel` as `topInset` or `bottomInset` by default; add those props only after a specific layout or attachment-picker issue proves they are needed.

---

## 6. Wire shared Chat setup

Before writing code, confirm [`credentials.md`](credentials.md) has resolved the API key, user id, and token or token provider plan for tracks A/B/D.

Follow [`sdk.md`](sdk.md) for:

- package import lane
- `useCreateChatClient`
- root provider hierarchy
- React Navigation / Expo Router placement
- channel selection and CID navigation
- thread state
- sign-out and offline cleanup

Use the real API key and token or the app's token provider. Do not leave placeholder strings in final code unless the user explicitly asked for a template only.

---

## 7. Load only the needed reference files

Use the requested screen/feature to choose the smallest relevant reference set.

Always load:

- [`references/DOCS.md`](references/DOCS.md) for `llms.txt` manifest lookup
- [`references/CHAT-REACT-NATIVE.md`](references/CHAT-REACT-NATIVE.md) for setup and gotchas

Load the matching blueprint section from:

- [`references/CHAT-REACT-NATIVE-blueprints.md`](references/CHAT-REACT-NATIVE-blueprints.md)

Per [`RULES.md`](RULES.md), re-open the relevant blueprint section before every Stream Chat screen, navigation handler, thread flow, theming override, offline flow, or component customization edit.

For requested optional native capabilities, read [`references/CHAT-REACT-NATIVE.md`](references/CHAT-REACT-NATIVE.md) > **Optional dependency map** before installing packages.

---

## 8. Existing app modification flow

Use this when the request is a targeted Chat change in an existing app.

1. Detect runtime and currently installed Stream packages.
2. Use [`references/DOCS.md`](references/DOCS.md) to fetch the relevant manifest and selected markdown page for the requested area.
3. Open the matching blueprint section.
4. For cookbook-style requests, use [`references/DOCS.md`](references/DOCS.md) manifest search and fetch the best matching cookbook/customization markdown page from the primary manifest.
5. Prefer the smallest change that preserves the app's architecture:
   - style-only -> theme object
   - slot-level UI -> `WithComponents`
   - behavior -> component prop or hook documented by the manifest-selected markdown page
   - native capability -> install only the optional package(s) for that capability
6. Verify with the existing project commands.

For message visual or layout changes, fetch the manifest-selected theming/customization pages, then prefer theme values before replacing core message components.

---

## 9. Verify before you stop

Use the project's existing verification commands. Prefer the smallest checks that prove the integration works:

- package install completed and selected Stream package matches the docs
- iOS pods resolved for RN CLI native installs
- Babel plugin is present and last
- `GestureHandlerRootView` wraps the app
- `OverlayProvider` and `Chat` are stable near the root
- `ChannelList` renders for the connected user
- channel navigation passes a CID, not a `Channel` object
- `Channel` renders `MessageList` and `MessageComposer`
- thread navigation passes thread state correctly
- sign-out clears the connected user and, if offline is enabled, resets offline DB before disconnect
- optional dependencies are present only for requested optional features

Common commands:

```bash
npm run typecheck
npm run lint
npm run ios
npm run android
npx expo start
```

Run only commands that exist in the project.
