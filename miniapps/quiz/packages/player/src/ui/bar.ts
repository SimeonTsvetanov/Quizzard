// The control bar under the stage, for a host who plays in one window: back, the timer, next, the
// scores, the menu, the audience window and full screen. Real size (44 px targets) whatever the
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
  button.addEventListener("click", run);
  return button;
}

/** Sets a button's mark and name. */
function face(button: HTMLButtonElement, name: StageIcon, label: string): void {
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
  const tools = h("div", { class: "qp-bar-group" },
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
      back.disabled = state.index === 0 && state.step === 0;
      next.disabled = state.index === state.screens.length - 1 && !hasReveal;
      timer.disabled = !hasTimer;
      reset.disabled = !hasTimer;
      face(timer, isRunning ? "pause" : "play", isRunning ? t("control.pause") : t("control.start"));
      face(next, hasReveal ? "eye" : "right", hasReveal ? t("control.reveal") : t("control.next"));
    },
  };
}
