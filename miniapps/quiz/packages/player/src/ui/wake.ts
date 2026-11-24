// The screen stays awake while a quiz is played (Screen Wake Lock): a laptop or phone that dims or
// locks in the middle of a long question or a break takes the stage with it. Asked for only where
// the browser has it; a refusal (battery saver, no permission) is not an error. The browser lets the
// lock go when the page is hidden, so it is asked for again when the page is back on show.

/** The part of `navigator.wakeLock` used here. */
interface WakeLockLike {
  request(type: "screen"): Promise<{ release(): Promise<void> }>;
}

/**
 * Keeps the screen awake until the signal ends.
 * @param signal - ends with the player
 * @param wakeLock - the browser's wake lock (tests pass their own); left out where the browser has none
 */
export function keepAwake(signal: AbortSignal, wakeLock: WakeLockLike | undefined = (navigator as { wakeLock?: WakeLockLike }).wakeLock): void {
  if (!wakeLock) return;
  let held: { release(): Promise<void> } | null = null;
  const ask = (): void => {
    if (signal.aborted || document.visibilityState !== "visible") return;
    void wakeLock.request("screen").then((lock) => {
      // The player closed while the browser was answering: let it go at once.
      if (signal.aborted) void lock.release().catch(() => undefined);
      else held = lock;
    }).catch(() => undefined);
  };
  const release = (): void => {
    void held?.release().catch(() => undefined);
    held = null;
  };
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") ask(); else release(); }, { signal });
  signal.addEventListener("abort", release);
  ask();
}
