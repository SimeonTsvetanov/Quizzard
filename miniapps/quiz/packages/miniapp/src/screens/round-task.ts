// A round whose own screen states the task ("Make the quizmaster laugh"): it has no questions to make.
// In their place the round shows what the teams will see — the kind's own explanation, in the quiz's
// language while it is played — and one optional field for a text of the host's own under it. The round
// keeps one question as the carrier of that text and of the timer; it is never shown as a question.
import { PROMPT_MAX, type Round, editQuestion } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { textField } from "../dom/controls.ts";
import { h } from "../dom/h.ts";
import type { RoundKindUi } from "../round-kinds-ui.ts";
import { renderSlide } from "../render/slide.ts";
import { roundPlace, thumbProps } from "./slide-props.ts";

/** The round's one screen as a small slide. */
function screenOf(app: App, round: Round): HTMLElement | null {
  const [question] = round.questions;
  return question ? renderSlide({ question, round, number: 1, reveal: false, ...thumbProps(app), ...roundPlace(app, round) }) : null;
}

/**
 * What stands in the place of a round's questions when the round states its own task.
 * @param app - the mounted creator
 * @param round - the round as it is now
 * @param own - the kind's texts for this panel
 */
export function taskPanel(app: App, round: Round, own: NonNullable<RoundKindUi["ownScreen"]>): HTMLElement {
  const { t } = app;
  const [question] = round.questions;
  const thumb = h("div", { class: "quiz-thumb quiz-task-thumb", "aria-hidden": "true", "data-round-task-screen": "" }, screenOf(app, round) ?? "");
  const redraw = (): void => {
    const now = app.current?.quiz.rounds.find((candidate) => candidate.id === round.id);
    const slide = now ? screenOf(app, now) : null;
    if (slide) thumb.replaceChildren(slide);
  };
  const extra = question === undefined ? null : textField({
    label: t(own.extra), value: question.prompt, max: PROMPT_MAX, rows: 3, placeholder: t(own.placeholder), hint: t(own.extraHint), props: { "data-round-task-text": "" },
    onInput: (value) => {
      const quiz = app.current?.quiz;
      if (quiz && app.change(editQuestion(quiz, question.id, { prompt: value }))) redraw();
    },
  });
  return h("div", { class: "quiz-panel quiz-task", "data-round-task": round.kind },
    h("h3", { class: "quiz-section" }, t(own.title)),
    h("p", { class: "quiz-task-note" }, t(own.note)),
    thumb,
    ...(extra ? [extra] : []));
}
