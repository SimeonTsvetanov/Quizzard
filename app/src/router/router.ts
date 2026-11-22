// Hash router of the shell (PLAN §1.1 item 6): `#/` = Home, `#/<id>?…` = a mini-app, `#<name>` =
// a dialog link that never changes the screen, anything else → Home. Parsing is core's
// `parseRoute`; this module owns the history entries and tells main.ts which screen to show.
import { parseRoute, routeHref, type HomeRoute, type MiniAppRoute } from "@simeonts/quizzard-core";
import {
  HOME_HASH,
  hasHomeBelow,
  isMarked,
  markCurrent,
  pushScreen,
  rememberScreen,
  replaceScreen,
  seedHomeBelow,
} from "./history.ts";

/** A route that is a screen of its own (dialog links are not). */
export type ScreenRoute = HomeRoute | MiniAppRoute;

/** How the app moves between screens; also what a mini-app gets as `context.navigation`. */
export interface Navigation {
  /** Goes Home: `history.back()` when the entry below is our Home, otherwise replaces this entry. */
  home(): void;
  /** Opens a mini-app on a new history entry; an unknown id goes Home. */
  open(id: string, query?: URLSearchParams): void;
}

/** Inputs of {@link createRouter}. */
export interface RouterOptions {
  /** Ids of the mini-apps that can be opened; every other `#/<id>` goes Home. */
  readonly ids: readonly string[];
  /** Shows a screen; `isFirst` is true for the screen of the page load (no focus move then). */
  readonly onScreen: (route: ScreenRoute, isFirst: boolean) => void;
}

/** The router: `start()` once, after everything `onScreen` needs exists. */
export interface Router {
  readonly navigation: Navigation;
  start(): void;
}

const HOME: HomeRoute = { kind: "home" };

/** The router's own state; one object, passed to the steps below. */
interface RouterState extends RouterOptions {
  current: ScreenRoute | null;
  /** Set between `history.back()` and its hashchange: a second Back tap must not leave the app. */
  isGoingBack: boolean;
}

/**
 * Creates the hash router.
 * @returns the router; nothing happens until `start()`
 */
export function createRouter(options: RouterOptions): Router {
  const state: RouterState = { ...options, current: null, isGoingBack: false };
  return {
    navigation: createNavigation(state),
    start() {
      start(state);
    },
  };
}

function start(state: RouterState): void {
  const route = parseRoute(location.hash, state.ids);
  if (route.kind === "unknown") replaceScreen(HOME_HASH, false);
  if (route.kind === "miniapp") {
    // A reload keeps the mark: seeding again would add a second Home entry.
    if (!isMarked()) seedHomeBelow(routeHref(route));
    show(state, route);
  } else {
    show(state, HOME); // a dialog link (#help) on load opens over Home
  }
  window.addEventListener("hashchange", (event) => { onHashChange(state, event); });
  // Back/Forward between two entries of this document always fires popstate; a browser that then
  // fires no hashchange for entries written with pushState/replaceState (seen with Firefox in CI:
  // Back from a deep link left Home hidden) would leave the old screen up. Showing the screen the
  // address names is idempotent, so the hashchange that normally follows changes nothing.
  window.addEventListener("popstate", () => { onPopState(state); });
}

function createNavigation(state: RouterState): Navigation {
  const navigation: Navigation = {
    home() {
      if (state.current?.kind !== "miniapp" || state.isGoingBack) return;
      if (!hasHomeBelow()) {
        goHomeByReplace(state);
        return;
      }
      state.isGoingBack = true;
      history.back(); // the hashchange that follows shows Home
    },
    open(id, query = new URLSearchParams()) {
      if (!state.ids.includes(id)) {
        navigation.home();
        return;
      }
      const route: MiniAppRoute = { kind: "miniapp", id, query };
      if (state.current !== null && isSameScreen(state.current, route)) return;
      pushScreen(routeHref(route), state.current?.kind === "home");
      show(state, route);
    },
  };
  return navigation;
}

function onHashChange(state: RouterState, event: HashChangeEvent): void {
  state.isGoingBack = false;
  const route = parseRoute(location.hash, state.ids);
  switch (route.kind) {
    case "dialog":
      return; // main.ts opens the dialog over the current screen
    case "unknown":
      goHomeByReplace(state);
      return;
    case "home":
      show(state, route);
      return;
    case "miniapp":
      // A link or typed address added this entry: mark it the first time it is seen. Home is
      // below only when the address left was Home itself (not a dialog link over it).
      if (!isMarked()) markCurrent(parseRoute(new URL(event.oldURL).hash, state.ids).kind === "home");
      show(state, route);
      return;
    default:
      assertNever(route);
  }
}

/** Shows the screen the address names after a history traversal (see `start`). */
function onPopState(state: RouterState): void {
  const route = parseRoute(location.hash, state.ids);
  if (route.kind !== "home" && route.kind !== "miniapp") return; // dialogs and unknown: hashchange path
  if (state.current !== null && isSameScreen(state.current, route)) return;
  state.isGoingBack = false;
  show(state, route);
}

function goHomeByReplace(state: RouterState): void {
  replaceScreen(HOME_HASH, false);
  show(state, HOME);
}

function show(state: RouterState, route: ScreenRoute): void {
  if (state.current !== null && isSameScreen(state.current, route)) return;
  const isFirst = state.current === null;
  state.current = route;
  rememberScreen(route.kind === "home" ? "" : routeHref(route));
  state.onScreen(route, isFirst);
}

/** Same screen = same kind, and for a mini-app the same id and launch parameters. */
function isSameScreen(a: ScreenRoute, b: ScreenRoute): boolean {
  if (a.kind === "home" || b.kind === "home") return a.kind === b.kind;
  return a.id === b.id && a.query.toString() === b.query.toString();
}

function assertNever(value: never): never {
  throw new Error(`Unexpected route: ${JSON.stringify(value)}`);
}
