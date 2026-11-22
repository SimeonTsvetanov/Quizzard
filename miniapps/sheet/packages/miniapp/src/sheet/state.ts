// The mounted answer sheet's state and its saving: the model in memory, written to the mini-app's own
// storage area a moment after the last change.
import type { Lang, MiniAppContext } from "../contract.ts";
import { toSaved, type Game } from "../core/game.ts";
import type { Translate } from "../i18n/translate.ts";

/** Prefs key of the sheet inside the mini-app's storage area. */
export const SAVE_KEY = "game";
/** Typing is saved this long after the last key. */
const SAVE_DELAY_MS = 300;

/** Everything one mounted sheet needs. */
export interface Sheet {
  readonly host: HTMLElement;
  readonly context: MiniAppContext;
  readonly signal: AbortSignal;
  lang: Lang;
  t: Translate;
  game: Game;
  /** Index of the round on screen. */
  open: number;
  /** "Clear game" in the host's header; null until it is built. */
  clearButton: HTMLButtonElement | null;
  saveTimer: ReturnType<typeof setTimeout> | undefined;
  /** The "not saved" note is shown once per mount. */
  hasWarned: boolean;
}

/** Writes the sheet now (an untouched sheet removes the key) and tells the shell whether a game is on. */
export function saveNow(sheet: Sheet): void {
  clearTimeout(sheet.saveTimer);
  sheet.saveTimer = undefined;
  const { prefs } = sheet.context.storage;
  const saved = toSaved(sheet.game);
  sheet.context.shell.setBusy(saved !== null); // no update offer in the middle of a game
  if (saved === null) {
    prefs.remove(SAVE_KEY);
    return;
  }
  const isKept = prefs.set(SAVE_KEY, saved);
  if (isKept) sheet.context.storage.notifySaved();
  else if (!sheet.hasWarned) {
    sheet.hasWarned = true;
    sheet.context.shell.toast(sheet.t("notSaved"), { tone: "error" });
  }
}

/** Writes the sheet shortly after the last change. */
export function saveSoon(sheet: Sheet): void {
  clearTimeout(sheet.saveTimer);
  sheet.saveTimer = setTimeout(() => { saveNow(sheet); }, SAVE_DELAY_MS);
}
