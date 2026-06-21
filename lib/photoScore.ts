// photoScore.ts — post-capture photo score (C-3).
//
// Pure, platform-agnostic, deterministic. Takes framing metrics for a captured
// photo and returns an improvable 1-10 score + per-factor breakdown. Scores the
// PHOTO (lighting/angle/composition/expression), never the face — see STRATEGY.md.
//
// The blend mirrors spikes/sp2_score_credibility.py (WEIGHTS), so the on-device
// score and the SP-2 credibility study stay in sync. NIMA is optional: when the
// metric is absent the weight is renormalized over the present factors (same
// NaN-safe behavior as the spike). Real metrics arrive from the hot loop (C-1)
// once SP-1 lands; until then callers can use mockMetrics() for the web demo.

export interface PhotoMetrics {
  faceSharpness: number; // 0..1
  lightingEvenness: number; // 0..1
  frontalPose: number; // 0..1 (eye-contact proxy; see SP-2 note)
  ruleOfThirds: number; // 0..1
  backgroundClean: number; // 0..1
  nima?: number; // 0..1 optional aesthetic (NIMA); omit if unavailable
}

export interface ScoreFactor {
  key: keyof PhotoMetrics;
  label: string;
  value: number; // 0..1
  weight: number; // normalized 0..1 across present factors
}

export interface PhotoScore {
  overall: number; // 1..10 (one decimal)
  overall100: number; // 0..100 (for bars / parity with live coach score)
  factors: ScoreFactor[];
  headline: string;
  color: string;
}

// Keep in sync with WEIGHTS in spikes/sp2_score_credibility.py.
const WEIGHTS: Record<keyof PhotoMetrics, number> = {
  nima: 0.4,
  faceSharpness: 0.15,
  lightingEvenness: 0.15,
  frontalPose: 0.1,
  ruleOfThirds: 0.1,
  backgroundClean: 0.1,
};

const LABELS: Record<keyof PhotoMetrics, string> = {
  nima: "Aesthetic",
  faceSharpness: "Sharpness",
  lightingEvenness: "Lighting",
  frontalPose: "Eye contact",
  ruleOfThirds: "Composition",
  backgroundClean: "Background",
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function headlineFor(overall: number): { text: string; color: string } {
  if (overall >= 8.5) return { text: "Stunning shot", color: "#4ADE80" };
  if (overall >= 7) return { text: "Great photo", color: "#4ADE80" };
  if (overall >= 5.5) return { text: "Solid — small tweaks help", color: "#FFD700" };
  if (overall >= 4) return { text: "Workable, keep adjusting", color: "#FFD700" };
  return { text: "Let's improve this", color: "#F87171" };
}

/** Blend framing metrics into an improvable 1-10 photo score with breakdown. */
export function scorePhoto(metrics: PhotoMetrics): PhotoScore {
  const present = (Object.keys(WEIGHTS) as (keyof PhotoMetrics)[]).filter(
    (k) => typeof metrics[k] === "number" && !Number.isNaN(metrics[k] as number),
  );

  const weightSum = present.reduce((sum, k) => sum + WEIGHTS[k], 0) || 1;

  const factors: ScoreFactor[] = present.map((k) => ({
    key: k,
    label: LABELS[k],
    value: clamp01(metrics[k] as number),
    weight: WEIGHTS[k] / weightSum,
  }));

  const blend = factors.reduce((sum, f) => sum + f.weight * f.value, 0);
  const overall100 = Math.round(blend * 100);
  const overall = Math.round((1 + 9 * blend) * 10) / 10;
  const { text, color } = headlineFor(overall);

  // Strongest improvement lever first (lowest weighted contribution gap).
  factors.sort((a, b) => a.value - b.value);

  return { overall, overall100, factors, headline: text, color };
}

/** The single highest-impact thing to fix next (lowest-scoring factor). */
export function topFix(score: PhotoScore): ScoreFactor | null {
  return score.factors.length ? score.factors[0] : null;
}

// ── Demo helpers (web demo / Phase 0 mockups; not used on real captures) ───────

/** Deterministic-ish mock metrics for the web demo. */
export function mockMetrics(seed = Math.random()): PhotoMetrics {
  const j = (base: number) => clamp01(base + (seed - 0.5) * 0.3);
  return {
    faceSharpness: j(0.7),
    lightingEvenness: j(0.55),
    frontalPose: j(0.6),
    ruleOfThirds: j(0.5),
    backgroundClean: j(0.65),
    nima: j(0.6),
  };
}

/** Simulate a coached "glow-up" — nudge each metric upward for the before/after demo. */
export function improvedMetrics(prev: PhotoMetrics): PhotoMetrics {
  const lift = (n: number | undefined) =>
    n === undefined ? undefined : clamp01(n + 0.15 + Math.random() * 0.15);
  return {
    faceSharpness: lift(prev.faceSharpness)!,
    lightingEvenness: lift(prev.lightingEvenness)!,
    frontalPose: lift(prev.frontalPose)!,
    ruleOfThirds: lift(prev.ruleOfThirds)!,
    backgroundClean: lift(prev.backgroundClean)!,
    nima: lift(prev.nima),
  };
}
