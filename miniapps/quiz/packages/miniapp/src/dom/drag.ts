// Drag to reorder (lazy: loaded when a list with handles is first shown, never with the creator's
// first screen). Pointer events only, so a finger, a pen and a mouse all work; no library. The item
// follows the pointer; when the pointer is over another item the dragged one takes that place in the
// list at once and the others slide (dom/flip.ts), in one column or in a grid. Letting go keeps the
// order and reports it; Escape or a cancelled touch puts the item back. Near the top or bottom of the
// window the page scrolls. The keyboard's way stays the "Move up" and "Move down" buttons.
import { recordPlaces, slideFrom } from "./flip.ts";

/** Inputs of {@link startDrag}. */
export interface DragOptions {
  /** The pointerdown on the handle. */
  readonly event: PointerEvent;
  /** The handle that was pressed (it keeps the pointer). */
  readonly handle: HTMLElement;
  /** The item being moved. */
  readonly item: HTMLElement;
  /** The list: its element children are the items. */
  readonly list: HTMLElement;
  /** The attribute that carries an item's id (for the slide of the others). */
  readonly attribute: string;
  /** Called once with the item's old and new index when it was dropped somewhere else. */
  readonly onDrop: (from: number, to: number) => void;
}

/** From this many px to the window's edge the page scrolls while dragging. */
const EDGE_PX = 72;
/** The page scrolls by this many px per frame at the very edge. */
const SCROLL_STEP_PX = 14;

function indexOf(list: HTMLElement, item: Element): number {
  return [...list.children].indexOf(item);
}

/** The item under a point, other than the dragged one. */
function itemAt(list: HTMLElement, dragged: HTMLElement, x: number, y: number): HTMLElement | undefined {
  return [...list.children].find((child): child is HTMLElement => {
    // A card that is still sliding to its new place is not a target: its box is where it was a moment
    // ago, and taking it would swap the two back and forth under a fast pointer.
    if (child === dragged || !(child instanceof HTMLElement) || child.getAnimations().length > 0) return false;
    const box = child.getBoundingClientRect();
    return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
  });
}

/**
 * Gives the dragged item the place of another by moving the OTHERS around it: the dragged element
 * itself never leaves the page, so it keeps the pointer it has captured (an element that is taken
 * out and put back loses it, and the drag would end at the first swap).
 */
function takePlaceOf(list: HTMLElement, item: HTMLElement, over: HTMLElement): void {
  const items = [...list.children];
  const from = items.indexOf(item);
  const to = items.indexOf(over);
  if (to > from) {
    for (const other of items.slice(from + 1, to + 1)) list.insertBefore(other, item);
    return;
  }
  const after = item.nextSibling;
  for (const other of items.slice(to, from)) list.insertBefore(other, after);
}

/** How far the page scrolls in one frame for a pointer at this height: more the nearer the edge, nothing in between. */
function edgeSpeed(y: number): number {
  const fromBottom = window.innerHeight - y;
  if (y < EDGE_PX) return -SCROLL_STEP_PX * (1 - Math.max(0, y) / EDGE_PX);
  return fromBottom < EDGE_PX ? SCROLL_STEP_PX * (1 - Math.max(0, fromBottom) / EDGE_PX) : 0;
}

/** Scrolls the page while the pointer rests near the top or bottom edge; returns how to stop. */
function edgeScroll(pointer: { y: number }, onScroll: () => void): () => void {
  let frame = 0;
  const tick = (): void => {
    const by = edgeSpeed(pointer.y);
    if (Math.abs(by) >= 1) {
      window.scrollBy(0, by);
      onScroll();
    }
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(frame); };
}

/**
 * Starts dragging an item of a list by its handle.
 * @param options - the press, the handle, the item, its list and what to do on a drop
 */
export function startDrag({ event, handle, item, list, attribute, onDrop }: DragOptions): void {
  const from = indexOf(list, item);
  const origin = item.nextElementSibling;
  const pointer = { x: event.clientX, y: event.clientY };
  // Where inside the item the pointer holds it: the item is kept there whatever the list does.
  const start = item.getBoundingClientRect();
  const grip = { x: pointer.x - start.left, y: pointer.y - start.top };
  const controller = new AbortController();
  const { signal } = controller;
  const follow = (): void => {
    item.style.transform = "";
    const home = item.getBoundingClientRect();
    item.style.transform = `translate(${String(pointer.x - grip.x - home.left)}px, ${String(pointer.y - grip.y - home.top)}px)`;
  };
  const reorder = (): void => {
    const over = itemAt(list, item, pointer.x, pointer.y);
    if (!over) return;
    // The others slide to their new places; the dragged one follows the pointer.
    const before = new Map(recordPlaces(list, attribute));
    before.delete(item.getAttribute(attribute) ?? "");
    takePlaceOf(list, item, over);
    slideFrom(list, attribute, before);
    follow();
  };
  const stopScroll = edgeScroll(pointer, () => { reorder(); follow(); });
  const finish = (isKept: boolean): void => {
    controller.abort();
    stopScroll();
    item.style.transform = "";
    item.removeAttribute("data-dragging");
    list.removeAttribute("data-sorting");
    if (!isKept) {
      list.insertBefore(item, origin);
      return;
    }
    const to = indexOf(list, item);
    if (to !== from) onDrop(from, to);
  };
  handle.setPointerCapture(event.pointerId);
  item.setAttribute("data-dragging", "");
  list.setAttribute("data-sorting", "");
  handle.addEventListener("pointermove", (move) => {
    pointer.x = move.clientX;
    pointer.y = move.clientY;
    reorder();
    follow();
  }, { signal });
  handle.addEventListener("pointerup", () => { finish(true); }, { signal });
  handle.addEventListener("pointercancel", () => { finish(false); }, { signal });
  handle.addEventListener("lostpointercapture", () => { finish(true); }, { signal });
  window.addEventListener("keydown", (key) => {
    if (key.key !== "Escape") return;
    key.preventDefault();
    finish(false);
  }, { signal, capture: true });
}
