// Round kind `pyramid`, the Golden pyramid (SPEC §10): four questions; question n asks for n answers
// and scores 1 point for each that is among its accepted answers — 10 in all. A team that writes more
// answers than asked loses the question (the host scores it 0). On the stage the four questions stand
// together on one screen, under one timer of their times added up; the answers follow one by one.
import { acceptedItems } from "../answers/special-shapes.ts";
import { effectiveSeconds } from "../effective.ts";
import type { Round } from "../model.ts";
import type { PlayerScreen, RoundKind } from "./round-kind.ts";
import { STANDARD_SCREENS } from "./standard.ts";

/** Questions of a Golden pyramid round. */
export const PYRAMID_QUESTIONS = 4;

/**
 * How many answers the question at a place of a Golden pyramid asks for: its number.
 * @param index - the question's place, from 0
 */
export function pyramidAsks(index: number): number {
  return index + 1;
}

/** The screen of a Golden pyramid that takes the place of its questions' own screens. */
export const PYRAMID_SCREENS = {
  /** The pyramid with all four questions at once, under one timer. */
  all: "pyramid",
} as const;

/**
 * The time of the pyramid's one question screen: the times of its questions together (Moni 2026-11-26:
 * two minutes each are eight minutes for the round).
 * @param round - a round of kind `pyramid`
 */
export function pyramidSeconds(round: Round): number {
  return round.questions.reduce((sum, question) => sum + effectiveSeconds(round, question), 0);
}

/**
 * rules → the pyramid with every question at once → "Answers" → every answer → score entry → leaderboard.
 * @param round - the round
 */
export function pyramidScreens(round: Round): readonly PlayerScreen[] {
  const roundId = round.id;
  return [
    { screen: STANDARD_SCREENS.rules, roundId },
    { screen: PYRAMID_SCREENS.all, roundId },
    { screen: STANDARD_SCREENS.answers, roundId },
    ...round.questions.map((question) => ({ screen: STANDARD_SCREENS.answer, roundId, questionId: question.id })),
    { screen: STANDARD_SCREENS.score, roundId },
    { screen: STANDARD_SCREENS.board, roundId },
  ];
}

/** Round kind `pyramid`. */
export const pyramidRound: RoundKind = {
  id: "pyramid",
  screens: pyramidScreens,
  shape: { count: PYRAMID_QUESTIONS, answerType: "list", canReorder: false, seconds: 60, pointsAt: pyramidAsks },
  isQuestionComplete: (question, index) => acceptedItems(question.answer).length >= pyramidAsks(index),
};
