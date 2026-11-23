// Browser history of the shell's screens (PLAN §1.1 item 6): marks each mini-app entry with
// whether our Home is the entry below it, seeds Home under a direct launch, and remembers the
// current screen's URL so a dialog link (#help) hands the address back when it closes.

/** Key of the shell's part of `history.state`; a mini-app passes it on untouched (see {@link SUB_KEY}). */
const STATE_KEY = "quizzardScreen";

/**
 * A mini-app with screens of its own (the quiz creator) adds history entries with the SAME address
 * as its first one, so Back walks its screens before it reaches Home. Each such entry carries
 * everything the entry below had (the mark above included) plus this key: how many of the tool's own
 * entries lie below it. The router reads it to go Home in one step ({@link stepsToHome}).
 */
const SUB_KEY = "quizzardSub";

/** The hash of the Home screen written by the router. */
export const HOME_HASH = "#/";

/** What the shell keeps in `history.state` for a screen entry. */
export interface ScreenState {
  /** The entry directly below this one is the shell's Home, so `history.back()` lands there. */
  readonly homeBelow: boolean;
}

/**
 * Reads the shell's screen mark from a `history.state` value (anything a page may have stored).
 * @param state - `history.state` as found
 * @returns the mark, or `null` when the entry was not written by the router
 */
export function readScreenState(state: unknown): ScreenState | null {
  if (typeof state !== "object" || state === null) return null;
  const value: unknown = Reflect.get(state, STATE_KEY);
  if (typeof value !== "object" || value === null) return null;
  const homeBelow: unknown = Reflect.get(value, "homeBelow");
  return typeof homeBelow === "boolean" ? { homeBelow } : null;
}

/**
 * Builds the `history.state` value for a screen entry.
 * @param homeBelow - whether the entry below is the shell's Home
 */
export function screenState(homeBelow: boolean): Record<string, ScreenState> {
  return { [STATE_KEY]: { homeBelow } };
}

/** Tells whether the current entry carries the router's mark (set on arrival or by a reload). */
export function isMarked(): boolean {
  return readScreenState(history.state) !== null;
}

/** Tells whether `history.back()` from the current entry lands on the shell's Home. */
export function hasHomeBelow(): boolean {
  return readScreenState(history.state)?.homeBelow === true;
}

/**
 * Reads how many of a mini-app's own entries lie below an entry (0 for its first one, or for a value
 * that is not a count).
 * @param state - `history.state` as found
 */
export function readSubEntries(state: unknown): number {
  const value: unknown = typeof state === "object" && state !== null ? Reflect.get(state, SUB_KEY) : undefined;
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : 0;
}

/**
 * Returns how many entries `history.go(-n)` must cross from the current one to land on the shell's
 * Home: the mini-app's own entries below this one, then its first entry.
 * @returns `null` when Home is not below (a deep link opened over something else)
 */
export function stepsToHome(): number | null {
  return hasHomeBelow() ? readSubEntries(history.state) + 1 : null;
}

/** Marks the current entry without changing its URL. */
export function markCurrent(homeBelow: boolean): void {
  history.replaceState(screenState(homeBelow), "", location.href);
}

/**
 * Direct launch on a mini-app (deep link, manifest shortcut): turns the launch entry into Home
 * and pushes the mini-app on top, so Back lands on Home and a second Back leaves the app.
 * @param hash - the mini-app's hash, e.g. `#/teams?teams=4`
 */
export function seedHomeBelow(hash: string): void {
  history.replaceState(screenState(false), "", HOME_HASH);
  history.pushState(screenState(true), "", hash);
}

/** Adds a history entry for a screen the shell opens itself (no `hashchange` follows). */
export function pushScreen(hash: string, homeBelow: boolean): void {
  history.pushState(screenState(homeBelow), "", hash);
}

/** Replaces the current entry with a screen, without a new history entry. */
export function replaceScreen(hash: string, homeBelow: boolean): void {
  history.replaceState(screenState(homeBelow), "", hash);
}

/** Hash of the screen on show; `""` = Home, whose dialogs close back to the bare address. */
let screenHash = "";

/**
 * Remembers the screen on show for {@link screenUrl}.
 * @param hash - the mini-app's hash, or `""` for Home
 */
export function rememberScreen(hash: string): void {
  screenHash = hash;
}

/**
 * Returns the URL of the screen on show; a dialog writes it back when it closes, so closing
 * Help inside a mini-app keeps the mini-app's address (Home keeps the template's bare address).
 */
export function screenUrl(): string {
  return `${location.pathname}${location.search}${screenHash}`;
}
