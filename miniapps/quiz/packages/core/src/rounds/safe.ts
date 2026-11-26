// Round kind `safe` (SPEC §10): five questions, each answered with one digit 0–9 — together the code
// of a safe. 1 point per right digit; all five open the safe and add the round's bonus on top.
import { SAFE_BONUS_DEFAULT } from "../limits.ts";
import type { Round } from "../model.ts";
import { digitOf } from "../answers/special-shapes.ts";
import type { PlayerScreen, RoundKind } from "./round-kind.ts";
import { STANDARD_SCREENS, standardScreens } from "./standard.ts";

/** Questions of a Safe round: the digits of its code. */
export const SAFE_QUESTIONS = 5;

/**
 * The bonus of a Safe round for all digits right: its own, or the default when it has none.
 * @param round - a Safe round
 */
export function safeBonus(round: Round): number {
  const bonus = round.data?.["bonus"];
  return typeof bonus === "number" && Number.isFinite(bonus) && bonus >= 0 ? bonus : SAFE_BONUS_DEFAULT;
}

/**
 * The digits of a Safe's code in question order; `null` where a question has no digit yet.
 * @param round - a Safe round
 */
export function safeCode(round: Round): readonly (number | null)[] {
  return round.questions.map((question) => digitOf(question.answer));
}

/** The digits a team can get right: the round's questions. */
function digits(round: Round): number {
  return round.questions.length;
}

/** The Safe's own screen. */
export const SAFE_SCREENS = {
  /** The whole code at once and the door opening: what a Safe shows when its answers are not shown one by one. */
  code: "code",
} as const;

/** How long each digit's slide stays before the next comes by itself, in seconds (Moni 2026-11-26: the code is dialled as one sequence). */
export const SAFE_ANSWER_SECONDS = 4.5;

/**
 * A Safe's screens: as a standard round — or, when its answers are not shown one by one, the questions and
 * then one slide with the whole code.
 * @param round - a Safe round
 */
export function safeScreens(round: Round): readonly PlayerScreen[] {
  const last = round.questions.at(-1);
  if (round.answersTogether !== true || !last) return standardScreens(round);
  const roundId = round.id;
  return [
    { screen: STANDARD_SCREENS.rules, roundId },
    ...round.questions.map((question) => ({ screen: STANDARD_SCREENS.question, roundId, questionId: question.id })),
    { screen: STANDARD_SCREENS.answers, roundId },
    { screen: SAFE_SCREENS.code, roundId, questionId: last.id },
    { screen: STANDARD_SCREENS.score, roundId },
    { screen: STANDARD_SCREENS.board, roundId },
  ];
}

/** Round kind `safe`. */
export const safeRound: RoundKind = {
  id: "safe",
  answerSeconds: SAFE_ANSWER_SECONDS,
  screens: safeScreens,
  shape: { count: SAFE_QUESTIONS, answerType: "digit", canReorder: true, seconds: 45, pointsAt: () => 1, defaultData: () => ({ bonus: SAFE_BONUS_DEFAULT }) },
  isDataValid: (data) => data?.["bonus"] === undefined || (typeof data["bonus"] === "number" && Number.isFinite(data["bonus"]) && data["bonus"] >= 0),
  maxPoints: (round) => digits(round) + safeBonus(round),
  entry: {
    max: digits,
    toPoints: (round, entered) => {
      const right = Math.max(0, Math.min(digits(round), Math.round(entered)));
      return right === digits(round) && right > 0 ? right + safeBonus(round) : right;
    },
    fromPoints: (round, points) => Math.max(0, Math.min(digits(round), Math.round(points))),
  },
};
