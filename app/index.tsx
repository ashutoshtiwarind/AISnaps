import { useIsFocused } from "@react-navigation/native";
import { VideoView, useVideoPlayer } from "expo-video";
import * as VideoThumbnails from "expo-video-thumbnails";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  PanResponder,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";

import * as MediaLibrary from "expo-media-library";

// Conditionally import VisionCamera (not available on web)
const isWeb = Platform.OS === "web";

// Mock implementations for web
const mockCamera = {
  Camera: null,
  useCameraDevice: () => null,
  useCameraPermission: () => ({ hasPermission: false, requestPermission: async () => {} }),
  useMicrophonePermission: () => ({ requestPermission: async () => {} }),
};

import { ScoreCard } from "../components/ScoreCard";
import { useAICoach } from "../hooks/useAICoach";
import { improvedMetrics, mockMetrics, PhotoMetrics, PhotoScore, scorePhoto } from "../lib/photoScore";
import { SCRIPTS } from "../scripts/scripts";

const { width } = Dimensions.get("window");
const THUMB_SIZE = (width - 48) / 3;

// Post-capture score reveal (C-4). `reveal` drives the ScoreCard modal.
type RevealState =
  | { photoUri: string; score: PhotoScore; beforeUri?: string; beforeScore?: PhotoScore }
  | null;

// Neutral placeholder for the web demo (no real capture, no network).
const DEMO_PHOTO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="160"><rect width="120" height="160" fill="#2a2a2a"/><text x="60" y="84" fill="#777" font-size="11" text-anchor="middle">DEMO</text></svg>',
  );

function RevealModal({
  state,
  onClose,
  onShare,
  onRetake,
}: {
  state: RevealState;
  onClose: () => void;
  onShare: () => void;
  onRetake: () => void;
}) {
  return (
    <Modal visible={!!state} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.revealBackdrop}>
        {state && (
          <ScoreCard
            photoUri={state.photoUri}
            score={state.score}
            beforeUri={state.beforeUri}
            beforeScore={state.beforeScore}
            onClose={onClose}
            onRetake={onRetake}
            onShare={onShare}
          />
        )}
      </View>
    </Modal>
  );
}

type FlashMode = "off" | "auto" | "on";
type OverlayMode =
  | "thirds"
  | "center"
  | "golden"
  | "square"
  | "diagonal"
  | "spiral"
  | "triangle"
  | "fibonacci"
  | "none";
type CameraMode = "photo" | "video";
type MediaItem = { uri: string; type: "photo" | "video" };

const OVERLAY_OPTIONS: { mode: OverlayMode; label: string; icon: string }[] = [
  { mode: "thirds",    label: "1/3",      icon: "▦" },
  { mode: "center",    label: "Center",   icon: "✛" },
  { mode: "golden",    label: "φ Ratio",  icon: "φ" },
  { mode: "square",    label: "Square",   icon: "□" },
  { mode: "diagonal",  label: "Diagonal", icon: "⤢" },
  { mode: "spiral",    label: "Spiral",   icon: "🌀" },
  { mode: "triangle",  label: "Triangle", icon: "△" },
  { mode: "fibonacci", label: "Fib Grid", icon: "🔲" },
  { mode: "none",      label: "None",     icon: "○" },
];

// ── Overlay renderers ─────────────────────────────────────────────────────────
function GridOverlay({
  mode,
  viewW,
  viewH,
}: {
  mode: OverlayMode;
  viewW: number;
  viewH: number;
}) {
  if (mode === "none" || viewW === 0) return null;

  const LINE = "rgba(255,255,255,0.22)";
  const GOLD = "rgba(255,215,0,0.5)";
  const diagDeg = viewH > 0 ? (Math.atan2(viewH, viewW) * 180) / Math.PI : 51;
  const diagLen = Math.sqrt(viewW * viewW + viewH * viewH) * 1.05;

  if (mode === "thirds") {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[os.gl, { top: "33.3%", width: "100%", height: 0.5 }]} />
        <View style={[os.gl, { top: "66.6%", width: "100%", height: 0.5 }]} />
        <View style={[os.gl, { left: "33.3%", height: "100%", width: 0.5 }]} />
        <View style={[os.gl, { left: "66.6%", height: "100%", width: 0.5 }]} />
        <View style={[os.bk, os.tl]} /><View style={[os.bk, os.tr]} />
        <View style={[os.bk, os.bl]} /><View style={[os.bk, os.br]} />
      </View>
    );
  }

  if (mode === "center") {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[os.gl, { top: "50%", width: "100%", height: 0.5 }]} />
        <View style={[os.gl, { left: "50%", height: "100%", width: 0.5 }]} />
        <View style={os.centerDot} />
      </View>
    );
  }

  if (mode === "golden") {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[os.gl, { top: "38.2%", width: "100%", height: 0.5 }]} />
        <View style={[os.gl, { top: "61.8%", width: "100%", height: 0.5 }]} />
        <View style={[os.gl, { left: "38.2%", height: "100%", width: 0.5 }]} />
        <View style={[os.gl, { left: "61.8%", height: "100%", width: 0.5 }]} />
        <View style={os.phiLabel}><Text style={os.phiText}>φ</Text></View>
      </View>
    );
  }

  if (mode === "square") {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={os.sqMaskL} /><View style={os.sqMaskR} />
        <View style={os.sqBorder} />
        <View style={[os.bk, os.tl, { left: "12.5%", top: 12 }]} />
        <View style={[os.bk, os.tr, { right: "12.5%", top: 12 }]} />
        <View style={[os.bk, os.bl, { left: "12.5%" }]} />
        <View style={[os.bk, os.br, { right: "12.5%" }]} />
      </View>
    );
  }

  if (mode === "diagonal") {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[os.diagLine, { width: diagLen, top: "50%", left: (viewW - diagLen) / 2, transform: [{ rotate: `${diagDeg}deg` }] }]} />
        <View style={[os.diagLine, { width: diagLen, top: "50%", left: (viewW - diagLen) / 2, transform: [{ rotate: `${-diagDeg}deg` }] }]} />
        <View style={[os.bk, os.tl]} /><View style={[os.bk, os.tr]} />
        <View style={[os.bk, os.bl]} /><View style={[os.bk, os.br]} />
      </View>
    );
  }

  if (mode === "spiral") {
    // Logarithmic golden spiral: r = a * e^(bθ), b = ln(φ)/(π/2)
    const PHI = 1.6180339887;
    const b = Math.log(PHI) / (Math.PI / 2);
    const fx = viewW * 0.618;
    const fy = viewH * 0.382;
    const scale = Math.min(viewW, viewH) * 0.9;
    const STEPS = 300;
    const thetaStart = -2.5 * Math.PI;
    const thetaEnd = 2 * Math.PI;

    let d = "";
    for (let i = 0; i <= STEPS; i++) {
      const t = thetaStart + (i / STEPS) * (thetaEnd - thetaStart);
      const r = scale * 0.004 * Math.exp(b * t);
      const x = fx + r * Math.cos(t);
      const y = fy + r * Math.sin(t);
      d += i === 0 ? `M${x.toFixed(1)},${y.toFixed(1)}` : `L${x.toFixed(1)},${y.toFixed(1)}`;
    }

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={viewW} height={viewH}>
          <Path d={d} stroke={GOLD} strokeWidth={1.2} fill="none" />
          {/* Focal point dot */}
          <Circle cx={fx} cy={fy} r={3} fill="rgba(255,215,0,0.7)" />
          {/* Golden ratio intersection lines */}
          <Line x1={viewW * 0.618} y1={0} x2={viewW * 0.618} y2={viewH} stroke={LINE} strokeWidth={0.6} />
          <Line x1={0} y1={viewH * 0.382} x2={viewW} y2={viewH * 0.382} stroke={LINE} strokeWidth={0.6} />
        </Svg>
      </View>
    );
  }

  if (mode === "triangle") {
    // Harmonic triangles: diagonals from each corner to opposite midpoints
    const W = viewW;
    const H = viewH;
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={W} height={H}>
          {/* Main diagonals */}
          <Line x1={0} y1={0} x2={W} y2={H} stroke={LINE} strokeWidth={0.8} />
          <Line x1={W} y1={0} x2={0} y2={H} stroke={LINE} strokeWidth={0.8} />
          {/* Sub-triangles from mid-edges */}
          <Line x1={W / 2} y1={0} x2={0} y2={H} stroke={LINE} strokeWidth={0.5} />
          <Line x1={W / 2} y1={0} x2={W} y2={H} stroke={LINE} strokeWidth={0.5} />
          <Line x1={0} y1={H / 2} x2={W} y2={0} stroke={LINE} strokeWidth={0.5} />
          <Line x1={0} y1={H / 2} x2={W} y2={H} stroke={LINE} strokeWidth={0.5} />
          {/* Center intersection dot */}
          <Circle cx={W / 2} cy={H / 2} r={3} fill="rgba(255,255,255,0.4)" />
        </Svg>
        <View style={[os.bk, os.tl]} /><View style={[os.bk, os.tr]} />
        <View style={[os.bk, os.bl]} /><View style={[os.bk, os.br]} />
      </View>
    );
  }

  if (mode === "fibonacci") {
    // Fibonacci rectangle grid — shows the tiling squares at Fibonacci proportions
    const W = viewW;
    const H = viewH;
    // Normalize to W × H using 8×5 Fibonacci ratio scaled to fill view
    const u = Math.min(W / 8, H / 5);
    // Squares at pixel positions (scaled from 8×5 unit grid)
    const sq: { x: number; y: number; s: number }[] = [
      { x: 0,     y: 0,     s: 5 },   // 5×5
      { x: 5,     y: 0,     s: 3 },   // 3×3
      { x: 6,     y: 3,     s: 2 },   // 2×2
      { x: 5,     y: 4,     s: 1 },   // 1×1
      { x: 6,     y: 4,     s: 1 },   // 1×1
    ];
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={W} height={H}>
          {sq.map((r, i) => (
            <Rect
              key={i}
              x={r.x * u}
              y={r.y * u}
              width={r.s * u}
              height={r.s * u}
              stroke={GOLD}
              strokeWidth={0.7}
              fill="none"
            />
          ))}
          {/* Golden spiral arc in the largest square */}
          <Path
            d={`M ${5 * u} ${5 * u} A ${5 * u} ${5 * u} 0 0 0 0 0`}
            stroke={GOLD}
            strokeWidth={1}
            fill="none"
          />
          <Path
            d={`M ${5 * u} 0 A ${3 * u} ${3 * u} 0 0 0 ${8 * u} ${3 * u}`}
            stroke={GOLD}
            strokeWidth={1}
            fill="none"
          />
        </Svg>
      </View>
    );
  }

  return null;
}

// ── Flash cycle ───────────────────────────────────────────────────────────────
const FLASH_ICONS: Record<FlashMode, string>  = { off: "⚡", auto: "A⚡", on: "⚡" };
const FLASH_COLORS: Record<FlashMode, string> = { off: "rgba(255,255,255,0.4)", auto: "#FFB800", on: "#FFD700" };
const FLASH_CYCLE: Record<FlashMode, FlashMode> = { off: "auto", auto: "on", on: "off" };

// ── Helpers ───────────────────────────────────────────────────────────────────
function pad(n: number) { return String(n).padStart(2, "0"); }
function formatDuration(sec: number) { return `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`; }

// Generates and shows a real video thumbnail in the grid
function VideoThumbnailThumb({ uri, thumbStyle }: { uri: string; thumbStyle: object }) {
  const [thumb, setThumb] = useState<string | null>(null);
  useEffect(() => {
    VideoThumbnails.getThumbnailAsync(uri, { time: 500 })
      .then(({ uri: t }) => setThumb(t))
      .catch(() => {});
  }, [uri]);

  return (
    <View style={[thumbStyle, { overflow: "hidden" }]}>
      {thumb ? (
        <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { justifyContent: "center", alignItems: "center", backgroundColor: "#1a1a1a" }]} />
      )}
      <View style={{ position: "absolute", bottom: 4, right: 6 }}>
        <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.9)" }}>▶</Text>
      </View>
    </View>
  );
}

// Separate component so useVideoPlayer hook is called at component level, not inside renderItem
function VideoItem({ uri, style }: { uri: string; style: object }) {
  const player = useVideoPlayer(uri);
  return <VideoView player={player} style={style} nativeControls contentFit="contain" />;
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  // Initialize state for both web and native
  const [cameraMode, setCameraMode] = useState<CameraMode>("photo");
  const [isRecording, setIsRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // UI state
  const [activeScript, setActiveScript] = useState(0);
  const [flashMode, setFlashMode] = useState<FlashMode>("off");
  const [overlayMode, setOverlayMode] = useState<OverlayMode>("thirds");
  const [overlayPickerOpen, setOverlayPickerOpen] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [showAutoBadge, setShowAutoBadge] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [threshold, setThreshold] = useState(88);
  const [toastMsg, setToastMsg] = useState("");

  // Gallery
  const [capturedMedia, setCapturedMedia] = useState<MediaItem[]>([]);
  const [galleryData, setGalleryData] = useState<MediaItem[]>([]);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Camera state (shared with web mock)
  const [viewSize, setViewSize] = useState({ w: 0, h: 0 });
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const focusAnim = useRef(new Animated.Value(1)).current;
  const [exposure, setExposure] = useState(0);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const expLockedRef = useRef(false);
  const expStartY = useRef(0);
  const [expLocked, setExpLocked] = useState(false);

  // Post-capture score reveal (C-4). lastShotRef enables the before/after glow-up.
  const [reveal, setReveal] = useState<RevealState>(null);
  const lastShotRef = useRef<{ metrics: PhotoMetrics; score: PhotoScore; uri: string } | null>(null);

  // Web demo mode
  if (isWeb) {
    const isFocused = useIsFocused();
    const showToastMsg = (msg: string) => {
      setToastMsg(msg);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    };

    const cycleFlash = () => setFlashMode(FLASH_CYCLE[flashMode]);
    const toggleExpLock = () => { expLockedRef.current = !expLockedRef.current; setExpLocked(!expLocked); };

    const expPan = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => { expStartY.current = e.nativeEvent.pageY; },
        onPanResponderMove: (e) => {
          if (expLockedRef.current) return;
          const delta = expStartY.current - e.nativeEvent.pageY;
          setExposure(Math.max(-1, Math.min(1, delta / 60)));
        },
      })
    ).current;

    const handleTap = useCallback(() => {
      // Demo: show focus ring animation
      setFocusPoint({ x: viewSize.w / 2, y: viewSize.h / 2 });
      focusAnim.setValue(1.4);
      Animated.timing(focusAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      setTimeout(() => setFocusPoint(null), 1200);
    }, [viewSize.w, viewSize.h]);

    const showToastMsg_Demo = (msg: string) => showToastMsg(msg);

    // Demo capture: score a mock shot, reveal it; each subsequent shot improves
    // on the last so the before/after glow-up loop is visible without hardware.
    const runDemoCapture = () => {
      const prev = lastShotRef.current;
      const metrics = prev ? improvedMetrics(prev.metrics) : mockMetrics();
      const score = scorePhoto(metrics);
      setReveal({ photoUri: DEMO_PHOTO, score, beforeUri: prev?.uri, beforeScore: prev?.score });
      lastShotRef.current = { metrics, score, uri: DEMO_PHOTO };
    };

    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        {/* ── MOCK VIEWFINDER ─────────────────────────────────────────── */}
        <View
          style={s.viewfinder}
          onTouchEnd={handleTap}
          onLayout={(e) =>
            setViewSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
          }
        >
          {/* Mock camera background */}
          <View
            style={{
              ...StyleSheet.absoluteFill,
              backgroundColor: "#1a1a1a",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Mock Camera Preview</Text>
          </View>

          {/* Frame overlay - REAL RENDERING */}
          <GridOverlay mode={overlayMode} viewW={viewSize.w} viewH={viewSize.h} />

          {/* Focus ring */}
          {focusPoint && (
            <Animated.View
              pointerEvents="none"
              style={[s.focusRing, { left: focusPoint.x - 30, top: focusPoint.y - 30, transform: [{ scale: focusAnim }] }]}
            />
          )}

          {/* ── Top bar ── */}
          <View style={s.topBar}>
            {aiMode ? (
              <View style={s.modePill}>
                <Text style={s.modeText}>{SCRIPTS[activeScript].label.toUpperCase()}</Text>
              </View>
            ) : (
              <View />
            )}

            <View style={{ flexDirection: "row", gap: 8 }}>
              {cameraMode === "photo" && (
                <TouchableOpacity style={s.iconBtn} onPress={cycleFlash}>
                  <Text style={[s.iconTxt, { color: FLASH_COLORS[flashMode] }]}>
                    {FLASH_ICONS[flashMode]}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[s.iconBtn, overlayPickerOpen && s.iconBtnActive]}
                onPress={() => setOverlayPickerOpen((o) => !o)}
              >
                <Text style={[s.iconTxt, overlayMode !== "none" && { color: "#FFD700" }]}>
                  {OVERLAY_OPTIONS.find((o) => o.mode === overlayMode)?.icon ?? "▦"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.iconBtn, aiMode && s.iconBtnActive]}
                onPress={() => {
                  setAiMode((m) => !m);
                  if (settingsOpen) setSettingsOpen(false);
                }}
              >
                <Text style={[s.iconTxt, { color: aiMode ? "#FFD700" : "rgba(255,255,255,0.45)" }]}>
                  AI
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Overlay picker popup ── */}
          {overlayPickerOpen && (
            <View style={s.overlayPicker}>
              <Text style={s.overlayPickerTitle}>FRAME GUIDE</Text>
              <View style={s.overlayGrid}>
                {OVERLAY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.mode}
                    style={[s.overlayCell, overlayMode === opt.mode && s.overlayCellActive]}
                    onPress={() => { setOverlayMode(opt.mode); setOverlayPickerOpen(false); }}
                  >
                    <Text style={s.overlayCellIcon}>{opt.icon}</Text>
                    <Text style={[s.overlayCellLabel, overlayMode === opt.mode && { color: "#000" }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── Exposure column (slider + lock) ── */}
          <View style={s.expColumn}>
            <TouchableOpacity style={s.expLockBtn} onPress={toggleExpLock}>
              <Text style={{ fontSize: 13 }}>{expLocked ? "🔒" : "🔓"}</Text>
            </TouchableOpacity>
            <View style={[s.expPill, expLocked && s.expPillLocked]} {...expPan.panHandlers}>
              <Text style={s.expIcon}>☀</Text>
              <View style={s.expTrack}>
                <View style={[s.expFill, { height: `${(exposure + 1) * 50}%` }]} />
              </View>
              <Text style={s.expVal}>
                {exposure > 0 ? "+" : ""}{Math.round(exposure * 10) / 10}
              </Text>
            </View>
            {expLocked && (
              <View style={s.expLockedBadge}>
                <Text style={s.expLockedBadgeText}>EXP{"\n"}LOCK</Text>
              </View>
            )}
          </View>

          {/* Demo mode badge */}
          <View style={{ position: "absolute", bottom: 16, left: 16, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 }}>
            <Text style={{ color: "#FFD700", fontSize: 12, fontWeight: "600" }}>DEMO MODE</Text>
          </View>

          {/* Toast */}
          {showToast && (
            <View style={s.toast}>
              <Text style={s.toastText}>{toastMsg}</Text>
            </View>
          )}
        </View>

        {/* ── Bottom controls ── */}
        <View style={s.bottomBar}>
          {/* Gallery thumbnail */}
          <TouchableOpacity style={s.galleryBtn} onPress={() => setGalleryVisible(true)}>
            {capturedMedia.length > 0 ? (
              <Image source={{ uri: capturedMedia[capturedMedia.length - 1].uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFill, { justifyContent: "center", alignItems: "center", backgroundColor: "#1a1a1a" }]} />
            )}
            <Text style={{ fontSize: 22 }}>🖼</Text>
            {captureCount > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{captureCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Shutter / record button */}
          <TouchableOpacity style={s.shutter} onPress={runDemoCapture}>
            <View style={[s.shutterInner, { backgroundColor: "#fff" }]} />
          </TouchableOpacity>

          {/* Mode toggle (photo ↔ video) + flip */}
          <View style={{ alignItems: "center", gap: 6 }}>
            <TouchableOpacity
              style={s.flipBtn}
              onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
            >
              <Text style={{ fontSize: 22, color: "white" }}>↺</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.modeToggleBtn}
              onPress={() => {
                setCameraMode((m) => (m === "photo" ? "video" : "photo"));
              }}
            >
              <Text style={s.modeToggleTxt}>
                {cameraMode === "photo" ? "🎬" : "📷"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Mode label ── */}
        <Text style={s.modeLabelBottom}>
          {cameraMode === "photo" ? "PHOTO" : "VIDEO"}
        </Text>

        <RevealModal
          state={reveal}
          onClose={() => setReveal(null)}
          onRetake={() => setReveal(null)}
          onShare={() => { setReveal(null); showToastMsg("Shared — demo"); }}
        />
      </SafeAreaView>
    );
  }

  // ─── NATIVE PLATFORM CODE ────────────────────────────────────────────────
  const cameraRef = useRef<any>(null);
  const visionCamera = require("react-native-vision-camera");
  const { Camera } = visionCamera;
  const { useCameraDevice } = visionCamera;
  const { useCameraPermission } = visionCamera;
  const { useMicrophonePermission } = visionCamera;

  const device = useCameraDevice(facing);
  const { hasPermission, requestPermission } = useCameraPermission();
  const { requestPermission: requestMicPerm } = useMicrophonePermission();
  const [mediaLibraryPermission, requestMediaLibraryPermission] =
    MediaLibrary.usePermissions();

  const isFocused = useIsFocused();

  // AI Coach
  const { score, tip, scoreColor, autoFire } = useAICoach({
    scriptIndex: activeScript,
    autoEnabled: autoEnabled && aiMode,
    threshold,
    enabled: aiMode,
  });

  // Keep score in a ref so capture() doesn't need score as a dep (fixes auto-fire loop)
  const scoreRef = useRef(score);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const scoreAnim = useRef(new Animated.Value(score)).current;
  useEffect(() => {
    Animated.spring(scoreAnim, { toValue: score, useNativeDriver: false, friction: 8 }).start();
  }, [score]);

  useEffect(() => {
    const go = async () => {
      await requestPermission();
      await requestMicPerm();
      if (mediaLibraryPermission?.status !== "granted") {
        await requestMediaLibraryPermission();
      }
    };
    go();
  }, []);

  const showToastMsg = useCallback((msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  const cycleFlash = useCallback(() => setFlashMode((m) => FLASH_CYCLE[m]), []);

  // Save to system gallery — createAssetAsync only (no addAssetsToAlbum, which triggers
  // the Android 11+ "Allow modification?" system dialog on every call). Returns the
  // persistent content:// URI so callers can store it instead of the temp file:// path.
  const saveToLibrary = useCallback(async (fileUri: string): Promise<string> => {
    try {
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      return asset.uri;
    } catch (e: any) {
      console.log("Library save error:", e?.message);
      return fileUri;
    }
  }, []);

  const toggleExpLock = useCallback(() => {
    setExpLocked((prev) => {
      expLockedRef.current = !prev;
      return !prev;
    });
  }, []);

  // ── capture (photo) ─────────────────────────────────────────────────────────
  // score removed from deps — use scoreRef.current to prevent re-creation every frame
  const capture = useCallback(
    async (isAuto = false) => {
      if (!cameraRef.current) { showToastMsg("Camera not ready"); return; }
      try {
        const photo = await cameraRef.current.takePhoto({ flash: flashMode });
        const fileUri = "file://" + photo.path;
        const savedUri = mediaLibraryPermission?.status === "granted"
          ? await saveToLibrary(fileUri)
          : fileUri;
        setCapturedMedia((p) => [{ uri: savedUri, type: "photo" }, ...p]);
        setCaptureCount((c) => c + 1);

        // Post-capture score reveal (C-4). Metrics are mocked until the hot loop
        // (C-1) lands real framing metrics — gated by SP-1. The photo itself is real.
        const prevShot = lastShotRef.current;
        const metrics = prevShot ? improvedMetrics(prevShot.metrics) : mockMetrics();
        const photoScoreResult = scorePhoto(metrics);
        setReveal({
          photoUri: savedUri,
          score: photoScoreResult,
          beforeUri: prevShot?.uri,
          beforeScore: prevShot?.score,
        });
        lastShotRef.current = { metrics, score: photoScoreResult, uri: savedUri };

        showToastMsg(isAuto ? `Auto shot! Score: ${photoScoreResult.overall}` : "Saved ✓");
      } catch (e: any) {
        showToastMsg("Capture failed");
        console.log("Capture error:", e?.message);
      }
    },
    [flashMode, mediaLibraryPermission, showToastMsg]
    // ↑ score intentionally omitted — use scoreRef.current instead
  );

  // Stable ref so the autoFire effect never has capture as a dep
  const captureRef = useRef(capture);
  useEffect(() => { captureRef.current = capture; }, [capture]);

  // autoFire effect — uses captureRef, NOT capture, so it never re-fires on rebuild
  const autoFireHandledRef = useRef(false);
  useEffect(() => {
    if (autoFire && !autoFireHandledRef.current) {
      autoFireHandledRef.current = true;
      setShowAutoBadge(true);
      captureRef.current(true);
      setTimeout(() => {
        setShowAutoBadge(false);
        autoFireHandledRef.current = false;
      }, 2500);
    }
    if (!autoFire) {
      autoFireHandledRef.current = false;
    }
  }, [autoFire]);

  // ── video recording ─────────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!cameraRef.current) { showToastMsg("Camera not ready"); return; }
    setIsRecording(true);
    setRecSeconds(0);
    recTimerRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000);

    cameraRef.current.startRecording({
      onRecordingFinished: async (video) => {
        clearInterval(recTimerRef.current!);
        setIsRecording(false);
        setRecSeconds(0);
        const fileUri = "file://" + video.path;
        // Keep file:// for playback; save to library in background (no await = no dialog wait)
        if (mediaLibraryPermission?.status === "granted") saveToLibrary(fileUri);
        setCapturedMedia((p) => [{ uri: fileUri, type: "video" }, ...p]);
        setCaptureCount((c) => c + 1);
        showToastMsg("Saved ✓");
      },
      onRecordingError: (e) => {
        clearInterval(recTimerRef.current!);
        setIsRecording(false);
        console.log("Recording error:", e);
        showToastMsg("Recording failed");
      },
    });
  }, [mediaLibraryPermission, showToastMsg]);

  const stopRecording = useCallback(async () => {
    await cameraRef.current?.stopRecording();
  }, []);

  const handleShutter = useCallback(() => {
    if (cameraMode === "photo") {
      capture(false);
    } else {
      isRecording ? stopRecording() : startRecording();
    }
  }, [cameraMode, isRecording, capture, startRecording, stopRecording]);

  const openGallery = useCallback(async () => {
    setGalleryVisible(true);
    setGalleryLoading(true);
    try {
      // Ensure permission is granted before querying
      let perm = mediaLibraryPermission;
      if (perm?.status !== "granted") {
        perm = await requestMediaLibraryPermission();
      }
      if (perm?.status !== "granted") {
        setGalleryData(capturedMedia);
        setGalleryLoading(false);
        return;
      }
      const { assets } = await MediaLibrary.getAssetsAsync({
        sortBy: MediaLibrary.SortBy.creationTime,
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        first: 100,
      });
      setGalleryData(
        assets.map((a) => ({
          uri: a.uri,
          type: (a.mediaType === "video" ? "video" : "photo") as "photo" | "video",
        }))
      );
    } catch {
      setGalleryData(capturedMedia);
    }
    setGalleryLoading(false);
  }, [capturedMedia, mediaLibraryPermission, requestMediaLibraryPermission]);

  const handleTap = useCallback(async (e: any) => {
    const { locationX: x, locationY: y } = e.nativeEvent;
    setFocusPoint({ x, y });
    focusAnim.setValue(1.4);
    Animated.timing(focusAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    setTimeout(() => setFocusPoint(null), 1200);
    try { await cameraRef.current?.focus({ x, y }); } catch (_) {}
  }, []);

  const expPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => { expStartY.current = e.nativeEvent.pageY; },
      onPanResponderMove: (e) => {
        if (expLockedRef.current) return;
        const delta = expStartY.current - e.nativeEvent.pageY;
        setExposure(Math.max(-1, Math.min(1, delta / 60)));
      },
    })
  ).current;

  if (!hasPermission) {
    return (
      <View style={s.center}>
        <Text style={{ color: "white", marginBottom: 16 }}>Camera permission required</Text>
        <TouchableOpacity onPress={requestPermission} style={s.permBtn}>
          <Text style={{ color: "white" }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!device) {
    return <View style={s.center}><Text style={{ color: "white" }}>Loading camera…</Text></View>;
  }

  const shutterColor = isRecording
    ? "#FF3B30"
    : cameraMode === "video"
    ? "#FF3B30"
    : autoEnabled && score >= threshold
    ? "#4ADE80"
    : "#fff";

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* ── VIEWFINDER ─────────────────────────────────────────────── */}
      <View
        style={s.viewfinder}
        onTouchEnd={handleTap}
        onLayout={(e) =>
          setViewSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
        }
      >
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isFocused && !galleryVisible}
          photo={true}
          video={true}
          audio={cameraMode === "video"}
          exposure={exposure}
        />

        {/* Frame overlay */}
        <GridOverlay mode={overlayMode} viewW={viewSize.w} viewH={viewSize.h} />

        {/* Focus ring */}
        {focusPoint && (
          <Animated.View
            pointerEvents="none"
            style={[s.focusRing, { left: focusPoint.x - 30, top: focusPoint.y - 30, transform: [{ scale: focusAnim }] }]}
          />
        )}

        {/* ── Top bar ── */}
        <View style={s.topBar}>
          {/* Script label — only when AI mode on */}
          {aiMode ? (
            <View style={s.modePill}>
              <Text style={s.modeText}>{SCRIPTS[activeScript].label.toUpperCase()}</Text>
            </View>
          ) : (
            <View />
          )}

          <View style={{ flexDirection: "row", gap: 8 }}>
            {/* Flash — cycles Off → Auto → On (hidden in video mode) */}
            {cameraMode === "photo" && (
              <TouchableOpacity style={s.iconBtn} onPress={cycleFlash}>
                <Text style={[s.iconTxt, { color: FLASH_COLORS[flashMode] }]}>
                  {FLASH_ICONS[flashMode]}
                </Text>
              </TouchableOpacity>
            )}

            {/* Frame overlay picker */}
            <TouchableOpacity
              style={[s.iconBtn, overlayPickerOpen && s.iconBtnActive]}
              onPress={() => setOverlayPickerOpen((o) => !o)}
            >
              <Text style={[s.iconTxt, overlayMode !== "none" && { color: "#FFD700" }]}>
                {OVERLAY_OPTIONS.find((o) => o.mode === overlayMode)?.icon ?? "▦"}
              </Text>
            </TouchableOpacity>

            {/* AI mode toggle */}
            <TouchableOpacity
              style={[s.iconBtn, aiMode && s.iconBtnActive]}
              onPress={() => { setAiMode((m) => !m); if (settingsOpen) setSettingsOpen(false); }}
            >
              <Text style={[s.iconTxt, { color: aiMode ? "#FFD700" : "rgba(255,255,255,0.45)" }]}>
                AI
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Overlay picker popup ── */}
        {overlayPickerOpen && (
          <View style={s.overlayPicker}>
            <Text style={s.overlayPickerTitle}>FRAME GUIDE</Text>
            <View style={s.overlayGrid}>
              {OVERLAY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.mode}
                  style={[s.overlayCell, overlayMode === opt.mode && s.overlayCellActive]}
                  onPress={() => { setOverlayMode(opt.mode); setOverlayPickerOpen(false); }}
                >
                  <Text style={s.overlayCellIcon}>{opt.icon}</Text>
                  <Text style={[s.overlayCellLabel, overlayMode === opt.mode && { color: "#000" }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Exposure column (slider + lock) ── */}
        <View style={s.expColumn}>
          <TouchableOpacity style={s.expLockBtn} onPress={toggleExpLock}>
            <Text style={{ fontSize: 13 }}>{expLocked ? "🔒" : "🔓"}</Text>
          </TouchableOpacity>
          <View style={[s.expPill, expLocked && s.expPillLocked]} {...expPan.panHandlers}>
            <Text style={s.expIcon}>☀</Text>
            <View style={s.expTrack}>
              <View style={[s.expFill, { height: `${(exposure + 1) * 50}%` }]} />
            </View>
            <Text style={s.expVal}>
              {exposure > 0 ? "+" : ""}{Math.round(exposure * 10) / 10}
            </Text>
          </View>
          {expLocked && (
            <View style={s.expLockedBadge}>
              <Text style={s.expLockedBadgeText}>EXP{"\n"}LOCK</Text>
            </View>
          )}
        </View>

        {/* Recording indicator */}
        {isRecording && (
          <View style={s.recIndicator}>
            <View style={s.recDot} />
            <Text style={s.recTime}>{formatDuration(recSeconds)}</Text>
          </View>
        )}

        {/* Auto shot badge */}
        {showAutoBadge && (
          <View style={s.autoBadge}>
            <Text style={s.autoBadgeText}>AUTO SHOT</Text>
          </View>
        )}

        {/* Toast */}
        {showToast && (
          <View style={s.toast}>
            <Text style={s.toastText}>{toastMsg}</Text>
          </View>
        )}

        {/* AI Score overlay — only in AI mode, hidden while recording */}
        {aiMode && !isRecording && (
          <View style={s.aiOverlay}>
            <View style={s.scoreRow}>
              <Text style={s.scoreLabel}>AI Score</Text>
              <View style={s.scoreTrack}>
                <Animated.View
                  style={[
                    s.scoreFill,
                    {
                      width: scoreAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
                      backgroundColor: scoreColor,
                    },
                  ]}
                />
              </View>
              <Text style={[s.scoreNum, { color: scoreColor }]}>{Math.round(score)}</Text>
            </View>
            <View style={s.tipRow}>
              <View style={[s.tipDot, { backgroundColor: scoreColor }]} />
              <Text style={s.tipText}>{tip}</Text>
            </View>
          </View>
        )}
      </View>

      {/* ── BOTTOM PANEL ─────────────────────────────────────────────── */}
      <View style={s.bottom}>
        {/* Settings toggle — only in AI mode + photo mode */}
        {aiMode && cameraMode === "photo" && (
          <>
            <TouchableOpacity style={s.settingsToggle} onPress={() => setSettingsOpen((o) => !o)}>
              <Text style={s.settingsToggleText}>⚙  AI Settings</Text>
              <Text style={s.settingsToggleText}>{settingsOpen ? "▲" : "▼"}</Text>
            </TouchableOpacity>
            {settingsOpen && (
              <View style={s.settingsPanel}>
                <View style={s.settingRow}>
                  <Text style={s.settingLabel}>Auto-capture</Text>
                  <TouchableOpacity
                    style={[s.toggle, autoEnabled && s.toggleOn]}
                    onPress={() => setAutoEnabled((a) => !a)}
                  />
                </View>
                <View style={s.settingRow}>
                  <Text style={s.settingLabel}>Threshold: {threshold}</Text>
                  <View style={s.threshBtns}>
                    <TouchableOpacity onPress={() => setThreshold((t) => Math.max(70, t - 5))} style={s.threshBtn}>
                      <Text style={s.threshBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={s.threshVal}>{threshold}</Text>
                    <TouchableOpacity onPress={() => setThreshold((t) => Math.min(98, t + 5))} style={s.threshBtn}>
                      <Text style={s.threshBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        {/* Scripts — only in AI mode */}
        {aiMode && (
          <View style={s.scriptsRow}>
            {SCRIPTS.map((sc, i) => (
              <TouchableOpacity
                key={i}
                style={[s.scriptChip, i === activeScript && s.scriptChipActive]}
                onPress={() => setActiveScript(i)}
              >
                <Text style={[s.scriptText, i === activeScript && s.scriptTextActive]}>
                  {sc.icon} {sc.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Controls row */}
        <View style={s.controls}>
          {/* Gallery / shot counter */}
          <TouchableOpacity style={s.galleryBtn} onPress={openGallery}>
            {capturedMedia.length > 0 ? (
              capturedMedia[0].type === "photo" ? (
                <Image source={{ uri: capturedMedia[0].uri }} style={s.galleryThumb} />
              ) : (
                <View style={[s.galleryThumb, s.videoThumbBg]}>
                  <Text style={s.videoPlayIcon}>▶</Text>
                </View>
              )
            ) : (
              <Text style={{ fontSize: 22 }}>🖼</Text>
            )}
            {captureCount > 0 && (
              <View style={s.badge}><Text style={s.badgeText}>{captureCount}</Text></View>
            )}
          </TouchableOpacity>

          {/* Shutter / record button */}
          <TouchableOpacity
            style={[s.shutter, { borderColor: shutterColor + "66" }]}
            onPress={handleShutter}
          >
            {cameraMode === "video" ? (
              <View style={[s.recButtonInner, { backgroundColor: isRecording ? shutterColor : shutterColor }]}>
                {isRecording
                  ? <View style={s.recStopSquare} />
                  : <View style={s.recDotLarge} />
                }
              </View>
            ) : (
              <View style={[s.shutterInner, { backgroundColor: shutterColor }]} />
            )}
          </TouchableOpacity>

          {/* Mode toggle (photo ↔ video) + flip */}
          <View style={{ alignItems: "center", gap: 6 }}>
            <TouchableOpacity
              style={s.flipBtn}
              onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
            >
              <Text style={{ fontSize: 22, color: "white" }}>↺</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.modeToggleBtn}
              onPress={() => {
                if (isRecording) return;
                setCameraMode((m) => (m === "photo" ? "video" : "photo"));
              }}
            >
              <Text style={s.modeToggleTxt}>
                {cameraMode === "photo" ? "🎬" : "📷"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mode label */}
        <Text style={s.modeLabelBottom}>
          {cameraMode === "photo" ? "PHOTO" : isRecording ? "● REC" : "VIDEO"}
        </Text>
      </View>

      {/* ── GALLERY MODAL ──────────────────────────────────────────── */}
      <Modal
        visible={galleryVisible}
        animationType="slide"
        onRequestClose={() => {
          if (selectedIndex !== null) { setSelectedIndex(null); }
          else { setGalleryVisible(false); }
        }}
      >
        <View style={s.galleryModal}>
          {selectedIndex === null ? (
            /* ── Grid view ── */
            <>
              <View style={s.galleryHeader}>
                <Text style={s.galleryTitle}>Gallery ({galleryData.length})</Text>
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <TouchableOpacity
                    onPress={() => Linking.openURL("content://media/external/images/media").catch(() => Linking.openURL("content://media/internal/images/media").catch(() => {}))}
                    style={[s.galleryClose, { width: "auto", paddingHorizontal: 10 }]}
                  >
                    <Text style={{ color: "#FFD700", fontSize: 11, fontWeight: "700" }}>PHONE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setGalleryVisible(false)} style={s.galleryClose}>
                    <Text style={s.galleryCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {galleryLoading ? (
                <View style={s.galleryCenter}>
                  <ActivityIndicator color="#FFD700" size="large" />
                </View>
              ) : galleryData.length === 0 ? (
                <View style={s.galleryCenter}>
                  <Text style={s.galleryEmpty}>No photos yet</Text>
                </View>
              ) : (
                <FlatList
                  data={galleryData}
                  numColumns={3}
                  keyExtractor={(item, i) => item.uri + i}
                  contentContainerStyle={s.galleryGrid}
                  columnWrapperStyle={{ gap: 4 }}
                  ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity onPress={() => setSelectedIndex(index)}>
                      {item.type === "photo" ? (
                        <Image source={{ uri: item.uri }} style={s.gridThumb} />
                      ) : (
                        <VideoThumbnailThumb uri={item.uri} thumbStyle={s.gridThumb} />
                      )}
                    </TouchableOpacity>
                  )}
                />
              )}
            </>
          ) : (
            /* ── Swipe pager ── */
            <View style={{ flex: 1, backgroundColor: "#000" }}>
              <TouchableOpacity style={s.fullscreenClose} onPress={() => setSelectedIndex(null)}>
                <Text style={s.galleryCloseText}>✕</Text>
              </TouchableOpacity>
              <FlatList
                data={galleryData}
                horizontal
                pagingEnabled
                initialScrollIndex={selectedIndex}
                getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, i) => item.uri + i}
                renderItem={({ item }) =>
                  item.type === "photo" ? (
                    <Image
                      source={{ uri: item.uri }}
                      style={{ width, flex: 1 }}
                      resizeMode="contain"
                    />
                  ) : (
                    <VideoItem uri={item.uri} style={{ width, flex: 1 }} />
                  )
                }
              />
            </View>
          )}
        </View>
      </Modal>

      <RevealModal
        state={reveal}
        onClose={() => setReveal(null)}
        onRetake={() => setReveal(null)}
        onShare={() => { setReveal(null); showToastMsg("Shared — demo"); }}
      />
    </SafeAreaView>
  );
}

// ── Overlay styles ────────────────────────────────────────────────────────────
const os = StyleSheet.create({
  gl:        { position: "absolute", backgroundColor: "rgba(255,255,255,0.22)" },
  bk:        { position: "absolute", width: 24, height: 24 },
  tl:        { top: 16, left: 16,  borderTopWidth: 2,    borderLeftWidth: 2,  borderColor: "rgba(255,255,255,0.7)" },
  tr:        { top: 16, right: 16, borderTopWidth: 2,    borderRightWidth: 2, borderColor: "rgba(255,255,255,0.7)" },
  bl:        { bottom: 16, left: 16,  borderBottomWidth: 2, borderLeftWidth: 2,  borderColor: "rgba(255,255,255,0.7)" },
  br:        { bottom: 16, right: 16, borderBottomWidth: 2, borderRightWidth: 2, borderColor: "rgba(255,255,255,0.7)" },
  centerDot: { position: "absolute", top: "50%", left: "50%", width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.5)", marginTop: -4, marginLeft: -4 },
  phiLabel:  { position: "absolute", top: 20, right: 20, backgroundColor: "rgba(255,215,0,0.15)", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  phiText:   { color: "#FFD700", fontSize: 11, fontWeight: "700" },
  sqMaskL:   { position: "absolute", top: 0, bottom: 0, left: 0, width: "12.5%", backgroundColor: "rgba(0,0,0,0.4)" },
  sqMaskR:   { position: "absolute", top: 0, bottom: 0, right: 0, width: "12.5%", backgroundColor: "rgba(0,0,0,0.4)" },
  sqBorder:  { position: "absolute", top: 0, bottom: 0, left: "12.5%", right: "12.5%", borderLeftWidth: 1, borderRightWidth: 1, borderColor: "rgba(255,255,255,0.5)" },
  diagLine:  { position: "absolute", height: 0.5, backgroundColor: "rgba(255,255,255,0.25)" },
});

// ── Main styles ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#0a0a0a" },
  viewfinder: { flex: 1, position: "relative" },
  center:     { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  permBtn:    { backgroundColor: "#1A73E8", padding: 12, borderRadius: 8 },

  focusRing: { position: "absolute", width: 60, height: 60, borderRadius: 30, borderWidth: 1.5, borderColor: "#FFD700" },

  topBar: { position: "absolute", top: 12, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modePill: { backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.2)" },
  modeText: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "600" },
  iconBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(0,0,0,0.5)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  iconBtnActive: { borderColor: "#FFD700", backgroundColor: "rgba(255,215,0,0.15)" },
  iconTxt: { fontSize: 15, color: "white" },

  // Overlay picker
  overlayPicker: { position: "absolute", top: 56, right: 16, backgroundColor: "rgba(20,20,20,0.97)", borderRadius: 14, padding: 12, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.15)", width: 220 },
  overlayPickerTitle: { color: "rgba(255,255,255,0.4)", fontSize: 9, letterSpacing: 1.5, marginBottom: 10, textAlign: "center" },
  overlayGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  overlayCell: { width: 58, height: 54, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center", gap: 3 },
  overlayCellActive: { backgroundColor: "#FFD700", borderColor: "#FFD700" },
  overlayCellIcon: { fontSize: 18, color: "white" },
  overlayCellLabel: { fontSize: 9, color: "rgba(255,255,255,0.6)", letterSpacing: 0.3 },

  // Exposure
  expColumn: { position: "absolute", right: 14, top: "28%", alignItems: "center", gap: 6 },
  expLockBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(0,0,0,0.5)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  expPill: { backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 20, padding: 8, alignItems: "center", gap: 6 },
  expPillLocked: { borderColor: "#FFD700", borderWidth: 1 },
  expIcon: { fontSize: 14, color: "#FFD700" },
  expTrack: { width: 4, height: 80, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2, justifyContent: "flex-end" },
  expFill: { width: 4, backgroundColor: "#FFD700", borderRadius: 2 },
  expVal: { fontSize: 10, color: "rgba(255,255,255,0.7)" },
  expLockedBadge: { backgroundColor: "rgba(255,215,0,0.2)", borderRadius: 6, paddingHorizontal: 4, paddingVertical: 3, borderWidth: 0.5, borderColor: "#FFD700", alignItems: "center" },
  expLockedBadgeText: { fontSize: 8, color: "#FFD700", fontWeight: "700", letterSpacing: 0.5, textAlign: "center" },

  // Recording
  recIndicator: { position: "absolute", top: 12, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF3B30" },
  recTime: { color: "white", fontSize: 13, fontWeight: "600", fontVariant: ["tabular-nums"] },

  // Badges / toasts
  autoBadge: { position: "absolute", top: 12, alignSelf: "center", backgroundColor: "#4ADE80", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 },
  autoBadgeText: { fontSize: 11, fontWeight: "700", color: "#000" },
  toast: { position: "absolute", bottom: 12, alignSelf: "center", backgroundColor: "rgba(0,0,0,0.8)", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.2)" },
  toastText: { color: "white", fontSize: 12 },

  // AI Score
  aiOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 14, paddingBottom: 16, backgroundColor: "rgba(0,0,0,0.4)" },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  scoreLabel: { fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1 },
  scoreTrack: { flex: 1, height: 4, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 2, overflow: "hidden" },
  scoreFill: { height: 4, borderRadius: 2 },
  scoreNum: { fontSize: 14, fontWeight: "600", minWidth: 28, textAlign: "right" },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tipDot: { width: 5, height: 5, borderRadius: 3 },
  tipText: { fontSize: 12, color: "rgba(255,255,255,0.85)", flex: 1 },

  // Bottom panel
  bottom: { backgroundColor: "#111", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  bottomBar: { backgroundColor: "#111", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  settingsToggle: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  settingsToggleText: { fontSize: 11, color: "rgba(255,255,255,0.5)" },
  settingsPanel: { backgroundColor: "#1a1a1a", borderRadius: 12, padding: 14, marginBottom: 12 },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  settingLabel: { fontSize: 12, color: "rgba(255,255,255,0.65)" },
  toggle: { width: 36, height: 20, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)" },
  toggleOn: { backgroundColor: "#FFD700" },
  threshBtns: { flexDirection: "row", alignItems: "center", gap: 10 },
  threshBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center" },
  threshBtnText: { color: "white", fontSize: 16 },
  threshVal: { color: "#FFD700", fontSize: 13, fontWeight: "600", minWidth: 28, textAlign: "center" },

  scriptsRow: { flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" },
  scriptChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.2)" },
  scriptChipActive: { backgroundColor: "#FFD700", borderColor: "#FFD700" },
  scriptText: { fontSize: 11, color: "rgba(255,255,255,0.6)" },
  scriptTextActive: { color: "#000", fontWeight: "600" },

  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  galleryBtn: { width: 52, height: 52, borderRadius: 10, backgroundColor: "#222", justifyContent: "center", alignItems: "center", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.15)", overflow: "hidden" },
  galleryThumb: { width: 52, height: 52, borderRadius: 10 },
  badge: { position: "absolute", top: -6, right: -6, backgroundColor: "#1A73E8", borderRadius: 10, minWidth: 18, height: 18, justifyContent: "center", alignItems: "center" },
  badgeText: { fontSize: 10, color: "white", fontWeight: "700" },

  shutter: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.12)", justifyContent: "center", alignItems: "center", borderWidth: 3 },
  shutterInner: { width: 58, height: 58, borderRadius: 29 },

  recButtonInner: { width: 58, height: 58, borderRadius: 29, justifyContent: "center", alignItems: "center" },
  recDotLarge: { width: 28, height: 28, borderRadius: 14, backgroundColor: "white" },
  recStopSquare: { width: 22, height: 22, borderRadius: 4, backgroundColor: "white" },

  flipBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center" },
  modeToggleBtn: { width: 44, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)", justifyContent: "center", alignItems: "center" },
  modeToggleTxt: { fontSize: 16 },
  modeLabelBottom: { textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 9, letterSpacing: 2, marginBottom: 2 },

  // Score reveal (C-4)
  revealBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", padding: 16 },

  // Gallery modal
  galleryModal: { flex: 1, backgroundColor: "#0a0a0a" },
  galleryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16, borderBottomWidth: 0.5, borderBottomColor: "rgba(255,255,255,0.1)" },
  galleryTitle: { color: "white", fontSize: 16, fontWeight: "600" },
  galleryClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center" },
  galleryCloseText: { color: "white", fontSize: 16 },
  galleryGrid: { padding: 16 },
  gridThumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 6, backgroundColor: "#222" },
  fullscreenOverlay: { flex: 1, backgroundColor: "#000", justifyContent: "center" },
  fullscreenClose: { position: "absolute", top: 52, right: 16, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  fullscreenImage: { width: "100%", height: "100%" },
  galleryCenter:   { flex: 1, justifyContent: "center", alignItems: "center" },
  galleryEmpty:    { color: "rgba(255,255,255,0.4)", fontSize: 16 },

  // Video gallery styles
  videoThumbBg:      { justifyContent: "center", alignItems: "center", backgroundColor: "#1a1a1a" },
  videoPlayIcon:     { fontSize: 28, color: "rgba(255,255,255,0.9)" },
  videoLabel:        { fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: 1, marginTop: 4 },
  videoPreviewBox:   { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  videoPreviewLabel: { color: "rgba(255,255,255,0.6)", fontSize: 14 },
  openPlayerBtn:     { backgroundColor: "#FFD700", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  openPlayerTxt:     { color: "#000", fontWeight: "700", fontSize: 14 },
});
