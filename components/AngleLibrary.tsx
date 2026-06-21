// AngleLibrary.tsx — browsable angle/pose library (R-3).
//
// Content surface: filter by score-factor category, read the cue + why for each
// pose. Pure RN (web + native), static content from lib/poses.ts, no deps.

import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CATEGORY_LABELS, POSES, Pose, PoseCategory } from "@/lib/poses";

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Filter = PoseCategory | "all";

const CAT_ICON: Record<PoseCategory, string> = {
  composition: "▦",
  eyeContact: "👁",
  lighting: "☀",
  background: "🪟",
  sharpness: "◎",
};

export function AngleLibrary({ visible, onClose }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const data = useMemo(
    () => (filter === "all" ? POSES : POSES.filter((p) => p.category === filter)),
    [filter],
  );

  const filters: Filter[] = ["all", ...(Object.keys(CATEGORY_LABELS) as PoseCategory[])];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={st.container} edges={["top"]}>
        <View style={st.header}>
          <View>
            <Text style={st.title}>Angles & Poses</Text>
            <Text style={st.subtitle}>Cues that lift your score</Text>
          </View>
          <TouchableOpacity style={st.close} onPress={onClose} accessibilityLabel="Close">
            <Text style={st.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Category filter */}
        <View style={st.filterRow}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              style={[st.chip, filter === f && st.chipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[st.chipText, filter === f && st.chipTextActive]}>
                {f === "all" ? "All" : CATEGORY_LABELS[f]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={data}
          keyExtractor={(p) => p.id}
          contentContainerStyle={st.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }: { item: Pose }) => (
            <View style={st.card}>
              <View style={st.cardHead}>
                <Text style={st.cardIcon}>{CAT_ICON[item.category]}</Text>
                <Text style={st.cardTitle}>{item.title}</Text>
                <Text style={st.cardTag}>{CATEGORY_LABELS[item.category]}</Text>
              </View>
              <Text style={st.cardCue}>{item.cue}</Text>
              <Text style={st.cardWhy}>{item.why}</Text>
            </View>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { color: "#fff", fontSize: 20, fontWeight: "800" },
  subtitle: { color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 },
  close: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center" },
  closeText: { color: "white", fontSize: 16 },

  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.2)" },
  chipActive: { backgroundColor: "#FFD700", borderColor: "#FFD700" },
  chipText: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  chipTextActive: { color: "#000", fontWeight: "700" },

  list: { paddingHorizontal: 16, paddingBottom: 32 },
  card: { backgroundColor: "#141414", borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)" },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  cardIcon: { fontSize: 16 },
  cardTitle: { flex: 1, color: "#fff", fontSize: 15, fontWeight: "700" },
  cardTag: { fontSize: 9, color: "rgba(255,255,255,0.45)", letterSpacing: 0.5, textTransform: "uppercase" },
  cardCue: { color: "#FFD700", fontSize: 14, fontWeight: "600", marginBottom: 4 },
  cardWhy: { color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 17 },
});
