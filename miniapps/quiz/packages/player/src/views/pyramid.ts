// The Golden pyramid's question screen (Moni 2026-11-26): the pyramid beside all four questions at once,
// each with how many answers it asks for, under one timer — the teams work through them in their own
// order. The answers follow one by one on their own slides.
import { type Round, pyramidAsks } from "@simeonts/quizzard-quiz-core/play";
import { h } from "../render/h.ts";
import { pyramidFigure } from "../render/rounds/pyramid.ts";
import type { PlayEnv, ViewEntry } from "./context.ts";
import { kicker, roundLine, viewRoot } from "./parts.ts";

/** One question of the pyramid: its number as a gold block, its text and how many answers it asks for. */
function line(env: PlayEnv, round: Round, index: number): HTMLElement {
  const question = round.questions[index];
  const prompt = question?.prompt.trim() ?? "";
  return h("li", { class: "qp-pyramid-line", "data-pyramid-question": String(index + 1) },
    h("span", { class: "qp-pyramid-number", "aria-hidden": "true" }, String(index + 1)),
    h("span", { class: "qp-pyramid-words" },
      h("span", { class: "qp-pyramid-prompt" }, prompt === "" ? env.labels.emptyPrompt : prompt),
      h("span", { class: "qp-pyramid-asks" }, env.t("special.write", { count: pyramidAsks(index) }))));
}

/** The pyramid with every question of the round at once. */
export const pyramidView: ViewEntry = {
  id: "pyramid",
  tile: ({ env }) => ({ mark: env.t("tile.questions"), name: env.t("tile.questions") }),
  stage: ({ env, round, clock }) => {
    if (!round) return { element: viewRoot("pyramid") };
    const figure = pyramidFigure(round.questions.length, () => "current", env.t("special.pyramidName"));
    const top = h("div", { class: "qp-pyramid-top" }, kicker(...roundLine(env, round)), ...(clock ? [clock] : []));
    const list = h("ol", { class: "qp-pyramid-lines" }, ...round.questions.map((_, index) => line(env, round, index)));
    const element = viewRoot("pyramid",
      h("div", { class: "qp-pyramid-figure", "aria-hidden": "true" }, figure),
      h("div", { class: "qp-pyramid-side" }, top, list, h("p", { class: "qp-pyramid-rule" }, env.t("special.overRule"))));
    // Four long questions are drawn smaller, step by step, until all of them are on the screen.
    const layout = (): void => {
      list.style.removeProperty("zoom");
      for (let fit = 0.95; element.scrollHeight > element.clientHeight + 1 && fit >= 0.45; fit -= 0.05) list.style.setProperty("zoom", fit.toFixed(2));
    };
    return { element, layout };
  },
};
