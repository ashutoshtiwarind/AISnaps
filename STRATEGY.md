# AISnaps — Product Strategy

> Status: v0 draft for cross-functional review (SPM, ML, TL, Designer). Owner: SPM.
> Last updated: 2026-06-15.

## 1. Positioning call

AISnaps repositions from a **photography coaching app** to **"Your AI photographer"** — an app that coaches you live to take a great *real* photo of yourself, then gives you a shareable photo score.

Why the pivot:

- "Learn better composition" is a growth need (top of Maslow). Growth needs don't go viral — nobody screenshots a tutorial.
- Generic real-time camera coaching is now crowded **and** bundled free by a giant (Google Pixel 10 Camera Coach, plus WayShot, Cam AI, Acamera). Entering it head-on fails the "100 tried + giant gives it away free" test.
- We keep the tech (real-time camera, overlays, CV) and point it at a deficiency need (esteem / belonging) with a shareable artifact.

## 2. Market findings

- **AI photo *generation* is saturated + has an authenticity backlash.** TinderProfile, Aragon, Lift, TruShot, Photo AI generate fake photos. Counter-movement is loud: "authentic beats overdone," "doesn't change who you are." Users burned showing up looking nothing like their AI photos.
- **Primal pain: "It's not you, it's your photos."** People can't take a good photo of themselves; no third person to shoot them. Esteem + belonging (Maslow tier 3–4). Umax mined this with face rating alone (~100k iOS installs / ~$200k/mo).
- **Open gap:** nobody owns *an AI that makes you look great in your OWN real photo, live, then gives a shareable score.* Real, not generated. Coached in the moment.

## 3. The concept

Point camera at yourself (or hand to a friend). AI directs live — "turn 30° left, phone to eye level, chin down" — fires shutter at peak frame, then drops a **photo score** with before/after glow-up.

| | Umax | AI photo generators | AISnaps (proposed) |
|---|---|---|---|
| Artifact | Face rating (static) | Fake photos | Real photo + improvable score |
| Feeling | "You're a 6, can't fix it" | "Looks fake on the date" | "6 → 9, you did it" |
| Retention | One-shot, churns | One purchase | Repeatable glow-up loop |
| Shareable | Yes (score) | Weak (fake) | Yes (before/after + score) |
| Authentic | n/a | No — backlash | Yes — the wedge |

- 3-word pitch: **"Snap. Score. Glow."** / **"Your AI photographer."**
- "Did you hear about" moment: *"the app that coaches you live to take a hot photo and scores it?"*

### Product + ethics guardrail

Score the **PHOTO** (lighting, angle, composition, expression) — **not the FACE**. Face-rating is the Umax trap: dead-end feeling, ethically ugly, not improvable. Photo-score is improvable = dopamine + retention + defensible.

## 4. Models / datasets

- **MediaPipe Pose** (33 landmarks) + **Face Landmarker** — on-device, real-time, free. Drives live posing/framing direction.
- **NIMA** (Neural Image Assessment, Google), trained on **AVA dataset** (~250k rated photos) — aesthetic + technical scoring = the score. Fine-tune for portraits/selfies.
- **Claude vision (Sonnet 4.6 / Opus 4.8)** — cloud, generates natural-language coaching cue + "why your score went up" copy.
- Saliency / rule-of-thirds / horizon detection — composition overlays (scaffolding exists).

Split: **on-device CV** for the real-time loop (privacy, latency, no per-frame cloud cost); **cloud Claude** for richer coaching narration + score explanation, async.

## 5. Phased plan

- **Phase 0 — Validate (1 wk, before building):** 5 fake TikToks of the glow-up loop. Measure hook retention. Prove content before code.
- **Phase 1 — Core loop MVP:** live pose/framing direction → auto-capture → NIMA score → before/after card. One button.
- **Phase 2 — Shareable artifact:** branded score card + before/after export tuned for TikTok/IG.
- **Phase 3 — Retention:** daily streak, "beat your best score," angle library.
- **Phase 4 — Monetize:** Superwall paywall on score history / pro coaching.

Web demo path stays as the safe no-hardware demo — unchanged.

## 6. Open questions

- **ML:** NIMA accuracy on selfies/portraits out-of-box vs fine-tune on a portrait subset? On-device pose→cue loop <100ms/frame on mid-range Android?
- **TL:** On-device (MediaPipe TFLite) vs cloud per-frame — confirm hybrid. Expo/RN real-time frame processing via `react-native-vision-camera` frame processors?
- **Designer:** The 3-second score reveal — the whole viral artifact. Before/after card design?
- **All:** Accept pivot from "photography coaching" to "AI photographer + photo score"?

## 7. Sources

- [Pixel 10 Camera Coach](https://www.androidpolice.com/what-is-camera-coach-on-the-pixel-10/)
- [WayShot launch](https://www.globenewswire.com/news-release/2025/12/26/3210516/0/en/wayshot-launches-the-world-s-first-ai-photography-app-with-real-time-coaching-and-creative-assistance-redefining-how-people-take-photos.html)
- [Cam AI](https://apps.apple.com/us/app/cam-ai-photography-coach/id6749136949)
- [TruShot — 11 AI dating photo tools](https://trushot.app/blog/best-ai-dating-photo-generators)
- [SwipeHelper](https://swipehelper.app/)
- [It's not you, it's your photos](https://optimizeddating.substack.com/p/its-not-you-its-your-photos)
- [Umax on Sensor Tower](https://app.sensortower.com/overview/6471026798?os=ios)
- [MediaPipe](https://mediapipe.org/)
