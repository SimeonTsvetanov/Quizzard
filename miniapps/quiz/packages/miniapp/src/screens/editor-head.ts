// The top of the question editor: the way back, the title with the question's place in its round,
// arrows to the previous and next question (so a long round is filled without going back to the
// list), and — in a quiz with more than one round — the round the question is in, as a picker that
// moves it (UX review S4, T4).
import type { App } from "../app/state.ts";
import { iconButton } from "../dom/controls.ts";
import { h } from "../dom/h.ts";
import { backLink, up } from "./common.ts";
import { playOrder } from "./preview.ts";
import { type CardPlace, edit, moveToRound } from "./question-moves.ts";

/**
 * The question before or after this one in play order, across rounds.
 * @param place - the question on show
 * @param by - -1 or 1
 */
export function neighbour({ quiz, question }: CardPlace, by: number): string | undefined {
  const stops = playOrder(quiz);
  const at = stops.findIndex((stop) => stop.question.id === question.id);
  return at === -1 ? undefined : stops[at + by]?.question.id;
}

/**
 * Shows the neighbouring question in the editor, in the same history entry.
 * @param app - the mounted creator
 * @param place - the question on show
 * @param by - -1 or 1
 */
export function step(app: App, place: CardPlace, by: number): void {
  const next = neighbour(place, by);
  if (next !== undefined) edit(app, next, "replace", by < 0 ? "[data-editor-previous]" : "[data-editor-next]");
}

/** "‹ ›": the previous and the next question. */
function arrows(app: App, place: CardPlace): HTMLElement {
  const { t } = app;
  const previous = iconButton("left", t("editor.previous"), { "data-editor-previous": "" });
  const next = iconButton("right", t("editor.next"), { "data-editor-next": "" });
  previous.disabled = neighbour(place, -1) === undefined;
  next.disabled = neighbour(place, 1) === undefined;
  previous.addEventListener("click", () => { step(app, place, -1); });
  next.addEventListener("click", () => { step(app, place, 1); });
  return h("div", { class: "quiz-editor-arrows" }, previous, next);
}

/** "In round": the round the question is in; choosing another moves it there. Only when the quiz has more than one. */
function roundPicker(app: App, { quiz, round, question }: CardPlace): HTMLElement | null {
  if (quiz.rounds.length < 2) return null;
  const select = h("select", { class: "quiz-input quiz-select", "data-move-round": "" }, ...quiz.rounds.map((candidate, index) => {
    const option = h("option", { value: candidate.id }, `${String(index + 1)}. ${candidate.name}`);
    option.selected = candidate === round;
    return option;
  }));
  select.addEventListener("change", () => { if (!moveToRound(app, question.id, select.value)) select.value = round.id; });
  return h("label", { class: "quiz-editor-round" }, h("span", { class: "quiz-label" }, app.t("editor.round")), select);
}

/**
 * Draws the editor's head.
 * @param app - the mounted creator
 * @param place - the question on show
 */
export function editorHead(app: App, place: CardPlace): HTMLElement {
  const { t } = app;
  const title = h("h1", { class: "quiz-title", id: "quiz-editor-title", tabindex: "-1", "data-screen-title": "" }, t("editor.title", { n: place.index + 1 }));
  const where = h("span", { class: "quiz-editor-where", "data-editor-where": "" }, t("editor.of", { total: place.round.questions.length }));
  const head = h("div", { class: "quiz-head" }, backLink(place.round.name, () => { up(app); }), h("div", { class: "quiz-editor-title" }, title, where, arrows(app, place)));
  const picker = roundPicker(app, place);
  if (picker) head.append(picker);
  return head;
}
