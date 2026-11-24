// The round's answers in one compact list (Moni 2026-11-24): "1 — A: Caterpillar", "2 — True",
// "3 — A cow" — the answers and nothing else, numbered by question. The score entry shows it beside
// the points (an upright screen: as the part before them), a break shows it under its countdown, and
// the host panel has it next to the points. Also here: which round a break shows, and the buttons
// that start one.
import { type Question, type Round, STANDARD_SCREENS } from "@simeonts/quizzard-quiz-core/play";
import { BREAK_MINUTES, type GameState } from "../game/state.ts";
import { h } from "../render/h.ts";
import type { PlayEnv } from "./context.ts";
import { pillButton } from "./parts.ts";

/** Up to this many answers stand in one column on a wide stage, up to the second number in two; more go in three. */
export const RECAP_STEPS: readonly number[] = [10, 24];
/** The same for the list under a break's countdown, which has the stage's whole height. */
export const BREAK_STEPS: readonly number[] = [14, 30];

/**
 * One answer as the list writes it: a choice with the letter of every correct option, true / false as
 * its word, an open answer as its text.
 * @param env - the registries and the words
 * @param question - the question
 */
export function answerLine(env: PlayEnv, question: Question): string {
  const part = env.parts.answers.get(question.answer.type);
  const text = (part?.line ?? part?.text)?.(question.answer, env.labels).trim() ?? "";
  return text === "" ? env.labels.emptyAnswer : text;
}

/**
 * How many columns a list of answers gets on a wide stage.
 * @param count - the round's questions
 * @param steps - the most answers of one column, then of two
 */
export function recapColumns(count: number, steps: readonly number[] = RECAP_STEPS): number {
  return steps.filter((most) => count > most).length + 1;
}

/**
 * The list of a round's answers, under its own small title.
 * @param env - the quiz and the words
 * @param round - the round
 * @param title - the words above the list
 * @param steps - how many answers a column takes (see {@link recapColumns})
 */
export function answerList(env: PlayEnv, round: Round, title: string, steps: readonly number[] = RECAP_STEPS): HTMLElement {
  const count = round.questions.length;
  const columns = recapColumns(count, steps);
  const items = round.questions.map((question, index) => h("li", { class: "qp-recap-line", "data-recap-line": String(index + 1) },
    h("span", { class: "qp-recap-number", "aria-hidden": "true" }, `${String(index + 1)} —`),
    h("span", { class: "qp-recap-text" }, h("span", { class: "qp-visually-hidden" }, `${env.t("question.name", { n: index + 1 })}: `), answerLine(env, question))));
  const list = h("ol", { class: "qp-recap-lines", "data-columns": String(columns) }, ...items);
  list.style.setProperty("--qp-recap-digits", String(String(count).length));
  list.style.setProperty("--qp-recap-rows", String(Math.max(1, Math.ceil(count / columns))));
  return h("section", { class: "qp-recap", "data-recap": round.id }, h("h2", { class: "qp-recap-title" }, title), list);
}

/** The smallest a crowded list is drawn at, against its normal size. */
const FIT_MIN = 0.6;
const FIT_STEP = 0.05;

/**
 * Makes a list of long answers fit the room it has on a wide stage: drawn a little smaller, step by
 * step, until nothing is cut off. An upright screen scrolls instead (the stylesheet), and is left alone.
 * @param root - an element with an answer list in it
 */
export function fitRecap(root: HTMLElement): void {
  const list = root.querySelector<HTMLElement>(".qp-recap-lines");
  if (!list) return;
  list.style.removeProperty("--qp-recap-fit");
  if (getComputedStyle(list).overflowY !== "hidden") return;
  for (let fit = 1; fit >= FIT_MIN && list.scrollHeight > list.clientHeight + 1; fit -= FIT_STEP) list.style.setProperty("--qp-recap-fit", fit.toFixed(2));
}

/**
 * The round whose answers a break may show: the last one whose answers have all been revealed — the
 * game is at its score entry or past it. A round still being played keeps its answers to itself.
 * @param env - the quiz
 * @param state - the game
 */
export function recapRound(env: PlayEnv, state: GameState): Round | undefined {
  const done = state.screens.slice(0, state.index + 1).findLast((screen) => screen.screen === STANDARD_SCREENS.score && screen.roundId !== undefined);
  return env.file.quiz.rounds.find((round) => round.id === done?.roundId);
}

/**
 * The buttons that start a break of 5, 10 or 15 minutes, with the word "Break" before them.
 * @param env - the words and how to make a move
 */
export function breakRow(env: PlayEnv): HTMLElement {
  const buttons = BREAK_MINUTES.map((minutes) => {
    const button = pillButton("break", env.t("score.breakMinutes", { n: minutes }), { "data-break-start": String(minutes), "aria-label": env.t("menu.breakMinutes", { n: minutes }), title: env.t("menu.breakMinutes", { n: minutes }) });
    button.addEventListener("click", () => { env.dispatch({ type: "break", minutes }); });
    return button;
  });
  return h("div", { class: "qp-break-row", role: "group", "aria-label": env.t("break.title"), "data-break-row": "" }, h("span", { class: "qp-break-label", "aria-hidden": "true" }, env.t("break.title")), ...buttons);
}
