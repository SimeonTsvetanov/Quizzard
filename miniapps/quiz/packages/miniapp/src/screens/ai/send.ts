// "Give it to your assistant": the person picks their assistant once (remembered), and one press copies
// the prompt and opens that assistant in a new tab — or, where the device can, hands the prompt to any
// app through the share sheet (on a phone it lists ChatGPT, Gemini and Claude when they are installed).
// The prompt itself can be opened and read.
import type { App } from "../../app/state.ts";
import { labelButton } from "../../dom/controls.ts";
import { h } from "../../dom/h.ts";

/** The assistants with a page of their own; "other" only copies. */
const ASSISTANTS = {
  chatgpt: "https://chatgpt.com/",
  gemini: "https://gemini.google.com/app",
  claude: "https://claude.ai/new",
  other: null,
} as const;

type Assistant = keyof typeof ASSISTANTS;

/** Where the chosen assistant is kept. */
const PREF = "ai.assistant";

/** Copies a text; `false` when the browser refuses (no permission, an old WebView). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** What the step needs from its window. */
export interface SendStep {
  /** The step's number in the window. */
  readonly number: number;
  /** The prompt as it is now (the form may have changed). */
  prompt(): string;
  /** Says something in the window's status line. */
  say(text: string, isError?: boolean): void;
  /** Says nothing can be sent yet (the form asks for nothing): the words to say, or `null` when all is well. */
  refusal?(): string | null;
}

/** The buttons to pick the assistant: one is on; the choice is kept. */
function picker(app: App, chosen: Assistant, onChange: (next: Assistant) => void): HTMLElement {
  const { t } = app;
  const buttons = (Object.keys(ASSISTANTS) as Assistant[]).map((one) => {
    const button = h("button", { type: "button", class: "quiz-ai-assistant", "aria-pressed": String(one === chosen), "data-ai-assistant": one }, t(`ai.assistants.${one}`));
    button.addEventListener("click", () => {
      for (const other of buttons) other.setAttribute("aria-pressed", String(other === button));
      app.context.storage.prefs.set(PREF, one);
      onChange(one);
    });
    return button;
  });
  return h("div", { class: "quiz-ai-assistants", role: "group", "aria-label": t("ai.assistant") }, ...buttons);
}

/** The prompt, to be read and copied by hand when copying is refused. */
function shownPrompt(app: App, step: SendStep): HTMLDetailsElement {
  const text = h("textarea", { class: "quiz-input quiz-ai-guide", readonly: "", rows: "8", lang: "en", "aria-label": app.t("ai.show"), "data-ai-guide": "" });
  const details = h("details", { class: "quiz-ai-details" }, h("summary", {}, app.t("ai.show")), text);
  details.addEventListener("toggle", () => { if (details.open) text.value = step.prompt(); });
  return details;
}

/**
 * Builds the step that gives the prompt to the person's assistant.
 * @param app - the mounted creator
 * @param step - the prompt, the status line and the step's number
 */
export function sendStep(app: App, step: SendStep): HTMLElement {
  const { t } = app;
  const kept = app.context.storage.prefs.get<string>(PREF, "chatgpt");
  let chosen: Assistant = kept in ASSISTANTS ? (kept as Assistant) : "chatgpt";
  const go = labelButton("copy", "", { class: "button button--primary quiz-ai-go", "data-ai-copy": "" });
  const words = go.querySelector("span");
  const label = (): void => {
    if (words) words.textContent = ASSISTANTS[chosen] === null ? t("ai.copy") : t("ai.copyOpen", { name: t(`ai.assistants.${chosen}`) });
  };
  label();
  const details = shownPrompt(app, step);
  go.addEventListener("click", () => {
    const refusal = step.refusal?.() ?? null;
    if (refusal !== null) {
      step.say(refusal, true);
      return;
    }
    const prompt = step.prompt();
    const url = ASSISTANTS[chosen];
    const name = t(`ai.assistants.${chosen}`);
    // Both start inside the press: a browser lets a page copy and open a tab only while it handles one.
    const copied = copyText(prompt);
    if (url !== null) window.open(url, "_blank", "noopener");
    void copied.then((isCopied) => {
      if (!isCopied) details.open = true;
      step.say(isCopied ? t(url === null ? "ai.copied" : "ai.opened", { name }) : t("ai.copyFailed"), !isCopied);
    });
  });
  const tools = h("div", { class: "quiz-ai-actions" });
  if (typeof navigator.share === "function") {
    const share = labelButton("share", t("ai.share"), { class: "button", "data-ai-share": "" });
    share.addEventListener("click", () => {
      const refusal = step.refusal?.() ?? null;
      if (refusal !== null) {
        step.say(refusal, true);
        return;
      }
      void navigator.share({ title: t("ai.shareTitle"), text: step.prompt() }).catch(() => undefined);
    });
    tools.append(share);
  }
  return h("section", { class: "quiz-ai-step" }, h("h3", {}, t("ai.stepSend", { n: step.number })), h("span", { class: "quiz-ai-label" }, t("ai.assistant")), picker(app, chosen, (next) => { chosen = next; label(); }), go, ...(tools.childElementCount > 0 ? [tools] : []), details);
}
