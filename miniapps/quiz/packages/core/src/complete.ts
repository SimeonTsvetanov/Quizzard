// Which questions of a quiz are not finished yet (no text or file, or no answer): the creator shows
// their number on the round and the quiz, and asks before a quiz with some of them is played or
// exported. A question of a kind or answer type this version does not know is not counted — it is
// kept as it is and cannot be finished here.
import type { Question, Quiz, Round } from "./model.ts";
import { type Registries, defaultRegistries, isComplete } from "./registries.ts";

/** An unfinished question and where it is. */
export interface Unfinished {
  readonly round: Round;
  readonly question: Question;
  /** The round's index in the quiz. */
  readonly roundIndex: number;
  /** The question's index in its round. */
  readonly index: number;
}

function isKnown(question: Question, registries: Registries): boolean {
  return registries.kinds.has(question.kind) && registries.answers.has(question.answer.type);
}

/**
 * How many questions of a round are not finished.
 * @param round - the round
 * @param registries - the kinds and answer types this version knows
 */
export function unfinishedCount(round: Round, registries: Registries = defaultRegistries): number {
  return round.questions.filter((question) => isKnown(question, registries) && !isComplete(question, registries)).length;
}

/**
 * Every unfinished question of a quiz, in play order.
 * @param quiz - the quiz
 * @param registries - the kinds and answer types this version knows
 */
export function unfinishedQuestions(quiz: Quiz, registries: Registries = defaultRegistries): readonly Unfinished[] {
  return quiz.rounds.flatMap((round, roundIndex) =>
    round.questions.flatMap((question, index) => (isKnown(question, registries) && !isComplete(question, registries) ? [{ round, question, roundIndex, index }] : [])));
}
