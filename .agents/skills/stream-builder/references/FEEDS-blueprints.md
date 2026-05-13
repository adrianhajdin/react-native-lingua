# Feeds v3 - Full Component Blueprints

Setup, routes, and gotchas: [FEEDS.md](FEEDS.md). Rules: [../../stream/RULES.md](../../stream/RULES.md).

The Feeds SDK is **headless** - all components below are built entirely with your own UI (Shadcn/Tailwind). The SDK provides hooks and state management only.

---

## Post Composer

Text input for creating new activities. Includes avatar, textarea, and post button.

### Blueprint

```html
<div class="post-composer">
  <div class="post-composer__row">
    <img class="post-composer__avatar" src="" alt="" />
    <div class="post-composer__body">
      <textarea class="post-composer__input" placeholder="What's on your mind?"></textarea>
      <div class="post-composer__actions">
        <!-- OPTIONAL: attachment button -->
        <button class="post-composer__attach" aria-label="Add attachment"></button>
        <button class="post-composer__submit" disabled>Post</button>
      </div>
    </div>
  </div>
</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| `--avatar` | Current user | - | `userId` from auth state (first letter for fallback) |
| `--input` | - | Local state | Controlled textarea. **Use the Shadcn `<Textarea>` component with its default styling (border, focus ring, background).** Do NOT strip defaults with `border-0`, `bg-transparent`, `shadow-none`, or `focus-visible:ring-0` - the textarea should look like a standard input inside the card. |
| `--submit` enabled | Text is non-empty | `feed.addActivity({ type: 'post', text })` | Returns `StreamResponse<AddActivityResponse>` - created activity at `result.activity` |
| `--attach` (optional) | - | `client.uploadImage({ file })` or `client.uploadFile({ file })` -> include URL in `attachments` | `FeedsClient.uploadImage()` / `FeedsClient.uploadFile()` |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Post to feed | Feed instance from `client.feed(group, id)` with `getOrCreate({ watch: true })` | Required |
| File uploads | - | Available via `client.uploadImage()` / `client.uploadFile()` |

---

## Post Card

Individual activity card showing author, content, reactions, comments, and actions.

### Blueprint

```html
<div class="post-card">

  <div class="post-card__header">
    <img class="post-card__avatar" src="" alt="" />
    <div class="post-card__meta">
      <span class="post-card__author"></span>
      <time class="post-card__time" datetime=""></time>
    </div>
    <button class="post-card__menu" aria-label="More options">
      <!-- Dropdown: Delete (own post) or Report (other's post) -->
    </button>
  </div>

  <div class="post-card__content">
    <p class="post-card__text"></p>
    <!-- CONDITIONAL: has attachments -->
    <div class="post-card__attachments">
      <!-- Images, files, etc. -->
    </div>
  </div>

  <!-- CONDITIONAL: has poll -->
  <div class="post-card__poll">
    <!-- Poll component -->
  </div>

  <div class="post-card__actions">
    <button class="post-card__action post-card__action--like" aria-pressed="false">
      <!-- aria-pressed="true" when user has liked -->
      <span class="post-card__action-icon"></span>
      <span class="post-card__action-count"></span>
    </button>
    <button class="post-card__action post-card__action--comment">
      <span class="post-card__action-icon"></span>
      <span class="post-card__action-count"></span>
    </button>
    <button class="post-card__action post-card__action--bookmark" aria-pressed="false">
      <span class="post-card__action-icon"></span>
    </button>
  </div>

  <!-- CONDITIONAL: comments expanded -->
  <div class="post-card__comments">
    <!-- Comments Section component -->
  </div>

</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| `--avatar` | `activity.user` | - | `activity.user.image` or first letter of `activity.user.name ?? activity.user.id` |
| `--author` | `activity.user` | - | `activity.user.name ?? activity.user.id` |
| `--time` | `activity.created_at` | - | `Date` - format as relative time |
| `--text` | `activity.text` | - | `activity.text` (optional - may be undefined) |
| `--attachments` | `activity.attachments` | - | `Attachment[]` with `.type`, `.image_url`, `.asset_url` |
| Like count | `activity.reaction_groups` | - | `activity.reaction_groups?.like?.count ?? 0` |
| Has liked | `activity.own_reactions` | - | `activity.own_reactions.some(r => r.type === 'like')` |
| Like toggle | - | `client.addActivityReaction({ activity_id, type: 'like' })` / `client.deleteActivityReaction({ activity_id, type: 'like' })` | Toggle based on `hasLiked`. Guard: `const client = useFeedsClient(); if (!client) return null;` |
| Comment count | `activity.comment_count` | - | `activity.comment_count` (number) |
| Has bookmarked | `activity.own_bookmarks` | - | `activity.own_bookmarks.length > 0` |
| Bookmark toggle | - | `client.addBookmark({ activity_id })` / `client.deleteBookmark({ activity_id })` | Toggle based on `hasBookmarked` |
| Delete (own) | - | `client.deleteActivity({ id: activity.id })` | Only show for own posts (`activity.user.id === currentUserId`) |
| Report (other's) | - | See Report Modal | Only show for other users' posts |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Like reactions | - | Available - `addActivityReaction` always available |
| Bookmarks | - | Available - `addBookmark` always available |
| Delete activity | User must be activity author or admin | Authors can delete own activities |
| Comments | Feed must have comments enabled | Enabled by default |

---

## Comments Section

Inline comments for an activity, with a comment input.

### Blueprint

```html
<div class="comments-section">

  <div class="comments-section__list">
    <div class="comments-section__item">
      <img class="comments-section__avatar" src="" alt="" />
      <div class="comments-section__body">
        <div class="comments-section__meta">
          <span class="comments-section__author"></span>
          <time class="comments-section__time" datetime=""></time>
        </div>
        <p class="comments-section__text"></p>
      </div>
    </div>
  </div>

  <!-- CONDITIONAL: has more comments -->
  <button class="comments-section__load-more">Load more comments</button>

  <div class="comments-section__input-row">
    <img class="comments-section__input-avatar" src="" alt="" />
    <input class="comments-section__input" placeholder="Write a comment..." />
    <button class="comments-section__submit" disabled aria-label="Send"></button>
  </div>

</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| Comments list | `useActivityComments({ feed, activity })` | - | Returns `{ comments, has_next_page, is_loading_next_page, loadNextPage }`. **`comments` starts as `undefined` - MUST call `loadNextPage()` once on mount (useEffect + ref guard) to trigger initial fetch.** |
| `--author` | `comment.user` | - | `comment.user.name ?? comment.user.id` |
| `--time` | `comment.created_at` | - | `Date` - format as relative time |
| `--text` | `comment.text` | - | `comment.text` (optional) |
| `--load-more` | `has_next_page` | `onClick={() => loadNextPage()}` | `loadNextPage` is async `(request?) => Promise<void>` - wrap for onClick, do NOT pass directly |
| `--submit` | - | `client.addComment({ object_id: activity.id, object_type: 'activity', comment: text })` | Returns `StreamResponse<AddCommentResponse>` - comment at `result.comment`. Field is `comment`, NOT `text`; uses `object_id` + `object_type`, NOT `activity_id` |
| Reply to comment | - | `client.addComment({ parent_id: comment.id, comment: text })` | `parent_id` auto-inherits `object_id` and `object_type` from parent |
| Delete comment | - | `client.deleteComment({ id: comment.id })` | Only for own comments or admins |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Load comments | Feed + activity passed to `useActivityComments()`. **Must call `loadNextPage()` on mount** - hook does NOT auto-fetch. Use `useEffect` + `useRef` guard to call once. | Required |
| Add comments | - | Available via `client.addComment()` |
| Nested replies | Pass `parent_id` to `addComment()` | Available |
| Real-time updates | Feed must be watched (`getOrCreate({ watch: true })`) | Comments appear in real-time when watched |

---

## Feed List

Scrollable list of activities from a feed, with loading and empty states.

### Blueprint

```html
<div class="feed-list">

  <!-- Loading state -->
  <div class="feed-list__loading">
    <span class="feed-list__spinner"></span>
  </div>

  <!-- Empty state -->
  <div class="feed-list__empty">
    <span class="feed-list__empty-icon"></span>
    <p class="feed-list__empty-text">No posts yet. Be the first to share something!</p>
  </div>

  <!-- Activities -->
  <div class="feed-list__items">
    <div class="feed-list__item">
      <!-- Post Card component -->
    </div>
  </div>

  <!-- CONDITIONAL: has more activities -->
  <button class="feed-list__load-more">Load more</button>

</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| Activities | `useFeedActivities(feed)` | - | Returns `{ activities?, is_loading?, has_next_page?, loadNextPage }`. **All fields except `loadNextPage` are optional (`T \| undefined`).** |
| Loading state | `is_loading` | - | Show spinner when `is_loading === true` |
| Empty state | `activities` | - | Show when `!is_loading && (!activities \|\| activities.length === 0)` |
| `--load-more` | `has_next_page` | `onClick={() => loadNextPage()}` | `loadNextPage` is async `() => Promise<void>` - wrap for onClick, do NOT pass directly |
| Each item | `activities[i]` | - | `ActivityResponse` - pass to Post Card |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Feed data | `<StreamFeed feed={feed}>` wrapper or pass `feed` to hook directly | Required - hook reads from context or prop |
| Real-time | Feed created with `getOrCreate({ watch: true })` | New activities appear automatically |
| Pagination | - | Cursor-based via `loadNextPage()` |

---

## Follow Button

Toggle button to follow/unfollow a user's feed.

### Blueprint

```html
<button class="follow-btn" aria-pressed="false">
  <!-- aria-pressed="true" + --following modifier when following -->
  Follow
</button>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| Is following | `useOwnFollows(feed)` | - | `own_follows?.some(f => f.target === targetFid)` - check if any of current user's feeds follow this one |
| Follow | - | `feed.follow('user:targetId')` | On the current user's **timeline feed instance**. Do NOT use `client.follow()` - it won't update reactive hook state. |
| Unfollow | - | `feed.unfollow('user:targetId')` | On the current user's **timeline feed instance**. Do NOT use `client.unfollow()`. |
| Follower count | `useFeedMetadata(feed)` | - | `follower_count` |
| Following count | `useFeedMetadata(feed)` | - | `following_count` |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Follow/unfollow | Feed instance required | Available |
| Follow count | Feed must be loaded with `getOrCreate()` | Populated on load |

---

## Notification Feed

Aggregated notifications for reactions, comments, follows, and mentions.

### Blueprint

```html
<div class="notification-feed">

  <div class="notification-feed__header">
    <h2 class="notification-feed__title">Notifications</h2>
    <span class="notification-feed__badge"></span>
  </div>

  <div class="notification-feed__list">
    <div class="notification-feed__group">
      <!-- Modifier: --unread | --unseen -->
      <div class="notification-feed__group-header">
        <span class="notification-feed__group-verb"></span>
        <time class="notification-feed__group-time" datetime=""></time>
      </div>
      <div class="notification-feed__group-activities">
        <!-- Individual notification items -->
      </div>
    </div>
  </div>

</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| Aggregated activities | `useAggregatedActivities(feed)` | - | Returns `{ aggregated_activities, is_loading, has_next_page, loadNextPage }`. `loadNextPage` is async - wrap for onClick. |
| Unread/unseen counts | `useNotificationStatus(feed)` | - | `{ unread, unseen, last_read_at, last_seen_at }` |
| Badge count | `useNotificationStatus(feed)` | - | `unseen` or `unread` count |
| React key | `aggregatedActivity.group` | - | String identifier - use as `key` prop. **There is no `.id` property.** |
| Group verb (derived) | `aggregatedActivity.activities[0].type` | - | Derive verb from first activity's type, e.g. `"like"`, `"comment"`, `"post"`. **There is no `.verb` property on `AggregatedActivityResponse`.** |
| Group actors | `aggregatedActivity.activities` | - | `ActivityResponse[]` - array of activities in this group |
| Mark read/seen | - | `feed.markActivity({ mark_read: [activityId], mark_seen: [activityId] })` | Via `Feed` API. Also: `feed.markActivity({ mark_all_read: true, mark_all_seen: true })` to mark all. |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Notification feed | Feed group with `notification` config (`track_seen`, `track_read`) | `notification` group has this by default |
| Aggregation | Feed group with `aggregation.format` configured | `notification` group has default format |
| Real-time | Feed created with `getOrCreate({ watch: true })` | Badge updates in real-time |

---

## User Profile Card

User info with follow button, follower/following counts, and recent activity.

### Blueprint

```html
<div class="user-profile">
  <img class="user-profile__avatar" src="" alt="" />
  <h3 class="user-profile__name"></h3>
  <div class="user-profile__stats">
    <span class="user-profile__stat">
      <strong class="user-profile__stat-count"></strong> followers
    </span>
    <span class="user-profile__stat">
      <strong class="user-profile__stat-count"></strong> following
    </span>
  </div>
  <!-- Follow Button component -->
  <div class="user-profile__feed">
    <!-- Feed List filtered to this user's activities -->
  </div>
</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| Avatar | User data | - | `user.image` or initial letter |
| Name | User data | - | `user.name ?? user.id` |
| Followers count | `useFeedMetadata(userFeed)` | - | `follower_count` |
| Following count | `useFeedMetadata(userFeed)` | - | `following_count` |
| User's activities | `useFeedActivities(userFeed)` | - | Activities on the user's personal feed |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| User feed | `client.feed('user', userId)` with `getOrCreate()` | Required |
| Metadata | Returned by `getOrCreate()` response | Populated on load |

---

## Live Activity Card

Used in livestreaming apps (Video + Feeds). A live activity represents an active stream and appears at the top of the feed, separate from regular posts.

### Blueprint

```html
<!-- CONDITIONAL: activity.type === "live" - render LiveCard instead of standard Post Card -->
<div class="live-card">
  <div class="live-card__badge">
    <span class="live-card__dot"></span> <!-- Pulsing red dot via CSS animation -->
    LIVE
  </div>
  <div class="live-card__info">
    <img class="live-card__avatar" src="" alt="" />
    <div class="live-card__meta">
      <span class="live-card__author"></span>
      <span class="live-card__title"></span>
    </div>
  </div>
  <button class="live-card__watch">Watch</button>
</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| Live activities | `useFeedActivities(feed)` - filter by `type === "live"` | - | `activity.type === "live"` |
| `live-card__author` | Activity data | - | `activity.user.name` |
| `live-card__title` | Activity data | - | `activity.text` |
| `live-card__watch` | - | Navigate to watch view | `activity.custom.callId` |
| Go Live (create, client-side) | - | `feed.addActivity({ type: 'live', text: title, custom: { callId } })` | Returns `StreamResponse<AddActivityResponse>` - save `result.activity.id` for cleanup |
| Go Live (create, server-side) | - | `client.feeds.addActivity({ feeds: ['user:' + userId], type: 'live', text: title, custom: { callId } })` | Server route (`/api/feed/live`). `client.feeds.*` - NOT `client.*` directly. Returns `{ activity: { id } }` |
| End Stream (remove, client-side) | - | `client.deleteActivity({ id: liveActivityId })` | Use the activity ID saved from Go Live |
| End Stream (remove, server-side) | - | `client.feeds.deleteActivity({ id: liveActivityId })` | Server route. `client.feeds.*` - NOT `client.*` directly |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Live activity type | Use `type: "live"` to distinguish from posts | Convention - not enforced by API |
| Custom fields | Store `callId` in `activity.custom` to link feed activity to video call | - |
| Rendering | Feed List should partition activities: `type === "live"` at top, rest below | Client-side logic |
