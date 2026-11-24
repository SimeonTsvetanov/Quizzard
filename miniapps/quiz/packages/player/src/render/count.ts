// "3/10": where something is in a run — the question in its round, the round in the quiz. The number
// it is at is the part that matters and is drawn in full; the total after the stroke is quieter, but
// still readable from the back of the room (its contrast is checked in tests/e2e). A screen reader
// hears it in words ("3 of 10"), never "three slash ten".
import { h } from "./h.ts";

/**
 * Draws a counter.
 * @param now - where it is, from 1
 * @param total - out of how many
 * @param spoken - the same in words, e.g. "3 of 10"
 */
export function countMark(now: number, total: number, spoken: string): HTMLElement {
  return h("span", { class: "quiz-count", "data-count": `${String(now)}/${String(total)}` },
    h("span", { class: "quiz-count-now", "aria-hidden": "true" }, String(now)),
    h("span", { class: "quiz-count-of", "aria-hidden": "true" }, `/${String(total)}`),
    h("span", { class: "quiz-count-said" }, spoken));
}
