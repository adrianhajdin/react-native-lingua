import { Lesson } from "@/types/learning";
import { useAuth, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import {
  Call,
  CallClosedCaption,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
} from "@stream-io/video-react-native-sdk";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants/images";
import { colors } from "@/constants/theme";
import { LESSONS } from "@/data/lessons";
import { posthog } from "@/lib/posthog";
import { useLanguageStore } from "@/store/languageStore";

type CallStatus = "idle" | "connecting" | "joined" | "error";
type AgentStatus = "idle" | "connecting" | "connected" | "failed";

const AGENT_USER_ID = "ai-teacher";

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { selectedLanguage } = useLanguageStore();

  const lesson = LESSONS.find((l) => l.id === id);

  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("idle");

  const callRef = useRef<Call | null>(null);
  const clientRef = useRef<StreamVideoClient | null>(null);
  const agentSessionRef = useRef<string | null>(null);
  const lessonStartTimeRef = useRef<number | null>(null);
  const abandonedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !user || !lesson) return;

    lessonStartTimeRef.current = Date.now();
    abandonedRef.current = false;
    const lessonNumber = LESSONS.findIndex((l) => l.id === lesson.id) + 1;
    posthog.capture("lesson_started", {
      lesson_id: lesson.id,
      language: selectedLanguage ?? lesson.id.split("-")[0],
      lesson_number: lessonNumber,
    });

    startCall();

    return () => {
      if (!abandonedRef.current) {
        abandonedRef.current = true;
        posthog.capture("lesson_abandoned", {
          lesson_id: lesson.id,
          time_into_lesson_seconds: lessonStartTimeRef.current
            ? Math.floor((Date.now() - lessonStartTimeRef.current) / 1000)
            : 0,
          last_question_index: 0,
        });
      }
      callRef.current?.leave().catch(console.error);
      clientRef.current?.disconnectUser().catch(console.error);
      stopAgentSession(callRef.current?.id ?? null, agentSessionRef.current);
    };
  }, [isLoaded, user, lesson]);

  async function startCall() {
    if (!user || !lesson) return;
    setCallStatus("connecting");

    try {
      const clerkToken = await getToken();
      if (!clerkToken) throw new Error("Not authenticated");
      const res = await fetch("/api/stream-token", {
        headers: { Authorization: `Bearer ${clerkToken}` },
      });
      if (!res.ok) throw new Error("Token fetch failed");
      const { token, apiKey } = await res.json();

      const streamClient = StreamVideoClient.getOrCreateInstance({
        apiKey,
        token,
        user: {
          id: user.id,
          name: user.fullName ?? user.id,
          image: user.imageUrl || undefined,
        },
      });

      const callId = `lesson-${lesson.id}-${user.id}`;
      const streamCall = streamClient.call("default", callId);
      await streamCall.join({ create: true });

      // Mute mic immediately — push-to-talk mode prevents echo
      try {
        await streamCall.microphone.disable();
      } catch {}

      const language = selectedLanguage ?? (lesson.id.split("-")[0] as string);
      try {
        await streamCall.update({
          custom: {
            lesson_id: lesson.id,
            lesson_title: lesson.title,
            language,
            goals: lesson.goals.map((g) => g.description),
            vocabulary: lesson.vocabulary.map(
              (v) => `${v.word}: ${v.translation}`,
            ),
            phrases: lesson.phrases.map((p) => p.text),
            topics: lesson.aiTeacherPrompt.topics,
            system_prompt: lesson.aiTeacherPrompt.systemPrompt,
            intro_message: lesson.aiTeacherPrompt.introMessage,
          },
        });
      } catch (updateErr) {
        console.warn(
          "[lesson] call.update failed (agent will use default prompts):",
          updateErr,
        );
      }

      // Start live captions — transcribes both teacher and student speech in real time
      try {
        await streamCall.startClosedCaptions();
      } catch (e) {
        console.warn("[lesson] startClosedCaptions failed:", e);
      }

      callRef.current = streamCall;
      clientRef.current = streamClient;
      setClient(streamClient);
      setCall(streamCall);
      setCallStatus("joined");

      startAgentSession(callId);
    } catch (err) {
      console.error("Stream call error:", err);
      setCallStatus("error");
    }
  }

  async function startAgentSession(callId: string) {
    setAgentStatus("connecting");
    try {
      const res = await fetch("/api/agent-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId, callType: "default" }),
      });
      if (res.ok) {
        const { session_id } = await res.json();
        agentSessionRef.current = session_id ?? null;
        setAgentStatus("connected");
      } else {
        const errBody = await res.json().catch(() => ({}));
        console.error("[lesson] agent-session failed:", res.status, errBody);
        setAgentStatus("failed");
      }
    } catch (err) {
      console.error("[lesson] agent-session network error:", err);
      setAgentStatus("failed");
    }
  }

  function stopAgentSession(callId: string | null, sessionId: string | null) {
    if (!callId || !sessionId) return;
    fetch(
      `/api/agent-session?callId=${encodeURIComponent(callId)}&sessionId=${encodeURIComponent(sessionId)}`,
      { method: "DELETE" },
    ).catch(() => {});
  }

  async function handleLeave() {
    if (!abandonedRef.current) {
      abandonedRef.current = true;
      posthog.capture("lesson_abandoned", {
        lesson_id: lesson?.id ?? id,
        time_into_lesson_seconds: lessonStartTimeRef.current
          ? Math.floor((Date.now() - lessonStartTimeRef.current) / 1000)
          : 0,
        last_question_index: 0,
      });
    }
    const callId = callRef.current?.id ?? null;
    const sessionId = agentSessionRef.current;
    try {
      await callRef.current?.leave();
      clientRef.current?.disconnectUser();
    } catch {}
    callRef.current = null;
    clientRef.current = null;
    agentSessionRef.current = null;
    stopAgentSession(callId, sessionId);
    router.back();
  }

  if (!lesson) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.neutral.background }}
      >
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 14,
              color: colors.neutral.textSecondary,
            }}
          >
            Lesson not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayStatus = getDisplayStatus(callStatus, agentStatus);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header — back left, title center, end call right */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleLeave}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={colors.neutral.textPrimary}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>AI Teacher</Text>

        <TouchableOpacity
          style={styles.endCallButton}
          onPress={handleLeave}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="call"
            size={18}
            color="#fff"
            style={{ transform: [{ rotate: "135deg" }] }}
          />
        </TouchableOpacity>
      </View>

      {/* Agent status row */}
      <View style={styles.statusRow}>
        <View
          style={[styles.onlineDot, { backgroundColor: displayStatus.color }]}
        />
        <Text style={[styles.onlineText, { color: displayStatus.color }]}>
          {displayStatus.label}
        </Text>
      </View>

      {/* Call area + push-to-talk — inside StreamCall so useCallClosedCaptions works */}
      {callStatus === "joined" && client && call ? (
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <ActiveCallContent
              agentStatus={agentStatus}
              lesson={lesson}
              call={call}
              onRetry={() => startAgentSession(call.id)}
            />
          </StreamCall>
        </StreamVideo>
      ) : (
        <>
          {/* Pre-join state: no stream context yet */}
          <View style={styles.callArea}>
            <Image
              source={images.mascotWelcome}
              contentFit="contain"
              style={[styles.mascot, { opacity: 0.5 }]}
            />
            {callStatus === "connecting" && (
              <View style={styles.responseBubble}>
                <ActivityIndicator
                  size="small"
                  color={colors.primary.purple}
                  style={{ marginRight: 12 }}
                />
                <View style={styles.responseBubbleText}>
                  <Text style={styles.responsePrimary}>Connecting...</Text>
                  <Text style={styles.responseSecondary}>
                    Setting up your lesson
                  </Text>
                </View>
              </View>
            )}
            {callStatus === "error" && (
              <View style={styles.responseBubble}>
                <View style={styles.responseBubbleText}>
                  <Text style={styles.responsePrimary}>Connection failed</Text>
                  <Text style={styles.responseSecondary}>Tap to retry</Text>
                </View>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={startCall}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={20}
                    color={colors.primary.purple}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={styles.pushToTalkSection}>
            <DisabledMicButton callStatus={callStatus} />
          </View>
        </>
      )}

      {/* Session feedback */}
      <View style={styles.feedbackRow}>
        <View style={styles.feedbackItem}>
          <Text style={styles.feedbackLabel}>Speaking</Text>
          <Text
            style={[styles.feedbackValue, { color: colors.semantic.success }]}
          >
            Excellent
          </Text>
        </View>
        <View style={styles.feedbackDivider} />
        <View style={styles.feedbackItem}>
          <Text style={styles.feedbackLabel}>Pronunciation</Text>
          <Text style={[styles.feedbackValue, { color: colors.primary.blue }]}>
            Great
          </Text>
        </View>
        <View style={styles.feedbackDivider} />
        <View style={styles.feedbackItem}>
          <Text style={styles.feedbackLabel}>Grammar</Text>
          <Text
            style={[styles.feedbackValue, { color: colors.primary.purple }]}
          >
            Good
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

type PartialCaption = { speaker: "agent" | "user"; text: string };

// Rendered inside StreamCall — accesses live captions and mic state via hooks
function ActiveCallContent({
  agentStatus,
  lesson,
  call,
  onRetry,
}: {
  agentStatus: AgentStatus;
  lesson: Lesson;
  call: Call;
  onRetry: () => void;
}) {
  const { useMicrophoneState, useCallClosedCaptions } = useCallStateHooks();
  const { microphone } = useMicrophoneState();
  const captions = useCallClosedCaptions();
  const [isHeld, setIsHeld] = useState(false);
  const [partial, setPartial] = useState<PartialCaption | null>(null);
  const partialTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Receive real-time partial transcript deltas from the Python agent via Stream custom events
  interface StreamCustomEvent {
    custom?: {
      type?: string;
      speaker?: "agent" | "user";
      text?: string;
    };
  }

  useEffect(() => {
    const unsubscribe = call.on("custom", (event: StreamCustomEvent) => {
      const data = event?.custom ?? {};
      if (data.type === "transcript_partial" && data.text) {
        setPartial({ speaker: data.speaker ?? "agent", text: data.text });
        // Auto-clear if no further deltas arrive (speech ended without a final event)
        if (partialTimerRef.current) clearTimeout(partialTimerRef.current);
        partialTimerRef.current = setTimeout(() => setPartial(null), 3000);
      }
    });
    return () => {
      unsubscribe();
      if (partialTimerRef.current) clearTimeout(partialTimerRef.current);
    };
  }, [call]);

  // Clear partial once a committed caption lands (the final transcript is now in captions)
  useEffect(() => {
    if (captions.length > 0) {
      setPartial(null);
      if (partialTimerRef.current) clearTimeout(partialTimerRef.current);
    }
  }, [captions]);

  const isReady = agentStatus === "connected";
  const showCaptions = partial !== null || captions.length > 0;

  function handlePressIn() {
    if (!isReady) return;
    setIsHeld(true);
    microphone.enable();
  }

  function handlePressOut() {
    setIsHeld(false);
    microphone.disable();
  }

  return (
    <>
      {/* Call area */}
      <View style={styles.callArea}>
        <Image
          source={images.mascotWelcome}
          contentFit="contain"
          style={[
            styles.mascot,
            agentStatus === "connecting" && { opacity: 0.5 },
          ]}
        />

        {/* Live captions: partial (streaming) takes priority, then committed */}
        {showCaptions ? (
          <View style={styles.captionsContainer}>
            {partial ? (
              // Partial caption — grows word by word in real time
              <View
                style={[
                  styles.captionBubble,
                  partial.speaker === "agent"
                    ? styles.captionBubbleTeacher
                    : styles.captionBubbleUser,
                  styles.captionBubblePartial,
                ]}
              >
                <Text
                  style={[
                    styles.captionSpeaker,
                    partial.speaker === "agent"
                      ? styles.captionSpeakerTeacher
                      : styles.captionSpeakerUser,
                  ]}
                >
                  {partial.speaker === "agent" ? "AI Teacher" : "You"}
                </Text>
                <Text
                  style={[
                    styles.captionText,
                    partial.speaker === "agent"
                      ? styles.captionTextTeacher
                      : styles.captionTextUser,
                  ]}
                >
                  {partial.text}
                </Text>
              </View>
            ) : (
              // Committed captions from Stream's closed captions service
              captions.map((caption: CallClosedCaption, i: number) => {
                const isTeacher = caption.user?.id === AGENT_USER_ID;
                return (
                  <View
                    key={`${caption.start_time}-${i}`}
                    style={[
                      styles.captionBubble,
                      isTeacher
                        ? styles.captionBubbleTeacher
                        : styles.captionBubbleUser,
                    ]}
                  >
                    <Text
                      style={[
                        styles.captionSpeaker,
                        isTeacher
                          ? styles.captionSpeakerTeacher
                          : styles.captionSpeakerUser,
                      ]}
                    >
                      {isTeacher ? "AI Teacher" : (caption.user?.name ?? "You")}
                    </Text>
                    <Text
                      style={[
                        styles.captionText,
                        isTeacher
                          ? styles.captionTextTeacher
                          : styles.captionTextUser,
                      ]}
                    >
                      {caption.text}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          <>
            {agentStatus === "connecting" && (
              <View style={styles.responseBubble}>
                <ActivityIndicator
                  size="small"
                  color={colors.primary.purple}
                  style={{ marginRight: 12 }}
                />
                <View style={styles.responseBubbleText}>
                  <Text style={styles.responsePrimary}>Starting lesson...</Text>
                  <Text style={styles.responseSecondary}>
                    Your AI teacher is joining
                  </Text>
                </View>
              </View>
            )}

            {agentStatus === "connected" && (
              <View style={styles.responseBubble}>
                <View style={styles.responseBubbleText}>
                  <Text style={styles.responsePrimary} numberOfLines={1}>
                    {lesson.aiTeacherPrompt.introMessage.split("!")[0]}!
                  </Text>
                  <Text style={styles.responseSecondary}>
                    Hold the mic to respond 🎙️
                  </Text>
                </View>
              </View>
            )}

            {agentStatus === "failed" && (
              <View style={styles.responseBubble}>
                <View style={styles.responseBubbleText}>
                  <Text style={styles.responsePrimary}>Agent unavailable</Text>
                  <Text style={styles.responseSecondary}>Tap to retry</Text>
                </View>
                <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                  <Ionicons
                    name="refresh-outline"
                    size={20}
                    color={colors.primary.purple}
                  />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      {/* Push-to-talk */}
      <View style={styles.pushToTalkSection}>
        <View style={styles.pushToTalkContainer}>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={!isReady}
            style={({ pressed }) => [
              styles.micButtonOuter,
              (pressed || isHeld) && styles.micButtonOuterActive,
            ]}
          >
            {({ pressed }) => {
              const active = pressed || isHeld;
              return (
                <View
                  style={[
                    styles.micButton,
                    active && styles.micButtonActive,
                    !isReady && styles.micButtonDisabled,
                  ]}
                >
                  {agentStatus === "connecting" ? (
                    <ActivityIndicator
                      size="small"
                      color={colors.primary.purple}
                    />
                  ) : (
                    <Ionicons
                      name={active ? "mic" : "mic-outline"}
                      size={34}
                      color={
                        active
                          ? "#fff"
                          : isReady
                            ? colors.neutral.textPrimary
                            : colors.neutral.textSecondary
                      }
                    />
                  )}
                </View>
              );
            }}
          </Pressable>
          <Text
            style={[
              styles.pushToTalkLabel,
              isHeld && { color: colors.primary.purple },
            ]}
          >
            {isHeld
              ? "Listening..."
              : isReady
                ? "Push & hold to speak"
                : "Waiting for teacher..."}
          </Text>
        </View>
      </View>
    </>
  );
}

function getDisplayStatus(
  callStatus: CallStatus,
  agentStatus: AgentStatus,
): { color: string; label: string } {
  if (callStatus === "joined") {
    const map: Record<AgentStatus, { color: string; label: string }> = {
      idle: { color: colors.neutral.textSecondary, label: "Setting up..." },
      connecting: {
        color: colors.semantic.warning,
        label: "Joining lesson...",
      },
      connected: { color: colors.semantic.success, label: "Online" },
      failed: { color: colors.semantic.error, label: "Agent unavailable" },
    };
    return map[agentStatus];
  }
  const map: Record<CallStatus, { color: string; label: string }> = {
    idle: { color: colors.neutral.textSecondary, label: "Starting..." },
    connecting: { color: colors.semantic.warning, label: "Connecting..." },
    joined: { color: colors.semantic.success, label: "Online" },
    error: { color: colors.semantic.error, label: "Connection failed" },
  };
  return map[callStatus];
}

function DisabledMicButton({ callStatus }: { callStatus: CallStatus }) {
  return (
    <View style={styles.pushToTalkContainer}>
      <View style={styles.micButtonOuter}>
        <View style={[styles.micButton, styles.micButtonDisabled]}>
          {callStatus === "connecting" ? (
            <ActivityIndicator size="small" color={colors.primary.purple} />
          ) : (
            <Ionicons
              name="mic-outline"
              size={34}
              color={colors.neutral.textSecondary}
            />
          )}
        </View>
      </View>
      <Text style={styles.pushToTalkLabel}>
        {callStatus === "error" ? "Connection failed" : "Setting up..."}
      </Text>
    </View>
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
  endCallButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8453C",
    alignItems: "center",
    justifyContent: "center",
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
  },
  onlineText: {
    fontFamily: "Poppins-Medium",
    fontSize: 13,
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
  retryButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  // Live captions
  captionsContainer: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
    gap: 6,
  },
  captionBubble: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  captionBubbleTeacher: {
    backgroundColor: colors.primary.purple,
  },
  captionBubbleUser: {
    backgroundColor: "#fff",
  },
  captionBubblePartial: {
    opacity: 0.85,
  },
  captionSpeaker: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 11,
    marginBottom: 2,
  },
  captionSpeakerTeacher: {
    color: "rgba(255,255,255,0.7)",
  },
  captionSpeakerUser: {
    color: colors.neutral.textSecondary,
  },
  captionText: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
  },
  captionTextTeacher: {
    color: "#fff",
  },
  captionTextUser: {
    color: colors.neutral.textPrimary,
  },
  // Push-to-talk
  pushToTalkSection: {
    paddingVertical: 28,
    alignItems: "center",
  },
  pushToTalkContainer: {
    alignItems: "center",
    gap: 14,
  },
  micButtonOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  micButtonOuterActive: {
    borderColor: "#C4B5FD",
    backgroundColor: "#F5F3FF",
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.neutral.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  micButtonActive: {
    backgroundColor: colors.primary.purple,
    shadowColor: colors.primary.purple,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  micButtonDisabled: {
    opacity: 0.5,
  },
  pushToTalkLabel: {
    fontFamily: "Poppins-Medium",
    fontSize: 14,
    color: colors.neutral.textSecondary,
  },
  // Feedback row
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginHorizontal: 16,
    marginTop: 4,
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
