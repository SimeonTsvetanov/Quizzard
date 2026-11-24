// The open round (SPEC §4 screen 3): its name, what can be done with it, the settings strip and its
// questions — as slide cards or, for a long round, as a compact list (the choice is remembered on
// this device). On a phone it is a screen of its own; on a wide screen it is the right pane next to
// the rounds list.
import { MAX_QUESTIONS_PER_ROUND, ROUND_NAME_MAX, type Quiz, type Round, addQuestion, canAddQuestion, renameRound, unfinishedCount, unfinishedQuestions } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { iconButton, labelButton } from "../dom/controls.ts";
import { h } from "../dom/h.ts";
import { nameField } from "../dom/name-field.ts";
import { type ListMode, readListMode, writeListMode } from "../storage/view-prefs.ts";
import { openMore } from "./card-actions.ts";
import { addButton, backLink, emptyState, roundSummary, syncCounts, up } from "./common.ts";
import { questionCard, questionRow } from "./question-card.ts";
import { QUESTION_ATTRIBUTE, edit, moveTo } from "./question-moves.ts";
import { makeSortable } from "./reorder.ts";
import { copyRound, liveRound, moveRoundTo, playFromRound, previewRound, removeRound } from "./round-moves.ts";
import { roundSettings } from "./round-settings.ts";

/** Adds a question with the round's defaults and opens it in the editor (its kind chips come first there). */
export function newQuestion(app: App, roundId: string, mode: "push" | "replace" = "push"): void {
  const quiz = app.current?.quiz;
  if (!quiz) return;
  const next = addQuestion(quiz, roundId, {}, app.env);
  const added = next.rounds.find((round) => round.id === roundId)?.questions.at(-1);
  if (!app.change(next) || !added) return;
  edit(app, added.id, mode, '[data-focus="prompt"]');
}

/** The questions of the round as cards or rows, sortable by their handles — or the round's empty state. */
function questionList(app: App, quiz: Quiz, round: Round, mode: ListMode): HTMLElement {
  const { t } = app;
  if (round.questions.length === 0) return emptyState({ icon: null, title: t("round.emptyTitle"), text: t("round.emptyText") });
  const draw = mode === "list" ? questionRow : questionCard;
  const list = h("ol", { class: mode === "list" ? "quiz-qrows" : "quiz-questions", "data-question-list": mode }, ...round.questions.map((question, index) => draw(app, { quiz, round, question, index })));
  makeSortable({ list, attribute: QUESTION_ATTRIBUTE, onMove: (id, to) => { moveTo(app, id, to); } });
  return list;
}

/** "Add question", or at the limit a note that says why there is no button. */
function addControl(app: App, round: Round): HTMLElement {
  const { t } = app;
  if (!canAddQuestion(round)) return h("p", { class: "quiz-hint quiz-limit" }, t("question.limit", { max: MAX_QUESTIONS_PER_ROUND }));
  const add = addButton(t("question.add"), "data-add-question");
  add.addEventListener("click", () => { newQuestion(app, round.id); });
  return h("div", { class: "quiz-fab" }, add);
}

/** "Cards / List": how the questions are shown; two buttons that say which one is on. */
function viewToggle(app: App, mode: ListMode): HTMLElement {
  const { t } = app;
  const button = (value: ListMode, mark: "cards" | "list"): HTMLButtonElement => {
    const one = labelButton(mark, t(`round.view.${value}`), { class: "quiz-segment", "aria-pressed": String(mode === value), "data-view-mode": value });
    one.addEventListener("click", () => {
      if (readListMode(app.context.storage.prefs) === value) return;
      writeListMode(app.context.storage.prefs, value);
      app.draw(`[data-view-mode="${value}"]`);
    });
    return one;
  };
  return h("div", { class: "quiz-segments", role: "group", "aria-label": t("round.view.label") }, button("cards", "cards"), button("list", "list"));
}

/** The round's own buttons in its header: duplicate, delete and "More" (preview, play from here, to the top or bottom). */
function headActions(app: App, round: Round): HTMLElement {
  const { t } = app;
  const copy = iconButton("copy", t("round.duplicateNamed", { name: round.name }), { "data-round-action": "duplicate" });
  copy.addEventListener("click", () => { copyRound(app, round.id); });
  const trash = iconButton("trash", t("round.deleteNamed", { name: round.name }), { class: "quiz-danger", "data-round-action": "delete" });
  trash.addEventListener("click", () => { void removeRound(app, round.id); });
  const more = iconButton("more", t("round.more", { name: round.name }), { "data-round-action": "more", "aria-haspopup": "dialog" });
  more.addEventListener("click", () => {
    openMore(app, ({ openRoundMenu }) => {
      const now = liveRound(app, round.id);
      if (!now) return;
      const hasQuestions = now.round.questions.length > 0;
      openRoundMenu(app, { ...now, move: (to) => { moveRoundTo(app, round.id, to, "[data-drag]"); }, preview: hasQuestions ? () => { previewRound(app, now.round); } : null, playFrom: hasQuestions ? () => { playFromRound(app, round.id); } : null });
    });
  });
  return h("div", { class: "quiz-round-tools" }, copy, trash, more);
}

/** "2 not finished": a way to the first unfinished question of the round; nothing when all are finished. */
function unfinishedLink(app: App, round: Round): HTMLElement | null {
  const count = unfinishedCount(round, app.env.registries);
  if (count === 0) return null;
  const link = h("button", { type: "button", class: "quiz-badge", "data-unfinished-count": String(count) }, app.t("round.unfinished", { count }));
  link.addEventListener("click", () => {
    const quiz = app.current?.quiz;
    const first = quiz ? unfinishedQuestions(quiz, app.env.registries).find((one) => one.round.id === round.id) : undefined;
    if (first) edit(app, first.question.id);
  });
  return link;
}

/**
 * Draws the pane of one round.
 * @param app - the mounted creator
 * @param quiz - the open quiz
 * @param round - the round to show
 */
export function roundPane(app: App, quiz: Quiz, round: Round): HTMLElement {
  const { t } = app;
  const number = quiz.rounds.indexOf(round) + 1;
  const mode = readListMode(app.context.storage.prefs);
  const name = nameField({
    value: round.name, max: ROUND_NAME_MAX, label: t("round.nameLabel", { n: number }), props: { "data-focus": "round-name", "data-round-name": "" },
    onInput: (value) => {
      const now = app.current?.quiz;
      if (now && app.change(renameRound(now, round.id, value))) app.host.querySelector(`[data-round-card="${round.id}"] [data-round-card-name]`)?.replaceChildren(value);
    },
  });
  const summary = h("p", { class: "quiz-sub", "data-round-summary": "" }, roundSummary(app, round));
  const list = h("div", { class: "quiz-questions-box" }, questionList(app, quiz, round, mode));
  // After a change of the round's time or points: the cards and the summary follow, nothing else is rebuilt.
  const refresh = (): void => {
    const now = liveRound(app, round.id);
    if (!now) return;
    summary.textContent = roundSummary(app, now.round);
    list.replaceChildren(questionList(app, now.quiz, now.round, mode));
    syncCounts(app);
  };
  const badge = unfinishedLink(app, round);
  const head = h("div", { class: "quiz-round-head" },
    h("span", { class: "quiz-round-number", "aria-hidden": "true" }, String(number)),
    h("div", { class: "quiz-round-names" }, h("h2", { class: "visually-hidden", id: "quiz-round-title", tabindex: "-1", "data-screen-title": "" }, t("round.title", { n: number, name: round.name })), name, h("div", { class: "quiz-round-line" }, summary, ...(badge ? [badge] : []), headActions(app, round))));
  const bar = h("div", { class: "quiz-round-bar" }, h("h3", { class: "quiz-section" }, t("round.questions")), ...(round.questions.length > 0 ? [viewToggle(app, mode)] : []));
  return h("section", { class: "quiz-pane quiz-pane--round", "aria-labelledby": "quiz-round-title", "data-round": round.id },
    backLink(quiz.name === "" ? t("quiz.unnamed") : quiz.name, () => { up(app); }, "quiz-narrow-only"),
    head,
    roundSettings(app, round, refresh),
    bar,
    list,
    addControl(app, round));
}
