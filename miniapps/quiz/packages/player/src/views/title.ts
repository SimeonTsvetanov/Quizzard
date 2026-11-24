import { h } from "../render/h.ts";
import type { ViewEntry } from "./context.ts";
import { brand } from "../ui/brand.ts";
import { heading, kicker, viewRoot } from "./parts.ts";

/** The title screen: the quiz's name and its size, before anything starts. */
export const titleView: ViewEntry = {
  id: "title",
  tile: ({ env }) => ({ mark: env.t("menu.start"), name: env.t("menu.start") }),
  stage: ({ env, canEdit }) => {
    const { quiz } = env.file;
    const playable = quiz.rounds.filter((round) => round.questions.length > 0);
    const questions = playable.reduce((sum, round) => sum + round.questions.length, 0);
    const summary = questions === 0
      ? env.t("title.empty")
      : env.t("title.summary", { rounds: env.t("title.rounds", { count: playable.length }), questions: env.t("title.questions", { count: questions }) });
    const root = viewRoot("title",
      h("div", { class: "qp-title-glow", "aria-hidden": "true" }),
      brand(env, "hero"),
      kicker(env.t("title.kicker")),
      heading(quiz.name.trim() === "" ? env.t("title.unnamed") : quiz.name, "qp-title-name"),
      h("p", { class: "qp-title-summary" }, summary));
    if (canEdit) root.append(h("p", { class: "qp-hint" }, env.t("title.start")));
    return { element: root };
  },
};
