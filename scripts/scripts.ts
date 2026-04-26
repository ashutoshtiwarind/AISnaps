// scripts.ts
// Add or edit shooting scripts here — each one has a label, icon, and tip list
// Tips cycle every 4 seconds in the AI coach

export const SCRIPTS = [
  {
    label: "Portrait",
    icon: "🧍",
    tips: [
      "Move closer — fill 70% of frame with your subject",
      "Look for soft window light on one side of the face",
      "Eye level with subject makes it feel personal",
      "Background is busy — find a plain wall or open sky",
      "Subject eyes should land on the top rule-of-thirds line",
    ],
  },
  {
    label: "Landscape",
    icon: "🏔",
    tips: [
      "Place the horizon on the bottom or top third — not center",
      "Find a leading line — road, river, fence, or path",
      "Add foreground interest for depth",
      "Wait for golden hour — 30 min after sunrise or before sunset",
      "Shoot in portrait orientation to emphasize height",
    ],
  },
  {
    label: "Product",
    icon: "📦",
    tips: [
      "Clean, uncluttered background is essential",
      "Even side lighting removes harsh shadows",
      "Shoot at 45° angle to show depth and texture",
      "Leave breathing room — negative space sells",
      "Center the product exactly on a grid intersection",
    ],
  },
  {
    label: "Street",
    icon: "🏙",
    tips: [
      "Anticipate the moment — pre-focus, then wait",
      "Look for strong light-shadow contrast",
      "Layers: foreground + subject + background add story",
      "Shoot from hip level for a candid feel",
      "Leading lines from buildings draw the eye in",
    ],
  },
  {
    label: "Food",
    icon: "🍽",
    tips: [
      "Natural side light only — no overhead lamp or flash",
      "Shoot at 45° angle to show layers and depth",
      "Add props: napkin, cutlery, or raw ingredients",
      "Steam or sauce movement signals freshness",
      "Garnish should be the brightest thing in frame",
    ],
  },
  {
    label: "Reels",
    icon: "🎬",
    tips: [
      "Shoot vertical 9:16 — fill the whole frame",
      "Keep subject in upper third for caption space",
      "Move the camera slowly — fast pans look shaky",
      "Hook in the first 2 seconds — start mid-action",
      "Strong backlight creates dramatic silhouettes",
    ],
  },
  {
    label: "Architecture",
    icon: "🏛",
    tips: [
      "Look straight up for a dramatic leading lines shot",
      "Shoot at dawn — no people, soft light, blue sky",
      "Keep verticals straight — tilt corrects in editing",
      "Symmetry works — center the subject for impact",
      "Include a human for scale reference",
    ],
  },
];

// To add a new script just add a new object to this array:
// {
//   label: "Pets",
//   icon: "🐶",
//   tips: [
//     "Get down to their eye level",
//     "Use burst mode — animals move fast",
//     "Natural light near a window works best",
//     "Focus lock on the eyes, not the nose",
//     "Treats just out of frame get their attention",
//   ],
// },j