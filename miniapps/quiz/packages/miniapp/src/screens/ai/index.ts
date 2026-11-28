// The AI windows' one door (lazy: loaded with the first press of an AI button). The library opens "Make a
// quiz with AI", the quiz "Write rounds" and "Check the answers", a standard round "Write questions"; a text
// another app shared with Quizzard opens the job its prompt was given for, with the text already pasted.
import type { App } from "../../app/state.ts";
import { checkJob } from "./check.ts";
import { addQuestionsJob, addRoundsJob, newQuizJob } from "./jobs.ts";
import { openAiWindow } from "./window.ts";

/** Which AI window. */
export type AiKind = "quiz" | "rounds" | "questions" | "check";

/**
 * Opens an AI window; `false` when its quiz or round is not open (nothing is opened).
 * @param app - the mounted creator
 * @param kind - which job
 * @param options - the round for new questions; text shared from another app
 */
export function openAi(app: App, kind: AiKind, options: { readonly roundId?: string; readonly shared?: string } = {}): boolean {
  const quiz = app.current?.quiz;
  if (kind === "quiz") {
    openAiWindow(app, (say) => newQuizJob(app, say), options.shared);
    return true;
  }
  if (!quiz) return false;
  if (kind === "rounds") openAiWindow(app, (say) => addRoundsJob(app, quiz, say), options.shared);
  else if (kind === "check") openAiWindow(app, () => checkJob(app, quiz), options.shared);
  else {
    const round = quiz.rounds.find((one) => one.id === options.roundId);
    if (!round) return false;
    openAiWindow(app, (say) => addQuestionsJob(app, quiz, round, say), options.shared);
  }
  return true;
}
