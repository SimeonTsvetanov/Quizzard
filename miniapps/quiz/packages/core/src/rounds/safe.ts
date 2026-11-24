// Round kind `safe` (SPEC §10): five questions, each answered with one digit 0–9 — together the code
// of a safe. 1 point per right digit; all five open the safe and add the round's bonus on top.
import { SAFE_BONUS_DEFAULT } from "../limits.ts";
import type { Round } from "../model.ts";
import { digitOf } from "../answers/special-shapes.ts";
import type { RoundKind } from "./round-kind.ts";
import { standardScreens } from "./standard.ts";

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

/** Round kind `safe`. */
export const safeRound: RoundKind = {
  id: "safe",
  screens: standardScreens,
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
