// A short list of things to do with one card, or a list to pick from (lazy: loaded with the first
// "More" press): a modal `<dialog>` in the tool's element — a sheet from the bottom on a phone, a
// small card in the middle on a wide screen. Escape and a click outside close it; the focus returns
// to the button that opened it unless the choice moved it. Text goes in as text.
import "../styles/sheet.css";
import { h } from "./h.ts";
import { icon, type IconName } from "./icons.ts";

/** One line of a sheet. */
export interface SheetItem {
  readonly label: string;
  readonly icon?: IconName;
  /** A second, quieter line (a question's first words). */
  readonly detail?: string;
  /** The `data-*` hook of the line's button, e.g. `data-preview`. */
  readonly hook?: string;
  /** Shown, but cannot be chosen (the round the question is already in). */
  readonly isOff?: boolean;
  /** Marked as the current one of a list to pick from. */
  readonly isCurrent?: boolean;
  /** The line loses something: red words. */
  readonly isDanger?: boolean;
  /** Among the buttons under the list: the way on, drawn solid. */
  readonly isPrimary?: boolean;
  /** Does what the line says; `"stay"` keeps the sheet open (the line showed another list in it). */
  run(): "stay" | undefined;
}

/** Inputs of {@link openSheet}. */
export interface SheetOptions {
  /** The tool's element: the sheet lives in it. */
  readonly host: HTMLElement;
  readonly title: string;
  /** A line under the title: what the list is about. */
  readonly text?: string;
  readonly items: readonly SheetItem[];
  readonly closeLabel: string;
  /** Buttons under the list (a warning's "Play anyway"); the first is the safe one. */
  readonly actions?: readonly SheetItem[];
}

/** An open sheet. */
export interface Sheet {
  /** Replaces what the sheet shows (a second level: "Move to round…"). */
  show(next: Pick<SheetOptions, "title" | "text" | "items" | "actions">): void;
  close(): void;
}

function line(item: SheetItem, close: () => void): HTMLLIElement {
  const button = h("button", { type: "button", class: "quiz-sheet-item", ...(item.hook === undefined ? {} : { [item.hook]: "" }), ...(item.isCurrent === true ? { "aria-current": "true" } : {}), ...(item.isDanger === true ? { "data-danger": "" } : {}) });
  if (item.icon !== undefined) button.append(icon(item.icon, 20));
  const words = h("span", { class: "quiz-sheet-words" }, h("span", {}, item.label));
  if (item.detail !== undefined) words.append(h("span", { class: "quiz-sheet-detail" }, item.detail));
  button.append(words);
  if (item.isOff === true) button.setAttribute("aria-disabled", "true");
  button.addEventListener("click", () => {
    if (item.isOff === true) return;
    if (item.run() !== "stay") close();
  });
  return h("li", {}, button);
}

function action(item: SheetItem, close: () => void): HTMLButtonElement {
  const button = h("button", { type: "button", class: `button ${item.isPrimary === true ? "button--primary" : ""}`.trim(), ...(item.hook === undefined ? {} : { [item.hook]: "" }) }, item.label);
  button.addEventListener("click", () => { if (item.run() !== "stay") close(); });
  return button;
}

/**
 * Opens a sheet.
 * @param options - where, the title and the lines
 */
export function openSheet(options: SheetOptions): Sheet {
  const opener = document.activeElement;
  const heading = h("h2", { class: "quiz-sheet-title", id: "quiz-sheet-title", tabindex: "-1" });
  const text = h("p", { class: "quiz-sheet-text" });
  const list = h("ul", { class: "quiz-sheet-list" });
  const actions = h("div", { class: "quiz-sheet-actions" });
  const closeButton = h("button", { type: "button", class: "quiz-icon-button", "aria-label": options.closeLabel, title: options.closeLabel, "data-sheet-close": "" }, icon("x"));
  const dialog = h("dialog", { class: "quiz-sheet", "aria-labelledby": heading.id, "data-sheet": "" }, h("div", { class: "quiz-sheet-head" }, heading, closeButton), text, list, actions);
  const close = (): void => { dialog.close(); };
  const show: Sheet["show"] = (next) => {
    heading.textContent = next.title;
    text.textContent = next.text ?? "";
    text.hidden = next.text === undefined;
    list.replaceChildren(...next.items.map((item) => line(item, close)));
    list.hidden = next.items.length === 0;
    actions.replaceChildren(...(next.actions ?? []).map((item) => action(item, close)));
    actions.hidden = (next.actions ?? []).length === 0;
    (actions.querySelector<HTMLElement>("button") ?? list.querySelector<HTMLElement>("button:not([aria-disabled])") ?? heading).focus();
  };
  closeButton.addEventListener("click", close);
  dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });
  dialog.addEventListener("close", () => {
    dialog.remove();
    // A choice that drew the screen again has put the focus where it belongs; else it goes back to the opener.
    if (opener instanceof HTMLElement && opener.isConnected && (document.activeElement === document.body || document.activeElement === null)) opener.focus();
  });
  options.host.append(dialog);
  dialog.showModal();
  show(options);
  return { show, close };
}
