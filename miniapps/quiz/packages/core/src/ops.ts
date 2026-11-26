// Pure edits of a quiz and its rounds, lookups and totals. Data in, data out (PLAN §2 rule 3): every
// function returns a new quiz and never changes its argument, so Undo is "keep the previous value".
// An edit that cannot be done (unknown id, a limit reached) returns the SAME quiz object — callers
// can tell with `next === quiz`. None of this reads a kind or a type name.
import { type IdSource, randomId } from "./ids.ts";
import * as limits from "./limits.ts";
import { QUIZ_FORMAT, QUIZ_VERSION, type MediaEntry, type Points, type Question, type Quiz, type QuizFile, type Round, type RoundDefaults, makePoints } from "./model.ts";
import { effectiveSeconds } from "./effective.ts";
import { type Registries, defaultRegistries, shapeOf } from "./registries.ts";

export { effectivePoints, effectiveSeconds } from "./effective.ts";

/** What the ops need from outside: new ids and the registries. Passed last; tests pass their own. */
export interface Env {
  readonly ids: IdSource;
  readonly registries: Registries;
}

/** Random ids and the app's shared registries. */
export const defaultEnv: Env = { ids: randomId, registries: defaultRegistries };

/** Where a question is: its round and its place in it. */
export interface QuestionPlace {
  readonly round: Round;
  readonly question: Question;
  readonly index: number;
}

/**
 * A copy of an object without one of its optional fields (how a question goes back to "from the round").
 * @param value - the object
 * @param key - the field to leave out
 */
export function without<T extends object, K extends keyof T>(value: T, key: K): Omit<T, K> {
  return Object.fromEntries(Object.entries(value).filter(([name]) => name !== key)) as Omit<T, K>;
}

/**
 * A copy of a list with one item moved; the target index is clamped into the list.
 * @param list - the list
 * @param from - the item's index
 * @param to - where it should be afterwards
 */
export function moveItem<T>(list: readonly T[], from: number, to: number): readonly T[] {
  const item = list[from];
  if (item === undefined) return list;
  const rest = list.filter((_, index) => index !== from);
  const target = limits.clamp(Math.trunc(to), 0, rest.length);
  return [...rest.slice(0, target), item, ...rest.slice(target)];
}

/**
 * A new, empty quiz.
 * @param input - its name, the player's language and the current time (ISO 8601)
 * @param env - gives the id
 */
export function createQuiz(input: { readonly name: string; readonly language: string; readonly now: string }, env: Env = defaultEnv): Quiz {
  return {
    id: env.ids(),
    name: limits.cut(input.name, limits.QUIZ_NAME_MAX),
    createdAt: input.now,
    updatedAt: input.now,
    language: input.language,
    rounds: [],
    settings: { teams: limits.DEFAULT_TEAMS },
  };
}

/**
 * Wraps a quiz in the versioned file every store and export writes.
 * @param quiz - the quiz
 * @param media - the descriptions of its files
 */
export function toFile(quiz: Quiz, media: readonly MediaEntry[] = []): QuizFile {
  return { format: QUIZ_FORMAT, version: QUIZ_VERSION, quiz, media };
}

/**
 * Renames the quiz (cut to the longest allowed name).
 * @param quiz - the quiz
 * @param name - the new name
 */
export function renameQuiz(quiz: Quiz, name: string): Quiz {
  return { ...quiz, name: limits.cut(name, limits.QUIZ_NAME_MAX) };
}

/**
 * Sets the number of teams the player starts with (2–12).
 * @param quiz - the quiz
 * @param teams - the wanted number
 */
export function setTeams(quiz: Quiz, teams: number): Quiz {
  return { ...quiz, settings: { ...quiz.settings, teams: limits.clamp(Math.round(teams), limits.MIN_TEAMS, limits.MAX_TEAMS) } };
}

/**
 * Stamps the time of the last change; the ops do not, because they have no clock.
 * @param quiz - the quiz
 * @param now - the current time (ISO 8601)
 */
export function touch(quiz: Quiz, now: string): Quiz {
  return { ...quiz, updatedAt: now };
}

/** A copy of a round with new ids for it and for each of its questions. */
function copyRound(round: Round, ids: IdSource): Round {
  return { ...round, id: ids(), questions: round.questions.map((question) => ({ ...question, id: ids() })) };
}

/**
 * A copy of the quiz for the library's "Duplicate": new ids throughout, the same media files.
 * @param quiz - the quiz to copy
 * @param input - the copy's name and the current time
 * @param env - gives the ids
 */
export function duplicateQuiz(quiz: Quiz, input: { readonly name: string; readonly now: string }, env: Env = defaultEnv): Quiz {
  const copy = { ...quiz, id: env.ids(), createdAt: input.now, updatedAt: input.now, rounds: quiz.rounds.map((round) => copyRound(round, env.ids)) };
  return renameQuiz(copy, input.name);
}

/**
 * The round of this id.
 * @param quiz - the quiz
 * @param roundId - the round's id
 */
export function findRound(quiz: Quiz, roundId: string): Round | undefined {
  return quiz.rounds.find((round) => round.id === roundId);
}

/**
 * The question of this id with its round and index.
 * @param quiz - the quiz
 * @param questionId - the question's id
 */
export function findQuestion(quiz: Quiz, questionId: string): QuestionPlace | undefined {
  for (const round of quiz.rounds) {
    const index = round.questions.findIndex((question) => question.id === questionId);
    const question = round.questions[index];
    if (question) return { round, question, index };
  }
  return undefined;
}

/**
 * Replaces one round by what `change` returns; the same quiz when the round does not exist or did not change.
 * @param quiz - the quiz
 * @param roundId - the round to change
 * @param change - returns the new round
 */
export function changeRound(quiz: Quiz, roundId: string, change: (round: Round) => Round): Quiz {
  const round = findRound(quiz, roundId);
  if (!round) return quiz;
  const next = change(round);
  if (next === round) return quiz;
  return { ...quiz, rounds: quiz.rounds.map((candidate) => (candidate === round ? next : candidate)) };
}

/**
 * Whether one more round fits.
 * @param quiz - the quiz
 */
export function canAddRound(quiz: Quiz): boolean {
  return quiz.rounds.length < limits.MAX_ROUNDS;
}

/** The defaults of a quiz's first round. */
function firstDefaults(registries: Registries): RoundDefaults {
  return {
    seconds: limits.DEFAULT_SECONDS,
    points: { value: limits.DEFAULT_POINTS },
    questionKind: registries.kinds.list()[0]?.id ?? "",
    answerType: registries.answers.list()[0]?.id ?? "",
  };
}

/**
 * Adds a standard round at the end (find it as the last of `rounds`). It starts with the defaults of the
 * last free round before it (a special round's are its own), so a quiz with its own timing is not set
 * up again for every round. Special rounds: `addRoundOfKind`.
 * @param quiz - the quiz
 * @param name - the round's name (the caller's "Round 3" — the core has no texts)
 * @param env - gives the id and, for a first round, the first registered kinds
 */
export function addRound(quiz: Quiz, name: string, env: Env = defaultEnv): Quiz {
  const kind = env.registries.rounds.list()[0];
  if (!canAddRound(quiz) || !kind) return quiz;
  const round: Round = {
    id: env.ids(),
    kind: kind.id,
    name: limits.cut(name, limits.ROUND_NAME_MAX),
    defaults: quiz.rounds.findLast((before) => !shapeOf(before, env.registries))?.defaults ?? firstDefaults(env.registries),
    questions: [],
  };
  return { ...quiz, rounds: [...quiz.rounds, round] };
}

/**
 * Renames a round.
 * @param quiz - the quiz
 * @param roundId - the round
 * @param name - the new name
 */
export function renameRound(quiz: Quiz, roundId: string, name: string): Quiz {
  return changeRound(quiz, roundId, (round) => ({ ...round, name: limits.cut(name, limits.ROUND_NAME_MAX) }));
}

/**
 * Sets or, with an empty text, removes the rules shown before the round.
 * @param quiz - the quiz
 * @param roundId - the round
 * @param rules - the rules text
 */
export function setRoundRules(quiz: Quiz, roundId: string, rules: string): Quiz {
  return changeRound(quiz, roundId, (round) => (rules.trim() === "" ? without(round, "rules") : { ...round, rules: limits.cut(rules, limits.RULES_MAX) }));
}

/**
 * Sets how a round is played: its answers one slide each or all at once, and whether it moves on by itself.
 * A value that is the usual one (one by one; by itself) is not kept on the round.
 * @param quiz - the quiz
 * @param roundId - the round
 * @param how - the choices to change
 */
export function setRoundPlay(quiz: Quiz, roundId: string, how: { readonly answersTogether?: boolean; readonly manualAdvance?: boolean }): Quiz {
  return changeRound(quiz, roundId, (round) => {
    let next = round;
    if (how.answersTogether !== undefined) next = how.answersTogether ? { ...next, answersTogether: true } : without(next, "answersTogether");
    if (how.manualAdvance !== undefined) next = how.manualAdvance ? { ...next, manualAdvance: true } : without(next, "manualAdvance");
    return next;
  });
}

/**
 * Seconds as the model keeps them: whole, inside the allowed range.
 * @param seconds - the number as typed
 */
export function cleanSeconds(seconds: number): number {
  return limits.clamp(Math.round(seconds), limits.MIN_SECONDS, limits.MAX_SECONDS);
}

/**
 * Points as the model keeps them: the value inside the allowed range, the note trimmed and cut.
 * @param points - the points as typed
 */
export function cleanPoints(points: Points): Points {
  return makePoints(limits.clamp(points.value, 0, limits.MAX_POINTS), limits.cut((points.note ?? "").trim(), limits.POINTS_NOTE_MAX));
}

/**
 * Changes a round's defaults. Questions with their own time or points keep them (AC2); the others
 * follow, because they store nothing. A special round keeps its points and answer type (SPEC §10).
 * @param quiz - the quiz
 * @param roundId - the round
 * @param change - only the defaults to change
 * @param registries - which round kinds fix what
 */
export function setRoundDefaults(quiz: Quiz, roundId: string, change: Partial<RoundDefaults>, registries: Registries = defaultRegistries): Quiz {
  return changeRound(quiz, roundId, (round) => {
    const isFixed = shapeOf(round, registries) !== undefined;
    const defaults = { ...round.defaults, ...change, ...(isFixed ? { points: round.defaults.points, answerType: round.defaults.answerType } : {}) };
    return { ...round, defaults: { ...defaults, seconds: cleanSeconds(defaults.seconds), points: cleanPoints(defaults.points) } };
  });
}

/**
 * Moves a round to another place in the quiz.
 * @param quiz - the quiz
 * @param roundId - the round
 * @param toIndex - its index afterwards (clamped)
 */
export function moveRound(quiz: Quiz, roundId: string, toIndex: number): Quiz {
  const from = quiz.rounds.findIndex((round) => round.id === roundId);
  if (from === -1) return quiz;
  return { ...quiz, rounds: moveItem(quiz.rounds, from, toIndex) };
}

/**
 * Deletes a round with its questions.
 * @param quiz - the quiz
 * @param roundId - the round
 */
export function deleteRound(quiz: Quiz, roundId: string): Quiz {
  if (!findRound(quiz, roundId)) return quiz;
  return { ...quiz, rounds: quiz.rounds.filter((round) => round.id !== roundId) };
}

/**
 * Copies a round with its questions (new ids) and puts the copy right after it.
 * @param quiz - the quiz
 * @param roundId - the round to copy
 * @param env - gives the ids
 */
export function duplicateRound(quiz: Quiz, roundId: string, env: Env = defaultEnv): Quiz {
  const index = quiz.rounds.findIndex((round) => round.id === roundId);
  const round = quiz.rounds[index];
  if (!round || !canAddRound(quiz)) return quiz;
  return { ...quiz, rounds: [...quiz.rounds.slice(0, index + 1), copyRound(round, env.ids), ...quiz.rounds.slice(index + 1)] };
}

/** The size of a round or a quiz: questions and the play time of their timers, in seconds. */
export interface Totals {
  readonly rounds: number;
  readonly questions: number;
  readonly seconds: number;
}

/**
 * Questions and timer time of one round.
 * @param round - the round
 */
export function roundTotals(round: Round): Totals {
  const seconds = round.questions.reduce((sum, question) => sum + effectiveSeconds(round, question), 0);
  return { rounds: 1, questions: round.questions.length, seconds };
}

/**
 * Rounds, questions and timer time of the whole quiz (reveals and score entry are not counted).
 * @param quiz - the quiz
 */
export function totals(quiz: Quiz): Totals {
  return quiz.rounds.map(roundTotals).reduce((sum, part) => ({ rounds: sum.rounds + 1, questions: sum.questions + part.questions, seconds: sum.seconds + part.seconds }), { rounds: 0, questions: 0, seconds: 0 });
}
