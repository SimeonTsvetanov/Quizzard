// Room for media files (SPEC §3.5): before a file is stored the free space is checked, so "not
// enough space" is a clear message and never a write that fails halfway; and with the first media
// file the browser is asked to keep this site's storage (a quiz with its pictures is not something
// to lose to an automatic clean-up).

/** Kept free on top of the file itself: the quiz's own data and the browser's bookkeeping. */
const HEADROOM_BYTES = 2 * 1024 * 1024;

/** What the checks need of the browser; tests pass their own. */
export type StorageApi = Pick<StorageManager, "estimate"> & Partial<Pick<StorageManager, "persist" | "persisted">>;

/** The browser's storage manager, or `undefined` where there is none (an old browser, a page without a secure context). */
function browserStorage(): StorageApi | undefined {
  return (navigator as Partial<Navigator>).storage;
}

/**
 * Whether the browser has room for a file. A browser that cannot say is trusted to have it — the
 * write itself still reports a failure.
 * @param bytes - the file's size
 * @param storage - the storage manager (default: the browser's)
 */
export async function hasRoomFor(bytes: number, storage: StorageApi | undefined = browserStorage()): Promise<boolean> {
  try {
    const estimate = await storage?.estimate();
    if (estimate?.quota === undefined || estimate.usage === undefined) return true;
    return estimate.quota - estimate.usage >= bytes + HEADROOM_BYTES;
  } catch {
    return true;
  }
}

/**
 * Asks the browser to keep this site's storage (no automatic clean-up when the device runs low).
 * Asked once it matters — with the first media file; a browser that refuses or has no such thing is
 * not an error.
 * @param storage - the storage manager (default: the browser's)
 * @returns whether the storage is kept now
 */
export async function keepOnDevice(storage: StorageApi | undefined = browserStorage()): Promise<boolean> {
  try {
    if (!storage?.persist) return false;
    if ((await storage.persisted?.()) === true) return true;
    return await storage.persist();
  } catch {
    return false;
  }
}
