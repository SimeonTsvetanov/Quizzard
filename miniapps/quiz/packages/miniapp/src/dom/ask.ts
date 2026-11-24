// A question with more than one answer besides "Cancel" (the shell's `confirm` has exactly one): the
// same centred alert, drawn with the shell's own classes inside the tool's element. Cancel comes
// first and has the focus; Escape and a click outside are Cancel. Text goes in as text.
import { h } from "./h.ts";

/** One way to answer. */
export interface AskOption<T> {
  readonly value: T;
  readonly label: string;
  /** The answer loses something: drawn as the one red button. */
  readonly isDanger?: boolean;
}

/** Inputs of {@link ask}. */
export interface AskOptions<T> {
  /** The tool's element: the dialog lives in it (and is shown in the top layer). */
  readonly host: HTMLElement;
  readonly title: string;
  readonly text: string;
  readonly cancel: string;
  readonly options: readonly AskOption<T>[];
}

/**
 * Asks a question with several answers.
 * @param options - the words and the answers, in the order they are shown after Cancel
 * @returns the chosen answer's value, or `null` for Cancel, Escape and a click outside
 */
export function ask<T>(options: AskOptions<T>): Promise<T | null> {
  return new Promise((resolve) => {
    let result: T | null = null;
    const cancel = h("button", { type: "button", class: "button", "data-ask": "cancel" }, options.cancel);
    const dialog = h("dialog", { class: "alert quiz-ask", role: "alertdialog", "aria-labelledby": "quiz-ask-title", "aria-describedby": "quiz-ask-text", "data-ask-dialog": "" },
      h("h2", { id: "quiz-ask-title", class: "alert-title" }, options.title),
      h("p", { id: "quiz-ask-text", class: "alert-text" }, options.text));
    const answers = options.options.map((option, index) => {
      const button = h("button", { type: "button", class: `button ${option.isDanger === true ? "button--danger" : ""}`.trim(), "data-ask": String(index) }, option.label);
      button.addEventListener("click", () => {
        result = option.value;
        dialog.close();
      });
      return button;
    });
    dialog.append(h("div", { class: "alert-actions" }, cancel, ...answers));
    cancel.addEventListener("click", () => { dialog.close(); });
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener("close", () => {
      dialog.remove();
      resolve(result);
    });
    options.host.append(dialog);
    dialog.showModal();
    cancel.focus();
  });
}
