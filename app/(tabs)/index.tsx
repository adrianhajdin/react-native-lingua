import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants/images";
import { colors } from "@/constants/theme";
import { LANGUAGES } from "@/data/languages";
import { UNITS } from "@/data/units";
import { useLanguageStore } from "@/store/languageStore";
import { useLearningStore } from "@/store/learningStore";
import { LanguageCode } from "@/types/learning";

function getGreeting(langCode: LanguageCode | null): string {
  switch (langCode) {
    case "es":
      return "Hola";
    case "fr":
      return "Bonjour";
    case "ja":
      return "こんにちは";
    case "de":
      return "Hallo";
    default:
      return "Hello";
  }
}

const PLAN_ITEMS = [
  {
    id: "lesson",
    icon: "book" as const,
    iconBg: "#EDE9FE",
    iconColor: colors.primary.purple,
    title: "Lesson",
    subtitle: "At the café",
    completed: true,
  },
  {
    id: "ai-conversation",
    icon: "headset" as const,
    iconBg: "#EDE9FE",
    iconColor: colors.primary.purple,
    title: "AI Conversation",
    subtitle: "Talk about your day",
    completed: false,
  },
  {
    id: "new-words",
    icon: "chatbubble-ellipses" as const,
    iconBg: "#FEE2E2",
    iconColor: "#EF4444",
    title: "New words",
    subtitle: "10 words",
    completed: false,
  },
];

export default function HomeScreen() {
  const { user } = useUser();
  const { selectedLanguage } = useLanguageStore();
  const { xpToday, dailyGoal, streak } = useLearningStore();

  const language = LANGUAGES.find((l) => l.code === selectedLanguage);
  const unit = UNITS.find((u) => u.languageCode === selectedLanguage);
  const firstName = user?.firstName ?? "Learner";
  const greeting = getGreeting(selectedLanguage);
  const xpProgress =
    dailyGoal > 0 ? Math.min((xpToday / dailyGoal) * 100, 100) : 0;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.neutral.background }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header ── */}
        <View className="flex-row items-center justify-between mb-5">
          <View className="flex-row items-center gap-[10px]">
            {language ? (
              <Image
                source={{ uri: language.flag }}
                className="w-[34px] h-[34px] rounded-full"
              />
            ) : (
              <View className="w-[34px] h-[34px] rounded-full bg-surface" />
            )}
            <Text className="font-poppins-semibold text-base text-text-primary">
              {greeting}, {firstName}! 👋
            </Text>
          </View>

          <View className="flex-row items-center gap-[14px]">
            <View className="flex-row items-center gap-1">
              <Image source={images.streakFire} className="w-[22px] h-[22px]" />
              <Text className="font-poppins-semibold text-[15px] text-streak">
                {streak}
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.7}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={colors.neutral.textPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Daily Goal Card ── */}
        <View className="flex-row items-center bg-[#FFF5E8] rounded-[20px] py-4 pl-5 pr-3 mb-4">
          <View className="flex-1 pr-2">
            <Text className="font-poppins text-xs text-text-secondary mb-1">
              Daily goal
            </Text>
            <Text>
              <Text className="font-poppins-bold text-[28px] text-text-primary leading-[34px]">
                {xpToday}
              </Text>
              <Text className="font-poppins text-sm text-text-secondary leading-[34px]">
                {` / ${dailyGoal} XP`}
              </Text>
            </Text>
            <View className="h-2 bg-border rounded mt-[10px] overflow-hidden">
              <View
                className="h-2 bg-streak rounded"
                style={{ width: `${Math.round(xpProgress)}%` as `${number}%` }}
              />
            </View>
          </View>
          <Image
            source={images.treasure}
            className="w-20 h-20"
            resizeMode="contain"
          />
        </View>

        {/* ── Continue Learning Card ── */}
        <View className="flex-row bg-lingua-purple rounded-[20px] h-[160px] mb-6 overflow-hidden">
          <View className="flex-1 py-5 pl-5 pr-2 justify-between">
            <View>
              <Text className="font-poppins text-[11px] text-white/75 mb-0.5">
                Continue learning
              </Text>
              <Text className="font-poppins-bold text-[22px] text-white leading-7">
                {language?.name ?? "Pick a language"}
              </Text>
              <Text className="font-poppins text-xs text-white/65 mt-0.5">
                A1 · Unit {unit?.order ?? 1}
              </Text>
            </View>
            <TouchableOpacity
              className="bg-white rounded-xl py-2 px-[22px] self-start"
              activeOpacity={0.85}
            >
              <Text className="font-poppins-semibold text-[13px] text-lingua-purple">
                Continue
              </Text>
            </TouchableOpacity>
          </View>
          <Image
            source={images.palace}
            className="w-[130px] h-[160px]"
            resizeMode="cover"
          />
        </View>

        {/* ── Today's Plan Header ── */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-poppins-semibold text-[17px] text-text-primary">
            Today's plan
          </Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text className="font-poppins-medium text-[13px] text-lingua-blue">
              View all
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Today's Plan Card ── */}
        <View
          className="bg-white rounded-[20px] border border-border mb-4 overflow-hidden"
          style={styles.planCardShadow}
        >
          {PLAN_ITEMS.map((item, index) => (
            <View key={item.id}>
              {index > 0 && <View className="h-px bg-border mx-4" />}
              <View className="flex-row items-center px-4 py-[14px]">
                <View
                  className="w-11 h-11 rounded-xl items-center justify-center"
                  style={{ backgroundColor: item.iconBg }}
                >
                  <Ionicons name={item.icon} size={20} color={item.iconColor} />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="font-poppins-semibold text-sm text-text-primary mb-0.5">
                    {item.title}
                  </Text>
                  <Text className="font-poppins text-xs text-text-secondary">
                    {item.subtitle}
                  </Text>
                </View>
                {item.completed ? (
                  <View className="w-[26px] h-[26px] rounded-full bg-lingua-blue items-center justify-center">
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                ) : (
                  <View className="w-[26px] h-[26px] rounded-full border-2 border-border" />
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ScrollView.contentContainerStyle and shadow (iOS/Android) must stay in StyleSheet
const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 100,
  },
  planCardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
});
