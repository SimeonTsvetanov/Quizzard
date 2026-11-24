import { z } from "zod";
import type { AnswerType } from "./answer-type.ts";
import { type OpenAnswer, isOpenAnswer, openReveal } from "./shapes.ts";

export { isOpenAnswer, type OpenAnswer } from "./shapes.ts";

const schema = z.looseObject({ type: z.literal("open"), text: z.string() });

/** Answer type `open`: the teams write, the host compares with this text. */
export const openAnswer: AnswerType = {
  id: "open",
  schema,
  defaults: (): OpenAnswer => ({ type: "open", text: "" }),
  isComplete: (answer) => isOpenAnswer(answer) && answer.text.trim() !== "",
  revealText: openReveal,
};
