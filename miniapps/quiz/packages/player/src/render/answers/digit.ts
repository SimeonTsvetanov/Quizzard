import { digitOf, digitReveal } from "@simeonts/quizzard-quiz-core/play";
import { h } from "../h.ts";
import type { SlideView, StageAnswer } from "../registry.ts";

/**
 * One digit in its window: "?" until the reveal, then the digit (SPEC §10, the Safe).
 * @param digit - the digit, or `null` while none is picked
 * @param view - how the slide is shown
 * @param kicker - the words above the window
 */
export function digitPart(digit: number | null, { reveal, labels }: SlideView, kicker: string): HTMLElement {
  const value = digit === null ? labels.emptyAnswer : String(digit);
  const shown = reveal ? value : "?";
  return h("div", { class: "quiz-digit", ...(reveal ? { "data-revealed": "" } : {}) },
    h("span", { class: "quiz-slide-kicker" }, kicker),
    h("span", { class: "quiz-digit-box" }, h("span", { class: "quiz-digit-value" }, shown)));
}

/** Answer type `digit` on the slide: an empty window; at the reveal the digit. */
export const digitAnswerSlide: StageAnswer = {
  id: "digit",
  text: digitReveal,
  parts: { slide: (answer, view) => digitPart(digitOf(answer), view, view.reveal ? view.labels.answer : view.labels.special.oneDigit) },
};
