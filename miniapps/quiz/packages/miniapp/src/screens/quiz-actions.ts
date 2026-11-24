// What is done with a whole quiz, on its header card: Play, Preview and Export — equal buttons, one
// line each — then what is not finished yet, what the last export saved, and, folded away, the quiz
// file (save, share). Play and Export ask first while questions are unfinished (screens/launch.ts).
import { type Quiz, unfinishedQuestions } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { labelButton } from "../dom/controls.ts";
import { h } from "../dom/h.ts";
import { icon } from "../dom/icons.ts";
import { bytesText } from "../format.ts";
import { checkUnfinished, playQuiz } from "./launch.ts";
import { edit } from "./question-moves.ts";
import { exportControl, quizFileRow } from "./quiz-files.ts";

/** "3 questions are not finished": a way to the first of them; nothing for a finished quiz. */
function unfinishedNote(app: App, quiz: Quiz): HTMLElement | null {
  const list = unfinishedQuestions(quiz, app.env.registries);
  const first = list[0];
  if (!first) return null;
  const link = h("button", { type: "button", class: "quiz-note-link", "data-quiz-unfinished": String(list.length) }, icon("alert", 18), h("span", {}, app.t("quiz.unfinished", { count: list.length })));
  link.addEventListener("click", () => { edit(app, first.question.id); });
  return link;
}

/** The quiz file, folded away under the main actions: what it is for, "Save quiz file", "Share" — and more tools next to them. */
function fileTools(app: App, quiz: Quiz): HTMLElement {
  const tools = h("details", { class: "quiz-more", "data-quiz-more": "" },
    h("summary", { class: "quiz-settings-summary" }, icon("file", 20), h("span", { class: "quiz-settings-name" }, app.t("quiz.more"))),
    quizFileRow(app, quiz));
  tools.open = app.view.isMoreOpen;
  tools.addEventListener("toggle", () => { app.view.isMoreOpen = tools.open; });
  return tools;
}

/**
 * Draws the actions of a quiz.
 * @param app - the mounted creator
 * @param quiz - the open quiz
 */
export function quizActions(app: App, quiz: Quiz): HTMLElement {
  const { t } = app;
  const first = quiz.rounds.flatMap((round) => round.questions)[0];
  const play = labelButton("play", t("quiz.play"), { class: "button button--primary", "data-play-quiz": "", "data-focus": "play" });
  const preview = labelButton("eye", t("quiz.preview"), { class: "button", "data-preview-quiz": "" });
  const { button: exportButton, progress, run: runExport } = exportControl(app, quiz);
  for (const button of [play, preview, exportButton]) button.disabled = first === undefined;
  play.addEventListener("click", () => { playQuiz(app); });
  preview.addEventListener("click", () => { if (first) app.go({ screen: "preview", quiz: quiz.id, question: first.id }); });
  exportButton.addEventListener("click", () => { checkUnfinished(app, "export", runExport); });
  const box = h("div", { class: "quiz-actions-box" }, h("div", { class: "quiz-actions" }, play, preview, exportButton), progress);
  const note = unfinishedNote(app, quiz);
  if (note) box.append(note);
  const made = app.view.exported;
  if (made?.quiz === quiz.id) box.append(h("p", { class: "quiz-hint", "data-exported": "" }, t("export.saved", { name: made.name, size: bytesText(made.bytes, app.lang) })));
  else if (first === undefined) box.append(h("p", { class: "quiz-hint" }, t("quiz.playHint")));
  if (first !== undefined) box.append(fileTools(app, quiz));
  return box;
}
