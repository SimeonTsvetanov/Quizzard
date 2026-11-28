// A text another app shared with the installed Quizzard: the service worker keeps it in one cache entry
// (scripts/share-target.ts — the names below are the same there; tests/e2e/quiz-ai.spec.ts holds them together), and the
// creator takes it once: read, shown in a window, then deleted, so opening the same address again opens nothing.

/** The cache and the entry, below the app's own address. */
export const SHARED_CACHE = "quizzard-shared";
export const SHARED_ENTRY = "shared-text";

/** Reads the shared text, leaving it in place; `""` when there is none or the browser keeps no caches. */
export async function readSharedText(): Promise<string> {
  if (typeof caches === "undefined") return "";
  try {
    const cache = await caches.open(SHARED_CACHE);
    const found = await cache.match(SHARED_ENTRY);
    return found ? await found.text() : "";
  } catch {
    return "";
  }
}

/** Forgets the shared text, once a window shows it. */
export async function forgetSharedText(): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    const cache = await caches.open(SHARED_CACHE);
    await cache.delete(SHARED_ENTRY);
  } catch {
    // Nothing kept, or the browser refuses: the text is shown again next time, which harms nothing.
  }
}
