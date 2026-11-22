// Builds sw-handover.js, which the new service worker loads with Workbox `importScripts`
// (app/vite.config.ts emits it next to service-worker.js). It takes over from the 2025 site's
// worker at the same URL: that worker never waits for a Reload toast and its pages cannot ask for
// one, so the new worker activates at once in exactly that case and deletes the 2025 caches; every
// later update waits for Reload as usual (pwa → pwa §5, §11; DECISIONS 2026-11-22 T-02).
import type { AppConfig } from "../app.config.ts";

/** File name of the generated script, next to the service worker (also in its `importScripts`). */
export const SW_HANDOVER_FILE = "sw-handover.js";

/**
 * Returns the source of sw-handover.js for `config`.
 *
 * @remarks How the 2025 worker is recognised: one of `config.legacyCacheNames` exists (each 2025
 * version deleted every other cache when it activated, so a browser holds the name of the version
 * it last ran). Only those exact names are deleted — never another app's cache on the shared
 * origin, never this app's Workbox caches, never localStorage or IndexedDB. A failed cache call
 * leaves the worker to wait for Reload as usual. Plain ES5, no imports (service worker scope).
 */
export function swHandoverScript(config: Pick<AppConfig, "legacyCacheNames">): string {
  return `// Generated from app.config.ts by scripts/sw-handover.ts — never edit. Takes over from the
// 2025 site's service worker at once and deletes its caches (PLAN T-02).
(function () {
  var LEGACY_CACHE_NAMES = ${JSON.stringify(config.legacyCacheNames ?? [])};
  function legacyCaches() {
    return caches.keys().then(function (names) {
      return names.filter(function (name) { return LEGACY_CACHE_NAMES.indexOf(name) !== -1; });
    });
  }
  self.addEventListener("install", function (event) {
    event.waitUntil(
      legacyCaches()
        .then(function (found) {
          if (found.length > 0) return self.skipWaiting();
          return undefined;
        })
        .catch(function () {
          /* no cache access: wait for the Reload toast as usual */
        })
    );
  });
  self.addEventListener("activate", function (event) {
    event.waitUntil(
      legacyCaches()
        .then(function (found) {
          return Promise.all(found.map(function (name) { return caches.delete(name); }));
        })
        .catch(function () {
          /* no cache access: nothing to clean up now; the next activation tries again */
        })
    );
  });
})();
`;
}
