// The Safe on the slide (SPEC §10): the vault door beside the question (above it on an upright stage).
// On a question the current code window glows; on the answers the digits found so far stand in their
// windows, and at each reveal the dial turns to the digit and it clicks into its window — the fifth
// pulls the bolts back and swings the door open on the gold.
import { type Question, digitOf, safeCode } from "@simeonts/quizzard-quiz-core/play";
import { digitPart } from "../answers/digit.ts";
import type { RoundSlideView, SlideRound } from "../registry.ts";
import { h } from "../h.ts";
import { type CodeState, type VaultInput, vaultFigure } from "./vault.ts";

/**
 * The dial's angle that puts a digit under the pointer, in degrees.
 * @param digit - the digit, or `null` (the dial at rest on 0)
 */
export function dialAngle(digit: number | null): number {
  return digit === null ? 0 : -36 * digit;
}

/** The state of one code window and what it shows. */
function windowOf(code: readonly (number | null)[], k: number, { index, phase, reveal }: RoundSlideView): { state: CodeState; text: string } {
  const digit = code[k] ?? null;
  const shown = digit === null ? "?" : String(digit);
  if (phase === "question") {
    if (k === index) return { state: "current", text: "?" };
    return k < index ? { state: "asked", text: "?" } : { state: "empty", text: "·" };
  }
  if (k < index) return { state: "set", text: shown };
  if (k === index) return reveal ? { state: "setting", text: shown } : { state: "current", text: "?" };
  return { state: "asked", text: "?" };
}

/**
 * What the vault shows on a slide of the round.
 * @param view - the round, the question's place, question or answer, revealed or not
 */
export function vaultState(view: RoundSlideView): VaultInput {
  const code = safeCode(view.round);
  const count = code.length;
  const windows = code.map((_, k) => windowOf(code, k, view));
  const isAnswer = view.phase === "answer";
  const from = isAnswer && view.index > 0 ? dialAngle(code[view.index - 1] ?? null) : 0;
  const isTurning = isAnswer && view.reveal;
  // A whole turn more each time, one way and then the other, as a combination is dialled.
  const to = isTurning ? dialAngle(code[view.index] ?? null) + (view.index % 2 === 0 ? -360 : 360) : from;
  const door = isTurning && view.index === count - 1 ? "opening" : "closed";
  return { windows, dial: { from, to, isTurning }, door, label: view.labels.special.safe(view.index + 1, count) };
}

function art(_question: Question, view: RoundSlideView): HTMLElement {
  return h("div", { class: "quiz-slide-art", "data-art": "safe" }, vaultFigure(vaultState(view)));
}

/** The answer area: "Answer with one digit"; at the reveal "Digit 3 of the code" and the digit. */
function answer(question: Question, view: RoundSlideView): HTMLElement {
  return digitPart(digitOf(question.answer), view, view.reveal ? view.labels.special.codeDigit(view.index + 1) : view.labels.special.oneDigit);
}

/** Round kind `safe` on the slide. */
export const safeRoundSlide: SlideRound = { id: "safe", parts: { art, answer } };
