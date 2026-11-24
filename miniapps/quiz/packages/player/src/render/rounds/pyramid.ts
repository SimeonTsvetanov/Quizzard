// The Golden pyramid on the slide (SPEC §10): four tiers of gold blocks — 1, 2, 3, 4 — beside the
// question (above it on an upright stage). The current question's tier glows; the tiers before it are
// filled; at the reveal the tier's blocks turn over one by one and the accepted answers follow as gold
// tiles. Before the reveal the answer area shows the numbered lines the teams fill in.
import { type Question, acceptedItems, pyramidAsks } from "@simeonts/quizzard-quiz-core/play";
import { acceptedPart } from "../answers/list.ts";
import { h } from "../h.ts";
import { icon } from "../icons.ts";
import type { RoundSlideView, SlideRound } from "../registry.ts";

/**
 * How a tier looks: `ahead` (to come), `asked` (its question was asked), `current` (this question),
 * `turning` (its blocks turn over now), `open` (revealed).
 */
type TierState = "ahead" | "asked" | "current" | "turning" | "open";

/**
 * The state of a tier on a slide.
 * @param tier - the tier's index (its question's place), from 0
 * @param view - where the slide is
 */
export function tierState(tier: number, { index, phase, reveal }: Pick<RoundSlideView, "index" | "phase" | "reveal">): TierState {
  if (tier === index) return reveal ? "turning" : "current";
  if (phase === "question") return tier < index ? "asked" : "ahead";
  return tier < index ? "open" : "asked";
}

/** One tier: as many blocks as its question asks for answers. */
function tier(index: number, state: TierState): HTMLElement {
  const blocks = Array.from({ length: pyramidAsks(index) }, (_, block) => {
    const element = h("span", { class: "quiz-pyramid-block" }, h("span", { class: "quiz-pyramid-face" }, String(block + 1)), h("span", { class: "quiz-pyramid-face quiz-pyramid-face--back" }, icon("check", 16)));
    element.style.setProperty("--quiz-i", String(block));
    return element;
  });
  return h("li", { class: "quiz-pyramid-tier", "data-state": state }, ...blocks);
}

/**
 * The pyramid with its tiers in a state.
 * @param count - how many tiers (the round's questions)
 * @param state - each tier's state
 * @param label - its name for screen readers
 */
export function pyramidFigure(count: number, state: (tier: number) => string, label: string): HTMLElement {
  const tiers = Array.from({ length: count }, (_, index) => tier(index, state(index) as TierState));
  return h("div", { class: "quiz-pyramid", role: "img", "aria-label": label }, h("ol", { class: "quiz-pyramid-tiers" }, ...tiers), h("span", { class: "quiz-pyramid-base", "aria-hidden": "true" }));
}

function art(_question: Question, view: RoundSlideView): HTMLElement {
  const count = view.round.questions.length;
  const figure = pyramidFigure(count, (index) => tierState(index, view), view.labels.special.pyramid(view.index + 1, count));
  return h("div", { class: "quiz-slide-art", "data-art": "pyramid" }, figure);
}

/** Before the reveal: "Write 3 answers", three numbered lines and the rule; at the reveal the accepted answers. */
function answer(question: Question, view: RoundSlideView): HTMLElement {
  const asks = pyramidAsks(view.index);
  // The tier's blocks turn first; the tiles follow.
  if (view.reveal) return acceptedPart(acceptedItems(question.answer), view, asks);
  const lines = Array.from({ length: asks }, (_, line) => h("li", { class: "quiz-pyramid-line" }, h("span", { class: "quiz-pyramid-line-n" }, String(line + 1)), h("span", { class: "quiz-slide-line" })));
  return h("div", { class: "quiz-pyramid-ask" },
    h("span", { class: "quiz-slide-kicker" }, view.labels.special.write(asks)),
    h("ol", { class: "quiz-pyramid-lines", "data-count": String(asks) }, ...lines),
    h("span", { class: "quiz-pyramid-rule" }, view.labels.special.over(asks)));
}

/** Round kind `pyramid` on the slide. */
export const pyramidRoundSlide: SlideRound = { id: "pyramid", parts: { art, answer } };
