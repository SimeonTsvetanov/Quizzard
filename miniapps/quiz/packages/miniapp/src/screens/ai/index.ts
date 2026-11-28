// The AI windows' one door (lazy: loaded with the first press of an AI button). The library opens "Make a
// quiz with AI", the quiz "Add rounds" and "Check the answers", a standard round "Add questions", and a
// text another app shared with Quizzard opens "Make a quiz with AI" with that text already pasted.
import type { App } from "../../app/state.ts";
import { addQuestionsJob, addRoundsJob, checkJob, newQuizJob } from "./jobs.ts";
import { openAiWindow } from "./window.ts";

/** Which AI window. */
export type AiKind = "quiz" | "rounds" | "questions" | "check";

/**
 * Opens an AI window.
 * @param app - the mounted creator
 * @param kind - which job
 * @param options - the round for new questions; text shared from another app for a new quiz
 */
export function openAi(app: App, kind: AiKind, options: { readonly roundId?: string; readonly shared?: string } = {}): void {
  const quiz = app.current?.quiz;
  if (kind === "quiz") {
    openAiWindow(app, newQuizJob(app, options.shared));
    return;
  }
  if (!quiz) return;
  if (kind === "rounds") openAiWindow(app, addRoundsJob(app, quiz));
  else if (kind === "check") openAiWindow(app, checkJob(app, quiz));
  else {
    const round = quiz.rounds.find((one) => one.id === options.roundId);
    if (round) openAiWindow(app, addQuestionsJob(app, quiz, round));
  }
}
