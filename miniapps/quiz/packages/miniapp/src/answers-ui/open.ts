import { ANSWER_TEXT_MAX, cut, isOpenAnswer } from "@simeonts/quizzard-quiz-core";
import { openAnswerSlide } from "@simeonts/quizzard-quiz-player/render";
import { textField } from "../dom/controls.ts";
import { type AnswerUi, answerUi } from "../ui-registry.ts";

/** Answer type `open`: one field for the answer the host reads out; the slide part is the player's. */
export const openAnswerUi: AnswerUi = answerUi(openAnswerSlide, { label: "answer.open", icon: "open" }, ({ answer, t, change }) => textField({
  label: t("open.label"),
  value: isOpenAnswer(answer) ? answer.text : "",
  max: ANSWER_TEXT_MAX,
  placeholder: t("open.placeholder"),
  hint: t("open.hint"),
  props: { "data-open-answer": "" },
  onInput: (value) => { change({ ...answer, type: "open", text: cut(value, ANSWER_TEXT_MAX) }); },
}));
