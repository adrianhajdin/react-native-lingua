import { useAuth, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import {
  Call,
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
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants/images";
import { colors } from "@/constants/theme";
import { LESSONS } from "@/data/lessons";
import { useLanguageStore } from "@/store/languageStore";

type CallStatus = "idle" | "connecting" | "joined" | "error";
type AgentStatus = "idle" | "connecting" | "connected" | "failed";

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

  useEffect(() => {
    if (!isLoaded || !user || !lesson) return;
    startCall();

    return () => {
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

      // Pack lesson context into Stream call custom data so the agent can read it on join.
      // Wrapped in try/catch — if the update fails (e.g. server permissions), the lesson
      // continues and the Python agent falls back to its default prompts.
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

  // Derive the visible status from call + agent state
  const displayStatus = getDisplayStatus(callStatus, agentStatus);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
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

        <View style={styles.headerRight}>
          <View style={styles.timerBadge}>
            <Ionicons
              name="headset-outline"
              size={13}
              color={colors.neutral.textPrimary}
            />
            <Text style={styles.timerText}>Audio</Text>
          </View>
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.neutral.textPrimary}
            />
          </TouchableOpacity>
        </View>
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

      {/* Call area */}
      <View style={styles.callArea}>
        <Image
          source={images.mascotWelcome}
          contentFit="contain"
          style={[
            styles.mascot,
            (callStatus === "connecting" || agentStatus === "connecting") && {
              opacity: 0.5,
            },
          ]}
        />

        {/* Call connecting */}
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

        {/* Call joined — agent connecting */}
        {callStatus === "joined" && agentStatus === "connecting" && (
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

        {/* Call joined — agent connected */}
        {callStatus === "joined" && agentStatus === "connected" && (
          <View style={styles.responseBubble}>
            <View style={styles.responseBubbleText}>
              <Text style={styles.responsePrimary} numberOfLines={1}>
                {lesson.aiTeacherPrompt.introMessage.split("!")[0]}!
              </Text>
              <Text style={styles.responseSecondary}>
                Audio lesson in progress 🎧
              </Text>
            </View>
            <TouchableOpacity style={styles.speakerButton}>
              <Ionicons
                name="volume-medium-outline"
                size={20}
                color={colors.primary.purple}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Call joined — agent failed (best-effort; lesson can continue) */}
        {callStatus === "joined" && agentStatus === "failed" && (
          <View style={styles.responseBubble}>
            <View style={styles.responseBubbleText}>
              <Text style={styles.responsePrimary}>Agent unavailable</Text>
              <Text style={styles.responseSecondary}>Tap to retry</Text>
            </View>
            <TouchableOpacity
              style={styles.speakerButton}
              onPress={() =>
                callRef.current && startAgentSession(callRef.current.id)
              }
            >
              <Ionicons
                name="refresh-outline"
                size={20}
                color={colors.primary.purple}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Call error */}
        {callStatus === "error" && (
          <View style={styles.responseBubble}>
            <View style={styles.responseBubbleText}>
              <Text style={styles.responsePrimary}>Connection failed</Text>
              <Text style={styles.responseSecondary}>Tap to retry</Text>
            </View>
            <TouchableOpacity style={styles.speakerButton} onPress={startCall}>
              <Ionicons
                name="refresh-outline"
                size={20}
                color={colors.primary.purple}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Controls */}
      {callStatus === "joined" && client && call ? (
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <ConnectedControls onLeave={handleLeave} />
          </StreamCall>
        </StreamVideo>
      ) : (
        <DisconnectedControls callStatus={callStatus} onLeave={handleLeave} />
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

// Rendered inside StreamCall — has access to live mic state from Stream
function ConnectedControls({ onLeave }: { onLeave: () => void }) {
  const { useMicrophoneState } = useCallStateHooks();
  const { microphone, isMute } = useMicrophoneState();
  const [subtitlesOn, setSubtitlesOn] = useState(true);

  return (
    <View style={styles.controlsRow}>
      <TouchableOpacity style={styles.controlButton}>
        <View style={styles.controlIconCircle}>
          <Ionicons
            name="videocam"
            size={24}
            color={colors.neutral.textPrimary}
          />
        </View>
        <Text style={styles.controlLabel}>Camera</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.controlButton}
        onPress={() => microphone.toggle()}
      >
        <View style={[styles.controlIconCircle, isMute && styles.mutedCircle]}>
          <Ionicons
            name={isMute ? "mic-off" : "mic"}
            size={24}
            color={isMute ? colors.semantic.error : colors.neutral.textPrimary}
          />
        </View>
        <Text style={styles.controlLabel}>Mic</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.controlButton}
        onPress={() => setSubtitlesOn((v) => !v)}
      >
        <View
          style={[
            styles.controlIconCircle,
            !subtitlesOn && styles.controlIconCircleOff,
          ]}
        >
          <Text style={styles.aaText}>Aa</Text>
        </View>
        <Text style={styles.controlLabel}>Subtitles</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.controlButton} onPress={onLeave}>
        <View style={[styles.controlIconCircle, styles.endCallCircle]}>
          <Ionicons
            name="call"
            size={24}
            color="#fff"
            style={{ transform: [{ rotate: "135deg" }] }}
          />
        </View>
        <Text style={styles.controlLabel}>End Call</Text>
      </TouchableOpacity>
    </View>
  );
}

function DisconnectedControls({
  callStatus,
  onLeave,
}: {
  callStatus: CallStatus;
  onLeave: () => void;
}) {
  const [subtitlesOn, setSubtitlesOn] = useState(true);
  const isConnecting = callStatus === "connecting";

  return (
    <View style={styles.controlsRow}>
      <TouchableOpacity style={styles.controlButton} disabled={isConnecting}>
        <View style={[styles.controlIconCircle, styles.controlIconCircleOff]}>
          <Ionicons
            name="videocam"
            size={24}
            color={colors.neutral.textSecondary}
          />
        </View>
        <Text style={styles.controlLabel}>Camera</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.controlButton} disabled={isConnecting}>
        <View style={[styles.controlIconCircle, styles.controlIconCircleOff]}>
          <Ionicons name="mic" size={24} color={colors.neutral.textSecondary} />
        </View>
        <Text style={styles.controlLabel}>Mic</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.controlButton}
        onPress={() => setSubtitlesOn((v) => !v)}
      >
        <View
          style={[
            styles.controlIconCircle,
            !subtitlesOn && styles.controlIconCircleOff,
          ]}
        >
          <Text
            style={[styles.aaText, { color: colors.neutral.textSecondary }]}
          >
            Aa
          </Text>
        </View>
        <Text style={styles.controlLabel}>Subtitles</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.controlButton} onPress={onLeave}>
        <View style={[styles.controlIconCircle, styles.endCallCircle]}>
          <Ionicons
            name="call"
            size={24}
            color="#fff"
            style={{ transform: [{ rotate: "135deg" }] }}
          />
        </View>
        <Text style={styles.controlLabel}>End Call</Text>
      </TouchableOpacity>
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
  mutedCircle: {
    backgroundColor: "#FEF2F2",
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
