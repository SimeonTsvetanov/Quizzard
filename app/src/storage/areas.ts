// Saved data per storage area (PLAN T-15): size, clear, and the raw entries for Export / Import.
// Mini-apps read and write their own keys; the shell only measures, copies and deletes whole areas.
import { areaBytes, ownsKey, type StorageArea } from "@simeonts/quizzard-core";

/** Largest value Import writes into one key of a mini-app (a saved game is a few hundred kB at most). */
const MAX_VALUE_LENGTH = 2 * 1024 * 1024;

function entries(): [string, string][] {
  try {
    return Object.keys(localStorage).map((key) => [key, localStorage.getItem(key) ?? ""]);
  } catch {
    return []; // storage blocked (private mode): nothing is saved, so nothing to list
  }
}

/**
 * Returns the bytes the area's saved entries take in this browser.
 * @param area - the storage area of a mini-app or of the shell
 */
export function areaSize(area: StorageArea): number {
  return areaBytes(area, entries());
}

/**
 * Returns the area's saved entries as they are stored (full key → raw string).
 * @param area - the storage area to copy
 */
export function readArea(area: StorageArea): Record<string, string> {
  return Object.fromEntries(entries().filter(([key]) => ownsKey(area, key)));
}

/**
 * Deletes every saved entry of the area; keys of other areas and other apps stay.
 * @param area - the storage area to empty
 */
export function clearArea(area: StorageArea): void {
  for (const [key] of entries()) {
    if (!ownsKey(area, key)) continue;
    try { localStorage.removeItem(key); } catch { /* blocked */ }
  }
}

/**
 * Writes exported entries back into the area.
 * @param area - the storage area the entries must belong to
 * @param data - what an export file holds for it; anything that is not the area's own key with a
 * string value of sane size is skipped (a hand-edited file cannot write outside the area)
 * @returns how many entries were written
 */
export function writeArea(area: StorageArea, data: unknown): number {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return 0;
  let written = 0;
  for (const [key, value] of Object.entries(data)) {
    if (!ownsKey(area, key) || typeof value !== "string" || value.length > MAX_VALUE_LENGTH) continue;
    try {
      localStorage.setItem(key, value);
      written += 1;
    } catch { /* full or blocked: skip this entry */ }
  }
  return written;
}
