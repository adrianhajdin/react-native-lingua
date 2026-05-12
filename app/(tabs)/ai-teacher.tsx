import { posthog } from "@/lib/posthog";
import { useEffect } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AITeacherScreen() {
  useEffect(() => {
    posthog.capture("ai_teacher_viewed");
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View className="flex-1 items-center justify-center">
        <Text className="h2">AI Teacher</Text>
      </View>
    </SafeAreaView>
  );
}
