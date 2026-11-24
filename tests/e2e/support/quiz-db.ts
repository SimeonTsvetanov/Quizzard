import type { Page } from "@playwright/test";

// The creator's IndexedDB database as the e2e specs write and read it past the app. A media file is stored the way
// the app stores it (miniapps/quiz/…/storage/media-records.ts): as a Blob, or — where the browser cannot put a Blob
// into IndexedDB, as Playwright's WebKit cannot — as its bytes and type.

/** A media file to put beside a quiz. */
export interface SeedMedia {
  readonly quizId: string;
  readonly id: string;
  readonly mime: string;
  readonly base64: string;
}

/**
 * Writes quizzes and their media files into the library in one transaction (nothing is written when it fails).
 * @param page - a page of the app, the creator open (its database exists)
 * @param records - the quizzes, as quiz files
 * @param media - the files
 * @throws with the browser's own error when the write fails in both forms
 */
export async function putInLibrary(page: Page, records: readonly object[], media: readonly SeedMedia[] = []): Promise<void> {
  await page.evaluate(
    ({ quizzes, files }) => {
      const write = (asBytes: boolean): Promise<void> => new Promise((resolve, reject) => {
        const request = indexedDB.open("quizzard-quiz");
        request.onerror = () => { reject(new Error(`seed failed: the database did not open (${String(request.error)})`)); };
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction(["quizzes", "media"], "readwrite");
          const fail = (): void => { database.close(); reject(new Error(`seed failed (${asBytes ? "bytes" : "Blob"}): ${String(transaction.error)}`)); };
          transaction.oncomplete = () => { database.close(); resolve(); };
          transaction.onabort = fail;
          try {
            for (const record of quizzes) transaction.objectStore("quizzes").put(record);
            for (const file of files) {
              const bytes = Uint8Array.from(atob(file.base64), (character) => character.charCodeAt(0));
              const stored = asBytes ? { bytes: bytes.buffer, type: file.mime } : { blob: new Blob([bytes], { type: file.mime }) };
              transaction.objectStore("media").put({ quizId: file.quizId, id: file.id, ...stored });
            }
          } catch (error) {
            database.close();
            reject(new Error(`seed failed (${asBytes ? "bytes" : "Blob"}): ${String(error)}`));
          }
        };
      });
      return files.length === 0 ? write(false) : write(false).catch(() => write(true));
    },
    { quizzes: records as object[], files: media as SeedMedia[] },
  );
}

/**
 * The sizes of the stored media files in bytes, smallest first — whichever form they are stored in.
 * @param page - a page of the app, the creator open
 */
export function storedMediaSizes(page: Page): Promise<number[]> {
  return page.evaluate(() => new Promise<number[]>((resolve, reject) => {
    const request = indexedDB.open("quizzard-quiz");
    request.onerror = () => { reject(new Error(String(request.error))); };
    request.onsuccess = () => {
      const all = request.result.transaction("media").objectStore("media").getAll();
      all.onsuccess = () => {
        request.result.close();
        const sizes = (all.result as { blob?: Blob; bytes?: ArrayBuffer }[]).map((record) => record.blob?.size ?? record.bytes?.byteLength ?? -1);
        resolve(sizes.sort((a, b) => a - b));
      };
    };
  }));
}
