import { type Round, roundMaxPoints } from "@simeonts/quizzard-quiz-core/play";
import { h } from "../render/h.ts";
import { pointsText } from "../render/slide.ts";
import type { PlayEnv, ViewEntry } from "./context.ts";
import { chip, heading, kicker, roundCount, viewRoot } from "./parts.ts";
import { roundStages } from "./special.ts";

/** How the round is played, as chips: its questions, their time and its points. */
function chips(env: PlayEnv, round: Round): HTMLElement {
  const isSpecial = roundStages.has(round.kind);
  const points = isSpecial ? env.t("special.allPoints", { points: env.labels.points(roundMaxPoints(round)) }) : pointsText(round.defaults.points, env.labels);
  // A round of one screen (a task) has its time, not "1 question" and a time "per question".
  if (isSpecial && round.questions.length === 1) return h("div", { class: "qp-chips" }, chip("time", env.labels.seconds(round.defaults.seconds)), chip("points", points, "gold"));
  return h("div", { class: "qp-chips" },
    chip("scores", env.t("title.questions", { count: round.questions.length })),
    chip("time", env.t("round.each", { time: env.labels.seconds(round.defaults.seconds) })),
    chip("points", points, "gold"));
}

/** The round's own rules text, when it has one. */
function rulesText(round: Round): HTMLElement[] {
  const rules = round.rules?.trim() ?? "";
  return rules === "" ? [] : [h("p", { class: "qp-rules-text" }, rules)];
}

/** A special round's opening: its picture beside the chips, the short rules and the round's own text. */
function intro(env: PlayEnv, round: Round): HTMLElement | null {
  const stage = roundStages.get(round.kind);
  if (!stage) return null;
  const lines = stage.rules(env, round).map((line) => h("li", { class: "qp-intro-rule" }, line));
  return h("div", { class: "qp-intro", "data-intro": round.kind },
    h("div", { class: "qp-intro-figure", "aria-hidden": "true" }, stage.figure(env, round)),
    h("div", { class: "qp-intro-text" }, chips(env, round), h("ul", { class: "qp-intro-rules" }, ...lines), ...rulesText(round)));
}

/** The round's opening: its number and name, how it is played and, when it has them, its rules. */
export const rulesView: ViewEntry = {
  id: "rules",
  tile: ({ env }) => ({ mark: env.t("tile.rules"), name: env.t("tile.rules") }),
  stage: ({ env, round }) => {
    if (!round) return { element: viewRoot("rules") };
    const special = intro(env, round);
    if (special) return { element: viewRoot("rules", kicker(...roundCount(env, round)), heading(round.name), special) };
    return { element: viewRoot("rules", kicker(...roundCount(env, round)), heading(round.name), chips(env, round), ...rulesText(round)) };
  },
};
