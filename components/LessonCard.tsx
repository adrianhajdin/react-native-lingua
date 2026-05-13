import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors } from "@/constants/theme";
import { Lesson } from "@/types/learning";

interface LessonCardProps {
  lesson: Lesson;
  index: number;
  isCompleted: boolean;
  isInProgress: boolean;
  onPress: () => void;
}

function getLessonThumbnail(lessonId: string): string {
  return `https://picsum.photos/seed/${lessonId}/160/100`;
}

export function LessonCard({
  lesson,
  index,
  isCompleted,
  isInProgress,
  onPress,
}: LessonCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.card, isInProgress && styles.cardInProgress]}
    >
      <View className="flex-1">
        <View className="flex-row items-center gap-2 mb-1">
          <Text className="caption">Lesson {index + 1}</Text>
          {isInProgress && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>In progress</Text>
            </View>
          )}
        </View>

        <Text
          className="font-poppins-semibold text-sm text-text-primary"
          numberOfLines={1}
        >
          {lesson.title}
        </Text>

        <Text className="caption mt-0.5">
          {lesson.activities.length} activities · {lesson.xpReward} XP
        </Text>
      </View>

      {isCompleted && (
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={16} color="#fff" />
        </View>
      )}

      {isInProgress && (
        <Image
          source={{ uri: getLessonThumbnail(lesson.id) }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardInProgress: {
    backgroundColor: "#EDE9FE",
    borderColor: "#C4B5FD",
  },
  badge: {
    backgroundColor: "rgba(108, 78, 245, 0.12)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    color: colors.primary.purple,
    fontFamily: "Poppins-Medium",
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.semantic.success,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  thumbnail: {
    width: 72,
    height: 56,
    borderRadius: 10,
    marginLeft: 12,
  },
});
