// Onboarding.tsx — first-run "how it works" (demo polish).
//
// The 3-second pitch as a one-screen intro: point → score → improve. Dismissible,
// shown once (seen-flag persisted by the caller via lib/storage). Pure RN, no deps.

import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  onDone: () => void;
}

const BEATS = [
  { icon: "📸", title: "Point the camera", body: "At yourself, or hand it to a friend." },
  { icon: "⭐", title: "Get your photo score", body: "Live coaching, then a 1–10 score the moment you shoot." },
  { icon: "🔥", title: "Beat your best", body: "Follow the cues, raise the score, keep the streak." },
];

export function Onboarding({ visible, onDone }: Props) {
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onDone}>
      <SafeAreaView style={st.container}>
        <View style={st.body}>
          <Text style={st.wordmark}>
            AI<Text style={st.accent}>Snaps</Text>
          </Text>
          <Text style={st.tagline}>Your AI photographer</Text>

          <View style={st.beats}>
            {BEATS.map((b) => (
              <View key={b.title} style={st.beat}>
                <Text style={st.beatIcon}>{b.icon}</Text>
                <View style={st.beatText}>
                  <Text style={st.beatTitle}>{b.title}</Text>
                  <Text style={st.beatBody}>{b.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={st.cta} onPress={onDone}>
          <Text style={st.ctaText}>Got it</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", paddingHorizontal: 28, justifyContent: "space-between" },
  body: { flex: 1, justifyContent: "center", gap: 8 },
  wordmark: { fontSize: 34, fontWeight: "800", color: "#fff", textAlign: "center", letterSpacing: 0.5 },
  accent: { color: "#FFD700" },
  tagline: { fontSize: 15, color: "rgba(255,255,255,0.5)", textAlign: "center", marginBottom: 28 },

  beats: { gap: 20 },
  beat: { flexDirection: "row", alignItems: "center", gap: 16 },
  beatIcon: { fontSize: 28, width: 40, textAlign: "center" },
  beatText: { flex: 1 },
  beatTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  beatBody: { color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 2, lineHeight: 18 },

  cta: { backgroundColor: "#FFD700", height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center", marginBottom: 24 },
  ctaText: { color: "#000", fontSize: 16, fontWeight: "800" },
});
