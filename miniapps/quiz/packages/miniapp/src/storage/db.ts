// The quiz creator's IndexedDB database (SPEC §3.5): the database of the area `quizzard-quiz:v1`,
// declared in meta.ts so the shell can measure and clear it. Only the modules of `storage/` touch
// browser storage. Two stores: `quizzes` holds each quiz as its versioned `QuizFile` (key: the quiz
// id inside it), `media` holds the files as Blobs apart from the quiz data, so the list opens fast.

/** The database name; `meta.storage.databases` names the same one. */
export const DB_NAME = "quizzard-quiz";
/** The database's schema version (the stores), not the quiz format's version. */
export const DB_VERSION = 1;
/** Store of the quizzes: one `QuizFile` per quiz, keyed by `quiz.id`. */
export const QUIZZES = "quizzes";
/**
 * Store of the media files: `{ quizId, id, blob }` — or `{ quizId, id, bytes, type }` where the browser cannot
 * store a Blob (media-records.ts) — keyed by `[quizId, id]`: a file belongs to one quiz.
 */
export const MEDIA = "media";

/**
 * Turns an IndexedDB request into a promise of its result.
 * @param request - a request that was just made
 */
export function promised<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => { resolve(request.result); });
    request.addEventListener("error", () => { reject(request.error ?? new Error("IndexedDB request failed")); });
  });
}

/**
 * Resolves when a transaction has written everything; rejects when it failed or was aborted.
 * @param transaction - a transaction with its requests already made
 */
export function finished(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener("complete", () => { resolve(); });
    transaction.addEventListener("error", () => { reject(transaction.error ?? new Error("IndexedDB transaction failed")); });
    transaction.addEventListener("abort", () => { reject(transaction.error ?? new Error("IndexedDB transaction aborted")); });
  });
}

/** Creates the stores of schema version 1. */
function upgrade(database: IDBDatabase): void {
  if (!database.objectStoreNames.contains(QUIZZES)) database.createObjectStore(QUIZZES, { keyPath: "quiz.id" });
  if (!database.objectStoreNames.contains(MEDIA)) database.createObjectStore(MEDIA, { keyPath: ["quizId", "id"] });
}

/**
 * Opens the database, creating its stores on the first visit.
 * @param factory - the browser's `indexedDB` (tests pass fake-indexeddb's)
 * @throws when the browser blocks storage (private mode) or the open fails
 */
export function openDb(factory: IDBFactory = indexedDB): Promise<IDBDatabase> {
  const request = factory.open(DB_NAME, DB_VERSION);
  request.addEventListener("upgradeneeded", () => { upgrade(request.result); });
  return promised(request);
}
