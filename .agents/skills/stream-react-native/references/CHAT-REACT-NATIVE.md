# Chat React Native - Setup and Integration

Stream Chat React Native provides pre-built Chat UI for React Native CLI and Expo apps. This file covers packages, app setup, client/auth patterns, navigation, offline support, and gotchas. For `llms.txt` docs lookup, see [DOCS.md](DOCS.md). For screen structures, see [CHAT-REACT-NATIVE-blueprints.md](CHAT-REACT-NATIVE-blueprints.md).

Rules: [../RULES.md](../RULES.md) (Chat-only, New Architecture, secrets, runtime lane ownership, provider placement, blueprint reads).

Manifest-selected docs are the authority. Use [DOCS.md](DOCS.md) before installing packages or making API-specific claims.

---

## Quick ref

| Area | RN CLI | Expo |
|---|---|---|
| Chat package | `stream-chat-react-native` | `stream-chat-expo` |
| Required peers | `@react-native-community/netinfo`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-teleport`, `react-native-worklets`, `react-native-svg` | `@react-native-community/netinfo`, `expo-image-manipulator`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-svg`, `react-native-teleport` |
| Install command | package manager install | `npx expo install` |
| Root wrapper | `GestureHandlerRootView` | `GestureHandlerRootView` in `App.tsx` or `app/_layout.tsx` |

First path:

1. Pick RN CLI vs Expo.
2. Use [DOCS.md](DOCS.md) to fetch the manifest-selected `Installation` page and verify npm dist-tags.
3. Install package and required peers.
4. Add Reanimated or Worklets Babel plugin last.
5. Wrap root with `GestureHandlerRootView`.
6. Place `OverlayProvider` and `Chat` high in the tree.
7. Use `useCreateChatClient` for normal auth.
8. Render `ChannelList`, `Channel`, `MessageList`, `MessageComposer`, and optional `Thread`.

Full screen blueprints: [CHAT-REACT-NATIVE-blueprints.md](CHAT-REACT-NATIVE-blueprints.md). Load only the section you are implementing.

---

## App Integration

### Installation

RN CLI:

```bash
npm view stream-chat-react-native version dist-tags --json
npm install stream-chat-react-native@latest @react-native-community/netinfo react-native-gesture-handler react-native-reanimated react-native-teleport react-native-worklets react-native-svg
npx pod-install
```

Expo:

```bash
npm view stream-chat-expo version dist-tags --json
npx expo install stream-chat-expo@latest @react-native-community/netinfo expo-dev-client expo-image-manipulator react-native-gesture-handler react-native-reanimated react-native-svg react-native-teleport
npx expo prebuild
```

Install `@latest` only after confirming the npm dist-tag matches the selected docs. If not, use the manifest-selected docs' tag or exact version.

### Optional dependency map

Optional dependencies are opt-in native capability packages, not default Chat requirements. Use this map only after the user asks for the capability or after manifest-selected docs require it.

Add optional dependencies with the runtime's normal install lane:

- RN CLI: use the project's package manager, then run pods after native packages change.
- Expo: use `npx expo install` so versions match the Expo SDK.
- Expo Chat apps use a dev-client/native-build lane by default because the SDK includes native code. Do not target Expo Go.
- If an Expo app does not already have native projects, run `npx expo prebuild`; run it again when native config changes need to be regenerated.
- Add platform permissions and config plugins from the selected package docs.

| Feature | Packages |
|---|---|
| React Navigation safe areas | RN CLI: `react-native-safe-area-context`; Expo: `npx expo install react-native-safe-area-context` |
| Native multipart upload progress | RN CLI: none beyond required Stream peers; Expo: none beyond dev-client lane |
| Attachment picker with built-in image media library | RN CLI: `@react-native-camera-roll/camera-roll`; Expo: `expo-media-library` |
| Native image picker / camera image upload | RN CLI: `react-native-image-picker`; Expo: `expo-image-picker` |
| File attachments / document picker | RN CLI: `@react-native-documents/picker`; Expo: `expo-document-picker` |
| Attachment sharing outside the app | RN CLI: `react-native-blob-util react-native-share`; Expo: `expo-sharing` |
| Video playback / video attachments | RN CLI: `react-native-video`; Expo: `expo-video` |
| Voice recording and audio attachments | RN CLI: `react-native-video react-native-audio-recorder-player react-native-blob-util`; Expo SDK 53+: `expo-audio`; Expo SDK 51/52: `expo-av` |
| Copy message | RN CLI: `@react-native-clipboard/clipboard`; Expo: `expo-clipboard` |
| Haptic feedback | RN CLI: `react-native-haptic-feedback`; Expo: `expo-haptics` |
| Offline support | RN CLI: `@op-engineering/op-sqlite`; Expo: `@op-engineering/op-sqlite` |
| High-performance message list | RN CLI: `@shopify/flash-list`; Expo: `@shopify/flash-list` |

What the common entries mean:

- Media library packages let the SDK or app read existing photos/videos from the device library.
- Native multipart upload progress uses `useNativeMultipartUpload={true}` on `Chat`; Expo already uses the dev-client/native-build lane.
- Image picker packages let the app open native picker and camera capture flows.
- Document picker packages let the app choose arbitrary files outside the media library.
- Sharing packages let the app hand an attachment to another app.
- Audio packages add recording or playback primitives and usually need microphone permissions.
- Offline storage packages add a local database and require native code.
- List virtualization packages are performance helpers, not required for basic Chat screens.

If the user request is ambiguous, inspect the selected docs and existing app behavior before installing. For example, image library access, camera capture, document picking, and sharing are separate native capabilities and should not all be installed for one vague request.

After dependencies are installed, keep optional UI inside the normal `Channel` and `MessageComposer` flow unless manifest-selected docs require a different placement.

### Babel and entry point

The Reanimated or Worklets plugin must be last:

```js
module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    // other plugins
    "react-native-worklets/plugin",
  ],
};
```

Use `react-native-reanimated/plugin` when the app is on Reanimated 3. Use `react-native-worklets/plugin` for Reanimated 4+.

Wrap the entry point:

```tsx
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* app */}
    </GestureHandlerRootView>
  );
}
```

### Client setup

Use `useCreateChatClient` for normal connection and cleanup:

```tsx
import {
  Chat,
  OverlayProvider,
  useCreateChatClient,
} from "stream-chat-react-native";

const chatClient = useCreateChatClient({
  apiKey,
  tokenOrProvider,
  userData: { id: userId, name: userName },
});

if (!chatClient) return null;

return (
  <OverlayProvider>
    <Chat client={chatClient}>{children}</Chat>
  </OverlayProvider>
);
```

For Expo, import from `stream-chat-expo`.

### Token route pattern

Production apps should use a backend route that upserts the current user and returns a Stream user token:

```ts
// Server-side only
import { StreamChat } from "stream-chat";

const serverClient = StreamChat.getInstance(apiKey, apiSecret);
await serverClient.upsertUsers([{ id: userId, name: userName }]);
const token = serverClient.createToken(userId);
```

Client response shape can be:

```ts
{ apiKey: string, token: string, userId: string, userName: string }
```

Local demo tokens can come from [`../credentials.md`](../credentials.md).

---

## Core components

| Component/hook | Use |
|---|---|
| `useCreateChatClient` | Creates, connects, returns `StreamChat | null`, disconnects on cleanup |
| `OverlayProvider` | Top-level overlay/image gallery/attachment picker provider |
| `Chat` | Provides client, theme, translations, online state |
| `ChannelList` | Queries and renders channels |
| `Channel` | Provides channel, keyboard, messages, composer, attachment picker, and thread contexts |
| `MessageList` | Renders messages inside `Channel` |
| `MessageComposer` | Current message input; use instead of old message input patterns |
| `Thread` | Renders replies for a selected parent message |
| `ThreadList` | Renders an inbox of threads inside `Chat` |
| `WithComponents` | Replaces component slots and subcomponents |
| `useChatContext` | Reads the provided client inside `Chat` |
| `useMessageContext` | Reads current message state in custom message subcomponents |

---

## Navigation rules

- Put `OverlayProvider` above navigation screens; with React Navigation, prefer it above `NavigationContainer`.
- Keep `Chat` high and stable so screen transitions do not reconnect the socket.
- Pass `channel.cid` through navigation params. Do not pass `Channel` objects.
- Recreate a channel from `client.channel(type, id)` in the destination screen.
- Use `keyboardVerticalOffset={headerHeight}` on `Channel`.
- Do not add `topInset` or `bottomInset` by default. Add them only after a specific layout or attachment-picker issue proves they are needed.
- Field note: in our Expo dev-client app, adding `topInset` and `bottomInset` made the layout wrong.
- For threads, pass the active `thread` to the main `Channel` while the thread screen is open and render the thread screen with `threadList`.

---

## Customization

Use [DOCS.md](DOCS.md) to fetch the manifest-selected theming/customization page first. Prefer these in order:

1. Channel props for behavior changes.
2. Theme via `OverlayProvider value={{ style }}` and `Chat style={style}`.
3. `WithComponents` overrides for the documented slot that matches the requested customization.
4. Full core component replacement only when the smaller slots cannot satisfy the request.

`WithComponents` can wrap any subtree. Inner overrides merge over outer overrides.

---

## Offline support

Offline support is opt-in:

```bash
npm install @op-engineering/op-sqlite
```

Expo:

```bash
npx expo install @op-engineering/op-sqlite
```

Enable it:

```tsx
<Chat client={chatClient} enableOfflineSupport>
  {children}
</Chat>
```

Caveats from the manifest-selected docs:

- Expo apps already use a dev-client/native-build lane. Expo Go is not a supported target for this skill.
- Threads are not available in offline mode.
- Reset the DB on sign-out before disconnecting:

```tsx
await chatClient.offlineDb?.resetDB();
await chatClient.disconnectUser();
```

---

## Gotchas

- The bundled references assume React Native New Architecture.
- `react-native-teleport` is required for overlays.
- `useCreateChatClient` returns `null` while connecting.
- Never pass `null` to `Chat`.
- Do not create multiple connected `StreamChat` clients.
- Do not pass `Channel` instances through navigation params.
- A channel created with only a members list gets a generated id and cannot later add/remove members in the usual channel-id flow; use explicit ids when membership editing matters.
- Use `MessageComposer` for message input.
- Use `WithComponents` for component overrides instead of old prop-heavy override patterns.
- Do not wrap `MessageComposer` in extra `SafeAreaView` to fix spacing; use `Channel` insets.
- Remove old Android negative `keyboardVerticalOffset` hacks during migration.
- Keep theme objects stable with `useMemo`.
- For upload progress, use `useNativeMultipartUpload={true}` on `Chat`.
- On iOS Simulator, after fully closing and reopening the app, the first native multipart upload can fail while later uploads may proceed. Verify on a real device before treating it as a general SDK bug.
- If using push notifications, fetch the manifest-selected push notification docs before changing setup. Do not assume background WebSocket behavior or default prop values from memory.
