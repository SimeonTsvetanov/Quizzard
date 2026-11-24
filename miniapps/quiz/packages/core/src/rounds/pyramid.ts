// Round kind `pyramid`, the Golden pyramid (SPEC §10): four questions; question n asks for n answers
// and scores 1 point for each that is among its accepted answers — 10 in all. A team that writes more
// answers than asked loses the question (the host scores it 0).
import { acceptedItems } from "../answers/special-shapes.ts";
import type { RoundKind } from "./round-kind.ts";
import { standardScreens } from "./standard.ts";

/** Questions of a Golden pyramid round. */
export const PYRAMID_QUESTIONS = 4;

/**
 * How many answers the question at a place of a Golden pyramid asks for: its number.
 * @param index - the question's place, from 0
 */
export function pyramidAsks(index: number): number {
  return index + 1;
}

/** Round kind `pyramid`. */
export const pyramidRound: RoundKind = {
  id: "pyramid",
  screens: standardScreens,
  shape: { count: PYRAMID_QUESTIONS, answerType: "list", canReorder: false, seconds: 60, pointsAt: pyramidAsks },
  isQuestionComplete: (question, index) => acceptedItems(question.answer).length >= pyramidAsks(index),
};
