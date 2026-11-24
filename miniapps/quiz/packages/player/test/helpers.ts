// Shared by the player's tests: a small quiz file builder (plain data — the player never needs the
// creator's ops), a frozen new game and the place a game is at.
import type { Question, QuizFile, Round } from "@simeonts/quizzard-quiz-core/play";
import { createGame } from "../src/game/create.ts";
import type { GameState } from "../src/game/state.ts";

/** Freezes a value and everything inside it, so any mutation of a reducer's input throws. */
export function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const inner of Object.values(value)) deepFreeze(inner);
  }
  return value;
}

/** A question `q<round>.<n>` with an open answer; `seconds` gives it its own time. */
export function question(roundNumber: number, n: number, seconds?: number): Question {
  const base: Question = { id: `q${String(roundNumber)}.${String(n)}`, kind: "text", prompt: `Question ${String(n)}`, answer: { type: "open", text: `Answer ${String(n)}` } };
  return seconds === undefined ? base : { ...base, seconds };
}

/** A standard round `r<n>` with that many questions and 10 s per question. */
export function round(n: number, questions: number): Round {
  return {
    id: `r${String(n)}`,
    kind: "standard",
    name: `Round ${String(n)}`,
    defaults: { seconds: 10, points: { value: 1 }, questionKind: "text", answerType: "open" },
    questions: Array.from({ length: questions }, (_, index) => question(n, index + 1)),
  };
}

/**
 * A quiz file with the given number of questions per round, e.g. `[2, 3]`.
 * @param questionsPerRound - the rounds
 * @param teams - `settings.teams`
 */
export function quizFile(questionsPerRound: readonly number[], teams = 3): QuizFile {
  return {
    format: "quizzard-quiz",
    version: 1,
    media: [],
    quiz: { id: "quiz-1", name: "Test quiz", createdAt: "2026-11-23T10:00:00.000Z", updatedAt: "2026-11-23T10:00:00.000Z", language: "en", settings: { teams }, rounds: questionsPerRound.map((count, index) => round(index + 1, count)) },
  };
}

/** A frozen new game of {@link quizFile}. */
export function newGame(questionsPerRound: readonly number[] = [2, 1], teams = 3): GameState {
  return deepFreeze(createGame(quizFile(questionsPerRound, teams), { teamName: (n) => `Team ${String(n)}` }));
}

/** Where a game is: `"question q1.2"`, `"answer q1.1 revealed"`, `"score r1"`, `"title"`. */
export function at(state: GameState): string {
  const screen = state.screens[state.index];
  const where = [screen?.screen, screen?.questionId ?? screen?.roundId].filter((part) => part !== undefined).join(" ");
  return state.step > 0 ? `${where} revealed` : where;
}

/** The names of a game's screens in play order. */
export function screenNames(state: GameState): string[] {
  return state.screens.map((screen) => [screen.screen, screen.questionId ?? screen.roundId].filter((part) => part !== undefined).join(" "));
}
