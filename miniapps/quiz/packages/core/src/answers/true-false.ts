import { z } from "zod";
import type { AnswerType } from "./answer-type.ts";
import { type TrueFalseAnswer, isTrueFalseAnswer, trueFalseReveal } from "./shapes.ts";

export { isTrueFalseAnswer, type TrueFalseAnswer } from "./shapes.ts";

const schema = z.looseObject({ type: z.literal("trueFalse"), correct: z.boolean() });

/** Answer type `trueFalse`. It is always complete: one of the two is chosen from the start. */
export const trueFalseAnswer: AnswerType = {
  id: "trueFalse",
  schema,
  defaults: (): TrueFalseAnswer => ({ type: "trueFalse", correct: true }),
  isComplete: isTrueFalseAnswer,
  revealText: trueFalseReveal,
};
