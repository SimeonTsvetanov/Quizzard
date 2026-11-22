// Unit tests for the generated sw-handover.js (PLAN T-02): run in a fake service worker scope, it
// skips waiting only when a 2025 cache exists and deletes exactly the 2025 caches on activate.
// The real browser flow is tests/e2e/legacy-2025.spec.ts.
import { runInNewContext } from "node:vm";
import fc from "fast-check";
import { describe, expect, it, vi } from "vitest";
import { app } from "../app.config.ts";
import { swHandoverScript } from "./sw-handover.ts";

type Listener = (event: { waitUntil: (promise: Promise<unknown>) => void }) => void;

interface WorkerRun {
  readonly skipped: boolean;
  readonly remaining: readonly string[];
}

/** Runs sw-handover.js in a fake worker whose Cache Storage holds `names`, then fires install + activate. */
async function installAndActivate(names: readonly string[], { failing = false } = {}): Promise<WorkerRun> {
  const listeners = new Map<string, Listener[]>();
  const stored = new Set(names);
  const skipWaiting = vi.fn(() => Promise.resolve());
  const caches = {
    keys: () => (failing ? Promise.reject(new Error("blocked")) : Promise.resolve([...stored])),
    delete: (name: string) => Promise.resolve(stored.delete(name)),
  };
  const self = {
    addEventListener: (type: string, listener: Listener) => { listeners.set(type, [...(listeners.get(type) ?? []), listener]); },
    skipWaiting,
  };
  runInNewContext(swHandoverScript(app), { self, caches, Promise });
  for (const type of ["install", "activate"]) {
    const pending: Promise<unknown>[] = [];
    for (const listener of listeners.get(type) ?? []) listener({ waitUntil: (promise) => { pending.push(promise); } });
    await Promise.all(pending);
  }
  return { skipped: skipWaiting.mock.calls.length > 0, remaining: [...stored] };
}

const LEGACY: readonly string[] = app.legacyCacheNames;
const ORIGIN = "https://simeontsvetanov.github.io";
const OWN_PRECACHE = `quizzard-precache-v2-${ORIGIN}${app.basePath}`;
const OTHER_APPS = [`teamsync-precache-v2-${ORIGIN}/teamsync-random-team-generator/`, `gg-counter-precache-v2-${ORIGIN}/GG-counter/`];

describe("swHandoverScript", () => {
  it("knows every cache name the 2025 workers used", () => {
    expect(LEGACY).toContain("quizzard-complete-icons-2025"); // the live 2025 worker (gh-pages 2025-06-27)
    expect(LEGACY).toHaveLength(9);
  });

  it("the live 2025 worker's cache → takes over at once and deletes it", async () => {
    expect(await installAndActivate(["quizzard-complete-icons-2025", OWN_PRECACHE])).toEqual({ skipped: true, remaining: [OWN_PRECACHE] });
  });

  it("an older 2025 version (sw.js era, two caches) → both deleted", async () => {
    expect(await installAndActivate(["quizzard-v1.0.1", "quizzard-static-v1.0.1"])).toEqual({ skipped: true, remaining: [] });
  });

  it("a later update of the new app (no 2025 cache) → waits for Reload, deletes nothing", async () => {
    expect(await installAndActivate([OWN_PRECACHE])).toEqual({ skipped: false, remaining: [OWN_PRECACHE] });
  });

  it("a first install (no caches) waits as usual", async () => {
    expect(await installAndActivate([])).toEqual({ skipped: false, remaining: [] });
  });

  it("other apps on the shared origin are never touched, even next to a 2025 cache", async () => {
    const result = await installAndActivate([...OTHER_APPS, "quizzard-cache-v1", "quizzard-cache-v2"]);
    expect(result).toEqual({ skipped: true, remaining: [...OTHER_APPS, "quizzard-cache-v2"] });
  });

  it("a Cache Storage error is swallowed: the worker waits as usual and deletes nothing", async () => {
    expect(await installAndActivate(["quizzard-cache-v1"], { failing: true })).toEqual({ skipped: false, remaining: ["quizzard-cache-v1"] });
  });

  it("property: deletes exactly the 2025 names and skips waiting iff one was there", async () => {
    const name = fc.oneof(fc.constantFrom(...LEGACY, OWN_PRECACHE, ...OTHER_APPS), fc.string({ maxLength: 40 }));
    await fc.assert(
      fc.asyncProperty(fc.uniqueArray(name, { maxLength: 12 }), async (names) => {
        const legacy = names.filter((n) => LEGACY.includes(n));
        const result = await installAndActivate(names);
        expect(result.skipped).toBe(legacy.length > 0);
        expect(result.remaining).toEqual(names.filter((n) => !LEGACY.includes(n)));
      }),
    );
  });
});
