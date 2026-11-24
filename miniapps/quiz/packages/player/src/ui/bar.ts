// The control bar under the stage, for a host who plays in one window: back, the timer, next, the
// black screen, the scores, the menu, the audience window and full screen. Real size (44 px targets) whatever the
// stage's scale. It dims while nobody touches it.
import type { GameState } from "../game/state.ts";
import type { Translate } from "../i18n/translate.ts";
import { h, releaseAfterPointer } from "../render/h.ts";
import { icon, type StageIcon } from "../render/icons.ts";
import type { Commands } from "./commands.ts";

/** A bar and how to bring it up to date. */
export interface Bar {
  readonly element: HTMLElement;
  update(state: GameState): void;
}

/**
 * A bar button: a mark, its name as the tooltip and — for the main ones — as words too. A click
 * with the mouse gives the focus back (render/h.ts `releaseAfterPointer`).
 * @param name - the mark
 * @param label - what it does
 * @param run - the command
 * @param props - more attributes; `data-words` shows the label next to the mark
 */
export function barButton(name: StageIcon, label: string, run: () => void, props: Readonly<Record<string, string>> = {}): HTMLButtonElement {
  const button = h("button", { type: "button", class: "qp-bar-button", "aria-label": label, title: label, ...props }, icon(name, 22), h("span", { class: "qp-bar-words", "aria-hidden": "true" }, label));
  // Before the command runs: a dialog it opens gives the focus back to where it was when it closes.
  releaseAfterPointer(button);
  button.addEventListener("click", () => { if (!isOff(button)) run(); });
  return button;
}

/** Whether a bar button is switched off (`aria-disabled`): it stays focusable, a press does nothing. */
function isOff(button: HTMLElement): boolean {
  return button.getAttribute("aria-disabled") === "true";
}

/**
 * Switches a bar button off or on without taking the focus from it: a focused button that became
 * `disabled` would drop the keyboard's place to the page (WCAG 2.4.3).
 * @param button - a button made by {@link barButton}
 * @param off - whether it has nothing to do right now
 */
export function setOff(button: HTMLButtonElement, off: boolean): void {
  if (off) button.setAttribute("aria-disabled", "true"); else button.removeAttribute("aria-disabled");
}

/**
 * Sets a bar button's mark and name; nothing is redrawn when they are already these.
 * @param button - a button made by {@link barButton}
 * @param name - the mark
 * @param label - what it does now
 */
export function setFace(button: HTMLButtonElement, name: StageIcon, label: string): void {
  if (button.getAttribute("aria-label") === label) return;
  button.setAttribute("aria-label", label);
  button.title = label;
  button.replaceChildren(icon(name, 22), h("span", { class: "qp-bar-words", "aria-hidden": "true" }, label));
}

/**
 * Creates the control bar.
 * @param t - the translator
 * @param commands - what the buttons do
 */
export function createBar(t: Translate, commands: Commands): Bar {
  const back = barButton("left", t("control.back"), () => { commands.dispatch({ type: "back" }); }, { "data-control": "back" });
  const timer = barButton("play", t("control.start"), () => { commands.dispatch({ type: "timerToggle" }); }, { "data-control": "timer" });
  const reset = barButton("reset", t("control.reset"), () => { commands.dispatch({ type: "timerReset" }); }, { "data-control": "reset" });
  const next = barButton("right", t("control.next"), () => { commands.dispatch({ type: "next" }); }, { "data-control": "next", "data-words": "", "data-primary": "" });
  const black = barButton("black", t("control.black"), () => { commands.dispatch({ type: "black" }); }, { "data-control": "black", "aria-pressed": "false" });
  const tools = h("div", { class: "qp-bar-group" },
    black,
    barButton("scores", t("control.scores"), commands.openScores, { "data-control": "scores" }),
    barButton("audience", t("control.audience"), commands.toggleAudience, { "data-control": "audience" }),
    barButton("fullscreen", t("control.fullscreen"), commands.toggleFullscreen, { "data-control": "fullscreen" }),
    barButton("menu", t("control.menu"), commands.openMenu, { "data-control": "menu" }));
  const element = h("div", { class: "qp-bar", role: "toolbar", "aria-label": t("host.title") },
    h("div", { class: "qp-bar-group" }, back, timer, reset),
    next,
    tools);
  if (commands.exit) element.prepend(barButton("x", t("control.exit"), commands.exit, { "data-control": "exit" }));
  return {
    element,
    update(state) {
      const screen = state.screens[state.index];
      const isRunning = state.timer.status === "running" || state.timer.status === "cue";
      const hasTimer = state.timer.totalMs > 0;
      const hasReveal = state.step < (screen?.steps ?? 0);
      setOff(back, state.index === 0 && state.step === 0);
      setOff(next, state.index === state.screens.length - 1 && !hasReveal);
      setOff(timer, !hasTimer);
      setOff(reset, !hasTimer);
      black.setAttribute("aria-pressed", String(state.curtain?.kind === "black"));
      setFace(timer, isRunning ? "pause" : "play", isRunning ? t("control.pause") : t("control.start"));
      setFace(next, hasReveal ? "eye" : "right", hasReveal ? t("control.reveal") : t("control.next"));
    },
  };
}
