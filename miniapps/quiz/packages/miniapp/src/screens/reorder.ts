// Reordering the cards of a list — rounds and questions alike: the handle on a card starts a drag
// (dom/drag.ts, loaded while the list is on show so the first press already finds it) and its arrow
// keys move the card one place, like the "Move up" and "Move down" buttons next to it.
import type { DragOptions } from "../dom/drag.ts";

/** What a sortable list needs. */
export interface SortOptions {
  /** The list: its element children are the cards. */
  readonly list: HTMLElement;
  /** The attribute that carries a card's id, e.g. `data-question`. */
  readonly attribute: string;
  /** Moves the card with this id to an index (after a drop, or one place by an arrow key). */
  readonly onMove: (id: string, to: number) => void;
}

/** The arrow keys on a handle: one place towards the start or the end. */
const ARROWS: Readonly<Record<string, number>> = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 };

let dragModule: Promise<{ startDrag(options: DragOptions): void }> | null = null;

/** Loads the drag code once; the first list with handles asks for it as soon as it is drawn. */
function loadDrag(): Promise<{ startDrag(options: DragOptions): void }> {
  dragModule ??= import("../dom/drag.ts");
  return dragModule;
}

/**
 * Makes the cards of a list sortable by their `[data-drag]` handles.
 * @param options - the list, the id attribute and how a move is made
 */
export function makeSortable({ list, attribute, onMove }: SortOptions): void {
  void loadDrag().catch(() => undefined); // offline before it was ever cached: the buttons still move cards
  const cardOf = (target: EventTarget | null): { handle: HTMLElement; item: HTMLElement; id: string } | undefined => {
    const handle = target instanceof Element ? target.closest<HTMLElement>("[data-drag]") : null;
    const item = handle?.closest<HTMLElement>(`[${attribute}]`);
    const id = item?.getAttribute(attribute);
    return handle && item && id != null && item.parentElement === list ? { handle, item, id } : undefined;
  };
  list.addEventListener("pointerdown", (event) => {
    const card = cardOf(event.target);
    if (!card || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault(); // no text selection, no scroll: the handle is for dragging
    let isDown = true;
    card.handle.addEventListener("pointerup", () => { isDown = false; }, { once: true });
    void loadDrag().then((drag) => {
      if (!isDown || !card.item.isConnected) return;
      drag.startDrag({ event, handle: card.handle, item: card.item, list, attribute, onDrop: (_from, to) => { onMove(card.id, to); } });
    }).catch(() => undefined);
  });
  list.addEventListener("keydown", (event) => {
    const card = cardOf(event.target);
    const by = ARROWS[event.key];
    if (!card || by === undefined) return;
    event.preventDefault();
    const to = [...list.children].indexOf(card.item) + by;
    if (to >= 0 && to < list.children.length) onMove(card.id, to);
  });
}
