// "Check the answers with AI" (screens/ai/window.ts is its window): the assistant reads every question with
// its answer and names the ones that look wrong; the window lists them, each with the way to its question.
// A doubt about a whole round or the whole quiz is listed too, without a way to a question.
import { type Quiz, findQuestion } from "@simeonts/quizzard-quiz-core";
import { type CheckItem, checkPrompt, readCheck } from "@simeonts/quizzard-quiz-core/draft";
import type { App } from "../../app/state.ts";
import { labelButton } from "../../dom/controls.ts";
import { h } from "../../dom/h.ts";
import type { AiJob } from "./window.ts";

/** Where a doubt is: a question, a round, or the whole quiz. */
function placeOf(app: App, item: CheckItem): string {
  const { t } = app;
  if (item.round === 0) return t("ai.checkQuiz");
  return item.question === 0 ? t("ai.checkRound", { round: item.round }) : t("ai.checkPlace", { round: item.round, question: item.question });
}

/** One doubt in the check's result: where, what is wrong, the suggestion, and the way to its question. */
function finding(app: App, quiz: Quiz, item: CheckItem, close: () => Promise<void>): HTMLElement {
  const { t } = app;
  const parts: HTMLElement[] = [h("strong", { class: "quiz-ai-finding-place" }, placeOf(app, item))];
  if (item.found) parts.push(h("span", { class: "quiz-ai-finding-prompt" }, item.found.prompt));
  else if (item.round !== 0 && item.question !== 0) parts.push(h("span", { class: "quiz-ai-finding-prompt" }, t("ai.checkMissing")));
  parts.push(h("p", { class: "quiz-ai-finding-problem" }, item.problem));
  if (item.suggestion !== "") parts.push(h("p", { class: "quiz-ai-text" }, t("ai.checkSuggestion", { text: item.suggestion })));
  const found = item.found;
  if (found && findQuestion(quiz, found.id)) {
    const open = labelButton("open", t("ai.checkOpen"), { class: "button", "data-ai-open-question": found.id });
    open.addEventListener("click", () => {
      void close().then(() => { app.go({ screen: "editor", quiz: quiz.id, question: found.id }); });
    });
    parts.push(open);
  }
  return h("li", { class: "quiz-ai-finding" }, ...parts);
}

/**
 * "Check the answers with AI": the assistant's doubts, each with the way to its question.
 * @param app - the mounted creator
 * @param quiz - the open quiz
 */
export function checkJob(app: App, quiz: Quiz): AiJob {
  const { t } = app;
  const language = app.lang === "bg" ? "bg" : "en";
  return {
    title: t("ai.check"),
    intro: t("ai.introCheck"),
    target: "quiz",
    prompt: () => checkPrompt(app.current?.quiz ?? quiz, language),
    last: { kind: "check", quizId: quiz.id },
    make: t("ai.makeCheck"),
    async take(text, window) {
      await Promise.resolve();
      const now = app.current?.quiz.id === quiz.id ? app.current.quiz : undefined;
      if (!now) {
        window.say(t("ai.gone"), true);
        return;
      }
      const read = readCheck(text, now);
      if (!read.ok) {
        const words = { empty: "ai.empty", "no-json": "ai.noJson", broken: "ai.broken" } as const;
        window.say(t(words[read.reason]), true);
        window.field.focus();
        return;
      }
      window.say("");
      if (read.items.length === 0) {
        window.showResult(h("div", {}, h("h3", { tabindex: "-1" }, t("ai.checkNone"))));
        return;
      }
      const list = h("ul", { class: "quiz-ai-findings" }, ...read.items.map((item) => finding(app, now, item, () => window.close())));
      window.showResult(h("div", { "data-ai-findings": "" }, h("h3", { tabindex: "-1" }, t("ai.checkFound", { count: read.items.length })), list));
    },
  };
}
