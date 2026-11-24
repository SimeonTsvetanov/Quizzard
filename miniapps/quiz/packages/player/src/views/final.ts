import { finalStandings, type Standing } from "../game/scores.ts";
import { brand } from "../ui/brand.ts";
import { h } from "../render/h.ts";
import { icon } from "../render/icons.ts";
import type { PlayEnv, ViewEntry } from "./context.ts";
import { heading, kicker, scoreDigest, shareRows, viewRoot } from "./parts.ts";

/** How many teams stand on the podium. */
const PODIUM_SIZE = 3;

/** One step of the podium: the team on top, its place on the block. */
function podiumStep(env: PlayEnv, line: Standing): HTMLElement {
  const isFirst = line.rank === 1;
  const step = h("li", { class: "qp-podium-step", "data-rank": String(line.rank), "data-podium-team": line.team.id },
    h("span", { class: "qp-podium-team" },
      h("span", { class: "qp-podium-mark", "aria-hidden": "true" }, icon(isFirst ? "trophy" : "points", isFirst ? 64 : 40)),
      h("span", { class: "qp-podium-name" }, line.team.name),
      h("span", { class: "qp-podium-points" }, env.labels.points(line.total))),
    h("span", { class: "qp-podium-block" }, h("span", { class: "qp-visually-hidden" }, env.t("final.place", { n: line.rank })), h("span", { "aria-hidden": "true" }, String(line.rank))));
  step.style.setProperty("--qp-place", String(line.rank));
  return step;
}

/** A team below the podium: place, name, points. */
function restLine(env: PlayEnv, line: Standing): HTMLElement {
  return h("li", { class: "qp-rest-line" },
    h("span", { class: "qp-rest-rank" }, h("span", { class: "qp-visually-hidden" }, env.t("final.place", { n: line.rank })), h("span", { "aria-hidden": "true" }, String(line.rank))),
    h("span", { class: "qp-rest-name" }, line.team.name),
    h("span", { class: "qp-rest-points" }, env.number(line.total)));
}

/** The podium: the first three on their steps, the others listed beside it. */
export const finalView: ViewEntry = {
  id: "final",
  tile: ({ env }) => ({ mark: env.t("menu.end"), name: env.t("menu.end") }),
  structure: scoreDigest,
  stage: ({ env, state }) => {
    const lines = finalStandings(state);
    const top = lines.slice(0, PODIUM_SIZE);
    const rest = lines.slice(PODIUM_SIZE);
    const winners = lines.filter((line) => line.rank === 1).length;
    // A game nobody scored in has no winner to name.
    const hasPoints = lines.some((line) => line.total > 0);
    const title = winners > 1 ? "final.winners" : "final.winner";
    const others = h("ol", { class: "qp-rest" }, ...rest.map((line) => restLine(env, line)));
    shareRows(others, rest.length, rest.length);
    const root = viewRoot("final",
      h("header", { class: "qp-view-head" }, kicker(env.t("final.title")), heading(env.t(hasPoints ? title : "final.none"))),
      h("div", { class: "qp-final-body", ...(rest.length > 0 ? { "data-rest": "" } : {}) },
        // Document order is 1st, 2nd, 3rd (for reading); the stylesheet puts the first in the middle.
        h("ol", { class: "qp-podium", "data-count": String(top.length), ...(hasPoints ? {} : { "data-empty": "" }) }, ...top.map((line) => podiumStep(env, line))),
        ...(rest.length > 0 ? [others] : [])),
      h("footer", { class: "qp-final-foot" }, h("p", { class: "qp-sub" }, env.t("final.thanks")), brand(env, "hero")));
    return { element: root };
  },
};
