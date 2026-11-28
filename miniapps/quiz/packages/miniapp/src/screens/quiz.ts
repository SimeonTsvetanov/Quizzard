// The quiz (SPEC §4 screen 2): a header card with its name, totals and actions, and its rounds as
// stacked cards — each with its number, name, counts, one dot per question in the kind's colour and
// the row of actions every card has. On a wide screen the open round sits next to the list
// (round.ts) and choosing another round changes no page.
import { MAX_ROUNDS, QUIZ_NAME_MAX, type Quiz, type Round, canAddRound, renameQuiz, shapeOf, totals, unfinishedCount } from "@simeonts/quizzard-quiz-core";
import { kindBadge } from "../round-kinds-ui.ts";
import type { App } from "../app/state.ts";
import { h } from "../dom/h.ts";
import { aiButton } from "./ai-door.ts";
import { nameField } from "../dom/name-field.ts";
import { wholeMinutes } from "../format.ts";
import { actionRow, openMore } from "./card-actions.ts";
import { addButton, backLink, emptyState, roundSummary, toLibrary } from "./common.ts";
import { stackOf } from "./library.ts";
import { quizActions } from "./quiz-actions.ts";
import { mediaMeter } from "./quiz-files.ts";
import { makeSortable } from "./reorder.ts";
import { roundPane } from "./round.ts";
import { ROUND_ATTRIBUTE, copyRound, liveRound, moveRoundTo, openRound, playFromRound, previewRound, removeRound } from "./round-moves.ts";

/** Most kind dots on a round card; the rest is "+n". */
const MAX_DOTS = 14;

function stat(value: string, label: string, hook: string): HTMLElement {
  return h("div", { class: "quiz-stat" }, h("span", { class: "quiz-stat-value", [hook]: "" }, value), h("span", { class: "quiz-stat-label" }, label));
}

/** The header card: name (edited in place), totals and the quiz's actions. */
function quizHead(app: App, quiz: Quiz): HTMLElement {
  const { t } = app;
  const size = totals(quiz);
  const name = nameField({
    value: quiz.name, max: QUIZ_NAME_MAX, label: t("quiz.nameLabel"), placeholder: t("quiz.namePlaceholder"), props: { "data-focus": "quiz-name", "data-quiz-name": "" },
    onInput: (value) => {
      const now = app.current?.quiz;
      if (now && app.change(renameQuiz(now, value))) app.context.shell.setTitle(value.trim() === "" ? null : value);
    },
  });
  const head = h("header", { class: "quiz-panel quiz-quiz-head" },
    backLink(t("library.title"), () => { toLibrary(app); }),
    h("h1", { class: "visually-hidden", id: "quiz-quiz-title", tabindex: "-1", "data-screen-title": "" }, quiz.name === "" ? t("quiz.unnamed") : quiz.name),
    name,
    h("div", { class: "quiz-stats" },
      stat(String(size.rounds), t("count.roundsLabel", { count: size.rounds }), "data-total-rounds"),
      stat(String(size.questions), t("count.questionsLabel", { count: size.questions }), "data-total-questions"),
      stat(String(wholeMinutes(size.seconds)), t("count.minutesLabel"), "data-total-minutes")));
  const meter = mediaMeter(app, quiz);
  if (meter) head.append(meter);
  head.append(quizActions(app, quiz));
  return head;
}

/** One dot per question, in its kind's colour — a round read at a glance. */
function kindDots(app: App, round: Round): HTMLElement {
  const dots = round.questions.slice(0, MAX_DOTS).map((question) => h("span", { class: "quiz-dot", "data-tone": app.ui.kinds.get(question.kind)?.tone ?? "none" }));
  const row = h("span", { class: "quiz-dots", "aria-hidden": "true" }, ...dots);
  if (round.questions.length > MAX_DOTS) row.append(h("span", { class: "quiz-dots-more" }, `+${String(round.questions.length - MAX_DOTS)}`));
  return row;
}

/** The card's actions: the same row as a question card's. */
function roundActions(app: App, quiz: Quiz, round: Round, index: number): HTMLElement {
  const { t } = app;
  const { name } = round;
  return actionRow({
    labels: { drag: t("round.drag", { name }), up: t("round.moveUp", { name }), down: t("round.moveDown", { name }), duplicate: t("round.duplicateNamed", { name }), remove: t("round.deleteNamed", { name }), more: t("round.more", { name }) },
    index,
    last: quiz.rounds.length - 1,
    onMove: (to, focus) => { moveRoundTo(app, round.id, to, `[data-move="${focus}"]`); },
    onDuplicate: () => { copyRound(app, round.id); },
    onRemove: () => { void removeRound(app, round.id); },
    onMore: () => {
      openMore(app, ({ openRoundMenu }) => {
        const now = liveRound(app, round.id);
        if (!now) return;
        const hasQuestions = now.round.questions.length > 0;
        openRoundMenu(app, { ...now, move: (to) => { moveRoundTo(app, round.id, to); }, preview: hasQuestions ? () => { previewRound(app, now.round); } : null, playFrom: hasQuestions ? () => { playFromRound(app, round.id); } : null });
      });
    },
  });
}

function roundCard(app: App, quiz: Quiz, round: Round, index: number, openId: string | undefined): HTMLElement {
  const { t } = app;
  const n = index + 1;
  const unfinished = unfinishedCount(round, app.env.registries);
  const meta = h("span", { class: "quiz-card-meta", "data-round-card-meta": "" }, roundSummary(app, round));
  const open = h("button", { type: "button", class: "quiz-round-open", "data-focus": `round:${round.id}`, ...(round.id === openId ? { "aria-current": "true" } : {}) },
    h("span", { class: "quiz-round-tile", "aria-hidden": "true", ...(shapeOf(round, app.env.registries) ? { "data-round-kind": round.kind } : {}) }, String(n)),
    h("span", { class: "quiz-round-body" },
      h("span", { class: "visually-hidden" }, `${t("round.number", { n })}: `),
      h("span", { class: "quiz-round-name", "data-round-card-name": "" }, round.name),
      meta,
      h("span", { class: "quiz-round-marks" }, ...[kindBadge(app, round)].filter((part) => part !== null), kindDots(app, round), ...(unfinished > 0 ? [h("span", { class: "quiz-badge", "data-unfinished-count": String(unfinished) }, t("round.unfinished", { count: unfinished }))] : []))));
  open.addEventListener("click", () => { openRound(app, round.id); });
  return h("li", { class: "quiz-round-card", [ROUND_ATTRIBUTE]: round.id, "data-stack": String(stackOf(round.questions.length)) }, open, roundActions(app, quiz, round, index));
}

/** "Add round", or at the limit a note that says why there is no button. */
function addRoundControl(app: App): HTMLElement {
  const { t } = app;
  const quiz = app.current?.quiz;
  if (quiz && !canAddRound(quiz)) return h("p", { class: "quiz-hint quiz-limit" }, t("round.limit", { max: MAX_ROUNDS }));
  const add = addButton(t("round.add"), "data-add-round");
  // The kind first (Standard, Golden pyramid, Safe): screens/round-chooser.ts, loaded with the first press.
  add.addEventListener("click", () => {
    void import("./round-chooser.ts").then(({ chooseRoundKind }) => { if (!app.signal.aborted) chooseRoundKind(app); }).catch(() => {
      if (!app.signal.aborted) app.context.shell.toast(t("menu.failed"), { tone: "error" });
    });
  });
  return add;
}

/** "Add rounds with AI" (while the quiz has room) and "Check the answers with AI" (once it has questions), side by side. */
function aiTools(app: App, quiz: Quiz): HTMLElement {
  const buttons = [...(canAddRound(quiz) ? [aiButton(app, "rounds")] : []), ...(quiz.rounds.some((round) => round.questions.length > 0) ? [aiButton(app, "check")] : [])];
  return h("div", { class: "quiz-ai-tools", "data-count": String(buttons.length) }, ...buttons);
}

/** The left pane: the header card and the rounds. */
function roundsPane(app: App, quiz: Quiz, openId: string | undefined): HTMLElement {
  const { t } = app;
  const pane = h("section", { class: "quiz-pane quiz-pane--rounds", "aria-labelledby": "quiz-quiz-title" }, quizHead(app, quiz));
  if (quiz.rounds.length === 0) {
    pane.append(emptyState({ icon: "deck", title: t("quiz.emptyTitle"), text: t("quiz.emptyText"), action: h("div", { class: "quiz-empty-actions" }, addRoundControl(app), aiButton(app, "rounds")) }));
    return pane;
  }
  const list = h("ol", { class: "quiz-rounds" }, ...quiz.rounds.map((round, index) => roundCard(app, quiz, round, index, openId)));
  makeSortable({ list, attribute: ROUND_ATTRIBUTE, onMove: (id, to) => { moveRoundTo(app, id, to); } });
  pane.append(h("h3", { class: "quiz-section" }, t("quiz.rounds")), list, addRoundControl(app), aiTools(app, quiz));
  return pane;
}

/**
 * Draws the quiz with its rounds and, when one is open, that round.
 * @param app - the mounted creator; `app.route` is `quiz` or `round`
 * @param quiz - the open quiz
 */
export function quizScreen(app: App, quiz: Quiz): HTMLElement {
  const routeRound = app.route.screen === "round" ? app.route.round : null;
  // Without a round in the route the wide layout shows the one opened last, else the first.
  const shown = quiz.rounds.find((round) => round.id === (routeRound ?? app.view.lastRound)) ?? (routeRound === null ? quiz.rounds[0] : undefined);
  const screen = h("div", { class: "quiz-screen quiz-deck", "data-screen": app.route.screen, "data-pane": routeRound === null ? "rounds" : "round" }, roundsPane(app, quiz, shown?.id));
  if (shown) screen.append(roundPane(app, quiz, shown));
  return screen;
}
