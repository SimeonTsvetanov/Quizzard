// The quiz (SPEC §4 screen 2): a header card with its name, totals and actions, and its rounds as
// stacked cards — each with its number, name, counts and one dot per question in the kind's colour.
// On a wide screen the open round sits next to the list (round.ts) and choosing another round
// changes no page.
import { MAX_ROUNDS, QUIZ_NAME_MAX, type Quiz, type Round, addRound, canAddRound, moveRound, renameQuiz, totals } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { iconButton, labelButton } from "../dom/controls.ts";
import { h } from "../dom/h.ts";
import { bytesText, wholeMinutes } from "../format.ts";
import { addButton, backLink, emptyState, isWide, roundSummary, toLibrary } from "./common.ts";
import { stackOf } from "./library.ts";
import { exportControl, mediaMeter, quizFileRow } from "./quiz-files.ts";
import { roundPane } from "./round.ts";

/** Most kind dots on a round card; the rest is "+n". */
const MAX_DOTS = 14;

/** Opens a round: a page of its own on a phone, the right pane on a wide screen (no new history entry there). */
function openRound(app: App, quiz: Quiz, roundId: string): void {
  app.view.lastRound = roundId;
  const isPane = isWide() || app.route.screen === "round";
  app.go({ screen: "round", quiz: quiz.id, round: roundId }, isPane && app.nav.depth() >= 1 ? "replace" : "push");
}

function stat(value: string, label: string, hook: string): HTMLElement {
  return h("div", { class: "quiz-stat" }, h("span", { class: "quiz-stat-value", [hook]: "" }, value), h("span", { class: "quiz-stat-label" }, label));
}

/** Play, Preview and Export to play — and, after an export, what was saved; under them the quiz file. */
function quizActions(app: App, quiz: Quiz): HTMLElement {
  const { t } = app;
  const first = quiz.rounds.flatMap((round) => round.questions)[0];
  const play = labelButton("play", t("quiz.play"), { class: "button button--primary", "data-play-quiz": "", "data-focus": "play" });
  const preview = labelButton("eye", t("quiz.preview"), { class: "button", "data-preview-quiz": "" });
  const { button: exportButton, progress } = exportControl(app, quiz);
  for (const button of [play, preview, exportButton]) button.disabled = first === undefined;
  play.addEventListener("click", () => { app.go({ screen: "play", quiz: quiz.id }); });
  preview.addEventListener("click", () => { if (first) app.go({ screen: "preview", quiz: quiz.id, question: first.id }); });
  const box = h("div", { class: "quiz-actions-box" }, h("div", { class: "quiz-actions" }, play, preview, exportButton), progress);
  const made = app.view.exported;
  if (made?.quiz === quiz.id) box.append(h("p", { class: "quiz-hint", "data-exported": "" }, t("export.saved", { name: made.name, size: bytesText(made.bytes, app.lang) })));
  else if (first === undefined) box.append(h("p", { class: "quiz-hint" }, t("quiz.playHint")));
  if (first !== undefined) box.append(quizFileRow(app, quiz));
  return box;
}

/** The header card: name (edited in place), totals and the quiz's actions. */
function quizHead(app: App, quiz: Quiz): HTMLElement {
  const { t } = app;
  const size = totals(quiz);
  const name = h("input", { type: "text", class: "quiz-title-input", maxlength: String(QUIZ_NAME_MAX), autocomplete: "off", enterkeyhint: "done", "aria-label": t("quiz.nameLabel"), placeholder: t("quiz.namePlaceholder"), "data-focus": "quiz-name", "data-quiz-name": "" });
  name.value = quiz.name;
  name.addEventListener("input", () => {
    const now = app.current?.quiz;
    if (now && app.change(renameQuiz(now, name.value))) app.context.shell.setTitle(name.value.trim() === "" ? null : name.value);
  });
  name.addEventListener("keydown", (event) => { if (event.key === "Enter") name.blur(); });
  const head = h("header", { class: "quiz-panel quiz-quiz-head" },
    backLink(t("library.title"), () => { toLibrary(app); }),
    h("h2", { class: "visually-hidden", id: "quiz-quiz-title", tabindex: "-1", "data-screen-title": "" }, quiz.name === "" ? t("quiz.unnamed") : quiz.name),
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

function roundCard(app: App, quiz: Quiz, round: Round, index: number, openId: string | undefined): HTMLElement {
  const { t } = app;
  const n = index + 1;
  const open = h("button", { type: "button", class: "quiz-round-open", "data-focus": `round:${round.id}`, ...(round.id === openId ? { "aria-current": "true" } : {}) },
    h("span", { class: "quiz-round-tile", "aria-hidden": "true" }, String(n)),
    h("span", { class: "quiz-round-body" },
      h("span", { class: "visually-hidden" }, `${t("round.number", { n })}: `),
      h("span", { class: "quiz-round-name", "data-round-card-name": "" }, round.name),
      h("span", { class: "quiz-card-meta", "data-round-card-meta": "" }, roundSummary(app, round)),
      kindDots(app, round)));
  open.addEventListener("click", () => { openRound(app, quiz, round.id); });
  const move = (to: number, button: string): void => {
    const now = app.current?.quiz;
    if (now && app.change(moveRound(now, round.id, to))) app.draw(`[data-round-card="${round.id}"] [data-move="${button}"]`);
  };
  const last = quiz.rounds.length - 1;
  const up = iconButton("up", t("round.moveUp", { name: round.name }), { "data-move": "up" });
  const down = iconButton("down", t("round.moveDown", { name: round.name }), { "data-move": "down" });
  up.disabled = index === 0;
  down.disabled = index === last;
  up.addEventListener("click", () => { move(index - 1, index - 1 === 0 ? "down" : "up"); });
  down.addEventListener("click", () => { move(index + 1, index + 1 === last ? "up" : "down"); });
  return h("li", { class: "quiz-round-card", "data-round-card": round.id, "data-stack": String(stackOf(round.questions.length)) }, open, h("div", { class: "quiz-round-moves" }, up, down));
}

/** "Add round", or at the limit a note that says why there is no button. */
function addRoundControl(app: App): HTMLElement {
  const { t } = app;
  const quiz = app.current?.quiz;
  if (quiz && !canAddRound(quiz)) return h("p", { class: "quiz-hint quiz-limit" }, t("round.limit", { max: MAX_ROUNDS }));
  const add = addButton(t("round.add"), "data-add-round");
  add.addEventListener("click", () => {
    const now = app.current?.quiz;
    if (!now) return;
    const next = addRound(now, t("round.defaultName", { n: now.rounds.length + 1 }), app.env);
    const added = next.rounds.at(-1);
    if (app.change(next) && added) openRound(app, next, added.id);
  });
  return add;
}

/** The left pane: the header card and the rounds. */
function roundsPane(app: App, quiz: Quiz, openId: string | undefined): HTMLElement {
  const { t } = app;
  const pane = h("section", { class: "quiz-pane quiz-pane--rounds", "aria-labelledby": "quiz-quiz-title" }, quizHead(app, quiz));
  if (quiz.rounds.length === 0) pane.append(emptyState({ icon: "deck", title: t("quiz.emptyTitle"), text: t("quiz.emptyText"), action: addRoundControl(app) }));
  else pane.append(h("h3", { class: "quiz-section" }, t("quiz.rounds")), h("ol", { class: "quiz-rounds" }, ...quiz.rounds.map((round, index) => roundCard(app, quiz, round, index, openId))), addRoundControl(app));
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
