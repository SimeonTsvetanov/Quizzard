// After the "Adjust score" dialog closes the page goes back to its top (Moni 2026-11-25): a phone's
// keyboard pushes the page up for the dialog and leaves it scrolled down when it goes, so the host had
// to scroll back by hand to see the cards again.

/** How long the dialog and the phone's keyboard take to go, in ms: the page is moved after that. */
const AFTER_CLOSE_MS = 250;

/** Scrolls the page to its top once the dialog is gone; at once where motion is reduced. */
export function scrollPageToTop(): void {
  window.setTimeout(() => {
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: isReduced ? "auto" : "smooth" });
  }, AFTER_CLOSE_MS);
}
