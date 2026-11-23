// The last change when the page goes away. IndexedDB writes are asynchronous: one started while the
// page is being closed or reloaded may never land. So the change that is not stored yet is also put,
// synchronously, into the area's small preferences (localStorage, through the host), and written
// into the library at the next start. Quiz data only — never media files.
import { type MediaEntry, type Quiz, type Registries, open, toFile } from "@simeonts/quizzard-quiz-core";
import type { MiniAppContext } from "../contract.ts";
import type { QuizStore } from "./store.ts";

/** Key of the rescued quiz inside the mini-app's storage area. */
export const RESCUE_KEY = "unsaved";

/** The host's preferences of this area. */
type Prefs = MiniAppContext["storage"]["prefs"];

/**
 * Keeps the change that is not stored yet where a closing page cannot lose it; `null` removes it.
 * @param prefs - the area's preferences
 * @param unsaved - the quiz as it is now, or `null` once everything is stored
 */
export function keepUnsaved(prefs: Prefs, unsaved: { readonly quiz: Quiz; readonly media: readonly MediaEntry[] } | null): void {
  if (unsaved === null) prefs.remove(RESCUE_KEY);
  else prefs.set(RESCUE_KEY, toFile(unsaved.quiz, unsaved.media)); // too big for localStorage: the write in flight is the only hope
}

/**
 * Writes a rescued quiz into the library (read through core `open()` like every stored quiz) and
 * forgets it. Call once, before the first screen.
 * @param prefs - the area's preferences
 * @param store - the library
 * @param registries - the kinds and answer types this version knows
 */
export async function restoreUnsaved(prefs: Prefs, store: Pick<QuizStore, "restore">, registries: Registries): Promise<void> {
  const kept = prefs.get<unknown>(RESCUE_KEY, null);
  if (kept === null) return;
  const result = open(kept, registries);
  if (result.ok) await store.restore({ quiz: result.file.quiz, media: result.file.media });
  prefs.remove(RESCUE_KEY);
}
