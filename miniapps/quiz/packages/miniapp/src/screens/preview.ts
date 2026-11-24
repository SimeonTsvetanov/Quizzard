// Preview (SPEC F8, §4 screen 5): the question as it will be played, drawn by the shared slide
// renderer on a 16:9 stage. Arrows, the arrow keys and a swipe move through every question of the
// quiz in play order; "Show answer" is the reveal.
import { type Question, type Quiz, type Round } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { iconButton, labelButton } from "../dom/controls.ts";
import { h } from "../dom/h.ts";
import { createLocalMedia } from "@simeonts/quizzard-quiz-player/render";
import { emptyState, up } from "./common.ts";
import { roundPlace, showLive, slideProps } from "./slide-props.ts";

/** A swipe shorter than this many px is a tap. */
const SWIPE_MIN_PX = 48;

/** One slide of the quiz in play order. */
interface Stop {
  readonly round: Round;
  readonly question: Question;
  /** The question's number in its round, from 1. */
  readonly number: number;
}

/**
 * Every question of the quiz in the order it is played.
 * @param quiz - the quiz
 */
export function playOrder(quiz: Quiz): readonly Stop[] {
  return quiz.rounds.flatMap((round) => round.questions.map((question, index) => ({ round, question, number: index + 1 })));
}

/** Shows the neighbour of the question on screen, in the same history entry. */
function step(app: App, quiz: Quiz, by: number): void {
  if (app.route.screen !== "preview") return;
  const stops = playOrder(quiz);
  const at = stops.findIndex((stop) => stop.question.id === (app.route.screen === "preview" ? app.route.question : ""));
  const next = stops[at + by];
  if (at === -1 || !next) return;
  app.go({ screen: "preview", quiz: quiz.id, question: next.question.id }, "replace");
}

/** Arrow keys and swipes on the stage. */
function wire(app: App, quiz: Quiz, screen: HTMLElement, stage: HTMLElement): void {
  screen.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    if (event.key === "ArrowLeft") step(app, quiz, -1);
    else if (event.key === "ArrowRight") step(app, quiz, 1);
  });
  let startX: number | null = null;
  stage.addEventListener("pointerdown", (event) => { startX = event.clientX; });
  stage.addEventListener("pointerup", (event) => {
    const moved = startX === null ? 0 : event.clientX - startX;
    startX = null;
    if (Math.abs(moved) >= SWIPE_MIN_PX) step(app, quiz, moved < 0 ? 1 : -1);
  });
  stage.addEventListener("pointercancel", () => { startX = null; });
}

/**
 * Draws the preview of the question in `app.route`.
 * @param app - the mounted creator
 * @param quiz - the open quiz
 */
export function previewScreen(app: App, quiz: Quiz): HTMLElement {
  const { t, view } = app;
  const stops = playOrder(quiz);
  const at = stops.findIndex((stop) => stop.question.id === (app.route.screen === "preview" ? app.route.question : ""));
  const stop = stops[at];
  const close = iconButton("x", t("preview.close"), { "data-close-preview": "", "data-focus": "preview-close" });
  close.addEventListener("click", () => { up(app); });
  const screen = h("section", { class: "quiz-screen quiz-preview", "aria-labelledby": "quiz-preview-title", "data-screen": "preview" });
  if (!stop) {
    screen.append(h("div", { class: "quiz-preview-head" }, close), emptyState({ icon: "alert", title: t("editor.goneTitle"), text: t("editor.goneText") }));
    return screen;
  }
  const where = t("preview.where", { round: stop.round.name, n: stop.number, total: stop.round.questions.length });
  const title = h("h2", { class: "quiz-preview-title", id: "quiz-preview-title", tabindex: "-1", "data-screen-title": "" }, where);
  // The preview's media is live: the picture zooms, the clip plays — and stops when the screen is left.
  const media = createLocalMedia();
  app.view.cleanup = () => { media.stop(); };
  const stage = h("div", { class: "quiz-stage", "data-preview-slide": "" });
  showLive(stage, { question: stop.question, round: stop.round, number: stop.number, reveal: view.isRevealed, ...slideProps(app), ...roundPlace(app, stop.round) }, media);
  const reveal = h("button", { type: "button", class: "button quiz-toggle", "aria-pressed": String(view.isRevealed), "data-reveal-toggle": "", "data-focus": "reveal" }, t("preview.showAnswer"));
  reveal.addEventListener("click", () => {
    view.isRevealed = !view.isRevealed;
    app.draw('[data-focus="reveal"]');
  });
  const previous = labelButton("left", t("preview.previous"), { class: "button", "data-previous": "", "data-focus": "previous" });
  const next = labelButton("right", t("preview.next"), { class: "button quiz-button--after", "data-next": "", "data-focus": "next" });
  previous.disabled = at === 0;
  next.disabled = at === stops.length - 1;
  previous.addEventListener("click", () => { step(app, quiz, -1); });
  next.addEventListener("click", () => { step(app, quiz, 1); });
  wire(app, quiz, screen, stage);
  screen.append(
    h("div", { class: "quiz-preview-head" }, close, title),
    stage,
    h("p", { class: "quiz-hint quiz-preview-turn" }, t("preview.turn")),
    h("div", { class: "quiz-preview-bar" }, previous, reveal, next));
  return screen;
}
