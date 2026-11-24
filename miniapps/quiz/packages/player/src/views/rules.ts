import { h } from "../render/h.ts";
import { pointsText } from "../render/slide.ts";
import type { ViewEntry } from "./context.ts";
import { chip, heading, kicker, roundCount, viewRoot } from "./parts.ts";

/** The round's opening: its number and name, how it is played and, when it has them, its rules. */
export const rulesView: ViewEntry = {
  id: "rules",
  tile: ({ env }) => ({ mark: env.t("tile.rules"), name: env.t("tile.rules") }),
  stage: ({ env, round }) => {
    if (!round) return { element: viewRoot("rules") };
    const root = viewRoot("rules",
      kicker(...roundCount(env, round)),
      heading(round.name),
      h("div", { class: "qp-chips" },
        chip("scores", env.t("title.questions", { count: round.questions.length })),
        chip("time", env.t("round.each", { time: env.labels.seconds(round.defaults.seconds) })),
        chip("points", pointsText(round.defaults.points, env.labels), "gold")));
    const rules = round.rules?.trim() ?? "";
    if (rules !== "") root.append(h("p", { class: "qp-rules-text" }, rules));
    return { element: root };
  },
};
