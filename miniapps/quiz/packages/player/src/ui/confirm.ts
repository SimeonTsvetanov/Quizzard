// The player's own "are you sure": a small modal `<dialog>` inside the player's root (so it shows in
// full screen and in the exported page, where there is no app around it). Cancel comes first and
// has the focus; Escape and a click outside are Cancel; one red button does what the title says.
import { h } from "../render/h.ts";

/** Inputs of {@link confirmDialog}. */
export interface ConfirmOptions {
  readonly root: HTMLElement;
  /** The question with the action in it: "Remove Team 2?". */
  readonly title: string;
  /** What will be lost, in numbers. */
  readonly text: string;
  /** The verb again: "Remove". */
  readonly confirm: string;
  readonly cancel: string;
}

/**
 * Asks before something is lost.
 * @param options - where, the words and the two buttons
 * @returns `true` only when the red button was pressed
 */
export function confirmDialog({ root, title, text, confirm, cancel }: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    let isConfirmed = false;
    const opener = document.activeElement;
    const no = h("button", { type: "button", class: "qp-confirm-button", "data-confirm": "cancel" }, cancel);
    const yes = h("button", { type: "button", class: "qp-confirm-button", "data-confirm": "ok", "data-danger": "" }, confirm);
    const dialog = h("dialog", { class: "qp-dialog qp-confirm", role: "alertdialog", "aria-labelledby": "qp-confirm-title", "aria-describedby": "qp-confirm-text", "data-dialog": "confirm" },
      h("h2", { class: "qp-dialog-title", id: "qp-confirm-title" }, title),
      h("p", { class: "qp-confirm-text", id: "qp-confirm-text" }, text),
      h("div", { class: "qp-confirm-actions" }, no, yes));
    no.addEventListener("click", () => { dialog.close(); });
    yes.addEventListener("click", () => {
      isConfirmed = true;
      dialog.close();
    });
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener("close", () => {
      dialog.remove();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
      resolve(isConfirmed);
    });
    root.append(dialog);
    dialog.showModal();
    no.focus();
  });
}
