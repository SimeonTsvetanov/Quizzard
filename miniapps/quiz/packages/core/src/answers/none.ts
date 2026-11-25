import { z } from "zod";
import type { AnswerType } from "./answer-type.ts";

const schema = z.looseObject({ type: z.literal("none") });

/**
 * Answer type `none`: the screen is a task, not a question — nothing is revealed. Kept by the round
 * kinds without answers ("Make the quizmaster laugh", the free game); never offered in a free round.
 */
export const noneAnswer: AnswerType = {
  id: "none",
  schema,
  defaults: () => ({ type: "none" }),
  isComplete: () => true,
  revealText: () => "",
};
