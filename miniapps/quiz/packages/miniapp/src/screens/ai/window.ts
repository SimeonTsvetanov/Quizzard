// An AI window: the sheet every job opens in — make a quiz, add rounds, add questions, check the answers
// (screens/ai/jobs.ts). Up to three steps as soft tiles: what the person wants (a form), giving the
// prompt to their assistant, and pasting its answer back; then either the job is done, or the list of
// what must be fixed (in the app's language, ready to copy back), or the job's own result. One status
// line stays in view at the window's lower edge.
import "../../styles/sheet.css";
import "../../styles/ai.css";
import { type DraftIssue, type IssueLang, issueText, issuesForAssistant } from "@simeonts/quizzard-quiz-core/draft";
import type { App } from "../../app/state.ts";
import { labelButton } from "../../dom/controls.ts";
import { h } from "../../dom/h.ts";
import { icon } from "../../dom/icons.ts";
import type { WishForm } from "./form.ts";
import { copyText, sendStep } from "./send.ts";

/** An open AI window, as a job sees it. */
export interface AiWindow {
  readonly field: HTMLTextAreaElement;
  /** Says something in the status line; `""` empties it. */
  say(text: string, isError?: boolean): void;
  /** Shows what must be fixed, ready to be copied back to the assistant. */
  showProblems(issues: readonly DraftIssue[]): void;
  /** Shows the job's own result in the window (the check's findings). */
  showResult(element: HTMLElement): void;
  /** Closes the window; resolves once it is gone, so a toast after it lands on the page, not in the window. */
  close(): Promise<void>;
}

/** What a job puts in the window. */
export interface AiJob {
  readonly title: string;
  readonly intro: string;
  /** What the person chooses before the prompt is copied; none for a check. */
  readonly form?: WishForm;
  prompt(): string;
  /** Why nothing can be sent yet (nothing chosen), or `null`. */
  refusal?(): string | null;
  /** The words of the last step's button. */
  readonly make: string;
  /** Reads what was pasted and does the job. */
  take(text: string, window: AiWindow): Promise<void>;
  /** Text already in the field (shared from another app) and what the status line says of it. */
  readonly start?: { readonly text: string; readonly status: string };
}

/** The status line: emptied first, so the same words said twice are read out twice. */
function statusLine(): { readonly element: HTMLElement; readonly say: AiWindow["say"] } {
  const element = h("p", { class: "quiz-ai-status", role: "status", "data-ai-status": "" });
  return {
    element,
    say(text, isError = false) {
      element.textContent = "";
      element.toggleAttribute("data-error", isError);
      if (text !== "") setTimeout(() => { element.textContent = text; }, 40);
    },
  };
}

/** The last step: the field, "Paste" and the job's button. */
function pasteStep(app: App, job: AiJob, number: number, field: HTMLTextAreaElement, run: () => Promise<void>): HTMLElement {
  const { t } = app;
  const paste = labelButton("file", t("ai.paste"), { class: "button", "data-ai-paste": "" });
  const go = labelButton(null, job.make, { class: "button button--primary", "data-ai-make": "" });
  paste.addEventListener("click", () => {
    // Where the browser lets the page read the clipboard, one press pastes; else the field takes the focus for the person's own paste.
    void navigator.clipboard.readText().then((text) => { field.value = field.value.trim() === "" ? text : `${field.value}\n\n${text}`; }).catch(() => undefined).finally(() => { field.focus(); });
  });
  go.addEventListener("click", () => {
    go.disabled = true;
    void run().finally(() => { go.disabled = false; });
  });
  return h("section", { class: "quiz-ai-step" }, h("h3", {}, t("ai.stepPaste", { n: number })), h("p", { class: "quiz-ai-text" }, t("ai.step2Text")), field, h("div", { class: "quiz-ai-actions" }, paste, go));
}

/** The list of what must be fixed, in the app's language, and the button that copies it for the assistant. */
function problemsView(app: App, issues: readonly DraftIssue[], say: AiWindow["say"]): HTMLElement[] {
  const { t } = app;
  const lang: IssueLang = app.lang === "bg" ? "bg" : "en";
  const errors = issues.filter((issue) => issue.level === "error");
  const copy = labelButton("copy", t("ai.copyProblems"), { class: "button button--primary", "data-ai-copy-problems": "" });
  copy.addEventListener("click", () => {
    void copyText(issuesForAssistant(issues, lang)).then((isCopied) => { say(t(isCopied ? "ai.problemsCopied" : "ai.copyFailed"), !isCopied); });
  });
  const list = h("ul", { class: "quiz-ai-problems" }, ...errors.map((issue) => h("li", {}, issueText(issue, lang))));
  return [h("h3", { tabindex: "-1" }, t("ai.problems", { count: errors.length })), h("p", { class: "quiz-ai-text" }, t("ai.problemsText")), list, copy];
}

/**
 * Opens an AI window for a job.
 * @param app - the mounted creator
 * @param job - what the window is for
 */
export function openAiWindow(app: App, job: AiJob): void {
  const { t } = app;
  const opener = document.activeElement;
  const heading = h("h2", { class: "quiz-sheet-title", id: "quiz-ai-title", tabindex: "-1" }, icon("ai"), h("span", {}, job.title));
  const closeButton = h("button", { type: "button", class: "quiz-icon-button", "aria-label": t("menu.close"), title: t("menu.close"), "data-sheet-close": "" }, icon("x"));
  const dialog = h("dialog", { class: "quiz-sheet quiz-ai", "aria-labelledby": heading.id, "data-ai-dialog": "" }, h("div", { class: "quiz-sheet-head" }, heading, closeButton));
  const status = statusLine();
  const field = h("textarea", { class: "quiz-input quiz-ai-field", rows: "6", spellcheck: "false", autocomplete: "off", "aria-label": t("ai.field"), placeholder: t("ai.placeholder"), "data-ai-field": "" });
  const outcome = h("section", { class: "quiz-ai-step quiz-ai-fix", hidden: "", "data-ai-problems": "" });
  const show = (children: HTMLElement[]): void => {
    outcome.replaceChildren(...children);
    outcome.hidden = false;
    (outcome.querySelector<HTMLElement>("h3") ?? outcome).focus();
  };
  const window: AiWindow = {
    field,
    say: status.say,
    showProblems: (issues) => { show(problemsView(app, issues, status.say)); },
    showResult: (element) => { show([element]); },
    close: () => new Promise<void>((resolve) => {
      if (!dialog.open) {
        resolve();
        return;
      }
      dialog.addEventListener("close", () => { resolve(); }, { once: true });
      dialog.close();
    }),
  };
  const run = async (): Promise<void> => {
    outcome.hidden = true;
    // Whatever goes wrong while the answer is read, the window says so and stays as it is.
    await job.take(field.value, window).catch(() => { status.say(t("ai.failed"), true); });
  };
  const sendNumber = job.form ? 2 : 1;
  const steps = [
    ...(job.form ? [h("section", { class: "quiz-ai-step" }, h("h3", {}, t("ai.stepWish")), job.form.element)] : []),
    sendStep(app, { number: sendNumber, prompt: () => job.prompt(), say: status.say, ...(job.refusal ? { refusal: () => job.refusal?.() ?? null } : {}) }),
    pasteStep(app, job, sendNumber + 1, field, run),
  ];
  const intro = h("p", { class: "quiz-ai-text" }, job.intro, " ", h("span", { class: "quiz-ai-private" }, t("ai.private")));
  dialog.append(h("div", { class: "quiz-ai-body" }, intro, ...steps, outcome, status.element));
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
  if (job.start) {
    field.value = job.start.text;
    status.say(job.start.status);
    field.scrollIntoView({ block: "center" });
    field.focus();
  } else {
    heading.focus();
  }
}
