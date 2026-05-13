# Feeds v3 - Setup & Integration

Stream Feeds v3 is a **headless** SDK - hooks, providers, and state management with **zero pre-built UI components**. All UI is built with your own components (Tailwind/Shadcn). For full component structure and wiring, see [FEEDS-blueprints.md](FEEDS-blueprints.md).

Rules: [../../stream/RULES.md](../../stream/RULES.md) (secrets, no auto-seeding, login screen first, strict mode protection).

- **Blueprint** - HTML with BEM classes defining structure and conditional rendering
- **Wiring** - API calls to read/write each element, exact property paths
- **Requirements** - Dashboard settings, API params, and prerequisites

## Quick ref

- **Packages:** `@stream-io/feeds-react-sdk` (client - re-exports `@stream-io/feeds-client` + React bindings), `@stream-io/node-sdk` (server - token generation + user upsert only)
- **No CSS import** - SDK is headless, all styling is yours
- **First:** **App Integration** -> **Setup** (CLI / feed groups) before UI.
- **Per feature:** Jump to section (Feed List, Post Card, ...) when implementing that screen.

Full component blueprints: [FEEDS-blueprints.md](FEEDS-blueprints.md) - load only the section you are implementing.

---

## App Integration

Everything needed to wire the Feeds SDK into a working Next.js application.

### Setup

**Packages:** `@stream-io/feeds-react-sdk` (client - re-exports `@stream-io/feeds-client` + React bindings), `@stream-io/node-sdk` (server - token generation, user upsert)

**CLI commands (run during scaffold):**

```bash
# List existing feed groups (v3 apps come with defaults: user, timeline, notification, foryou, story, stories):
stream --safe api ListFeedGroups

# Create custom feed group if needed:
stream api CreateFeedGroup --body '{"id":"<name>","default_visibility":"visible","activity_selectors":[{"type":"current_feed"}]}'
```

Default feed groups on a Feeds v3 app:
- `user` - personal feed (activity_selector: `current_feed`). Post activities here.
- `timeline` - aggregated feed of followed users (activity_selector: `following`)
- `notification` - aggregated notifications with seen/read tracking
- `foryou` - algorithmic feed (popular + following + follow suggestions)
- `story` / `stories` - stories support

### Server Routes

Most feed mutations (post, react, comment, bookmark) happen **client-side** via the `FeedsClient` from `@stream-io/feeds-react-sdk`. The server is used for token generation, user upsert, and **cross-product mutations** (e.g. posting live activities from an API route).

| Route | Method | Params | Action | Response |
|---|---|---|---|---|
| `/api/token` | GET | `?user_id=xxx` | `client.upsertUsers([{ id, name, role: 'user' }])`, `client.generateUserToken({ user_id })` | `{ feedToken, apiKey, userId }` |

See RULES.md > No auto-seeding.

```ts
import { StreamClient } from '@stream-io/node-sdk';
const client = new StreamClient(process.env.STREAM_API_KEY!, process.env.STREAM_API_SECRET!);
```

**Token generation:**
```ts
const feedToken = client.generateUserToken({ user_id: userId });
// NOT client.createToken() - that's deprecated
```

**Server-side feed mutations** (via `@stream-io/node-sdk`):

All feed operations on the server-side `StreamClient` are namespaced under `client.feeds.*` - NOT `client.*` directly. This is different from the client-side `FeedsClient` where methods are on the client directly.

#### Server-side mutations require `user_id`

**Every** `client.feeds.*` mutation requires a `user_id` field naming the acting user (the activity/comment/reaction author). Forgetting it returns:

```
Stream error code 4: <Method> failed with error: "user_id is required for server side requests"
```

This applies to (Node SDK):
- `addActivity` (required)
- `updateActivity` / `updateActivityPartial` (required)
- `restoreActivity` (required)
- `addComment` / `deleteComment` (required for ownership)
- `addActivityReaction` / `deleteActivityReaction` (required for ownership)
- `addBookmark` / `deleteBookmark` (required for ownership)
- `pinActivity` / `unpinActivity` (required)
- `upsertActivities` (each activity needs `user_id`)
- `deleteActivities` (batch - `user_id` at request level)

**Exception:** `client.feeds.deleteActivity({ id, hard_delete })` does NOT take `user_id` in the Node SDK type - admin clients delete by activity ID directly. (The OpenAPI docs show `user_id` for some other language SDKs, but the TypeScript SDK omits it.)

```ts
// Add activity (server-side) - user_id REQUIRED
const result = await client.feeds.addActivity({
  user_id: userId,                    // <- REQUIRED
  feeds: [`user:${userId}`],
  type: 'post',
  text: 'Hello world',
  custom: { callId: '...' },
});
// result.activity.id - the created activity's ID

// Delete activity (server-side) - admin delete, no user_id
await client.feeds.deleteActivity({ id: activityId });
await client.feeds.deleteActivity({ id: activityId, hard_delete: true });

// Update activity (server-side) - user_id REQUIRED
await client.feeds.updateActivityPartial({
  id: activityId,
  user_id: userId,                    // <- REQUIRED
  set: { text: 'Updated' },
});
```

**Key difference from client-side API:** On the server, `addActivity` requires a `feeds` array specifying target feeds. The client-side `feed.addActivity()` implicitly targets the feed it's called on.

### Client Patterns

- **Login Screen first:** See RULES.md > Login Screen first + [builder-ui.md](../builder-ui.md) > Login Screen.
- **App Header:** Show the current username + avatar (initial letter) + "Switch User" in a persistent header. See [`builder-ui.md`](../builder-ui.md) -> App Header.
- **Instantiate:** Use `useCreateFeedsClient()` hook - it handles `connectUser()` internally.
- **Provider pattern:**

```tsx
import { useCreateFeedsClient, StreamFeeds, StreamFeed } from '@stream-io/feeds-react-sdk';

const client = useCreateFeedsClient({
  apiKey,
  tokenOrProvider: token,       // string or async () => string
  userData: { id: userId, name: userId },
  // options?: { base_url?, timeout? }
});

if (!client) return <Loading />;  // null until connected

<StreamFeeds client={client}>
  <StreamFeed feed={feed}>
    {/* Components using useFeedActivities(), useActivityComments(), etc. */}
  </StreamFeed>
</StreamFeeds>
```

- **Feed initialization - must call `getOrCreate()`:**

Each user posts to their **own** `user:<userId>` feed and reads from `timeline:<userId>` (which aggregates posts from followed users). Do NOT use a shared feed like `user:community` - users don't have permission to post to feeds they don't own.

```tsx
// User's own feed (post here)
const userFeed = client.feed('user', userId);
await userFeed.getOrCreate({ watch: true });

// User's timeline (read here - shows posts from followed users)
const timelineFeed = client.feed('timeline', userId);
await timelineFeed.getOrCreate({ watch: true });
```

- **Strict mode:** `useCreateFeedsClient()` handles connection internally. But `feed.getOrCreate()` must be wrapped in `setTimeout(50ms)` + `mounted` guard pattern (RULES.md > Strict mode protection).
- **Gate rendering** on `client !== null` - `useCreateFeedsClient()` returns `null` until connected.
- **Context hooks:**
  - `useFeedsClient()` - returns `FeedsClient | undefined` (undefined if no `<StreamFeeds>` parent). Always guard: `if (!client) return null;`
  - `useFeedContext()` - returns the Feed from the nearest `<StreamFeed>` parent.

### Key Types

**ActivityResponse** (what you render in posts - verified from SDK source):

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Unique activity ID |
| `type` | `string` | Activity type (e.g. `"post"`) |
| `text` | `string \| undefined` | Text content (optional) |
| `user` | `UserResponse` | **The author.** Has `.id`, `.name?`, `.image?`, `.custom` |
| `created_at` | `Date` | Creation timestamp |
| `updated_at` | `Date` | Last update timestamp |
| `comment_count` | `number` | Number of comments |
| `reaction_count` | `number` | Total reaction count |
| `bookmark_count` | `number` | Number of bookmarks |
| `share_count` | `number` | Number of shares |
| `reaction_groups` | `Record<string, FeedsReactionGroupResponse>` | **Reactions grouped by type.** Each value has `{ count, first_reaction_at, last_reaction_at }`. Use `activity.reaction_groups?.like?.count` |
| `own_reactions` | `FeedsReactionResponse[]` | **Flat array.** Check `activity.own_reactions?.some(r => r.type === 'like')` |
| `own_bookmarks` | `BookmarkResponse[]` | Current user's bookmarks. `own_bookmarks.length > 0` = bookmarked |
| `latest_reactions` | `FeedsReactionResponse[]` | Recent reactions |
| `comments` | `CommentResponse[]` | Latest comments (replies excluded) |
| `attachments` | `Attachment[]` | Media attachments |
| `custom` | `Record<string, any>` | Custom data |
| `visibility` | `'public' \| 'private' \| 'tag'` | Visibility setting |
| `restrict_replies` | `'everyone' \| 'people_i_follow' \| 'nobody'` | Who can comment |
| `feeds` | `string[]` | Feed IDs containing this activity |
| `hidden` | `boolean` | If hidden via activity feedback |
| `popularity` | `number` | Popularity score |
| `score` | `number` | Ranking score |
| `preview` | `boolean` | Preview flag |
| `deleted_at` | `Date \| undefined` | Set if soft-deleted |
| `edited_at` | `Date \| undefined` | Set if edited |

**CommentResponse:**

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Unique comment ID |
| `object_id` | `string` | ID of the parent object (activity) |
| `object_type` | `string` | Type of parent object (`"activity"`) |
| `text` | `string \| undefined` | Comment text |
| `user` | `UserResponse` | Comment author |
| `created_at` | `Date` | Creation timestamp |
| `reply_count` | `number` | Number of replies |
| `reaction_count` | `number` | Total reactions |
| `own_reactions` | `FeedsReactionResponse[]` | Current user's reactions |
| `latest_reactions` | `FeedsReactionResponse[] \| undefined` | Recent reactions |
| `reaction_groups` | `Record<string, FeedsReactionGroupResponse> \| undefined` | Grouped reactions |
| `parent_id` | `string \| undefined` | Parent comment ID (for nested replies) |
| `attachments` | `Attachment[] \| undefined` | Attachments |
| `custom` | `Record<string, any> \| undefined` | Custom data |
| `status` | `'active' \| 'deleted' \| 'removed' \| 'hidden' \| 'shadow_blocked'` | Comment status |
| `upvote_count` | `number` | Upvotes |
| `downvote_count` | `number` | Downvotes |
| `mentioned_users` | `UserResponse[]` | Mentioned users |

**FeedsReactionResponse:**

| Field | Type | Notes |
|---|---|---|
| `activity_id` | `string` | Reacted activity |
| `type` | `string` | Reaction type (e.g. `"like"`) |
| `user` | `UserResponse` | Who reacted |
| `created_at` | `Date` | When created |
| `updated_at` | `Date` | When updated |
| `comment_id` | `string \| undefined` | If reaction is on a comment |
| `custom` | `Record<string, any> \| undefined` | Custom data |

**FeedsReactionGroupResponse:**

| Field | Type | Notes |
|---|---|---|
| `count` | `number` | Number of reactions in this group |
| `first_reaction_at` | `Date` | Time of first reaction |
| `last_reaction_at` | `Date` | Time of most recent reaction |

**AggregatedActivityResponse** (what you render in notification groups - verified from SDK source):

| Field | Type | Notes |
|---|---|---|
| `group` | `string` | Grouping identifier - use as React key |
| `activities` | `ActivityResponse[]` | Activities in this aggregation. Derive the "verb" from `activities[0].type` (e.g. `"like"`, `"comment"`, `"post"`). |
| `activity_count` | `number` | Number of activities in this aggregation |
| `user_count` | `number` | Number of unique users in this aggregation |
| `user_count_truncated` | `boolean` | Whether user count was truncated due to group size limit |
| `created_at` | `Date` | When the aggregation was created |
| `updated_at` | `Date` | When the aggregation was last updated |
| `score` | `number` | Ranking score for this aggregation |
| `is_read` | `boolean \| undefined` | Whether this group has been read. Only set for notification feeds. |
| `is_seen` | `boolean \| undefined` | Whether this group has been seen. Only set for notification feeds. |

**There is no `.id` or `.verb` property.** Use `group` as key and derive verb from `activities[0].type`.

### Client Methods (Mutations)

All methods below are on the client-side `FeedsClient` (from `useCreateFeedsClient()` or `useFeedsClient()`). All return `Promise<StreamResponse<T>>` where `StreamResponse<T> = T & { metadata: RequestMetadata }`.

```ts
// Activities - via Feed instance (preferred for single-feed posts)
const result = await feed.addActivity({ type: 'post', text: 'Hello world' });
// result type: StreamResponse<AddActivityResponse>
// result.activity.id - the created activity's ID (nested inside response)
// result.activity - full ActivityResponse of the created post

// Activities - via FeedsClient (for multi-feed posts)
await client.addActivity({ feeds: ['user:community'], type: 'post', text });

// Delete activity
await client.deleteActivity({ id: activityId });
// Hard delete:
await client.deleteActivity({ id: activityId, hard_delete: true });

// Update activity
await client.updateActivity({ id: activityId, text: 'Updated text' });

// Partial update
await client.updateActivityPartial({ id: activityId, set: { text: 'new' }, unset: ['custom.old_field'] });

// Reactions
await client.addActivityReaction({ activity_id: activityId, type: 'like' });
await client.addActivityReaction({ activity_id: activityId, type: 'like', enforce_unique: true });
await client.deleteActivityReaction({ activity_id: activityId, type: 'like' });

// Comment reactions
await client.addCommentReaction({ id: commentId, type: 'like' });
await client.deleteCommentReaction({ id: commentId, type: 'like' });

// Comments - note: field is `comment`, NOT `text`; uses `object_id`+`object_type`, NOT `activity_id`
const commentResult = await client.addComment({ object_id: activityId, object_type: 'activity', comment: 'Nice post!' });
// commentResult.comment.id - the created comment's ID (nested inside response)
// Replies - parent_id auto-inherits object_id and object_type:
await client.addComment({ parent_id: parentCommentId, comment: 'Reply text' });
// Update comment:
await client.updateComment({ id: commentId, comment: 'Edited text' });
// Delete:
await client.deleteComment({ id: commentId });
await client.deleteComment({ id: commentId, hard_delete: true });

// Bookmarks
await client.addBookmark({ activity_id: activityId });
await client.addBookmark({ activity_id: activityId, folder_id: 'saved' });
await client.deleteBookmark({ activity_id: activityId });

// Follows (via Feed instance) - PREFERRED for UI code
// Calling follow/unfollow on the feed instance keeps the SDK's reactive state
// (useFeedActivities, useOwnFollows, etc.) in sync so the timeline updates immediately.
await timelineFeed.follow('user:tom');
await timelineFeed.unfollow('user:tom');

// Follows (via FeedsClient) - server-side or non-reactive contexts only
// WARNING: client.follow() updates the server but does NOT notify hooks/providers.
// The timeline feed's useFeedActivities() will NOT refresh. Do NOT use this in
// components that display feed data - use feed.follow() instead.
await client.follow({ source: 'timeline:alice', target: 'user:tom' });
await client.unfollow({ source: 'timeline:alice', target: 'user:tom' });

// File uploads
await client.uploadImage({ file: fileObject });
await client.uploadFile({ file: fileObject });

// Activity feedback (hide/report) - uses boolean flags, NOT a `type` field
await client.activityFeedback({ activity_id: activityId, hide: true });
// Also available: show_less: true, show_more: true

// Pin/unpin - via FeedsClient (requires feed_group_id + feed_id separately)
await client.pinActivity({ activity_id: activityId, feed_group_id: 'user', feed_id: 'community' });
await client.unpinActivity({ activity_id: activityId, feed_group_id: 'user', feed_id: 'community' });
// Or via Feed instance (feed context is implicit):
await feed.pinActivity({ activity_id: activityId });
await feed.unpinActivity({ activity_id: activityId });

// Query feeds
await client.queryFeeds({ filter: { ... }, limit: 25 });
```

### React Hooks

**Hook overloads:** Most hooks have two overloads. Pass `feed` explicitly for a guaranteed return type. Omit `feed` (uses `<StreamFeed>` context) and the return type may be `T | undefined` if no provider exists.

**Async pagination:** All `loadNextPage` functions are async (`() => Promise<void>`). They **cannot** be passed directly to `onClick` handlers - wrap them: `onClick={() => loadNextPage()}`.

| Hook | Returns | Notes |
|---|---|---|
| `useCreateFeedsClient({ apiKey, tokenOrProvider, userData, options? })` | `FeedsClient \| null` | Handles `connectUser()` internally. Returns `null` until connected. |
| `useFeedsClient()` | `FeedsClient \| undefined` | Returns client from `<StreamFeeds>` context. `undefined` if no provider - always guard before calling methods. |
| `useFeedActivities(feed?)` | `{ activities?, is_loading?, has_next_page?, loadNextPage }` | **All fields except `loadNextPage` are optional (`T \| undefined`).** `loadNextPage` is `() => Promise<void>`. |
| `useActivityComments({ feed?, activity?, parentComment? })` | `{ comments, has_next_page, is_loading_next_page, loadNextPage, comments_pagination }` | **`comments` starts as `undefined` - you MUST call `loadNextPage()` once on mount to trigger initial fetch.** Pass `feed` and `activity` explicitly. `loadNextPage` is `(request?) => Promise<void>`. |
| `useFollowers(feed?)` | `{ followers?, follower_count?, has_next_page, is_loading_next_page, loadNextPage }` | With required `feed`: always returns data. Without: may return `undefined`. |
| `useFollowing(feed?)` | `{ following?, following_count?, has_next_page, is_loading_next_page, loadNextPage }` | Same overload pattern as `useFollowers`. |
| `useMembers(feed?)` | `{ members?, member_count?, has_next_page, is_loading_next_page, loadNextPage }` | Feed members |
| `useFeedMetadata(feed?)` | `{ created_by, follower_count, following_count, created_at, updated_at } \| undefined` | Feed metadata |
| `useOwnFollows(feed?)` | `{ own_follows } \| undefined` | Feeds the current user owns that follow this feed |
| `useOwnFollowings(feed?)` | `{ own_followings } \| undefined` | Feeds the feed owner follows that the current user owns |
| `useOwnCapabilities(feed?)` | `readonly FeedOwnCapability[]` | Current user's capabilities on this feed |
| `useAggregatedActivities(feed)` | `{ aggregated_activities, is_loading, has_next_page, loadNextPage }` | For notification/aggregated feeds. With required `feed`: guaranteed. Without: `T \| undefined`. |
| `useNotificationStatus(feed?)` | `{ unread, unseen, last_read_at, last_seen_at, read_activities, seen_activities }` | For notification feeds. Same overload pattern. |
| `useClientConnectedUser()` | `ConnectedUser \| undefined` | Currently connected user |
| `useWsConnectionState()` | `{ is_healthy: boolean \| undefined }` | WebSocket connection health |

### Provider Components

| Component | Props | Purpose |
|---|---|---|
| `<StreamFeeds client={client}>` | `client: FeedsClient` | Top-level provider - wraps the entire app |
| `<StreamFeed feed={feed}>` | `feed: Feed` | Per-feed provider - enables context hooks |
| `<StreamActivityWithStateUpdates activityWithStateUpdates={awsu}>` | `activityWithStateUpdates: ActivityWithStateUpdates` | For activity detail pages. Create with `client.activityWithStateUpdates(id)`. **NOT `activityId` - requires the full object.** |

### Real-time Events

```ts
// On a Feed instance (returns unsubscribe function):
const unsub = feed.on('feeds.activity.added', (event) => { /* new activity */ });
feed.on('feeds.comment.added', (event) => { /* new comment */ });
feed.on('feeds.activity.reaction.added', (event) => { /* new reaction */ });
feed.on('feeds.bookmark.added', (event) => { /* bookmark added */ });

// On FeedsClient:
client.on('feeds.follow.created', (event) => { /* new follow */ });
client.on('connection.changed', (event) => { /* connection state */ });
client.on('moderation.flagged', (event) => { /* content flagged */ });
```

### Gotchas

- **`activity.user`** - the author. NOT `activity.actor` (does not exist in v3).
- **`activity.reaction_groups`** - reactions grouped by type. Each value: `{ count, first_reaction_at, last_reaction_at }`. NOT `reaction_counts`.
- **`activity.own_reactions`** - flat `FeedsReactionResponse[]` array. Check with `.some(r => r.type === 'like')`. NOT a Record keyed by type.
- **`activity.own_bookmarks`** - `BookmarkResponse[]`. Check `.length > 0` for bookmarked state.
- **`addComment()`** uses `{ object_id, object_type, comment }` - NOT `{ activity_id, text }`.
- **`deleteActivity()`** uses `{ id }` - NOT `{ activity_id }`.
- **`deleteComment()`** uses `{ id }` - NOT `{ comment_id }`.
- **`addCommentReaction()`** uses `{ id, type }` where `id` is the comment ID.
- **`useCreateFeedsClient()`** handles `connectUser()` internally - do NOT call `connectUser()` separately.
- **`useFeedsClient()` returns `FeedsClient | undefined`** - NOT `null`. Always guard before calling methods on it.
- **`useFeedActivities()` returns optional fields** - `activities`, `is_loading`, `has_next_page` are all `T | undefined`.
- **`loadNextPage()` is async** - all pagination functions return `Promise<void>`. Wrap for onClick: `onClick={() => loadNextPage()}`. Do NOT pass directly as an event handler.
- **`feed.addActivity()` returns `StreamResponse<AddActivityResponse>`** - the created activity is at `result.activity`, NOT `result` directly. Access ID via `result.activity.id`.
- **`client.addComment()` returns `StreamResponse<AddCommentResponse>`** - the comment is at `result.comment`, NOT `result` directly.
- **`StreamActivityWithStateUpdates`** takes `activityWithStateUpdates` prop (the full object), NOT `activityId`.
- **No CSS import needed** - SDK is headless.
- **`generateUserToken()`** on server - NOT `createToken()` (deprecated).
- **`useActivityComments()` does NOT auto-load** - `comments` starts as `undefined`. You MUST call `loadNextPage()` once on mount (via `useEffect` + ref guard) to trigger the initial fetch. Without this, comments will never appear.
- **`upsertUsers` takes an array:** `client.upsertUsers([{ id, name, role }])` - NOT keyed by ID.
- **`AggregatedActivityResponse` has no `.id` or `.verb`** - use `.group` as React key, derive verb from `.activities[0].type`. See Key Types above.
- **`feed.follow()` vs `client.follow()` in UI code** - always use `timelineFeed.follow('user:targetId')` in components. `client.follow({ source, target })` updates the server but does NOT trigger hook re-renders - the timeline will stay empty until a manual refresh. The feed instance method keeps `useFeedActivities()` and other hooks in sync.
- **Server-side `StreamClient` vs client-side `FeedsClient`** - on the server (`@stream-io/node-sdk`), all feed operations are namespaced under `client.feeds.*` (e.g. `client.feeds.addActivity()`, `client.feeds.deleteActivity()`). Do NOT use `client.addActivity()` or `client.deleteActivity()` directly - those don't exist on `StreamClient`. The client-side `FeedsClient` (from `@stream-io/feeds-react-sdk`) has methods directly on the client (e.g. `client.addActivity()`).
- **Server-side mutations require `user_id`** - every `client.feeds.*` mutation (addActivity, updateActivity, addComment, addActivityReaction, addBookmark, pinActivity, etc.) needs a `user_id` field. Exception: `deleteActivity` is admin-by-id only. See "Server-side mutations require `user_id`" above for the full list.
