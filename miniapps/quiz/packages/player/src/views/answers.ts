import { h } from "../render/h.ts";
import type { ViewEntry } from "./context.ts";
import { heading, kicker, viewRoot } from "./parts.ts";
import { hostAnswer, slideOf, slideView } from "./question.ts";

/** The "Answers" divider between a round's last question and its first answer. */
export const answersView: ViewEntry = {
  id: "answers",
  stage: ({ env, round }) => ({
    element: viewRoot("answers", kicker(round?.name ?? ""), heading(env.t("answers.title")), h("p", { class: "qp-sub" }, env.t("answers.sub"))),
  }),
};

/** One answer: the question again, then — at the reveal step — its answer and explanation. */
export const answerView: ViewEntry = {
  id: "answer",
  stage: (context) => slideView(context, slideOf(context, context.state.step >= 1, null)),
  answer: hostAnswer,
};
