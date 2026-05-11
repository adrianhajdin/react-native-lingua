import { useAuth, useClerk } from "@clerk/expo";
import { Redirect } from "expo-router";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const { signOut } = useClerk();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6c4ef5" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <View className="flex-1 justify-center items-center gap-4">
      <Text className="h2 text-center text-lingua-purple">Lingua</Text>
      <TouchableOpacity
        className="bg-lingua-purple rounded-2xl px-6 py-3"
        activeOpacity={0.85}
        onPress={() => signOut()}
      >
        <Text className="font-poppins-semibold text-base text-white">
          Sign Out
        </Text>
      </TouchableOpacity>
    </View>
  );
}
