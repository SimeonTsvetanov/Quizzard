// How a media file lies in the `media` store. Normally as a Blob: the browser keeps it on disk and a read hands
// back a handle, so a 250 MB video is never in memory at once. Some browsers cannot put a Blob into IndexedDB —
// WebKit in a private window ("Error preparing Blob/File data to be stored in object store"; the browser of the
// e2e suite runs that way) — and there the same file is kept as its bytes with its type. Reading accepts both.

/** A file as the `media` store holds it: the Blob itself, or its bytes and type where a Blob cannot be stored. */
export type StoredFile =
  | { readonly blob: Blob }
  | { readonly bytes: ArrayBuffer; readonly type: string };

/** One record of the `media` store, keyed by `[quizId, id]`. */
export type MediaRecord = { readonly quizId: string; readonly id: string } & StoredFile;

/** Whether a stored value is a media record this version wrote, in either form. */
export function isMediaRecord(value: unknown): value is MediaRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as { quizId?: unknown; id?: unknown; blob?: unknown; bytes?: unknown; type?: unknown };
  if (typeof record.quizId !== "string" || typeof record.id !== "string") return false;
  return record.blob instanceof Blob || (record.bytes instanceof ArrayBuffer && typeof record.type === "string");
}

/** The file of a record as a Blob, whichever form it was stored in. */
export function blobOf(record: MediaRecord): Blob {
  return "blob" in record ? record.blob : new Blob([record.bytes], { type: record.type });
}

/** Files by id, in the form they are about to be written in. */
export type FilesToWrite = readonly (readonly [id: string, file: StoredFile])[];

/** Writes files in one transaction; rejects when the transaction failed. */
type Write<T> = (files: FilesToWrite) => Promise<T>;

/** Out of room: the same write with the bytes would fail the same way, after reading the whole file into memory. */
function isOutOfSpace(error: unknown): boolean {
  return error instanceof Error && error.name === "QuotaExceededError";
}

/**
 * Creates the writer of one store: it hands the files to `write` as Blobs, and when that write fails (nothing was
 * written: the transaction is all or nothing) once more as bytes. A browser that took the bytes after refusing the
 * Blobs gets bytes from then on, without the failed try.
 */
export function createFileWriter(): <T>(files: readonly (readonly [string, Blob])[], write: Write<T>) => Promise<T> {
  let needsBytes = false;
  return async (files, write) => {
    let refusal: unknown;
    if (!needsBytes || files.length === 0) {
      try {
        return await write(files.map(([id, blob]) => [id, { blob }] as const));
      } catch (error) {
        if (files.length === 0 || isOutOfSpace(error)) throw error;
        refusal = error;
      }
    }
    const asBytes = await Promise.all(files.map(async ([id, blob]) => [id, { bytes: await blob.arrayBuffer(), type: blob.type }] as const));
    try {
      const result = await write(asBytes);
      needsBytes = true;
      return result;
    } catch (error) {
      // Both forms failed: the first refusal is the one that says why (the second is its echo).
      throw refusal ?? error;
    }
  };
}
