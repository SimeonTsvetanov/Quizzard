import { type Answer, choiceReveal, isChoiceAnswer } from "@simeonts/quizzard-quiz-core/play";
import { h } from "../h.ts";
import { icon } from "../icons.ts";
import type { SlideView, StageAnswer } from "../registry.ts";

/**
 * The letter of an option by its place: A, B, C …
 * @param index - the option's index, from 0
 */
export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

function choiceSlide(answer: Answer, { reveal, labels }: SlideView): HTMLElement | null {
  if (!isChoiceAnswer(answer)) return null;
  const items = answer.options.map((option, index) => {
    const isCorrect = reveal && answer.correct.includes(option.id);
    const item = h("li", { class: "quiz-slide-option", ...(isCorrect ? { "data-correct": "" } : {}) },
      h("span", { class: "quiz-slide-letter" }, optionLetter(index)),
      h("span", { class: "quiz-slide-option-text", ...(option.text.trim() === "" ? { "data-empty": "" } : {}) }, option.text.trim() === "" ? labels.emptyAnswer : option.text));
    if (isCorrect) item.append(icon("check", 16));
    return item;
  });
  return h("ol", { class: "quiz-slide-options", "data-count": String(items.length) }, ...items);
}

/** Answer type `choice` on the slide: the options with their letters; at the reveal the correct ones are marked. */
export const choiceAnswerSlide: StageAnswer = { id: "choice", text: choiceReveal, parts: { slide: choiceSlide } };
