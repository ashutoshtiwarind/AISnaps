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

- **SP-1 (TL):** MediaPipe Tasks as vision-camera frame-processor plugin in Expo dev build — community plugin or custom native plugin? Measure hot-loop latency on mid Android.
- **SP-2 (ML):** NIMA-vs-heuristic blend on ~50 real selfies — does blended score track human "good photo" judgment? Gates score credibility.
- **SP-3 (ML+TL):** Claude narration round-trip latency + cost per session at throttle.

## Open risks

- NIMA portrait alignment (SP-2 gates score credibility).
- Frame-processor plugin effort unknown until SP-1.
- Claude cost at scale — throttle is the lever; may drop to on-state-change only.
