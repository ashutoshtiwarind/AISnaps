# AISnaps — Solutioning (Phase 1 Core Loop)

> Technical solutioning for the core loop. Inputs: SPM, ML, TL. Owner: TL.
> Strategy: [STRATEGY.md](STRATEGY.md). Work items: [BACKLOG.md](BACKLOG.md).
> Last updated: 2026-06-15.

## The loop

Point → live direction → auto-capture at peak → instant score → before/after. Everything else is out of Phase 1. The 3-second demo is the **score reveal**.

Hard constraints:

- **Photo score, not face score** — improvable (retention + ethics). Score lighting/angle/composition/expression, never "your face is a 6".
- **Real photo, not generated** — the wedge vs the saturated generator market. Never synthesize pixels.

## Architecture — three loops, three cadences

Do not put one model in the hot path. Split:

1. **Hot loop — on-device, ~15fps, rule-based.** `react-native-vision-camera` v4 frame processor (worklets) → MediaPipe Pose Landmarker + Face Landmarker → geometry (face centered? rule-of-thirds? headroom? horizon level? yaw/pitch?). Directional cue ("phone up", "turn left") is pure geometry — no inference, instant. Makes it feel alive.
2. **Narration loop — cloud Claude vision, throttled (~1 call / 1–2s or on state change).** Downscaled frame + computed metrics → Claude returns one short qualitative cue ("soften the smile, drop your shoulder"). The "vibe" coach, not the tight loop. Throttle hard for cost + latency.
3. **Score — once per capture.** NIMA on captured frame. Burst 3 at peak, pick highest.

Expo reality: vision-camera + MediaPipe frame-processor plugin needs a **dev build (prebuild/config plugin)** — not Expo Go (already true for vision-camera). MediaPipe Tasks frame-processor plugin likely needs a **custom native plugin** → TL spike before Phase 1 estimates.

## Models

- **Pose:** MediaPipe Pose Landmarker Lite (TFLite, 33 landmarks) — real-time on mid Android.
- **Face:** MediaPipe Face Landmarker with **blendshapes** — smile, eye-open, head yaw/pitch/roll directly. Drives expression cue **and** auto-capture trigger.
- **Score:** NIMA (MobileNet backbone, TFLite) pretrained on AVA (~250k rated photos). On-device, fast, free per inference.
- **Claude vision (Sonnet 4.6):** narration loop only. Input = downscaled frame + metrics, output = one imperative sentence. Not in hot path.

### Score risk

AVA aesthetics ≠ good selfie/dating photo. NIMA rates landscapes/art; may not reward eye contact, face lighting, background declutter. Phase 1: **blend NIMA with portrait heuristics we control** — face sharpness, lighting evenness (face-region histogram), eye contact, rule-of-thirds on face, background clutter. Collect our own labeled portrait data; fine-tune NIMA later (Phase 3+).

## Decisions

| # | Decision | Owner |
|---|----------|-------|
| D-1 | Three-loop split: rule-based hot loop, throttled Claude narration, per-capture score | TL |
| D-2 | Live directional cue = pure geometry from landmarks (no inference in hot path) | TL + ML |
| D-3 | Score = NIMA blended with portrait heuristics; photo not face | ML |
| D-4 | Auto-capture trigger = blendshapes (eyes/smile) + low motion + framing threshold → burst 3 → best NIMA | ML + TL |
| D-5 | Claude narration throttled ≤1 call / 1–2s, downscaled frame + metrics | ML + TL |
| D-6 | Dev build required (config plugin); not Expo Go | TL |

## Spikes (gate Phase 1 estimates)

SP-1 and SP-2 run in parallel (different owners, no dependency). Both gate Phase 1 estimates. SP-3 runs after, since narration is not the hot path.

### SP-1 — Frame-processor plugin viability (TL, timebox 3d)

Question: can MediaPipe Pose + Face Landmarker run as a vision-camera frame processor in an Expo dev build at usable latency on mid Android?

Steps:
1. `expo prebuild` → dev build (vision-camera already needs this).
2. Community plugin first: vision-camera v4 + `react-native-worklets-core` + a MediaPipe frame-processor plugin. Fall back to custom native plugin if none works on v4.
3. Enable Face Landmarker **blendshapes** (eyes-open/smile/yaw for D-4).
4. Log per-frame inference time on mid Android (Pixel 6a / mid Samsung) + iPhone.

Success criteria:
- Pose + Face landmarks ≥15fps, hot-loop budget <100ms/frame.
- Blendshapes available in the frame processor.
- Decision recorded: community vs custom native plugin (+ effort estimate).

Deliverable: throwaway branch + latency numbers + go/no-go note here.

### SP-2 — Score credibility (ML, timebox 4d)

Question: does NIMA blended with heuristics track human "good photo" judgment on real selfies?

Steps:
1. Gather ~50 real selfies spanning good/bad (lighting, angle, blur, clutter, eye contact).
2. Human-label 1–10 (2–3 raters, average).
3. Run baseline NIMA (AVA) score.
4. Compute heuristics: face sharpness, face-region lighting evenness, eye contact, rule-of-thirds on face, background clutter.
5. Fit simple blend (weighted sum / small linear model) → score.
6. Correlate NIMA-alone vs blend against human labels (Spearman).

Success criteria:
- Blend Spearman ρ ≥ 0.6 vs human (NIMA-alone expected lower — the point).
- Clear weight recommendation for Phase 1.
- If blend fails → escalate: fine-tune NIMA on portrait data earlier than Phase 3.

Deliverable: notebook + correlation table + recommended blend weights here.

### SP-3 — Claude narration cost/latency (ML+TL, after SP-1/SP-2)

Claude narration round-trip latency + cost per session at throttle. Throttle is the cost lever; may drop to on-state-change only.

## Open risks

- NIMA portrait alignment (SP-2 gates score credibility).
- Frame-processor plugin effort unknown until SP-1.
- Claude cost at scale — throttle is the lever; may drop to on-state-change only.
