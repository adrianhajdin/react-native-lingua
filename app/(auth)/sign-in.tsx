import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, FontAwesome, Ionicons } from "@expo/vector-icons";
import { type Href, router } from "expo-router";
import { useSignIn, useSSO } from "@clerk/expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { images } from "@/constants/images";
import { posthog } from "@/lib/posthog";
import SocialButton from "@/components/SocialButton";
import VerificationModal from "@/components/VerificationModal";

WebBrowser.maybeCompleteAuthSession();

type SSOStrategy = "oauth_google" | "oauth_facebook" | "oauth_apple";

export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState("");
  const [showVerification, setShowVerification] = useState(false);

  const isLoading = fetchStatus === "fetching";

  const handleSignIn = async () => {
    posthog.capture("sign_in_submitted", { method: "code" });
    const { error } = await signIn.emailCode.sendCode({ emailAddress: email });
    if (error) {
      posthog.capture("$exception", {
        $exception_list: [
          {
            type: error.name ?? "SignInError",
            value: error.message,
          },
        ],
        $exception_source: "sign-in",
      });
      return;
    }
    setShowVerification(true);
  };

  const handleVerify = async (code: string) => {
    const { error } = await signIn.emailCode.verifyCode({ code });
    if (error) {
      posthog.capture("$exception", {
        $exception_list: [
          {
            type: error.name ?? "VerificationError",
            value: error.message,
          },
        ],
        $exception_source: "sign-in-verification",
      });
      return;
    }
    if (signIn.status === "complete") {
      posthog.capture("sign_in_completed", { method: "code" });
      if (signIn.createdUserId) {
        posthog.identify(signIn.createdUserId);
      }
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          router.replace(decorateUrl("/") as Href);
        },
      });
    }
  };

  const handleResend = async () => {
    await signIn.emailCode.sendCode({ emailAddress: email });
  };

  const handleSSO = async (strategy: SSOStrategy) => {
    posthog.capture("sign_in_sso_started", { strategy });
    const { createdSessionId, setActive } = await startSSOFlow({
      strategy,
      redirectUrl: Linking.createURL("/"),
    });
    if (createdSessionId && setActive) {
      posthog.capture("sign_in_completed", { method: strategy });
      await setActive({ session: createdSessionId });
      router.replace("/");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6">
            {/* Back */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="mt-4 w-10 h-10 justify-center"
            >
              <Ionicons name="chevron-back" size={24} color="#001328" />
            </TouchableOpacity>

            {/* Header */}
            <Text className="h1 mt-4">Welcome back!</Text>
            <Text className="body-md text-text-secondary mt-2">
              Continue your language journey ✨
            </Text>

            {/* Mascot */}
            <View className="items-center mt-6 mb-6">
              <Image
                source={images.mascotAuth}
                style={{ width: 160, height: 160 }}
                resizeMode="contain"
              />
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="alex@gmail.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
            {errors.fields.identifier ? (
              <Text className="body-sm text-error -mt-2 mb-2">
                {errors.fields.identifier.message}
              </Text>
            ) : null}
            {errors.global?.[0] ? (
              <Text className="body-sm text-error mb-2">
                {errors.global[0].message}
              </Text>
            ) : null}

            {/* Sign In button */}
            <TouchableOpacity
              className="bg-lingua-purple rounded-2xl py-4 items-center mt-2"
              activeOpacity={0.85}
              onPress={handleSignIn}
              disabled={!email || isLoading}
              style={{ opacity: !email || isLoading ? 0.6 : 1 }}
              testID="sign-in-button"
            >
              <Text className="font-poppins-semibold text-base text-white">
                {isLoading ? "Sending code..." : "Sign In"}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-6 gap-3">
              <View className="flex-1 h-px bg-border" />
              <Text className="body-sm text-text-secondary">
                or continue with
              </Text>
              <View className="flex-1 h-px bg-border" />
            </View>

            {/* Social */}
            <SocialButton
              icon={<AntDesign name="google" size={20} color="#DB4437" />}
              label="Continue with Google"
              onPress={() => handleSSO("oauth_google")}
            />
            <SocialButton
              icon={<FontAwesome name="facebook" size={20} color="#1877F2" />}
              label="Continue with Facebook"
              onPress={() => handleSSO("oauth_facebook")}
            />
            <SocialButton
              icon={<AntDesign name="apple" size={20} color="#000" />}
              label="Continue with Apple"
              onPress={() => handleSSO("oauth_apple")}
            />

            {/* Sign Up link */}
            <View className="flex-row justify-center mt-4 mb-8">
              <Text className="body-md text-text-secondary">
                {"Don't have an account? "}
              </Text>
              <TouchableOpacity
                onPress={() => router.replace("/(auth)/sign-up")}
              >
                <Text className="body-md text-lingua-purple font-poppins-semibold">
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <VerificationModal
        visible={showVerification}
        email={email}
        onClose={() => setShowVerification(false)}
        onVerify={handleVerify}
        onResend={handleResend}
        error={
          errors.fields.code?.message || errors.global?.[0]?.message || ""
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    marginBottom: 12,
  },
  inputLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 2,
  },
  input: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#001328",
    padding: 0,
  },
});
