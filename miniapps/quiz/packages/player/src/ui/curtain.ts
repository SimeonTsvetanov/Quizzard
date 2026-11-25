// What covers the stage: the black screen ("eyes on the host"), or a break. A break is more than its
// countdown (Moni 2026-11-24): while people stretch their legs the room reads the standings so far
// and the answers of the round just played — never of a round still in play. Ending the break shows
// the screen the game was on.
import { clockText } from "@simeonts/quizzard-quiz-core/play";
import { standings } from "../game/scores.ts";
import type { GameState } from "../game/state.ts";
import { h } from "../render/h.ts";
import type { PlayEnv } from "../views/context.ts";
import { pillButton, scoreDigest } from "../views/parts.ts";
import { BREAK_STEPS, answerList, fitRecap, recapRound } from "../views/recap.ts";

/** A curtain and how to bring it up to date. */
export interface Curtain {
  readonly element: HTMLElement;
  show(state: GameState): void;
  /** Fits the break's lists to the stage; called when the stage's size changes. */
  layout(): void;
}

/** The standings so far: place, name, points — or nothing before anyone has a point. */
function standingsCard(env: PlayEnv, state: GameState): HTMLElement | null {
  const lines = standings(state);
  if (!lines.some((line) => line.total > 0)) return null;
  const rows = lines.map((line) => h("li", { class: "qp-break-team", "data-break-team": line.team.id },
    h("span", { class: "qp-break-rank" }, h("span", { class: "qp-visually-hidden" }, env.t("board.place", { n: line.rank })), h("span", { "aria-hidden": "true" }, String(line.rank))),
    h("span", { class: "qp-break-name" }, line.team.name),
    h("span", { class: "qp-break-points" }, env.number(line.total))));
  const list = h("ol", { class: "qp-break-teams", ...(rows.length > 6 ? { "data-split": "" } : {}) }, ...rows);
  list.style.setProperty("--qp-break-rows", String(Math.max(1, rows.length > 6 ? Math.ceil(rows.length / 2) : rows.length)));
  return h("section", { class: "qp-break-card", "data-break-standings": "" }, h("h2", { class: "qp-recap-title" }, env.t("board.title")), list);
}

/** The break: its countdown, and under it the standings and the last round's answers when there are any. */
function breakParts(env: PlayEnv, state: GameState, canEdit: boolean): { readonly nodes: HTMLElement[]; readonly time: HTMLElement; readonly sub: HTMLElement } {
  const time = h("p", { class: "qp-break-time", "data-break-time": "" });
  const sub = h("p", { class: "qp-sub" });
  const clock = h("div", { class: "qp-break-clock" }, h("p", { class: "qp-kicker" }, env.t("break.title")), time, sub);
  if (canEdit) {
    const end = pillButton("x", env.t("menu.breakEnd"), { "data-break-end": "" });
    end.addEventListener("click", () => { env.dispatch({ type: "uncover" }); });
    clock.append(end);
  }
  const round = recapRound(env, state);
  const cards = [standingsCard(env, state), round ? answerList(env, round, `${env.t("answers.title")} · ${round.name}`, BREAK_STEPS) : null].filter((card) => card !== null);
  return { nodes: cards.length > 0 ? [clock, h("div", { class: "qp-break-cards" }, ...cards)] : [clock], time, sub };
}

/**
 * Creates the stage's curtain.
 * @param env - the game's fixed parts
 * @param canEdit - `true` = the host plays in this window: the break carries its "End the break" button
 */
export function createCurtain(env: PlayEnv, canEdit: boolean): Curtain {
  const element = h("div", { class: "qp-curtain", "data-curtain-box": "" });
  element.hidden = true;
  let drawn: { readonly key: string; readonly time: HTMLElement; readonly sub: HTMLElement } | null = null;
  return {
    element,
    show(state) {
      const cover = state.curtain;
      element.hidden = cover === null;
      if (cover === null) {
        element.removeAttribute("data-curtain");
        element.replaceChildren();
        drawn = null;
        return;
      }
      element.setAttribute("data-curtain", cover.kind);
      if (cover.kind === "black") {
        if (drawn?.key !== "black") element.replaceChildren(h("span", { class: "qp-visually-hidden" }, env.t("black.on")));
        drawn = { key: "black", time: element, sub: element };
        return;
      }
      // Drawn again only when what it lists changes; the countdown is one text.
      const key = `break:${String(state.index)}:${scoreDigest(state)}`;
      if (drawn?.key !== key) {
        const focused = element.contains(document.activeElement);
        const parts = breakParts(env, state, canEdit);
        element.replaceChildren(...parts.nodes);
        element.toggleAttribute("data-plain", parts.nodes.length === 1);
        drawn = { key, time: parts.time, sub: parts.sub };
        fitRecap(element);
        if (focused) element.querySelector<HTMLElement>("[data-break-end]")?.focus();
      }
      const isOver = cover.leftMs === 0;
      drawn.time.textContent = clockText(Math.ceil(cover.leftMs / 1000));
      drawn.time.toggleAttribute("data-over", isOver);
      const isPaused = cover.paused === true && !isOver;
      drawn.time.toggleAttribute("data-paused", isPaused);
      const running = isPaused ? "break.paused" : "break.sub";
      drawn.sub.textContent = env.t(isOver ? "break.over" : running);
    },
    layout() {
      if (drawn !== null && drawn.key !== "black") fitRecap(element);
    },
  };
}
