import { isOpenAnswer, openReveal } from "@simeonts/quizzard-quiz-core/play";
import { h } from "../h.ts";
import type { StageAnswer } from "../registry.ts";

/** Answer type `open` on the slide: a line to write on; at the reveal the answer. */
export const openAnswerSlide: StageAnswer = {
  id: "open",
  text: openReveal,
  parts: {
    slide: (answer, { reveal, labels }) => {
      if (!reveal) return h("div", { class: "quiz-slide-open" }, h("span", { class: "quiz-slide-line" }));
      const text = isOpenAnswer(answer) && answer.text.trim() !== "" ? answer.text : labels.emptyAnswer;
      return h("div", { class: "quiz-slide-open", "data-revealed": "" }, h("span", { class: "quiz-slide-kicker" }, labels.answer), h("span", { class: "quiz-slide-right" }, text));
    },
  },
};
