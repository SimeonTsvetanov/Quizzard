// Pure edits of questions — the second half of ops.ts (same rules: a new quiz out, the same quiz
// object when nothing could be done). Kinds and answer types are only ever asked from the registries.
import * as limits from "./limits.ts";
import { type Answer, type MediaRef, type Points, type Question, type QuestionData, type Quiz, type Round, samePoints } from "./model.ts";
import { type Env, changeRound, cleanPoints, cleanSeconds, defaultEnv, findQuestion, findRound, moveItem, without } from "./ops.ts";

/**
 * Whether one more question fits in the round.
 * @param round - the round
 */
export function canAddQuestion(round: Round): boolean {
  return round.questions.length < limits.MAX_QUESTIONS_PER_ROUND;
}

/**
 * A new, empty question of a kind and an answer type; `undefined` when either is not registered.
 * @param kind - the question kind's id
 * @param answerType - the answer type's id
 * @param env - gives the ids and the registries
 */
export function newQuestion(kind: string, answerType: string, env: Env = defaultEnv): Question | undefined {
  const kindEntry = env.registries.kinds.get(kind);
  const answerEntry = env.registries.answers.get(answerType);
  if (!kindEntry || !answerEntry) return undefined;
  const data = kindEntry.defaultData();
  const question: Question = { id: env.ids(), kind, prompt: "", answer: answerEntry.defaults(env.ids) };
  return data ? { ...question, data } : question;
}

/**
 * Adds a question at the end of a round (find it as the last of its `questions`). Kind and answer
 * type come from the round's defaults unless given; time and points are the round's until changed.
 * @param quiz - the quiz
 * @param roundId - the round
 * @param choice - the kind and answer type picked, when not the round's defaults
 * @param env - gives the ids and the registries
 */
export function addQuestion(quiz: Quiz, roundId: string, choice: { readonly kind?: string; readonly answerType?: string } = {}, env: Env = defaultEnv): Quiz {
  return changeRound(quiz, roundId, (round) => {
    if (!canAddQuestion(round)) return round;
    const question = newQuestion(choice.kind ?? round.defaults.questionKind, choice.answerType ?? round.defaults.answerType, env);
    return question ? { ...round, questions: [...round.questions, question] } : round;
  });
}

/**
 * Replaces one question by what `change` returns; the same quiz when it does not exist or did not change.
 * @param quiz - the quiz
 * @param questionId - the question to change
 * @param change - returns the new question; it also gets the round, for the round's defaults
 */
export function changeQuestion(quiz: Quiz, questionId: string, change: (question: Question, round: Round) => Question): Quiz {
  const place = findQuestion(quiz, questionId);
  if (!place) return quiz;
  const next = change(place.question, place.round);
  if (next === place.question) return quiz;
  return changeRound(quiz, place.round.id, (round) => ({ ...round, questions: round.questions.map((question) => (question === place.question ? next : question)) }));
}

/** What the editor changes on a question. `null` removes the media; an empty explanation or note removes it. */
export interface QuestionEdit {
  readonly prompt?: string;
  readonly explanation?: string;
  /** The host's own note (never on the stage). */
  readonly note?: string;
  readonly answer?: Answer;
  readonly media?: MediaRef | null;
  readonly data?: QuestionData;
}

/** Applies the explanation, note and media parts of an edit, removing the field where the edit says so. */
function applyOptional(question: Question, edit: QuestionEdit): Question {
  let next = question;
  if (edit.explanation !== undefined) {
    const explanation = limits.cut(edit.explanation, limits.EXPLANATION_MAX);
    next = explanation.trim() === "" ? without(next, "explanation") : { ...next, explanation };
  }
  if (edit.note !== undefined) {
    const note = limits.cut(edit.note, limits.HOST_NOTE_MAX);
    next = note.trim() === "" ? without(next, "note") : { ...next, note };
  }
  if (edit.media !== undefined) next = edit.media === null ? without(next, "media") : { ...next, media: edit.media };
  return next;
}

/**
 * Changes a question's text, answer, explanation, media or kind data — only the fields given.
 * @param quiz - the quiz
 * @param questionId - the question
 * @param edit - the fields to change
 */
export function editQuestion(quiz: Quiz, questionId: string, edit: QuestionEdit): Quiz {
  return changeQuestion(quiz, questionId, (question) => {
    const next = applyOptional(question, edit);
    return {
      ...next,
      ...(edit.prompt === undefined ? {} : { prompt: limits.cut(edit.prompt, limits.PROMPT_MAX) }),
      ...(edit.answer === undefined ? {} : { answer: edit.answer }),
      ...(edit.data === undefined ? {} : { data: edit.data }),
    };
  });
}

/**
 * Changes a question's kind. Its text and answer stay; its media stays only when the new kind takes
 * the same media type; the kind's own data starts fresh. An unregistered kind changes nothing.
 * @param quiz - the quiz
 * @param questionId - the question
 * @param kind - the new kind's id
 * @param env - gives the registries
 */
export function setQuestionKind(quiz: Quiz, questionId: string, kind: string, env: Env = defaultEnv): Quiz {
  const entry = env.registries.kinds.get(kind);
  if (!entry) return quiz;
  return changeQuestion(quiz, questionId, (question) => {
    if (question.kind === kind) return question;
    const keepsMedia = entry.mediaType !== null && env.registries.kinds.get(question.kind)?.mediaType === entry.mediaType;
    const base: Question = { ...without(keepsMedia ? question : without(question, "media"), "data"), kind };
    const data = entry.defaultData();
    return data ? { ...base, data } : base;
  });
}

/**
 * Changes a question's answer type; the answer starts again as that type's empty answer.
 * @param quiz - the quiz
 * @param questionId - the question
 * @param answerType - the new answer type's id
 * @param env - gives the ids and the registries
 */
export function setAnswerType(quiz: Quiz, questionId: string, answerType: string, env: Env = defaultEnv): Quiz {
  const entry = env.registries.answers.get(answerType);
  if (!entry) return quiz;
  return changeQuestion(quiz, questionId, (question) => (question.answer.type === answerType ? question : { ...question, answer: entry.defaults(env.ids) }));
}

/**
 * Gives a question its own time, or with `undefined` takes it back to the round's. A time equal to
 * the round's is not stored (SPEC F5: "set only when different").
 * @param quiz - the quiz
 * @param questionId - the question
 * @param seconds - the question's own time, or `undefined` to clear it
 */
export function setQuestionSeconds(quiz: Quiz, questionId: string, seconds: number | undefined): Quiz {
  return changeQuestion(quiz, questionId, (question, round) => {
    const own = seconds === undefined ? undefined : cleanSeconds(seconds);
    if (own === undefined || own === round.defaults.seconds) return question.seconds === undefined ? question : without(question, "seconds");
    return { ...question, seconds: own };
  });
}

/**
 * Gives a question its own points (a number, a note or both), or with `undefined` takes them back to
 * the round's. Points equal to the round's are not stored.
 * @param quiz - the quiz
 * @param questionId - the question
 * @param points - the question's own points, or `undefined` to clear them
 */
export function setQuestionPoints(quiz: Quiz, questionId: string, points: Points | undefined): Quiz {
  return changeQuestion(quiz, questionId, (question, round) => {
    const own = points === undefined ? undefined : cleanPoints(points);
    if (own === undefined || samePoints(own, round.defaults.points)) return question.points === undefined ? question : without(question, "points");
    return { ...question, points: own };
  });
}

/**
 * Moves a question: to another place in its round, or to another round (at its end unless an index
 * is given). Its own time and points travel with it; a question without them takes the new round's.
 * @param quiz - the quiz
 * @param questionId - the question
 * @param toRoundId - the round it should be in afterwards
 * @param toIndex - its index there (clamped); the end when left out
 */
export function moveQuestion(quiz: Quiz, questionId: string, toRoundId: string, toIndex?: number): Quiz {
  const place = findQuestion(quiz, questionId);
  const target = findRound(quiz, toRoundId);
  if (!place || !target) return quiz;
  if (target === place.round) {
    return changeRound(quiz, target.id, (round) => ({ ...round, questions: moveItem(round.questions, place.index, toIndex ?? round.questions.length) }));
  }
  if (!canAddQuestion(target)) return quiz;
  const removed = deleteQuestion(quiz, questionId);
  return changeRound(removed, toRoundId, (round) => {
    const questions = [...round.questions, place.question];
    return { ...round, questions: moveItem(questions, questions.length - 1, toIndex ?? questions.length) };
  });
}

/**
 * Deletes a question.
 * @param quiz - the quiz
 * @param questionId - the question
 */
export function deleteQuestion(quiz: Quiz, questionId: string): Quiz {
  const place = findQuestion(quiz, questionId);
  if (!place) return quiz;
  return changeRound(quiz, place.round.id, (round) => ({ ...round, questions: round.questions.filter((question) => question !== place.question) }));
}

/**
 * Copies a question (a new id, the same media file) and puts the copy right after it.
 * @param quiz - the quiz
 * @param questionId - the question to copy
 * @param env - gives the id
 */
export function duplicateQuestion(quiz: Quiz, questionId: string, env: Env = defaultEnv): Quiz {
  const place = findQuestion(quiz, questionId);
  if (!place || !canAddQuestion(place.round)) return quiz;
  const copy: Question = { ...place.question, id: env.ids() };
  return changeRound(quiz, place.round.id, (round) => ({ ...round, questions: [...round.questions.slice(0, place.index + 1), copy, ...round.questions.slice(place.index + 1)] }));
}

/**
 * How many questions of a round have a time or points of their own — what "apply to all" would change.
 * @param round - the round
 */
export function ownValueCount(round: Round): number {
  return round.questions.filter((question) => question.seconds !== undefined || question.points !== undefined).length;
}

/**
 * Takes every question of a round back to the round's time and points: their own values are removed
 * (SPEC F5 — a question without its own follows the round). The same quiz when none had its own.
 * @param quiz - the quiz
 * @param roundId - the round
 */
export function applyRoundDefaults(quiz: Quiz, roundId: string): Quiz {
  return changeRound(quiz, roundId, (round) => {
    if (ownValueCount(round) === 0) return round;
    return { ...round, questions: round.questions.map((question) => without(without(question, "seconds"), "points")) };
  });
}
