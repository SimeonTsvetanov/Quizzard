// The update check itself (pwa → pwa §5), apart from pwa.ts so the manual check can use it too.

/** The part of a ServiceWorkerRegistration the update check needs. */
export interface UpdatableRegistration {
  readonly installing: ServiceWorker | null;
  update(): Promise<unknown>;
}

/** Inputs of {@link checkForUpdate}; the browser globals are passed in so the check is testable. */
export interface UpdateCheckOptions {
  readonly swUrl: string;
  readonly registration: UpdatableRegistration;
  readonly isOnline: () => boolean;
  readonly fetchScript: (url: string, init: RequestInit) => Promise<Pick<Response, "status">>;
}

/**
 * Asks the browser to look for a new service worker, unless one is already installing or the
 * device is offline. The script is fetched first, bypassing the HTTP cache, so `update()` only
 * runs when the server answers 200.
 * @returns true when `registration.update()` was called and resolved.
 */
export async function checkForUpdate({ swUrl, registration, isOnline, fetchScript }: UpdateCheckOptions): Promise<boolean> {
  if (registration.installing || !isOnline()) return false;
  try {
    const response = await fetchScript(swUrl, { cache: "no-store", headers: { "cache-control": "no-cache" } });
    if (response.status !== 200) return false;
    await registration.update();
    return true;
  } catch {
    // because a failed check (flaky network, server hiccup) is harmless: the next one runs on
    // the next visibility change or within the hour.
    return false;
  }
}
