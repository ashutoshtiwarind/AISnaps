// share.ts — share flow for the score reveal (S-3).
//
// The growth loop: a shareable score + glow-up ("did you hear about the app
// that scores your photo?"). Platform-split, zero new deps:
//   - web    -> navigator.share, clipboard fallback
//   - native -> React Native built-in Share (text + link)
//
// Rasterizing the branded card to an image (S-2) is the next slice — needs
// react-native-view-shot + a dev build, so it's kept separate from this path.

import { Platform, Share } from "react-native";

import { PhotoScore } from "./photoScore";

export const APP_URL = "https://aisnaps.app";
export const HANDLE = "@aisnaps";

export type ShareResult = "shared" | "copied" | "dismissed" | "unavailable";

/** Caption for the share — score + glow-up hook + app link. */
export function buildShareText(score: PhotoScore): string {
  return `I scored ${score.overall}/10 on AISnaps 📸 — ${score.headline}. Think you can beat it? ${APP_URL}`;
}

/** Open the platform share sheet with the score caption. Never throws. */
export async function shareScore(score: PhotoScore): Promise<ShareResult> {
  const text = buildShareText(score);

  if (Platform.OS === "web") {
    const nav: any = typeof navigator !== "undefined" ? navigator : undefined;
    try {
      if (nav?.share) {
        await nav.share({ title: "AISnaps", text, url: APP_URL });
        return "shared";
      }
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(text);
        return "copied";
      }
    } catch {
      return "dismissed"; // user cancelled the share sheet
    }
    return "unavailable";
  }

  try {
    const res = await Share.share({ message: text, url: APP_URL });
    return res.action === Share.sharedAction ? "shared" : "dismissed";
  } catch {
    return "unavailable";
  }
}
