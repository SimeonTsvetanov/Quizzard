// What the host can do besides the game's own moves, as one object the control bar, the keys, the
// menu and the host panel all call — so a button and its key always do the same.
import type { GameAction } from "../game/state.ts";

/** The host's commands. */
export interface Commands {
  /** Makes a move of the game. */
  readonly dispatch: (action: GameAction) => void;
  readonly openMenu: () => void;
  readonly openScores: () => void;
  readonly toggleFullscreen: () => void;
  /** Opens the audience window, or closes it when it is open. */
  readonly toggleAudience: () => void;
  /** Leaves the player (in the app: back to the quiz); `null` where there is nowhere to go. */
  readonly exit: (() => void) | null;
}

/**
 * Full screen on or off for an element; a browser that refuses is not an error.
 * @param target - the element shown full screen
 */
export function toggleFullscreen(target: HTMLElement): void {
  if (document.fullscreenElement !== null) {
    void document.exitFullscreen().catch(() => undefined);
    return;
  }
  // Optional call: iPhone Safari has no element full screen.
  void (target.requestFullscreen as (() => Promise<void>) | undefined)?.call(target).catch(() => undefined);
}

/** The keys of the player by their place on the keyboard (`KeyboardEvent.code`), so they work in a Cyrillic layout too. */
const KEYS: Readonly<Record<string, (commands: Commands) => void>> = {
  Space: (commands) => { commands.dispatch({ type: "next" }); },
  ArrowRight: (commands) => { commands.dispatch({ type: "next" }); },
  PageDown: (commands) => { commands.dispatch({ type: "next" }); },
  ArrowLeft: (commands) => { commands.dispatch({ type: "back" }); },
  PageUp: (commands) => { commands.dispatch({ type: "back" }); },
  KeyT: (commands) => { commands.dispatch({ type: "timerToggle" }); },
  KeyR: (commands) => { commands.dispatch({ type: "timerReset" }); },
  KeyM: (commands) => { commands.openMenu(); },
  KeyS: (commands) => { commands.openScores(); },
  KeyF: (commands) => { commands.toggleFullscreen(); },
};

/** Whether a key press belongs to the element it happened in: typing in a field, Space on a button, anything in a dialog. */
function isTaken(event: KeyboardEvent): boolean {
  const target = event.target;
  if (!(target instanceof Element)) return false;
  if (target.closest("input, textarea, select, [contenteditable], dialog") !== null) return true;
  return (event.code === "Space" || event.code === "Enter") && target.closest("button, a, summary") !== null;
}

/**
 * Listens for the player's keys: Space/→ next, ← back, T timer, R restart the timer, M menu,
 * S scores, F full screen.
 * @param commands - what the keys do
 * @param signal - stops listening
 */
export function listenKeys(commands: Commands, signal: AbortSignal): void {
  window.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented || isTaken(event)) return;
    const run = KEYS[event.code];
    if (!run) return;
    event.preventDefault();
    run(commands);
  }, { signal });
}
