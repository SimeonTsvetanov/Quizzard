import type { Round } from "../model.ts";
import type { PlayerScreen, RoundKind } from "./round-kind.ts";

/** The screen names of a standard round (SPEC §6), in play order. */
export const STANDARD_SCREENS = {
  /** The round's opening: its name and, when it has them, its rules. */
  rules: "rules",
  /** One question with its timer. */
  question: "question",
  /** The "Answers" divider between the last question and the first reveal. */
  answers: "answers",
  /** One answer revealed, with its explanation. */
  answer: "answer",
  /** Score entry per team. */
  score: "score",
  /** The leaderboard after the round. */
  board: "board",
} as const;

/**
 * The answer part of a round: "Answers" — pens down, a stop the host moves on from by hand — and one slide
 * per answer; or "Answers" alone, when the round shows its answers all at once with the score entry
 * (`answersTogether`): the stop stays, so the answers never come up by themselves after the last question.
 * @param round - the round
 */
export function answerScreens(round: Round): readonly PlayerScreen[] {
  const roundId = round.id;
  const stop: PlayerScreen = { screen: STANDARD_SCREENS.answers, roundId };
  if (round.answersTogether === true) return [stop];
  return [stop, ...round.questions.map((question) => ({ screen: STANDARD_SCREENS.answer, roundId, questionId: question.id }))];
}

/**
 * rules → every question → "Answers" → every answer → score entry → leaderboard. The special rounds play the same.
 * @param round - the round
 */
export function standardScreens(round: Round): readonly PlayerScreen[] {
  const roundId = round.id;
  return [
    { screen: STANDARD_SCREENS.rules, roundId },
    ...round.questions.map((question) => ({ screen: STANDARD_SCREENS.question, roundId, questionId: question.id })),
    ...answerScreens(round),
    { screen: STANDARD_SCREENS.score, roundId },
    { screen: STANDARD_SCREENS.board, roundId },
  ];
}

/** Round kind `standard`: the reference quiz's round. */
export const standardRound: RoundKind = { id: "standard", screens: standardScreens };
