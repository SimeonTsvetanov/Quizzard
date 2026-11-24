import { z } from "zod";
import type { AnswerType } from "./answer-type.ts";
import { type DigitAnswer, digitOf, digitReveal } from "./special-shapes.ts";

export { digitOf, isDigit, isDigitAnswer, type DigitAnswer } from "./special-shapes.ts";

const schema = z.looseObject({ type: z.literal("digit"), digit: z.number().int().min(0).max(9).optional() });

/** Answer type `digit` (SPEC §10): one digit 0–9 — a Safe question. Not finished until the digit is picked. */
export const digitAnswer: AnswerType = {
  id: "digit",
  schema,
  defaults: (): DigitAnswer => ({ type: "digit" }),
  isComplete: (answer) => digitOf(answer) !== null,
  revealText: digitReveal,
};
