// "Apply to all questions" in the round's settings: one move that takes every question of the round
// back to the round's time and points. It only shows while some question has its own values, says
// how many will change before it does anything, and can be undone.
import { type Points, type Quiz, applyRoundDefaults, findRound, ownValueCount, setQuestionPoints, setQuestionSeconds } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { labelButton } from "../dom/controls.ts";
import { h } from "../dom/h.ts";
import { offerUndo } from "./common.ts";

/** What a question had of its own before "apply to all". */
interface Own {
  readonly id: string;
  readonly seconds?: number;
  readonly points?: Points;
}

/** Gives the questions their own values back (Undo); a question that is gone is skipped. */
function restore(quiz: Quiz, owned: readonly Own[]): Quiz {
  return owned.reduce((now, own) => {
    const timed = own.seconds === undefined ? now : setQuestionSeconds(now, own.id, own.seconds);
    return own.points === undefined ? timed : setQuestionPoints(timed, own.id, own.points);
  }, quiz);
}

/**
 * The row with "Apply to all questions"; hidden while no question of the round has its own time or points.
 * @param app - the mounted creator
 * @param roundId - the round
 * @param gist - gives the round's time and points in words, as they are now
 * @param onChange - called after the questions changed, to redraw the cards
 */
export function applyAllRow(app: App, roundId: string, gist: () => string, onChange: () => void): HTMLElement {
  const { t } = app;
  const note = h("p", { class: "quiz-hint", "data-apply-note": "" });
  const button = labelButton("reset", t("round.applyAll"), { class: "button", "data-apply-all": "" });
  const row = h("div", { class: "quiz-group quiz-apply", "data-apply": "" }, note, button);
  const round = (): ReturnType<typeof findRound> => (app.current ? findRound(app.current.quiz, roundId) : undefined);
  const sync = (): void => {
    const now = round();
    const count = now ? ownValueCount(now) : 0;
    row.hidden = count === 0;
    note.textContent = t("round.ownValues", { count });
  };
  button.addEventListener("click", () => {
    const now = round();
    const quiz = app.current?.quiz;
    if (!now || !quiz) return;
    const owned: Own[] = now.questions.filter((question) => question.seconds !== undefined || question.points !== undefined)
      .map((question) => ({ id: question.id, ...(question.seconds === undefined ? {} : { seconds: question.seconds }), ...(question.points === undefined ? {} : { points: question.points }) }));
    void app.context.shell.confirm({ title: t("round.applyTitle", { count: now.questions.length }), text: t("round.applyText", { count: owned.length, value: gist() }), confirm: t("round.applyConfirm"), cancel: t("cancel") }).then((isConfirmed) => {
      const later = app.current?.quiz;
      if (!isConfirmed || app.signal.aborted || !later || !app.change(applyRoundDefaults(later, roundId))) return;
      sync();
      onChange();
      offerUndo(app, t("round.applied", { count: owned.length }), (quizNow) => restore(quizNow, owned), () => { app.draw("[data-apply-all]"); });
    });
  });
  sync();
  return row;
}
