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

## Phase 1 — Core loop MVP

| ID | Item | Owner | Status | Notes |
|----|------|-------|--------|-------|
| C-1 | Live pose/framing direction (MediaPipe Pose + Face Landmarker) | ML + TL | todo | On-device, <100ms/frame target |
| C-2 | Auto-capture at peak frame | TL | todo | Trigger off pose/expression state |
| C-3 | NIMA photo score integration | ML | todo | Validate on selfies/portraits; fine-tune if needed |
| C-4 | Before/after result card | Designer + TL | todo | Score the photo, not the face |
| C-5 | Single-button capture UX | Designer + TL | todo | Minimize cognitive load |
| C-6 | Claude vision coaching-cue generation | ML | todo | Cloud, async; natural-language tips |

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
