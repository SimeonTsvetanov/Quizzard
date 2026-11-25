// Answer type `none` in the editor (a round without answers: "Make the quizmaster laugh", the free
// game): nothing to fill in — one line says so. The slide part is the player's (it draws nothing).
import { noneAnswerSlide } from "@simeonts/quizzard-quiz-player/render";
import { h } from "../dom/h.ts";
import { type AnswerEditorContext, type AnswerUi, answerUi } from "../ui-registry.ts";

function noneEditor({ t }: AnswerEditorContext): HTMLElement {
  return h("p", { class: "quiz-hint", "data-no-answer": "" }, t("roundKind.noAnswer"));
}

/** Answer type `none`: a task, not a question. */
export const noneAnswerUi: AnswerUi = answerUi(noneAnswerSlide, { label: "answer.none", icon: "task" }, noneEditor);
