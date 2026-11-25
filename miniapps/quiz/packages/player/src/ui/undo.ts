// "Scores cleared · Undo": a strip over the control bar for the one thing in the player that is done
// at once and may be regretted. It stays five seconds — longer while the pointer or the focus is on
// it — and goes at once when the host taps anywhere else, like the app's own notes
// (Moni 2026-11-25: the notes stood far too long). Announced politely. One offer at a time.
import { h } from "../render/h.ts";

/** How long an offer stays. */
export const UNDO_MS = 5000;
/** A tap this soon after the offer appeared is the end of the gesture that caused it: it does not take the offer away. */
const GRACE_MS = 400;

/** The strip and how to use it. */
export interface UndoStrip {
  readonly element: HTMLElement;
  /** Shows a message with the Undo button; `run` is called once if it is pressed in time. */
  /** `label` = the button's word for this offer, when it is not an Undo. */
  offer(message: string, run: () => void, label?: string): void;
  /** Takes the offer away (the player closes). */
  clear(): void;
}

/**
 * Creates the strip.
 * @param undoLabel - the button's word
 */
export function createUndoStrip(undoLabel: string): UndoStrip {
  const words = h("span", { class: "qp-undo-words" });
  const button = h("button", { type: "button", class: "qp-undo-button", "data-undo": "" }, undoLabel);
  const element = h("div", { class: "qp-undo", role: "status", "data-undo-strip": "" }, words, button);
  element.hidden = true;
  let timer = 0;
  let shownAt = 0;
  let pending: (() => void) | null = null;
  let outside = new AbortController();
  const clear = (): void => {
    window.clearTimeout(timer);
    outside.abort();
    pending = null;
    element.hidden = true;
  };
  /** A tap anywhere but on the strip takes the offer away (a key does not: S to look at the scores, then Undo, still works). */
  const listenOutside = (): void => {
    outside.abort();
    outside = new AbortController();
    const away = (event: Event): void => {
      if (performance.now() - shownAt < GRACE_MS || (event.target instanceof Node && element.contains(event.target))) return;
      clear();
    };
    document.addEventListener("pointerdown", away, { capture: true, signal: outside.signal });
  };
  const wait = (): void => {
    window.clearTimeout(timer);
    timer = window.setTimeout(clear, UNDO_MS);
  };
  button.addEventListener("click", () => {
    const run = pending;
    clear();
    run?.();
  });
  // Reaching for it never loses it (WCAG 2.2.1).
  for (const name of ["pointerenter", "focusin"]) element.addEventListener(name, () => { window.clearTimeout(timer); });
  for (const name of ["pointerleave", "focusout"]) element.addEventListener(name, () => { if (pending) wait(); });
  return {
    element,
    offer(message, run, label) {
      words.textContent = message;
      button.textContent = label ?? undoLabel;
      pending = run;
      element.hidden = false;
      shownAt = performance.now();
      listenOutside();
      wait();
    },
    clear,
  };
}
