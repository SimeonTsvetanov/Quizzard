// The round kinds without answers (Moni 2026-11-25): one screen says what the teams do, a timer runs,
// and the host gives the points — nothing is revealed. `laugh` ("Make the quizmaster laugh"): every
// team tells a joke, the funniest two win the round's first and second prize. `task` (the free game):
// whatever the host puts on the screen — draw, build, sing — for up to the round's points.
import { ROUND_VALUE_MAX, ROUND_VALUE_MIN } from "../limits.ts";
import type { Round } from "../model.ts";
import type { PlayerScreen, RoundKind } from "./round-kind.ts";
import { STANDARD_SCREENS } from "./standard.ts";

/** The screen of a round without answers that takes the place of the score entry: the points alone. */
export const TASK_SCREENS = {
  /** Points per team, with no list of answers beside it. */
  tally: "tally",
} as const;

/** What a new "Make the quizmaster laugh" round gives the funniest team and the runner-up. */
export const LAUGH_FIRST_DEFAULT = 3;
export const LAUGH_SECOND_DEFAULT = 1;
/** The most points a team can get in a new free game. */
export const TASK_POINTS_DEFAULT = 3;

/**
 * rules → the task with its timer → the points → leaderboard. No "Answers", no reveal.
 * @param round - the round
 */
export function taskScreens(round: Round): readonly PlayerScreen[] {
  const roundId = round.id;
  return [
    { screen: STANDARD_SCREENS.rules, roundId },
    ...round.questions.map((question) => ({ screen: STANDARD_SCREENS.question, roundId, questionId: question.id })),
    { screen: TASK_SCREENS.tally, roundId },
    { screen: STANDARD_SCREENS.board, roundId },
  ];
}

/** A whole number 0–20 kept in a round's own data, or the fallback. */
function valueOf(round: Round, key: string, fallback: number): number {
  const value = round.data?.[key];
  return typeof value === "number" && Number.isInteger(value) && value >= ROUND_VALUE_MIN && value <= ROUND_VALUE_MAX ? value : fallback;
}

/** Whether every value a kind keeps is absent or a whole number 0–20. */
function areValid(data: Readonly<Record<string, unknown>> | undefined, keys: readonly string[]): boolean {
  return keys.every((key) => {
    const value = data?.[key];
    return value === undefined || (typeof value === "number" && Number.isInteger(value) && value >= ROUND_VALUE_MIN && value <= ROUND_VALUE_MAX);
  });
}

/**
 * The prizes of a "Make the quizmaster laugh" round: the funniest team's and the runner-up's.
 * @param round - a round of kind `laugh`
 */
export function laughPrizes(round: Round): { readonly first: number; readonly second: number } {
  return { first: valueOf(round, "first", LAUGH_FIRST_DEFAULT), second: valueOf(round, "second", LAUGH_SECOND_DEFAULT) };
}

/**
 * The most points a team can get in a free game.
 * @param round - a round of kind `task`
 */
export function taskPoints(round: Round): number {
  return valueOf(round, "points", TASK_POINTS_DEFAULT);
}

/** Round kind `laugh`: one task (5 minutes), two prizes — only two teams score. */
export const laughRound: RoundKind = {
  id: "laugh",
  statesTask: true,
  screens: taskScreens,
  shape: { count: 1, answerType: "none", canReorder: false, seconds: 300, pointsAt: () => LAUGH_FIRST_DEFAULT, pointsFollowRound: true, defaultData: () => ({ first: LAUGH_FIRST_DEFAULT, second: LAUGH_SECOND_DEFAULT }) },
  isDataValid: (data) => areValid(data, ["first", "second"]),
  maxPoints: (round) => Math.max(laughPrizes(round).first, laughPrizes(round).second),
};

/** Round kind `task`, the free game: one task with its time, and points the host gives as he sees fit. */
export const taskRound: RoundKind = {
  id: "task",
  screens: taskScreens,
  shape: { count: 1, answerType: "none", canReorder: false, seconds: 180, pointsAt: () => TASK_POINTS_DEFAULT, pointsFollowRound: true, defaultData: () => ({ points: TASK_POINTS_DEFAULT }) },
  isDataValid: (data) => areValid(data, ["points"]),
  maxPoints: taskPoints,
};
