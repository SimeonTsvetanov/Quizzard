// What can be done with a round from its card, its header and its settings: move it, duplicate it,
// delete it (asks when it has questions, then offers Undo), preview it or play from it.
import { MAX_ROUNDS, type Quiz, type Round, deleteRound, duplicateRound, moveRound } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { drawSliding, isWide, offerUndo, up, withRound } from "./common.ts";
import { playQuiz } from "./launch.ts";

/** The attribute that carries a round's id on its card. */
export const ROUND_ATTRIBUTE = "data-round-card";

/** The open round's title: where the focus goes when a round opens, so it is announced on every width. */
export const ROUND_TITLE = "#quiz-round-title";

/**
 * A round as it is in the quiz right now.
 * @param app - the mounted creator
 * @param roundId - the round
 */
export function liveRound(app: App, roundId: string): { quiz: Quiz; round: Round; index: number } | undefined {
  const quiz = app.current?.quiz;
  const index = quiz ? quiz.rounds.findIndex((candidate) => candidate.id === roundId) : -1;
  const round = quiz?.rounds[index];
  return quiz && round ? { quiz, round, index } : undefined;
}

/**
 * Opens a round: a page of its own on a phone, the right pane on a wide screen (no new history entry there).
 * @param app - the mounted creator
 * @param roundId - the round
 * @param focus - what to focus there; the round's title by default, so the change is announced
 */
export function openRound(app: App, roundId: string, focus = ROUND_TITLE): void {
  const quiz = app.current?.quiz;
  if (!quiz) return;
  app.view.lastRound = roundId;
  const isPane = isWide() || app.route.screen === "round";
  app.go({ screen: "round", quiz: quiz.id, round: roundId }, isPane && app.nav.depth() >= 1 ? "replace" : "push", focus);
}

/**
 * Moves a round; the cards slide to their new places.
 * @param app - the mounted creator
 * @param roundId - the round
 * @param to - its new index
 * @param focus - what to focus on its card afterwards (a selector inside the card)
 */
export function moveRoundTo(app: App, roundId: string, to: number, focus = "[data-drag]"): void {
  const now = app.current?.quiz;
  if (now && app.change(moveRound(now, roundId, to))) drawSliding(app, ROUND_ATTRIBUTE, `[${ROUND_ATTRIBUTE}="${roundId}"] ${focus}`);
}

/**
 * Duplicates a round and opens the copy.
 * @param app - the mounted creator
 * @param roundId - the round
 */
export function copyRound(app: App, roundId: string): void {
  const now = liveRound(app, roundId);
  if (!now) return;
  const next = duplicateRound(now.quiz, roundId, app.env);
  if (!app.change(next)) {
    app.context.shell.toast(app.t("round.full", { max: MAX_ROUNDS }));
    return;
  }
  const copy = next.rounds[now.index + 1];
  if (copy) openRound(app, copy.id);
}

/**
 * Deletes a round: asks first when it has questions, then offers Undo.
 * @param app - the mounted creator
 * @param roundId - the round
 */
export async function removeRound(app: App, roundId: string): Promise<void> {
  const { t } = app;
  const now = liveRound(app, roundId);
  if (!now) return;
  const { quiz, round, index } = now;
  if (round.questions.length > 0) {
    const isConfirmed = await app.context.shell.confirm({ title: t("round.deleteTitle", { name: round.name }), text: t("round.deleteText", { count: round.questions.length }), confirm: t("round.deleteConfirm"), cancel: t("cancel"), danger: true });
    if (!isConfirmed || app.signal.aborted) return;
  }
  if (!app.change(deleteRound(quiz, roundId))) return;
  // The round that took its place is shown (wide) and gets the focus; with none left, "Add round".
  const neighbour = quiz.rounds[index + 1] ?? quiz.rounds[index - 1];
  const wasShown = app.view.lastRound === roundId || (app.route.screen === "round" && app.route.round === roundId);
  if (wasShown) app.view.lastRound = neighbour?.id ?? null;
  const focus = neighbour ? `[data-focus="round:${neighbour.id}"]` : "[data-add-round]";
  if (app.route.screen === "round" && app.route.round === roundId && app.nav.depth() >= 2) up(app);
  else if (app.route.screen === "round" && app.route.round !== roundId) app.draw(focus);
  else app.go({ screen: "quiz", quiz: quiz.id }, "replace", focus);
  offerUndo(app, t("round.deleted", { name: round.name }), (later) => withRound(later, round, index), () => { app.go({ screen: "round", quiz: quiz.id, round: roundId }, "replace"); });
}

/**
 * Opens the preview on a round's first question.
 * @param app - the mounted creator
 * @param round - the round
 */
export function previewRound(app: App, round: Round): void {
  const first = round.questions[0];
  if (app.current && first) app.go({ screen: "preview", quiz: app.current.quiz.id, question: first.id });
}

/**
 * Starts Play at a round.
 * @param app - the mounted creator
 * @param roundId - the round
 */
export function playFromRound(app: App, roundId: string): void {
  playQuiz(app, roundId);
}
