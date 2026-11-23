// Ids of quizzes, rounds, questions, options and media. Always passed in (an `IdSource`), so every
// edit stays a pure function of its arguments and tests get predictable ids.

// The one platform API the core uses; declared here because the package is built without DOM types.
declare const crypto: { randomUUID: () => string };

/** Gives a new unique id on every call; injected into the ops so tests can use predictable ids. */
export type IdSource = () => string;

/** The default id source: a random UUID (browsers, workers and Node all have `crypto.randomUUID`). */
export const randomId: IdSource = () => crypto.randomUUID();

/**
 * An id source that counts up (`q1`, `q2`, …) — for tests and fixtures, never for saved quizzes.
 * @param prefix - text before the number
 */
export function sequentialIds(prefix = "id"): IdSource {
  let count = 0;
  return () => {
    count += 1;
    return `${prefix}${String(count)}`;
  };
}
