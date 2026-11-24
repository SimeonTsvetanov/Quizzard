import { h } from "../render/h.ts";
import { pointsText } from "../render/slide.ts";
import type { ViewEntry } from "./context.ts";
import { chip, heading, kicker, viewRoot } from "./parts.ts";

/** The round's opening: its number and name, how it is played and, when it has them, its rules. */
export const rulesView: ViewEntry = {
  id: "rules",
  stage: ({ env, round }) => {
    if (!round) return { element: viewRoot("rules") };
    const playable = env.file.quiz.rounds.filter((candidate) => candidate.questions.length > 0);
    const root = viewRoot("rules",
      kicker(env.t("round.kicker", { n: playable.indexOf(round) + 1, total: playable.length })),
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
