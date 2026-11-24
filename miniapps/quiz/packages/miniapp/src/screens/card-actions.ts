// The row of actions every card has — a round's and a question's alike (UX review S3–S5): a handle
// to drag it, move up, move down, duplicate, delete, and "More" for the rest. One pattern, one
// order, the same marks; what a button does is the card's own business. The handle is a real
// button: a press and a pull drags the card (screens/reorder.ts), its arrow keys move it one place.
import type { App } from "../app/state.ts";
import type * as CardMenus from "./card-menu.ts";
import { iconButton } from "../dom/controls.ts";
import { h } from "../dom/h.ts";

/** The words of a card's actions, already translated for this card. */
export interface ActionLabels {
  readonly drag: string;
  readonly up: string;
  readonly down: string;
  readonly duplicate: string;
  readonly remove: string;
  readonly more: string;
}

/** Inputs of {@link actionRow}. */
export interface ActionRowOptions {
  readonly labels: ActionLabels;
  /** The card's place in its list and the last index there. */
  readonly index: number;
  readonly last: number;
  /** Moves the card to an index; `focus` names the button to focus afterwards. */
  readonly onMove: (to: number, focus: "up" | "down") => void;
  readonly onDuplicate: () => void;
  readonly onRemove: () => void;
  /** Opens the card's "More" list. */
  readonly onMore: () => void;
  /** Only the handle and "More" (a compact row: the rest is in the list "More" opens). */
  readonly isCompact?: boolean;
  /** A special round's question: kept in its round — no duplicate, no delete (SPEC §10). */
  readonly isFixed?: boolean;
  /** `false` = the card keeps its place: no handle, no up and down. */
  readonly canReorder?: boolean;
}

/**
 * Opens a card's "More" list: the list's code is loaded with the first press.
 * @param app - the mounted creator
 * @param build - asks the loaded module for the list
 */
export function openMore(app: App, build: (menus: typeof CardMenus) => void): void {
  void import("./card-menu.ts").then((menus) => { if (!app.signal.aborted) build(menus); }).catch(() => {
    if (!app.signal.aborted) app.context.shell.toast(app.t("menu.failed"), { tone: "error" });
  });
}

/**
 * Draws a card's action row.
 * @param options - the words, the card's place and what each button does
 */
export function actionRow(options: ActionRowOptions): HTMLElement {
  const { labels, index, last } = options;
  const drag = iconButton("grip", labels.drag, { class: "quiz-drag", "data-drag": "" });
  const more = iconButton("more", labels.more, { "data-more": "", "aria-haspopup": "dialog" });
  more.addEventListener("click", options.onMore);
  const canMove = options.canReorder !== false;
  if (options.isCompact === true) return h("div", { class: "quiz-card-row", "data-card-actions": "" }, ...(canMove ? [drag] : []), more);
  const up = iconButton("up", labels.up, { "data-move": "up" });
  const down = iconButton("down", labels.down, { "data-move": "down" });
  up.disabled = index === 0;
  down.disabled = index === last;
  // After a move the button under the finger may have become the disabled end: the focus goes to its twin.
  up.addEventListener("click", () => { options.onMove(index - 1, index - 1 === 0 ? "down" : "up"); });
  down.addEventListener("click", () => { options.onMove(index + 1, index + 1 === last ? "up" : "down"); });
  const copy = iconButton("copy", labels.duplicate, { "data-duplicate": "" });
  copy.addEventListener("click", options.onDuplicate);
  const trash = iconButton("trash", labels.remove, { class: "quiz-danger", "data-delete": "" });
  trash.addEventListener("click", options.onRemove);
  const moves = canMove ? [drag, up, down] : [];
  const edits = options.isFixed === true ? [] : [copy, trash];
  return h("div", { class: "quiz-card-row", "data-card-actions": "" }, ...moves, ...edits, more);
}
