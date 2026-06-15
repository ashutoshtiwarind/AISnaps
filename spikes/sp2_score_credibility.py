"""
SP-2 — Score credibility spike.

Question: does NIMA blended with portrait heuristics track human "good photo"
judgment on real selfies? (gates score credibility for Phase 1; see SOLUTIONING.md)

Notebook-style: run top to bottom, or step through the `# %%` cells in VSCode/Jupyter.

Inputs (place in spikes/data/, gitignored):
  - selfies/        ~50 real selfies, good/bad spread
  - labels.csv      columns: filename,human_score   (1-10, averaged 2-3 raters)

Output:
  - per-image table: human_score, nima, heuristics, blend
  - Spearman correlation: nima-alone vs blend, against human_score
  - recommended blend weights

Success: blend Spearman rho >= 0.6 (nima-alone expected lower — that's the point).
If blend fails too: escalate to earlier NIMA fine-tune on portrait data.
"""

# %% imports + config
from pathlib import Path

import cv2
import numpy as np
import pandas as pd
from scipy.stats import spearmanr

DATA_DIR = Path(__file__).parent / "data"
SELFIES_DIR = DATA_DIR / "selfies"
LABELS_CSV = DATA_DIR / "labels.csv"

# Heuristic blend weights — starting guess; SP-2 tunes these against human labels.
WEIGHTS = {
    "nima": 0.40,
    "face_sharpness": 0.15,
    "lighting_evenness": 0.15,
    "frontal_pose": 0.10,   # proxy for eye contact (see note in compute_frontal_pose)
    "rule_of_thirds": 0.10,
    "background_clean": 0.10,
}


# %% mediapipe face detection / landmarks (face crop + pose)
import mediapipe as mp

_mp_face_detection = mp.solutions.face_detection
_mp_face_mesh = mp.solutions.face_mesh


def detect_face_bbox(img_bgr):
    """Return (x, y, w, h) face bbox in pixels, or None."""
    h, w = img_bgr.shape[:2]
    rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    with _mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5) as fd:
        res = fd.process(rgb)
        if not res.detections:
            return None
        # largest detection
        best = max(res.detections, key=lambda d: d.location_data.relative_bounding_box.width)
        box = best.location_data.relative_bounding_box
        return (
            max(int(box.xmin * w), 0),
            max(int(box.ymin * h), 0),
            int(box.width * w),
            int(box.height * h),
        )


# %% heuristic: face sharpness (variance of Laplacian on face crop)
def compute_face_sharpness(img_bgr, bbox):
    x, y, fw, fh = bbox
    crop = img_bgr[y : y + fh, x : x + fw]
    if crop.size == 0:
        return 0.0
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    var = cv2.Laplacian(gray, cv2.CV_64F).var()
    # normalize: ~0 (blurry) .. ~1 (sharp); 500 is a rough sharp threshold, tune in SP-2
    return float(np.clip(var / 500.0, 0.0, 1.0))


# %% heuristic: lighting evenness (face-region luminance spread)
def compute_lighting_evenness(img_bgr, bbox):
    x, y, fw, fh = bbox
    crop = img_bgr[y : y + fh, x : x + fw]
    if crop.size == 0:
        return 0.0
    lum = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY).astype(np.float32)
    mean = lum.mean()
    std = lum.std()
    # penalize too-dark/too-bright (mean far from mid) and harsh shadow (high std)
    exposure = 1.0 - abs(mean - 128.0) / 128.0
    evenness = 1.0 - np.clip(std / 80.0, 0.0, 1.0)
    return float(np.clip(0.5 * exposure + 0.5 * evenness, 0.0, 1.0))


# %% heuristic: frontal pose (proxy for eye contact)
def compute_frontal_pose(img_bgr, bbox):
    """
    NOTE: true gaze/eye-contact is hard. Proxy = head near-frontal via eye-symmetry
    from FaceMesh landmarks. Flag this approximation in the SP-2 writeup; if it
    correlates poorly, swap for a gaze model.
    """
    h, w = img_bgr.shape[:2]
    rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    with _mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1) as fm:
        res = fm.process(rgb)
        if not res.multi_face_landmarks:
            return 0.0
        lm = res.multi_face_landmarks[0].landmark
        # outer eye corners (33 left, 263 right) and nose tip (1)
        left_eye = np.array([lm[33].x * w, lm[33].y * h])
        right_eye = np.array([lm[263].x * w, lm[263].y * h])
        nose = np.array([lm[1].x * w, lm[1].y * h])
        eye_mid = (left_eye + right_eye) / 2.0
        eye_dist = np.linalg.norm(right_eye - left_eye) + 1e-6
        # nose horizontal offset from eye midpoint -> yaw proxy
        yaw_proxy = abs(nose[0] - eye_mid[0]) / eye_dist
        return float(np.clip(1.0 - yaw_proxy * 2.0, 0.0, 1.0))


# %% heuristic: rule-of-thirds on face center
def compute_rule_of_thirds(img_bgr, bbox):
    h, w = img_bgr.shape[:2]
    x, y, fw, fh = bbox
    cx, cy = (x + fw / 2.0) / w, (y + fh / 2.0) / h
    thirds = [1 / 3, 2 / 3]
    intersections = [(tx, ty) for tx in thirds for ty in thirds]
    dist = min(np.hypot(cx - ix, cy - iy) for ix, iy in intersections)
    # also reward centered framing as acceptable; closer to a third-point = higher
    return float(np.clip(1.0 - dist / 0.4, 0.0, 1.0))


# %% heuristic: background cleanliness (edge density outside face)
def compute_background_clean(img_bgr, bbox):
    h, w = img_bgr.shape[:2]
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 100, 200)
    mask = np.ones((h, w), dtype=bool)
    x, y, fw, fh = bbox
    mask[y : y + fh, x : x + fw] = False  # exclude face region
    bg_edges = edges[mask]
    if bg_edges.size == 0:
        return 0.5
    clutter = bg_edges.mean() / 255.0
    return float(np.clip(1.0 - clutter * 5.0, 0.0, 1.0))


# %% NIMA aesthetic score (TF/Keras MobileNet, AVA-trained)
#
# Path chosen for SP-2a: idealo image-quality-assessment NIMA.
#   Architecture: MobileNet(include_top=False, pooling='avg') -> Dropout -> Dense(10, softmax).
#   Output = probability over buckets 1..10; mean = sum(i * p_i) is the aesthetic score.
#   Weights (AVA-trained) download once, not committed (PII-free but large):
#     spikes/models/mobilenet_aesthetic.hdf5  (or set NIMA_WEIGHTS env var)
#   Source weights: github.com/idealo/image-quality-assessment (mobilenet_aesthetic_0.07.hdf5)
#
# If TensorFlow or the weights are missing, compute_nima returns NaN so the blend
# falls back to heuristics-only and we still get a (partial) correlation.

import os

NIMA_WEIGHTS = Path(os.environ.get("NIMA_WEIGHTS", Path(__file__).parent / "models" / "mobilenet_aesthetic.hdf5"))

_nima_model = None        # lazy singleton
_nima_unavailable = False  # warn once, then stay quiet


def _load_nima_model():
    global _nima_model, _nima_unavailable
    if _nima_model is not None or _nima_unavailable:
        return _nima_model
    try:
        import tensorflow as tf  # noqa: PLC0415 (lazy: keep heuristics runnable without TF)

        base = tf.keras.applications.MobileNet(
            input_shape=(224, 224, 3), include_top=False, pooling="avg", weights=None
        )
        x = tf.keras.layers.Dropout(0.75)(base.output)
        x = tf.keras.layers.Dense(10, activation="softmax")(x)
        model = tf.keras.Model(base.input, x)
        if not NIMA_WEIGHTS.exists():
            raise FileNotFoundError(f"NIMA weights not found at {NIMA_WEIGHTS} (see spikes/README.md)")
        model.load_weights(str(NIMA_WEIGHTS))
        _nima_model = model
    except Exception as e:  # TF missing, weights missing, arch mismatch
        _nima_unavailable = True
        print(f"[nima] disabled, blend will run heuristics-only: {e}")
    return _nima_model


def compute_nima(img_bgr):
    """Mean NIMA aesthetic score normalized to 0..1, or NaN if model unavailable."""
    model = _load_nima_model()
    if model is None:
        return float("nan")
    import tensorflow as tf  # noqa: PLC0415

    rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(rgb, (224, 224)).astype("float32")
    batch = tf.keras.applications.mobilenet.preprocess_input(resized[None, ...])
    probs = model.predict(batch, verbose=0)[0]      # shape (10,), buckets 1..10
    mean_score = float(np.dot(np.arange(1, 11), probs))  # 1..10
    return float(np.clip((mean_score - 1.0) / 9.0, 0.0, 1.0))


# %% score one image
def score_image(path: Path) -> dict:
    img = cv2.imread(str(path))
    if img is None:
        return {"filename": path.name, "error": "unreadable"}
    bbox = detect_face_bbox(img)
    if bbox is None:
        return {"filename": path.name, "error": "no_face"}

    feats = {
        "nima": compute_nima(img),
        "face_sharpness": compute_face_sharpness(img, bbox),
        "lighting_evenness": compute_lighting_evenness(img, bbox),
        "frontal_pose": compute_frontal_pose(img, bbox),
        "rule_of_thirds": compute_rule_of_thirds(img, bbox),
        "background_clean": compute_background_clean(img, bbox),
    }
    # blend ignores NaN NIMA (renormalize weights over present features)
    present = {k: v for k, v in feats.items() if not np.isnan(v)}
    wsum = sum(WEIGHTS[k] for k in present)
    blend = sum(WEIGHTS[k] * present[k] for k in present) / wsum if wsum else float("nan")
    return {"filename": path.name, **feats, "blend_0_1": blend, "blend_1_10": 1 + 9 * blend}


# %% run over dataset + correlate
def main():
    if not SELFIES_DIR.exists():
        raise SystemExit(f"Drop selfies in {SELFIES_DIR} (see spikes/README.md)")
    rows = [score_image(p) for p in sorted(SELFIES_DIR.glob("*")) if p.suffix.lower() in {".jpg", ".jpeg", ".png"}]
    df = pd.DataFrame(rows)

    if LABELS_CSV.exists():
        labels = pd.read_csv(LABELS_CSV)  # filename,human_score
        df = df.merge(labels, on="filename", how="left")
        valid = df.dropna(subset=["human_score", "blend_1_10"])
        if len(valid) >= 3:
            rho_blend, _ = spearmanr(valid["human_score"], valid["blend_1_10"])
            print(f"Spearman (blend vs human):      rho = {rho_blend:.3f}  (target >= 0.6)")
            if valid["nima"].notna().any():
                v2 = valid.dropna(subset=["nima"])
                rho_nima, _ = spearmanr(v2["human_score"], v2["nima"])
                print(f"Spearman (NIMA-alone vs human): rho = {rho_nima:.3f}")
            else:
                print("NIMA not wired yet (compute_nima -> NaN); blend ran on heuristics only.")
        else:
            print("Need >=3 labeled rows to correlate.")
    else:
        print(f"No {LABELS_CSV} yet — scored {len(df)} images on features only.")

    out = DATA_DIR / "sp2_results.csv"
    df.to_csv(out, index=False)
    print(f"Wrote {out}")
    print(df.to_string(index=False))


if __name__ == "__main__":
    main()
