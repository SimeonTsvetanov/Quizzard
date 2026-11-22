// Unit tests for legacy-caches.ts (PLAN T-02): which pages pwa.ts treats as loaded under the 2025 worker.
import { describe, expect, it } from "vitest";
import { hasLegacyCaches } from "./legacy-caches.ts";

const LEGACY = ["quizzard-complete-icons-2025", "quizzard-cache-v1"];
const storage = (names: readonly string[]): Pick<CacheStorage, "keys"> => ({ keys: () => Promise.resolve([...names]) });

describe("hasLegacyCaches", () => {
  it("a 2025 cache is there → true", async () => {
    expect(await hasLegacyCaches(storage(["quizzard-precache-v2-x", "quizzard-complete-icons-2025"]), LEGACY)).toBe(true);
  });
  it("only this app's Workbox caches and other apps' caches → false", async () => {
    expect(await hasLegacyCaches(storage(["quizzard-precache-v2-x", "teamsync-precache-v2-y"]), LEGACY)).toBe(false);
  });
  it("no legacy names configured → false without reading Cache Storage", async () => {
    const keys = (): Promise<string[]> => Promise.reject(new Error("must not be called"));
    expect(await hasLegacyCaches({ keys }, [])).toBe(false);
  });
  it("no Cache Storage (insecure context, old browser) → false", async () => {
    expect(await hasLegacyCaches(undefined, LEGACY)).toBe(false);
  });
  it("a Cache Storage error → false (the usual update offer stays)", async () => {
    expect(await hasLegacyCaches({ keys: () => Promise.reject(new Error("blocked")) }, LEGACY)).toBe(false);
  });
});
