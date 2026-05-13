# SDK reference - cross-cutting patterns

Rules: the `stream` skill's [`RULES.md`](../stream/RULES.md) (secrets, strict mode protection, package manager). **CLI:** complete the `stream-cli` skill's [`preflight.md`](../stream-cli/preflight.md) before any workflow that needs the `stream` CLI.
Product-specific SDK wiring, gotchas, and client patterns: see [`references/*.md`](references/) App Integration sections.

---

## Token endpoint pattern (all products)

`GET /api/token?user_id=xxx` - upsert the requesting user only (RULES.md > No auto-seeding), return per-product tokens.

**Combined token route** when multiple products are used:

```ts
// Returns whichever tokens the use case needs:
{ chatToken, videoToken, feedToken, apiKey }
```

## Server-side client instantiation

| Product | Package | Instantiation |
|---------|---------|---------------|
| Chat | `stream-chat` | `StreamChat.getInstance(apiKey, apiSecret)` - singleton OK server-side |
| Video | `@stream-io/node-sdk` | `new StreamClient(apiKey, apiSecret)` |
| Feeds (token only) | `@stream-io/node-sdk` | `new StreamClient(apiKey, apiSecret)` - token generation + user upsert only |

## Client-side instantiation

| Product | Package | Instantiation |
|---------|---------|---------------|
| Chat | `stream-chat` + `stream-chat-react` | `new StreamChat(apiKey)` - never `getInstance()` on client (RULES.md > Strict mode protection) |
| Video | `@stream-io/video-react-sdk` | `new StreamVideoClient({ apiKey, user: { id, name }, token })` |
| Feeds v3 | `@stream-io/feeds-react-sdk` | `useCreateFeedsClient({ apiKey, tokenOrProvider, userData })` - returns `FeedsClient \| null` (null until connected). All feed mutations happen client-side. |

## CSS imports

```ts
// Chat
import 'stream-chat-react/dist/css/v2/index.css';
// Video
import '@stream-io/video-react-sdk/dist/css/styles.css';
```

## Theme hook (next-themes)

Use `useTheme()` from `next-themes` (scaffolded automatically) to read `resolvedTheme` and pass to Stream Chat:

```tsx
import { useTheme } from "next-themes";
const { resolvedTheme } = useTheme();
const theme = resolvedTheme === "dark" ? "str-chat__theme-dark" : "str-chat__theme-light";
<Chat client={client} theme={theme}>
```

## searchParams narrowing

`searchParams.get()` returns `string | null` - guard before passing to SDK methods.

## `upsertUsers` format

Both `StreamChat` and `StreamClient` take an **array** of user objects:

```ts
client.upsertUsers([{ id, name, role: 'user' }])  // NOT an object keyed by ID
```

## Feeds v3 - client-side React SDK

All feed mutations (post, react, comment, bookmark, follow) happen **client-side** through `FeedsClient` from `@stream-io/feeds-react-sdk`. The server-side `@stream-io/node-sdk` is used **only** for the `/api/token` route (user upsert + token generation).

**Key type contracts (verified from SDK source):**

| Hook / Method | Return type | Watch out |
|---|---|---|
| `useCreateFeedsClient()` | `FeedsClient \| null` | `null` until connected - gate rendering |
| `useFeedsClient()` | `FeedsClient \| undefined` | `undefined` if no `<StreamFeeds>` provider - always guard |
| `feed.addActivity()` | `StreamResponse<AddActivityResponse>` | Activity at `result.activity`, ID at `result.activity.id` - NOT `result.id` |
| `client.addComment()` | `StreamResponse<AddCommentResponse>` | Comment at `result.comment` - NOT `result` directly |
| `loadNextPage()` (all hooks) | `() => Promise<void>` | Async - wrap for onClick: `onClick={() => loadNextPage()}` |
| `useFeedActivities()` | `{ activities?, is_loading?, has_next_page?, loadNextPage }` | All fields except `loadNextPage` are `T \| undefined` |

See `references/FEEDS.md` for complete type reference.

## Moderation - CLI setup only

Moderation is configured via CLI during scaffold - NOT built as in-app UI. Review happens in the [Stream Dashboard](https://beta.dashboard.getstream.io). CLI commands: see `references/MODERATION.md` (App Integration -> Setup).
