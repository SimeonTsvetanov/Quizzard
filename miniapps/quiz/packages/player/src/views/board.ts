import { standings, type Standing } from "../game/scores.ts";
import { h } from "../render/h.ts";
import { icon } from "../render/icons.ts";
import type { PlayEnv, ViewEntry } from "./context.ts";
import { heading, kicker, scoreDigest, shareRows, viewRoot } from "./parts.ts";

/** From more teams than this the board has two columns on a wide stage. */
const SPLIT_ABOVE = 7;

/** How a team moved since the round before: an arrow with the number of places, in words for screen readers. */
function movement(env: PlayEnv, moved: number): HTMLElement {
  if (moved === 0) return h("span", { class: "qp-board-move", "data-move": "same" }, h("span", { class: "qp-visually-hidden" }, env.t("board.same")), h("span", { "aria-hidden": "true" }, "–"));
  const isUp = moved > 0;
  const places = Math.abs(moved);
  const mark = h("span", { class: "qp-board-move", "data-move": isUp ? "up" : "down" }, icon(isUp ? "up" : "down", 22));
  mark.append(h("span", { class: "qp-visually-hidden" }, env.t(isUp ? "board.up" : "board.down", { n: places })), h("span", { "aria-hidden": "true" }, String(places)));
  return mark;
}

/** One line of the board: place, name, a bar as long as its share of the leader's points, the total. */
function boardRow(env: PlayEnv, line: Standing, index: number, most: number): HTMLElement {
  const bar = h("span", { class: "qp-board-bar", "aria-hidden": "true" }, h("span", { class: "qp-board-fill" }));
  bar.style.setProperty("--qp-share", String(most > 0 ? line.total / most : 0));
  const row = h("li", { class: "qp-board-row", "data-rank": String(line.rank), "data-board-team": line.team.id },
    h("span", { class: "qp-board-rank" }, h("span", { class: "qp-visually-hidden" }, env.t("board.place", { n: line.rank })), h("span", { "aria-hidden": "true" }, String(line.rank))),
    h("span", { class: "qp-board-name" }, line.team.name),
    bar,
    h("span", { class: "qp-board-gain" }, line.gained > 0 ? `+${env.number(line.gained)}` : ""),
    h("span", { class: "qp-board-total", "data-board-total": "" }, env.number(line.total)),
    movement(env, line.moved));
  row.style.setProperty("--qp-order", String(index));
  return row;
}

/** The leaderboard after a round: bars, totals and who moved up or down. */
export const boardView: ViewEntry = {
  id: "board",
  structure: scoreDigest,
  stage: ({ env, state, round }) => {
    const lines = standings(state, round?.id);
    const most = Math.max(0, ...lines.map((line) => line.total));
    const list = h("ol", { class: "qp-board-rows" }, ...lines.map((line, index) => boardRow(env, line, index, most)));
    shareRows(list, lines.length, SPLIT_ABOVE);
    return { element: viewRoot("board", h("header", { class: "qp-view-head" }, kicker(round ? env.t("board.after", { round: round.name }) : ""), heading(env.t("board.title"))), list) };
  },
};
