// "Check for updates" in the menu (Moni 2026-11-24): asks the server now instead of waiting for the
// hourly check, and says what it found. The browser parts are passed in, so the steps are testable.
import { type UpdatableRegistration, type UpdateCheckOptions, checkForUpdate } from "./pwa-check.ts";

/** The part of a ServiceWorkerRegistration a manual check reads. */
export interface ManualRegistration extends UpdatableRegistration {
  readonly waiting: ServiceWorker | null;
}

/** What a manual check found: a new version ready to take over, none, or no answer from the server. */
export type ManualResult = "found" | "latest" | "offline";

/** A worker that is being installed: its state and the event that tells of a change. */
export type InstallingWorker = Pick<ServiceWorker, "state" | "addEventListener">;

/**
 * Waits until a worker that is installing has finished.
 * @param worker - the installing worker
 * @returns true when it is installed (waiting or already active), false when the install failed
 */
export function whenInstalled(worker: InstallingWorker): Promise<boolean> {
  const isDone = (): boolean | null => {
    if (worker.state === "redundant") return false;
    return worker.state === "installing" ? null : true;
  };
  return new Promise((resolve) => {
    const now = isDone();
    if (now !== null) {
      resolve(now);
      return;
    }
    worker.addEventListener("statechange", () => {
      const done = isDone();
      if (done !== null) resolve(done);
    });
  });
}

/** Whether a new version waits to take over; read afresh each time, as the browser fills it in. */
const hasWaiting = (registration: ManualRegistration): boolean => registration.waiting !== null;

/** Whether the registration holds a new version: one that waits, or one that finishes installing. */
async function hasNewVersion(registration: ManualRegistration): Promise<boolean> {
  if (hasWaiting(registration)) return true;
  if (!registration.installing) return false;
  const isInstalled = await whenInstalled(registration.installing);
  return isInstalled && hasWaiting(registration);
}

/**
 * Looks for a new version now.
 * @param options - the worker's address, its registration and the browser's network parts
 * @returns `"found"` when a new version waits to take over, `"latest"` when the server has none,
 *   `"offline"` when the device is offline or the server did not answer
 */
export async function findUpdate(options: UpdateCheckOptions & { readonly registration: ManualRegistration }): Promise<ManualResult> {
  const { registration } = options;
  if (await hasNewVersion(registration)) return "found";
  if (!options.isOnline()) return "offline";
  const hasChecked = await checkForUpdate(options);
  if (!hasChecked) return "offline";
  return (await hasNewVersion(registration)) ? "found" : "latest";
}
