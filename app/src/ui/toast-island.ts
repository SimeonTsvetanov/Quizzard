// Toasts over a mini-app's own modal (PLAN T-13, design → accessibility §5): a React mini-app's dialog
// (Radix in Scores) makes everything outside it inert to the pointer, to focus and to screen readers,
// as a native modal does — so while one is open the shell's toast region lives inside it, as it does
// inside the shell's own <dialog>s (toast.ts). The region sits in a shadow root ("island") at the start
// of that dialog: the mini-app's isolated CSS (its reset and its components, scoped to
// `[data-miniapp]` descendants) cannot reach into a shadow tree, and the shell's stylesheets are linked
// inside it, so the toast looks as it does anywhere else; tokens still inherit through the host.
import { h } from "./dom.ts";

/**
 * A dialog a mini-app renders itself (not a native `<dialog>`, which toast.ts finds with `:modal`), and
 * not one on its way out (Radix keeps `data-state="closed"` during the exit animation).
 */
const MINIAPP_MODAL = '[data-miniapp] :is([role="dialog"], [role="alertdialog"]):not(dialog, [data-state="closed"], [hidden])';

/** Marks the island's host element inside the mini-app's dialog. */
export const ISLAND_ATTRIBUTE = "data-shell-island";

/**
 * Returns the top dialog a mini-app has open: the last in document order (Radix portals each new
 * dialog after the others), or null when none is open.
 */
export function topMiniAppModal(): HTMLElement | null {
  const open = document.querySelectorAll<HTMLElement>(MINIAPP_MODAL);
  return open.item(open.length - 1);
}

/**
 * Returns the toast region inside `modal`, creating the island at the dialog's start the first time
 * (at the start, so the dialog's own buttons keep their order: the last stays its main action).
 * @param modal - from {@link topMiniAppModal}
 * @param createRegion - makes an empty region (toast.ts `createToastRegion`)
 */
export function islandRegion(modal: HTMLElement, createRegion: () => HTMLElement): HTMLElement {
  const host = modal.querySelector<HTMLElement>(`:scope > [${ISLAND_ATTRIBUTE}]`);
  const existing = host?.shadowRoot?.querySelector<HTMLElement>("[data-toasts]");
  if (existing) return existing;
  const island = h("div", { [ISLAND_ATTRIBUTE]: "" });
  const region = createRegion();
  region.classList.add("toast-region--inline");
  // delegatesFocus: focusing the host focuses the toast's button, so the host can be a tab stop.
  island.attachShadow({ mode: "open", delegatesFocus: true }).append(...shellStyles(), region);
  modal.prepend(island);
  return region;
}

/**
 * Makes an island a tab stop while its toast has a button, and none otherwise. The dialog's own focus
 * trap (Radix) lists its tab stops without looking into shadow roots, so the host itself must be one:
 * the trap then cycles through it and the browser hands focus to the button inside.
 * @param region - a region from {@link islandRegion}; any other region is left alone
 */
export function syncIslandFocus(region: HTMLElement): void {
  const root = region.getRootNode();
  if (!(root instanceof ShadowRoot) || !root.host.hasAttribute(ISLAND_ATTRIBUTE)) return;
  if (region.querySelector("button") === null) root.host.removeAttribute("tabindex");
  else root.host.setAttribute("tabindex", "0");
}

/**
 * Copies of the page's stylesheets for a shadow root: `<link>`s (production, allowed by `style-src
 * 'self'`) and Vite's dev `<style>`s. Mini-app stylesheets come along but match nothing there: every
 * rule of theirs needs a `[data-miniapp]` ancestor inside the same tree.
 */
function shellStyles(): Node[] {
  return [...document.querySelectorAll('head link[rel="stylesheet"], head style')].map((node) => node.cloneNode(true));
}

/**
 * Calls `onChange` whenever a mini-app's dialog may have opened or closed (nodes or `data-state`
 * change under the outlet).
 * @param outlet - the shell's outlet element (`[data-outlet]`)
 * @returns stops watching
 */
export function watchMiniAppModals(outlet: Element, onChange: () => void): () => void {
  const observer = new MutationObserver(() => { onChange(); });
  observer.observe(outlet, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-state", "hidden"] });
  return () => { observer.disconnect(); };
}
