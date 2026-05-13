# Video - Setup & Integration

Stream Video provides pre-built UI components via React, React Native, Flutter, Swift, and Kotlin SDKs. This file covers setup, server routes, client patterns, and gotchas. For full component structure and wiring, see [VIDEO-blueprints.md](VIDEO-blueprints.md).

Rules: [../../stream/RULES.md](../../stream/RULES.md) (secrets, login screen first, strict mode protection).

- **Blueprint** - HTML with BEM classes defining structure and conditional rendering
- **Wiring** - API calls to read/write each element, exact property paths
- **Requirements** - Dashboard settings, API params, and prerequisites

## Quick ref

- **Packages:** `@stream-io/video-react-sdk`; import SDK CSS from package `dist/css/styles.css`.
- **First:** **App Integration** -> **Setup** for call types / credentials.
- **Per feature:** Lobby, Call Layout, Controls, ... - one section at a time.
- **Below the next rule:** full blueprints - **do not load past it** until you implement that component.

Full component blueprints: [VIDEO-blueprints.md](VIDEO-blueprints.md) - load only the section you are implementing.

---

## App Integration

Everything needed to wire the UI components above into a working Next.js application.

### Setup

**Packages:** `@stream-io/video-react-sdk` (client), `@stream-io/node-sdk` (server)

No CLI commands needed for `default` call type. For `livestream` call type, you must update **all three** publishing roles - `user`, `call_member`, and `host`. Stream evaluates capabilities against the role applied at join-time (`call_member` / `host`), not the user-level role, and the `host` defaults restrict `send-video` to call owners only:

```bash
# 1. Disable backstage so users can join without goLive()
stream api UpdateCallType name=livestream --body '{"settings":{"backstage":{"enabled":false}}}'

# 2. Grant unrestricted send-video / send-audio to user role
stream api UpdateCallType name=livestream --body '{"grants":{"user":["block-user-owner","create-call","create-call-reaction","enable-noise-cancellation-any-team","end-call-owner","join-backstage-owner","join-call","join-ended-call-owner","kick-user-owner","mute-users-owner","pin-call-track-owner","read-call","remove-call-member-owner","screenshare-owner","send-audio","send-event","send-video","start-broadcasting-owner","start-frame-recording","start-recording-owner","stop-broadcasting-owner","stop-frame-recording","stop-recording-owner","update-call-member-owner","update-call-member-role-owner","update-call-owner","update-call-permissions-owner"]}}'

# 3. Grant unrestricted send-video / send-audio to call_member role (REQUIRED - without this, even owners get "No permission to publish VIDEO")
stream api UpdateCallType name=livestream --body '{"grants":{"call_member":["block-user-owner","create-call","create-call-reaction","enable-noise-cancellation-any-team","end-call-owner","join-backstage-owner","join-call","join-call-any-team","join-ended-call-owner","kick-user-owner","mute-users-owner","pin-call-track-owner","read-call","remove-call-member-owner","screenshare-owner","send-audio","send-event","send-video","start-broadcasting-owner","start-frame-recording","start-recording-owner","stop-broadcasting-owner","stop-frame-recording","stop-recording-owner","update-call-member-owner","update-call-member-role-owner","update-call-owner","update-call-permissions-owner"]}}'

# 4. Grant unrestricted send-video / send-audio to host role
stream api UpdateCallType name=livestream --body '{"grants":{"host":["block-user","create-call","create-call-reaction","enable-noise-cancellation-any-team","end-call","join-backstage-owner","join-call","join-ended-call-owner","kick-user-owner","mute-users","pin-call-track","read-call","read-call-stats-owner","remove-call-member-owner","screenshare","send-audio","send-event","send-video","start-broadcasting","start-frame-recording","start-recording","stop-broadcasting","stop-frame-recording","stop-recording","update-call-member-owner","update-call-member-role-owner","update-call-owner","update-call-permissions-owner"]}}'
```

### Server Routes

| Route | Method | Params | Action | Response |
|---|---|---|---|---|
| `/api/token` | GET | `?user_id=xxx` | `client.upsertUsers([{ id, name }])`, `client.generateUserToken({ user_id })` | `{ videoToken, apiKey }` |

```ts
import { StreamClient } from '@stream-io/node-sdk';
const client = new StreamClient(process.env.STREAM_API_KEY!, process.env.STREAM_API_SECRET!);
```

### Client Patterns

- **Login Screen first:** See RULES.md > Login Screen first + [builder-ui.md](../builder-ui.md) > Login Screen.
- **App Header:** Show the current username + avatar (initial letter) + "Switch User" in a persistent header above the video layout. See [`builder-ui.md`](../builder-ui.md) -> App Header.
- **Instantiate at AppShell root** using the canonical docs pattern (do NOT `useMemo`):
  ```ts
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  useEffect(() => {
    const c = new StreamVideoClient({ apiKey, user: { id, name }, token });
    setVideoClient(c);
    return () => {
      c.disconnectUser().catch(console.error);
      setVideoClient(undefined);
    };
  }, [apiKey, userId, token]);
  ```
  `useMemo` + a separate cleanup-effect disconnects the client during strict-mode unmount, leaving a dead instance for the second mount and producing *"User token is not set. Either client.connectUser wasn't called or client.disconnect was called"*.
- **One client per session, not per screen.** Hoist `<StreamVideo client={videoClient}>` to AppShell. See [`CROSS-PRODUCT.md`](CROSS-PRODUCT.md) for the multi-product skeleton.
- **Call:** `client.call('default', callId)` or `client.call('livestream', callId)`
- **Join:** `call.join({ create: true })` - NOT `getOrCreate()` (doesn't connect WebRTC)
- **Strict mode:** See RULES.md > Strict mode protection. Do NOT use `useRef` locks like `initRan.current = true` - they short-circuit the second strict-mode mount and strand the UI on a "Setting up your camera..." loading state. Use a `mounted` flag in cleanup instead.
- **Custom controls only** - never use `<CallControls />`, use `useCallStateHooks()` instead
- **Livestream:** Camera/mic off by default - enable only on explicit "Go Live"

### Streamer (Go Live)

When the streamer joins their own livestream call, pass themselves as a `host` member explicitly. Call ownership alone isn't enough - Stream evaluates the call-member role at publish time:

```ts
await call.join({
  create: true,
  data: { members: [{ user_id: streamerUserId, role: "host" }] },
});
```

Otherwise `call.camera.enable()` / `call.microphone.enable()` will throw `No permission to publish VIDEO` / `No permission to publish AUDIO`.

After `join()` succeeds, `setCall(c)` immediately and **then** enable camera/mic in independent try/catch blocks. A permission failure on `enable()` should not strand the UI - render the call surface and surface the error in a banner; the user can retry via the on-screen toggles.

### Watcher (viewer)

Use the SDK's official `<LivestreamPlayer>` component for the viewer experience - it handles join, host detection, viewer count, live badge, fullscreen, and CSS sizing:

```tsx
import { LivestreamPlayer } from "@stream-io/video-react-sdk";
<LivestreamPlayer callType="livestream" callId={id} joinBehavior="asap" />
```

Do NOT roll your own host detection via `participants.find(p => p.roles.includes("host"))` - the streamer's video-level role may be `user`/`call_member`, not `host`. `LivestreamPlayer` and `LivestreamLayout` resolve this correctly.

### Gotchas

- Backstage mode is on by default for `livestream` call type - disable it via CLI setup
- `livestream` restricts video/audio publishing - grant `send-video` + `send-audio` to **all three** roles (`user`, `call_member`, `host`). Granting only `user` is **not enough** because the SDK evaluates against `call_member`/`host` at publish time. Symptom of a missed grant: `No permission to publish VIDEO`.
- **Streamers must join with `data: { members: [{ user_id, role: "host" }] }`** - call ownership alone doesn't grant publish rights for `livestream`.
- After changing call type settings, existing calls keep old settings - delete stale calls or mint a fresh `callId` to test
- **No `useMemo` for `StreamVideoClient`.** Strict-mode cleanup will disconnect the same instance reused on remount -> "User token is not set / disconnect was called". Use the `useState` + `useEffect` pattern shown above.
- **No `useRef` locks in setup effects** (e.g. `initRan.current = true`). They short-circuit the second strict-mode mount and the call never gets set, stranding the UI on "Setting up your camera...". Use a `mounted` flag in cleanup instead.
- **Camera/mic enable is independent of join().** Wrap each in its own try/catch and still `setCall(c)` after `join()` succeeds - otherwise a permission failure strands the UI on the loading state.
- No auto-recording unless explicitly asked (paid feature)
- Import `@stream-io/video-react-sdk/dist/css/styles.css` for default styles
- Call vs session: a **call** is the persistent entity; a **session** is one continuous period where participants are connected
- `upsertUsers` takes an **array** of user objects: `client.upsertUsers([{ id, name }])` - NOT an object keyed by ID
- **`ParticipantView` does not fill its container by default** - the SDK applies its own sizing/border-radius. For edge-to-edge video (e.g. livestream player), add CSS overrides: `.str-video__participant-view { width: 100% !important; height: 100% !important; border-radius: 0 !important; }` and `.str-video__participant-view video { width: 100% !important; height: 100% !important; object-fit: cover !important; border-radius: 0 !important; }`. Or use `<LivestreamPlayer>` for viewers - it handles sizing automatically.
