// useAICoach.ts
// All AI logic lives here — swap internals with real ML Kit later without touching HomeScreen

import { SCRIPTS } from "@/scripts/scripts";
import { useEffect, useRef, useState } from "react";

interface Props {
  scriptIndex: number;
  autoEnabled: boolean;
  threshold: number;
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

export function useAICoach({ scriptIndex, autoEnabled, threshold }: Props): Return {
  const [score, setScore] = useState(68);
  const [tip, setTip] = useState(SCRIPTS[0].tips[0]);
  const [autoFire, setAutoFire] = useState(false);

  const targetRef = useRef(68);
  const tipIdxRef = useRef(0);
  const autoFiredRef = useRef(false);

  // Reset when script changes
  useEffect(() => {
    tipIdxRef.current = 0;
    setTip(SCRIPTS[scriptIndex].tips[0]);
    targetRef.current = 55 + Math.floor(Math.random() * 35);
    autoFiredRef.current = false;
  }, [scriptIndex]);

  // Score animation loop — smooth drift toward target
  useEffect(() => {
    let animFrame: number;

    const tick = () => {
      setScore((prev) => {
        const diff = targetRef.current - prev;
        const next = prev + diff * 0.04;
        const rounded = Math.round(next * 10) / 10;

        // Trigger auto-fire once per peak
        if (autoEnabled && rounded >= threshold && !autoFiredRef.current) {
          autoFiredRef.current = true;
          setAutoFire(true);
          setTimeout(() => {
            setAutoFire(false);
            autoFiredRef.current = false;
            // Drop score after auto-fire so it can build up again
            targetRef.current = 50 + Math.floor(Math.random() * 25);
          }, 3000);
        }

        return rounded;
      });
      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [autoEnabled, threshold]);

  // Tip cycling — new tip every 4 seconds, new target score with each tip
  useEffect(() => {
    const interval = setInterval(() => {
      const tips = SCRIPTS[scriptIndex].tips;
      tipIdxRef.current = (tipIdxRef.current + 1) % tips.length;
      setTip(tips[tipIdxRef.current]);
      targetRef.current = 50 + Math.floor(Math.random() * 45);
    }, 4000);

    return () => clearInterval(interval);
  }, [scriptIndex]);

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