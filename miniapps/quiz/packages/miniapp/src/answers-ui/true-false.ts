import { isTrueFalseAnswer } from "@simeonts/quizzard-quiz-core";
import { trueFalseAnswerSlide } from "@simeonts/quizzard-quiz-player/render";
import { chipPicker } from "../dom/controls.ts";
import { type AnswerUi, answerUi } from "../ui-registry.ts";

/** Answer type `trueFalse`: two chips in the editor; the two pills of the slide are the player's. */
export const trueFalseAnswerUi: AnswerUi = answerUi(trueFalseAnswerSlide, { label: "answer.trueFalse", icon: "trueFalse" }, ({ answer, t, change }) => chipPicker({
  legend: t("trueFalse.label"),
  name: "quiz-true-false",
  options: [{ id: "true", label: t("trueFalse.true"), icon: "check" }, { id: "false", label: t("trueFalse.false"), icon: "x" }],
  value: isTrueFalseAnswer(answer) && !answer.correct ? "false" : "true",
  soon: "",
  onPick: (id) => { change({ ...answer, type: "trueFalse", correct: id === "true" }); },
}));
