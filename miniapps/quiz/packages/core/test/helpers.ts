// Shared by the tests: predictable ids, a small quiz builder and a deep freeze that turns any
// mutation of an op's input into a thrown error.
import { type Env, type Quiz, addQuestion, addRound, createQuiz, createRegistries, sequentialIds } from "../src/index.ts";

/** The time every test quiz is created at. */
export const NOW = "2026-11-23T10:00:00.000Z";

/** A fresh environment: its own registries and ids `x1`, `x2`, … */
export function testEnv(prefix = "x"): Env {
  return { ids: sequentialIds(prefix), registries: createRegistries() };
}

/** Freezes a value and everything inside it. */
export function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const inner of Object.values(value)) deepFreeze(inner);
  }
  return value;
}

/**
 * A frozen quiz with the given number of questions per round, e.g. `[2, 3]`; ids `x1`, `x2`, … in
 * creation order (quiz, then each round followed by its questions).
 */
export function sampleQuiz(questionsPerRound: readonly number[], env: Env = testEnv()): Quiz {
  let quiz = createQuiz({ name: "Sample", language: "en", now: NOW }, env);
  questionsPerRound.forEach((count, index) => {
    quiz = addRound(quiz, `Round ${String(index + 1)}`, env);
    const roundId = quiz.rounds.at(-1)?.id ?? "";
    for (let n = 0; n < count; n += 1) quiz = addQuestion(quiz, roundId, {}, env);
  });
  return deepFreeze(quiz);
}

/** Every question id of a quiz, in order. */
export function questionIds(quiz: Quiz): string[] {
  return quiz.rounds.flatMap((round) => round.questions.map((question) => question.id));
}

/** The round at an index; throws when the test asked for one that is not there. */
export function roundAt(quiz: Quiz, index: number): Quiz["rounds"][number] {
  const round = quiz.rounds[index];
  if (!round) throw new Error(`no round ${String(index)}`);
  return round;
}

/** The question at an index of a round; throws when it is not there. */
export function questionAt(quiz: Quiz, roundIndex: number, index: number): Quiz["rounds"][number]["questions"][number] {
  const question = roundAt(quiz, roundIndex).questions[index];
  if (!question) throw new Error(`no question ${String(index)}`);
  return question;
}
