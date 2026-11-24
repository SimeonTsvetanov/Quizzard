// The host panel (presenter mode): once the audience window is open, the host's window stops being
// the stage and becomes this — what the room sees now and what comes next (two small stages), the
// right answer before it is revealed, the timer, the screen's own controls (team names, score entry,
// the tiebreak) and the way through the game. Real size and the page's theme: it is a tool, not a slide.
import { peekNext } from "../game/step.ts";
import type { GameState } from "../game/state.ts";
import { h } from "../render/h.ts";
import { contextOf, type DrawnView, type PlayEnv } from "../views/context.ts";
import { fallbackView } from "../views/index.ts";
import { barButton, setOff } from "./bar.ts";
import type { Commands } from "./commands.ts";
import { createCover, createMediaCard } from "./panel-media.ts";
import { createStage } from "./stage.ts";

/** A host panel. */
export interface Panel {
  readonly element: HTMLElement;
  update(state: GameState): void;
  destroy(): void;
}

function card(title: string, name: string, ...children: (Node | string)[]): HTMLElement {
  return h("section", { class: "qp-card", "data-card": name }, h("h3", { class: "qp-card-title" }, title), ...children);
}

/** "12 / 48" and where that is: the round's name and the question's number. */
function whereText(env: PlayEnv, state: GameState): string {
  const context = contextOf(env, state, { canEdit: false, clock: null });
  const position = env.t("host.position", { n: state.index + 1, total: state.screens.length });
  if (!context.round) return position;
  const question = context.question ? ` · ${env.t("question.where", { n: context.round.questions.indexOf(context.question) + 1, total: context.round.questions.length })}` : "";
  return `${position} · ${context.round.name}${question}`;
}

/** The timer as the host reads it: m:ss. */
function clockText(leftMs: number): string {
  const seconds = Math.ceil(leftMs / 1000);
  return `${String(Math.floor(seconds / 60))}:${String(seconds % 60).padStart(2, "0")}`;
}

/** The answer card's content for the screen on show. */
function answerLines(env: PlayEnv, state: GameState): readonly HTMLElement[] {
  const context = contextOf(env, state, { canEdit: false, clock: null });
  const answer = (env.views.get(context.screen.screen) ?? fallbackView).answer?.(context) ?? null;
  if (answer === null) return [h("p", { class: "qp-card-empty" }, env.t("host.noAnswer"))];
  const lines = [h("p", { class: "qp-host-answer", "data-host-answer": "" }, answer.text === "" ? env.labels.emptyAnswer : answer.text), h("p", { class: "qp-host-points" }, answer.points)];
  if (answer.explanation !== "") lines.push(h("p", { class: "qp-host-explanation" }, answer.explanation));
  // The host's own note: only ever here, in the host's window.
  if (answer.note !== "") lines.push(h("p", { class: "qp-host-note", "data-host-note": "" }, h("span", { class: "qp-host-note-label" }, env.t("host.note")), answer.note));
  return lines;
}

/** The screen's own controls, drawn again only when its structure changes. */
function createControls(env: PlayEnv): { readonly element: HTMLElement; update(state: GameState): void } {
  const element = h("div", { class: "qp-host-controls" });
  let drawn: { key: string; view: DrawnView | null } | null = null;
  return {
    element,
    update(state) {
      const context = contextOf(env, state, { canEdit: true, clock: null });
      const entry = env.views.get(context.screen.screen) ?? fallbackView;
      const key = `${String(state.index)}:${entry.structure?.(state) ?? ""}`;
      if (drawn?.key === key) {
        drawn.view?.sync?.(state);
        return;
      }
      const focused = element.contains(document.activeElement) ? document.activeElement?.getAttribute("data-focus") : null;
      const view = entry.panel?.(context) ?? null;
      element.replaceChildren(...(view ? [view.element] : []));
      element.hidden = view === null;
      if (focused != null) element.querySelector<HTMLElement>(`[data-focus="${CSS.escape(focused)}"]`)?.focus();
      drawn = { key, view };
    },
  };
}

/**
 * Creates the host panel.
 * @param env - the game's fixed parts
 * @param commands - what its buttons do
 */
export function createPanel(env: PlayEnv, commands: Commands): Panel {
  const { t } = env;
  const now = createStage(env, { canEdit: false, isLive: false });
  const next = createStage(env, { canEdit: false, isLive: false });
  const where = h("p", { class: "qp-host-where", "data-host-where": "" });
  const clock = h("p", { class: "qp-host-clock", "data-host-clock": "" });
  const answer = card(t("host.answer"), "answer");
  const controls = createControls(env);
  const media = createMediaCard(env, commands);
  const cover = createCover(env, commands);
  const back = barButton("left", t("control.back"), () => { commands.dispatch({ type: "back" }); }, { "data-control": "back", "data-words": "" });
  const forward = barButton("right", t("control.next"), () => { commands.dispatch({ type: "next" }); }, { "data-control": "next", "data-words": "", "data-primary": "" });
  const toggle = barButton("play", t("control.start"), () => { commands.dispatch({ type: "timerToggle" }); }, { "data-control": "timer", "data-words": "" });
  const reset = barButton("reset", t("control.reset"), () => { commands.dispatch({ type: "timerReset" }); }, { "data-control": "reset" });
  const body = h("div", { class: "qp-panel-body" },
    h("header", { class: "qp-panel-head" },
      h("div", { class: "qp-panel-titles" }, h("h2", { class: "qp-panel-title" }, env.file.quiz.name.trim() === "" ? t("title.unnamed") : env.file.quiz.name), where),
      h("div", { class: "qp-bar-group" },
        cover.button,
        barButton("scores", t("control.scores"), commands.openScores, { "data-control": "scores" }),
        barButton("menu", t("control.menu"), commands.openMenu, { "data-control": "menu" }),
        barButton("x", t("control.closeAudience"), commands.toggleAudience, { "data-control": "audience", "data-words": "" }))),
    h("div", { class: "qp-panel-screens" }, card(t("host.now"), "now", now.element), card(t("host.next"), "next", next.element)),
    h("div", { class: "qp-panel-side" }, cover.element, card(t("host.timer"), "timer", clock, h("div", { class: "qp-bar-group" }, toggle, reset)), media.element, answer),
    controls.element);
  // The way through the game stays in reach under the part that scrolls.
  const element = h("div", { class: "qp-panel", "data-panel": "" }, body, h("div", { class: "qp-panel-nav" }, back, forward));
  return {
    element,
    update(state) {
      const upcoming = peekNext(state);
      const isRunning = state.timer.status === "running" || state.timer.status === "cue";
      const hasTimer = state.timer.totalMs > 0;
      const hasReveal = state.step < (state.screens[state.index]?.steps ?? 0);
      now.show(state);
      next.show(upcoming);
      next.element.toggleAttribute("data-same", upcoming === state);
      where.textContent = whereText(env, state);
      clock.textContent = hasTimer ? clockText(state.timer.leftMs) : t("host.noTimer");
      clock.setAttribute("data-status", hasTimer ? state.timer.status : "none");
      answer.replaceChildren(h("h3", { class: "qp-card-title" }, t("host.answer")), ...answerLines(env, state));
      controls.update(state);
      media.update(state);
      cover.update(state);
      setOff(back, state.index === 0 && state.step === 0);
      setOff(forward, upcoming === state);
      setOff(toggle, !hasTimer);
      setOff(reset, !hasTimer);
      toggle.setAttribute("aria-label", isRunning ? t("control.pause") : t("control.start"));
      toggle.lastElementChild?.replaceChildren(isRunning ? t("control.pause") : t("control.start"));
      forward.setAttribute("aria-label", hasReveal ? t("control.reveal") : t("control.next"));
      forward.lastElementChild?.replaceChildren(hasReveal ? t("control.reveal") : t("control.next"));
    },
    destroy() {
      now.destroy();
      next.destroy();
    },
  };
}
