// The open round (SPEC §4 screen 3): its name, the settings strip and its questions as slide cards.
// On a phone it is a screen of its own with "Add question" floating above the thumb; on a wide
// screen it is the right pane next to the rounds list.
import { MAX_QUESTIONS_PER_ROUND, ROUND_NAME_MAX, type Quiz, type Round, addQuestion, canAddQuestion, renameRound } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { h } from "../dom/h.ts";
import { addButton, backLink, emptyState, roundSummary, syncCounts, up } from "./common.ts";
import { questionCard } from "./question-card.ts";
import { roundSettings } from "./round-settings.ts";

/** Adds a question with the round's defaults and opens it in the editor (its kind chips come first there). */
function newQuestion(app: App, roundId: string): void {
  const quiz = app.current?.quiz;
  if (!quiz) return;
  const next = addQuestion(quiz, roundId, {}, app.env);
  const added = next.rounds.find((round) => round.id === roundId)?.questions.at(-1);
  if (!app.change(next) || !added) return;
  app.view.drafts.clear();
  app.go({ screen: "editor", quiz: next.id, question: added.id }, "push", '[data-focus="prompt"]');
}

/** The question cards of the round, or its empty state. */
function questionList(app: App, quiz: Quiz, round: Round): HTMLElement {
  const { t } = app;
  if (round.questions.length === 0) return emptyState({ icon: "plus", title: t("round.emptyTitle"), text: t("round.emptyText") });
  return h("ol", { class: "quiz-questions" }, ...round.questions.map((question, index) => questionCard(app, { quiz, round, question, index })));
}

/** "Add question", or at the limit a note that says why there is no button. */
function addControl(app: App, round: Round): HTMLElement {
  const { t } = app;
  if (!canAddQuestion(round)) return h("p", { class: "quiz-hint quiz-limit" }, t("question.limit", { max: MAX_QUESTIONS_PER_ROUND }));
  const add = addButton(t("question.add"), "data-add-question");
  add.addEventListener("click", () => { newQuestion(app, round.id); });
  return h("div", { class: "quiz-fab" }, add);
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
  const name = h("input", { type: "text", class: "quiz-title-input", maxlength: String(ROUND_NAME_MAX), autocomplete: "off", enterkeyhint: "done", "aria-label": t("round.nameLabel", { n: number }), "data-focus": "round-name", "data-round-name": "" });
  name.value = round.name;
  const summary = h("p", { class: "quiz-sub", "data-round-summary": "" }, roundSummary(app, round));
  const list = h("div", { class: "quiz-questions-box" }, questionList(app, quiz, round));
  // After a change of the round's time or points: the cards and the summary follow, nothing else is rebuilt.
  const refresh = (): void => {
    const now = app.current?.quiz;
    const fresh = now?.rounds.find((candidate) => candidate.id === round.id);
    if (!now || !fresh) return;
    summary.textContent = roundSummary(app, fresh);
    list.replaceChildren(questionList(app, now, fresh));
    syncCounts(app);
  };
  name.addEventListener("input", () => {
    const now = app.current?.quiz;
    if (!now || !app.change(renameRound(now, round.id, name.value))) return;
    app.host.querySelector(`[data-round-card="${round.id}"] [data-round-card-name]`)?.replaceChildren(name.value);
  });
  name.addEventListener("keydown", (event) => { if (event.key === "Enter") name.blur(); });
  const head = h("div", { class: "quiz-round-head" },
    h("span", { class: "quiz-round-number", "aria-hidden": "true" }, String(number)),
    h("div", { class: "quiz-round-names" }, h("h2", { class: "visually-hidden", id: "quiz-round-title", tabindex: "-1", "data-screen-title": "" }, t("round.title", { n: number, name: round.name })), name, summary));
  return h("section", { class: "quiz-pane quiz-pane--round", "aria-labelledby": "quiz-round-title", "data-round": round.id },
    backLink(quiz.name === "" ? t("quiz.unnamed") : quiz.name, () => { up(app); }, "quiz-narrow-only"),
    head,
    roundSettings(app, round, refresh),
    list,
    addControl(app, round));
}
