// The scores dialog (S): every team's points per round in one table, each one a field — to look at
// the standings at any time and to correct a number of an earlier round.
import { roundIds, roundScore, total } from "../game/scores.ts";
import { MAX_SCORE, type GameState } from "../game/state.ts";
import { h } from "../render/h.ts";
import type { PlayEnv } from "../views/context.ts";

/** The table and how to bring it up to date. */
export interface Scoreboard {
  readonly element: HTMLElement;
  readonly sync: (state: GameState) => void;
}

/** A points field of one team in one round (`roundId` `null` = the tiebreak's points, shown only). */
function cell(env: PlayEnv, state: GameState, teamId: string, roundId: string, label: string): HTMLInputElement {
  const field = h("input", { type: "text", inputmode: "decimal", class: "qp-table-field", autocomplete: "off", "aria-label": label, "data-cell": `${teamId}:${roundId}` });
  field.value = String(roundScore(state, roundId, teamId));
  field.addEventListener("input", () => {
    const typed = Number(field.value.trim().replace(",", "."));
    if (field.value.trim() !== "" && Number.isFinite(typed)) env.dispatch({ type: "setScore", roundId, teamId, value: Math.min(MAX_SCORE, Math.max(0, typed)) });
  });
  field.addEventListener("focus", () => { field.select(); });
  return field;
}

/**
 * The scores table of a game.
 * @param env - the game's fixed parts
 * @param state - the game as the dialog opens
 */
export function createScoreboard(env: PlayEnv, state: GameState): Scoreboard {
  const rounds = roundIds(state).map((roundId, index) => ({ roundId, number: index + 1, name: env.file.quiz.rounds.find((round) => round.id === roundId)?.name ?? "" }));
  const head = h("tr", {}, h("th", { scope: "col" }, env.t("scores.team")),
    ...rounds.map((round) => h("th", { scope: "col", title: round.name }, String(round.number))),
    h("th", { scope: "col" }, env.t("score.total")));
  const rows = state.teams.map((team) => h("tr", { "data-table-team": team.id },
    h("th", { scope: "row" }, team.name),
    ...rounds.map((round) => h("td", {}, cell(env, state, team.id, round.roundId, env.t("scores.cell", { team: team.name, round: round.name })))),
    h("td", { class: "qp-table-total", "data-table-total": team.id }, env.number(total(state, team.id)))));
  const table = h("table", { class: "qp-table" }, h("thead", {}, head), h("tbody", {}, ...rows));
  return {
    element: h("div", { class: "qp-table-box", tabindex: "0", role: "group", "aria-label": env.t("scores.title") }, table),
    sync(next) {
      for (const team of next.teams) {
        table.querySelector(`[data-table-total="${team.id}"]`)?.replaceChildren(env.number(total(next, team.id)));
        for (const round of rounds) {
          const field = table.querySelector<HTMLInputElement>(`[data-cell="${team.id}:${round.roundId}"]`);
          if (field && document.activeElement !== field) field.value = String(roundScore(next, round.roundId, team.id));
        }
      }
    },
  };
}
