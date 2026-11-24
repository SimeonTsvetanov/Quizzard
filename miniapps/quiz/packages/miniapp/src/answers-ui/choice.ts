// Answer type `choice`: 2–8 options, one or several correct (SPEC F4). The editor part keeps its own
// rows: typing and ticking never rebuild them; adding and removing do, and say where the limits are.
import {
  MAX_OPTIONS, MIN_OPTIONS, OPTION_TEXT_MAX, type ChoiceAnswer, addOption, canAddOption, canRemoveOption, choiceAnswer,
  isChoiceAnswer, removeOption, setOptionText, toggleCorrect,
} from "@simeonts/quizzard-quiz-core";
import { choiceAnswerSlide, optionLetter } from "@simeonts/quizzard-quiz-player/render";
import { iconButton, labelButton } from "../dom/controls.ts";
import { h } from "../dom/h.ts";
import { icon } from "../dom/icons.ts";
import { type AnswerEditorContext, type AnswerUi, answerUi } from "../ui-registry.ts";

/** The editor's state: the answer as it is now, and where its rows are drawn. */
interface ChoiceEditor {
  readonly context: AnswerEditorContext;
  readonly rows: HTMLElement;
  readonly add: HTMLButtonElement;
  answer: ChoiceAnswer;
}

function report(editor: ChoiceEditor, next: ChoiceAnswer): void {
  editor.answer = next;
  editor.context.change(next);
}

function row(editor: ChoiceEditor, index: number): HTMLElement {
  const { t } = editor.context;
  const option = editor.answer.options[index];
  if (option === undefined) return h("li");
  const letter = optionLetter(index);
  const correct = h("input", { type: "checkbox", class: "visually-hidden", "aria-label": t("choice.correct", { letter }) });
  correct.checked = editor.answer.correct.includes(option.id);
  correct.addEventListener("change", () => { report(editor, toggleCorrect(editor.answer, option.id)); });
  const tick = h("label", { class: "quiz-option-tick", title: t("choice.correct", { letter }) }, correct, h("span", { class: "quiz-option-mark" }, icon("check", 18)));
  const text = h("input", { type: "text", class: "quiz-input", maxlength: String(OPTION_TEXT_MAX), autocomplete: "off", enterkeyhint: "next", "aria-label": t("choice.option", { letter }), placeholder: t("choice.option", { letter }) });
  text.value = option.text;
  text.addEventListener("input", () => { report(editor, setOptionText(editor.answer, option.id, text.value)); });
  const remove = iconButton("x", t("choice.remove", { letter }), { class: "quiz-option-remove" });
  remove.disabled = !canRemoveOption(editor.answer);
  remove.addEventListener("click", () => {
    report(editor, removeOption(editor.answer, option.id));
    draw(editor);
    const inputs = editor.rows.querySelectorAll<HTMLElement>('input[type="text"]');
    (inputs[Math.min(index, inputs.length - 1)] ?? editor.add).focus();
  });
  return h("li", { class: "quiz-option" }, tick, h("span", { class: "quiz-option-letter", "aria-hidden": "true" }, letter), text, remove);
}

/** Draws the rows again and sets "Add option" to what the limit allows. */
function draw(editor: ChoiceEditor): void {
  const { t } = editor.context;
  editor.rows.replaceChildren(...editor.answer.options.map((_option, index) => row(editor, index)));
  const isFull = !canAddOption(editor.answer);
  // Stays focusable when full, so the limit is read out where the person is; the words say why.
  editor.add.setAttribute("aria-disabled", String(isFull));
  const words = editor.add.querySelector("span");
  if (words) words.textContent = isFull ? t("choice.full", { max: MAX_OPTIONS }) : t("choice.add");
}

function choiceEditor(context: AnswerEditorContext): HTMLElement {
  const { t } = context;
  const fallback = choiceAnswer.defaults(context.ids);
  const blank: ChoiceAnswer = isChoiceAnswer(fallback) ? fallback : { type: "choice", options: [], correct: [] };
  const editor: ChoiceEditor = {
    context,
    rows: h("ol", { class: "quiz-options" }),
    add: labelButton("plus", t("choice.add"), { class: "button quiz-option-add", "data-add-option": "" }),
    answer: isChoiceAnswer(context.answer) ? context.answer : blank,
  };
  editor.add.addEventListener("click", () => {
    if (!canAddOption(editor.answer)) return;
    report(editor, addOption(editor.answer, context.ids));
    draw(editor);
    [...editor.rows.querySelectorAll<HTMLElement>('input[type="text"]')].at(-1)?.focus();
  });
  draw(editor);
  return h("fieldset", { class: "quiz-group" },
    h("legend", { class: "quiz-label" }, t("choice.label")),
    editor.rows,
    editor.add,
    h("p", { class: "quiz-hint" }, t("choice.hint", { min: MIN_OPTIONS, max: MAX_OPTIONS })));
}

/** The UI entry of answer type `choice`. */
export const choiceAnswerUi: AnswerUi = answerUi(choiceAnswerSlide, { label: "answer.choice", icon: "choice" }, choiceEditor);
