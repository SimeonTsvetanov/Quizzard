// Who keeps the app busy: the shell's own long task (ui/progress.ts) and every mounted mini-app
// that called `context.shell.setBusy(true)`. pwa.ts offers no update while anyone is busy.

/** One party that can keep the app busy; each mini-app mount gets its own. */
export type BusyOwner = symbol;

/** Fired on `document` when the last busy owner becomes idle. */
export const IDLE_EVENT = "task:idle";

/** Result of {@link nextBusyOwners}. */
export interface BusyChange {
  readonly owners: ReadonlySet<BusyOwner>;
  /** True only when something was busy before and nothing is now. */
  readonly becameIdle: boolean;
}

/**
 * Returns the busy owners after `owner` reports `isBusy`, and whether the app just became idle.
 * @remarks Pure: the same owner reporting twice counts once; an owner that was never busy
 * reporting idle changes nothing (so a mini-app's unmount never fires a second idle).
 */
export function nextBusyOwners(owners: ReadonlySet<BusyOwner>, owner: BusyOwner, isBusy: boolean): BusyChange {
  const next = new Set(owners);
  if (isBusy) next.add(owner);
  else next.delete(owner);
  return { owners: next, becameIdle: owners.size > 0 && next.size === 0 };
}

const SHELL_TASK: BusyOwner = Symbol("shell task");
let busyOwners: ReadonlySet<BusyOwner> = new Set();

/** Returns true while the shell runs a long task or any mounted mini-app is busy. */
export const isBusy = (): boolean => busyOwners.size > 0;

/**
 * Records whether `owner` is busy; dispatches {@link IDLE_EVENT} on `document` when the last
 * busy owner becomes idle.
 */
export function setBusy(owner: BusyOwner, isBusy: boolean): void {
  const change = nextBusyOwners(busyOwners, owner, isBusy);
  busyOwners = change.owners;
  if (change.becameIdle) document.dispatchEvent(new Event(IDLE_EVENT));
}

/** Marks the shell's own long task (progress bar) as running or done. */
export function setTaskRunning(value: boolean): void {
  setBusy(SHELL_TASK, value);
}
