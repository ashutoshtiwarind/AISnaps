"""
SP-3 — Claude narration cost + latency harness.

Question: what is the round-trip latency and per-session cost of the narration
loop (downscaled frame + computed metrics -> one short imperative cue), at the
throttle we plan to ship? (see SOLUTIONING.md §SP-3)

This is NOT the hot loop. The hot loop is rule-based + on-device (C-1). The
narration loop is a throttled cloud call (D-5): <=1 call / 1-2s, or on state
change. SP-3 sizes its latency and cost.

Model: claude-sonnet-4-6 (per SOLUTIONING.md §4). Fast reflex cue, not reasoning:
thinking disabled + effort low + small max_tokens. Vision input kept tiny by
downscaling the frame hard (cost scales with W*H).

Run:
  pip install -r requirements.txt
  export ANTHROPIC_API_KEY=...        # Windows: $env:ANTHROPIC_API_KEY="..."
  python sp3_narration_cost.py --frame data/sample_frame.jpg --n 10

Without an API key it runs in DRY-RUN: projects cost from estimated token
counts, skips live latency.
"""

# %% imports + config
import argparse
import base64
import os
import statistics
import time
from pathlib import Path

MODEL = "claude-sonnet-4-6"

# Sonnet 4.6 pricing, USD per 1M tokens (claude-api skill, cached 2026-06-04).
PRICE_IN = 3.00
PRICE_OUT = 15.00
PRICE_CACHE_READ = 0.30   # ~0.1x input
PRICE_CACHE_WRITE = 3.75  # 1.25x input (5-min TTL)

# Throttle + scale assumptions (tune to taste; this is what SP-3 sizes).
CALLS_PER_SESSION = 8     # ~1 cue/1-2s over a short shoot, throttled (D-5)
SESSIONS_PER_DAU = 3      # avg shoots per active user per day
DAU = 50_000              # projection target

# Stable system prompt -> cache_control so it bills at cache-read after call 1.
SYSTEM = (
    "You are a photo-coaching cue engine. Given a downscaled selfie frame and "
    "computed framing metrics, return ONE short imperative cue (max 8 words) "
    "telling the person how to improve the shot right now. No preamble, no "
    "explanation. Examples: 'Lift the phone to eye level.' 'Turn 30 degrees "
    "left.' 'Soften the smile, drop your shoulder.'"
)


# %% build the narration request
def build_messages(frame_path: Path | None, metrics: dict) -> list[dict]:
    metrics_text = "Framing metrics: " + ", ".join(f"{k}={v:.2f}" for k, v in metrics.items())
    content: list[dict] = []
    if frame_path and frame_path.exists():
        b64 = base64.standard_b64encode(frame_path.read_bytes()).decode()
        media = "image/png" if frame_path.suffix.lower() == ".png" else "image/jpeg"
        content.append({"type": "image", "source": {"type": "base64", "media_type": media, "data": b64}})
    content.append({"type": "text", "text": metrics_text})
    return [{"role": "user", "content": content}]


# Sample metrics (stand in for the hot loop's output during the spike).
SAMPLE_METRICS = {
    "face_centered": 0.42,
    "rule_of_thirds": 0.61,
    "head_yaw": 0.18,
    "lighting_evenness": 0.55,
}


# %% cost from usage
def call_cost_usd(usage) -> float:
    inp = getattr(usage, "input_tokens", 0)
    out = getattr(usage, "output_tokens", 0)
    cread = getattr(usage, "cache_read_input_tokens", 0) or 0
    cwrite = getattr(usage, "cache_creation_input_tokens", 0) or 0
    return (
        inp * PRICE_IN
        + out * PRICE_OUT
        + cread * PRICE_CACHE_READ
        + cwrite * PRICE_CACHE_WRITE
    ) / 1_000_000


def project(per_call_usd: float) -> None:
    per_session = per_call_usd * CALLS_PER_SESSION
    per_dau_day = per_session * SESSIONS_PER_DAU
    daily = per_dau_day * DAU
    print(f"  per call:            ${per_call_usd:.6f}")
    print(f"  per session ({CALLS_PER_SESSION} calls): ${per_session:.5f}")
    print(f"  per DAU/day ({SESSIONS_PER_DAU} sessions): ${per_dau_day:.5f}")
    print(f"  daily @ {DAU:,} DAU:   ${daily:,.2f}")
    print(f"  monthly:             ${daily * 30:,.2f}")


# %% live measurement
def run_live(frame_path: Path | None, n: int) -> None:
    import anthropic  # noqa: PLC0415

    client = anthropic.Anthropic()
    messages = build_messages(frame_path, SAMPLE_METRICS)
    system = [{"type": "text", "text": SYSTEM, "cache_control": {"type": "ephemeral"}}]

    latencies, costs = [], []
    print(f"Live: {n} calls to {MODEL} (thinking disabled, effort low)...")
    for i in range(n):
        t0 = time.monotonic()
        resp = client.messages.create(
            model=MODEL,
            max_tokens=256,
            thinking={"type": "disabled"},
            output_config={"effort": "low"},
            system=system,
            messages=messages,
        )
        dt = time.monotonic() - t0
        latencies.append(dt)
        costs.append(call_cost_usd(resp.usage))
        cue = next((b.text for b in resp.content if b.type == "text"), "")
        print(f"  [{i+1}] {dt*1000:.0f}ms  cue={cue!r}")

    print("\nLatency (round-trip):")
    print(f"  p50 {statistics.median(latencies)*1000:.0f}ms  "
          f"min {min(latencies)*1000:.0f}ms  max {max(latencies)*1000:.0f}ms")
    print("\nCost (steady-state, system prompt cached after call 1):")
    project(statistics.median(costs[1:]) if len(costs) > 1 else costs[0])


# %% dry run (no API key) — project from estimated token counts
def run_dry(frame_path: Path | None) -> None:
    # Estimates: system ~80 tok, metrics ~25 tok, output ~12 tok.
    # Vision ~ (W*H)/750; downscaled 512x384 frame ~= 262 tok. Assume frame present.
    sys_tok, metrics_tok, img_tok, out_tok = 80, 25, 262, 12
    # Steady state: system served from cache (~0.1x), rest full input.
    per_call = (
        sys_tok * PRICE_CACHE_READ
        + (metrics_tok + img_tok) * PRICE_IN
        + out_tok * PRICE_OUT
    ) / 1_000_000
    print("DRY-RUN (no ANTHROPIC_API_KEY) — projecting from estimated tokens.")
    print(f"  est tokens: system={sys_tok}(cached) metrics={metrics_tok} "
          f"image~{img_tok} output={out_tok}")
    print("  (set ANTHROPIC_API_KEY for real latency + token counts)\n")
    project(per_call)


# %% main
def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--frame", type=Path, default=None, help="downscaled selfie frame (jpg/png)")
    ap.add_argument("--n", type=int, default=10, help="live calls to measure")
    args = ap.parse_args()

    if os.environ.get("ANTHROPIC_API_KEY"):
        run_live(args.frame, args.n)
    else:
        run_dry(args.frame)


if __name__ == "__main__":
    main()
