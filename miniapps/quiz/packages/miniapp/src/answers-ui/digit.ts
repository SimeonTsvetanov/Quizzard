// Answer type `digit` in the editor (SPEC §10, the Safe): ten large buttons 0–9, one of them chosen —
// a radio group, so the arrow keys move between them. The slide part is the player's.
import { digitOf } from "@simeonts/quizzard-quiz-core";
import { digitAnswerSlide } from "@simeonts/quizzard-quiz-player/render";
import { h } from "../dom/h.ts";
import { type AnswerEditorContext, type AnswerUi, answerUi } from "../ui-registry.ts";

function digitEditor(context: AnswerEditorContext): HTMLElement {
  const { t } = context;
  const chosen = digitOf(context.answer);
  const missing = h("p", { class: "quiz-hint quiz-digit-missing", "data-digit-missing": "" }, t("digit.missing"));
  missing.hidden = chosen !== null;
  const keys = Array.from({ length: 10 }, (_, digit) => {
    const radio = h("input", { type: "radio", name: "quiz-digit", value: String(digit), "data-digit": String(digit) });
    radio.checked = digit === chosen;
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      missing.hidden = true;
      context.change({ type: "digit", digit });
    });
    return h("label", { class: "quiz-digit-key" }, radio, h("span", { class: "quiz-digit-face" }, String(digit)));
  });
  return h("fieldset", { class: "quiz-group quiz-digits", "data-digits": "" },
    h("legend", { class: "quiz-label" }, t("digit.label")),
    h("p", { class: "quiz-hint" }, t("digit.hint", { n: (context.place?.index ?? 0) + 1 })),
    h("div", { class: "quiz-digit-keys" }, ...keys),
    missing);
}

/** Answer type `digit`: one digit of a Safe's code. */
export const digitAnswerUi: AnswerUi = answerUi(digitAnswerSlide, { label: "answer.digit", icon: "digit" }, digitEditor);
