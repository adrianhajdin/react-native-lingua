# Video - full component blueprints

Setup, routes, and gotchas: [VIDEO.md](VIDEO.md). Rules: [../../stream/RULES.md](../../stream/RULES.md).

---

## Lobby

Pre-join screen where users preview their camera/mic and set preferences before entering a call.

### Blueprint

```html
<div class="lobby">

  <div class="lobby__preview">
    <!-- Local camera preview -->
    <video class="lobby__video" autoplay muted playsinline></video>
    <!-- CONDITIONAL: camera is off -->
    <div class="lobby__video-off">
      <img class="lobby__avatar" src="" alt="" />
      <span class="lobby__name"></span>
    </div>
    <!-- CONDITIONAL: mic is on - show audio level visualization -->
    <div class="lobby__audio-level">
      <div class="lobby__audio-level-bar"></div>
    </div>
  </div>

  <div class="lobby__controls">
    <button class="lobby__toggle lobby__toggle--camera" aria-pressed="true" aria-label="Toggle camera">
      <!-- aria-pressed="false" + modifier --off when camera disabled -->
    </button>
    <button class="lobby__toggle lobby__toggle--mic" aria-pressed="true" aria-label="Toggle microphone">
      <!-- aria-pressed="false" + modifier --off when mic disabled -->
    </button>
  </div>

  <!-- Device selectors -->
  <div class="lobby__devices">
    <select class="lobby__device-select lobby__device-select--camera" aria-label="Camera"></select>
    <select class="lobby__device-select lobby__device-select--mic" aria-label="Microphone"></select>
    <select class="lobby__device-select lobby__device-select--speaker" aria-label="Speaker"></select>
    <!-- Populated from call.{device}.listDevices() -->
  </div>

  <div class="lobby__info">
    <h2 class="lobby__call-title"></h2>
    <!-- CONDITIONAL: other participants already in call -->
    <div class="lobby__participants-preview">
      <img class="lobby__participant-avatar" src="" alt="" />
      <span class="lobby__participants-text">3 others already in this call</span>
    </div>
  </div>

  <div class="lobby__actions">
    <button class="lobby__join">Join call</button>
    <button class="lobby__cancel">Cancel</button>
  </div>

</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| `lobby__video` | `call.camera.state.mediaStream` | Assign stream to video element's `srcObject` | Local media stream |
| `lobby__toggle--camera` | `call.camera.state.status` | `call.camera.enable()` / `call.camera.disable()` | `'enabled'` or `'disabled'` |
| `lobby__toggle--mic` | `call.microphone.state.status` | `call.microphone.enable()` / `call.microphone.disable()` | `'enabled'` or `'disabled'` |
| `lobby__device-select--camera` | `call.camera.listDevices()` | `call.camera.select(deviceId)` | RxJS Observable of `MediaDeviceInfo[]` |
| `lobby__device-select--mic` | `call.microphone.listDevices()` | `call.microphone.select(deviceId)` | RxJS Observable of `MediaDeviceInfo[]` |
| `lobby__device-select--speaker` | `call.speaker.listDevices()` | `call.speaker.select(deviceId)` | RxJS Observable of `MediaDeviceInfo[]` |
| `lobby__call-title` | `call.state.custom.title` or `call.id` | - | Set during `call.getOrCreate({ data: { custom: { title } } })` |
| `lobby__participants-preview` | `call.state.participants` | - | Participants already joined |
| `lobby__join` | - | `call.join()` | Transitions to call layout |
| `lobby__cancel` | - | `call.leave()` | Navigates away |
| `lobby__audio-level` | `call.microphone.state.mediaStream` | - | Use `AudioContext` + `AnalyserNode` on the stream |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Camera/mic access | Browser `getUserMedia` permission | Prompted on first access |
| Call reference | `call = client.call(callType, callId)` then `call.getOrCreate()` | Must create before lobby |
| Device enumeration | `navigator.mediaDevices.enumerateDevices()` | Available after permission grant |
| Participants preview | `call.getOrCreate()` returns current participants | Available |

---

## Call Layout

Container for the active call. Manages participant arrangement in different layout modes.

### Blueprint

```html
<div class="call-layout">
  <!-- Modifiers: call-layout--grid | --speaker | --spotlight | --pip -->

  <!-- GRID: all participants equal size -->
  <div class="call-layout__grid">
    <!-- Insert Participant Tile components -->
    <!-- Grid adapts: 1 = full, 2 = side-by-side, 3-4 = 2x2, 5-9 = 3x3, etc. -->
  </div>

  <!-- SPEAKER: active speaker large, others in strip -->
  <div class="call-layout__speaker">
    <div class="call-layout__speaker-main">
      <!-- Insert Participant Tile for dominant speaker (large) -->
    </div>
    <div class="call-layout__speaker-strip">
      <!-- Insert Participant Tile components (small) for remaining participants -->
    </div>
  </div>

  <!-- SPOTLIGHT: screen share or pinned participant fills main area -->
  <div class="call-layout__spotlight">
    <div class="call-layout__spotlight-main">
      <!-- Screen share surface OR pinned participant -->
    </div>
    <div class="call-layout__spotlight-strip">
      <!-- All other participants in strip -->
    </div>
  </div>

  <!-- CONDITIONAL: screen share active - auto-switch to spotlight layout -->
  <div class="call-layout__screen-share">
    <video class="call-layout__screen-share-video" autoplay playsinline></video>
    <div class="call-layout__screen-share-label">
      <img class="call-layout__screen-share-avatar" src="" alt="" />
      <span class="call-layout__screen-share-name"></span> is sharing their screen
    </div>
  </div>

  <!-- Self-view (Picture-in-Picture overlay) -->
  <div class="call-layout__self-view" draggable="true">
    <!-- Insert Participant Tile for local participant (compact) -->
  </div>

  <!-- CONDITIONAL: someone is requesting to join (for calls requiring permission) -->
  <div class="call-layout__join-request">
    <img class="call-layout__join-request-avatar" src="" alt="" />
    <span class="call-layout__join-request-name"></span> wants to join
    <button class="call-layout__join-request-accept">Accept</button>
    <button class="call-layout__join-request-reject">Reject</button>
  </div>

  <!-- Call controls (always visible at bottom) -->
  <div class="call-layout__controls">
    <!-- Insert Call Controls component -->
  </div>

</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| Participant list | `call.state.participants` | - | Array of `StreamVideoParticipant` objects |
| Dominant speaker | `call.state.dominantSpeaker` | - | Updates in real-time |
| Screen share track | `participant.screenShareStream` | - | Non-null when participant is screen sharing |
| `call-layout__screen-share-video` | Screen share participant's video track | Assign to `srcObject` | `participant.screenShareStream` |
| Layout mode | Client-side state | - | Auto-switch to spotlight when screen share starts |
| Self-view | `call.state.localParticipant` | - | Current user's participant object |
| Join request | `call.on('call.permission_request', cb)` | `call.grantPermissions(userId)` / `call.revokePermissions(userId)` | - |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Call joined | `call.join()` completed | - |
| Dominant speaker | Automatic | Available - determined server-side from audio levels |
| Screen sharing | `call.screenShare.enable()` | Available - browser `getDisplayMedia` |
| Layout modes | Client-side | No config - implement layout logic based on participant count and screen share state |
| Join requests | Call type configured with `join_ahead_time_seconds` or backstage mode | Off |

---

## Participant Tile

Individual participant's video/audio in the call. Used inside call layouts.

### Blueprint

```html
<div class="participant-tile">
  <!-- Modifiers: --speaking | --muted | --video-off | --pinned | --local | --dominant -->

  <!-- Video layer -->
  <video class="participant-tile__video" autoplay playsinline></video>
  <!-- CONDITIONAL: video track is off -->
  <div class="participant-tile__video-off">
    <img class="participant-tile__avatar" src="" alt="" />
  </div>

  <!-- Overlays -->
  <div class="participant-tile__overlay">
    <div class="participant-tile__info">
      <span class="participant-tile__name"></span>
      <!-- CONDITIONAL: participant is muted -->
      <span class="participant-tile__muted-icon" aria-label="Muted"></span>
    </div>

    <!-- CONDITIONAL: speaking - audio level border/ring -->
    <div class="participant-tile__speaking-border"></div>

    <!-- CONDITIONAL: network quality degraded -->
    <div class="participant-tile__network">
      <!-- Modifiers: --good | --ok | --poor -->
      <span class="participant-tile__network-icon"></span>
    </div>

    <!-- Action menu (on hover/long press) -->
    <div class="participant-tile__actions">
      <button class="participant-tile__action participant-tile__action--pin" aria-label="Pin"></button>
      <button class="participant-tile__action participant-tile__action--fullscreen" aria-label="Fullscreen"></button>
      <!-- CONDITIONAL: current user is host/admin -->
      <button class="participant-tile__action participant-tile__action--mute" aria-label="Mute participant"></button>
      <button class="participant-tile__action participant-tile__action--remove" aria-label="Remove from call"></button>
    </div>
  </div>

</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| `participant-tile__video` | Participant's video track | Assign to `srcObject` | `participant.videoStream` |
| `participant-tile__avatar` | Participant data | - | `participant.image` |
| `participant-tile__name` | Participant data | - | `participant.name` or `participant.userId` |
| `--speaking` modifier | Participant audio state | - | `participant.isSpeaking` (boolean) |
| `--muted` modifier | Participant audio state | - | `participant.audioStream` is null or `!hasAudio(participant)` (import `hasAudio` from `@stream-io/video-client`) |
| `--video-off` modifier | Participant video state | - | `participant.videoStream` is null or `!hasVideo(participant)` (import `hasVideo` from `@stream-io/video-client`) |
| `--dominant` modifier | `call.state.dominantSpeaker` | - | `participant.isDominantSpeaker` |
| Network quality | Participant stats | - | `participant.connectionQuality` - `ConnectionQuality.EXCELLENT`, `.GOOD`, `.POOR`, `.UNSPECIFIED` |
| Pin | - | Client-side state | Layout prioritizes pinned participant |
| Mute participant | - | `call.muteUser(userId, 'audio')` | Host/admin only |
| Remove participant | - | `call.blockUser(userId)` | Host/admin only |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Video rendering | Participant has granted camera permission and is publishing | - |
| Audio rendering | Attach `participant.audioStream` to an `<audio>` element (not in tile HTML - managed globally) | - |
| Network quality | Automatic | Available - tracked by SDK |
| Host controls (mute/remove) | User has `call.state.ownCapabilities` including `'mute-users'`, `'block-users'` | Depends on call type role |

---

## Call Controls

Bottom bar with call action buttons: mic, camera, screen share, participants, reactions, leave/end.

### Blueprint

```html
<div class="call-controls">

  <div class="call-controls__group call-controls__group--media">
    <button class="call-controls__btn call-controls__btn--mic" aria-pressed="true" aria-label="Toggle microphone">
      <!-- aria-pressed="false" + modifier --off when muted -->
      <span class="call-controls__icon call-controls__icon--mic"></span>
      <!-- OPTIONAL: device selector dropdown arrow -->
      <button class="call-controls__device-toggle call-controls__device-toggle--mic" aria-label="Select microphone"></button>
    </button>

    <button class="call-controls__btn call-controls__btn--camera" aria-pressed="true" aria-label="Toggle camera">
      <span class="call-controls__icon call-controls__icon--camera"></span>
      <button class="call-controls__device-toggle call-controls__device-toggle--camera" aria-label="Select camera"></button>
    </button>

    <button class="call-controls__btn call-controls__btn--screen-share" aria-pressed="false" aria-label="Share screen">
      <span class="call-controls__icon call-controls__icon--screen-share"></span>
    </button>
  </div>

  <div class="call-controls__group call-controls__group--actions">
    <!-- OPTIONAL: in-call reactions (raise hand, emoji) -->
    <button class="call-controls__btn call-controls__btn--reactions" aria-label="Reactions">
      <span class="call-controls__icon call-controls__icon--reactions"></span>
    </button>

    <button class="call-controls__btn call-controls__btn--participants" aria-label="Participants">
      <span class="call-controls__icon call-controls__icon--participants"></span>
      <!-- Badge with participant count -->
      <span class="call-controls__badge"></span>
    </button>

    <!-- OPTIONAL: chat alongside video -->
    <button class="call-controls__btn call-controls__btn--chat" aria-label="Chat">
      <span class="call-controls__icon call-controls__icon--chat"></span>
      <!-- CONDITIONAL: unread messages -->
      <span class="call-controls__badge"></span>
    </button>

    <!-- OPTIONAL: recording (host/admin only) -->
    <button class="call-controls__btn call-controls__btn--record" aria-pressed="false" aria-label="Record">
      <!-- Modifier: --recording when active -->
      <span class="call-controls__icon call-controls__icon--record"></span>
    </button>
  </div>

  <div class="call-controls__group call-controls__group--leave">
    <button class="call-controls__btn call-controls__btn--leave call-controls__btn--danger" aria-label="Leave call">
      <span class="call-controls__icon call-controls__icon--leave"></span>
      Leave
    </button>
    <!-- CONDITIONAL: current user is host -->
    <!-- Show dropdown: "Leave call" vs "End call for everyone" -->
  </div>

</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| `--mic` | `call.microphone.state.status` | `call.microphone.toggle()` | `'enabled'` or `'disabled'` |
| `--camera` | `call.camera.state.status` | `call.camera.toggle()` | `'enabled'` or `'disabled'` |
| `--screen-share` | `call.screenShare.state.status` | `call.screenShare.toggle()` | `'enabled'` or `'disabled'` |
| Mic device select | `call.microphone.listDevices()` | `call.microphone.select(deviceId)` | - |
| Camera device select | `call.camera.listDevices()` | `call.camera.select(deviceId)` | - |
| `--participants` badge | `call.state.participants` | - | `call.state.participants.length` |
| `--record` | `call.state.recording` | `call.startRecording()` / `call.stopRecording()` | Boolean |
| `--reactions` | - | `call.sendReaction({ type: 'raised-hand' })` | Custom reaction types |
| `--leave` | - | `call.leave()` | Leaves call, keeps it running for others |
| End call | - | `call.endCall()` | Ends for all participants - host only |
| `--chat` badge | Unread count in associated chat channel | - | Cross-product: Stream Chat channel linked to call |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Screen sharing | Browser `getDisplayMedia` support | Available in desktop browsers |
| Recording | Dashboard -> Call Types -> Recording enabled | Off - requires plan support |
| In-call reactions | - | Available - `call.sendReaction()` |
| End call (for all) | User must have `'end-call'` capability | Host/admin role only |
| In-call chat | Chat product integrated, channel linked to call | Separate setup |

---

## Incoming Call

Ringing UI when another user initiates a call. Shown as overlay or notification.

### Blueprint

```html
<div class="incoming-call">

  <div class="incoming-call__info">
    <img class="incoming-call__avatar" src="" alt="" />
    <!-- CONDITIONAL: group call - show multiple avatars or group name -->
    <span class="incoming-call__caller-name"></span>
    <span class="incoming-call__type">
      <!-- "Video call" or "Audio call" based on call type -->
    </span>
  </div>

  <div class="incoming-call__actions">
    <button class="incoming-call__btn incoming-call__btn--reject" aria-label="Decline">
      <span class="incoming-call__icon incoming-call__icon--reject"></span>
      Decline
    </button>
    <button class="incoming-call__btn incoming-call__btn--accept" aria-label="Accept">
      <span class="incoming-call__icon incoming-call__icon--accept"></span>
      Accept
    </button>
  </div>

</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| `incoming-call__avatar` | Ring event | - | `call.state.createdBy.image` or caller's user image |
| `incoming-call__caller-name` | Ring event | - | `call.state.createdBy.name` |
| `incoming-call__type` | Call metadata | - | `call.type` - `'default'`, `'audio_room'`, `'livestream'` etc. |
| `--accept` | - | `call.join()` | Transitions to call layout |
| `--reject` | - | `call.leave({ reject: true })` | Dismisses the ring |
| Ring event | Subscribe to `client.state.calls$` and filter by `call.state.callingState === CallingState.RINGING` | - | Fires when another user rings |
| Auto-dismiss | Client-side timeout | - | Dismiss after ~30s if no action |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Ringing | Call type supports ringing | Available on `'default'` call type |
| Ring initiation | Caller uses `call.getOrCreate({ ring: true, data: { members: [...] } })` for initial ring, or `call.ring({ members_ids: [...] })` to ring specific members | - |
| Push notifications | Mobile SDKs + push provider configured | Optional - for ringing when app is backgrounded |

---

## Participant List

Side panel showing all participants in the current call with their status.

### Blueprint

```html
<div class="participant-list">

  <header class="participant-list__header">
    <h3 class="participant-list__title">Participants</h3>
    <span class="participant-list__count"></span>
    <button class="participant-list__close" aria-label="Close"></button>
  </header>

  <!-- OPTIONAL: invite more participants -->
  <div class="participant-list__invite">
    <input class="participant-list__invite-input" placeholder="Invite people" />
  </div>

  <div class="participant-list__items">
    <div class="participant-list__item">
      <!-- Modifiers: --speaking | --muted | --video-off | --host -->
      <img class="participant-list__item-avatar" src="" alt="" />
      <!-- CONDITIONAL: online presence dot -->
      <div class="participant-list__item-info">
        <span class="participant-list__item-name"></span>
        <!-- CONDITIONAL: user is host -->
        <span class="participant-list__item-role">Host</span>
      </div>
      <div class="participant-list__item-status">
        <!-- Mic status icon -->
        <span class="participant-list__item-mic"></span>
        <!-- Camera status icon -->
        <span class="participant-list__item-camera"></span>
      </div>
      <!-- CONDITIONAL: current user is host/admin -->
      <div class="participant-list__item-actions">
        <button class="participant-list__item-mute" aria-label="Mute"></button>
        <button class="participant-list__item-remove" aria-label="Remove"></button>
      </div>
    </div>
  </div>

</div>
```

### Wiring

| Element | Read | Write | Property Path |
|---|---|---|---|
| `participant-list__items` | `call.state.participants` | - | Array of participants |
| `participant-list__count` | `call.state.participants` | - | `.length` |
| `participant-list__item-avatar` | Participant data | - | `participant.image` |
| `participant-list__item-name` | Participant data | - | `participant.name` |
| `participant-list__item-role` | Participant data | - | `participant.roles` - check for `'host'`, `'admin'` |
| Mic status | Participant state | - | `hasAudio(participant)` (import from `@stream-io/video-client`) |
| Camera status | Participant state | - | `hasVideo(participant)` (import from `@stream-io/video-client`) |
| Mute participant | - | `call.muteUser(userId, 'audio')` | Host/admin only |
| Remove participant | - | `call.blockUser(userId)` | Host/admin only |
| Invite | - | `call.updateCallMembers({ members: [{ user_id: id }] })` then ring or notify | - |

### Requirements

| Feature | Requirement | Default |
|---|---|---|
| Participant list | `call.join()` completed | Available |
| Host controls | User has host/admin role on call type | Depends on call type config |
| Invite | - | Available - add members to call |
