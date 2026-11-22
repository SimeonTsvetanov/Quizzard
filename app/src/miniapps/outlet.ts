// The mini-app outlet (PLAN §1.4): loads a registry entry's chunk, mounts it into a fresh
// `[data-miniapp="<id>"]` element and unmounts it on the next screen. One mini-app at a time;
// a failed load or mount shows the shell's error view, never a blank page.
import type { MiniAppEntry, MiniAppModule, Unmount } from "@simeonts/quizzard-core";
import { h } from "../ui/dom.ts";
import { errorButton, errorViewParts, toError } from "../ui/error-screen.ts";
import { t } from "../i18n/index.ts";
import { miniAppName } from "./registry.ts";
import type { MountedContext } from "./context.ts";

/** Inputs of {@link createOutlet}. */
export interface OutletOptions {
  /** The element the outlet owns; the shell guarantees no transform/filter/contain/clip ancestor. */
  readonly element: HTMLElement;
  /**
   * Builds the context of one mount; `isCurrent()` turns false once that mount is replaced. The
   * outlet releases it after the mount's unmount, or at once when the mount fails or is replaced.
   */
  readonly createContext: (entry: MiniAppEntry, query: URLSearchParams, isCurrent: () => boolean) => MountedContext;
  /** "Back to Home" of the error view. */
  readonly onHome: () => void;
}

/** The outlet: `show` replaces whatever is on screen, `clear` empties it. */
export interface Outlet {
  /** Unmounts the current mini-app and loads + mounts `entry`; resolves when it settles. */
  show(entry: MiniAppEntry, query: URLSearchParams): Promise<void>;
  /** Unmounts the current mini-app (if any) and removes every node of the outlet. */
  clear(): void;
}

/** Why a mini-app is not on screen; picks the error text. */
type Failure = "load" | "mount";

/**
 * Creates the outlet over `element`.
 * @remarks Fast A → B → A navigation ends with exactly one mounted instance: every `show` starts
 * a new generation, a load that resolves for an old generation is dropped and a mount that
 * resolves for one is unmounted at once.
 */
export function createOutlet({ element, createContext, onHome }: OutletOptions): Outlet {
  let generation = 0;
  let unmountCurrent: Unmount | null = null;
  // Set as soon as a context exists, so a mount still loading is released when the screen moves on.
  let releaseCurrent: (() => void) | null = null;

  const clear = (): void => {
    generation += 1;
    const unmount = unmountCurrent;
    const release = releaseCurrent;
    unmountCurrent = null;
    releaseCurrent = null;
    try {
      unmount?.();
    } finally {
      // because a throwing unmount is the mini-app's bug: the outlet is emptied and the context
      // released anyway, and the error still reaches the global error screen.
      release?.();
      element.replaceChildren();
      element.removeAttribute("aria-busy");
    }
  };

  const show = async (entry: MiniAppEntry, query: URLSearchParams): Promise<void> => {
    const hadFocus = element.contains(document.activeElement); // e.g. "Try again", which clear() removes
    clear();
    const run = generation;
    const isCurrent = (): boolean => run === generation;
    element.setAttribute("aria-busy", "true");
    element.replaceChildren(skeleton());
    if (hadFocus) element.focus({ preventScroll: true });
    const showError = (failure: Failure, error: Error): void => {
      if (!isCurrent()) return;
      element.removeAttribute("aria-busy");
      // A failed import() stays failed in the document's module map (Chromium keeps the error), so
      // retrying a load needs a fresh document; the route and its history mark survive a reload.
      const onRetry = failure === "load" ? () => { location.reload(); } : () => void show(entry, query);
      renderError({ element, entry, failure, error, onRetry, onHome });
    };
    let module: MiniAppModule | null;
    try {
      module = await loadModule(entry);
    } catch (error: unknown) {
      showError("load", toError(error));
      return;
    }
    // null: the page is reloading for a stale chunk — the skeleton stays, no error flashes before it.
    if (module === null || !isCurrent()) return;
    const mounted = createContext(entry, query, isCurrent);
    releaseCurrent = mounted.release;
    const host = mountElement(element, entry, mounted);
    try {
      const unmount = await module.mount(host, mounted.context);
      if (!isCurrent()) {
        unmount(); // the screen moved on while this mount was running; clear() released its context
        return;
      }
      unmountCurrent = unmount;
      element.removeAttribute("aria-busy");
    } catch (error: unknown) {
      mounted.release(); // idempotent: a replaced mount was already released by clear()
      showError("mount", toError(error));
    }
  };

  return { show, clear };
}

/**
 * Loads the entry's chunk and checks its shape at the boundary (a vendored mini-app may be stale).
 * @returns the module, or `null` when the chunk failed and app/src/pwa.ts is already reloading the
 * page for it (its `vite:preloadError` handler makes Vite resolve the import with `undefined`)
 * @throws {@link Error} when there is nothing to load or the chunk has no `mount` (load failure)
 */
async function loadModule(entry: MiniAppEntry): Promise<MiniAppModule | null> {
  if (entry.load === undefined) throw new Error(`Mini-app "${entry.meta.id}" has nothing to load`);
  const loaded: unknown = await entry.load();
  if (loaded === undefined) return null;
  const module: unknown = typeof loaded === "object" && loaded !== null ? Reflect.get(loaded, "default") : undefined;
  if (!isMiniAppModule(module)) throw new Error(`Mini-app "${entry.meta.id}" did not export a module with mount()`);
  return module;
}

function isMiniAppModule(value: unknown): value is MiniAppModule {
  return typeof value === "object" && value !== null && typeof Reflect.get(value, "mount") === "function";
}

/**
 * Puts a fresh `[data-miniapp="<id>"]` element into the outlet; its `lang` follows the context's
 * language (English when the mini-app lacks the UI language, SPEC F13).
 */
function mountElement(element: HTMLElement, entry: MiniAppEntry, { context }: MountedContext): HTMLElement {
  const host = h("div", { "data-miniapp": entry.meta.id });
  element.replaceChildren(host);
  host.lang = context.language.get();
  context.language.subscribe((lang) => { host.lang = lang; });
  return host;
}

/** Placeholder of the loading state: reserves the screen so nothing jumps (CSS shows it late). */
function skeleton(): HTMLElement {
  return h("div", { class: "outlet-skeleton", "aria-hidden": "true" },
    h("span", { class: "outlet-skeleton-title" }),
    h("span", { class: "outlet-skeleton-block" }),
    h("span", { class: "outlet-skeleton-block" }));
}

/** Inputs of {@link renderError}. */
interface ErrorRender {
  readonly element: HTMLElement;
  readonly entry: MiniAppEntry;
  readonly failure: Failure;
  readonly error: Error;
  readonly onRetry: () => void;
  readonly onHome: () => void;
}

/** Replaces the outlet's content with the error view; focus follows when it was in the outlet. */
function renderError({ element, entry, failure, error, onRetry, onHome }: ErrorRender): void {
  const name = miniAppName(entry);
  const { nodes, heading } = errorViewParts({
    error,
    title: t("shell.miniapp.errorTitle", { name }),
    text: failure === "load" ? t("shell.miniapp.loadText") : t("shell.miniapp.mountText", { name }),
    actions: [
      errorButton({ label: t("shell.miniapp.retry"), isPrimary: true, run: onRetry }),
      errorButton({ label: t("shell.miniapp.home"), isPrimary: false, run: onHome }),
    ],
    headingId: "outlet-error-title",
  });
  const view = h("section", { class: "es es--inline", "aria-labelledby": "outlet-error-title" });
  view.append(...nodes);
  const hadFocus = hasFocusWithin(element);
  element.replaceChildren(view);
  // The heading names the problem once; no live region, so nothing is announced twice.
  if (hadFocus) heading.focus();
}

/** Focus is in the outlet, or lost to `<body>` (accessibility §3: never leave it there). */
function hasFocusWithin(element: HTMLElement): boolean {
  return element.contains(document.activeElement) || document.activeElement === document.body;
}
