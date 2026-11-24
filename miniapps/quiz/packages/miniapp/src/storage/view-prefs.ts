// How the creator looks on this device — nothing of a quiz: whether a round's questions are shown as
// cards or as a compact list. Kept in the mini-app's own storage area through the host's
// preferences, so Settings → Your data counts and clears it with the quizzes.
import type { MiniAppContext } from "../contract.ts";

/** The host's preferences of this area. */
type Prefs = MiniAppContext["storage"]["prefs"];

/** How a round's questions are shown. */
export type ListMode = "cards" | "list";

/** Key of the list mode inside the mini-app's storage area. */
export const LIST_MODE_KEY = "view.questions";

/**
 * How this device shows a round's questions; cards unless the person chose the list.
 * @param prefs - the area's preferences
 */
export function readListMode(prefs: Prefs): ListMode {
  return prefs.get<unknown>(LIST_MODE_KEY, "cards") === "list" ? "list" : "cards";
}

/**
 * Remembers how this device shows a round's questions.
 * @param prefs - the area's preferences
 * @param mode - cards or the compact list
 */
export function writeListMode(prefs: Prefs, mode: ListMode): void {
  prefs.set(LIST_MODE_KEY, mode);
}
