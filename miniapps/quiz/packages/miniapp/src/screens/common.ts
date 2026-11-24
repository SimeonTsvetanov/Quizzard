// What the screens share: the way up, the Undo toast, empty states, the round's short summary and a
// question's name for buttons and screen readers.
import { type Question, type Quiz, type Round, changeRound, findQuestion, roundTotals, totals } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { labelButton } from "../dom/controls.ts";
import { h } from "../dom/h.ts";
import { icon, type IconName } from "../dom/icons.ts";
import { wholeMinutes } from "../format.ts";

/** From this width the quiz shows its rounds and the open round side by side (styles: `width >= 700px`). */
export const WIDE_QUERY = "(width >= 700px)";

/** Whether the wide, two-pane layout is on. */
export function isWide(): boolean {
  return matchMedia(WIDE_QUERY).matches;
}

/**
 * To the library, from the quiz or any of its rounds: back over every entry the tool added, so the
 * browser's Back from the library still leads Home.
 * @param app - the mounted creator
 */
export function toLibrary(app: App): void {
  const depth = app.nav.depth();
  if (depth >= 1) app.nav.back(depth); else app.go({ screen: "library" }, "replace");
}

/**
 * One level up: editor or preview → where it was opened from, round → the quiz. It is the browser's
 * Back when the entry below is that screen (the usual case), else the screen is shown in this entry.
 * @param app - the mounted creator
 */
export function up(app: App): void {
  const { route } = app;
  const depth = app.nav.depth();
  if (route.screen === "library") return;
  if (route.screen === "quiz") {
    toLibrary(app);
    return;
  }
  if (route.screen === "round") {
    // On a wide screen the round took the quiz's own entry (no page change): the quiz is shown in it again.
    if (depth >= 2) app.nav.back(); else app.go({ screen: "quiz", quiz: route.quiz }, "replace");
    return;
  }
  if (depth >= 1) {
    app.nav.back();
    return;
  }
  if (route.screen === "play") {
    app.go({ screen: "quiz", quiz: route.quiz }, "replace");
    return;
  }
  const round = app.current ? findQuestion(app.current.quiz, route.question)?.round : undefined;
  app.go(round ? { screen: "round", quiz: route.quiz, round: round.id } : { screen: "quiz", quiz: route.quiz }, "replace");
}

/**
 * The "‹ where you came from" button at the top of a screen.
 * @param label - the screen it leads to, by name
 * @param run - the move
 * @param extra - more classes, e.g. to show it on phones only
 */
export function backLink(label: string, run: () => void, extra = ""): HTMLButtonElement {
  const button = h("button", { type: "button", class: `quiz-back ${extra}`.trim(), "data-up": "" }, icon("left", 18), h("span", {}, label));
  button.addEventListener("click", run);
  return button;
}

/**
 * A quiz with a deleted question back at its place (Undo); the same quiz when its round is gone.
 * @param quiz - the quiz as it is now — edits made since the delete stay
 * @param roundId - the round the question was in
 * @param question - the deleted question
 * @param index - where it was
 */
export function withQuestion(quiz: Quiz, roundId: string, question: Question, index: number): Quiz {
  if (findQuestion(quiz, question.id)) return quiz;
  return changeRound(quiz, roundId, (round) => ({ ...round, questions: [...round.questions.slice(0, index), question, ...round.questions.slice(index)] }));
}

/**
 * A quiz with a deleted round back at its place (Undo).
 * @param quiz - the quiz as it is now
 * @param round - the deleted round with its questions
 * @param index - where it was
 */
export function withRound(quiz: Quiz, round: Round, index: number): Quiz {
  if (quiz.rounds.some((candidate) => candidate.id === round.id)) return quiz;
  return { ...quiz, rounds: [...quiz.rounds.slice(0, index), round, ...quiz.rounds.slice(index)] };
}

/**
 * After a delete: a toast with Undo that puts the deleted thing back into the quiz as it is by then.
 * @param app - the mounted creator
 * @param message - what was deleted
 * @param restore - returns the quiz with the deleted thing back
 * @param after - what to do once it is back, e.g. show the screen again
 */
export function offerUndo(app: App, message: string, restore: (quiz: Quiz) => Quiz, after: () => void): void {
  const quizId = app.current?.quiz.id;
  app.context.shell.toast(message, {
    action: {
      label: app.t("undo"),
      run: () => {
        const now = app.current?.quiz;
        if (app.signal.aborted || !now || now.id !== quizId) return;
        app.change(restore(now));
        after();
      },
    },
  });
}

/**
 * After an edit that changes counts or times without a redraw: the header's totals and every round
 * card's line follow.
 * @param app - the mounted creator
 */
export function syncCounts(app: App): void {
  const quiz = app.current?.quiz;
  if (!quiz) return;
  const size = totals(quiz);
  const set = (hook: string, value: number): void => { app.host.querySelector(`[${hook}]`)?.replaceChildren(String(value)); };
  set("data-total-rounds", size.rounds);
  set("data-total-questions", size.questions);
  set("data-total-minutes", wholeMinutes(size.seconds));
  for (const round of quiz.rounds) app.host.querySelector(`[data-round-card="${round.id}"] [data-round-card-meta]`)?.replaceChildren(roundSummary(app, round));
}

/** Inputs of {@link emptyState}. */
export interface EmptyStateOptions {
  readonly title: string;
  readonly text: string;
  readonly icon?: IconName;
  /** The wizard instead of an icon (the library's first visit). */
  readonly hasWizard?: boolean;
  readonly action?: HTMLElement;
}

/**
 * A designed empty state: a mark, one line, one next step.
 * @param options - the words, the mark and the button
 */
export function emptyState(options: EmptyStateOptions): HTMLElement {
  // The wizard is the shell's own logo file, next to the page (a decoration: the words say it all).
  const mark = options.hasWizard === true
    ? h("img", { class: "quiz-empty-wizard", src: "logo.svg", alt: "", width: "96", height: "96" })
    : h("span", { class: "quiz-empty-mark" }, icon(options.icon ?? "deck", 28));
  const box = h("div", { class: "quiz-empty" }, mark, h("p", { class: "quiz-empty-title" }, options.title), h("p", { class: "quiz-empty-text" }, options.text));
  if (options.action) box.append(options.action);
  return box;
}

/**
 * "5 questions · 3 min" of a round.
 * @param app - gives the translator
 * @param round - the round
 */
export function roundSummary(app: App, round: Round): string {
  const size = roundTotals(round);
  return `${app.t("count.questions", { count: size.questions })} · ${app.t("count.minutes", { count: wholeMinutes(size.seconds) })}`;
}

/**
 * How a question is named on its card and to screen readers: "Question 3: Which river…" — the
 * first line of its text from its kind, or that it is still empty.
 * @param app - gives the translator and the registries
 * @param question - the question
 * @param number - its number in the round, from 1
 */
export function questionName(app: App, question: Question, number: number): string {
  const summary = app.env.registries.kinds.get(question.kind)?.summary(question) ?? "";
  return summary === "" ? app.t("question.emptyName", { n: number }) : app.t("question.name", { n: number, text: summary });
}

/**
 * A primary button with a plus: "New quiz", "Add round", "Add question".
 * @param label - the words
 * @param hook - its `data-*` hook, e.g. `data-new-quiz`
 */
export function addButton(label: string, hook: string): HTMLButtonElement {
  return labelButton("plus", label, { class: "button button--primary", [hook]: "" });
}
