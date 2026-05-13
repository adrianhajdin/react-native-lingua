# Chat - Setup & Integration

Stream Chat provides pre-built UI components via React, React Native, Flutter, Swift, and Kotlin SDKs. This file covers setup, server routes, client patterns, and gotchas. For full component structure and wiring, see [CHAT-blueprints.md](CHAT-blueprints.md).

Rules: [../../stream/RULES.md](../../stream/RULES.md) (secrets, no auto-seeding, login screen first, strict mode protection).

- **Blueprint** - HTML with BEM classes defining structure and conditional rendering
- **Wiring** - API calls to read/write each element, exact property paths
- **Requirements** - Dashboard settings, API params, and prerequisites

## Quick ref

- **Packages:** `stream-chat`, `stream-chat-react`; import `stream-chat-react/dist/css/index.css` (v14+; v13 used `dist/css/v2/index.css`).
- **First:** **App Integration** -> **Setup** (CLI / channel types) before UI.
- **Per feature:** Jump to section (Channel List, Message List, ...) when implementing that screen.
- **Below the next rule:** full blueprints - **do not load past it** until you implement that component.

Full component blueprints: [CHAT-blueprints.md](CHAT-blueprints.md) - load only the section you are implementing.

---

## App Integration

Everything needed to wire the UI components above into a working Next.js application.

### Setup

**Packages:** `stream-chat` + `stream-chat-react` (client), `stream-chat` (server via `StreamChat.getInstance`)

No CLI commands needed - built-in channel types (`messaging`, `team`, `livestream`) work out of the box.

### Server Routes

| Route | Method | Params | Action | Response |
|---|---|---|---|---|
| `/api/token` | GET | `?user_id=xxx` | `client.upsertUsers([{ id, name, role: 'user' }])`, `client.createToken(userId)` | `{ chatToken, apiKey }` |

See RULES.md > No auto-seeding.

```ts
import { StreamChat } from 'stream-chat';
const client = StreamChat.getInstance(process.env.STREAM_API_KEY!, process.env.STREAM_API_SECRET!);
```

### Client Patterns

- **Login Screen first:** See RULES.md > Login Screen first + [builder-ui.md](../builder-ui.md) > Login Screen.
- **App Header:** Show the current username + avatar (initial letter) + "Switch User" in a persistent header above the chat layout. See [`builder-ui.md`](../builder-ui.md) -> App Header.
- **Use `useCreateChatClient`:** the SDK ships an official hook that handles strict-mode, instantiation, `connectUser`, and cleanup. Never wire `connectUser`/`disconnectUser` manually - they race with strict-mode double-mount and produce *"You can't use a channel after client.disconnect was called"*.
  ```ts
  import { useCreateChatClient } from "stream-chat-react";
  const chatClient = useCreateChatClient({
    apiKey,
    tokenOrProvider: chatToken,
    userData: { id: userId, name },
  });
  if (!chatClient) return <Loading />;
  ```
- **Hoist `<Chat>` to AppShell:** mount `<Chat client={chatClient}>` once at the app root, alongside `<StreamVideo>` / `<StreamFeeds>`. Per-screen components only render `<Channel channel={...}>` from the existing client. **Never instantiate a new `StreamChat` per screen** - the cleanup of one screen's effect will disconnect the client another screen is still using. See [`CROSS-PRODUCT.md`](CROSS-PRODUCT.md) for the full multi-product AppShell skeleton.
- **Channel switching:** the client is long-lived; only swap the `channel` prop on `<Channel>` when the conversation changes. On per-channel unmount call `channel.stopWatching()` - never `client.disconnectUser()`.
- **Theme:** `useTheme()` from `next-themes` - pass `str-chat__theme-dark` or `str-chat__theme-light` to `<Chat>` based on `resolvedTheme`.
- **Strict mode:** See RULES.md > Strict mode protection. `useCreateChatClient` already handles this for you.

### Gotchas

- Always generate real tokens server-side via `client.createToken()` - never `devToken()`
- `StreamChat.getInstance(apiKey, apiSecret)` is fine server-side (singleton OK)
- `client.channel("livestream", id)` - no third arg with `{ name }` (TS error in current SDKs)
- Listen for `user.banned` event to show banned state in UI
- Import `stream-chat-react/dist/css/index.css` for default styles (v14+; the `/v2/` subpath was removed)
- `MessageInput` was renamed/removed in v14 - use `MessageComposer` from `stream-chat-react` instead
- Token endpoint as `GET /api/token?user_id=xxx`
- `upsertUsers` takes an **array** of user objects: `client.upsertUsers([{ id, name, role }])` - NOT an object keyed by ID
- `<Chat>` lives at app root; `<Channel>` is what swaps per conversation. Don't construct/destruct `StreamChat` per screen.
