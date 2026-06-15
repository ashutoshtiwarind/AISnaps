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
| SP-1 | MediaPipe Tasks as vision-camera frame-processor plugin in Expo dev build | TL | todo | Community vs custom native plugin; measure hot-loop latency on mid Android |
| SP-2 | NIMA-vs-heuristic blend on ~50 real selfies | ML | todo | Gates score credibility; does blend track human "good photo" judgment? |
| SP-3 | Claude narration round-trip latency + cost per session at throttle | ML + TL | todo | Throttle is the cost lever |

## Phase 1 — Core loop MVP

> Design decisions D-1…D-6 in [SOLUTIONING.md](SOLUTIONING.md). Architecture: three loops (rule-based hot loop, throttled Claude narration, per-capture score).

| ID | Item | Owner | Status | Notes |
|----|------|-------|--------|-------|
| C-1 | Hot loop: pose/face landmarks → geometry → directional cue (rule-based, on-device) | ML + TL | todo | D-1, D-2; ~15fps, no inference in hot path |
| C-2 | Auto-capture at peak frame | TL | todo | D-4; blendshapes (eyes/smile) + low motion + framing → burst 3 → best NIMA |
| C-3 | Score: NIMA blended with portrait heuristics | ML | todo | D-3; photo not face; gated by SP-2 |
| C-4 | Before/after result card | Designer + TL | todo | Score the photo, not the face |
| C-5 | Single-button capture UX | Designer + TL | todo | Minimize cognitive load |
| C-6 | Claude vision narration loop (throttled) | ML | todo | D-5; ≤1 call / 1–2s, downscaled frame + metrics |

## Phase 2 — Shareable artifact

| ID | Item | Owner | Status | Notes |
|----|------|-------|--------|-------|
| S-1 | Branded score card | Designer | todo | The viral artifact |
| S-2 | Before/after export tuned for TikTok/IG | TL + Designer | todo | Aspect ratios, watermark |
| S-3 | Share flow (native share sheet) | TL | todo | |

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
| T-3 | Permission + runtime error handling | TL | todo | Camera + mic |
| T-4 | Confirm on-device vs cloud per-frame split | ML + TL | todo | Hybrid; see STRATEGY §4 |
