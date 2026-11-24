// The shapes of the version-1 answers with hand-written checks and their reveal texts — no Zod here.
// The exported player (packages/player) imports this file through `play.ts` and must stay small and
// free of `new Function` probes; the Zod schemas next to each answer type describe the same shapes
// for validation, and shapes.test.ts holds the two to each other.
import type { Answer } from "../model.ts";
import type { RevealLabels } from "./answer-type.ts";

/** The answer of type `open`: the text shown at the reveal. */
export interface OpenAnswer extends Answer {
  readonly type: "open";
  readonly text: string;
}

/** One option of a multiple-choice answer. */
export interface ChoiceOption {
  readonly id: string;
  readonly text: string;
}

/** The answer of type `choice`: 2–8 options, one or several correct (their ids, in option order). */
export interface ChoiceAnswer extends Answer {
  readonly type: "choice";
  readonly options: readonly ChoiceOption[];
  readonly correct: readonly string[];
}

/** The answer of type `trueFalse`. */
export interface TrueFalseAnswer extends Answer {
  readonly type: "trueFalse";
  readonly correct: boolean;
}

/**
 * Narrows an answer to the `open` shape.
 * @param answer - any answer
 */
export function isOpenAnswer(answer: Answer): answer is OpenAnswer {
  return answer.type === "open" && typeof answer["text"] === "string";
}

/**
 * Narrows an answer to the `trueFalse` shape.
 * @param answer - any answer
 */
export function isTrueFalseAnswer(answer: Answer): answer is TrueFalseAnswer {
  return answer.type === "trueFalse" && typeof answer["correct"] === "boolean";
}

function isOption(value: unknown): value is ChoiceOption {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const id: unknown = Reflect.get(value, "id");
  return typeof id === "string" && id !== "" && typeof Reflect.get(value, "text") === "string";
}

/**
 * Narrows an answer to the `choice` shape: options with unique ids, every correct id among them.
 * @param answer - any answer
 */
export function isChoiceAnswer(answer: Answer): answer is ChoiceAnswer {
  const options = answer["options"];
  const correct = answer["correct"];
  if (answer.type !== "choice" || !Array.isArray(options) || !Array.isArray(correct)) return false;
  if (!options.every(isOption)) return false;
  const ids = new Set(options.map((option) => option.id));
  return ids.size === options.length && correct.every((id) => typeof id === "string" && ids.has(id));
}

/**
 * The reveal text of an open answer.
 * @param answer - any answer; another shape gives ""
 */
export function openReveal(answer: Answer): string {
  return isOpenAnswer(answer) ? answer.text : "";
}

/**
 * The reveal text of a multiple-choice answer: its correct options, in option order.
 * @param answer - any answer; another shape gives ""
 */
export function choiceReveal(answer: Answer): string {
  if (!isChoiceAnswer(answer)) return "";
  return answer.options
    .filter((option) => answer.correct.includes(option.id))
    .map((option) => option.text)
    .join(", ");
}

/**
 * The reveal text of a true/false answer, in the player's words.
 * @param answer - any answer; another shape gives ""
 * @param labels - "True" and "False" in the quiz's language
 */
export function trueFalseReveal(answer: Answer, labels: RevealLabels): string {
  if (!isTrueFalseAnswer(answer)) return "";
  return answer.correct ? labels.trueText : labels.falseText;
}
