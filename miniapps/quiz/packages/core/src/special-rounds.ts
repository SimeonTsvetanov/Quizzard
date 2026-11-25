// The special rounds' edits (SPEC §10): a round of a kind is created with its fixed shape — the
// questions, their answer type and points, its time, its rules and its own data — and the question
// ops ask `shapeOf` before they add, remove, move or retype anything. Texts come from the caller (the
// core has none).
import * as limits from "./limits.ts";
import type { Question, Quiz, Round } from "./model.ts";
import { type Env, addRound, canAddRound, changeRound, defaultEnv } from "./ops.ts";
import { newQuestion } from "./question-ops.ts";
import type { RoundShape } from "./rounds/round-kind.ts";

/** What a new round of a kind is called and says before it is played; the caller's words. */
export interface NewRound {
  readonly kind: string;
  readonly name: string;
  /** The rules text; an empty one is left out. */
  readonly rules?: string;
}

/** The questions of a new special round: its answer type, a text question each, the points of its place. */
function shapedQuestions(shape: RoundShape, kind: string, env: Env): readonly Question[] | undefined {
  const questions: Question[] = [];
  for (let index = 0; index < shape.count; index += 1) {
    const question = newQuestion(kind, shape.answerType, env);
    if (!question) return undefined;
    const points = shape.pointsAt(index);
    questions.push(points === limits.DEFAULT_POINTS ? question : { ...question, points: { value: points } });
  }
  return questions;
}

/**
 * Adds a round of a kind at the end. A special kind comes ready to fill in: its questions, answer type,
 * points, time and own data; a standard round starts empty with the defaults of the round before it.
 * The same quiz when the quiz is full or the kind (or what it needs) is not registered.
 * @param quiz - the quiz
 * @param input - the kind, the name and the rules text
 * @param env - gives the ids and the registries
 */
export function addRoundOfKind(quiz: Quiz, input: NewRound, env: Env = defaultEnv): Quiz {
  const kind = env.registries.rounds.get(input.kind);
  if (!kind || !canAddRound(quiz)) return quiz;
  const rules = limits.cut((input.rules ?? "").trim(), limits.RULES_MAX);
  const withRules = (round: Round): Round => (rules === "" ? round : { ...round, rules });
  const shape = kind.shape;
  if (!shape) {
    const next = addRound(quiz, input.name, env);
    const added = next.rounds.at(-1);
    return next === quiz || !added ? quiz : changeRound(next, added.id, (round) => withRules({ ...round, kind: kind.id }));
  }
  const questionKind = env.registries.kinds.list()[0]?.id ?? "";
  const questions = shapedQuestions(shape, questionKind, env);
  if (!questions) return quiz;
  const data = shape.defaultData?.();
  const round: Round = withRules({
    id: env.ids(),
    kind: kind.id,
    name: limits.cut(input.name, limits.ROUND_NAME_MAX),
    defaults: { seconds: shape.seconds, points: { value: limits.DEFAULT_POINTS }, questionKind, answerType: shape.answerType },
    questions,
    ...(data ? { data } : {}),
  });
  return { ...quiz, rounds: [...quiz.rounds, round] };
}

/**
 * Sets one of the whole numbers a round kind keeps in the round's own data (a prize, the most points):
 * 0–20. Where the kind's questions show what the round gives, their points follow.
 * @param quiz - the quiz
 * @param roundId - the round
 * @param key - the value's name in the round's data
 * @param value - the number as typed
 * @param env - gives the registries
 */
export function setRoundValue(quiz: Quiz, roundId: string, key: string, value: number, env: Env = defaultEnv): Quiz {
  const kind = env.registries.rounds.get(quiz.rounds.find((round) => round.id === roundId)?.kind ?? "");
  // Only a value the kind itself keeps: another key would make the round's data fail the kind's own check.
  const shape = kind?.shape;
  if (!kind || shape?.defaultData?.()[key] === undefined) return quiz;
  const whole = limits.clamp(Math.round(value), limits.ROUND_VALUE_MIN, limits.ROUND_VALUE_MAX);
  return changeRound(quiz, roundId, (round) => {
    if (round.data?.[key] === whole) return round;
    const next: Round = { ...round, data: { ...round.data, [key]: whole } };
    if (shape.pointsFollowRound !== true || !kind.maxPoints) return next;
    const points = { value: kind.maxPoints(next) };
    return { ...next, questions: next.questions.map((question) => ({ ...question, points })) };
  });
}

/**
 * Sets a Safe round's bonus for all digits right (0–20, whole).
 * @param quiz - the quiz
 * @param roundId - the round
 * @param bonus - the bonus as typed
 */
export function setRoundBonus(quiz: Quiz, roundId: string, bonus: number): Quiz {
  const value = limits.clamp(Math.round(bonus), limits.SAFE_BONUS_MIN, limits.SAFE_BONUS_MAX);
  return changeRound(quiz, roundId, (round) => (round.data?.["bonus"] === value ? round : { ...round, data: { ...round.data, bonus: value } }));
}
