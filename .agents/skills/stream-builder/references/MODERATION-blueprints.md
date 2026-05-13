# Moderation - full component blueprints

Setup, routes, and gotchas: [MODERATION.md](MODERATION.md). Rules: [../../stream/RULES.md](../../stream/RULES.md).

---

## Report Modal

End-user dialog for reporting content or users. Triggered from message/activity context menus.

### Blueprint

```html
<dialog class="report-modal">

  <header class="report-modal__header">
    <h3 class="report-modal__title">Report</h3>
    <button class="report-modal__close" aria-label="Close"></button>
  </header>

  <form class="report-modal__form">
    <p class="report-modal__context">
      <!-- Shows what is being reported: message preview, activity preview, or user name -->
    </p>

    <fieldset class="report-modal__reasons">
      <legend class="report-modal__reasons-label">Why are you reporting this?</legend>
      <label class="report-modal__reason">
        <input type="radio" name="reason" value="spam" />
        Spam
      </label>
      <label class="report-modal__reason">
        <input type="radio" name="reason" value="harassment" />
        Harassment
      </label>
      <label class="report-modal__reason">
        <input type="radio" name="reason" value="inappropriate" />
        Inappropriate content
      </label>
      <label class="report-modal__reason">
        <input type="radio" name="reason" value="other" />
        Other
      </label>
    </fieldset>

    <!-- CONDITIONAL: "other" selected -->
    <textarea class="report-modal__details" placeholder="Provide additional details..." rows="3"></textarea>

    <div class="report-modal__actions">
      <button class="report-modal__cancel" type="button">Cancel</button>
      <button class="report-modal__submit" type="submit" disabled>Report</button>
    </div>
  </form>

  <!-- Success state after submission -->
  <div class="report-modal__success">
    <span class="report-modal__success-icon"></span>
    <p class="report-modal__success-text">Thanks for reporting. We'll review this shortly.</p>
    <button class="report-modal__success-close">Done</button>
  </div>

</dialog>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| Report message (Chat) | - | `client.flagMessage(message.id)` | Flags message for admin review |
| Report user (Chat) | - | `client.flagUser(userId)` | Flags user |
| Report activity (Feeds v1/v2) | - | `client.reactions.add('flag', activity.id, { reason, details })` | Legacy approach - reaction-based flagging |
| Report activity (Feeds v3) | - | Use moderation API (e.g., `client.moderation.flag(...)`) or custom implementation | v3 does not use reaction-based flagging; handle through the moderation API or a custom endpoint |
| Report reason | - | Pass as `reason` param or in custom data | Client-side value from radio selection |
| Report details | - | Include in flag custom data | Optional text from textarea |
| `--submit` enabled | At least one reason selected | - | Client-side validation |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Chat message flagging | - | Available - `client.flagMessage()` always available |
| Chat user flagging | - | Available - `client.flagUser()` always available |
| Feeds flagging (v1/v2) | Reactions enabled on feed group | Use reaction kind `'flag'` or custom moderation API |
| Feeds flagging (v3) | Moderation API or custom endpoint | v3 does not support reaction-based flagging |
| Flag review | Dashboard -> Moderation dashboard | Available - flags appear in admin dashboard |
| Custom reasons | Client-side | No config - include reason in flag custom data |
| Webhook on flag | Dashboard -> Webhooks -> `message.flagged` / `user.flagged` events | Off - enable to notify external systems |

---

## Block / Mute Controls

End-user controls for blocking and muting other users or channels. Typically surfaced in user profile popovers or channel settings.

### Blueprint

```html
<!-- User-level block/mute (in user profile popover or settings) -->
<div class="user-moderation">
  <button class="user-moderation__btn user-moderation__btn--mute" aria-pressed="false">
    <!-- aria-pressed="true" + --active when user is muted -->
    <span class="user-moderation__icon user-moderation__icon--mute"></span>
    Mute user
  </button>
  <button class="user-moderation__btn user-moderation__btn--block" aria-pressed="false">
    <span class="user-moderation__icon user-moderation__icon--block"></span>
    Block user
  </button>
</div>

<!-- Channel-level mute (in channel settings) -->
<div class="channel-moderation">
  <button class="channel-moderation__btn channel-moderation__btn--mute" aria-pressed="false">
    <span class="channel-moderation__icon channel-moderation__icon--mute"></span>
    Mute channel
    <!-- Muted channels don't trigger notifications; still visible in channel list with --muted modifier -->
  </button>
</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| Mute user (Chat) | `client.mutedUsers` | `client.muteUser(userId)` | `client.mutedUsers[]` - array of `{ target, created_at }` |
| Unmute user (Chat) | `client.mutedUsers` | `client.unmuteUser(userId)` | - |
| Block user (1:1) | - | `client.blockUser(userId)` | Hides DM channels, stops push notifications - for 1:1 blocking between end users |
| Unblock user (1:1) | - | `client.unBlockUser(userId)` | Reverses `blockUser` - restores DM visibility |
| Ban user (channel) | - | `channel.banUser(userId)` | Prevents posting in the channel - different from 1:1 blocking |
| Unban user (channel) | - | `channel.unbanUser(userId)` | - |
| Ban user (global) | - | `client.banUser(userId, { banned_by_id: currentUserId })` | Global ban across all channels |
| Shadow ban (channel) | - | `channel.shadowBan(userId)` | User can post but messages only visible to them |
| Remove shadow ban | - | `client.removeShadowBan(userId)` or `channel.removeShadowBan(userId)` | Reverses shadow ban |
| Mute channel | `client.mutedChannels` | `channel.mute()` | `client.mutedChannels[]` |
| Unmute channel | `client.mutedChannels` | `channel.unmute()` | - |
| Check if muted | `client.mutedUsers.find(m => m.target.id === userId)` | - | Truthy = muted |
| Check channel muted | `channel.muteStatus()` | - | Returns `{ muted, createdAt, expiresAt }` |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| User mute | - | Available - muted user's messages hidden client-side |
| User block (1:1) | - | Available - `client.blockUser()` hides DM channels and stops push |
| User ban (channel) | User must have `'ban-members'` capability | Admins/moderators by default |
| User ban (global) | Server-side only or admin user | Requires server auth |
| Channel mute | - | Available - suppresses notifications, channel still accessible |
| Shadow ban | `channel.shadowBan(userId)` | Available - user can post but messages only visible to them |
| Remove shadow ban | `client.removeShadowBan(userId)` or `channel.removeShadowBan(userId)` | Available - reverses shadow ban |

---

## Review Queue

Admin interface for reviewing flagged content. Shows all pending flags with content preview and moderation actions.

### Blueprint

```html
<div class="review-queue">

  <header class="review-queue__header">
    <h2 class="review-queue__title">Moderation Queue</h2>
    <div class="review-queue__filters">
      <select class="review-queue__filter review-queue__filter--type">
        <option value="all">All</option>
        <option value="message">Messages</option>
        <option value="user">Users</option>
        <option value="activity">Activities</option>
      </select>
      <select class="review-queue__filter review-queue__filter--status">
        <option value="pending">Pending</option>
        <option value="reviewed">Reviewed</option>
        <option value="all">All</option>
      </select>
    </div>
    <span class="review-queue__pending-count"></span>
  </header>

  <div class="review-queue__list">
    <div class="review-queue__item">
      <!-- Insert Flagged Item component -->
    </div>
  </div>

  <!-- States: review-queue__loading, review-queue__empty ("No items to review"), review-queue__error -->

  <!-- Pagination -->
  <button class="review-queue__load-more">Load more</button>

</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| `review-queue__list` | `client.moderation.queryReviewQueue(filterConditions, sort, options)` | - | Returns review queue items. Example: `client.moderation.queryReviewQueue({ entity_type: "stream:chat:v1:message" }, [{ field: "created_at", direction: -1 }], { next: null })` |
| `review-queue__filter--type` | Filter via `entity_type` in `filterConditions` | - | e.g. `"stream:chat:v1:message"` for messages, `"stream:user"` for users |
| `review-queue__filter--status` | Filter via `status` in `filterConditions` | - | e.g. `{ status: "pending" }` or `{ status: "reviewed" }` |
| `review-queue__pending-count` | Review queue response | - | Total count from query |
| Pagination | `client.moderation.queryReviewQueue(filterConditions, sort, { next: cursor })` | - | Cursor-based pagination using `next` from previous response |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Review queue queries | Server-side auth (server token) or admin user | Requires elevated permissions |
| Query review queue | `client.moderation.queryReviewQueue()` | Available - unified API for all flagged entity types |
| Webhook integration | Dashboard -> Webhooks -> flag events | Optional - for external notification |

---

## Flagged Item

Individual flagged content card in the review queue. Shows content, reporter info, and moderation actions.

### Blueprint

```html
<div class="flagged-item">
  <!-- Modifiers: --message | --user | --activity | --reviewed | --auto-flagged -->

  <div class="flagged-item__meta">
    <span class="flagged-item__type">
      <!-- "Flagged message" / "Flagged user" / "Auto-moderated" -->
    </span>
    <time class="flagged-item__time" datetime=""></time>
    <span class="flagged-item__reporter">
      Reported by <a class="flagged-item__reporter-link" href=""></a>
    </span>
    <!-- CONDITIONAL: auto-moderation flag -->
    <span class="flagged-item__auto-reason">
      <!-- e.g. "Blocked word detected", "Toxic content (AI)", "Spam detected" -->
    </span>
  </div>

  <!-- The flagged content itself -->
  <div class="flagged-item__content">
    <!-- CONDITIONAL: flagged message -->
    <div class="flagged-item__message">
      <img class="flagged-item__author-avatar" src="" alt="" />
      <div class="flagged-item__message-body">
        <span class="flagged-item__author-name"></span>
        <p class="flagged-item__message-text"></p>
        <!-- CONDITIONAL: message has attachments -->
        <div class="flagged-item__message-attachments">
          <!-- Preview of images/files -->
        </div>
      </div>
    </div>

    <!-- CONDITIONAL: flagged user -->
    <div class="flagged-item__user">
      <img class="flagged-item__user-avatar" src="" alt="" />
      <div class="flagged-item__user-info">
        <span class="flagged-item__user-name"></span>
        <span class="flagged-item__user-id"></span>
        <span class="flagged-item__user-flags-count">Flagged 3 times</span>
      </div>
    </div>
  </div>

  <!-- Context: surrounding messages or recent activity -->
  <details class="flagged-item__context">
    <summary class="flagged-item__context-toggle">View context</summary>
    <div class="flagged-item__context-messages">
      <!-- 2-3 messages before and after the flagged message -->
    </div>
  </details>

  <!-- Moderation actions -->
  <div class="flagged-item__actions">
    <button class="flagged-item__action flagged-item__action--dismiss">Dismiss</button>
    <button class="flagged-item__action flagged-item__action--delete">Delete content</button>
    <button class="flagged-item__action flagged-item__action--warn">Warn user</button>
    <button class="flagged-item__action flagged-item__action--mute">Mute user</button>
    <button class="flagged-item__action flagged-item__action--ban">Ban user</button>
    <!-- OPTIONAL: duration selector for timed bans -->
    <select class="flagged-item__ban-duration">
      <option value="0">Permanent</option>
      <option value="1h">1 hour</option>
      <option value="24h">24 hours</option>
      <option value="7d">7 days</option>
      <option value="30d">30 days</option>
    </select>
  </div>

</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| `flagged-item__time` | Flag data | - | `flag.created_at` - **nanosecond epoch** in review queue items, divide by `1e6` for `new Date()` |
| `flagged-item__reporter` | Flag data | - | `flag.user.name` (reporter) |
| `flagged-item__message-text` | Flag data | - | See content preview branching below |
| `flagged-item__author-name` | Flag data | - | `flag.target_message.user.name` or `item.entity_creator_id` |
| `flagged-item__user-name` | Flag data | - | `flag.target_user.name` |
| `flagged-item__auto-reason` | Flag data | - | `flag.reason` or auto-mod result details |

**Content preview branching (review queue):** The review queue contains three different entity types with different content locations:
- **Chat messages** (`entity_type` includes `"chat"`): content is in `item.message.text`
- **Feed activities** (`entity_type` includes `"feed"` or other non-chat): content is in `item.moderation_payload.texts[0]`
- **User entities** (`entity_type` includes `"user"`): no text content - show `User: ${item.entity_id}` as fallback

Use `entity_type.includes("chat")` to branch, NOT exact string matching (chat entity_type is `stream:chat:v1:message`, not `stream:chat:message`).
| Context messages | `channel.query({ messages: { id_around: messageId, limit: 5 } })` | - | Surrounding messages |
| Dismiss | - | `client.moderation.submitAction({ action_type: "mark_reviewed", item_id })` | Marks the flagged item as reviewed/dismissed |
| Delete content | - | `client.moderation.submitAction({ action_type: "delete_message", item_id, delete_message: { hard_delete: false } })` | Soft delete via moderation action. Set `hard_delete: true` for permanent removal |
| Warn user | - | Custom: send system message or notification to user | App-specific implementation |
| Mute user | - | `client.muteUser(userId, null, { timeout: durationMinutes })` | Second arg is muter user ID (`null` for current user). Optional timeout |
| Ban user | - | `client.moderation.submitAction({ action_type: "ban", item_id, ban: { reason, channel_ban_only } })` | Supports `delete_messages: "soft"` or `"hard"` to also delete the user's messages |
| Shadow ban | - | `client.shadowBan(userId, { timeout: durationMinutes })` | User unaware of ban |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Flag queries | Server-side auth or admin user | Required |
| Hard delete | Server-side auth | Required - client-side delete is soft delete |
| Ban with duration | - | Available - `timeout` in minutes, `0` = permanent |
| Shadow ban | - | Available - `client.shadowBan()` |
| Auto-moderation | Dashboard -> Moderation -> AI moderation / Blocked words | Off - enable per channel type |
| Context loading | `channel.query()` with `id_around` | Available |

---

## Auto-Moderation Status

Indicator shown on messages that were auto-flagged or bounced by auto-moderation rules. Also used for "message pending review" states.

### Blueprint

```html
<!-- CONDITIONAL: message was bounced by auto-mod (only visible to message author) -->
<div class="automod-bounce">
  <span class="automod-bounce__icon"></span>
  <p class="automod-bounce__text">Your message was flagged for review and is not visible to others.</p>
  <div class="automod-bounce__actions">
    <button class="automod-bounce__action automod-bounce__action--edit">Edit message</button>
    <button class="automod-bounce__action automod-bounce__action--delete">Delete message</button>
  </div>
</div>

<!-- CONDITIONAL: message is pending moderation review (visible to moderators) -->
<div class="automod-pending">
  <span class="automod-pending__badge">Pending review</span>
  <!-- Message content shown normally, with badge overlay -->
  <div class="automod-pending__actions">
    <button class="automod-pending__action automod-pending__action--approve">Approve</button>
    <button class="automod-pending__action automod-pending__action--reject">Reject</button>
  </div>
</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| Bounce state | Message state | - | `message.moderation_details.action === 'bounce'` - note: raw API may return this under `message.moderation`; SDK normalizes to `message.moderation_details` |
| Pending state | Message state | - | `message.moderation_details.action === 'flag'` and `message.state === 'pending'` - same property path note as above |
| Edit bounced message | - | `client.updateMessage({ id: message.id, text: editedText })` | Resubmits for moderation |
| Delete bounced message | - | `client.deleteMessage(message.id)` | - |
| Approve pending | - | `client.commitMessage(message.id)` | Makes message visible to all. **Requires server-side auth (server token)** - cannot be called from client-side SDKs |
| Reject pending | - | `client.deleteMessage(message.id, { hardDelete: true })` | Permanently removes |
| Auto-mod reason | Message state | - | `message.moderation_details.harms[].name` - e.g. `'toxicity'`, `'spam'` |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Auto-moderation | Dashboard -> Channel Type -> Moderation -> enable AI or semantic filters | Off |
| Bounce behavior | Dashboard -> Moderation -> "Bounce" action configured | Off - alternatives: "Flag" (send + flag) or "Block" (reject silently) |
| Pending review | "Flag" action configured with pre-publish moderation | Off |
| Commit message | Server-side auth or moderator user | Required for approve action |

---

## Blocked Users List

End-user settings page showing users they've blocked or muted, with unblock/unmute actions.

### Blueprint

```html
<div class="blocked-list">

  <header class="blocked-list__header">
    <h3 class="blocked-list__title">Blocked & Muted</h3>
  </header>

  <!-- Tab toggle -->
  <div class="blocked-list__tabs">
    <button class="blocked-list__tab blocked-list__tab--active" data-tab="blocked">Blocked</button>
    <button class="blocked-list__tab" data-tab="muted">Muted</button>
  </div>

  <div class="blocked-list__items">
    <div class="blocked-list__item">
      <img class="blocked-list__item-avatar" src="" alt="" />
      <div class="blocked-list__item-info">
        <span class="blocked-list__item-name"></span>
        <time class="blocked-list__item-since"></time>
        <!-- CONDITIONAL: muted with expiry -->
        <span class="blocked-list__item-expires">Expires in 3 days</span>
      </div>
      <button class="blocked-list__item-action">
        <!-- "Unblock" or "Unmute" depending on active tab -->
      </button>
    </div>
  </div>

  <!-- States: blocked-list__empty ("You haven't blocked anyone") -->

</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| Blocked users | `client.queryBannedUsers({ filter_conditions: { banned_by_id: currentUserId } })` | - | Returns `{ bans: [...] }` |
| Muted users | `client.mutedUsers` | - | Available on `client.connectUser()` response |
| Muted channels | `client.mutedChannels` | - | Available on `client.connectUser()` response |
| `blocked-list__item-since` | Ban/mute data | - | `ban.created_at` or `mute.created_at` |
| `blocked-list__item-expires` | Mute/ban data | - | `mute.expires` or `ban.expires` - null if permanent |
| Unblock | - | `client.unbanUser(userId)` | - |
| Unmute | - | `client.unmuteUser(userId)` | - |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Query banned users | `client.queryBannedUsers()` | Available |
| Muted users list | `client.mutedUsers` | Populated on connect |
| Muted channels list | `client.mutedChannels` | Populated on connect |
