// The shapes of the answers of the special rounds (SPEC §10) with hand-written checks and their texts —
// no Zod here, like shapes.ts: the exported player imports this file through `play.ts`. The Zod schemas
// next to each answer type (list.ts, digit.ts) describe the same shapes for validation.
import type { Answer } from "../model.ts";

/** The answer of type `list`: every answer that counts (a Golden pyramid question's accepted answers). */
export interface ListAnswer extends Answer {
  readonly type: "list";
  readonly items: readonly string[];
}

/** The answer of type `digit`: one digit 0–9 (a Safe question); left out until the author picks it. */
export interface DigitAnswer extends Answer {
  readonly type: "digit";
  readonly digit?: number;
}

/**
 * Narrows an answer to the `list` shape.
 * @param answer - any answer
 */
export function isListAnswer(answer: Answer): answer is ListAnswer {
  const items = answer["items"];
  return answer.type === "list" && Array.isArray(items) && items.every((item) => typeof item === "string");
}

/**
 * Whether a value is one digit 0–9.
 * @param value - anything
 */
export function isDigit(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 9;
}

/**
 * Narrows an answer to the `digit` shape: `digit` absent or a whole number 0–9.
 * @param answer - any answer
 */
export function isDigitAnswer(answer: Answer): answer is DigitAnswer {
  return answer.type === "digit" && (answer["digit"] === undefined || isDigit(answer["digit"]));
}

/**
 * The accepted answers that have text, trimmed, in their order.
 * @param answer - any answer; another shape gives none
 */
export function acceptedItems(answer: Answer): readonly string[] {
  if (!isListAnswer(answer)) return [];
  return answer.items.map((item) => item.trim()).filter((item) => item !== "");
}

/**
 * The digit of a `digit` answer, or `null` while none is picked.
 * @param answer - any answer; another shape gives `null`
 */
export function digitOf(answer: Answer): number | null {
  return isDigitAnswer(answer) && answer.digit !== undefined ? answer.digit : null;
}

/**
 * The reveal text of a list: every accepted answer, separated by commas.
 * @param answer - any answer; another shape gives ""
 */
export function listReveal(answer: Answer): string {
  return acceptedItems(answer).join(", ");
}

/**
 * The reveal text of a digit: the digit, or "" while none is picked.
 * @param answer - any answer; another shape gives ""
 */
export function digitReveal(answer: Answer): string {
  const digit = digitOf(answer);
  return digit === null ? "" : String(digit);
}
