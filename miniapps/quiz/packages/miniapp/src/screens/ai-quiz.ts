// "Make a quiz with AI" (lazy: loaded with the first press): the person's own assistant writes the quiz
// as a draft (core `draft/`), Quizzard reads it. A window with two steps — copy the instructions for the
// assistant, paste its answer — and, when the answer cannot be taken, the list of what to fix, ready to
// be copied back to the assistant. Nothing leaves the device: the text is read and checked here.
import "../styles/sheet.css";
import "../styles/ai.css";
import { type Quiz, setRoundRules, totals } from "@simeonts/quizzard-quiz-core";
import { type DraftIssue, draftGuide, fromDraft, issueText, issuesForAssistant, readPasted } from "@simeonts/quizzard-quiz-core/draft";
import type { App } from "../app/state.ts";
import type { Lang } from "../contract.ts";
import { labelButton } from "../dom/controls.ts";
import { h } from "../dom/h.ts";
import { icon } from "../dom/icons.ts";
import { givenRules } from "./round-rules.ts";

/** The window's parts that change while it is open. */
interface Parts {
  readonly dialog: HTMLDialogElement;
  readonly field: HTMLTextAreaElement;
  /** One line that says what just happened (copied, nothing pasted); read out by screen readers. */
  readonly status: HTMLElement;
  /** What must be fixed, with its "Copy for the assistant". */
  readonly problems: HTMLElement;
}

/** Copies a text; `false` when the browser refuses (no permission, an old WebView). */
async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Says something in the window's status line, which stays in view at the window's lower edge. The line is
 * emptied first, so the same words said twice are read out twice.
 */
function say(parts: Parts, text: string, isError = false): void {
  parts.status.textContent = "";
  parts.status.toggleAttribute("data-error", isError);
  if (text !== "") setTimeout(() => { parts.status.textContent = text; }, 40);
}

/** Step 1: the instructions — one button copies them; they can also be opened and read. */
function instructions(app: App, parts: Parts): HTMLElement {
  const { t } = app;
  const guide = draftGuide();
  const button = labelButton("copy", t("ai.copy"), { class: "button button--primary", "data-ai-copy": "" });
  const text = h("textarea", { class: "quiz-input quiz-ai-guide", readonly: "", rows: "8", lang: "en", "aria-label": t("ai.show"), "data-ai-guide": "" });
  text.value = guide;
  const details = h("details", { class: "quiz-ai-details" }, h("summary", {}, t("ai.show")), text);
  button.addEventListener("click", () => {
    void copy(guide).then((isCopied) => {
      if (!isCopied) details.open = true;
      say(parts, t(isCopied ? "ai.copied" : "ai.copyFailed"), !isCopied);
    });
  });
  return h("section", { class: "quiz-ai-step" }, h("h3", {}, t("ai.step1")), h("p", { class: "quiz-ai-text" }, t("ai.step1Text")), button, details);
}

/** The list of what must be fixed: each error as a sentence, and the button that copies them for the assistant. */
function showProblems(app: App, parts: Parts, issues: readonly DraftIssue[]): void {
  const { t } = app;
  const errors = issues.filter((issue) => issue.level === "error");
  const copyButton = labelButton("copy", t("ai.copyProblems"), { class: "button button--primary", "data-ai-copy-problems": "" });
  copyButton.addEventListener("click", () => {
    void copy(issuesForAssistant(issues)).then((isCopied) => { say(parts, t(isCopied ? "ai.problemsCopied" : "ai.copyFailed"), !isCopied); });
  });
  // The sentences are the assistant's to read, so they stay in English whatever the app's language.
  const list = h("ul", { class: "quiz-ai-problems", lang: "en" }, ...errors.map((issue) => h("li", {}, issueText(issue))));
  parts.problems.replaceChildren(h("h3", { tabindex: "-1" }, t("ai.problems", { count: errors.length })), h("p", { class: "quiz-ai-text" }, t("ai.problemsText")), list, copyButton);
  parts.problems.hidden = false;
  parts.problems.querySelector<HTMLElement>("h3")?.focus();
}

/** A name no quiz of the library has: the quiz's own, or "… 2", "… 3". */
function freeName(app: App, name: string): string {
  const lines = app.library === null || app.library === "error" ? [] : app.library;
  const taken = new Set(lines.map((line) => line.name));
  if (!taken.has(name)) return name;
  for (let n = 2; ; n += 1) {
    const next = `${name} ${String(n)}`;
    if (!taken.has(next)) return next;
  }
}

/** The quiz with the rules text every special round is given, in the language the quiz is played in. */
async function withRules(app: App, quiz: Quiz): Promise<Quiz> {
  let next = quiz;
  const lang: Lang = quiz.language === "bg" ? "bg" : "en";
  for (const round of quiz.rounds) {
    if ((round.rules ?? "") !== "") continue;
    const rules = await givenRules(round, lang, app.env.registries);
    if (rules !== undefined) next = setRoundRules(next, round.id, rules);
  }
  return next;
}

/** Reads what was pasted; makes the quiz and opens it, or shows what must be fixed. */
async function make(app: App, parts: Parts): Promise<void> {
  const { t } = app;
  parts.problems.hidden = true;
  const pasted = readPasted(parts.field.value);
  if (!pasted.ok) {
    const words = { empty: "ai.empty", "no-json": "ai.noJson", broken: "ai.broken", "too-long": "ai.tooLong" } as const;
    say(parts, t(words[pasted.reason]), true);
    parts.field.focus();
    return;
  }
  const result = fromDraft(pasted.draft, { now: new Date().toISOString(), language: app.lang, quizName: t("library.newName"), roundName: (n) => t("round.defaultName", { n }) }, app.env);
  if (!result.quiz) {
    say(parts, "");
    showProblems(app, parts, result.issues);
    return;
  }
  const quiz = await withRules(app, { ...result.quiz, name: freeName(app, result.quiz.name) });
  try {
    await app.store.put(quiz);
  } catch {
    say(parts, t("notSaved"), true);
    return;
  }
  if (app.signal.aborted) return;
  app.context.storage.notifySaved();
  parts.dialog.close();
  const fixed = result.issues.length;
  app.context.shell.toast(`${t("ai.added", { name: quiz.name })}${fixed > 0 ? ` ${t("ai.adjusted", { count: fixed })}` : ""}`);
  app.go({ screen: "quiz", quiz: quiz.id }, "push", totals(quiz).questions > 0 ? "[data-play-quiz]" : "[data-add-round]");
}

/** Step 2: the field the answer is pasted into, "Paste" and "Make the quiz". */
function answer(app: App, parts: Parts): HTMLElement {
  const { t } = app;
  const { field } = parts;
  const paste = labelButton("file", t("ai.paste"), { class: "button", "data-ai-paste": "" });
  const go = labelButton(null, t("ai.make"), { class: "button button--primary", "data-ai-make": "" });
  paste.addEventListener("click", () => {
    // Where the browser lets the page read the clipboard, one press pastes; else the field takes the focus for the person's own paste.
    void navigator.clipboard.readText().then((text) => { field.value = field.value.trim() === "" ? text : `${field.value}\n\n${text}`; }).catch(() => undefined).finally(() => { field.focus(); });
  });
  go.addEventListener("click", () => {
    go.disabled = true;
    // Whatever goes wrong while the answer is read, the window says so and stays as it is.
    void make(app, parts).catch(() => { say(parts, t("ai.failed"), true); }).finally(() => { go.disabled = false; });
  });
  return h("section", { class: "quiz-ai-step" }, h("h3", {}, t("ai.step2")), h("p", { class: "quiz-ai-text" }, t("ai.step2Text")), field, h("div", { class: "quiz-ai-actions" }, paste, go));
}

/**
 * Opens "Make a quiz with AI".
 * @param app - the mounted creator
 */
export function openAiQuiz(app: App): void {
  const { t } = app;
  const opener = document.activeElement;
  const heading = h("h2", { class: "quiz-sheet-title", id: "quiz-ai-title", tabindex: "-1" }, icon("ai"), h("span", {}, t("ai.open")));
  const closeButton = h("button", { type: "button", class: "quiz-icon-button", "aria-label": t("menu.close"), title: t("menu.close"), "data-sheet-close": "" }, icon("x"));
  const dialog = h("dialog", { class: "quiz-sheet quiz-ai", "aria-labelledby": heading.id, "data-ai-dialog": "" }, h("div", { class: "quiz-sheet-head" }, heading, closeButton));
  const parts: Parts = {
    dialog,
    field: h("textarea", { class: "quiz-input quiz-ai-field", rows: "6", spellcheck: "false", autocomplete: "off", "aria-label": t("ai.field"), placeholder: t("ai.placeholder"), "data-ai-field": "" }),
    status: h("p", { class: "quiz-ai-status", role: "status", "data-ai-status": "" }),
    problems: h("section", { class: "quiz-ai-step quiz-ai-fix", hidden: "", "data-ai-problems": "" }),
  };
  dialog.append(h("div", { class: "quiz-ai-body" }, h("p", { class: "quiz-ai-text" }, t("ai.intro")), instructions(app, parts), answer(app, parts), parts.status, parts.problems));
  closeButton.addEventListener("click", () => { dialog.close(); });
  // A press that both starts and ends outside the window closes it; a text selection that ends out there does not.
  let isPressedOutside = false;
  dialog.addEventListener("pointerdown", (event) => { isPressedOutside = event.target === dialog; });
  dialog.addEventListener("click", (event) => { if (event.target === dialog && isPressedOutside) dialog.close(); });
  dialog.addEventListener("close", () => {
    dialog.remove();
    if (opener instanceof HTMLElement && opener.isConnected && (document.activeElement === document.body || document.activeElement === null)) opener.focus();
  });
  app.host.append(dialog);
  dialog.showModal();
  heading.focus();
}
