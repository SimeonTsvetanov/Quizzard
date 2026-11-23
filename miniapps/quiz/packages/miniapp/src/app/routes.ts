// The creator's screens and how they live in the browser history. The shell's route stays `#/quiz`
// for all of them: a sub-screen is a history entry with the SAME address whose `history.state`
// carries the screen (ROUTE_KEY) and how many of the creator's entries lie below it (SUB_KEY, read
// by the shell's router so its "Back to Home" leaves the tool in one step). The browser's and
// Android's Back button therefore walk editor → round → quiz → library → Home, a reload stays on
// the screen it was on, and the shell never remounts the tool for a move inside it (it would for a
// changed `?query`). The shell's own mark in `history.state` is passed on untouched.

/** One screen of the creator. Ids only: the data is read from storage when the screen is shown. */
export type Route =
  | { readonly screen: "library" }
  | { readonly screen: "quiz"; readonly quiz: string }
  | { readonly screen: "round"; readonly quiz: string; readonly round: string }
  | { readonly screen: "editor"; readonly quiz: string; readonly question: string }
  | { readonly screen: "preview"; readonly quiz: string; readonly question: string };

/** Where the creator keeps its screen in `history.state`. */
export const ROUTE_KEY = "quizzardQuiz";
/** How many of the tool's own history entries lie below this one (the shell's router reads it: app/src/router/history.ts). */
export const SUB_KEY = "quizzardSub";

/** The first screen. */
export const LIBRARY: Route = { screen: "library" };

function field(value: unknown, name: string): string | undefined {
  const found: unknown = typeof value === "object" && value !== null ? Reflect.get(value, name) : undefined;
  return typeof found === "string" && found !== "" ? found : undefined;
}

/**
 * Reads the screen from a `history.state` value; anything else (the tool's first entry, a state
 * some other code wrote) is the library.
 * @param state - `history.state` as found
 */
export function readRoute(state: unknown): Route {
  const saved: unknown = typeof state === "object" && state !== null ? Reflect.get(state, ROUTE_KEY) : undefined;
  const screen = field(saved, "screen");
  const quiz = field(saved, "quiz");
  const round = field(saved, "round");
  const question = field(saved, "question");
  if (quiz === undefined) return LIBRARY;
  if (screen === "quiz") return { screen, quiz };
  if (screen === "round" && round !== undefined) return { screen, quiz, round };
  if ((screen === "editor" || screen === "preview") && question !== undefined) return { screen, quiz, question };
  return LIBRARY;
}

/**
 * Reads how many of the tool's entries lie below the current one.
 * @param state - `history.state` as found
 */
export function readDepth(state: unknown): number {
  const depth: unknown = typeof state === "object" && state !== null ? Reflect.get(state, SUB_KEY) : undefined;
  return typeof depth === "number" && Number.isInteger(depth) && depth > 0 ? depth : 0;
}

/**
 * The `history.state` of a screen: whatever the entry held (the shell's mark) plus the screen and its depth.
 * @param current - `history.state` of the entry the move starts from
 * @param route - the screen
 * @param depth - how many of the tool's entries lie below it
 */
export function entryState(current: unknown, route: Route, depth: number): Record<string, unknown> {
  const kept = typeof current === "object" && current !== null ? current : {};
  return { ...kept, [ROUTE_KEY]: route, [SUB_KEY]: depth };
}

/** The screen's moves through the history. */
export interface Navigator {
  /** The screen of the current history entry. */
  route(): Route;
  /** How many of the tool's entries lie below the current one. */
  depth(): number;
  /** Opens a screen on a new history entry (Back returns here). */
  push(route: Route): void;
  /** Shows another screen in the current entry (Back skips the one replaced). */
  replace(route: Route): void;
  /** Back through the history — one entry (the browser's Back button) or several at once. */
  back(steps?: number): void;
}

/** What {@link createNavigator} needs from the browser; tests pass their own. */
export interface NavigatorOptions {
  /** The hash the shell gives the tool (`#/quiz`): a traversal to another address is the shell's business. */
  readonly hash: string;
  readonly signal: AbortSignal;
  /** Called after a Back/Forward that stays in the tool; not after `push` and `replace`. */
  readonly onTraverse: (route: Route) => void;
}

/**
 * Binds the creator's screens to the browser history.
 * @param options - the tool's hash, the mount's abort signal and the traversal listener
 */
export function createNavigator({ hash, signal, onTraverse }: NavigatorOptions): Navigator {
  window.addEventListener("popstate", () => {
    if (location.hash.split("?")[0] === hash) onTraverse(readRoute(history.state));
  }, { signal });
  return {
    route: () => readRoute(history.state),
    depth: () => readDepth(history.state),
    push(route) { history.pushState(entryState(history.state, route, readDepth(history.state) + 1), "", location.href); },
    replace(route) { history.replaceState(entryState(history.state, route, readDepth(history.state)), "", location.href); },
    back(steps = 1) { history.go(-steps); },
  };
}
