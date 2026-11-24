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
 * rules → every question → "Answers" → every answer → score entry → leaderboard. The special rounds play the same.
 * @param round - the round
 */
export function standardScreens(round: Round): readonly PlayerScreen[] {
  const roundId = round.id;
  const each = (screen: string): PlayerScreen[] => round.questions.map((question) => ({ screen, roundId, questionId: question.id }));
  return [
    { screen: STANDARD_SCREENS.rules, roundId },
    ...each(STANDARD_SCREENS.question),
    { screen: STANDARD_SCREENS.answers, roundId },
    ...each(STANDARD_SCREENS.answer),
    { screen: STANDARD_SCREENS.score, roundId },
    { screen: STANDARD_SCREENS.board, roundId },
  ];
}

/** Round kind `standard`: the reference quiz's round. */
export const standardRound: RoundKind = { id: "standard", screens: standardScreens };
