// Keys inside a mini-app's storage area (PLAN §1.4). Pure: the app's storage module reads and
// writes; this decides which short pref keys a mini-app may use under its `StorageArea.prefix`.

import type { StorageArea } from "./contract.js";

/** Longest short pref key a mini-app may pass to `context.storage.prefs`. */
export const MAX_PREF_KEY_LENGTH = 64;

/**
 * Letters and digits, with `-`, `_` or `.` only between them. No `:` — it separates the segments of
 * `<id>:v1:<key>`, so a key with it could pose as a nested namespace or another schema version
 * (`v2:state`) that the area's own storage module treats as its own; no `/`, `\`, spaces or
 * control characters either.
 */
const PREF_KEY = /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/;

/**
 * Returns whether `key` may name a preference inside a storage area, where the shell stores it as
 * `area.prefix + key`.
 * @param key - the short key a mini-app passes, e.g. `"theme"`
 */
export function isPrefKey(key: string): boolean {
  return key.length <= MAX_PREF_KEY_LENGTH && PREF_KEY.test(key);
}

/**
 * Returns whether a localStorage key belongs to a storage area: it starts with the area's prefix or
 * is one of its extra keys.
 * @param area - the area of a mini-app or of the shell
 * @param key - the full localStorage key
 */
export function ownsKey(area: StorageArea, key: string): boolean {
  return key.startsWith(area.prefix) || (area.extraKeys?.includes(key) ?? false);
}

/**
 * Returns the bytes an area's entries take in localStorage (keys and values are UTF-16: two bytes
 * per code unit).
 * @param area - the area to measure
 * @param entries - every `[key, value]` pair of the storage; pairs of other areas are skipped
 */
export function areaBytes(area: StorageArea, entries: Iterable<readonly [string, string]>): number {
  let units = 0;
  for (const [key, value] of entries) if (ownsKey(area, key)) units += key.length + value.length;
  return units * 2;
}
