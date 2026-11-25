// The host panel (presenter mode): once the audience window is open, the host's window stops being
// the stage and becomes this — what the room sees now and what comes next (two small stages), the
// right answer before it is revealed, the timer, the screen's own controls (team names, score entry,
// the tiebreak). The way through the game is the player's one control bar, the same as under the
// stage (ui/bar.ts). Real size and the page's theme: it is a tool, not a slide.
import { peekNext } from "../game/step.ts";
import type { GameState } from "../game/state.ts";
import { h } from "../render/h.ts";
import { contextOf, type DrawnView, type PlayEnv } from "../views/context.ts";
import { fallbackView } from "../views/index.ts";
import type { Commands } from "./commands.ts";
import { createCover, createMediaCard } from "./panel-media.ts";
import { createScoresCard, createTimerCard } from "./panel-tools.ts";
import { count, roundCount } from "../views/parts.ts";
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

/** Where the game is: "Round 2/5 · History · Question 3/10" — or, outside a round, the screen's place in the game. */
function whereParts(env: PlayEnv, state: GameState): (Node | string)[] {
  const context = contextOf(env, state, { canEdit: false, clock: null });
  if (!context.round) return [count(env, state.index + 1, state.screens.length)];
  const parts: (Node | string)[] = [...roundCount(env, context.round), " · ", context.round.name];
  if (context.question) parts.push(" · ", `${env.t("question.word")} `, count(env, context.round.questions.indexOf(context.question) + 1, context.round.questions.length));
  return parts;
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
 * @param commands - what the media card's buttons do
 */
export function createPanel(env: PlayEnv, commands: Commands): Panel {
  const { t } = env;
  const now = createStage(env, { canEdit: false, isLive: false });
  const next = createStage(env, { canEdit: false, isLive: false });
  const where = h("p", { class: "qp-host-where", "data-host-where": "" });
  const timer = createTimerCard(env, commands);
  const scores = createScoresCard(env);
  const answer = card(t("host.answer"), "answer");
  const controls = createControls(env);
  const media = createMediaCard(env, commands);
  const cover = createCover(env);
  const body = h("div", { class: "qp-panel-body" },
    h("header", { class: "qp-panel-head" },
      h("div", { class: "qp-panel-titles" }, h("h2", { class: "qp-panel-title" }, env.file.quiz.name.trim() === "" ? t("title.unnamed") : env.file.quiz.name), where)),
    h("div", { class: "qp-panel-screens" }, card(t("host.now"), "now", now.element), card(t("host.next"), "next", next.element)),
    h("div", { class: "qp-panel-side" }, cover.element, timer.element, media.element, answer),
    controls.element, scores.element);
  // The way through the game is the player's own control bar: the player puts it under this part (player.ts).
  const element = h("div", { class: "qp-panel", "data-panel": "" }, body);
  return {
    element,
    update(state) {
      const upcoming = peekNext(state);
      now.show(state);
      next.show(upcoming);
      next.element.toggleAttribute("data-same", upcoming === state);
      where.replaceChildren(...whereParts(env, state));
      timer.update(state);
      scores.update(state);
      answer.replaceChildren(h("h3", { class: "qp-card-title" }, t("host.answer")), ...answerLines(env, state));
      controls.update(state);
      media.update(state);
      cover.update(state);
    },
    destroy() {
      now.destroy();
      next.destroy();
    },
  };
}
