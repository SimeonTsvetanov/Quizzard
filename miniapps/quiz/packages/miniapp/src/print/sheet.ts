// "Print answers" (lazy: loaded with the first press): the host's sheet for the table — every round
// with its questions, answers, explanations, host notes and points, black on white, a round to a
// page. The sheet is drawn into the tool's element, shown only to the printer (styles/print.css and
// the shell's `data-print-sheet` rule), handed to the browser's print dialog and removed afterwards.
import "../styles/print.css";
import { type Question, type Quiz, type Round, effectivePoints, effectiveSeconds } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { h } from "../dom/h.ts";
import { slideLabels } from "../format.ts";
import { pointsText } from "../render/slide.ts";

/** One labelled line of a question: nothing when there is no text. */
function line(label: string, text: string, hook: string): HTMLElement | null {
  return text.trim() === "" ? null : h("p", { class: "quiz-print-line", [hook]: "" }, h("b", {}, `${label}: `), text);
}

function questionBlock(app: App, round: Round, question: Question, index: number): HTMLElement {
  const { t, env } = app;
  const labels = slideLabels(t, app.lang);
  const kind = env.registries.kinds.get(question.kind);
  const answer = env.registries.answers.get(question.answer.type)?.revealText(question.answer, labels) ?? "";
  const prompt = question.prompt.trim() === "" ? (kind?.summary(question) ?? "") : question.prompt;
  const facts = `${pointsText(effectivePoints(round, question), labels)} · ${labels.seconds(effectiveSeconds(round, question))}`;
  const parts = [
    h("p", { class: "quiz-print-question" }, h("b", {}, `${String(index + 1)}. `), prompt === "" ? t("print.noText") : prompt, h("span", { class: "quiz-print-facts" }, ` (${facts})`)),
    line(t("print.answer"), answer === "" ? t("print.noAnswer") : answer, "data-print-answer"),
    line(t("print.explanation"), question.explanation ?? "", "data-print-explanation"),
    line(t("print.note"), question.note ?? "", "data-print-note"),
  ];
  return h("li", { class: "quiz-print-item", "data-print-question": question.id }, ...parts.filter((part) => part !== null));
}

function roundBlock(app: App, round: Round, index: number, total: number): HTMLElement {
  const { t } = app;
  const labels = slideLabels(t, app.lang);
  const block = h("section", { class: "quiz-print-round", "data-print-round": round.id },
    h("h2", {}, `${t("round.number", { n: index + 1 })}/${String(total)} · ${round.name}`),
    h("p", { class: "quiz-print-meta" }, `${t("count.questions", { count: round.questions.length })} · ${labels.seconds(round.defaults.seconds)} · ${pointsText(round.defaults.points, labels)}`));
  if ((round.rules ?? "").trim() !== "") block.append(h("p", { class: "quiz-print-line" }, h("b", {}, `${t("print.rules")}: `), round.rules ?? ""));
  block.append(h("ol", { class: "quiz-print-list" }, ...round.questions.map((question, at) => questionBlock(app, round, question, at))));
  return block;
}

/**
 * Builds the host's sheet of a quiz.
 * @param app - the mounted creator
 * @param quiz - the quiz to print
 */
export function hostSheet(app: App, quiz: Quiz): HTMLElement {
  const rounds = quiz.rounds.filter((round) => round.questions.length > 0);
  return h("article", { class: "quiz-print", "data-print-sheet": "", lang: app.lang },
    h("h1", {}, quiz.name.trim() === "" ? app.t("quiz.unnamed") : quiz.name),
    h("p", { class: "quiz-print-meta" }, app.t("print.title")),
    ...rounds.map((round, index) => roundBlock(app, round, index, rounds.length)));
}

/**
 * Prints the host's sheet of the open quiz.
 * @param app - the mounted creator
 * @param quiz - the quiz
 */
export function printAnswers(app: App, quiz: Quiz): void {
  app.host.querySelector("[data-print-sheet]")?.remove();
  const sheet = hostSheet(app, quiz);
  app.host.prepend(sheet); // first: the print stylesheet hides what follows it
  const done = (): void => { sheet.remove(); };
  window.addEventListener("afterprint", done, { once: true });
  app.signal.addEventListener("abort", done, { once: true });
  window.print();
}
