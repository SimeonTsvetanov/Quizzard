// What a question is played with (SPEC F5): its own time and points, or its round's. Apart from
// ops.ts so the player (through `play.ts`) can import it without the creator's edits and without Zod.
import type { Points, Question, Round } from "./model.ts";

/**
 * The time a question is played with: its own, or the round's (SPEC F5).
 * @param round - the question's round
 * @param question - the question
 */
export function effectiveSeconds(round: Round, question: Question): number {
  return question.seconds ?? round.defaults.seconds;
}

/**
 * The points a question is played for: its own, or the round's (SPEC F5).
 * @param round - the question's round
 * @param question - the question
 */
export function effectivePoints(round: Round, question: Question): Points {
  return question.points ?? round.defaults.points;
}
