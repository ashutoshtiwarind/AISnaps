// stats.ts — retention state (R-1 streak, R-2 beat-your-best).
//
// Persists the user's best photo score, daily streak, and shot count. The
// improvable score becomes a repeatable game: beat your best, keep the streak.
// Pure logic + storage; verifiable on web (localStorage), persists on native
// via lib/storage.

import { PhotoScore } from "./photoScore";
import { getItem, setItem } from "./storage";

const KEY = "stats_v1";

export interface UserStats {
  bestScore: number; // best overall (1-10)
  streak: number; // consecutive days with at least one shot
  lastShotDate: string | null; // YYYY-MM-DD
  shotCount: number;
}

export const EMPTY_STATS: UserStats = {
  bestScore: 0,
  streak: 0,
  lastShotDate: null,
  shotCount: 0,
};

export interface ShotOutcome {
  stats: UserStats;
  isNewBest: boolean;
}

function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Whole days from a→b (both YYYY-MM-DD), UTC. */
function daysBetween(a: string, b: string): number {
  const ms = Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z");
  return Math.round(ms / 86_400_000);
}

export async function loadStats(): Promise<UserStats> {
  try {
    const raw = await getItem(KEY);
    if (raw) return { ...EMPTY_STATS, ...JSON.parse(raw) };
  } catch {
    /* corrupt / unavailable — start fresh */
  }
  return { ...EMPTY_STATS };
}

/** Record a shot: update streak + best, persist, report whether it's a new best. */
export async function recordShot(score: PhotoScore, prev: UserStats): Promise<ShotOutcome> {
  const today = dayKey();

  let streak: number;
  if (prev.lastShotDate === today) {
    streak = prev.streak || 1; // already shot today — hold
  } else if (prev.lastShotDate && daysBetween(prev.lastShotDate, today) === 1) {
    streak = prev.streak + 1; // consecutive day
  } else {
    streak = 1; // first shot, or a gap broke the streak
  }

  const isNewBest = score.overall > prev.bestScore;
  const stats: UserStats = {
    bestScore: Math.max(prev.bestScore, score.overall),
    streak,
    lastShotDate: today,
    shotCount: prev.shotCount + 1,
  };

  try {
    await setItem(KEY, JSON.stringify(stats));
  } catch {
    /* best-effort persist */
  }
  return { stats, isNewBest };
}
