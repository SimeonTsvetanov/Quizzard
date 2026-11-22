// The storage keys of Scores inside Quizzard. Quizzard shares the origin simeontsvetanov.github.io with
// Moni's other apps, so every key is namespaced `quizzard-scores:v1:<name>` — Scores' own area, separate
// from the GG Counter site's `gg-counter:v1:*` keys, which are never read or written here (Quizzard
// DECISIONS 2026-11-23). Used by the storage modules only.
import { STORAGE_AREA } from "../meta";

/** The start of every key Scores writes (= its storage area in the registry). */
export const KEY_PREFIX: string = STORAGE_AREA.prefix;

/** The keys: the game, and the theme and language of a host that keeps them here. */
export const STORAGE_KEYS = {
  state: `${KEY_PREFIX}state`,
  theme: `${KEY_PREFIX}theme`,
  lang: `${KEY_PREFIX}lang`,
} as const;

/** Returns true for a key of Scores. */
export function isOwnKey(key: string): boolean {
  return key.startsWith(KEY_PREFIX);
}
