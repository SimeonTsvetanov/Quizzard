// The quiz library on this device: list, get, put, delete, duplicate over the `quizzes` store. A
// quiz is written as its `QuizFile` (core `toFile`) and read only through core `open()`, so every
// stored quiz carries its version and an older one is migrated on the way in (PLAN §2 rule 4).
import {
  type Env, type MediaEntry, type OpenFailure, type Quiz, type QuizFile, defaultEnv, duplicateQuiz, open, toFile, totals, touch, usedMediaBytes,
} from "@simeonts/quizzard-quiz-core";
import { MEDIA, QUIZZES, finished, openDb, promised } from "./db.ts";
import { type MediaRecord, blobOf, createFileWriter, isMediaRecord } from "./media-records.ts";

/** One line of the library: what a quiz card shows, without opening the quiz. */
export interface QuizSummary {
  readonly id: string;
  readonly name: string;
  readonly rounds: number;
  readonly questions: number;
  /** Play time of the questions' timers, in seconds. */
  readonly seconds: number;
  /** ISO 8601 time of the last change. */
  readonly updatedAt: string;
  /** Size on this device: the quiz data plus the media files its questions use. */
  readonly bytes: number;
  /** Set when this version cannot open the quiz (made by a newer Quizzard, or damaged); it is kept, never dropped. */
  readonly problem?: OpenFailure;
}

/** A quiz with the descriptions of its media files, as the editor holds it. */
export interface StoredQuiz {
  readonly quiz: Quiz;
  readonly media: readonly MediaEntry[];
}

/** The bytes of a quiz's media files, by the id of their `MediaEntry`. */
export type MediaFiles = ReadonlyMap<string, Blob>;

/** The result of {@link QuizStore.get}. */
export type LoadResult = ({ readonly ok: true } & StoredQuiz) | { readonly ok: false; readonly reason: OpenFailure | "missing" };

/** The library's API; every call opens the database on first use. */
export interface QuizStore {
  /** Every quiz, last changed first. */
  list(): Promise<readonly QuizSummary[]>;
  get(id: string): Promise<LoadResult>;
  /** Writes the quiz with the time of this change (`touch`); returns the quiz as stored. */
  put(quiz: Quiz, media?: readonly MediaEntry[]): Promise<Quiz>;
  /** Writes a quiz back exactly as it was (Undo of a delete): no new time. */
  restore(stored: StoredQuiz): Promise<void>;
  /** Deletes the quiz and its media files. */
  delete(id: string): Promise<void>;
  /** The media files of a quiz. Reading them loads nothing where the browser stores Blobs: a Blob is a handle. */
  media(quizId: string): Promise<MediaFiles>;
  /** Stores one media file of a quiz (a file of the same id is replaced). */
  putMedia(quizId: string, id: string, blob: Blob): Promise<void>;
  /** Deletes media files of a quiz — only ever the ones no question uses (core `unusedMedia`). */
  deleteMedia(quizId: string, ids: readonly string[]): Promise<void>;
  /**
   * Writes a quiz exactly as given together with its media files, in one step: the files it had
   * before are replaced, so writing the same quiz twice never leaves two copies of a file (AC7).
   * Used for a quiz file that was opened and for Undo of a delete.
   */
  bring(stored: StoredQuiz, files: MediaFiles): Promise<void>;
  /** Copies a quiz (new ids, its media files copied) under a new name; `undefined` when it cannot be read. */
  duplicate(id: string, name: string): Promise<Quiz | undefined>;
  /** Closes the database once pending writes are done; a later call opens it again. */
  close(): void;
}

/** What the store needs from outside; tests pass a fake database, a fixed clock and counted ids. */
export interface StoreOptions {
  readonly factory?: IDBFactory;
  /** The browser's `IDBKeyRange` (it belongs to the same implementation as `factory`). */
  readonly keyRange?: typeof IDBKeyRange;
  readonly now?: () => string;
  readonly env?: Env;
}

/** Bytes of a value as JSON text (UTF-8). */
function jsonBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

/** A text field of a record this version could not open, read without trusting its shape. */
function rawText(record: unknown, path: readonly string[]): string {
  let node: unknown = record;
  for (const part of path) {
    if (typeof node !== "object" || node === null) return "";
    node = Reflect.get(node, part);
  }
  return typeof node === "string" ? node : "";
}

/** The library line of one stored record. */
function summarize(key: string, record: unknown, env: Env): QuizSummary {
  const result = open(record, env.registries);
  const bytes = jsonBytes(record);
  if (!result.ok) {
    return { id: key, name: rawText(record, ["quiz", "name"]), rounds: 0, questions: 0, seconds: 0, updatedAt: rawText(record, ["quiz", "updatedAt"]), bytes, problem: result.reason };
  }
  const { quiz, media } = result.file;
  const size = totals(quiz);
  return { id: quiz.id, name: quiz.name, rounds: size.rounds, questions: size.questions, seconds: size.seconds, updatedAt: quiz.updatedAt, bytes: bytes + usedMediaBytes(quiz, media) };
}

/** Runs one transaction over the given stores and resolves with `work`'s result once it is written. */
async function transact<T>(database: IDBDatabase, mode: IDBTransactionMode, work: (transaction: IDBTransaction) => Promise<T>): Promise<T> {
  const transaction = database.transaction([QUIZZES, MEDIA], mode);
  const done = finished(transaction);
  const [result] = await Promise.all([work(transaction), done]);
  return result;
}

/** The one open connection of a store: opened on first use, let go when asked or when the browser needs it. */
interface Connection {
  database(): Promise<IDBDatabase>;
  close(): void;
}

function connect(factory: IDBFactory | undefined): Connection {
  let opening: Promise<IDBDatabase> | null = null;
  const forget = (): void => { opening = null; };
  return {
    database() {
      opening ??= openDb(factory).then((opened) => {
        // Another tab upgrades or the shell clears the area: let go at once, reopen on the next call.
        opened.addEventListener("versionchange", () => { opened.close(); forget(); });
        opened.addEventListener("close", forget);
        return opened;
      }, (error: unknown) => { forget(); throw error; });
      return opening;
    },
    close() {
      const pending = opening;
      forget();
      void pending?.then((opened) => { opened.close(); }, () => undefined);
    },
  };
}

/** Runs one transaction of a store. */
type Run = <T>(mode: IDBTransactionMode, work: (transaction: IDBTransaction) => Promise<T>) => Promise<T>;

/** The media half of the library: the files of a quiz, kept apart from its data. */
function mediaApi(run: Run, mediaOf: (quizId: string) => IDBKeyRange): Pick<QuizStore, "media" | "putMedia" | "deleteMedia" | "bring"> {
  // Blobs where the browser stores them, their bytes where it does not (media-records.ts).
  const writeFiles = createFileWriter();
  return {
    async media(quizId) {
      const records = await run("readonly", (transaction) => promised<unknown[]>(transaction.objectStore(MEDIA).getAll(mediaOf(quizId))));
      return new Map(records.filter(isMediaRecord).map((record) => [record.id, blobOf(record)]));
    },
    putMedia: (quizId, id, blob) => writeFiles([[id, blob]], (files) => run("readwrite", async (transaction) => {
      await Promise.all(files.map(([fileId, file]) => promised(transaction.objectStore(MEDIA).put({ quizId, id: fileId, ...file } satisfies MediaRecord))));
    })),
    deleteMedia: (quizId, ids) => run("readwrite", async (transaction) => {
      const files = transaction.objectStore(MEDIA);
      await Promise.all(ids.map((id) => promised(files.delete([quizId, id]))));
    }),
    bring: ({ quiz, media }, blobs) => writeFiles([...blobs], (packed) => run("readwrite", async (transaction) => {
      const files = transaction.objectStore(MEDIA);
      const quizId = quiz.id;
      // In the order they are asked: the old files go first, then the quiz and its files are written.
      const cleared = promised(files.delete(mediaOf(quizId)));
      const puts = packed.map(([id, file]) => promised(files.put({ quizId, id, ...file } satisfies MediaRecord)));
      await Promise.all([cleared, promised(transaction.objectStore(QUIZZES).put(toFile(quiz, media))), ...puts]);
    })),
  };
}

/**
 * Creates the library over the browser's IndexedDB.
 * @param options - the database factory, the clock and the id source (defaults: the browser's)
 */
export function createQuizStore(options: StoreOptions = {}): QuizStore {
  const env = options.env ?? defaultEnv;
  const now = options.now ?? ((): string => new Date().toISOString());
  const connection = connect(options.factory);
  /** The key range of one quiz's media files. */
  const mediaOf = (quizId: string): IDBKeyRange => (options.keyRange ?? IDBKeyRange).bound([quizId], [quizId, []]);
  const run: Run = async <T>(mode: IDBTransactionMode, work: (transaction: IDBTransaction) => Promise<T>): Promise<T> => transact(await connection.database(), mode, work);
  const write = (file: QuizFile): Promise<void> => run("readwrite", async (transaction) => { await promised(transaction.objectStore(QUIZZES).put(file)); });
  const read = async (id: string): Promise<LoadResult> => {
    const record: unknown = await run("readonly", (transaction) => promised<unknown>(transaction.objectStore(QUIZZES).get(id)));
    if (record === undefined) return { ok: false, reason: "missing" };
    const result = open(record, env.registries);
    return result.ok ? { ok: true, quiz: result.file.quiz, media: result.file.media } : { ok: false, reason: result.reason };
  };

  return {
    async list() {
      const [keys, records] = await run("readonly", (transaction) => {
        const store = transaction.objectStore(QUIZZES);
        return Promise.all([promised(store.getAllKeys()), promised<unknown[]>(store.getAll())]);
      });
      const lines = records.map((record, index) => {
        const key = keys[index];
        return summarize(typeof key === "string" ? key : "", record, env);
      });
      return lines.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    get: read,
    async put(quiz, media = []) {
      const stamped = touch(quiz, now());
      await write(toFile(stamped, media));
      return stamped;
    },
    restore: ({ quiz, media }) => write(toFile(quiz, media)),
    delete: (id) => run("readwrite", async (transaction) => {
      await Promise.all([promised(transaction.objectStore(QUIZZES).delete(id)), promised(transaction.objectStore(MEDIA).delete(mediaOf(id)))]);
    }),
    async duplicate(id, name) {
      const source = await read(id);
      if (!source.ok) return undefined;
      const copy = duplicateQuiz(source.quiz, { name, now: now() }, env);
      await run("readwrite", async (transaction) => {
        const files = transaction.objectStore(MEDIA);
        const blobs = await promised<unknown[]>(files.getAll(mediaOf(id)));
        const puts = blobs.map((blob) => promised(files.put({ ...(blob as object), quizId: copy.id })));
        await Promise.all([promised(transaction.objectStore(QUIZZES).put(toFile(copy, source.media))), ...puts]);
      });
      return copy;
    },
    ...mediaApi(run, mediaOf),
    close: () => { connection.close(); },
  };
}
