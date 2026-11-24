// Starting Play, and the check before a quiz is played or exported (UX review S9): a question
// without a text or an answer would stand on the projector as "…". When some are unfinished the
// creator says how many, lists them with a way to each, and lets the person go on anyway.
import { unfinishedQuestions } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";

/** What is about to happen to the quiz. */
export type Launch = "play" | "export";

/**
 * Runs `go` at once for a finished quiz; else asks first, with the list of unfinished questions.
 * @param app - the mounted creator
 * @param what - playing or exporting (the words of the question)
 * @param go - what to do when the quiz is finished or the person goes on anyway
 */
export function checkUnfinished(app: App, what: Launch, go: () => void): void {
  const quiz = app.current?.quiz;
  const list = quiz ? unfinishedQuestions(quiz, app.env.registries) : [];
  if (list.length === 0) {
    go();
    return;
  }
  void import("./unfinished.ts").then(({ askUnfinished }) => { if (!app.signal.aborted) askUnfinished(app, list, what, go); }).catch(() => { if (!app.signal.aborted) go(); });
}

/**
 * Opens Play — at the place the game is, or at a round or question ("Play from here").
 * @param app - the mounted creator
 * @param from - the id of the round or question to start at
 */
export function playQuiz(app: App, from?: string): void {
  const quiz = app.current?.quiz;
  if (!quiz) return;
  checkUnfinished(app, "play", () => { app.go({ screen: "play", quiz: quiz.id, ...(from === undefined ? {} : { from }) }); });
}
