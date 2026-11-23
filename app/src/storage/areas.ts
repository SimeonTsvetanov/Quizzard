// Saved data per storage area (PLAN T-15): size, clear, and the raw entries for Export / Import.
// Mini-apps read and write their own keys; the shell only measures, copies and deletes whole areas.
// An area may also name IndexedDB databases (`StorageArea.databases`, the quiz creator): they are
// measured and deleted here, but are not part of Export / Import — that file carries localStorage
// entries only (quiz-creator SPEC §3.5: quizzes travel as quiz files).
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

/** Opens an existing database without creating it: a database that is not there yet stays not there. */
function openExisting(name: string): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open(name);
    // "upgradeneeded" on an open without a version means the database did not exist: undo its creation.
    request.addEventListener("upgradeneeded", () => { request.transaction?.abort(); });
    request.addEventListener("success", () => { resolve(request.result); });
    request.addEventListener("error", (event) => {
      event.preventDefault(); // the aborted creation is expected, not an error to report
      resolve(null);
    });
    request.addEventListener("blocked", () => { resolve(null); });
  });
}

/** Bytes of one stored value: files (Blobs) by their size, everything else as JSON text. */
function valueBytes(value: unknown): number {
  let files = 0;
  const text = JSON.stringify(value, (_key, part: unknown) => {
    if (part instanceof Blob) {
      files += part.size;
      return null;
    }
    return part;
  });
  return files + new Blob([text]).size;
}

/** Adds up every value of every store of one database. */
async function databaseBytes(name: string): Promise<number> {
  const database = await openExisting(name);
  if (database === null) return 0;
  try {
    const stores = [...database.objectStoreNames];
    if (stores.length === 0) return 0;
    const transaction = database.transaction(stores, "readonly");
    const sizes = await Promise.all(stores.map((store) => new Promise<number>((resolve) => {
      const request = transaction.objectStore(store).getAll();
      request.addEventListener("success", () => { resolve((request.result as unknown[]).reduce<number>((sum, value) => sum + valueBytes(value), 0)); });
      request.addEventListener("error", () => { resolve(0); });
    })));
    return sizes.reduce((sum, size) => sum + size, 0);
  } finally {
    database.close();
  }
}

/**
 * Returns the bytes the area's IndexedDB databases take: 0 for an area without databases, or when
 * the browser blocks IndexedDB.
 * @param area - the storage area of a mini-app
 */
export async function databasesSize(area: StorageArea): Promise<number> {
  try {
    const sizes = await Promise.all((area.databases ?? []).map(databaseBytes));
    return sizes.reduce((sum, size) => sum + size, 0);
  } catch {
    return 0;
  }
}

/**
 * Deletes the area's IndexedDB databases. The open mini-app is unmounted first (router/screen.ts)
 * and lets its connection go; the delete waits for that.
 * @param area - the storage area to empty
 * @throws when the browser refuses a delete
 */
export async function clearDatabases(area: StorageArea): Promise<void> {
  await Promise.all((area.databases ?? []).map((name) => new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.addEventListener("success", () => { resolve(); });
    request.addEventListener("error", () => { reject(request.error ?? new Error("IndexedDB delete failed")); });
  })));
}
