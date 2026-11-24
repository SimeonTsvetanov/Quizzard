// "Scores cleared · Undo": a strip over the control bar for the one thing in the player that is done
// at once and may be regretted. It stays ten seconds — longer while the pointer or the focus is on
// it — and is announced politely. One offer at a time: a new one replaces the old.
import { h } from "../render/h.ts";

/** How long an offer stays. */
export const UNDO_MS = 10_000;

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
  let pending: (() => void) | null = null;
  const clear = (): void => {
    window.clearTimeout(timer);
    pending = null;
    element.hidden = true;
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
      wait();
    },
    clear,
  };
}
