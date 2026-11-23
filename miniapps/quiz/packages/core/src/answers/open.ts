import { z } from "zod";
import type { Answer } from "../model.ts";
import type { AnswerType } from "./answer-type.ts";

/** An open answer: the teams write, the host compares with this text. */
export interface OpenAnswer extends Answer {
  readonly type: "open";
  readonly text: string;
}

const schema = z.looseObject({ type: z.literal("open"), text: z.string() });

/**
 * Narrows an answer to an open answer (checks the shape, not only the type name).
 * @param answer - any answer
 */
export function isOpenAnswer(answer: Answer): answer is OpenAnswer {
  return schema.safeParse(answer).success;
}

/** Answer type `open`. */
export const openAnswer: AnswerType = {
  id: "open",
  schema,
  defaults: (): OpenAnswer => ({ type: "open", text: "" }),
  isComplete: (answer) => isOpenAnswer(answer) && answer.text.trim() !== "",
  revealText: (answer) => (isOpenAnswer(answer) ? answer.text : ""),
};
