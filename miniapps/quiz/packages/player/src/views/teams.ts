import { MAX_TEAMS, MIN_TEAMS } from "@simeonts/quizzard-quiz-core/play";
import { TEAM_NAME_MAX, type GameState } from "../game/state.ts";
import { h } from "../render/h.ts";
import type { DrawnView, ViewContext, ViewEntry } from "./context.ts";
import { heading, pillButton, roundButton, teamDigest, viewRoot } from "./parts.ts";

/** One team's line: its number and its name — a field for the host, words for the audience. */
function teamItem({ env, state }: ViewContext, index: number, isEditable: boolean): HTMLElement {
  const team = state.teams[index];
  const item = h("li", { class: "qp-team" }, h("span", { class: "qp-team-number", "aria-hidden": "true" }, String(index + 1)));
  if (!team) return item;
  if (!isEditable) {
    item.append(h("span", { class: "qp-team-name", "data-team-name": team.id }, team.name));
    return item;
  }
  const field = h("input", { type: "text", class: "qp-team-field", maxlength: String(TEAM_NAME_MAX), autocomplete: "off", enterkeyhint: "done", "aria-label": env.t("teams.name", { n: index + 1 }), "data-team-name": team.id, "data-focus": `team:${team.id}` });
  field.value = team.name;
  field.addEventListener("input", () => { env.dispatch({ type: "setTeamName", teamId: team.id, name: field.value }); });
  field.addEventListener("focus", () => { field.select(); });
  field.addEventListener("keydown", (event) => { if (event.key === "Enter") field.blur(); });
  item.append(field);
  if (state.teams.length > MIN_TEAMS) {
    const remove = roundButton("x", env.t("teams.remove", { name: team.name }), { class: "qp-team-remove", "data-focus": `team-remove:${String(index)}` });
    remove.addEventListener("click", () => { env.dispatch({ type: "removeTeam", teamId: team.id }); });
    item.append(remove);
  }
  return item;
}

/** The list of teams and, for the host, "Add team". */
function teamList(context: ViewContext, isEditable: boolean): DrawnView {
  const { env, state } = context;
  const list = h("ol", { class: "qp-teams", "data-count": String(state.teams.length) }, ...state.teams.map((_team, index) => teamItem(context, index, isEditable)));
  const box = h("div", { class: "qp-teams-box" }, list);
  if (isEditable && state.teams.length < MAX_TEAMS) {
    const add = pillButton("plus", env.t("teams.add"), { "data-add-team": "", "data-focus": "team-add" });
    add.addEventListener("click", () => { env.dispatch({ type: "addTeam", name: env.t("teamName", { n: state.teams.length + 1 }) }); });
    box.append(add);
  }
  const sync = (next: GameState): void => {
    for (const team of next.teams) {
      const shown = list.querySelector<HTMLElement>(`[data-team-name="${team.id}"]`);
      if (shown instanceof HTMLInputElement) {
        if (document.activeElement !== shown) shown.value = team.name;
      } else if (shown) shown.textContent = team.name;
    }
  };
  return { element: box, sync };
}

/** The teams screen: who plays. The host types the names here, or in the host panel. */
export const teamsView: ViewEntry = {
  id: "teams",
  tile: ({ env }) => ({ mark: env.t("teams.title"), name: env.t("teams.title") }),
  structure: teamDigest,
  stage: (context) => {
    const { env, canEdit } = context;
    const list = teamList(context, canEdit);
    const root = viewRoot("teams-view", heading(env.t("teams.title")), list.element);
    if (canEdit) root.append(h("p", { class: "qp-hint" }, env.t("teams.hint", { min: MIN_TEAMS, max: MAX_TEAMS })));
    return { element: root, ...(list.sync ? { sync: list.sync } : {}) };
  },
  panel: (context) => teamList(context, true),
};
