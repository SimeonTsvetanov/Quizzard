// A game that was left continues where it was — with its points. Whoever opens it to try the quiz
// again is told so at once and gets "Start again" on the same strip Undo uses (Moni 2026-11-24: the
// points of the last try were still there and the way to clear them was three taps into the menu).
import { restore } from "../game/save.ts";
import type { GameAction, GameState } from "../game/state.ts";
import type { Translate } from "../i18n/translate.ts";
import { pointsAtStake } from "./guards.ts";
import type { UndoStrip } from "./undo.ts";

/** What {@link offerRestart} needs of the session. */
export interface ResumeOptions {
  readonly state: GameState;
  /** What the page kept of the last game, as read from its storage. */
  readonly saved: unknown;
  readonly undo: UndoStrip;
  readonly t: Translate;
  readonly dispatch: (action: GameAction) => void;
}

/**
 * Offers "Start again" when the game on the stage is a continued one (past its first screen, or with points).
 * @param options - the game, what was saved, the strip and the words
 */
export function offerRestart({ state, saved, undo, t, dispatch }: ResumeOptions): void {
  const last = restore(state, saved);
  if (last.index === 0 && pointsAtStake(last).points <= 0) return;
  undo.offer(t("resume.note"), () => { dispatch({ type: "restart" }); }, t("resume.restart"));
}
