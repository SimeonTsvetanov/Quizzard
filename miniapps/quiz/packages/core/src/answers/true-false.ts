import { z } from "zod";
import type { Answer } from "../model.ts";
import type { AnswerType } from "./answer-type.ts";

/** A true / false answer. */
export interface TrueFalseAnswer extends Answer {
  readonly type: "trueFalse";
  readonly correct: boolean;
}

const schema = z.looseObject({ type: z.literal("trueFalse"), correct: z.boolean() });

/**
 * Narrows an answer to a true / false answer.
 * @param answer - any answer
 */
export function isTrueFalseAnswer(answer: Answer): answer is TrueFalseAnswer {
  return schema.safeParse(answer).success;
}

/** The reveal word of a true / false answer; empty for another answer. */
function reveal(answer: Answer, labels: { readonly trueText: string; readonly falseText: string }): string {
  if (!isTrueFalseAnswer(answer)) return "";
  return answer.correct ? labels.trueText : labels.falseText;
}

/** Answer type `trueFalse`. It is always complete: one of the two is chosen from the start. */
export const trueFalseAnswer: AnswerType = {
  id: "trueFalse",
  schema,
  defaults: (): TrueFalseAnswer => ({ type: "trueFalse", correct: true }),
  isComplete: isTrueFalseAnswer,
  revealText: reveal,
};
