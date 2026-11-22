// Persistent storage (SPEC F15, PLAN §1.4): the hook a mini-app's `context.storage.notifySaved()`
// reaches. T-06 wires the call; PLAN T-15 fills the body (ask the browser once, after the first save).

/**
 * Records that a mini-app saved data on this device.
 * @remarks Intentionally does nothing yet: asking for persistent storage once per origin is PLAN
 * T-15, which changes only this function — every `notifySaved()` of every context already calls it.
 */
export function noteDataSaved(): void {
  // Intentionally empty until PLAN T-15 (see @remarks).
}
