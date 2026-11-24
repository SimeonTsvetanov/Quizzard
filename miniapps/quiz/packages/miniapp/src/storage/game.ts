// The game of a quiz being played in the app (AC9: a reload continues): kept in the mini-app's own
// storage area, one small value per quiz, through the host's preferences (localStorage under
// `quizzard-quiz:v1:`) — so Settings → Your data counts it and clears it with the quizzes.
import type { GameStorage } from "@simeonts/quizzard-quiz-player";
import type { MiniAppContext } from "../contract.ts";

/** The host's preferences of this area. */
type Prefs = MiniAppContext["storage"]["prefs"];

/** What the host accepts in a preference key after our `game.` (letters, digits, inner `-`, `_`, `.`; the whole key at most 64). */
const KEY_SAFE_ID = /^[A-Za-z0-9](?:[A-Za-z0-9._-]{0,56}[A-Za-z0-9])?$/;

/** A short, stable stand-in for an id the host would not take in a key (FNV-1a, 32 bits, plus the length). */
function idHash(id: string): string {
  let hash = 0x811c9dc5;
  for (const character of id) hash = Math.imul(hash ^ (character.codePointAt(0) ?? 0), 0x01000193) >>> 0;
  return `h${hash.toString(16)}-${String(id.length)}`;
}

/**
 * The key of a quiz's game inside the area: the quiz's id (ids made here are UUIDs), or a hash of
 * it for an id the host's key rules would refuse (a quiz file from elsewhere).
 * @param quizId - the quiz
 */
export function gameKey(quizId: string): string {
  return `game.${KEY_SAFE_ID.test(quizId) ? quizId : idHash(quizId)}`;
}

/**
 * Where the player keeps the game of one quiz.
 * @param prefs - the area's preferences
 * @param quizId - the quiz
 */
export function gameStorage(prefs: Prefs, quizId: string): GameStorage {
  const key = gameKey(quizId);
  return {
    load: () => prefs.get<unknown>(key, null),
    save: (value) => { prefs.set(key, value); },
  };
}

/**
 * Takes the game of a quiz out of storage (the quiz is being deleted).
 * @param prefs - the area's preferences
 * @param quizId - the quiz
 * @returns how to put it back, for Undo
 */
export function takeGame(prefs: Prefs, quizId: string): { putBack(): void } {
  const key = gameKey(quizId);
  const saved = prefs.get<unknown>(key, null);
  prefs.remove(key);
  return { putBack: () => { if (saved !== null) prefs.set(key, saved); } };
}
