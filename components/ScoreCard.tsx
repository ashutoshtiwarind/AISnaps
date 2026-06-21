// ScoreCard.tsx — the post-capture score reveal (C-4).
//
// The viral artifact: animated score count-up, per-factor breakdown, the single
// top fix, and a before/after glow-up when an earlier shot is supplied. Pure RN
// (works on web via react-native-web and on native). Scoring lives in
// lib/photoScore.ts; this component only renders a PhotoScore.

import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { PhotoScore, topFix } from "@/lib/photoScore";
import { HANDLE } from "@/lib/share";

interface Props {
  photoUri: string;
  score: PhotoScore;
  beforeUri?: string;
  beforeScore?: PhotoScore;
  onShare?: () => void;
  onRetake?: () => void;
  onClose?: () => void;
}

export function ScoreCard({
  photoUri,
  score,
  beforeUri,
  beforeScore,
  onShare,
  onRetake,
  onClose,
}: Props) {
  const [shown, setShown] = useState(0);
  const countAnim = useRef(new Animated.Value(0)).current;

  // 3-second reveal: count the score up from 0.
  useEffect(() => {
    const id = countAnim.addListener(({ value }) => setShown(value));
    Animated.timing(countAnim, {
      toValue: score.overall,
      duration: 900,
      useNativeDriver: false,
    }).start();
    return () => countAnim.removeListener(id);
  }, [score.overall, countAnim]);

  const fix = topFix(score);
  const delta =
    beforeScore != null ? Math.round((score.overall - beforeScore.overall) * 10) / 10 : null;

  return (
    <View style={st.container}>
      <TouchableOpacity style={st.close} onPress={onClose} accessibilityLabel="Close">
        <Text style={st.closeText}>✕</Text>
      </TouchableOpacity>

      {/* Brand wordmark — makes the card shareable/screenshot-worthy (S-1) */}
      <Text style={st.wordmark}>
        AI<Text style={st.wordmarkAccent}>Snaps</Text>
      </Text>

      {/* Before / after */}
      <View style={st.photoRow}>
        {beforeUri ? (
          <View style={st.photoCol}>
            <Image source={{ uri: beforeUri }} style={st.photo} resizeMode="cover" />
            <Text style={st.photoTag}>BEFORE{beforeScore ? `  ${beforeScore.overall}` : ""}</Text>
          </View>
        ) : null}
        <View style={st.photoCol}>
          <Image source={{ uri: photoUri }} style={st.photo} resizeMode="cover" />
          <Text style={[st.photoTag, beforeUri ? st.photoTagAfter : null]}>
            {beforeUri ? "AFTER" : "YOUR SHOT"}
          </Text>
        </View>
      </View>

      {/* Score reveal */}
      <View style={st.scoreBlock}>
        <Text style={[st.scoreNum, { color: score.color }]}>{shown.toFixed(1)}</Text>
        <Text style={st.scoreOutOf}>/ 10</Text>
      </View>
      <Text style={[st.headline, { color: score.color }]}>{score.headline}</Text>
      {delta != null && delta > 0 ? (
        <Text style={st.delta}>▲ +{delta} from your last shot</Text>
      ) : null}

      {/* Top fix */}
      {fix ? (
        <View style={st.fixRow}>
          <Text style={st.fixLabel}>Next: </Text>
          <Text style={st.fixText}>{improveCue(fix.key)}</Text>
        </View>
      ) : null}

      {/* Factor breakdown */}
      <View style={st.factors}>
        {score.factors.map((f) => (
          <View key={f.key} style={st.factorRow}>
            <Text style={st.factorLabel}>{f.label}</Text>
            <View style={st.factorTrack}>
              <View
                style={[
                  st.factorFill,
                  { width: `${Math.round(f.value * 100)}%`, backgroundColor: barColor(f.value) },
                ]}
              />
            </View>
            <Text style={st.factorVal}>{Math.round(f.value * 10)}</Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={st.actions}>
        <TouchableOpacity style={[st.btn, st.btnSecondary]} onPress={onRetake}>
          <Text style={st.btnSecondaryText}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[st.btn, st.btnPrimary]} onPress={onShare}>
          <Text style={st.btnPrimaryText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Handle watermark */}
      <Text style={st.watermark}>{HANDLE} · aisnaps.app</Text>
    </View>
  );
}

function barColor(v: number): string {
  if (v >= 0.75) return "#4ADE80";
  if (v >= 0.5) return "#FFD700";
  return "#F87171";
}

// Imperative cue per weakest factor (mirrors the narration loop's intent).
function improveCue(key: string): string {
  switch (key) {
    case "lightingEvenness":
      return "find softer, more even light";
    case "frontalPose":
      return "look straight at the lens";
    case "ruleOfThirds":
      return "put your face on a third-line";
    case "backgroundClean":
      return "declutter the background";
    case "faceSharpness":
      return "hold steady — keep it sharp";
    default:
      return "small adjustment will lift the score";
  }
}

const st = StyleSheet.create({
  container: { backgroundColor: "#0a0a0a", borderRadius: 20, padding: 20, gap: 14 },
  close: { position: "absolute", top: 12, right: 12, zIndex: 2, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center" },
  closeText: { color: "white", fontSize: 16 },

  wordmark: { fontSize: 15, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  wordmarkAccent: { color: "#FFD700" },
  watermark: { textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 0.5, marginTop: 2 },

  photoRow: { flexDirection: "row", gap: 8, justifyContent: "center" },
  photoCol: { flex: 1, maxWidth: 180 },
  photo: { width: "100%", aspectRatio: 3 / 4, borderRadius: 12, backgroundColor: "#1a1a1a" },
  photoTag: { position: "absolute", bottom: 8, left: 8, fontSize: 9, fontWeight: "700", letterSpacing: 1, color: "rgba(255,255,255,0.85)", backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: "hidden" },
  photoTagAfter: { color: "#000", backgroundColor: "#FFD700" },

  scoreBlock: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 4 },
  scoreNum: { fontSize: 64, fontWeight: "800", lineHeight: 66 },
  scoreOutOf: { fontSize: 18, color: "rgba(255,255,255,0.4)", marginBottom: 10 },
  headline: { textAlign: "center", fontSize: 16, fontWeight: "700" },
  delta: { textAlign: "center", fontSize: 12, color: "#4ADE80", fontWeight: "600" },

  fixRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", flexWrap: "wrap" },
  fixLabel: { color: "rgba(255,255,255,0.5)", fontSize: 13 },
  fixText: { color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: "600" },

  factors: { gap: 8, marginTop: 4 },
  factorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  factorLabel: { width: 84, fontSize: 11, color: "rgba(255,255,255,0.6)" },
  factorTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.12)", overflow: "hidden" },
  factorFill: { height: 5, borderRadius: 3 },
  factorVal: { width: 18, textAlign: "right", fontSize: 11, color: "rgba(255,255,255,0.7)", fontVariant: ["tabular-nums"] },

  actions: { flexDirection: "row", gap: 10, marginTop: 6 },
  btn: { flex: 1, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  btnSecondary: { backgroundColor: "rgba(255,255,255,0.1)" },
  btnSecondaryText: { color: "white", fontSize: 15, fontWeight: "600" },
  btnPrimary: { backgroundColor: "#FFD700" },
  btnPrimaryText: { color: "#000", fontSize: 15, fontWeight: "700" },
});
