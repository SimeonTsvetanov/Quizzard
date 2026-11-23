/**
 * The shared storage module (engineering → browser-storage). Apps never call localStorage,
 * indexedDB, caches or navigator.storage directly. Everything is namespaced by app.id because all
 * micro-apps share the origin simeontsvetanov.github.io.
 */
import { isRouteSlug } from "@simeonts/quizzard-core";
import { app } from "../config.ts";

const PREFIX = `${app.id}:v1:`;
const memory = new Map<string, string>(); // full key → JSON; fallback when storage is blocked (private mode)

/** Tier 0 preferences (small JSON values) under one localStorage prefix; keys are relative to it. */
export interface Prefs {
  /** Returns the saved value, or `fallback` when there is none or it is not valid JSON. */
  get<T>(key: string, fallback: T): T;
  /** Saves the value; false when storage is full or blocked (kept in memory for this visit). */
  set(key: string, value: unknown): boolean;
  remove(key: string): void;
  /** The relative keys saved under the prefix. */
  keys(): string[];
}

/**
 * Returns the preferences stored under `prefix`: the shell's own (`prefs`) and each mini-app's
 * area (`context.storage.prefs`, PLAN §1.2) — so only this module touches localStorage.
 * @param prefix - the namespace, e.g. `"quizzard:v1:"`; the caller checks it is its own
 */
export function createPrefs(prefix: string): Prefs {
  const read = (key: string): string | null => {
    try { return localStorage.getItem(prefix + key); } catch { return memory.get(prefix + key) ?? null; }
  };
  return {
    get<T>(key: string, fallback: T): T {
      const raw = read(key);
      if (raw === null) return fallback;
      try { return JSON.parse(raw) as T; } catch { return fallback; }
    },
    set(key, value) {
      const raw = JSON.stringify(value);
      try { localStorage.setItem(prefix + key, raw); return true; } catch { memory.set(prefix + key, raw); return false; }
    },
    remove(key) {
      try { localStorage.removeItem(prefix + key); } catch { /* blocked */ }
      memory.delete(prefix + key);
    },
    keys() {
      const own = (keys: Iterable<string>): string[] => [...keys].filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length));
      try { return own(Object.keys(localStorage)); } catch { return own(memory.keys()); }
    },
  };
}

/** The shell's Tier 0 preferences (`quizzard:v1:*`). */
export const prefs: Prefs = createPrefs(PREFIX);

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
interface ExportData {
  app: string;
  schemaVersion: number;
  exportedAt: string;
  prefs: Record<string, unknown>;
  /** Saved data of each mini-app: id → its raw localStorage entries. */
  tools: Record<string, Record<string, string>>;
}

/**
 * Export my data: the shell's preferences and every mini-app's saved entries as one JSON file.
 * @param tools - mini-app id → its raw entries (storage/areas.ts `readArea`)
 */
export function exportAll(tools: Record<string, Record<string, string>> = {}): Blob {
  const prefsData: Record<string, unknown> = {};
  for (const k of prefs.keys()) prefsData[k] = prefs.get<unknown>(k, null);
  const data: ExportData = { app: app.id, schemaVersion: 1, exportedAt: new Date().toISOString(), prefs: prefsData, tools };
  return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
}

/** Import limits (security review 2026-11-06): checked before anything is parsed or written. */
const MAX_IMPORT_BYTES = 50 * 1024 * 1024;
const MAX_PREF_BYTES = 1024 * 1024;
/** UTF-16 code units all tools together may bring in one import (about 3 MB of the origin's ~5 MB). */
const MAX_TOOLS_IMPORT_LENGTH = 1536 * 1024;

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
 * Import a JSON file made by exportAll().
 * @param file - the picked file
 * @param planTool - checks one mini-app's exported entries without writing (storage/areas.ts
 * `planArea` behind the registry's areas); null for an unknown id
 * @returns how many preferences and mini-app entries were restored
 * @remarks All or nothing: every tool's entries are checked and added up first, and a file whose
 * tools would take more than {@link MAX_TOOLS_IMPORT_LENGTH} is refused before anything is written —
 * the origin's localStorage is shared with the author's other apps (security review 2026-11-23).
 * @throws {@link Error} with the code `IMPORT_TOO_BIG`, `IMPORT_INVALID` or `NOT_THIS_APP` (translated by the UI)
 */
export async function importAll(file: File, planTool: (id: string, data: unknown) => { readonly size: number; write(): number } | null = () => null): Promise<number> {
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
  const toolsIn = raw["tools"] ?? {};
  const plans = isRecord(toolsIn) ? Object.entries(toolsIn).flatMap(([id, data]) => planTool(id, data) ?? []) : [];
  if (plans.reduce((sum, plan) => sum + plan.size, 0) > MAX_TOOLS_IMPORT_LENGTH) throw new Error("IMPORT_TOO_BIG");
  let n = 0;
  for (const [k, v] of Object.entries(prefsIn)) {
    const check = prefChecks.get(k) ?? (k.startsWith("draft:") ? isRecord : undefined);
    if (k.length > 100 || JSON.stringify(v).length > MAX_PREF_BYTES || (check && !check(v))) continue; // skip, never break the app
    prefs.set(k, v); n++;
  }
  for (const plan of plans) n += plan.write();
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
