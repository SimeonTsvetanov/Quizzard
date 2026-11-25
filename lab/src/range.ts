// The part of the clip to keep: two sliders (from, to) on the clip's own player, "start here" and
// "end here" at the player's position, and "play the chosen part".
import { button, el } from "./dom.ts";
import { clock, words } from "./text.ts";

/** The chosen part and its controls. */
export interface Range {
  readonly element: HTMLElement;
  readonly start: () => number;
  readonly end: () => number;
}

/** The least length of a cut, in seconds. */
const MIN_LENGTH = 0.5;

function slider(name: string): HTMLInputElement {
  return el("input", { type: "range", min: "0", max: "0", step: "0.1", value: "0", "data-range": name });
}

/**
 * Creates the range controls for a media element.
 * @param media - the clip's player
 */
export function createRange(media: HTMLMediaElement): Range {
  const from = slider("from");
  const to = slider("to");
  const fromText = el("output", {});
  const toText = el("output", {});
  const lengthText = el("p", { class: "lab-note", "data-range-length": "" });
  let stopAt: number | null = null;
  const draw = (): void => {
    fromText.textContent = clock(Number(from.value));
    toText.textContent = clock(Number(to.value));
    lengthText.textContent = `${words.length}: ${clock(Number(to.value) - Number(from.value))}`;
  };
  const set = (field: HTMLInputElement, value: number): void => {
    field.value = String(value);
    // The two never cross: the other end moves away by the least length.
    if (field === from && Number(to.value) < value + MIN_LENGTH) to.value = String(Math.min(Number(to.max), value + MIN_LENGTH));
    if (field === to && Number(from.value) > value - MIN_LENGTH) from.value = String(Math.max(0, value - MIN_LENGTH));
    draw();
  };
  media.addEventListener("loadedmetadata", () => {
    const duration = Number.isFinite(media.duration) ? Math.floor(media.duration * 10) / 10 : 0;
    for (const field of [from, to]) field.max = String(duration);
    to.value = String(duration);
    draw();
  });
  from.addEventListener("input", () => { set(from, Number(from.value)); media.currentTime = Number(from.value); });
  to.addEventListener("input", () => { set(to, Number(to.value)); media.currentTime = Number(to.value); });
  media.addEventListener("timeupdate", () => {
    if (stopAt === null || media.currentTime < stopAt) return;
    media.pause();
    stopAt = null;
  });
  const playPart = (): void => {
    media.currentTime = Number(from.value);
    stopAt = Number(to.value);
    void media.play().catch(() => undefined);
  };
  const row = (label: string, field: HTMLInputElement, text: HTMLElement, here: HTMLButtonElement): HTMLElement =>
    el("div", { class: "lab-range-row" }, el("label", {}, el("span", {}, label), field), text, here);
  const element = el("div", { class: "lab-range" },
    row(words.from, from, fromText, button(words.fromHere, () => { set(from, media.currentTime); }, { "data-here": "from" })),
    row(words.to, to, toText, button(words.toHere, () => { set(to, media.currentTime); }, { "data-here": "to" })),
    el("div", { class: "lab-row" }, button(words.playPart, playPart, { "data-play-part": "" }), lengthText));
  return { element, start: () => Number(from.value), end: () => Number(to.value) };
}
