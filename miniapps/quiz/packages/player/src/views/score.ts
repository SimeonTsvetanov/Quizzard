import { type Round, effectivePoints } from "@simeonts/quizzard-quiz-core/play";
import { roundScore, roundsTotal } from "../game/scores.ts";
import { MAX_SCORE, type GameState, type Team } from "../game/state.ts";
import { h } from "../render/h.ts";
import { pointsText } from "../render/slide.ts";
import type { DrawnView, PlayEnv, ViewContext, ViewEntry } from "./context.ts";
import { heading, kicker, shareRows, stepper, teamDigest, viewRoot, type Stepper } from "./parts.ts";

/** From more teams than this the table has two columns on a wide stage. */
const SPLIT_ABOVE = 6;

/** One team's line and how to bring it up to date. */
interface ScoreRow {
  readonly element: HTMLElement;
  readonly sync: (state: GameState) => void;
}

/** A team's line: name, this round's points (a stepper for the host) and the total so far. */
function scoreRow(env: PlayEnv, state: GameState, round: Round, team: Team, isEditable: boolean): ScoreRow {
  const name = h("span", { class: "qp-score-name" }, team.name);
  const total = h("span", { class: "qp-score-total", "data-score-total": team.id });
  const shown = h("span", { class: "qp-score-value", "data-score-value": team.id });
  let field: Stepper | null = null;
  if (isEditable) {
    field = stepper({
      label: env.t("score.points", { team: team.name }),
      less: env.t("score.less", { team: team.name }),
      more: env.t("score.more", { team: team.name }),
      value: roundScore(state, round.id, team.id),
      max: MAX_SCORE,
      focusKey: `score:${team.id}`,
      onChange: (value) => { env.dispatch({ type: "setScore", roundId: round.id, teamId: team.id, value }); },
    });
  }
  const sync = (next: GameState): void => {
    const points = roundScore(next, round.id, team.id);
    name.textContent = next.teams.find((candidate) => candidate.id === team.id)?.name ?? team.name;
    shown.textContent = env.number(points);
    total.textContent = env.number(roundsTotal(next, team.id, round.id));
    field?.set(points);
  };
  sync(state);
  const element = h("li", { class: "qp-score-row", "data-score-row": team.id }, name, field ? field.element : shown, total);
  return { element, sync };
}

/** The table of teams with its column heads. */
function scoreTable({ env, state, round }: ViewContext, isEditable: boolean): DrawnView {
  if (!round) return { element: h("div") };
  const rows = state.teams.map((team) => scoreRow(env, state, round, team, isEditable));
  const head = h("div", { class: "qp-score-head", "aria-hidden": "true" }, h("span", {}, ""), h("span", {}, env.t("score.round")), h("span", {}, env.t("score.total")));
  const list = h("ol", { class: "qp-score-rows" }, ...rows.map((row) => row.element));
  const element = h("div", { class: "qp-score-table", ...(isEditable ? { "data-editable": "" } : {}) }, head, list);
  shareRows(element, rows.length, SPLIT_ABOVE);
  return { element, sync: (next) => { for (const row of rows) row.sync(next); } };
}

/**
 * What the round's questions are worth (AC3: the note shows at score entry): the round's points for
 * "each question", then every question that has its own.
 */
function pointsGuide({ env, round }: ViewContext): HTMLElement {
  if (!round) return h("div");
  const most = round.questions.reduce((sum, question) => sum + effectivePoints(round, question).value, 0);
  const line = (label: string, text: string): HTMLElement => h("li", { class: "qp-guide-line" }, h("span", { class: "qp-guide-label" }, label), h("span", { class: "qp-guide-points" }, text));
  const own = round.questions.flatMap((question, index) => (question.points === undefined ? [] : [line(env.t("score.question", { n: index + 1 }), pointsText(question.points, env.labels))]));
  return h("aside", { class: "qp-guide" },
    h("p", { class: "qp-guide-title" }, env.t("score.guide")),
    h("ol", { class: "qp-guide-lines" }, line(env.t("score.each"), pointsText(round.defaults.points, env.labels)), ...own),
    h("p", { class: "qp-guide-max" }, env.t("score.max", { points: env.labels.points(most) })));
}

/** Score entry after a round: a number per team, the questions' points and notes next to it. */
export const scoreView: ViewEntry = {
  id: "score",
  structure: teamDigest,
  stage: (context) => {
    const { env, round, canEdit } = context;
    const table = scoreTable(context, canEdit);
    const root = viewRoot("score",
      h("header", { class: "qp-view-head" }, kicker(round?.name ?? ""), heading(env.t("score.title"))),
      h("div", { class: "qp-score-body" }, table.element, pointsGuide(context)));
    return { element: root, ...(table.sync ? { sync: table.sync } : {}) };
  },
  panel: (context) => {
    const table = scoreTable(context, true);
    return { element: h("div", { class: "qp-panel-score" }, table.element, pointsGuide(context)), ...(table.sync ? { sync: table.sync } : {}) };
  },
};
