// src/legacy-caches.ts — recognises a page loaded under the 2025 site's service worker (PLAN T-02):
// pwa.ts then shows no update offer when the new worker takes over (scripts/sw-handover.ts).

/**
 * Tells whether Cache Storage holds a cache of the 2025 site (app.config `legacyCacheNames`), i.e.
 * the page was loaded under the 2025 worker, which the new one replaces at once
 * (scripts/sw-handover.ts). False when there is none or Cache Storage is unavailable.
 */
export async function hasLegacyCaches(cacheStorage: Pick<CacheStorage, "keys"> | undefined, legacyNames: readonly string[]): Promise<boolean> {
  if (!cacheStorage || legacyNames.length === 0) return false;
  try {
    return (await cacheStorage.keys()).some((name) => legacyNames.includes(name));
  } catch {
    return false; // because without the answer the usual update offer is the safe default
  }
}
