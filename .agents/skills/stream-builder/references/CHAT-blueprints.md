# Chat - full component blueprints

Setup, routes, and gotchas: [CHAT.md](CHAT.md). Rules: [../../stream/RULES.md](../../stream/RULES.md).

---

## Full blueprints (load on demand)

---

## Channel List

Sidebar listing channels the user belongs to. Shows last message preview, unread count, and online presence.

### Blueprint

```html
<div class="channel-list">

  <div class="channel-list__header">
    <img class="channel-list__user-avatar" src="" alt="" />
    <h2 class="channel-list__title">Messages</h2>
    <button class="channel-list__compose" aria-label="New message"></button>
  </div>

  <!-- OPTIONAL: search -->
  <div class="channel-list__search">
    <input class="channel-list__search-input" type="search" placeholder="Search" />
  </div>

  <div class="channel-list__items" role="listbox">

    <button class="channel-list__item channel-list__item--active" role="option" aria-selected="true">
      <!-- Modifiers: --active (selected), --unread (has unread), --muted -->
      <div class="channel-list__item-avatar">
        <img src="" alt="" />
        <!-- CONDITIONAL: 1:1 channel -> other user's avatar; group -> channel image or stacked avatars -->
        <!-- CONDITIONAL: other user is online -->
        <span class="channel-list__item-presence channel-list__item-presence--online"></span>
      </div>
      <div class="channel-list__item-content">
        <div class="channel-list__item-top">
          <span class="channel-list__item-name"></span>
          <time class="channel-list__item-time"></time>
        </div>
        <div class="channel-list__item-bottom">
          <p class="channel-list__item-preview"></p>
          <!-- CONDITIONAL: channel has unread messages -->
          <span class="channel-list__item-unread">3</span>
        </div>
      </div>
    </button>

  </div>

  <!-- States: channel-list__loading (skeleton), channel-list__empty, channel-list__error -->

</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| `channel-list__items` | `client.queryChannels(filter, sort, { watch: true, state: true })` | - | Returns array of `channel` objects |
| `channel-list__item-avatar` (1:1) | Channel members | - | Other member's `user.image` |
| `channel-list__item-avatar` (group) | `channel.data.image` | `channel.update({ image })` | `channel.data.image` |
| `channel-list__item-name` (1:1) | Channel members | - | Other member's `user.name` |
| `channel-list__item-name` (group) | `channel.data.name` | `channel.update({ name })` | `channel.data.name` |
| `channel-list__item-preview` | Channel state | - | `channel.state.messages[last].text` - truncated |
| `channel-list__item-time` | Channel state | - | `channel.state.messages[last].created_at` |
| `channel-list__item-unread` | `channel.countUnread()` | `channel.markRead()` | Returns integer |
| `channel-list__item-presence` | User presence events | - | `user.online` (boolean) |
| `--active` modifier | Client-side selection state | - | Set when user clicks channel |
| New channel | - | `client.channel(type, id, { name, members })` then `channel.watch()` | - |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Channel queries | `client.queryChannels(filter, sort, options)` | Available |
| Real-time updates | `{ watch: true }` in query options | On by default - both `watch` and `state` default to `true` in `queryChannels` |
| Presence | Dashboard -> Channel Type -> "Connect Events" enabled | Off per channel type |
| Unread counts | `channel.countUnread()` | Available - relies on `channel.markRead()` being called |
| Search | `client.search(filter, query)` or `client.queryChannels` with name filter | Available |

---

## Channel Header

Top bar of an active channel. Shows channel identity, members, and actions.

### Blueprint

```html
<header class="channel-header">

  <div class="channel-header__info">
    <img class="channel-header__avatar" src="" alt="" />
    <!-- CONDITIONAL: 1:1 -> presence dot on avatar -->
    <span class="channel-header__presence channel-header__presence--online"></span>
    <div class="channel-header__meta">
      <h3 class="channel-header__name"></h3>
      <!-- CONDITIONAL: 1:1 channel -> "Online" / "Last seen 2h ago" -->
      <!-- CONDITIONAL: group channel -> "3 members, 2 online" -->
      <span class="channel-header__status"></span>
    </div>
  </div>

  <div class="channel-header__actions">
    <button class="channel-header__action channel-header__action--search" aria-label="Search"></button>
    <button class="channel-header__action channel-header__action--members" aria-label="Members"></button>
    <!-- OPTIONAL: video/audio call -->
    <button class="channel-header__action channel-header__action--call" aria-label="Call"></button>
    <button class="channel-header__action channel-header__action--menu" aria-label="More"></button>
  </div>

</header>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| `channel-header__avatar` | `channel.data` or member data | - | `channel.data.image` (group) or other member's `user.image` (1:1) |
| `channel-header__name` | `channel.data` or member data | - | `channel.data.name` (group) or other member's `user.name` (1:1) |
| `channel-header__status` (1:1) | Presence events | - | `user.online` -> "Online"; `user.last_active` -> "Last seen X ago" |
| `channel-header__status` (group) | `channel.state.members`, `channel.state.watcher_count` | - | Count members + online watchers |
| `channel-header__action--call` | - | Initiates Stream Video call (see VIDEO.md) | Cross-product integration |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Presence / last active | "Connect Events" enabled on channel type | Off |
| Watcher count | `{ watch: true, presence: true }` on `channel.watch()` | Must pass explicitly |
| Video/audio calls | Stream Video product enabled | Separate product |

---

## Message List

Scrollable container for messages. Handles date separators, scroll-to-bottom, and real-time message injection.

### Blueprint

```html
<div class="message-list" role="log" aria-live="polite">

  <!-- CONDITIONAL: older messages available -->
  <div class="message-list__load-older">
    <button class="message-list__load-older-btn">Load older messages</button>
    <!-- Or: IntersectionObserver sentinel at top for infinite scroll -->
  </div>

  <!-- Date separator -->
  <div class="message-list__date-separator">
    <span class="message-list__date-label">March 17, 2026</span>
  </div>

  <!-- System/event message -->
  <div class="message-list__event">
    <span class="message-list__event-text">Jane added Alex to the channel</span>
  </div>

  <!-- Messages grouped by sender (consecutive messages from same user) -->
  <div class="message-list__group message-list__group--other">
    <!-- Modifiers: --own (current user) | --other -->
    <!-- First message in group shows avatar + name, rest are compact -->
    <div class="message-list__item message-list__item--first">
      <!-- Insert Message component -->
    </div>
    <div class="message-list__item message-list__item--continuation">
      <!-- Insert Message component (no avatar/name, compact spacing) -->
    </div>
  </div>

  <!-- CONDITIONAL: typing indicator -->
  <div class="message-list__typing">
    <!-- See Typing Indicator component -->
  </div>

  <!-- CONDITIONAL: user has scrolled up, new messages below -->
  <button class="message-list__scroll-to-bottom">
    <!-- CONDITIONAL: unread count badge -->
    <span class="message-list__new-count">5</span>
  </button>

</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| Messages (initial) | `channel.watch()` or `channel.query({ messages: { limit: 25 } })` | - | `channel.state.messages` |
| Messages (older) | `channel.query({ messages: { limit: 25, id_lt: oldestMessageId } })` | - | Prepend to message list |
| Messages (real-time) | `channel.on('message.new', callback)` | - | Append new message to list |
| Message groups | Client-side grouping | - | Group consecutive messages by `message.user.id` within a time window |
| Date separators | Client-side | - | Insert when `message.created_at` crosses a day boundary |
| System events | `channel.on('member.added', ...)`, `channel.on('member.removed', ...)` | - | Render as `message-list__event` |
| Typing indicator | `channel.on('typing.start', ...)`, `channel.on('typing.stop', ...)` | - | `channel.state.typing` - map of userId -> event |
| Scroll to bottom | Client-side scroll position tracking | - | Show when `scrollTop < threshold` |
| `message-list__new-count` | Track messages received while scrolled up | - | Client-side counter |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Message history | `channel.watch()` or `channel.query()` | Available |
| Real-time | `channel.watch()` establishes websocket | Automatic when channel is watched |
| Typing events | "Typing Events" enabled on channel type in Dashboard | On for most types |
| Read events | "Read Events" enabled on channel type | On for most types |
| System events | Automatic on member add/remove | Available |

---

## Message

The core content unit in chat. A single message with author info, text, attachments, reactions, and thread.

### Blueprint

```html
<div class="message">
  <!-- Modifiers: message--own | message--other | message--deleted | message--pinned | message--highlighted | message--system -->
  <!-- message--first (first in group, shows avatar/name) -->
  <!-- message--continuation (same sender, compact) -->

  <!-- CONDITIONAL: message--first in group only -->
  <a class="message__actor" href="/user/{user.id}">
    <img class="message__avatar" src="" alt="" />
  </a>

  <div class="message__content">
    <!-- CONDITIONAL: message--first in group only -->
    <div class="message__header">
      <span class="message__author"></span>
      <time class="message__time" datetime=""></time>
    </div>

    <!-- CONDITIONAL: message.pinned === true -->
    <div class="message__pinned-badge">
      Pinned by <span class="message__pinned-by"></span>
    </div>

    <div class="message__bubble">
      <!-- CONDITIONAL: message.quoted_message exists (reply/quote) -->
      <div class="message__quoted">
        <span class="message__quoted-author"></span>
        <p class="message__quoted-text"></p>
      </div>

      <!-- Parse @mentions -> <a class="message__mention">, URLs -> <a class="message__link"> -->
      <p class="message__text"></p>

      <!-- CONDITIONAL: message.attachments has type "image" -->
      <div class="message__images">
        <!-- Modifiers: message__images--single | --grid -->
        <figure class="message__image-item">
          <img src="" alt="" />
        </figure>
      </div>

      <!-- CONDITIONAL: message.attachments has type "video" -->
      <div class="message__video">
        <video class="message__video-player" src="" controls></video>
      </div>

      <!-- CONDITIONAL: message.attachments has type "file" -->
      <div class="message__files">
        <a class="message__file" href="" download>
          <span class="message__file-icon"></span>
          <span class="message__file-name"></span>
          <span class="message__file-size"></span>
        </a>
      </div>

      <!-- CONDITIONAL: message.attachments has og_scrape_url (link preview) -->
      <a class="message__og" href="" target="_blank" rel="noopener">
        <img class="message__og-image" src="" alt="" />
        <div class="message__og-content">
          <span class="message__og-title"></span>
          <span class="message__og-description"></span>
          <span class="message__og-domain"></span>
        </div>
      </a>
    </div>

    <!-- CONDITIONAL: message.deleted_at exists -->
    <div class="message__deleted">This message was deleted.</div>

    <!-- Reactions row (inline, beneath bubble) -->
    <!-- CONDITIONAL: message has any reactions -->
    <div class="message__reactions">
      <!-- One pill per reaction type -->
      <button class="message__reaction">
        <!-- Modifier: message__reaction--own when user has reacted with this type -->
        <span class="message__reaction-emoji"></span>
        <span class="message__reaction-count"></span>
      </button>
      <!-- Add reaction button -->
      <button class="message__reaction message__reaction--add" aria-label="Add reaction"></button>
    </div>

    <!-- CONDITIONAL: message.reply_count > 0 -->
    <button class="message__thread-reply">
      <div class="message__thread-avatars">
        <!-- Stacked avatars of thread participants -->
        <img class="message__thread-avatar" src="" alt="" />
      </div>
      <span class="message__thread-count"></span>
      <time class="message__thread-last" datetime=""></time>
    </button>

    <!-- Message status (own messages only) -->
    <!-- CONDITIONAL: message--own -->
    <div class="message__status">
      <!-- Modifiers: message__status--sending | --sent | --delivered | --read -->
      <!-- Read: show stacked read receipt avatars -->
    </div>

    <!-- Hover/long-press action bar -->
    <div class="message__actions">
      <button class="message__action message__action--react" aria-label="React"></button>
      <button class="message__action message__action--reply" aria-label="Reply in thread"></button>
      <button class="message__action message__action--quote" aria-label="Quote"></button>
      <!-- CONDITIONAL: message.user.id === currentUserId -->
      <button class="message__action message__action--edit" aria-label="Edit"></button>
      <button class="message__action message__action--delete" aria-label="Delete"></button>
      <!-- Always visible -->
      <button class="message__action message__action--pin" aria-label="Pin"></button>
      <button class="message__action message__action--flag" aria-label="Flag"></button>
    </div>
  </div>

</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| `message__avatar` | In message payload | - | `message.user.image` |
| `message__author` | In message payload | - | `message.user.name` |
| `message__time` | In message payload | - | `message.created_at` |
| `message__text` | In message payload | - | `message.text` |
| `message__pinned-badge` | In message payload | - | `message.pinned`, `message.pinned_by.name` |
| `message__quoted` | In message payload | - | `message.quoted_message.user.name`, `message.quoted_message.text` |
| `message__image-item` | In message payload | - | `message.attachments[].image_url` where `type === 'image'` |
| `message__video-player` | In message payload | - | `message.attachments[].asset_url` where `type === 'video'` |
| `message__file` | In message payload | - | `message.attachments[].asset_url`, `.title`, `.file_size` where `type === 'file'` |
| `message__og-*` | In message payload | - | `message.attachments[].og_scrape_url`, `.title`, `.text`, `.image_url` |
| `message__deleted` | In message payload | - | `message.deleted_at` (truthy = deleted) |
| `message__reaction` | In message payload | - | `message.reaction_groups` (keyed by type; each has `count`, `sum_scores`, `first_reaction_at`, `last_reaction_at`) - recommended. `message.reaction_counts` still works but is deprecated. Also `message.own_reactions[]` |
| Reaction - add | - | `channel.sendReaction(message.id, { type: 'like' })` | Supports `{ enforce_unique: true }` option as third arg to replace all user's existing reactions |
| Reaction - remove | - | `channel.deleteReaction(message.id, 'like')` | Removes current user's reaction of that type |
| `message__thread-count` | In message payload | - | `message.reply_count` |
| `message__thread-avatars` | In message payload | - | `message.thread_participants[].image` |
| `message__thread-last` | In message payload | - | `message.latest_reactions` or thread's last reply timestamp |
| `message__status` (read) | `channel.state.read` | - | Map of `userId -> { last_read, user }` - compare with `message.created_at` |
| Edit | - | `client.updateMessage({ id: message.id, text: newText })` | - |
| Delete | - | `client.deleteMessage(message.id)` | Sets `message.deleted_at`. Pass `{ hardDelete: true }` for permanent deletion |
| Pin | - | `client.pinMessage(message, timeoutOrExpiration)` | Takes message object (not ID). Second arg is optional: timeout in seconds, expiration date, or null for no expiry |
| Unpin | - | `client.unpinMessage(message)` | Takes message object (not ID) |
| `message__reaction-groups` | In message payload | - | `message.reaction_groups` - keyed by type, each has `count`, `sum_scores`, `first_reaction_at`, `last_reaction_at`. Recommended replacement for `reaction_counts` |
| `message__mentioned-users` | In message payload | - | `message.mentioned_users` - enriched user objects for @mentions in the message |
| Flag | - | `client.flagMessage(message.id)` | See MODERATION.md |
| Mute user | - | `client.muteUser(userId, null, { timeout: 60 })` | Three args: userId, null, options object. `timeout` is in minutes |
| Quote | - | Send new message with `quoted_message_id: message.id` | - |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Attachments | "Uploads" enabled on channel type | On |
| Reactions | "Reactions" enabled on channel type in Dashboard | On |
| Replies/threads | "Replies" enabled on channel type | On |
| Read receipts | "Read Events" enabled on channel type | On for most types |
| URL enrichment | "URL Enrichment" enabled on channel type | On - auto-scrapes OG data server-side |
| Pinning | "Pinning" enabled on channel type | Off |
| Quoting | `quoted_message_id` on `sendMessage` | Available - no config needed |
| Message editing | - | Available - own messages by default, admin can edit any |
| Message deletion | - | Available - own messages by default, admin can delete any |

---

## Message Input

Text input for composing and sending messages. Handles attachments, mentions, slash commands, and edit mode.

### Blueprint

```html
<div class="message-input">
  <!-- Modifier: message-input--editing (when editing an existing message) -->
  <!-- Modifier: message-input--disabled (when user lacks send permission) -->
  <!-- Modifier: message-input--thread (when in thread view) -->

  <!-- CONDITIONAL: editing a message -->
  <div class="message-input__edit-banner">
    Editing message
    <button class="message-input__edit-cancel" aria-label="Cancel edit"></button>
  </div>

  <!-- CONDITIONAL: replying with quote -->
  <div class="message-input__quote-preview">
    <span class="message-input__quote-author"></span>
    <p class="message-input__quote-text"></p>
    <button class="message-input__quote-remove" aria-label="Remove quote"></button>
  </div>

  <!-- CONDITIONAL: user has selected files to upload -->
  <div class="message-input__attachments">
    <div class="message-input__attachment">
      <!-- Modifiers: --image | --file | --uploading | --error -->
      <img class="message-input__attachment-preview" src="" alt="" />
      <button class="message-input__attachment-remove" aria-label="Remove"></button>
      <div class="message-input__attachment-progress">
        <div class="message-input__attachment-progress-bar" style="width: 0%"></div>
      </div>
    </div>
  </div>

  <div class="message-input__composer">
    <div class="message-input__tools-left">
      <button class="message-input__tool message-input__tool--attach" aria-label="Attach file"></button>
    </div>

    <div class="message-input__text-area">
      <div class="message-input__text" contenteditable="true" role="textbox" aria-multiline="true" data-placeholder="Send a message"></div>

      <!-- CONDITIONAL: user types "@" + characters -->
      <div class="message-input__mention-dropdown">
        <button class="message-input__mention-option">
          <img class="message-input__mention-avatar" src="" alt="" />
          <span class="message-input__mention-name"></span>
        </button>
      </div>

      <!-- CONDITIONAL: user types "/" (slash commands) -->
      <div class="message-input__command-dropdown">
        <button class="message-input__command-option">
          <span class="message-input__command-name">/giphy</span>
          <span class="message-input__command-desc">Post a random GIF</span>
        </button>
      </div>
    </div>

    <div class="message-input__tools-right">
      <button class="message-input__tool message-input__tool--emoji" aria-label="Emoji"></button>
      <button class="message-input__send" aria-label="Send" disabled></button>
    </div>
  </div>

</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| `message-input__text` | - (user input) | Becomes `message.text` | - |
| `message-input__mention-dropdown` | `channel.queryMembers({ name: { $autocomplete: query } })` | - | Match typed query against channel members |
| `message-input__command-dropdown` | `channel.getConfig()` | - | `channel.config.commands[]` - name + description |
| `message-input__attachment` (image) | Local blob preview | `channel.sendImage(file)` -> CDN URL | Collect into `message.attachments[]` with `type: 'image'` |
| `message-input__attachment` (file) | Local blob preview | `channel.sendFile(file)` -> CDN URL | Collect into `message.attachments[]` with `type: 'file'` |
| Attachment remove (image) | - | `channel.deleteImage(url)` | Deletes uploaded image from CDN when user removes before sending |
| Attachment remove (file) | - | `channel.deleteFile(url)` | Deletes uploaded file from CDN when user removes before sending |
| Send (new) | - | `channel.sendMessage({ text, attachments, quoted_message_id?, mentioned_users? })` | `mentioned_users` is an array of user IDs referenced via @mentions in the text |
| Send (edit) | - | `client.updateMessage({ id, text, attachments })` | - |
| Send (thread) | - | `channel.sendMessage({ text, parent_id: parentMessage.id })` | - |
| Typing events | - | `channel.keystroke()` on input, `channel.stopTyping()` on pause | Debounced - SDK handles interval |
| `--disabled` | `channel.data.own_capabilities` | - | Check if `'send-message'` is in capabilities array |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| File uploads | "Uploads" enabled on channel type | On |
| Slash commands | Commands configured on channel type in Dashboard | `/giphy` available by default |
| @Mentions | Channel members queryable | Available - searches channel members |
| Typing indicators | "Typing Events" enabled on channel type | On for most |
| Message length | `channel.config.max_message_length` | 5000 chars default |
| Slow mode | `channel.data.cooldown` (seconds) | Off - set per channel |

---

## Thread

Reply thread on a specific message. Opens as a side panel or overlay.

### Blueprint

```html
<div class="thread">

  <header class="thread__header">
    <h3 class="thread__title">Thread</h3>
    <span class="thread__count"></span>
    <button class="thread__close" aria-label="Close thread"></button>
  </header>

  <!-- Parent message (the message being replied to) -->
  <div class="thread__parent">
    <!-- Insert Message component (with thread-reply button hidden) -->
  </div>

  <div class="thread__separator">
    <span class="thread__reply-count"></span>
  </div>

  <!-- Reply list (same structure as Message List, but for thread replies) -->
  <div class="thread__replies" role="log">
    <div class="thread__reply">
      <!-- Insert Message component -->
    </div>
  </div>

  <!-- Thread-specific message input -->
  <div class="thread__input">
    <!-- Insert Message Input component with message-input--thread modifier -->
    <!-- OPTIONAL: "Also send to channel" checkbox -->
    <label class="thread__send-to-channel">
      <input type="checkbox" />
      Also send to #channel-name
    </label>
  </div>

</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| `thread__parent` | Already in message list | - | The message with `reply_count > 0` |
| `thread__replies` | `channel.getReplies(parentMessage.id, { limit: 25 })` | - | Returns `{ messages: [...] }` |
| `thread__replies` (older) | `channel.getReplies(parentId, { limit: 25, id_lt: oldestReplyId })` | - | Cursor pagination |
| `thread__replies` (real-time) | `channel.on('message.new', cb)` - filter where `message.parent_id === parentId` | - | Append to reply list |
| `thread__reply-count` | Parent message | - | `parentMessage.reply_count` |
| Reply - send | - | `channel.sendMessage({ text, parent_id: parentMessage.id })` | - |
| Reply - send to channel | - | `channel.sendMessage({ text, parent_id: parentMessage.id, show_in_channel: true })` | Shows reply in main channel too |
| All threads | `client.queryThreads()` | - | Lists all threads the current user participates in - supports pagination and filtering |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Replies/threads | "Replies" enabled on channel type in Dashboard | On |
| Thread participants | Automatic | Tracked in `message.thread_participants` |

---

## Typing Indicator

Shows who is currently typing in the channel.

### Blueprint

```html
<!-- CONDITIONAL: channel.state.typing has entries (excluding current user) -->
<div class="typing-indicator">
  <div class="typing-indicator__avatars">
    <img class="typing-indicator__avatar" src="" alt="" />
    <!-- Max 2-3 avatars -->
  </div>
  <div class="typing-indicator__dots">
    <span class="typing-indicator__dot"></span>
    <span class="typing-indicator__dot"></span>
    <span class="typing-indicator__dot"></span>
  </div>
  <span class="typing-indicator__text">
    <!-- 1 user: "Jane is typing" -->
    <!-- 2 users: "Jane and Alex are typing" -->
    <!-- 3+: "3 people are typing" -->
  </span>
</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| Typing users | `channel.on('typing.start', cb)`, `channel.on('typing.stop', cb)` | `channel.keystroke()` / `channel.stopTyping()` | `channel.state.typing` - map of userId -> `{ user }`, excludes current user. For threads: `channel.keystroke(threadId)` sends thread-specific typing events |
| `typing-indicator__avatar` | In typing event | - | `event.user.image` |
| Auto-expiry | Client-side | - | Remove user from typing state after ~7s with no new `typing.start` event |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Typing events | "Typing Events" enabled on channel type | On for most types |

---

## Emoji Reaction Picker

Overlay for selecting a reaction to add to a message. Typically triggered from message action bar or existing reaction row.

### Blueprint

```html
<div class="reaction-picker">
  <!-- Quick reactions row (most common) -->
  <div class="reaction-picker__quick">
    <button class="reaction-picker__emoji" data-type="like">&#x1F44D;</button>
    <button class="reaction-picker__emoji" data-type="love">&#x2764;</button>
    <button class="reaction-picker__emoji" data-type="haha">&#x1F602;</button>
    <button class="reaction-picker__emoji" data-type="wow">&#x1F632;</button>
    <button class="reaction-picker__emoji" data-type="sad">&#x1F622;</button>
    <button class="reaction-picker__emoji" data-type="angry">&#x1F621;</button>
  </div>
  <!-- OPTIONAL: full emoji picker with categories and search -->
  <button class="reaction-picker__more" aria-label="More reactions"></button>
</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| Emoji click | - | `channel.sendReaction(message.id, { type: 'like' })` | Type is the `data-type` attribute. Pass `{ enforce_unique: true }` as third arg to replace user's existing reactions |
| Toggle off | Check `message.own_reactions` for existing reaction of same type | `channel.deleteReaction(message.id, 'like')` | - |
| Available types | - | Any string works as reaction type | No configuration needed for custom types |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Reactions | "Reactions" enabled on channel type | On |

---

## Search

Search messages across channels or within a specific channel.

### Blueprint

```html
<div class="search">

  <div class="search__input-area">
    <span class="search__icon"></span>
    <input class="search__input" type="search" placeholder="Search messages" />
    <!-- CONDITIONAL: query is non-empty -->
    <button class="search__clear" aria-label="Clear search"></button>
  </div>

  <!-- CONDITIONAL: search has results -->
  <div class="search__results">
    <button class="search__result">
      <img class="search__result-avatar" src="" alt="" />
      <div class="search__result-content">
        <div class="search__result-top">
          <span class="search__result-author"></span>
          <span class="search__result-channel">#general</span>
          <time class="search__result-time"></time>
        </div>
        <p class="search__result-text">
          <!-- Highlight matching text with <mark class="search__highlight"> -->
        </p>
      </div>
    </button>
  </div>

  <!-- States: search__loading, search__empty ("No results for ...") -->

</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| `search__results` | `client.search({ members: { $in: [userId] } }, query, { limit: 20 })` | - | Returns `{ results: [{ message }] }` |
| `search__results` (in-channel) | `client.search({ cid: channel.cid }, query, { limit: 20 })` | - | Filter by specific channel |
| `search__result-avatar` | In result | - | `result.message.user.image` |
| `search__result-author` | In result | - | `result.message.user.name` |
| `search__result-channel` | In result | - | `result.message.channel.name` or `result.message.channel.id` |
| `search__result-text` | In result | - | `result.message.text` - add highlights client-side |
| Result click | - | Navigate to message in channel | `result.message.channel` + `result.message.id` |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Search | "Search" enabled on channel type | On |
| Cross-channel | `client.search()` with filter across channels | Available |
