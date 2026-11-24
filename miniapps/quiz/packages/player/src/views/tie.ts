import { leaders, roundsTotal } from "../game/scores.ts";
import type { Team } from "../game/state.ts";
import { h } from "../render/h.ts";
import { icon } from "../render/icons.ts";
import type { DrawnView, ViewContext, ViewEntry } from "./context.ts";
import { heading, kicker, pillButton, roundButton, scoreDigest, viewRoot } from "./parts.ts";

/** One of the level teams: its name and points; for the host the tiebreak points and "Winner". */
function tieCard({ env, state }: ViewContext, team: Team, isEditable: boolean): HTMLElement {
  const bonus = state.bonus[team.id] ?? 0;
  const isWinner = state.winner === team.id;
  const card = h("li", { class: "qp-tie-card", "data-tie-team": team.id, ...(isWinner ? { "data-winner": "" } : {}) },
    h("span", { class: "qp-tie-crown", "aria-hidden": "true" }, icon("crown", 40)),
    h("span", { class: "qp-tie-name" }, team.name),
    h("span", { class: "qp-tie-points" }, env.number(roundsTotal(state, team.id) + bonus)),
    h("span", { class: "qp-tie-bonus" }, bonus > 0 ? env.t("tie.bonus", { n: env.number(bonus) }) : ""));
  if (!isEditable) {
    if (isWinner) card.append(h("span", { class: "qp-tie-picked" }, env.t("tie.picked")));
    return card;
  }
  const less = roundButton("minus", env.t("tie.less", { team: team.name }), { "data-focus": `tie-less:${team.id}` });
  const more = roundButton("plus", env.t("tie.add", { team: team.name }), { "data-focus": `tie-more:${team.id}` });
  less.disabled = bonus === 0;
  less.addEventListener("click", () => { env.dispatch({ type: "addBonus", teamId: team.id, by: -1 }); });
  more.addEventListener("click", () => { env.dispatch({ type: "addBonus", teamId: team.id, by: 1 }); });
  const pick = pillButton("crown", env.t("tie.pick"), { "aria-pressed": String(isWinner), "aria-label": env.t("tie.pickName", { team: team.name }), "data-pick-winner": team.id, "data-focus": `tie-pick:${team.id}` });
  pick.addEventListener("click", () => { env.dispatch({ type: "pickWinner", teamId: isWinner ? null : team.id }); });
  card.append(h("span", { class: "qp-tie-controls" }, less, more, pick));
  return card;
}

/** The level teams side by side. */
function tieCards(context: ViewContext, isEditable: boolean): DrawnView {
  const level = leaders(context.state);
  return { element: h("ol", { class: "qp-tie-cards", "data-count": String(level.length) }, ...level.map((team) => tieCard(context, team, isEditable))) };
}

/** First place is shared: the host plays a tiebreak, then names the winner or adds points. */
export const tieView: ViewEntry = {
  id: "tie",
  structure: scoreDigest,
  stage: (context) => {
    const { env, state, canEdit } = context;
    const level = leaders(state);
    const points = env.labels.points(roundsTotal(state, level[0]?.id ?? ""));
    const root = viewRoot("tie",
      h("header", { class: "qp-view-head" }, kicker(env.t("tie.sub", { count: level.length, points })), heading(env.t("tie.title"))),
      tieCards(context, canEdit).element);
    if (canEdit) root.append(h("p", { class: "qp-hint" }, env.t("tie.hint")));
    return { element: root };
  },
  panel: (context) => tieCards(context, true),
};
