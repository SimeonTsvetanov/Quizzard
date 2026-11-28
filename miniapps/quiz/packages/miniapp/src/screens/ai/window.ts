// An AI window: the sheet every job opens in — make a quiz, add rounds, add questions, check the answers
// (screens/ai/jobs.ts). Up to three steps as soft tiles: what the person wants (a form), giving the
// prompt to their assistant, and pasting its answer back; then either the job is done, or the list of
// what must be fixed (in the app's language, ready to copy back), or the job's own result. One status
// line stays in view at the window's lower edge. Closing the window stops a job that is still running.
import "../../styles/sheet.css";
import "../../styles/ai.css";
import { type DraftIssue, type IssueLang, type IssueTarget, issueText, issuesForAssistant } from "@simeonts/quizzard-quiz-core/draft";
import type { App } from "../../app/state.ts";
import { labelButton } from "../../dom/controls.ts";
import { h } from "../../dom/h.ts";
import { icon } from "../../dom/icons.ts";
import { type LastJob, writeLastJob } from "../../storage/ai-prefs.ts";
import type { WishForm } from "./form.ts";
import { copyText, sendStep } from "./send.ts";

/** An open AI window, as a job sees it. */
export interface AiWindow {
  readonly field: HTMLTextAreaElement;
  /** Aborted when the window closes: a job stops before it changes anything. */
  readonly signal: AbortSignal;
  /** Says something in the status line; `""` empties it. */
  say(text: string, isError?: boolean): void;
  /** Shows what must be fixed, ready to be copied back to the assistant; the next Paste replaces the old answer. */
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
  /** What the assistant is asked for: the words of the list of problems follow it. */
  readonly target: IssueTarget;
  /** What the person chooses before the prompt is copied; none for a check. */
  readonly form?: WishForm;
  prompt(): string;
  /** Why nothing can be sent yet (nothing chosen, no room), or `null`. */
  refusal?(): string | null;
  /** The job a prompt is given for, kept so an answer shared back from another app comes to it. */
  readonly last: LastJob;
  /** The words of the last step's button. */
  readonly make: string;
  /** Reads what was pasted and does the job. */
  take(text: string, window: AiWindow): Promise<void>;
}

/** The status line: emptied first, so the same words said twice are read out twice; a newer word cancels an older one. */
function statusLine(): { readonly element: HTMLElement; readonly say: AiWindow["say"] } {
  const element = h("p", { class: "quiz-ai-status", role: "status", "data-ai-status": "" });
  let pending: ReturnType<typeof setTimeout> | undefined;
  return {
    element,
    say(text, isError = false) {
      clearTimeout(pending);
      element.textContent = "";
      element.toggleAttribute("data-error", isError);
      if (text !== "") pending = setTimeout(() => { element.textContent = text; }, 40);
    },
  };
}

/** The list of what must be fixed, in the app's language, and the button that copies it for the assistant. */
function problemsView(app: App, issues: readonly DraftIssue[], target: IssueTarget, say: AiWindow["say"]): HTMLElement[] {
  const { t } = app;
  const lang: IssueLang = app.lang === "bg" ? "bg" : "en";
  const errors = issues.filter((issue) => issue.level === "error");
  const copy = labelButton("copy", t("ai.copyProblems"), { class: "button button--primary", "data-ai-copy-problems": "" });
  copy.addEventListener("click", () => {
    void copyText(issuesForAssistant(issues, lang, target)).then((isCopied) => { say(t(isCopied ? "ai.problemsCopied" : "ai.copyFailed"), !isCopied); });
  });
  const list = h("ul", { class: "quiz-ai-problems" }, ...errors.map((issue) => h("li", {}, issueText(issue, lang))));
  return [h("h3", { tabindex: "-1" }, t("ai.problems", { count: errors.length })), h("p", { class: "quiz-ai-text" }, t("ai.problemsText")), list, copy];
}

/** The window's parts that the steps and the job share. */
interface Parts {
  readonly field: HTMLTextAreaElement;
  readonly go: HTMLButtonElement;
  /** The answer was refused: the next Paste puts the new answer in place of the old one. */
  isRefused: boolean;
}

/** The last step: the field, "Paste" and the job's button. */
function pasteStep(app: App, job: AiJob, number: number, parts: Parts, run: () => Promise<void>): HTMLElement {
  const { t } = app;
  const { field, go } = parts;
  const paste = labelButton("file", t("ai.paste"), { class: "button", "data-ai-paste": "" });
  paste.addEventListener("click", () => {
    // Where the browser lets the page read the clipboard, one press pastes — after a refused answer, in its place — and
    // the way on is the job's button (no phone keyboard over it); else the field takes the focus for the person's own paste.
    void navigator.clipboard.readText().then((text) => {
      field.value = field.value.trim() === "" || parts.isRefused ? text : `${field.value}\n\n${text}`;
      parts.isRefused = false;
      go.focus();
    }).catch(() => { field.focus(); });
  });
  // The person's own paste after a refused answer takes its place too (the list of problems says so).
  field.addEventListener("paste", (event) => {
    const text = event.clipboardData?.getData("text/plain") ?? "";
    if (!parts.isRefused || text === "") return;
    event.preventDefault();
    field.value = text;
    parts.isRefused = false;
  });
  go.addEventListener("click", () => {
    go.disabled = true;
    void run().finally(() => {
      go.disabled = false;
      if (go.isConnected && (document.activeElement === document.body || document.activeElement === null)) go.focus();
    });
  });
  return h("section", { class: "quiz-ai-step" }, h("h3", {}, t("ai.stepPaste", { n: number })), h("p", { class: "quiz-ai-text" }, t("ai.step2Text")), field, h("div", { class: "quiz-ai-actions" }, paste, go));
}

/** The window's frame: the dialog, its title and its close button. */
function frame(app: App, title: string): { readonly dialog: HTMLDialogElement; readonly heading: HTMLElement; readonly closeButton: HTMLButtonElement } {
  const { t } = app;
  const heading = h("h2", { class: "quiz-sheet-title", id: "quiz-ai-title", tabindex: "-1" }, icon("ai"), h("span", {}, title));
  const closeButton = h("button", { type: "button", class: "quiz-icon-button", "aria-label": t("menu.close"), title: t("menu.close"), "data-sheet-close": "" }, icon("x"));
  const dialog = h("dialog", { class: "quiz-sheet quiz-ai", "aria-labelledby": heading.id, "data-ai-dialog": "" }, h("div", { class: "quiz-sheet-head" }, heading, closeButton));
  return { dialog, heading, closeButton };
}

/** Closing: by its button, by Escape, by a press that starts and ends outside (a text selection ending out there does not). */
function closing(dialog: HTMLDialogElement, closeButton: HTMLButtonElement, opener: Element | null, onClose: () => void): void {
  closeButton.addEventListener("click", () => { dialog.close(); });
  let isPressedOutside = false;
  dialog.addEventListener("pointerdown", (event) => { isPressedOutside = event.target === dialog; });
  dialog.addEventListener("click", (event) => { if (event.target === dialog && isPressedOutside) dialog.close(); });
  dialog.addEventListener("close", () => {
    onClose();
    dialog.remove();
    if (opener instanceof HTMLElement && opener.isConnected && (document.activeElement === document.body || document.activeElement === null)) opener.focus();
  });
}

/**
 * Opens an AI window for a job.
 * @param app - the mounted creator
 * @param build - makes the job; it gets the status line, so its form can speak
 * @param start - text shared from another app, already in the field
 */
export function openAiWindow(app: App, build: (say: AiWindow["say"]) => AiJob, start?: string): void {
  const { t } = app;
  const opener = document.activeElement;
  const status = statusLine();
  const job = build(status.say);
  const { dialog, heading, closeButton } = frame(app, job.title);
  const parts: Parts = {
    field: h("textarea", { class: "quiz-input quiz-ai-field", rows: "6", spellcheck: "false", autocomplete: "off", "aria-label": t("ai.field"), placeholder: t("ai.placeholder"), "data-ai-field": "" }),
    go: labelButton(null, job.make, { class: "button button--primary", "data-ai-make": "" }),
    isRefused: false,
  };
  const outcome = h("section", { class: "quiz-ai-step quiz-ai-fix", hidden: "", "data-ai-problems": "" });
  const stop = new AbortController();
  const show = (children: HTMLElement[]): void => {
    outcome.replaceChildren(...children);
    outcome.hidden = false;
    // The outcome comes to the top of the window (not just into view at its lower edge), its title takes the focus.
    (outcome.querySelector<HTMLElement>("h3") ?? outcome).focus({ preventScroll: true });
    outcome.scrollIntoView({ block: "start" });
  };
  const window: AiWindow = {
    field: parts.field,
    signal: stop.signal,
    say: status.say,
    showProblems: (issues) => {
      parts.isRefused = true;
      show(problemsView(app, issues, job.target, status.say));
    },
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
    await job.take(parts.field.value, window).catch(() => { if (!stop.signal.aborted) status.say(t("ai.failed"), true); });
  };
  const sendNumber = job.form ? 2 : 1;
  const remember = (): void => { writeLastJob(app.context.storage.prefs, job.last); };
  const steps = [
    ...(job.form ? [h("section", { class: "quiz-ai-step" }, h("h3", {}, t("ai.stepWish")), job.form.element)] : []),
    sendStep(app, { number: sendNumber, prompt: () => job.prompt(), say: status.say, onSent: remember, ...(job.refusal ? { refusal: () => job.refusal?.() ?? null } : {}) }),
    pasteStep(app, job, sendNumber + 1, parts, run),
  ];
  const intro = h("p", { class: "quiz-ai-text" }, job.intro, " ", h("span", { class: "quiz-ai-private" }, t("ai.private")));
  dialog.append(h("div", { class: "quiz-ai-body" }, intro, ...steps, outcome, status.element));
  closing(dialog, closeButton, opener, () => { stop.abort(); });
  app.host.append(dialog);
  dialog.showModal();
  if (start === undefined) heading.focus();
  else begin(app, parts, status.say, start, job.make);
}

/** A window opened with shared text: the text in the field, the status line says what next, the job's button has the focus. */
function begin(app: App, parts: Parts, say: AiWindow["say"], text: string, make: string): void {
  parts.field.value = text;
  say(app.t("ai.shared", { button: make }));
  parts.go.scrollIntoView({ block: "nearest" });
  parts.go.focus();
}
