# Stream React Native - shared SDK patterns

This file holds shared React Native and Expo patterns for Stream Chat RN. Load it before Chat-specific references when you need lifecycle, auth, provider, navigation, offline, or sign-out guidance.

---

## Runtime package lane

| Runtime | Package | Import from |
|---|---|---|
| RN CLI | `stream-chat-react-native` | `"stream-chat-react-native"` |
| Expo | `stream-chat-expo` | `"stream-chat-expo"` |

Most component names are the same across lanes. Swap the import package to match the project. Import Stream Chat client types from `stream-chat` only when needed.

Never mix `stream-chat-react-native` and `stream-chat-expo` in the same app unless the existing project already does so intentionally.

---

## Required root shape

All Chat UI needs `GestureHandlerRootView`, `OverlayProvider`, and `Chat`.

```tsx
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  Chat,
  OverlayProvider,
  useCreateChatClient,
} from "stream-chat-react-native";

type ChatRootProps = {
  apiKey: string;
  tokenOrProvider: string | (() => Promise<string>);
  userId: string;
  userName: string;
  children: React.ReactNode;
};

export const ChatRoot = ({
  apiKey,
  children,
  tokenOrProvider,
  userId,
  userName,
}: ChatRootProps) => {
  const chatClient = useCreateChatClient({
    apiKey,
    tokenOrProvider,
    userData: { id: userId, name: userName },
  });

  if (!chatClient) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <OverlayProvider>
        <Chat client={chatClient}>{children}</Chat>
      </OverlayProvider>
    </GestureHandlerRootView>
  );
};
```

For Expo, change imports from `stream-chat-react-native` to `stream-chat-expo`.

`useCreateChatClient` returns `null` while connecting. Never pass `null` to `Chat`.

---

## Auth model

Production apps should fetch tokens from the app backend. A token provider lets the SDK refresh tokens:

```tsx
const tokenProvider = async () => {
  const response = await fetch(
    `https://your-api.example.com/stream-token?user_id=${encodeURIComponent(userId)}`,
  );
  const body = await response.json();
  return body.token;
};
```

Local demos can use a CLI-generated token from [`credentials.md`](credentials.md). Do not use `devToken()` for production.

If the app already has auth, extend that flow. Do not add an unrelated login system unless the user asks for a demo shell.

---

## React Navigation placement

When using React Navigation, keep `OverlayProvider` above navigation screens and keep `Chat` stable:

```tsx
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

const Stack = createNativeStackNavigator();

export const AppShell = ({ chatClient }) => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <OverlayProvider>
        <NavigationContainer>
          <Chat client={chatClient}>
            <Stack.Navigator>
              <Stack.Screen name="Channels" component={ChannelListScreen} />
              <Stack.Screen name="Channel" component={ChannelScreen} />
              <Stack.Screen name="Thread" component={ThreadScreen} />
            </Stack.Navigator>
          </Chat>
        </NavigationContainer>
      </OverlayProvider>
    </SafeAreaProvider>
  </GestureHandlerRootView>
);
```

For Expo Router, put the same provider stack in `app/_layout.tsx`. Keep screen files focused on `ChannelList`, `Channel`, `MessageList`, `MessageComposer`, `Thread`, or `ThreadList`.

If `createNativeStackNavigator` or modal presentation causes overlay layering problems, keep the chat screens inside the provider subtree and avoid full-screen native modals for Chat until the overlay behavior is verified.

---

## Channel list and channel navigation

Use stable filters and sort values. Pass a channel CID through navigation, not a `Channel` instance.

```tsx
import React, { useMemo } from "react";
import { ChannelList } from "stream-chat-react-native";

export const ChannelListScreen = ({ navigation, userId }) => {
  const filters = useMemo(
    () => ({ members: { $in: [userId] }, type: "messaging" }),
    [userId],
  );
  const sort = useMemo(() => [{ last_message_at: -1 }], []);

  return (
    <ChannelList
      filters={filters}
      onSelect={(channel) => navigation.navigate("Channel", { channelCid: channel.cid })}
      sort={sort}
    />
  );
};
```

Recreate the channel on the destination from `useChatContext().client`:

```tsx
import React, { useMemo } from "react";
import { useHeaderHeight } from "@react-navigation/elements";
import {
  Channel,
  MessageComposer,
  MessageList,
  useChatContext,
} from "stream-chat-react-native";

export const ChannelScreen = ({ route }) => {
  const { channelCid } = route.params;
  const { client } = useChatContext();
  const headerHeight = useHeaderHeight();

  const channel = useMemo(() => {
    const [type, id] = channelCid.split(":");
    return client.channel(type, id);
  }, [channelCid, client]);

  return (
    <Channel
      channel={channel}
      keyboardVerticalOffset={headerHeight}
    >
      <MessageList />
      <MessageComposer />
    </Channel>
  );
};
```

---

## Threads

Keep the current thread in explicit state or context. When navigating to a thread screen, pass the thread value to both the main `Channel` and the thread `Channel`.

```tsx
<Channel channel={channel} thread={thread}>
  <MessageList
    onThreadSelect={(selectedThread) => {
      setThread(selectedThread);
      navigation.navigate("Thread");
    }}
  />
  <MessageComposer />
</Channel>
```

```tsx
<Channel channel={channel} thread={thread} threadList>
  <Thread onThreadDismount={() => setThread(undefined)} />
</Channel>
```

Use `ThreadList` inside `Chat` when the user asks for an inbox of threads.

---

## Theming and component overrides

Prefer theme or `WithComponents` overrides before replacing full core components.

```tsx
import { WithComponents } from "stream-chat-react-native";

<WithComponents overrides={{ MessageAuthor: CustomAuthor }}>
  <Channel channel={channel}>
    <MessageList />
    <MessageComposer />
  </Channel>
</WithComponents>;
```

Put overlay-level theme values on `OverlayProvider` so attachment picker, image gallery, and message overlays receive them:

```tsx
<OverlayProvider value={{ style: chatTheme }}>
  <Chat client={chatClient} style={chatTheme}>
    {children}
  </Chat>
</OverlayProvider>
```

Keep theme objects stable with `useMemo`.

---

## Offline support

For normal Chat setup, `useCreateChatClient` is preferred. For offline-first behavior, the docs require starting `connectUser`, setting UI ready immediately, and not waiting for the connection promise before rendering Chat.

Use this manual pattern only when offline support is requested and initial offline rendering matters:

```tsx
import React, { useEffect, useMemo, useState } from "react";
import { StreamChat } from "stream-chat";
import { Chat } from "stream-chat-react-native";

export const OfflineChatRoot = ({ apiKey, children, tokenOrProvider, user }) => {
  const client = useMemo(() => StreamChat.getInstance(apiKey), [apiKey]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const connectPromise = client.connectUser(user, tokenOrProvider);
    setIsReady(true);

    connectPromise.catch((error) => {
      if (mounted) console.warn("Stream connect failed", error);
    });

    return () => {
      mounted = false;
    };
  }, [tokenOrProvider, user]);

  if (!isReady) return null;

  return <Chat client={client} enableOfflineSupport>{children}</Chat>;
};
```

On sign-out with offline enabled:

```tsx
await chatClient.offlineDb?.resetDB();
await chatClient.disconnectUser();
```

Expo apps in this skill use a dev-client/native-build lane by default; do not target Expo Go.

---

## Native multipart uploads

For upload progress in current React Native and Expo native builds, use the native multipart driver:

```tsx
<Chat client={chatClient} useNativeMultipartUpload={true}>
  {children}
</Chat>
```

Expo apps already use a dev-client/native-build lane. If the app does not have native projects yet, generate them and start the dev client:

```bash
npx expo prebuild
npx expo start --dev-client
```

Do not use Expo Go for `stream-chat-expo` apps in this skill.

### Upload troubleshooting

Known simulator-only issue: on iOS Simulator, after fully closing and reopening the app, the first native multipart upload can fail while later uploads may proceed. Verify on a real device before treating it as a general SDK bug.

Recommended debug points:

- JS native multipart adapter
- `nativeMultipartUpload`
- message input upload failure path
- iOS Swift multipart bridge/manager logs

---

## Push notifications

If the user asks for push notifications, use [references/DOCS.md](references/DOCS.md) to fetch the manifest-selected push notification docs before editing. Do not assume background WebSocket behavior, provider registration steps, or default prop values from memory.

---

## Verification checklist

Before calling the work done, confirm:

- imports match the runtime package lane
- `react-native-teleport` is installed for overlay support
- mandatory peer dependencies are installed for the selected lane
- optional dependencies are installed only for requested capabilities
- Babel plugin is last
- app entry is wrapped in `GestureHandlerRootView`
- `OverlayProvider` and `Chat` are stable and high in the tree
- `ChannelList` filters include the connected user for normal messaging lists
- navigation passes channel CID, not channel object
- `Channel` owns `MessageList` and `MessageComposer`
- thread state is shared between channel and thread screens
- offline sign-out resets DB before disconnect when offline is enabled
