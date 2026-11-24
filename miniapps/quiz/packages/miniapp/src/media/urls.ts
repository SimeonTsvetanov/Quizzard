// The addresses of the open quiz's media files: each stored file as an object URL an `<img>`,
// `<audio>` or `<video>` can load, made when the quiz is opened (a Blob from storage is a handle —
// nothing is read until it is shown) and let go when another quiz is opened or the creator closes.
import type { MediaFiles } from "../storage/store.ts";

/** The open quiz's files by id. */
export interface MediaUrls {
  /** The quiz whose files are held, or `null`. */
  readonly quizId: string | null;
  /** Holds the files of a quiz; those of the quiz held before are let go. */
  hold(quizId: string, files: MediaFiles): void;
  /** One more file of the quiz held (it was just added). */
  add(id: string, blob: Blob): void;
  /** The address of a file, or `null` when the quiz has no such file. */
  url(id: string): string | null;
  /** The file itself, for the export and the quiz file. */
  blob(id: string): Blob | undefined;
  /** Lets every address go. */
  release(): void;
}

/** Creates the holder of one mounted creator. */
export function createMediaUrls(): MediaUrls {
  const files = new Map<string, { readonly blob: Blob; readonly url: string }>();
  let held: string | null = null;
  const release = (): void => {
    for (const file of files.values()) URL.revokeObjectURL(file.url);
    files.clear();
    held = null;
  };
  const add = (id: string, blob: Blob): void => {
    const before = files.get(id);
    if (before) URL.revokeObjectURL(before.url);
    files.set(id, { blob, url: URL.createObjectURL(blob) });
  };
  return {
    get quizId() { return held; },
    hold(quizId, next) {
      release();
      held = quizId;
      for (const [id, blob] of next) add(id, blob);
    },
    add,
    url: (id) => files.get(id)?.url ?? null,
    blob: (id) => files.get(id)?.blob,
    release,
  };
}
