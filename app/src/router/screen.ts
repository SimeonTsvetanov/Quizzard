// Shows one screen at a time (PLAN §1.1 item 6): the Home launcher or the mini-app outlet, the header
// Back button, the title and — after a route change — focus on the card that opened the mini-app,
// else the new screen's heading or region (accessibility §3). main.ts calls startScreens() once.
import type { MiniAppEntry } from "@simeonts/quizzard-core";
import { createHome, rememberLastUsed } from "../home/home.ts";
import { createMiniAppContext } from "../miniapps/context.ts";
import { createOutlet } from "../miniapps/outlet.ts";
import { launchQuery, miniAppName, openableIds } from "../miniapps/registry.ts";
import { setScreenTitle } from "../ui/title.ts";
import { createRouter, type ScreenRoute } from "./router.ts";

/** The static elements of app/index.html the screens use. */
interface ScreenElements {
  readonly homeView: HTMLElement;
  readonly homeHeading: HTMLElement;
  readonly launcher: HTMLElement;
  readonly outlet: HTMLElement;
  readonly back: HTMLButtonElement;
  readonly brand: HTMLAnchorElement;
  /** The header's button group; a mounted mini-app's header slot goes first in it. */
  readonly headerActions: HTMLElement;
}

/**
 * Starts routing: shows the screen of the current address and follows every later change.
 * @param entries - the registry (app/src/miniapps/registry.ts)
 * @throws {@link Error} when app/index.html lacks one of the screen elements (a build bug)
 */
export function startScreens(entries: readonly MiniAppEntry[]): void {
  const elements = findElements();
  const home = createHome(elements.launcher, entries);
  // The mini-app on show and its own title part (`context.shell.setTitle`); null = its name.
  let active: { readonly entry: MiniAppEntry; titlePart: string | null } | null = null;
  const showTitle = (): void => { setScreenTitle(active === null ? null : (active.titlePart ?? miniAppName(active.entry))); };

  const router = createRouter({ ids: openableIds(entries), onScreen: (route, isFirst) => { show(route, isFirst); } });
  const outlet = createOutlet({
    element: elements.outlet,
    onHome: () => { router.navigation.home(); },
    createContext: (entry, query, isCurrent) => createMiniAppContext({
      entry,
      query,
      navigation: router.navigation,
      headerActions: elements.headerActions,
      setTitle: (part) => {
        if (!isCurrent() || active === null) return; // a replaced mount no longer owns the title
        active.titlePart = part;
        showTitle();
      },
    }),
  });

  const show = (route: ScreenRoute, isFirst: boolean): void => {
    const entry = route.kind === "miniapp" ? entries.find((candidate) => candidate.meta.id === route.id) : undefined;
    active = entry === undefined ? null : { entry, titlePart: null };
    if (route.kind === "home" || entry === undefined) {
      outlet.clear();
      if (!isFirst) home.render(); // the last used mini-app may have changed while Home was hidden
    } else {
      rememberLastUsed(entry.meta.id);
      void outlet.show(entry, launchQuery(entry, route.query));
    }
    elements.homeView.hidden = active !== null;
    elements.outlet.hidden = active === null;
    elements.back.hidden = active === null;
    labelOutlet(elements.outlet, active?.entry);
    showTitle();
    if (isFirst) return; // a page load keeps the browser's focus start (skip link first)
    window.scrollTo({ top: 0 });
    const target = active === null ? (home.takeReturnFocus() ?? elements.homeHeading) : elements.outlet;
    target.focus({ preventScroll: true });
  };

  elements.back.addEventListener("click", () => { router.navigation.home(); });
  elements.brand.addEventListener("click", (event) => {
    if (active === null) return; // on Home the link reloads the start page, as before routing
    event.preventDefault();
    router.navigation.home();
  });
  document.addEventListener("i18n:change", () => {
    home.render();
    labelOutlet(elements.outlet, active?.entry);
    showTitle();
  });
  // Before the first screen, whatever it is: the footer and the Home text stay invisible until the
  // cards exist (home.css), so a deep link must not leave the list busy.
  home.render();
  router.start();
}

/** Names the outlet region after the mini-app (read when focus moves there). */
function labelOutlet(outlet: HTMLElement, entry: MiniAppEntry | undefined): void {
  if (entry === undefined) outlet.removeAttribute("aria-label");
  else outlet.setAttribute("aria-label", miniAppName(entry));
}

function findElements(): ScreenElements {
  return {
    homeView: required(HTMLElement, "[data-view=home]"),
    homeHeading: required(HTMLElement, "[data-home-heading]"),
    launcher: required(HTMLElement, "[data-launcher]"),
    outlet: required(HTMLElement, "[data-outlet]"),
    back: required(HTMLButtonElement, "[data-back]"),
    brand: required(HTMLAnchorElement, "[data-home-link]"),
    headerActions: required(HTMLElement, "[data-header-actions]"),
  };
}

function required<T extends Element>(type: abstract new () => T, selector: string): T {
  const element = document.querySelector(selector);
  if (!(element instanceof type)) throw new Error(`app/index.html has no ${selector}`);
  return element;
}
