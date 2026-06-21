// storage.ts — tiny async key/value store, web + native, zero new deps.
//   web    -> localStorage
//   native -> expo-file-system JSON file (already a dependency)
// Both fall back to an in-memory map if the backend is unavailable, so callers
// never have to handle a throw.

import { Platform } from "react-native";

const mem: Record<string, string> = {};
const FILE_PREFIX = "aisnaps_";

// Resolve the expo-file-system functional API across SDK variants; null if absent.
function nativeFS(): any | null {
  for (const mod of ["expo-file-system", "expo-file-system/legacy"]) {
    try {
      const FS = require(mod);
      if (FS?.documentDirectory && FS?.writeAsStringAsync && FS?.readAsStringAsync) return FS;
    } catch {
      // try next
    }
  }
  return null;
}

function pathFor(FS: any, key: string): string {
  return `${FS.documentDirectory}${FILE_PREFIX}${key}.json`;
}

export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      if (typeof localStorage !== "undefined") return localStorage.getItem(key);
    } catch {
      /* fall through */
    }
    return mem[key] ?? null;
  }

  const FS = nativeFS();
  if (FS) {
    try {
      const path = pathFor(FS, key);
      const info = await FS.getInfoAsync(path);
      if (!info?.exists) return null;
      return await FS.readAsStringAsync(path);
    } catch {
      /* fall through */
    }
  }
  return mem[key] ?? null;
}

export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(key, value);
        return;
      }
    } catch {
      /* fall through */
    }
    mem[key] = value;
    return;
  }

  const FS = nativeFS();
  if (FS) {
    try {
      await FS.writeAsStringAsync(pathFor(FS, key), value);
      return;
    } catch {
      /* fall through */
    }
  }
  mem[key] = value;
}
