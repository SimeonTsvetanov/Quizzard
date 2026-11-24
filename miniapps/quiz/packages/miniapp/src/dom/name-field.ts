// A name that is edited in place (the quiz's, a round's): one line while it fits, growing to as many
// lines as the name needs — a long name is never hidden in a one-line box (UX review S7). It is a
// `<textarea>` that takes no line breaks: Enter leaves the field, a pasted line break becomes a space.
import { h } from "./h.ts";

/** Inputs of {@link nameField}. */
export interface NameFieldOptions {
  readonly value: string;
  /** Longest name, in characters. */
  readonly max: number;
  readonly label: string;
  readonly placeholder?: string;
  /** More attributes, e.g. `data-*` hooks. */
  readonly props?: Readonly<Record<string, string>>;
  onInput(value: string): void;
}

/**
 * Draws a name field that grows with its text.
 * @param options - the name, its limit, its label and the listener
 */
export function nameField(options: NameFieldOptions): HTMLTextAreaElement {
  const field = h("textarea", { class: "quiz-title-input", rows: "1", maxlength: String(options.max), autocomplete: "off", enterkeyhint: "done", "aria-label": options.label, ...(options.placeholder === undefined ? {} : { placeholder: options.placeholder }), ...options.props });
  field.value = options.value;
  const fit = (): void => {
    if (!field.isConnected) return;
    field.style.height = "auto";
    field.style.height = `${String(field.scrollHeight)}px`;
  };
  field.addEventListener("input", () => {
    if (/[\r\n]/.test(field.value)) field.value = field.value.replace(/\s*[\r\n]+\s*/g, " ");
    fit();
    options.onInput(field.value);
  });
  field.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    field.blur();
  });
  // Its height follows its width too (a turn of the phone, the pane next to it): measured once it is on the page.
  new ResizeObserver(fit).observe(field);
  return field;
}
