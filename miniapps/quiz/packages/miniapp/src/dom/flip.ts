// "First, last, invert, play" for a list that is drawn again after a move: every item slides from
// where it was to where it is now instead of jumping. Finite and composited (transform only); with
// reduced motion nothing moves. Items are matched by an attribute that carries their id.

/** Where each item of a list was, by its id. */
export type Places = ReadonlyMap<string, DOMRect>;

/** How long a moved item slides, in ms. */
const SLIDE_MS = 220;

/**
 * Remembers where the items of a list are, before the list is drawn again.
 * @param host - the element the list lives in
 * @param attribute - the attribute that carries an item's id, e.g. `data-question`
 */
export function recordPlaces(host: ParentNode, attribute: string): Places {
  const places = new Map<string, DOMRect>();
  for (const item of host.querySelectorAll<HTMLElement>(`[${attribute}]`)) places.set(item.getAttribute(attribute) ?? "", item.getBoundingClientRect());
  return places;
}

/**
 * Slides the items of a redrawn list from their old places to their new ones.
 * @param host - the element the list lives in
 * @param attribute - the attribute that carries an item's id
 * @param before - the places recorded before the redraw
 */
export function slideFrom(host: ParentNode, attribute: string, before: Places): void {
  if (before.size === 0 || !matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
  for (const item of host.querySelectorAll<HTMLElement>(`[${attribute}]`)) {
    const was = before.get(item.getAttribute(attribute) ?? "");
    if (!was) continue;
    const now = item.getBoundingClientRect();
    const dx = was.left - now.left;
    const dy = was.top - now.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
    item.animate([{ transform: `translate(${String(dx)}px, ${String(dy)}px)` }, { transform: "none" }], { duration: SLIDE_MS, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
  }
}
