// What can be done with a question from its card, its compact row, its "More" list and the editor:
// move it (one place, to an end, by a drag, to another round), duplicate it, delete it with Undo,
// preview it, play from it. Every move reads the question as it is in the quiz right now — a card
// outlives edits made elsewhere on the screen.
import { MAX_QUESTIONS_PER_ROUND, type Question, type Quiz, type Round, deleteQuestion, duplicateQuestion, findQuestion, findRound, moveQuestion } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { drawSliding, offerUndo, withQuestion } from "./common.ts";
import { playQuiz } from "./launch.ts";

/** What a card needs to know about its place. */
export interface CardPlace {
  readonly quiz: Quiz;
  readonly round: Round;
  readonly question: Question;
  readonly index: number;
}

/** The attribute that carries a question's id on its card or row. */
export const QUESTION_ATTRIBUTE = "data-question";

/**
 * A question as it is in the quiz right now.
 * @param app - the mounted creator
 * @param questionId - the question
 */
export function placeOf(app: App, questionId: string): CardPlace | undefined {
  const quiz = app.current?.quiz;
  const found = quiz ? findQuestion(quiz, questionId) : undefined;
  return quiz && found ? { quiz, ...found } : undefined;
}

/** Where the focus goes after a card is gone: the card that took its place, else "Add question". */
function focusAfter(round: Round, index: number): string {
  const next = round.questions[index + 1] ?? round.questions[index - 1];
  return next ? `[data-focus="question:${next.id}"]` : "[data-add-question]";
}

/**
 * Moves a question inside its round; the cards slide to their new places.
 * @param app - the mounted creator
 * @param questionId - the question
 * @param to - its new index
 * @param focus - what to focus on its card afterwards (a selector inside the card)
 */
export function moveTo(app: App, questionId: string, to: number, focus = "[data-drag]"): void {
  const now = placeOf(app, questionId);
  if (now && app.change(moveQuestion(now.quiz, questionId, now.round.id, to))) drawSliding(app, QUESTION_ATTRIBUTE, `[${QUESTION_ATTRIBUTE}="${questionId}"] ${focus}`);
}

/**
 * Moves a question to another round (at its end) and says so, with Undo.
 * @param app - the mounted creator
 * @param questionId - the question
 * @param roundId - the round it goes to
 * @returns `false` when that round is full (said in a toast) or nothing changed
 */
export function moveToRound(app: App, questionId: string, roundId: string): boolean {
  const { t } = app;
  const now = placeOf(app, questionId);
  const target = now ? findRound(now.quiz, roundId) : undefined;
  if (!now || !target || target === now.round) return false;
  if (!app.change(moveQuestion(now.quiz, questionId, roundId))) {
    app.context.shell.toast(t("question.full", { max: MAX_QUESTIONS_PER_ROUND }));
    return false;
  }
  const { round, index } = now;
  const isEditor = app.route.screen === "editor";
  app.draw(isEditor ? "[data-move-round]" : focusAfter(round, index));
  offerUndo(app, t("question.moved", { n: index + 1, round: target.name }), (quiz) => moveQuestion(quiz, questionId, round.id, index), () => { app.draw(isEditor ? "[data-move-round]" : `[data-focus="question:${questionId}"]`); });
  return true;
}

/**
 * Duplicates a question: the copy stands right after it.
 * @param app - the mounted creator
 * @param questionId - the question
 * @returns the copy's id, or `undefined` when the round is full (said in a toast)
 */
export function duplicate(app: App, questionId: string): string | undefined {
  const now = placeOf(app, questionId);
  if (!now) return undefined;
  const next = duplicateQuestion(now.quiz, questionId, app.env);
  if (!app.change(next)) {
    app.context.shell.toast(app.t("question.full", { max: MAX_QUESTIONS_PER_ROUND }));
    return undefined;
  }
  return findRound(next, now.round.id)?.questions[now.index + 1]?.id;
}

/**
 * Deletes a question at once (one tap, one card) and offers Undo, which puts exactly it back.
 * @param app - the mounted creator
 * @param questionId - the question
 * @param after - shows what is left (the card: the round again; the editor: the way up)
 */
export function remove(app: App, questionId: string, after: (focus: string) => void = (focus) => { app.draw(focus); }): void {
  const now = placeOf(app, questionId);
  if (!now || !app.change(deleteQuestion(now.quiz, questionId))) return;
  const { round, question, index } = now;
  after(focusAfter(round, index));
  offerUndo(app, app.t("question.deleted", { n: index + 1 }), (quiz) => withQuestion(quiz, round.id, question, index), () => {
    if (app.route.screen === "round" || app.route.screen === "quiz") app.draw(`[data-focus="question:${question.id}"]`);
  });
}

/**
 * Opens the preview on a question.
 * @param app - the mounted creator
 * @param questionId - the question
 */
export function preview(app: App, questionId: string): void {
  if (app.current) app.go({ screen: "preview", quiz: app.current.quiz.id, question: questionId });
}

/**
 * Opens the editor on a question.
 * @param app - the mounted creator
 * @param questionId - the question
 * @param mode - a new history entry (from a card) or the same one (from the editor's own arrows)
 * @param focus - what to focus there; the screen's title by default
 */
export function edit(app: App, questionId: string, mode: "push" | "replace" = "push", focus: string | null = null): void {
  if (!app.current) return;
  app.view.drafts.clear();
  app.go({ screen: "editor", quiz: app.current.quiz.id, question: questionId }, mode, focus);
}

/**
 * Starts Play at a question.
 * @param app - the mounted creator
 * @param questionId - the question
 */
export function playFrom(app: App, questionId: string): void {
  playQuiz(app, questionId);
}
