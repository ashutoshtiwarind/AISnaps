# Spikes

Throwaway investigations that gate Phase 1 estimates. See [../SOLUTIONING.md](../SOLUTIONING.md).

## SP-1 — Frame-processor plugin viability (TL)

Prereqs (already scaffolded on `strategy-ai-photographer`):

- `react-native-vision-camera` 4.6.4 + `react-native-worklets` 0.5.1 in deps.
- vision-camera config plugin added to `app.json` (camera + mic permission, `enableFrameProcessors: true`).

Run:

```bash
npx expo prebuild --clean       # generates native projects (not Expo Go)
npx expo run:android            # on a physical mid Android (Pixel 6a / mid Samsung)
npx expo run:ios                # on a physical iPhone
```

Then wire a MediaPipe Pose + Face Landmarker frame-processor plugin (community first,
custom native fallback) and log per-frame inference time.

Record in SOLUTIONING.md §SP-1:

- fps + ms/frame on each device
- blendshapes available? (needed for auto-capture, D-4)
- community plugin vs custom native plugin decision + effort estimate

Success: ≥15fps, <100ms/frame, blendshapes available.

## SP-2 — Score credibility (ML)

```bash
cd spikes
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python sp2_score_credibility.py                     # or open as notebook (# %% cells)
```

Drop inputs in `spikes/data/`:

- `selfies/` — ~50 real selfies (good/bad spread).
- `labels.csv` — columns: `filename,human_score` (1–10, averaged across 2–3 raters).

NIMA weights (optional — heuristics run without them; enables the NIMA blend term):

- Download `mobilenet_aesthetic_0.07.hdf5` from
  [idealo/image-quality-assessment](https://github.com/idealo/image-quality-assessment).
- Place at `spikes/models/mobilenet_aesthetic.hdf5` (or set `NIMA_WEIGHTS` env var).
- `models/` is gitignored — weights are large, not committed.

Output: per-image score table + Spearman correlation (NIMA-alone vs blend) vs human.

Success: blend Spearman rho >= 0.6. If it fails, escalate to earlier NIMA fine-tune.

## SP-3 — Claude narration cost/latency (ML + TL)

```bash
cd spikes
pip install -r requirements.txt
export ANTHROPIC_API_KEY=...        # Windows: $env:ANTHROPIC_API_KEY="..."
python sp3_narration_cost.py --frame data/sample_frame.jpg --n 10
```

Measures the narration loop (downscaled frame + metrics -> one short cue):
round-trip latency + per-call/per-session/projected cost on `claude-sonnet-4-6`.
Fast reflex cue config: thinking disabled, effort low, max_tokens 256, system
prompt cached. Without `ANTHROPIC_API_KEY` it runs DRY-RUN (cost projection from
estimated tokens, no latency).

Tune `CALLS_PER_SESSION` / `SESSIONS_PER_DAU` / `DAU` at the top of the script
to your throttle + scale assumptions. Throttle is the cost lever (D-5).

> `data/` is gitignored — do not commit selfies (PII).
