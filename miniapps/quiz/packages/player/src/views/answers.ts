import { h } from "../render/h.ts";
import type { ViewEntry } from "./context.ts";
import { heading, kicker, roundLine, viewRoot } from "./parts.ts";
import { hostAnswer, questionNumber, slideOf, slideView } from "./question.ts";

/** The "Answers" divider between a round's last question and its first answer. */
export const answersView: ViewEntry = {
  id: "answers",
  stage: ({ env, round }) => ({
    element: viewRoot("answers", kicker(...roundLine(env, round)), heading(env.t("answers.title")), h("p", { class: "qp-sub" }, env.t("answers.sub"))),
  }),
  tile: ({ env }) => ({ mark: env.t("answers.title"), name: env.t("answers.title") }),
};

/** A Safe's whole code on one slide — its last digit's slide under the code's own heading, without that question's text. */
export const codeView: ViewEntry = {
  id: "code",
  stage: (context) => {
    const { question, env } = context;
    if (!question) return slideView(context, null);
    return slideView(context, slideOf({ ...context, question: { ...question, prompt: env.t("special.codeTitle"), explanation: "" } }, true, null, "answer"));
  },
  tile: ({ env }) => ({ mark: env.t("special.code"), name: env.t("special.codeTitle"), group: env.t("answers.title") }),
};

/** One answer: the question again with its answer and explanation, which come in a moment later by themselves. */
export const answerView: ViewEntry = {
  id: "answer",
  stage: (context) => slideView(context, slideOf(context, true, null, "answer")),
  answer: hostAnswer,
  tile: (context) => ({ mark: String(questionNumber(context)), name: context.env.t("tile.answer", { n: questionNumber(context) }), group: context.env.t("answers.title") }),
};
