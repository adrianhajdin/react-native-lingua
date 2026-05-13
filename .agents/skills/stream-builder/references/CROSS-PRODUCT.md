# Cross-product AppShell - canonical pattern

When using two or more of Chat / Video / Feeds in the same app, mount all clients **once** at AppShell and provide them at the root. Per-screen components only render `<Channel>`, `<StreamCall>`, or `<StreamFeed>` from the existing providers - never re-instantiate the clients.

Source of truth: `video/react/10-advanced/06-chat-with-video.md` from the Stream docs (the messenger-clone reference app).

## AppShell skeleton

```tsx
"use client";

import { useEffect, useState } from "react";
import { Chat, useCreateChatClient } from "stream-chat-react";
import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk";
import {
  StreamFeeds,
  useCreateFeedsClient,
  type Feed,
} from "@stream-io/feeds-react-sdk";
import { useTheme } from "next-themes";

import "stream-chat-react/dist/css/index.css";
import "@stream-io/video-react-sdk/dist/css/styles.css";

type Auth = {
  apiKey: string;
  userId: string;
  name: string;
  chatToken: string;
  videoToken: string;
  feedToken: string;
};

export default function AppShell({ auth, children }: { auth: Auth; children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  // CHAT - official hook handles strict-mode + lifecycle
  const chatClient = useCreateChatClient({
    apiKey: auth.apiKey,
    tokenOrProvider: auth.chatToken,
    userData: { id: auth.userId, name: auth.name },
  });

  // FEEDS - official hook handles strict-mode + lifecycle
  const feedsClient = useCreateFeedsClient({
    apiKey: auth.apiKey,
    tokenOrProvider: auth.feedToken,
    userData: { id: auth.userId, name: auth.name },
  });

  // VIDEO - canonical useState + useEffect (NOT useMemo)
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  useEffect(() => {
    const c = new StreamVideoClient({
      apiKey: auth.apiKey,
      user: { id: auth.userId, name: auth.name },
      token: auth.videoToken,
    });
    setVideoClient(c);
    return () => {
      c.disconnectUser().catch(console.error);
      setVideoClient(undefined);
    };
  }, [auth.apiKey, auth.userId, auth.name, auth.videoToken]);

  if (!chatClient || !feedsClient || !videoClient) return <Loading />;

  const themeClass = resolvedTheme === "dark" ? "str-chat__theme-dark" : "str-chat__theme-light";

  return (
    <Chat client={chatClient} theme={themeClass}>
      <StreamVideo client={videoClient}>
        <StreamFeeds client={feedsClient}>{children}</StreamFeeds>
      </StreamVideo>
    </Chat>
  );
}
```

The order of `<Chat>` / `<StreamVideo>` / `<StreamFeeds>` doesn't matter - they don't depend on each other. Each provides a context that the per-screen components read.

## Per-screen pattern

Inside any screen (Hub, Watch, GoLive, etc.):

```tsx
import { useChatContext, Channel, Window, MessageList, MessageComposer } from "stream-chat-react";
import { useStreamVideoClient, StreamCall } from "@stream-io/video-react-sdk";
import { useFeedsClient, StreamFeed } from "@stream-io/feeds-react-sdk";

function WatchScreen({ callId }: { callId: string }) {
  const { client: chatClient } = useChatContext();   // from <Chat>
  const videoClient = useStreamVideoClient();        // from <StreamVideo>
  const feedsClient = useFeedsClient();              // from <StreamFeeds>

  // create a per-screen channel/call/feed from the long-lived clients
  const [channel, setChannel] = useState(null);
  useEffect(() => {
    if (!chatClient) return;
    const ch = chatClient.channel("livestream", callId);
    ch.watch().then(() => setChannel(ch));
    return () => { ch.stopWatching().catch(() => {}); };
  }, [chatClient, callId]);

  // ... etc
}
```

**Cleanup is per-resource, not per-client:**
- Channel: `channel.stopWatching()` (NEVER `chatClient.disconnectUser()`).
- Call: `call.leave()` (NEVER `videoClient.disconnectUser()`).
- Feed: usually no cleanup needed; the `<StreamFeeds>` provider keeps state alive.

## Common error -> cause -> fix

| Symptom | Cause | Fix |
|---|---|---|
| `User token is not set... disconnect was called` (video) | `useMemo` for `StreamVideoClient`; strict-mode disconnects the same instance reused on remount | useState + useEffect with empty cleanup; `setClient(undefined)` |
| `You can't use a channel after client.disconnect was called` (chat) | `new StreamChat()` created per screen; cleanup races with `channel.watch()` | Hoist `<Chat>` to root via `useCreateChatClient`; per-screen only does `client.channel(...).watch()` + `stopWatching()` |
| `user_id is required for server side requests` | Server-side `client.feeds.*` mutation missing `user_id` | Pass acting user's id; required for `addActivity`, `updateActivity`, `addComment`, etc (NOT `deleteActivity`). See `FEEDS.md` |
| `No permission to publish VIDEO` / `AUDIO` (livestream) | `livestream` `call_member`/`host` roles default to `*-owner` grants only | Grant unrestricted `send-video` + `send-audio` to **`user`, `call_member`, AND `host`** roles; join with `data: { members: [{ user_id, role: "host" }] }`. See `VIDEO.md` |
| "Setting up your camera..." never clears | useEffect bails on strict-mode remount due to `useRef` lock | Use mounted-flag cleanup; setCall after join, then enable camera/mic in independent try/catch blocks |
| `MessageInput` undefined import (chat) | Renamed in stream-chat-react v14 | Use `MessageComposer` from `stream-chat-react` |
| `Module not found: stream-chat-react/dist/css/v2/index.css` | v14 removed the `/v2/` subpath | Import `stream-chat-react/dist/css/index.css` |

## Token route

Single `/api/token` endpoint that mints all needed tokens in one round-trip:

```ts
import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";
import { StreamChat } from "stream-chat";

const apiKey = process.env.STREAM_API_KEY!;
const apiSecret = process.env.STREAM_API_SECRET!;
const videoClient = new StreamClient(apiKey, apiSecret);
const chatClient = StreamChat.getInstance(apiKey, apiSecret);

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  const sanitized = userId.toLowerCase().replace(/[^a-z0-9_-]/g, "_");

  await Promise.all([
    videoClient.upsertUsers([{ id: sanitized, name: userId, role: "user" }]),
    chatClient.upsertUsers([{ id: sanitized, name: userId, role: "user" }]),
  ]);

  return NextResponse.json({
    apiKey,
    userId: sanitized,
    name: userId,
    chatToken: chatClient.createToken(sanitized),
    videoToken: videoClient.generateUserToken({ user_id: sanitized }),
    feedToken: videoClient.generateUserToken({ user_id: sanitized }),
  });
}
```

Only upsert the requesting user - never seed demo users (RULES.md > No auto-seeding).
