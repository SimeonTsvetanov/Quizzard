import { isTrueFalseAnswer } from "@simeonts/quizzard-quiz-core";
import { chipPicker } from "../dom/controls.ts";
import { h } from "../dom/h.ts";
import { icon } from "../dom/icons.ts";
import type { AnswerUi, SlideView } from "../ui-registry.ts";

/** One of the two pills of the slide; at the reveal the correct one is marked. */
function pill(text: string, isCorrect: boolean, { reveal }: SlideView): HTMLElement {
  const item = h("li", { class: "quiz-slide-option", ...(reveal && isCorrect ? { "data-correct": "" } : {}) }, h("span", { class: "quiz-slide-option-text" }, text));
  if (reveal && isCorrect) item.append(icon("check", 16));
  return item;
}

/** Answer type `trueFalse`: two chips in the editor, two pills on the slide. */
export const trueFalseAnswerUi: AnswerUi = {
  id: "trueFalse",
  label: "answer.trueFalse",
  icon: "trueFalse",
  parts: {
    editor: ({ answer, t, change }) => chipPicker({
      legend: t("trueFalse.label"),
      name: "quiz-true-false",
      options: [{ id: "true", label: t("trueFalse.true"), icon: "check" }, { id: "false", label: t("trueFalse.false"), icon: "x" }],
      value: isTrueFalseAnswer(answer) && !answer.correct ? "false" : "true",
      soon: "",
      onPick: (id) => { change({ ...answer, type: "trueFalse", correct: id === "true" }); },
    }),
    slide: (answer, view) => {
      const correct = isTrueFalseAnswer(answer) ? answer.correct : true;
      return h("ol", { class: "quiz-slide-options", "data-count": "2" }, pill(view.labels.trueText, correct, view), pill(view.labels.falseText, !correct, view));
    },
  },
};
