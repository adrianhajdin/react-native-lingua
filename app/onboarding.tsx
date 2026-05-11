import { images } from "@/constants/images";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View className="flex-1 px-6">
        {/* Logo header */}
        <View className="flex-row items-center justify-center gap-2 mt-4">
          <Image source={images.mascotLogo} className="w-10 h-10" />
          <Text className="font-poppins-semibold text-xl text-text-primary">
            lingua
          </Text>
        </View>

        {/* Hero heading */}
        <Text className="h1 mt-8">
          {"Your AI language\n"}
          <Text className="text-lingua-purple">teacher.</Text>
        </Text>

        {/* Subtitle */}
        <Text className="body-md text-text-secondary mt-3">
          Real conversations, personalized lessons, anytime, anywhere.
        </Text>

        {/* Mascot illustration with speech bubbles */}
        <View className="flex-1 mt-4">
          <Image
            source={images.mascotWelcome}
            className="flex-1 w-full"
            resizeMode="contain"
          />

          <View
            className="absolute bg-white rounded-2xl px-4 py-2.5 left-0 top-[35%]"
            style={styles.shadow}
          >
            <Text className="font-poppins-medium text-sm text-text-primary">
              Hello!
            </Text>
          </View>

          <View
            className="absolute bg-white rounded-2xl px-4 py-2.5 right-0 top-[10%]"
            style={styles.shadow}
          >
            <Text className="font-poppins-medium text-sm text-text-primary">
              ¡Hola!
            </Text>
          </View>

          <View
            className="absolute bg-white rounded-2xl px-4 py-2.5 right-5 top-[60%]"
            style={styles.shadow}
          >
            <Text className="font-poppins-medium text-sm text-error">
              你好!
            </Text>
          </View>
        </View>

        {/* CTA button */}
        <TouchableOpacity
          className="bg-lingua-purple rounded-2xl flex-row items-center justify-center mt-2 mb-6 py-4.5"
          activeOpacity={0.85}
          onPress={() => router.push("/(auth)/sign-up")}
        >
          <Text className="font-poppins-semibold text-base text-white">
            Get Started
          </Text>
          <Ionicons
            name="chevron-forward"
            size={22}
            color="#fff"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
});
