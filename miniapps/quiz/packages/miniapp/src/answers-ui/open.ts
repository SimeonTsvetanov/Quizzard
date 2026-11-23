import { ANSWER_TEXT_MAX, cut, isOpenAnswer } from "@simeonts/quizzard-quiz-core";
import { textField } from "../dom/controls.ts";
import { h } from "../dom/h.ts";
import type { AnswerUi } from "../ui-registry.ts";

/** Answer type `open`: one field for the answer the host reads out; on the slide a line to write on, the answer at the reveal. */
export const openAnswerUi: AnswerUi = {
  id: "open",
  label: "answer.open",
  icon: "open",
  parts: {
    editor: ({ answer, t, change }) => textField({
      label: t("open.label"),
      value: isOpenAnswer(answer) ? answer.text : "",
      max: ANSWER_TEXT_MAX,
      placeholder: t("open.placeholder"),
      hint: t("open.hint"),
      props: { "data-open-answer": "" },
      onInput: (value) => { change({ ...answer, type: "open", text: cut(value, ANSWER_TEXT_MAX) }); },
    }),
    slide: (answer, { reveal, labels }) => {
      if (!reveal) return h("div", { class: "quiz-slide-open" }, h("span", { class: "quiz-slide-line" }));
      const text = isOpenAnswer(answer) && answer.text.trim() !== "" ? answer.text : labels.emptyAnswer;
      return h("div", { class: "quiz-slide-open", "data-revealed": "" }, h("span", { class: "quiz-slide-kicker" }, labels.answer), h("span", { class: "quiz-slide-right" }, text));
    },
  },
};
