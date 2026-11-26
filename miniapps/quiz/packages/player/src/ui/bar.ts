// The player's one control bar: back, the timer, the primary button, the black screen, the scores,
// the audience window, full screen and the menu — under the stage for a host who plays in one window
// and, unchanged, under the host panel once the audience window is open. Real size (44 px targets)
// whatever the stage's scale. Every button has its name as a tooltip, with its key.
import type { GameState } from "../game/state.ts";
import type { Translate } from "../i18n/translate.ts";
import { h, releaseAfterPointer } from "../render/h.ts";
import { icon, type StageIcon } from "../render/icons.ts";
import type { Commands } from "./commands.ts";

/** A bar and how to bring it up to date. */
export interface Bar {
  readonly element: HTMLElement;
  /** Brings the buttons up to date; `isPresenting` = the audience window is open (the bar stands under the host panel). */
  update(state: GameState, isPresenting?: boolean): void;
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

/** The key of each control, shown in its tooltip — the same on the stage's bar and under the host panel. */
const KEY_HINTS: Readonly<Record<string, string>> = { back: "←", next: "Space", timer: "T", reset: "R", black: "B", scores: "S", fullscreen: "F", menu: "M" };

/** The tooltip of a control: what it does and, where it has one, its key — "Next (Space)". */
function hinted(button: HTMLButtonElement): void {
  const key = KEY_HINTS[button.getAttribute("data-control") ?? ""];
  const label = button.getAttribute("aria-label") ?? "";
  button.title = key === undefined ? label : `${label} (${key})`;
  if (key !== undefined) button.setAttribute("aria-keyshortcuts", key);
}

/** What the primary button says: "Start" on the first screen, "Show answer" while a reveal is left, else "Next". */
function primaryFace(state: GameState): { readonly icon: StageIcon; readonly label: "control.begin" | "control.reveal" | "control.next" } {
  const screen = state.screens[state.index];
  // The parts of an upright screen are not answers to show: its button says "Next".
  const hasReveal = state.step < (screen?.steps ?? 0) && screen?.upright !== true;
  if (hasReveal) return { icon: "eye", label: "control.reveal" };
  return state.index === 0 ? { icon: "play", label: "control.begin" } : { icon: "right", label: "control.next" };
}

/**
 * Creates the control bar: one bar for the whole player. Under the stage and — once the audience
 * window is open — under the host panel it is the same element with the same buttons in the same
 * places: leave · back, forward, timer, restart · the primary button, always in the middle and of one width ·
 * black screen, scores, audience window, full screen, menu.
 * @param t - the translator
 * @param commands - what the buttons do
 */
export function createBar(t: Translate, commands: Commands): Bar {
  const back = barButton("left", t("control.back"), () => { commands.dispatch({ type: "back" }); }, { "data-control": "back" });
  // A second way forward beside Back, where one looks for it (Moni 2026-11-26); the wide button in the middle stays the main one.
  const forward = barButton("right", t("control.forward"), () => { commands.dispatch({ type: "next" }); }, { "data-control": "forward" });
  const timer = barButton("play", t("control.start"), () => { commands.dispatch({ type: "timerToggle" }); }, { "data-control": "timer" });
  const reset = barButton("reset", t("control.reset"), () => { commands.dispatch({ type: "timerReset" }); }, { "data-control": "reset" });
  const next = barButton("right", t("control.next"), () => { commands.dispatch({ type: "next" }); }, { "data-control": "next", "data-words": "", "data-primary": "" });
  const black = barButton("black", t("control.black"), () => { commands.dispatch({ type: "black" }); }, { "data-control": "black", "aria-pressed": "false" });
  const audience = barButton("audience", t("control.audience"), commands.toggleAudience, { "data-control": "audience", "aria-pressed": "false" });
  const tools = h("div", { class: "qp-bar-group qp-bar-end" },
    black,
    barButton("scores", t("control.scores"), commands.openScores, { "data-control": "scores" }),
    audience,
    barButton("fullscreen", t("control.fullscreen"), commands.toggleFullscreen, { "data-control": "fullscreen" }),
    barButton("menu", t("control.menu"), commands.openMenu, { "data-control": "menu" }));
  const start = h("div", { class: "qp-bar-group qp-bar-start" }, back, forward, timer, reset);
  if (commands.exit) start.prepend(barButton("x", t("control.exit"), commands.exit, { "data-control": "exit" }));
  const element = h("div", { class: "qp-bar", role: "toolbar", "aria-label": t("host.title") }, start, next, tools);
  const buttons = [...element.querySelectorAll("button")];
  for (const button of buttons) hinted(button);
  return {
    element,
    update(state, isPresenting = false) {
      const isRunning = state.timer.status === "running" || state.timer.status === "cue";
      const hasTimer = state.timer.totalMs > 0;
      const face = primaryFace(state);
      setOff(back, state.index === 0 && state.step === 0);
      const isLast = state.index === state.screens.length - 1 && face.label !== "control.reveal";
      setOff(next, isLast);
      setOff(forward, isLast);
      setOff(timer, !hasTimer);
      setOff(reset, !hasTimer);
      black.setAttribute("aria-pressed", String(state.curtain?.kind === "black"));
      audience.setAttribute("aria-pressed", String(isPresenting));
      setFace(timer, isRunning ? "pause" : "play", isRunning ? t("control.pause") : t("control.start"));
      setFace(next, face.icon, t(face.label));
      setFace(audience, "audience", t(isPresenting ? "control.closeAudience" : "control.audience"));
      for (const button of [timer, next, audience]) hinted(button);
    },
  };
}
