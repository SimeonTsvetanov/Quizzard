// The player's dialogs (menu, scores): a native modal `<dialog>` inside the player's root, so it
// shows in full screen too, keeps the focus inside and closes with Escape.
import type { GameState } from "../game/state.ts";
import type { Translate } from "../i18n/translate.ts";
import { h } from "../render/h.ts";
import { icon } from "../render/icons.ts";

/** An open dialog. */
export interface Overlay {
  /** Which dialog it is, so its key closes it again. */
  readonly name: string;
  /** Brings its content up to date after a move. */
  readonly sync?: (state: GameState) => void;
  readonly close: () => void;
}

/** Inputs of {@link openDialog}. */
export interface DialogOptions {
  readonly root: HTMLElement;
  readonly name: string;
  readonly title: string;
  readonly t: Translate;
  readonly content: readonly HTMLElement[];
  readonly sync?: (state: GameState) => void;
  /** Called once the dialog is gone, however it was closed. */
  readonly onClose: () => void;
}

/**
 * Opens a modal dialog.
 * @param options - where, its title and content, and what to do when it closes
 */
export function openDialog({ root, name, title, t, content, sync, onClose }: DialogOptions): Overlay {
  const heading = h("h2", { class: "qp-dialog-title", id: `qp-dialog-${name}` }, title);
  const close = h("button", { type: "button", class: "qp-icon-button", "aria-label": t("control.close"), title: t("control.close"), "data-close-dialog": "" }, icon("x", 22));
  const dialog = h("dialog", { class: "qp-dialog", "aria-labelledby": heading.id, "data-dialog": name },
    h("div", { class: "qp-dialog-head" }, heading, close),
    h("div", { class: "qp-dialog-body" }, ...content));
  const opener = document.activeElement;
  // Once, at once — the dialog's own `close` event comes a moment later, and a key pressed in
  // between must already find the dialog gone.
  const finish = (): void => {
    if (!dialog.isConnected) return;
    dialog.close();
    dialog.remove();
    onClose();
    if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
  };
  close.addEventListener("click", finish);
  // A click on the dimmed page around the dialog closes it.
  dialog.addEventListener("click", (event) => { if (event.target === dialog) finish(); });
  dialog.addEventListener("cancel", finish); // Escape
  dialog.addEventListener("close", finish);
  root.append(dialog);
  dialog.showModal();
  return { name, close: finish, ...(sync ? { sync } : {}) };
}
