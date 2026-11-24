// The registries of version 1, assembled. This is the only file that lists the built-in kinds; every
// other module receives a `Registries` and asks it by id (PLAN §2 rule 1).
import type { AnswerType } from "./answers/answer-type.ts";
import { choiceAnswer } from "./answers/choice.ts";
import { digitAnswer } from "./answers/digit.ts";
import { listAnswer } from "./answers/list.ts";
import { openAnswer } from "./answers/open.ts";
import { trueFalseAnswer } from "./answers/true-false.ts";
import { audioKind } from "./kinds/audio.ts";
import type { QuestionKind } from "./kinds/kind.ts";
import { pictureKind } from "./kinds/picture.ts";
import { textKind } from "./kinds/text.ts";
import { videoKind } from "./kinds/video.ts";
import type { Question, Round } from "./model.ts";
import { type Registry, createRegistry } from "./registry.ts";
import { createRoundKinds } from "./rounds/kinds.ts";
import type { PlayerScreen, RoundKind, RoundShape } from "./rounds/round-kind.ts";

/** The three pure registries every op, check and reader works through. */
export interface Registries {
  readonly kinds: Registry<QuestionKind>;
  readonly answers: Registry<AnswerType>;
  readonly rounds: Registry<RoundKind>;
}

/** A fresh set of registries with the built-in entries — its own copy, so tests can add to it freely. */
export function createRegistries(): Registries {
  return {
    kinds: createRegistry<QuestionKind>([textKind, pictureKind, audioKind, videoKind]),
    answers: createRegistry<AnswerType>([openAnswer, choiceAnswer, trueFalseAnswer, listAnswer, digitAnswer]),
    rounds: createRoundKinds(),
  };
}

/** The app's shared registries: the default of every function that needs them. */
export const defaultRegistries: Registries = createRegistries();

/**
 * Whether this version can edit and play the question: both its kind and its answer type are registered.
 * A question that is not supported is kept as it is and shown as "not supported in this version" (SPEC §3.3).
 * @param question - any question
 * @param registries - where to look
 */
export function isSupported(question: Question, registries: Registries = defaultRegistries): boolean {
  return registries.kinds.has(question.kind) && registries.answers.has(question.answer.type);
}

/**
 * Whether the question is ready to be played: its kind and its answer type both say so.
 * An unsupported question counts as ready — this version cannot judge it.
 * @param question - any question
 * @param registries - where to look
 */
export function isComplete(question: Question, registries: Registries = defaultRegistries): boolean {
  const kind = registries.kinds.get(question.kind);
  const answer = registries.answers.get(question.answer.type);
  if (!kind || !answer) return true;
  return kind.isComplete(question) && answer.isComplete(question.answer);
}

/**
 * The player screens of a round, from its round kind; none for a round kind this version does not know.
 * @param round - any round
 * @param registries - where to look
 */
export function screensOf(round: Round, registries: Registries = defaultRegistries): readonly PlayerScreen[] {
  return registries.rounds.get(round.kind)?.screens(round) ?? [];
}

/**
 * The fixed shape of a round (SPEC §10), or `undefined` for a round whose questions are free (standard, unknown).
 * @param round - any round
 * @param registries - where to look
 */
export function shapeOf(round: Round, registries: Registries = defaultRegistries): RoundShape | undefined {
  return registries.rounds.get(round.kind)?.shape;
}

/**
 * Whether the questions of a round may change places within it.
 * @param round - the round
 * @param registries - where to look
 */
export function canReorder(round: Round, registries: Registries = defaultRegistries): boolean {
  return shapeOf(round, registries)?.canReorder ?? true;
}

/**
 * Whether the answer type is one a special round kind keeps for itself (offered only there).
 * @param answerType - an answer type's id
 * @param registries - where to look
 */
export function isRoundAnswerType(answerType: string, registries: Registries = defaultRegistries): boolean {
  return registries.rounds.list().some((kind) => kind.shape?.answerType === answerType);
}

/**
 * The answer types a question of a free round may have, in picker order: all but the special rounds' own.
 * @param registries - where to look
 */
export function freeAnswerTypes(registries: Registries = defaultRegistries): readonly string[] {
  return registries.answers.list().map((entry) => entry.id).filter((id) => !isRoundAnswerType(id, registries));
}
