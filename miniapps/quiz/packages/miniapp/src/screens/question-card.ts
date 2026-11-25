// One question in its round, in one of two looks (UX review S8). A card: a 16:9 mini slide drawn by
// the shared renderer (the card IS the question as it will be played), under it its kind, time and
// points — in the accent when they are the question's own — and the row of actions every card has.
// A compact row for long rounds: handle, number, kind, first line, "More".
import { canRemoveQuestion, canReorder, effectivePoints, effectiveSeconds, isComplete } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { h } from "../dom/h.ts";
import { icon } from "../dom/icons.ts";
import { slideLabels } from "../format.ts";
import { pointsText, renderSlide } from "../render/slide.ts";
import { canShow } from "../ui-registry.ts";
import { type ActionLabels, actionRow, openMore } from "./card-actions.ts";
import { questionName } from "./common.ts";
import { type CardPlace, QUESTION_ATTRIBUTE, duplicate, edit, moveTo, moveToRound, placeOf, playFrom, preview, remove } from "./question-moves.ts";
import { roundPlace, thumbProps } from "./slide-props.ts";

export type { CardPlace } from "./question-moves.ts";

function labels(app: App, n: number): ActionLabels {
  const { t } = app;
  return { drag: t("question.drag", { n }), up: t("question.moveUp", { n }), down: t("question.moveDown", { n }), duplicate: t("question.duplicate", { n }), remove: t("question.delete", { n }), more: t("question.more", { n }) };
}

/** Duplicates the question and shows its copy. */
function copy(app: App, questionId: string): void {
  if (duplicate(app, questionId) !== undefined) app.draw(`[data-focus="question:${questionId}"]`);
}

/** The card's or row's actions; a compact row keeps only the handle and "More". */
function actions(app: App, { round, question, index }: CardPlace, isCompact: boolean): HTMLElement {
  const id = question.id;
  const row = actionRow({
    labels: labels(app, index + 1),
    index,
    last: round.questions.length - 1,
    isCompact,
    isFixed: !canRemoveQuestion(round, app.env.registries),
    canReorder: canReorder(round, app.env.registries),
    onMove: (to, focus) => { moveTo(app, id, to, `[data-move="${focus}"]`); },
    onDuplicate: () => { copy(app, id); },
    onRemove: () => { remove(app, id); },
    onMore: () => {
      openMore(app, ({ openQuestionMenu }) => {
        const now = placeOf(app, id);
        if (!now) return;
        openQuestionMenu(app, {
          ...now, isCompact,
          move: (to) => { moveTo(app, id, to); },
          moveToRound: (roundId) => { moveToRound(app, id, roundId); },
          duplicate: () => { copy(app, id); },
          remove: () => { remove(app, id); },
          preview: () => { preview(app, id); },
          playFrom: () => { playFrom(app, id); },
        });
      });
    },
  });
  row.querySelector("[data-delete]")?.setAttribute("data-delete-question", "");
  return row;
}

/** "Not finished" or "Not supported in this version", when either is true. */
function flag(app: App, { question }: CardPlace): HTMLElement | null {
  if (!canShow(question, app.ui)) return h("span", { class: "quiz-flag" }, app.t("question.unsupported"));
  return isComplete(question, app.env.registries) ? null : h("span", { class: "quiz-flag", "data-unfinished": "" }, app.t("question.unfinished"));
}

/** Marks the whole card of an unfinished question (a red edge and light, round.css), so it is found at a glance. */
function unfinishedMark(mark: HTMLElement | null): { "data-card-unfinished"?: string } {
  return mark?.hasAttribute("data-unfinished") ? { "data-card-unfinished": "" } : {};
}

/** Kind chip, time and points on one line; a value that is the question's own is marked, a long points note is cut with its whole text as the tooltip. */
function facts(app: App, { round, question }: CardPlace): HTMLElement {
  const { t, lang } = app;
  const words = slideLabels(t, lang);
  const kind = app.ui.kinds.get(question.kind);
  const points = pointsText(effectivePoints(round, question), words);
  return h("div", { class: "quiz-qcard-facts" },
    h("span", { class: "quiz-kind", "data-tone": kind?.tone ?? "none" }, icon(kind?.icon ?? "unknown", 16), h("span", {}, kind ? t(kind.label) : question.kind)),
    h("span", { class: "quiz-fact", ...(question.seconds === undefined ? {} : { "data-own": "" }) }, icon("time", 16), h("span", {}, words.seconds(effectiveSeconds(round, question)))),
    h("span", { class: "quiz-fact quiz-fact--points", title: points, ...(question.points === undefined ? {} : { "data-own": "" }) }, icon("points", 16), h("span", {}, points)));
}

/**
 * Draws one question as a card.
 * @param app - the mounted creator
 * @param place - the question with its round, quiz and index
 */
export function questionCard(app: App, place: CardPlace): HTMLElement {
  const { round, question, index } = place;
  const slide = renderSlide({ question, round, number: index + 1, reveal: false, ...thumbProps(app), ...roundPlace(app, round) });
  // The mini slide is a picture of the question: the button's name says it in words.
  const open = h("button", { type: "button", class: "quiz-qcard-open", "data-focus": `question:${question.id}` },
    h("span", { class: "visually-hidden" }, questionName(app, question, index + 1)), h("span", { class: "quiz-thumb", "aria-hidden": "true" }, slide));
  const mark = flag(app, place);
  if (mark) open.append(mark);
  open.addEventListener("click", () => { edit(app, question.id); });
  return h("li", { class: "quiz-qcard", ...unfinishedMark(mark), [QUESTION_ATTRIBUTE]: question.id, "data-tone": app.ui.kinds.get(question.kind)?.tone ?? "none" }, open, facts(app, place), actions(app, place, false));
}

/**
 * Draws one question as a compact row.
 * @param app - the mounted creator
 * @param place - the question with its round, quiz and index
 */
export function questionRow(app: App, place: CardPlace): HTMLElement {
  const { question, index } = place;
  const kind = app.ui.kinds.get(question.kind);
  const summary = app.env.registries.kinds.get(question.kind)?.summary(question) ?? "";
  const open = h("button", { type: "button", class: "quiz-qrow-open", "data-focus": `question:${question.id}` },
    h("span", { class: "quiz-qrow-number", "aria-hidden": "true" }, String(index + 1)),
    h("span", { class: "quiz-qrow-kind", "aria-hidden": "true" }, icon(kind?.icon ?? "unknown", 18)),
    h("span", { class: "visually-hidden" }, `${app.t("editor.title", { n: index + 1 })}: `),
    h("span", { class: "quiz-qrow-text", ...(summary === "" ? { "data-empty": "" } : {}) }, summary === "" ? app.t("question.empty") : summary));
  const mark = flag(app, place);
  if (mark) open.append(mark);
  open.addEventListener("click", () => { edit(app, question.id); });
  const row = actions(app, place, true);
  const drag = row.querySelector("[data-drag]");
  const more = row.querySelector("[data-more]");
  return h("li", { class: "quiz-qrow", ...unfinishedMark(mark), [QUESTION_ATTRIBUTE]: question.id, "data-tone": kind?.tone ?? "none" }, ...(drag ? [drag] : []), open, ...(more ? [more] : []));
}
