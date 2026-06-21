// poses.ts — curated angle/pose library (R-3).
//
// Content that makes the user better: each pose is one imperative cue + the
// "why", tagged to a score factor so the library maps onto the same dimensions
// photoScore.ts grades (composition, eye contact, lighting, background, sharpness).
// Static, platform-agnostic, no deps.

export type PoseCategory =
  | "composition"
  | "eyeContact"
  | "lighting"
  | "background"
  | "sharpness";

export interface Pose {
  id: string;
  title: string;
  cue: string; // the imperative — what to do
  why: string; // why it raises the score
  category: PoseCategory;
}

export const CATEGORY_LABELS: Record<PoseCategory, string> = {
  composition: "Composition",
  eyeContact: "Eye contact",
  lighting: "Lighting",
  background: "Background",
  sharpness: "Sharpness",
};

export const POSES: Pose[] = [
  {
    id: "thirds-face",
    title: "Off-center your face",
    cue: "Put your face on a third-line, not dead center",
    why: "Rule-of-thirds placement reads as intentional, not a snapshot.",
    category: "composition",
  },
  {
    id: "headroom",
    title: "Mind the headroom",
    cue: "Leave a thin strip of space above your head — no more",
    why: "Too much headroom shrinks you; too little feels cramped.",
    category: "composition",
  },
  {
    id: "lead-room",
    title: "Look into the frame",
    cue: "Turn slightly and leave space on the side you face",
    why: "Lead room gives the photo direction and breathing room.",
    category: "composition",
  },
  {
    id: "eye-line",
    title: "Lens at eye level",
    cue: "Raise the phone to your eye line and look straight in",
    why: "Eye-level + direct gaze is the most flattering, engaging angle.",
    category: "eyeContact",
  },
  {
    id: "chin-down",
    title: "Chin slightly down",
    cue: "Drop your chin a touch and push your forehead forward",
    why: "Defines the jaw and avoids the up-the-nose angle.",
    category: "eyeContact",
  },
  {
    id: "soft-smile",
    title: "Soften the smile",
    cue: "Relax the mouth, smile with the eyes",
    why: "A forced grin reads tense; a soft smile reads natural.",
    category: "eyeContact",
  },
  {
    id: "window-light",
    title: "Face a window",
    cue: "Turn toward soft daylight, not away from it",
    why: "Even, frontal light flatters skin and lifts the lighting score.",
    category: "lighting",
  },
  {
    id: "avoid-overhead",
    title: "Avoid overhead light",
    cue: "Step out from under a single ceiling light",
    why: "Top light casts harsh shadows under the eyes and nose.",
    category: "lighting",
  },
  {
    id: "golden-hour",
    title: "Shoot near golden hour",
    cue: "Catch the hour after sunrise or before sunset",
    why: "Low, warm light is soft and even — easiest to look good in.",
    category: "lighting",
  },
  {
    id: "declutter",
    title: "Clear the background",
    cue: "Step so nothing grows out of your head or crowds the edges",
    why: "A clean background keeps the focus on you.",
    category: "background",
  },
  {
    id: "depth",
    title: "Put distance behind you",
    cue: "Stand a few steps in front of the background, not against it",
    why: "Separation adds depth and softens background clutter.",
    category: "background",
  },
  {
    id: "steady",
    title: "Brace before the shot",
    cue: "Tuck elbows in, exhale, then tap",
    why: "A steady hold keeps the face sharp instead of soft.",
    category: "sharpness",
  },
  {
    id: "tap-focus",
    title: "Tap to focus on the eyes",
    cue: "Tap your face on screen before capturing",
    why: "Locking focus on the eyes is what makes a portrait look crisp.",
    category: "sharpness",
  },
];
