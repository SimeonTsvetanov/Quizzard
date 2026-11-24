import { isTrueFalseAnswer, trueFalseReveal } from "@simeonts/quizzard-quiz-core/play";
import { h } from "../h.ts";
import { icon } from "../icons.ts";
import type { SlideView, StageAnswer } from "../registry.ts";

/** One of the two pills of the slide; at the reveal the correct one is marked. */
function pill(text: string, isCorrect: boolean, { reveal }: SlideView): HTMLElement {
  const item = h("li", { class: "quiz-slide-option", ...(reveal && isCorrect ? { "data-correct": "" } : {}) }, h("span", { class: "quiz-slide-option-text" }, text));
  if (reveal && isCorrect) item.append(icon("check", 16));
  return item;
}

/** Answer type `trueFalse` on the slide: two pills. */
export const trueFalseAnswerSlide: StageAnswer = {
  id: "trueFalse",
  text: trueFalseReveal,
  parts: {
    slide: (answer, view) => {
      const correct = isTrueFalseAnswer(answer) ? answer.correct : true;
      return h("ol", { class: "quiz-slide-options", "data-count": "2" }, pill(view.labels.trueText, correct, view), pill(view.labels.falseText, !correct, view));
    },
  },
};
