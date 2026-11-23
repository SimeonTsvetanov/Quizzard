/**
 * Smooth, app-like change of what is on screen (results appear, a step changes) with the View
 * Transitions API; instant where unsupported or when the user asks for reduced motion.
 * Page-to-page navigation (app ↔ policy pages) uses CSS `@view-transition` in app.css/page.css.
 */
export function withTransition(update: () => void): void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("startViewTransition" in document)) {
    update();
    return;
  }
  document.startViewTransition(update);
}

/** The one shared element of a screen change: a Home card and the tool it opens (styles/components/home.css). */
const MORPH_NAME = "tool-screen";
/** A tool not on screen by then (its code is still loading) no longer holds the animation back. */
const MOUNT_WAIT_MS = 350;
/** The transition's callback normally runs within a frame or two; after this long the screen changes without it. */
const CALLBACK_WAIT_MS = 400;
/** Far longer than the morph itself (about half a second): by then a transition still running is stuck. */
const STUCK_MS = 2500;

/** Options of {@link morphScreens}. */
export interface MorphOptions {
  /** What the new screen grows out of, on the old screen (a Home card, or the tool's own region). */
  readonly from: HTMLElement | null;
  /** Changes the screen; a returned promise (a tool mounting) is awaited briefly so it is part of the picture. */
  readonly update: () => Promise<void> | void;
  /** What the old screen turns into, on the new screen; read after `update`. */
  readonly to: () => HTMLElement | null;
}

/**
 * Changes the screen with a shared-element morph (View Transitions API): the Home card grows into the
 * tool and the tool shrinks back into its card. Instant where the API is missing, when the user asks
 * for reduced motion, and while the page is hidden.
 * @param options - the two elements and the change
 */
export function morphScreens({ from, update, to }: MorphOptions): void {
  const isAnimated = "startViewTransition" in document && !matchMedia("(prefers-reduced-motion: reduce)").matches && document.visibilityState === "visible";
  if (!isAnimated) {
    void update();
    return;
  }
  let target: HTMLElement | null = null;
  // The screen change never depends on the animation: if the browser does not call the transition's callback
  // (seen in WebKit with a dialog closing under it), the change is made anyway, once.
  let hasChanged = false;
  const change = (): Promise<void> | void => {
    if (hasChanged) return undefined;
    hasChanged = true;
    return update();
  };
  if (from) from.style.viewTransitionName = MORPH_NAME;
  const clear = (): void => {
    if (from) from.style.viewTransitionName = "";
    if (target) target.style.viewTransitionName = "";
    void change();
  };
  try {
    const transition = document.startViewTransition(async () => {
      // One element per name in each picture: the old one gives the name up before the new one takes it.
      if (from) from.style.viewTransitionName = "";
      await Promise.race([Promise.resolve(change()), new Promise((resolve) => { setTimeout(resolve, MOUNT_WAIT_MS); })]);
      target = to();
      if (target) target.style.viewTransitionName = MORPH_NAME;
    });
    // A skipped transition (a second one started, the tab was hidden) rejects `finished`: nothing to report.
    transition.finished.then(clear, clear);
    setTimeout(() => { if (!hasChanged) clear(); }, CALLBACK_WAIT_MS);
    // A transition holds the page's rendering while it runs: one that has not ended by now is cut short.
    setTimeout(() => { transition.skipTransition(); }, STUCK_MS);
  } catch {
    clear(); // the API refused to start (an unsupported state): change the screen without the animation
  }
}
