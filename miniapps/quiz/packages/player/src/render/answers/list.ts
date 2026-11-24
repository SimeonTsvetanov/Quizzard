import { type Answer, acceptedItems, listReveal } from "@simeonts/quizzard-quiz-core/play";
import { h } from "../h.ts";
import type { SlideLabels, SlideView, StageAnswer } from "../registry.ts";

/** Accepted answers a slide shows at most; the rest are "+N more" (the host has the whole list). */
export const LIST_SHOWN = 12;
/** Accepted answers the round's list of answers shows at most, before "+N". */
export const LIST_LINE_SHOWN = 6;

/**
 * The accepted answers as gold tiles that turn over one after the other, the first {@link LIST_SHOWN}
 * and "+N more" (SPEC §10).
 * @param items - the accepted answers
 * @param labels - the words
 * @param delay - how many blocks turn before the first tile (the pyramid's tier at the reveal)
 */
export function acceptedTiles(items: readonly string[], labels: SlideLabels, delay = 0): HTMLElement {
  const shown = items.slice(0, LIST_SHOWN);
  const tiles = shown.map((item, index) => {
    const tile = h("li", { class: "quiz-tile" }, item);
    tile.style.setProperty("--quiz-i", String(index));
    return tile;
  });
  if (items.length > shown.length) {
    const more = h("li", { class: "quiz-tile quiz-tile--more" }, labels.special.more(items.length - shown.length));
    more.style.setProperty("--quiz-i", String(shown.length));
    tiles.push(more);
  }
  const size = ["l", "m", "s"][[4, 8].filter((most) => shown.length > most).length] ?? "s";
  const list = h("ul", { class: "quiz-tiles", "data-size": size }, ...tiles);
  // The tiles wait for the blocks before them to turn (rounds.css: a block every 0.22 s, 0.6 s each).
  if (delay > 0) list.style.setProperty("--quiz-wait", `${(delay * 0.22 + 0.7).toFixed(2)}s`);
  return list;
}

/**
 * The accepted answers at the reveal under their heading; nothing for a list with none.
 * @param items - the accepted answers
 * @param view - how the slide is shown
 * @param delay - see {@link acceptedTiles}
 */
export function acceptedPart(items: readonly string[], { labels }: SlideView, delay = 0): HTMLElement {
  if (items.length === 0) return h("div", { class: "quiz-slide-open", "data-revealed": "" }, h("span", { class: "quiz-slide-right" }, labels.emptyAnswer));
  return h("div", { class: "quiz-accepted", "data-revealed": "" },
    h("span", { class: "quiz-slide-kicker" }, `${labels.special.accepted} · ${String(items.length)}`),
    acceptedTiles(items, labels, delay));
}

/** The first few accepted answers and how many more: "Ohio, Iowa, Utah … +47". */
function listLine(answer: Answer): string {
  const items = acceptedItems(answer);
  const shown = items.slice(0, LIST_LINE_SHOWN).join(", ");
  return items.length > LIST_LINE_SHOWN ? `${shown} … +${String(items.length - LIST_LINE_SHOWN)}` : shown;
}

/** Answer type `list` on the slide: a line to write on; at the reveal the accepted answers as tiles. */
export const listAnswerSlide: StageAnswer = {
  id: "list",
  text: listReveal,
  line: listLine,
  parts: {
    slide: (answer, view) => (view.reveal ? acceptedPart(acceptedItems(answer), view) : h("div", { class: "quiz-slide-open" }, h("span", { class: "quiz-slide-line" }))),
  },
};
