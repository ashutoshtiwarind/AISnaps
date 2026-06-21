# AISnaps — Backlog

> Single source of work items. Grouped by strategy phase (see [STRATEGY.md](STRATEGY.md)).
> Status: `todo` | `in-progress` | `blocked` | `done`. Owner: SPM / ML / TL / Designer.
> Last updated: 2026-06-15.

## Phase 0 — Validate (before building)

| ID | Item | Owner | Status | Notes |
|----|------|-------|--------|-------|
| V-1 | Cut 5 fake TikToks of the glow-up loop (mockup) | SPM + Designer | todo | Prove content/hook before code |
| V-2 | Measure hook retention on the 5 cuts | SPM | todo | Go/no-go gate for Phase 1 |
| V-3 | Cross-functional sign-off on pivot (coaching → AI photographer + score) | All | todo | Blocks roadmap rewrite |

## Spikes — gate Phase 1 estimates (see [SOLUTIONING.md](SOLUTIONING.md))

| ID | Item | Owner | Status | Notes |
|----|------|-------|--------|-------|
> Status: all three spikes are **code-ready on main**; remaining work is execution with real devices / data / keys. Picking back up later.

| SP-1 | MediaPipe Tasks as vision-camera frame-processor plugin in Expo dev build | TL | todo | vision-camera plugin scaffolded (T-6). Run on physical mid Android to measure hot-loop latency; decide community vs custom native plugin |
| SP-2 | NIMA-vs-heuristic blend on ~50 real selfies | ML | todo | Script + NIMA loader ready (`spikes/sp2_score_credibility.py`). Needs ~50 selfies + `labels.csv` to run; gates score credibility |
| SP-2a | Wire NIMA loader (TF + AVA weights) into `spikes/sp2_score_credibility.py` | ML | done | NIMA loader wired (graceful NaN fallback); enable with downloaded weights |
| SP-3 | Claude narration round-trip latency + cost per session at throttle | ML + TL | todo | Harness ready (`spikes/sp3_narration_cost.py`). Needs `ANTHROPIC_API_KEY` + real frame to run live; DRY-RUN works now |

## Phase 1 — Core loop MVP

> Design decisions D-1…D-6 in [SOLUTIONING.md](SOLUTIONING.md). Architecture: three loops (rule-based hot loop, throttled Claude narration, per-capture score).

| ID | Item | Owner | Status | Notes |
|----|------|-------|--------|-------|
| C-1 | Hot loop: pose/face landmarks → geometry → directional cue (rule-based, on-device) | ML + TL | todo | D-1, D-2; ~15fps, no inference in hot path |
| C-2 | Auto-capture at peak frame | TL | todo | D-4; blendshapes (eyes/smile) + low motion + framing → burst 3 → best NIMA |
| C-3 | Score: NIMA blended with portrait heuristics | ML | in-progress | Blend module built (`lib/photoScore.ts`, mirrors SP-2 weights). Real metrics gated by C-1/SP-1; NIMA optional |
| C-4 | Before/after result card | Designer + TL | in-progress | `components/ScoreCard.tsx` built + wired: web demo runs the glow-up loop; native uses real photo + mock metrics until C-1 |
| C-5 | Single-button capture UX | Designer + TL | in-progress | Web shutter triggers the reveal; one-button flow in place |
| C-6 | Claude vision narration loop (throttled) | ML | todo | D-5; ≤1 call / 1–2s, downscaled frame + metrics |

## Phase 2 — Shareable artifact

| ID | Item | Owner | Status | Notes |
|----|------|-------|--------|-------|
| S-1 | Branded score card | Designer | in-progress | Wordmark + handle watermark on ScoreCard; screenshot-worthy. Dedicated 9:16/1:1 export layout folded into S-2 |
| S-2 | Before/after image export tuned for TikTok/IG | TL + Designer | todo | Rasterize card → image (react-native-view-shot) at 9:16 / 1:1; needs dev build to verify |
| S-3 | Share flow (native share sheet) | TL | in-progress | `lib/share.ts` wired: web navigator.share + clipboard fallback, native built-in Share (text+link). No new deps |

## Phase 3 — Retention

| ID | Item | Owner | Status | Notes |
|----|------|-------|--------|-------|
| R-1 | Daily streak | TL | todo | |
| R-2 | "Beat your best score" | TL + Designer | todo | |
| R-3 | Angle/pose library | Designer + ML | todo | |

## Phase 4 — Monetize

| ID | Item | Owner | Status | Notes |
|----|------|-------|--------|-------|
| M-1 | Superwall paywall on score history / pro coaching | TL | todo | |

## Tech debt / platform (carried from prior roadmap)

| ID | Item | Owner | Status | Notes |
|----|------|-------|--------|-------|
| T-1 | Keep web demo separate from native camera logic | TL | in-progress | Web stays mock-camera demo |
| T-2 | Align Expo dependency versions | TL | todo | |
| T-3 | Permission + runtime error handling | TL | todo | Camera; mic deferred (photo-first) |
| T-4 | Confirm on-device vs cloud per-frame split | ML + TL | todo | Hybrid; see STRATEGY §4 |
| T-5 | Migrate capture path expo-camera → vision-camera | TL | todo | Hot loop (C-1) needs frame processors; expo-camera can't. Gated by SP-1 |
| T-6 | vision-camera config plugin in app.json | TL | done | Camera permission + frame processors; mic disabled for Phase 1 |
