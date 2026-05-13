import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Image as RNImage,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LessonCard } from "@/components/LessonCard";
import { images } from "@/constants/images";
import { colors } from "@/constants/theme";
import { LESSONS } from "@/data/lessons";
import { UNITS } from "@/data/units";
import { useLanguageStore } from "@/store/languageStore";
import { useLearningStore } from "@/store/learningStore";
import { Lesson } from "@/types/learning";

export default function LearnScreen() {
  const router = useRouter();
  const { selectedLanguage } = useLanguageStore();
  const { completedLessonIds } = useLearningStore();

  const unit = UNITS.find((u) => u.languageCode === selectedLanguage);
  const lessons = unit
    ? (unit.lessonIds
        .map((id) => LESSONS.find((l) => l.id === id))
        .filter(Boolean) as Lesson[])
    : [];

  const completedCount = lessons.filter((l) =>
    completedLessonIds.includes(l.id)
  ).length;

  const inProgressIndex = lessons.findIndex(
    (l) => !completedLessonIds.includes(l.id)
  );

  if (!selectedLanguage || !unit) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.neutral.background }}
      >
        <View className="flex-1 items-center justify-center px-8">
          <Text className="h3 text-center mb-2">No language selected</Text>
          <Text className="body-md text-text-secondary text-center">
            Go to the home screen and pick a language to start learning.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.neutral.background }}
    >
      {/* Header */}
      <View className="px-5 pt-2 pb-3">
        <View className="flex-row items-center mb-1">
          <TouchableOpacity
            onPress={() => router.navigate("/")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.neutral.textPrimary}
            />
          </TouchableOpacity>

          <Text
            className="flex-1 text-center font-poppins-semibold text-base text-text-primary"
            numberOfLines={1}
          >
            {unit.title}
          </Text>

          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="bookmark-outline"
              size={22}
              color={colors.neutral.textPrimary}
            />
          </TouchableOpacity>
        </View>

        <Text className="caption text-center">
          Unit {unit.order} · {completedCount}/{lessons.length} lessons
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Image
            source={images.palace}
            contentFit="contain"
            style={styles.heroImage}
          />
          <RNImage
            source={images.mascotWelcome}
            style={styles.mascotImage}
            resizeMode="contain"
          />
        </View>

        {/* Lessons / Practice tabs */}
        <View className="flex-row border-b border-border mb-5">
          <View className="pb-3 mr-6 border-b-2 border-lingua-purple">
            <Text className="font-poppins-semibold text-sm text-lingua-purple">
              Lessons
            </Text>
          </View>
          <View className="pb-3">
            <Text className="font-poppins-semibold text-sm text-text-secondary">
              Practice
            </Text>
          </View>
        </View>

        {/* Lesson cards */}
        <View className="gap-3">
          {lessons.map((lesson, index) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              index={index}
              isCompleted={completedLessonIds.includes(lesson.id)}
              isInProgress={
                !completedLessonIds.includes(lesson.id) &&
                index === inProgressIndex
              }
              onPress={() => router.push(`/lesson/${lesson.id}`)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  heroContainer: {
    height: 180,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#ffffff",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  mascotImage: {
    position: "absolute",
    bottom: 0,
    right: 16,
    width: 110,
    height: 110,
  },
});
