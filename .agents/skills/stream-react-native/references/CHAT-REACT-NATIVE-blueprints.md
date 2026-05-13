# Chat React Native - Screen and Component Blueprints

Load only the section you are implementing. For `llms.txt` manifest search, see [DOCS.md](DOCS.md). For setup, packages, and gotchas, see [CHAT-REACT-NATIVE.md](CHAT-REACT-NATIVE.md).

Expo lane: change imports from `"stream-chat-react-native"` to `"stream-chat-expo"` unless the symbol comes from React Navigation, React Native, or `stream-chat`.

---

## Request -> Blueprint section

| Request | Read section |
|---|---|
| root setup, providers, auth gate, login | App Provider and Auth Gate |
| brand new React Native or Expo app | Fresh App Scaffold |
| channel list, conversation list, channel tap | Channel List Screen |
| message list, message composer, chat screen | Channel Screen |
| optional native capability | DOCS.md -> primary manifest lookup, then Optional Native Capability Blueprint |
| thread navigation, replies, thread list | Thread Screen or Thread List Screen |
| React Navigation or Expo Router shell | Navigation Shell |
| theme, dark mode, colors, design tokens | Theming Blueprint |
| UI slot, component, behavior, or composer customization | DOCS.md -> primary manifest lookup, then Component Override Blueprint |
| offline support or sign-out cleanup | Offline and Sign-out Blueprint |

If no row matches, read [DOCS.md](DOCS.md) and [CHAT-REACT-NATIVE.md](CHAT-REACT-NATIVE.md) first, then verify symbols in manifest-selected docs or the installed package before coding.

---

## App Provider and Auth Gate

Use this when adding Stream Chat to the app root. Replace static credentials with values from the app's auth flow or [`../credentials.md`](../credentials.md).

```tsx
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Button, TextInput, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  Chat,
  OverlayProvider,
  useCreateChatClient,
} from "stream-chat-react-native";

type Session = {
  apiKey: string;
  token: string;
  userId: string;
  userName: string;
};

const Loading = () => (
  <View style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
    <ActivityIndicator size="large" />
  </View>
);

const LoginScreen = ({
  demoDefaults,
  onSession,
}: {
  demoDefaults?: Partial<Session>;
  onSession: (session: Session) => void;
}) => {
  const [apiKey, setApiKey] = useState(demoDefaults?.apiKey ?? "");
  const [token, setToken] = useState(demoDefaults?.token ?? "");
  const [userId, setUserId] = useState(demoDefaults?.userId ?? "");
  const [userName, setUserName] = useState(demoDefaults?.userName ?? "");

  const signIn = useCallback(async () => {
    if (apiKey && token && userId) {
      onSession({ apiKey, token, userId, userName: userName || userId });
      return;
    }

    const response = await fetch(
      `https://your-api.example.com/stream-token?user_id=${encodeURIComponent(userId)}`,
    );
    const body = await response.json();
    onSession({
      apiKey: body.apiKey,
      token: body.token,
      userId,
      userName: body.userName || userName || userId,
    });
  }, [apiKey, onSession, token, userId, userName]);

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <TextInput
        autoCapitalize="none"
        onChangeText={setApiKey}
        placeholder="API key"
        value={apiKey}
      />
      <TextInput
        autoCapitalize="none"
        onChangeText={setToken}
        placeholder="User token"
        value={token}
      />
      <TextInput
        autoCapitalize="none"
        onChangeText={setUserId}
        placeholder="User id"
        value={userId}
      />
      <TextInput
        autoCapitalize="words"
        onChangeText={setUserName}
        placeholder="User name"
        value={userName}
      />
      <Button disabled={!userId} onPress={signIn} title="Sign in" />
    </View>
  );
};

const ConnectedChat = ({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session;
}) => {
  const chatClient = useCreateChatClient({
    apiKey: session.apiKey,
    tokenOrProvider: session.token,
    userData: { id: session.userId, name: session.userName },
  });

  if (!chatClient) return <Loading />;

  return (
    <OverlayProvider>
      <Chat client={chatClient}>{children}</Chat>
    </OverlayProvider>
  );
};

export const StreamChatRoot = ({
  children,
  demoDefaults,
}: {
  children: React.ReactNode;
  demoDefaults?: Partial<Session>;
}) => {
  const [session, setSession] = useState<Session | null>(null);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {session ? (
        <ConnectedChat session={session}>{children}</ConnectedChat>
      ) : (
        <LoginScreen demoDefaults={demoDefaults} onSession={setSession} />
      )}
    </GestureHandlerRootView>
  );
};
```

Wiring:

- `useCreateChatClient` returns `StreamChat | null`.
- Clearing `session` unmounts `ConnectedChat` and lets the hook disconnect.
- For production, fetch tokens from the app backend.
- For local demos, prefill editable form values from CLI-generated API key, token, user, and channel setup when available.
- Do not print user tokens in final summaries or logs.

---

## Fresh App Scaffold

Use this when the current directory is empty or the user asks for a brand-new React Native or Expo Chat app. Do not cover full React Native environment setup. Scaffold the app, install Stream Chat and mandatory peers, wire the root providers, and create the first Chat screens.

Expo:

Replace `MyChatApp` with the target directory, or use `.` only when the current directory is empty and the user asked to scaffold in place.

```bash
npx create-expo-app@latest MyChatApp
cd MyChatApp
npm view stream-chat-expo version dist-tags --json
npx expo install stream-chat-expo@latest @react-native-community/netinfo expo-dev-client expo-image-manipulator react-native-gesture-handler react-native-reanimated react-native-svg react-native-teleport
npx expo install react-native-safe-area-context
npx expo prebuild
```

RN CLI:

Replace `MyChatApp` with the target directory, or use `.` only when the current directory is empty and the selected RN CLI supports in-place init.

```bash
npx @react-native-community/cli@latest init MyChatApp
cd MyChatApp
npm view stream-chat-react-native version dist-tags --json
npm install stream-chat-react-native@latest @react-native-community/netinfo react-native-gesture-handler react-native-reanimated react-native-teleport react-native-worklets react-native-svg
npm install react-native-safe-area-context
npx pod-install
```

After scaffolding, continue with these sections in order: App Provider and Auth Gate, Navigation Shell if navigation is present or desired, Channel List Screen, and Channel Screen. Start Expo with `npx expo start --dev-client`; do not target Expo Go. Optional native capabilities stay opt-in and use the dependency map in [CHAT-REACT-NATIVE.md](CHAT-REACT-NATIVE.md).

---

## Optional Native Capability Blueprint

Use this when the user asks for a capability that needs extra native packages beyond the required Stream Chat peers.

### Dependency choice and install flow

1. Use [DOCS.md](DOCS.md) to fetch the manifest-selected docs for the requested capability.
2. Read [CHAT-REACT-NATIVE.md](CHAT-REACT-NATIVE.md) > **Optional dependency map**.
3. Install only the packages needed for the requested capability.
4. Add the permissions, config plugins, pods, or prebuild steps required by those packages.
5. Verify the capability in the screen that uses it.

### Screen wiring

Keep optional UI inside the same provider and `Channel` hierarchy as the core Chat screen unless the manifest-selected docs require otherwise.

```tsx
import React, { useMemo } from "react";
import { useHeaderHeight } from "@react-navigation/elements";
import {
  Channel,
  MessageComposer,
  MessageList,
  useChatContext,
} from "stream-chat-react-native";

export const ChannelScreenWithNativeCapability = ({ route }) => {
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

Wiring:

- Keep `MessageComposer` inside `Channel`.
- Add `topInset` or `bottomInset` only after a specific layout or attachment-picker issue proves they are needed.
- Use `WithComponents` for custom buttons, previews, rows, or capability-specific UI slots.

---

## Navigation Shell

Use this for React Navigation. Keep `OverlayProvider` above navigation screens and `Chat` stable.

```tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Chat, OverlayProvider } from "stream-chat-react-native";

export type RootStackParamList = {
  Channels: undefined;
  Channel: { channelCid: string };
  Thread: undefined;
  Threads: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const NavigationShell = ({ chatClient }) => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <OverlayProvider>
        <NavigationContainer>
          <Chat client={chatClient}>
            <Stack.Navigator>
              <Stack.Screen name="Channels" component={ChannelListScreen} />
              <Stack.Screen name="Channel" component={ChannelScreen} />
              <Stack.Screen name="Thread" component={ThreadScreen} />
              <Stack.Screen name="Threads" component={ThreadListScreen} />
            </Stack.Navigator>
          </Chat>
        </NavigationContainer>
      </OverlayProvider>
    </SafeAreaProvider>
  </GestureHandlerRootView>
);
```

Expo Router:

- Put `GestureHandlerRootView`, `SafeAreaProvider`, `OverlayProvider`, and `Chat` in `app/_layout.tsx`.
- Keep route files thin: `app/index.tsx` for channel list, `app/channel/[cid].tsx` for channel screen, `app/thread.tsx` for active thread if using global thread state.

---

## Channel List Screen

Use stable filters and pass `channel.cid` when a user selects a channel.

```tsx
import React, { useMemo } from "react";
import { ChannelList } from "stream-chat-react-native";

export const ChannelListScreen = ({ navigation, route }) => {
  const userId = route.params?.userId;

  const filters = useMemo(
    () => ({ members: { $in: [userId] }, type: "messaging" }),
    [userId],
  );
  const sort = useMemo(() => [{ last_message_at: -1 }], []);
  const options = useMemo(() => ({ limit: 20, messages_limit: 30 }), []);

  return (
    <ChannelList
      filters={filters}
      onSelect={(channel) => navigation.navigate("Channel", { channelCid: channel.cid })}
      options={options}
      sort={sort}
    />
  );
};
```

Wiring:

- `filters` should include the connected user for normal messaging lists.
- Keep `filters`, `sort`, and `options` memoized.
- Do not pass `channel` through navigation params.
- For multiple lists, use `channelRenderFilterFn` or event handler overrides to keep events from reordering unrelated lists.

---

## Channel Screen

Recreate the channel from CID using the provided Chat client. `Channel` owns `MessageList` and `MessageComposer`.

```tsx
import React, { useMemo } from "react";
import { View } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import {
  Channel,
  MessageComposer,
  MessageList,
  useChatContext,
} from "stream-chat-react-native";

export const ChannelScreen = ({ navigation, route }) => {
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
      <View style={{ flex: 1 }}>
        <MessageList />
        <MessageComposer />
      </View>
    </Channel>
  );
};
```

Wiring:

- `Channel` initializes and watches the channel by default.
- Use `keyboardVerticalOffset={headerHeight}` for navigation headers.
- Add `topInset` or `bottomInset` only after a specific layout or attachment-picker issue proves they are needed. In our Expo dev-client app, adding them made the layout wrong.
- If implementing threads, store the selected thread in context or parent state. See Thread Screen.

---

## Thread Screen

Use explicit thread state. The main channel should receive the active `thread` while the thread screen is open; the thread screen renders `Channel` with `threadList`.

```tsx
import React, { createContext, useContext, useMemo, useState } from "react";
import type { LocalMessage } from "stream-chat";
import {
  Channel,
  MessageComposer,
  MessageList,
  Thread,
  useChatContext,
} from "stream-chat-react-native";

const ThreadStateContext = createContext<{
  setThread: (thread?: LocalMessage) => void;
  thread?: LocalMessage;
}>({ setThread: () => undefined });

export const useThreadState = () => useContext(ThreadStateContext);

export const ThreadStateProvider = ({ children }) => {
  const [thread, setThread] = useState<LocalMessage | undefined>();
  return (
    <ThreadStateContext.Provider value={{ setThread, thread }}>
      {children}
    </ThreadStateContext.Provider>
  );
};

export const ChannelScreenWithThreads = ({ navigation, route }) => {
  const { channelCid } = route.params;
  const { client } = useChatContext();
  const { setThread, thread } = useThreadState();

  const channel = useMemo(() => {
    const [type, id] = channelCid.split(":");
    return client.channel(type, id);
  }, [channelCid, client]);

  return (
    <Channel channel={channel} thread={thread}>
      <MessageList
        onThreadSelect={(selectedThread) => {
          setThread(selectedThread);
          navigation.navigate("Thread", { channelCid });
        }}
      />
      <MessageComposer />
    </Channel>
  );
};

export const ThreadScreen = ({ route }) => {
  const { channelCid } = route.params;
  const { client } = useChatContext();
  const { setThread, thread } = useThreadState();

  const channel = useMemo(() => {
    const [type, id] = channelCid.split(":");
    return client.channel(type, id);
  }, [channelCid, client]);

  if (!thread) return null;

  return (
    <Channel channel={channel} thread={thread} threadList>
      <Thread onThreadDismount={() => setThread(undefined)} />
    </Channel>
  );
};
```

Wiring:

- `Thread` must render inside `Channel`.
- `threadList` marks the screen as thread mode.
- `onThreadDismount` should clear the active thread.
- Offline mode does not support thread access in the referenced docs.

---

## Thread List Screen

Use this when the user asks for a list of threads.

```tsx
import React from "react";
import { useIsFocused } from "@react-navigation/native";
import { ThreadList } from "stream-chat-react-native";

export const ThreadListScreen = ({ navigation }) => {
  const isFocused = useIsFocused();
  const { setThread } = useThreadState();

  return (
    <ThreadList
      isFocused={isFocused}
      onThreadSelect={async (selectedThread, channel) => {
        setThread(selectedThread.thread);
        navigation.navigate("Thread", {
          channelCid: channel.cid,
        });
      }}
    />
  );
};
```

Wiring:

- `ThreadList` must render inside `Chat`.
- `onThreadSelect` receives `(thread, channel)`.
- Keep list item customization lightweight.

---

## Theming Blueprint

Put overlay-level style on `OverlayProvider` and Chat style on `Chat`. Keep the object stable.

```tsx
import React, { useMemo } from "react";
import type { DeepPartial, Theme } from "stream-chat-react-native";
import { Chat, OverlayProvider } from "stream-chat-react-native";

export const ThemedChat = ({ chatClient, children }) => {
  const chatTheme = useMemo<DeepPartial<Theme>>(
    () => ({
      messageItemView: {
        content: {
          markdown: {
            text: {
              fontSize: 16,
            },
          },
        },
      },
    }),
    [],
  );

  return (
    <OverlayProvider value={{ style: chatTheme }}>
      <Chat client={chatClient} style={chatTheme}>
        {children}
      </Chat>
    </OverlayProvider>
  );
};
```

Wiring:

- Prefer semantic tokens from the SDK when reading theme values.
- Do not mutate theme objects inline during render.
- Overlay components do not inherit only from `Chat`; pass style through `OverlayProvider` too.

---

## Component Override Blueprint

Use `WithComponents` for custom subcomponents. Keep custom message rows memoized and use SDK context hooks.

```tsx
import React, { memo } from "react";
import {
  Channel,
  MessageComposer,
  MessageList,
  WithComponents,
} from "stream-chat-react-native";

const CustomSlotComponent = memo(() => {
  // Use the context hook documented for the selected slot.
  return null;
});

const overrides = {
  DocumentedSlotName: CustomSlotComponent,
};

export const CustomChannel = ({ channel }) => (
  <WithComponents overrides={overrides}>
    <Channel channel={channel}>
      <MessageList />
      <MessageComposer />
    </Channel>
  </WithComponents>
);
```

Wiring:

- Prefer the smallest documented override that satisfies the requested customization.
- Avoid replacing core message components unless required.
- If replacing message row structure and still using the long-press overlay, preserve overlay anchor behavior by reading the manifest-selected context docs.

---

## Offline and Sign-out Blueprint

Use this only when offline support is requested.

```tsx
import React, { useCallback } from "react";
import { Button } from "react-native";
import { Chat, useChatContext } from "stream-chat-react-native";

export const OfflineChat = ({ chatClient, children }) => (
  <Chat client={chatClient} enableOfflineSupport>
    {children}
  </Chat>
);

export const SignOutButton = ({ onSignedOut }) => {
  const { client } = useChatContext();

  const signOut = useCallback(async () => {
    await client.offlineDb?.resetDB();
    await client.disconnectUser();
    onSignedOut();
  }, [client, onSignedOut]);

  return <Button onPress={signOut} title="Sign out" />;
};
```

Wiring:

- Install `@op-engineering/op-sqlite`.
- Expo apps use the dev-client/native-build lane by default; do not target Expo Go.
- Reset DB before disconnecting.
- Do not promise offline thread access.
