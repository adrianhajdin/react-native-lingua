import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants/images";
import { colors } from "@/constants/theme";
import { LESSONS } from "@/data/lessons";

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const lesson = LESSONS.find((l) => l.id === id);

  const [isMicOn, setIsMicOn] = useState(true);
  const [subtitlesOn, setSubtitlesOn] = useState(true);

  if (!lesson) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral.background }}>
        <View className="flex-1 items-center justify-center">
          <Text className="body-md text-text-secondary">Lesson not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.neutral.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>AI Teacher</Text>

        <View style={styles.headerRight}>
          <View style={styles.timerBadge}>
            <Ionicons name="videocam-outline" size={13} color={colors.neutral.textPrimary} />
            <Text style={styles.timerText}>12</Text>
          </View>
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="notifications-outline" size={22} color={colors.neutral.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Online status */}
      <View style={styles.statusRow}>
        <View style={styles.onlineDot} />
        <Text style={styles.onlineText}>Online</Text>
      </View>

      {/* Call area */}
      <View style={styles.callArea}>
        {/* Fox mascot */}
        <Image
          source={images.mascotWelcome}
          contentFit="contain"
          style={styles.mascot}
        />

        {/* Teacher response bubble */}
        <View style={styles.responseBubble}>
          <View style={styles.responseBubbleText}>
            <Text style={styles.responsePrimary}>¡Muy bien!</Text>
            <Text style={styles.responseSecondary}>That was great! 👋</Text>
          </View>
          <TouchableOpacity style={styles.speakerButton}>
            <Ionicons name="volume-medium-outline" size={20} color={colors.primary.purple} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Controls — outside the call area, on plain background */}
      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.controlButton}>
          <View style={styles.controlIconCircle}>
            <Ionicons name="videocam" size={24} color={colors.neutral.textPrimary} />
          </View>
          <Text style={styles.controlLabel}>Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setIsMicOn((v) => !v)}
        >
          <View style={styles.controlIconCircle}>
            <Ionicons name={isMicOn ? "mic" : "mic-off"} size={24} color={colors.neutral.textPrimary} />
          </View>
          <Text style={styles.controlLabel}>Mic</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setSubtitlesOn((v) => !v)}
        >
          <View style={[styles.controlIconCircle, !subtitlesOn && styles.controlIconCircleOff]}>
            <Text style={styles.aaText}>Aa</Text>
          </View>
          <Text style={styles.controlLabel}>Subtitles</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={() => router.back()}>
          <View style={[styles.controlIconCircle, styles.endCallCircle]}>
            <Ionicons name="call" size={24} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
          </View>
          <Text style={styles.controlLabel}>End Call</Text>
        </TouchableOpacity>
      </View>

      {/* Session feedback */}
      <View style={styles.feedbackRow}>
        <View style={styles.feedbackItem}>
          <Text style={styles.feedbackLabel}>Speaking</Text>
          <Text style={[styles.feedbackValue, { color: colors.semantic.success }]}>Excellent</Text>
        </View>
        <View style={styles.feedbackDivider} />
        <View style={styles.feedbackItem}>
          <Text style={styles.feedbackLabel}>Pronunciation</Text>
          <Text style={[styles.feedbackValue, { color: colors.primary.blue }]}>Great</Text>
        </View>
        <View style={styles.feedbackDivider} />
        <View style={styles.feedbackItem}>
          <Text style={styles.feedbackLabel}>Grammar</Text>
          <Text style={[styles.feedbackValue, { color: colors.primary.purple }]}>Good</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: colors.neutral.textPrimary,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.neutral.surface,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timerText: {
    fontFamily: "Poppins-Medium",
    fontSize: 12,
    color: colors.neutral.textPrimary,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.semantic.success,
  },
  onlineText: {
    fontFamily: "Poppins-Medium",
    fontSize: 13,
    color: colors.semantic.success,
  },
  callArea: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 24,
    backgroundColor: "#F4F2FF",
    overflow: "hidden",
    position: "relative",
  },
  mascot: {
    position: "absolute",
    top: 0,
    bottom: 80,
    left: -20,
    right: -20,
  },
  responseBubble: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  responseBubbleText: {
    flex: 1,
  },
  responsePrimary: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: colors.neutral.textPrimary,
  },
  responseSecondary: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: colors.neutral.textSecondary,
    marginTop: 1,
  },
  speakerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  controlButton: {
    alignItems: "center",
    gap: 8,
  },
  controlIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  controlIconCircleOff: {
    backgroundColor: colors.neutral.surface,
  },
  aaText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: colors.neutral.textPrimary,
  },
  endCallCircle: {
    backgroundColor: "#E8453C",
  },
  controlLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: colors.neutral.textSecondary,
  },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  feedbackItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  feedbackLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: colors.neutral.textSecondary,
  },
  feedbackValue: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
  },
  feedbackDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.neutral.border,
  },
});
