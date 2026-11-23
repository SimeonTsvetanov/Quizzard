import { z } from "zod";
import type { IdSource } from "../ids.ts";
import { MAX_OPTIONS, MIN_OPTIONS, OPTION_TEXT_MAX, cut } from "../limits.ts";
import type { Answer } from "../model.ts";
import type { AnswerType } from "./answer-type.ts";

/** One option of a multiple-choice answer; its id is unique inside the question. */
export interface ChoiceOption {
  readonly id: string;
  readonly text: string;
}

/** A multiple-choice answer with one or several correct options (SPEC F4). */
export interface ChoiceAnswer extends Answer {
  readonly type: "choice";
  readonly options: readonly ChoiceOption[];
  /** Ids of the correct options. */
  readonly correct: readonly string[];
}

const schema = z
  .looseObject({
    type: z.literal("choice"),
    options: z.array(z.looseObject({ id: z.string().min(1), text: z.string() })),
    correct: z.array(z.string()),
  })
  .refine((answer) => new Set(answer.options.map((option) => option.id)).size === answer.options.length, "option ids repeat")
  .refine((answer) => answer.correct.every((id) => answer.options.some((option) => option.id === id)), "a correct id has no option");

/**
 * Narrows an answer to a multiple-choice answer (unique option ids, every correct id is an option).
 * @param answer - any answer
 */
export function isChoiceAnswer(answer: Answer): answer is ChoiceAnswer {
  return schema.safeParse(answer).success;
}

/** Whether there are 2–8 options, each with text, and at least one is correct. */
function isComplete(answer: Answer): boolean {
  if (!isChoiceAnswer(answer)) return false;
  const count = answer.options.length;
  if (count < MIN_OPTIONS || count > MAX_OPTIONS) return false;
  return answer.correct.length > 0 && answer.options.every((option) => option.text.trim() !== "");
}

/** The texts of the correct options, in the order the options are shown. */
function reveal(answer: Answer): string {
  if (!isChoiceAnswer(answer)) return "";
  return answer.options
    .filter((option) => answer.correct.includes(option.id))
    .map((option) => option.text)
    .join(", ");
}

/** Answer type `choice`: starts with the fewest options allowed, none correct yet. */
export const choiceAnswer: AnswerType = {
  id: "choice",
  schema,
  defaults: (ids): ChoiceAnswer => ({
    type: "choice",
    options: Array.from({ length: MIN_OPTIONS }, () => ({ id: ids(), text: "" })),
    correct: [],
  }),
  isComplete,
  revealText: reveal,
};

/**
 * Whether one more option fits ("8 options at most").
 * @param answer - the answer being edited
 */
export function canAddOption(answer: ChoiceAnswer): boolean {
  return answer.options.length < MAX_OPTIONS;
}

/**
 * Whether an option may be removed ("2 options at least").
 * @param answer - the answer being edited
 */
export function canRemoveOption(answer: ChoiceAnswer): boolean {
  return answer.options.length > MIN_OPTIONS;
}

/**
 * Adds an empty option at the end; the same answer comes back when it is full.
 * @param answer - the answer being edited
 * @param ids - gives the option's id
 */
export function addOption(answer: ChoiceAnswer, ids: IdSource): ChoiceAnswer {
  if (!canAddOption(answer)) return answer;
  return { ...answer, options: [...answer.options, { id: ids(), text: "" }] };
}

/**
 * Removes an option (and its "correct" mark); the same answer comes back at the fewest allowed.
 * @param answer - the answer being edited
 * @param optionId - the option to remove
 */
export function removeOption(answer: ChoiceAnswer, optionId: string): ChoiceAnswer {
  if (!canRemoveOption(answer) || !answer.options.some((option) => option.id === optionId)) return answer;
  return {
    ...answer,
    options: answer.options.filter((option) => option.id !== optionId),
    correct: answer.correct.filter((id) => id !== optionId),
  };
}

/**
 * Changes an option's text (cut to the longest allowed).
 * @param answer - the answer being edited
 * @param optionId - the option to change
 * @param text - the new text
 */
export function setOptionText(answer: ChoiceAnswer, optionId: string, text: string): ChoiceAnswer {
  const next = cut(text, OPTION_TEXT_MAX);
  return { ...answer, options: answer.options.map((option) => (option.id === optionId ? { ...option, text: next } : option)) };
}

/**
 * Marks an option correct or not; several may be correct at once. Kept in the options' order.
 * @param answer - the answer being edited
 * @param optionId - the option to switch
 */
export function toggleCorrect(answer: ChoiceAnswer, optionId: string): ChoiceAnswer {
  if (!answer.options.some((option) => option.id === optionId)) return answer;
  const wanted = new Set(answer.correct);
  if (!wanted.delete(optionId)) wanted.add(optionId);
  return { ...answer, correct: answer.options.map((option) => option.id).filter((id) => wanted.has(id)) };
}
