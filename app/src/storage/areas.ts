// Saved data per storage area (PLAN T-15): size, clear, and the raw entries for Export / Import.
// Mini-apps read and write their own keys; the shell only measures, copies and deletes whole areas.
import { areaBytes, isPrefKey, ownsKey, type StorageArea } from "@simeonts/quizzard-core";

/** Largest value Import writes into one key of a mini-app (a saved game is a few hundred kB at most). */
const MAX_VALUE_LENGTH = 512 * 1024;

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

/** What an import would write into one area: its size and the write itself. */
export interface AreaImport {
  /** UTF-16 code units of every key and value that would be written. */
  readonly size: number;
  /** Writes the entries; returns how many the browser kept. */
  write(): number;
}

/**
 * Checks exported entries for an area without writing anything.
 * @param area - the storage area the entries must belong to
 * @param data - what an export file holds for it. An entry is taken only when its key is the area's own
 * (an extra key, or the prefix plus a valid pref key — never a nested namespace such as `v2:state`) and
 * its value is a string of sane size; anything else is skipped, so a hand-edited file cannot write
 * outside the area
 * @returns the size of what would be written and the function that writes it
 */
export function planArea(area: StorageArea, data: unknown): AreaImport {
  const entries: [string, string][] = [];
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    for (const [key, value] of Object.entries(data)) {
      const isOwn = (area.extraKeys?.includes(key) ?? false) || (key.startsWith(area.prefix) && isPrefKey(key.slice(area.prefix.length)));
      if (isOwn && typeof value === "string" && value.length <= MAX_VALUE_LENGTH) entries.push([key, value]);
    }
  }
  return {
    size: entries.reduce((sum, [key, value]) => sum + key.length + value.length, 0),
    write: () => {
      let written = 0;
      for (const [key, value] of entries) {
        try {
          localStorage.setItem(key, value);
          written += 1;
        } catch { /* full or blocked: skip this entry */ }
      }
      return written;
    },
  };
}
