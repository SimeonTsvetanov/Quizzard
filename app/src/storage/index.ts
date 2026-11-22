/**
 * The shared storage module (engineering → browser-storage). Apps never call localStorage,
 * indexedDB, caches or navigator.storage directly. Everything is namespaced by app.id because all
 * micro-apps share the origin simeontsvetanov.github.io.
 */
import { isRouteSlug } from "@simeonts/quizzard-core";
import { app } from "../config.ts";

const PREFIX = `${app.id}:v1:`;
const memory = new Map<string, string>(); // fallback when storage is blocked (private mode)

function safeGet(key: string): string | null {
  try { return localStorage.getItem(PREFIX + key); } catch { return memory.get(key) ?? null; }
}

/** Tier 0 preferences (strings/JSON, small). */
export const prefs = {
  get<T>(key: string, fallback: T): T {
    const raw = safeGet(key);
    if (raw === null) return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
  },
  set(key: string, value: unknown): boolean {
    const raw = JSON.stringify(value);
    try { localStorage.setItem(PREFIX + key, raw); return true; } catch { memory.set(key, raw); return false; }
  },
  remove(key: string): void {
    try { localStorage.removeItem(PREFIX + key); } catch { /* blocked */ }
    memory.delete(key);
  },
  keys(): string[] {
    try {
      return Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).map((k) => k.slice(PREFIX.length));
    } catch { return [...memory.keys()]; }
  },
};

/** Space used / available for this origin (shared by all apps on it). */
export async function estimate(): Promise<{ usage: number; quota: number } | null> {
  if (!("storage" in navigator)) return null;
  const e = await navigator.storage.estimate();
  return { usage: e.usage ?? 0, quota: e.quota ?? 0 };
}

export async function isPersisted(): Promise<boolean> {
  return "storage" in navigator ? navigator.storage.persisted() : false;
}

export async function requestPersist(): Promise<boolean> {
  return "storage" in navigator ? navigator.storage.persist() : false;
}

// Quizzard's shell keeps preferences only (PLAN §2): no Dexie or OPFS tier. Mini-apps bring their
// own storage modules and areas (PLAN §1.1 item 8).
interface ExportData { app: string; schemaVersion: number; exportedAt: string; prefs: Record<string, unknown> }

/** Export my data: this app's preferences as JSON. */
export function exportAll(): Blob {
  const prefsData: Record<string, unknown> = {};
  for (const k of prefs.keys()) prefsData[k] = prefs.get<unknown>(k, null);
  const data: ExportData = { app: app.id, schemaVersion: 1, exportedAt: new Date().toISOString(), prefs: prefsData };
  return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
}

/** Import limits (security review 2026-11-06): checked before anything is parsed or written. */
const MAX_IMPORT_BYTES = 50 * 1024 * 1024;
const MAX_PREF_BYTES = 1024 * 1024;

/** Value checks per pref key; keys without a check are accepted if they are small JSON. Apps add
 *  their own with registerPrefCheck() so a hand-edited export can't break the app. */
const prefChecks = new Map<string, (v: unknown) => boolean>([
  ["theme", (v) => v === "light" || v === "dark"],
  ["lang", (v) => typeof v === "string" && v.length <= 8],
  ["last-seen-version", (v) => typeof v === "string"],
  ["last-app", (v) => typeof v === "string" && isRouteSlug(v)], // a mini-app id (home/home.ts)
  ["install-dismissed-at", (v) => typeof v === "number"],
  ["report-queue", (v) => Array.isArray(v)],
]);
export function registerPrefCheck(key: string, check: (v: unknown) => boolean): void { prefChecks.set(key, check); }

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Import a JSON file made by exportAll(); returns how many preferences were restored.
 * Errors (codes, translated by the UI): IMPORT_TOO_BIG, IMPORT_INVALID, NOT_THIS_APP.
 */
export async function importAll(file: File): Promise<number> {
  if (file.size > MAX_IMPORT_BYTES) throw new Error("IMPORT_TOO_BIG");
  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch (e) {
    throw new Error("IMPORT_INVALID", { cause: e });
  }
  if (!isRecord(raw)) throw new Error("IMPORT_INVALID");
  if (raw["app"] !== app.id) throw new Error("NOT_THIS_APP");
  const prefsIn = raw["prefs"] ?? {};
  if (!isRecord(prefsIn)) throw new Error("IMPORT_INVALID");
  let n = 0;
  for (const [k, v] of Object.entries(prefsIn)) {
    const check = prefChecks.get(k) ?? (k.startsWith("draft:") ? isRecord : undefined);
    if (k.length > 100 || JSON.stringify(v).length > MAX_PREF_BYTES || (check && !check(v))) continue; // skip, never break the app
    prefs.set(k, v); n++;
  }
  return n;
}

/** Clear my data — only this app's namespace (prefs and its service-worker caches). */
export async function clearAll(): Promise<void> {
  for (const k of prefs.keys()) prefs.remove(k);
  try {
    for (const name of await caches.keys()) if (name.startsWith(app.id)) await caches.delete(name);
  } catch { /* unavailable */ }
}

/** After the first meaningful save: ask once to keep data on this device (APP-STANDARD §6.1 rule 7). */
export async function offerPersistOnce(ask: (keep: () => Promise<boolean>) => void): Promise<void> {
  if (prefs.get<boolean>("persist-offered", false) || (await isPersisted())) return;
  prefs.set("persist-offered", true);
  ask(requestPersist);
}
