// One question in its round: a 16:9 mini slide drawn by the shared renderer (the card IS the
// question as it will be played), and under it its number, kind chip, time and points — in the
// accent when they are the question's own — and what can be done with it.
import { MAX_QUESTIONS_PER_ROUND, type Question, type Quiz, type Round, deleteQuestion, duplicateQuestion, effectivePoints, effectiveSeconds, findQuestion, isComplete, moveQuestion } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { iconButton } from "../dom/controls.ts";
import { h } from "../dom/h.ts";
import { icon } from "../dom/icons.ts";
import { slideLabels } from "../format.ts";
import { pointsText, renderSlide } from "../render/slide.ts";
import { canShow } from "../ui-registry.ts";
import { offerUndo, questionName, withQuestion } from "./common.ts";

/** What a card needs to know about its place. */
export interface CardPlace {
  readonly quiz: Quiz;
  readonly round: Round;
  readonly question: Question;
  readonly index: number;
}

/** The card's question as it is in the quiz right now: a card outlives edits made elsewhere on the screen. */
function fresh(app: App, questionId: string): CardPlace | undefined {
  const quiz = app.current?.quiz;
  const found = quiz ? findQuestion(quiz, questionId) : undefined;
  return quiz && found ? { quiz, ...found } : undefined;
}

/** Where the focus goes after a card is gone: the card that took its place, else "Add question". */
function focusAfter(round: Round, index: number): string {
  const next = round.questions[index + 1] ?? round.questions[index - 1];
  return next ? `[data-focus="question:${next.id}"]` : "[data-add-question]";
}

/** Deletes the question at once (one tap, one card) and offers Undo, which puts exactly it back. */
function remove(app: App, questionId: string): void {
  const now = fresh(app, questionId);
  if (!now || !app.change(deleteQuestion(now.quiz, questionId))) return;
  const { round, question, index } = now;
  app.draw(focusAfter(round, index));
  offerUndo(app, app.t("question.deleted", { n: index + 1 }), (quiz) => withQuestion(quiz, round.id, question, index), () => { app.draw(`[data-focus="question:${question.id}"]`); });
}

function actions(app: App, { round, question, index }: CardPlace): HTMLElement {
  const { t } = app;
  const n = index + 1;
  const move = (to: number, button: string): void => {
    const now = fresh(app, question.id);
    if (now && app.change(moveQuestion(now.quiz, question.id, round.id, to))) app.draw(`[data-question="${question.id}"] [data-move="${button}"]`);
  };
  const last = round.questions.length - 1;
  const up = iconButton("up", t("question.moveUp", { n }), { "data-move": "up" });
  const down = iconButton("down", t("question.moveDown", { n }), { "data-move": "down" });
  up.disabled = index === 0;
  down.disabled = index === last;
  up.addEventListener("click", () => { move(index - 1, index - 1 === 0 ? "down" : "up"); });
  down.addEventListener("click", () => { move(index + 1, index + 1 === last ? "up" : "down"); });
  const copy = iconButton("copy", t("question.duplicate", { n }));
  copy.addEventListener("click", () => {
    const now = fresh(app, question.id);
    if (!now) return;
    if (app.change(duplicateQuestion(now.quiz, question.id, app.env))) app.draw(`[data-focus="question:${question.id}"]`);
    else app.context.shell.toast(t("question.full", { max: MAX_QUESTIONS_PER_ROUND }));
  });
  const preview = iconButton("eye", t("question.preview", { n }), { "data-preview": "" });
  preview.addEventListener("click", () => { if (app.current) app.go({ screen: "preview", quiz: app.current.quiz.id, question: question.id }); });
  const trash = iconButton("trash", t("question.delete", { n }), { class: "quiz-danger", "data-delete-question": "" });
  trash.addEventListener("click", () => { remove(app, question.id); });
  return h("div", { class: "quiz-qcard-actions" }, up, down, copy, preview, trash);
}

/** Number, kind chip, time and points; a value that is the question's own is marked. */
function facts(app: App, { round, question, index }: CardPlace): HTMLElement {
  const { t, lang } = app;
  const labels = slideLabels(t, lang);
  const kind = app.ui.kinds.get(question.kind);
  const chip = h("span", { class: "quiz-kind", "data-tone": kind?.tone ?? "none" }, icon(kind?.icon ?? "unknown", 16), h("span", {}, kind ? t(kind.label) : question.kind));
  const time = h("span", { class: "quiz-fact", ...(question.seconds === undefined ? {} : { "data-own": "" }) }, icon("time", 16), h("span", {}, labels.seconds(effectiveSeconds(round, question))));
  const points = h("span", { class: "quiz-fact", ...(question.points === undefined ? {} : { "data-own": "" }) }, icon("points", 16), h("span", {}, pointsText(effectivePoints(round, question), labels)));
  const row = h("div", { class: "quiz-qcard-facts" }, h("span", { class: "quiz-qcard-number", "aria-hidden": "true" }, String(index + 1)), chip, time, points);
  if (!canShow(question, app.ui)) row.append(h("span", { class: "quiz-flag" }, t("question.unsupported")));
  else if (!isComplete(question, app.env.registries)) row.append(h("span", { class: "quiz-flag" }, t("question.unfinished")));
  return row;
}

/**
 * Draws one question card.
 * @param app - the mounted creator
 * @param place - the question with its round, quiz and index
 */
export function questionCard(app: App, place: CardPlace): HTMLElement {
  const { quiz, round, question, index } = place;
  const slide = renderSlide({ question, round, number: index + 1, reveal: false, ui: app.ui, labels: slideLabels(app.t, app.lang) });
  // The mini slide is a picture of the question: the button's name says it in words.
  const thumb = h("span", { class: "quiz-thumb", "aria-hidden": "true" }, slide);
  const open = h("button", { type: "button", class: "quiz-qcard-open", "data-focus": `question:${question.id}` }, h("span", { class: "visually-hidden" }, questionName(app, question, index + 1)), thumb);
  open.addEventListener("click", () => {
    app.view.drafts.clear();
    app.go({ screen: "editor", quiz: quiz.id, question: question.id });
  });
  return h("li", { class: "quiz-qcard", "data-question": question.id, "data-tone": app.ui.kinds.get(question.kind)?.tone ?? "none" }, open, facts(app, place), actions(app, place));
}
