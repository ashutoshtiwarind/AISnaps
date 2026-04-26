// useAICoach.ts
// All AI logic lives here — swap internals with real ML Kit later without touching HomeScreen

import { SCRIPTS } from "@/scripts/scripts";
import { useEffect, useRef, useState } from "react";

interface Props {
  scriptIndex: number;
  autoEnabled: boolean;
  threshold: number;
  enabled: boolean;
}

interface Return {
  score: number;
  tip: string;
  scoreColor: string;
  autoFire: boolean;
}

function getScoreColor(s: number): string {
  if (s >= 85) return "#4ADE80"; // green
  if (s >= 65) return "#FFD700"; // amber
  return "#F87171";              // red
}

export function useAICoach({ scriptIndex, autoEnabled, threshold, enabled }: Props): Return {
  const [score, setScore] = useState(68);
  const [tip, setTip] = useState(SCRIPTS[0].tips[0]);
  const [autoFire, setAutoFire] = useState(false);

  const targetRef = useRef(68);
  const scoreRef = useRef(68);
  const tipIdxRef = useRef(0);
  const autoFiredRef = useRef(false);

  // Reset when script changes or AI mode turns on
  useEffect(() => {
    if (!enabled) return;
    tipIdxRef.current = 0;
    setTip(SCRIPTS[scriptIndex].tips[0]);
    targetRef.current = 55 + Math.floor(Math.random() * 35);
    autoFiredRef.current = false;
  }, [enabled, scriptIndex]);

  // Score animation loop — only runs when AI mode is on
  useEffect(() => {
    if (!enabled) {
      setScore(0);
      setAutoFire(false);
      return;
    }

    let animFrame: number;

    const tick = () => {
      const diff = targetRef.current - scoreRef.current;
      const rounded = Math.round((scoreRef.current + diff * 0.04) * 10) / 10;
      scoreRef.current = rounded;
      setScore(rounded);

      if (rounded < threshold) {
        autoFiredRef.current = false;
      }

      if (autoEnabled && rounded >= threshold && !autoFiredRef.current) {
        autoFiredRef.current = true;
        setAutoFire(true);
        targetRef.current = Math.max(30, threshold - 20 - Math.floor(Math.random() * 15));
        setTimeout(() => setAutoFire(false), 2000);
      }

      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [enabled, autoEnabled, threshold]);

  // Tip cycling — only runs when AI mode is on
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const tips = SCRIPTS[scriptIndex].tips;
      tipIdxRef.current = (tipIdxRef.current + 1) % tips.length;
      setTip(tips[tipIdxRef.current]);
      targetRef.current = 50 + Math.floor(Math.random() * 45);
    }, 4000);

    return () => clearInterval(interval);
  }, [enabled, scriptIndex]);

  return {
    score,
    tip,
    scoreColor: getScoreColor(score),
    autoFire,
  };
}

/*
 * ─────────────────────────────────────────────────────────────────
 * PHASE 1 UPGRADE — Replace simulated score with real ML Kit
 * ─────────────────────────────────────────────────────────────────
 *
 * 1. Install:
 *    npm install @react-native-ml-kit/face-detection
 *
 * 2. Replace the score animation useEffect with this:
 *
 *    import { useFaceDetector } from "@react-native-ml-kit/face-detection";
 *    import { useFrameProcessor, runOnJS } from "react-native-vision-camera";
 *
 *    const { detectFaces } = useFaceDetector();
 *
 *    const frameProcessor = useFrameProcessor((frame) => {
 *      "worklet";
 *      const faces = detectFaces(frame);
 *      if (faces.length > 0) {
 *        const face = faces[0];
 *        const cx = face.frame.x + face.frame.width / 2;
 *        const cy = face.frame.y + face.frame.height / 2;
 *
 *        // Rule-of-thirds intersection points
 *        const thirdX = [frame.width / 3, (frame.width / 3) * 2];
 *        const thirdY = [frame.height / 3, (frame.height / 3) * 2];
 *
 *        const dx = Math.min(...thirdX.map((x) => Math.abs(cx - x)));
 *        const dy = Math.min(...thirdY.map((y) => Math.abs(cy - y)));
 *        const maxDist = Math.sqrt((frame.width / 3) ** 2 + (frame.height / 3) ** 2);
 *        const dist = Math.sqrt(dx ** 2 + dy ** 2);
 *
 *        const compositionScore = Math.round((1 - dist / maxDist) * 100);
 *        runOnJS(setScore)(compositionScore);
 *      }
 *    }, []);
 *
 * 3. Pass to Camera component in HomeScreen:
 *    <Camera frameProcessor={frameProcessor} ... />
 *
 * ─────────────────────────────────────────────────────────────────
 */