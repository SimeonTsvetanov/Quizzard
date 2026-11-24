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

/**
 * A move as the window that asks sees it: `next` and `back` say whether that window shows a wide
 * stage, where the parts an upright screen walks through one by one are all on show (game/step.ts).
 * @param action - the move
 * @param isWide - whether the asking window's stage is wide (the host panel counts as wide)
 */
export function shaped(action: GameAction, isWide: boolean): GameAction {
  return (action.type === "next" || action.type === "back") && action.wide === undefined ? { ...action, wide: isWide } : action;
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
  KeyP: (commands) => { commands.dispatch({ type: "media", command: "toggle" }); },
  KeyZ: (commands) => { commands.dispatch({ type: "media", command: "zoom" }); },
  Escape: (commands) => { commands.dispatch({ type: "media", command: "unzoom" }); },
  KeyB: (commands) => { commands.dispatch({ type: "black" }); },
  KeyM: (commands) => { commands.openMenu(); },
  KeyS: (commands) => { commands.openScores(); },
  KeyF: (commands) => { commands.toggleFullscreen(); },
};

/** The keys that open the menu and the scores: pressed inside a dialog they close it (or open the other one). */
const DIALOG_KEYS: ReadonlySet<string> = new Set(["KeyM", "KeyS"]);

/** Whether a key press belongs to the element it happened in: typing in a field, Space on a button, anything in a dialog. */
function isTaken(event: KeyboardEvent): boolean {
  const target = event.target;
  if (!(target instanceof Element)) return false;
  if (target.closest("input, textarea, select, [contenteditable]") !== null) return true;
  // In a dialog only the dialogs' own keys work — M and S close the one they opened, or swap to the other.
  if (target.closest("dialog") !== null) return !DIALOG_KEYS.has(event.code);
  return (event.code === "Space" || event.code === "Enter") && target.closest("button, a, summary") !== null;
}

/**
 * Listens for the player's keys: Space/→/Page Down next, ←/Page Up back (a clicker sends the Page
 * keys), T timer, R restart the timer, P play or pause the clip, Z zoom the picture or the video
 * (Escape leaves the zoom), B black screen, M menu, S scores, F full screen.
 * @param commands - what the keys do
 * @param signal - stops listening
 */
export function listenKeys(commands: Commands, signal: AbortSignal): void {
  window.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented || isTaken(event)) return;
    const run = KEYS[event.code];
    if (!run) return;
    // Escape only leaves the zoom, and stays whatever else it is to the page.
    if (event.code !== "Escape") event.preventDefault();
    run(commands);
  }, { signal });
}
