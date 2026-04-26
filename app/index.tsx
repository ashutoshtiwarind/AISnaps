import { useIsFocused } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import { useAICoach } from "../hooks/useAICoach";
import { SCRIPTS } from "../scripts/scripts";

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
  const cameraRef = useRef<Camera>(null);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const device = useCameraDevice(facing);
  const { hasPermission, requestPermission } = useCameraPermission();
  const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();

// Add inside your component
const isFocused = useIsFocused();

  // UI state
  const [activeScript, setActiveScript] = useState(0);
  const [gridVisible, setGridVisible] = useState(true);
  const [flashOn, setFlashOn] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [showAutoBadge, setShowAutoBadge] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [threshold, setThreshold] = useState(88);
  const [toastMsg, setToastMsg] = useState("");

  // Focus ring
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const focusAnim = useRef(new Animated.Value(1)).current;

  // Exposure slider
  const [exposure, setExposure] = useState(0);
  const expStartY = useRef(0);

  // AI Coach hook
  const { score, tip, scoreColor, autoFire } = useAICoach({
    scriptIndex: activeScript,
    autoEnabled,
    threshold,
  });

  const scoreAnim = useRef(new Animated.Value(score)).current;

  useEffect(() => {
    Animated.spring(scoreAnim, {
      toValue: score,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [score]);

  useEffect(() => {
    const requestPerms = async () => {
      console.log("Requesting camera permission...");
      await requestPermission();
      
      console.log("Requesting media library permission...");
      if (mediaLibraryPermission?.status !== "granted") {
        await requestMediaLibraryPermission();
      }
      
      console.log("Requesting image picker permissions...");
      const pickerStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("Image picker permission status:", pickerStatus.status);
    };
    requestPerms();
  }, []);

  // Auto-fire trigger


  // const capture = useCallback(
  //   async (isAuto = false) => {
  //     try {
  //       if (!cameraRef.current || !device) {
  //         console.log("Camera not ready yet");
  //         return;
  //       }
  //       const photo = await cameraRef.current.takePhoto({
  //         flash: flashOn ? "on" : "off",
  //       });
  //       setCaptureCount((c) => c + 1);
  //       setToastMsg(isAuto ? `Auto shot! (score: ${Math.round(score)})` : `Photo saved ✓`);
  //       setShowToast(true);
  //       setTimeout(() => setShowToast(false), 2000);
  //     } catch (e) {
  //       console.log("capture error", e);
  //     }
  //   },
  //   [flashOn, score, device]
  // );

  // Replace your capture function with this:
const capture = useCallback(async (isAuto = false) => {
  try {
    if (!cameraRef.current) return;
    
    const photo = await cameraRef.current.takePhoto({
      flash: flashOn ? "on" : "off",
    });

    const asset = await MediaLibrary.createAssetAsync("file://" + photo.path);
    await MediaLibrary.addAssetsToAlbumAsync([asset], "SnapCoach", false);
    
    setCaptureCount((c) => c + 1);
    setToastMsg(isAuto ? `Auto shot! Score: ${Math.round(score)}` : "Photo saved ✓");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  } catch (e: any) {
    console.log("capture error:", e?.message);
    setToastMsg("Failed to capture");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }
}, [flashOn, score]);

  useEffect(() => {
    if (autoFire) {
      setShowAutoBadge(true);
      capture(false);
      setTimeout(() => setShowAutoBadge(false), 2500);
    }
  }, [autoFire, capture]);

  // Open gallery
  const openGallery = useCallback(async () => {
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status === "granted") {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: false,
          quality: 1,
        });
        if (result.assets && result.assets.length > 0) {
          console.log("Selected image:", result.assets[0].uri);
        }
      } else {
        setToastMsg("Photo library permission required");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      }
    } catch (e) {
      console.log("Gallery error", e);
      setToastMsg("Could not open gallery");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  }, []);

  // Tap to focus
  const handleTap = useCallback(async (e: any) => {
    const { locationX: x, locationY: y } = e.nativeEvent;
    setFocusPoint({ x, y });
    focusAnim.setValue(1.4);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setTimeout(() => setFocusPoint(null), 1200);
    try {
      await cameraRef.current?.focusTo({ x, y });
    } catch (_) {}
  }, []);

  // Exposure PanResponder
  const expPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        expStartY.current = e.nativeEvent.pageY;
      },
      onPanResponderMove: (e) => {
        const delta = expStartY.current - e.nativeEvent.pageY;
        const newVal = Math.max(-1, Math.min(1, delta / 60));
        setExposure(newVal);
      },
    })
  ).current;

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "white", marginBottom: 16, fontSize: 14 }}>
          Camera permission required
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.6)", marginBottom: 16, fontSize: 12, paddingHorizontal: 20 }}>
          If you see "Camera is disabled due to device policy":
          {"\n"}• Check Android emulator has camera enabled
          {"\n"}• Or try a physical device
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permBtn}>
          <Text style={{ color: "white" }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "white" }}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* ── VIEWFINDER ── */}
      <View style={styles.viewfinder} onTouchEnd={handleTap}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isFocused}
          photo={true}
          exposure={exposure}
        />

        {/* Grid overlay */}
        {gridVisible && (
          <View style={styles.grid} pointerEvents="none">
            <View style={[styles.gridLine, { top: "33.3%", width: "100%", height: 0.5 }]} />
            <View style={[styles.gridLine, { top: "66.6%", width: "100%", height: 0.5 }]} />
            <View style={[styles.gridLine, { left: "33.3%", height: "100%", width: 0.5 }]} />
            <View style={[styles.gridLine, { left: "66.6%", height: "100%", width: 0.5 }]} />
            <View style={[styles.bracket, styles.tl]} />
            <View style={[styles.bracket, styles.tr]} />
            <View style={[styles.bracket, styles.bl]} />
            <View style={[styles.bracket, styles.br]} />
          </View>
        )}

        {/* Focus ring */}
        {focusPoint && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.focusRing,
              {
                left: focusPoint.x - 30,
                top: focusPoint.y - 30,
                transform: [{ scale: focusAnim }],
              },
            ]}
          />
        )}

        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.modePill}>
            <Text style={styles.modeText}>{SCRIPTS[activeScript].label.toUpperCase()}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setFlashOn((f) => !f)}>
              <Text style={[styles.iconTxt, flashOn && { color: "#FFD700" }]}>⚡</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setGridVisible((g) => !g)}>
              <Text style={[styles.iconTxt, !gridVisible && { opacity: 0.3 }]}>▦</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Exposure slider */}
        <View style={styles.expPill} {...expPan.panHandlers}>
          <Text style={styles.expIcon}>☀</Text>
          <View style={styles.expTrack}>
            <View style={[styles.expFill, { height: `${(exposure + 1) * 50}%` }]} />
          </View>
          <Text style={styles.expVal}>
            {exposure > 0 ? "+" : ""}
            {Math.round(exposure * 10) / 10}
          </Text>
        </View>

        {/* Auto shot badge */}
        {showAutoBadge && (
          <View style={styles.autoBadge}>
            <Text style={styles.autoBadgeText}>AUTO SHOT</Text>
          </View>
        )}

        {/* Toast */}
        {showToast && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toastMsg}</Text>
          </View>
        )}

        {/* AI Score overlay */}
        <View style={styles.aiOverlay}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>AI Score</Text>
            <View style={styles.scoreTrack}>
              <Animated.View
                style={[
                  styles.scoreFill,
                  {
                    width: scoreAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ["0%", "100%"],
                    }),
                    backgroundColor: scoreColor,
                  },
                ]}
              />
            </View>
            <Text style={[styles.scoreNum, { color: scoreColor }]}>{Math.round(score)}</Text>
          </View>
          <View style={styles.tipRow}>
            <View style={[styles.tipDot, { backgroundColor: scoreColor }]} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        </View>
      </View>

      {/* ── BOTTOM PANEL ── */}
      <View style={styles.bottom}>
        {/* Settings toggle */}
        <TouchableOpacity
          style={styles.settingsToggle}
          onPress={() => setSettingsOpen((s) => !s)}
        >
          <Text style={styles.settingsToggleText}>⚙  AI Settings</Text>
          <Text style={styles.settingsToggleText}>{settingsOpen ? "▲" : "▼"}</Text>
        </TouchableOpacity>

        {settingsOpen && (
          <View style={styles.settingsPanel}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Auto-capture</Text>
              <TouchableOpacity
                style={[styles.toggle, autoEnabled && styles.toggleOn]}
                onPress={() => setAutoEnabled((a) => !a)}
              />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Threshold: {threshold}</Text>
              <View style={styles.threshBtns}>
                <TouchableOpacity
                  onPress={() => setThreshold((t) => Math.max(70, t - 5))}
                  style={styles.threshBtn}
                >
                  <Text style={styles.threshBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.threshVal}>{threshold}</Text>
                <TouchableOpacity
                  onPress={() => setThreshold((t) => Math.min(98, t + 5))}
                  style={styles.threshBtn}
                >
                  <Text style={styles.threshBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Scripts */}
        <View style={styles.scriptsRow}>
          {SCRIPTS.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.scriptChip, i === activeScript && styles.scriptChipActive]}
              onPress={() => setActiveScript(i)}
            >
              <Text style={[styles.scriptText, i === activeScript && styles.scriptTextActive]}>
                {s.icon} {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Controls row */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.galleryBtn} onPress={openGallery}>
            <Text style={{ fontSize: 22 }}>🖼</Text>
            {captureCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{captureCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.shutter,
              autoEnabled && score >= threshold && styles.shutterReady,
            ]}
            onPress={() => capture(false)}
          >
            <View
              style={[
                styles.shutterInner,
                autoEnabled && score >= threshold && styles.shutterInnerReady,
              ]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.flipBtn}
            onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
          >
            <Text style={{ fontSize: 22, color: "white" }}>↺</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  viewfinder: { flex: 1, position: "relative" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  permBtn: { backgroundColor: "#1A73E8", padding: 12, borderRadius: 8 },

  grid: { ...StyleSheet.absoluteFillObject },
  gridLine: { position: "absolute", backgroundColor: "rgba(255,255,255,0.2)" },
  bracket: { position: "absolute", width: 24, height: 24 },
  tl: { top: 16, left: 16, borderTopWidth: 2, borderLeftWidth: 2, borderColor: "rgba(255,255,255,0.7)" },
  tr: { top: 16, right: 16, borderTopWidth: 2, borderRightWidth: 2, borderColor: "rgba(255,255,255,0.7)" },
  bl: { bottom: 16, left: 16, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: "rgba(255,255,255,0.7)" },
  br: { bottom: 16, right: 16, borderBottomWidth: 2, borderRightWidth: 2, borderColor: "rgba(255,255,255,0.7)" },

  focusRing: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "#FFD700",
  },

  topBar: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modePill: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  modeText: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "600" },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconTxt: { fontSize: 15, color: "white" },

  expPill: {
    position: "absolute",
    right: 14,
    top: "30%",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    padding: 8,
    alignItems: "center",
    gap: 6,
  },
  expIcon: { fontSize: 14, color: "#FFD700" },
  expTrack: {
    width: 4,
    height: 80,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    justifyContent: "flex-end",
  },
  expFill: { width: 4, backgroundColor: "#FFD700", borderRadius: 2 },
  expVal: { fontSize: 10, color: "rgba(255,255,255,0.7)" },

  autoBadge: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    backgroundColor: "#4ADE80",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  autoBadgeText: { fontSize: 11, fontWeight: "700", color: "#000" },

  toast: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  toastText: { color: "white", fontSize: 12 },

  aiOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    paddingBottom: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  scoreLabel: { fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1 },
  scoreTrack: { flex: 1, height: 4, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 2, overflow: "hidden" },
  scoreFill: { height: 4, borderRadius: 2 },
  scoreNum: { fontSize: 14, fontWeight: "600", minWidth: 28, textAlign: "right" },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tipDot: { width: 5, height: 5, borderRadius: 3 },
  tipText: { fontSize: 12, color: "rgba(255,255,255,0.85)", flex: 1 },

  bottom: { backgroundColor: "#111", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  settingsToggle: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  settingsToggleText: { fontSize: 11, color: "rgba(255,255,255,0.5)" },
  settingsPanel: { backgroundColor: "#1a1a1a", borderRadius: 12, padding: 14, marginBottom: 12 },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  settingLabel: { fontSize: 12, color: "rgba(255,255,255,0.65)" },
  toggle: { width: 36, height: 20, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)" },
  toggleOn: { backgroundColor: "#FFD700" },
  threshBtns: { flexDirection: "row", alignItems: "center", gap: 10 },
  threshBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  threshBtnText: { color: "white", fontSize: 16 },
  threshVal: { color: "#FFD700", fontSize: 13, fontWeight: "600", minWidth: 28, textAlign: "center" },

  scriptsRow: { flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  scriptChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  scriptChipActive: { backgroundColor: "#FFD700", borderColor: "#FFD700" },
  scriptText: { fontSize: 11, color: "rgba(255,255,255,0.6)" },
  scriptTextActive: { color: "#000", fontWeight: "600" },

  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  galleryBtn: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.15)",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#1A73E8",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { fontSize: 10, color: "white", fontWeight: "700" },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  shutterReady: { backgroundColor: "#4ADE80", borderColor: "rgba(74,222,128,0.4)" },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#fff" },
  shutterInnerReady: { backgroundColor: "#4ADE80" },
  flipBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
});