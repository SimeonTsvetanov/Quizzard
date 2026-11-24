// The quiz file (SPEC F10, AC7): one `.quizzard` file that carries a quiz and its media to another
// person or device. The format is written down in docs/quiz-creator/FORMAT.md; this module is its
// only writer and reader, and it is pure — bytes and numbers in, bytes and numbers out. The caller
// (the creator) joins the head with the media files as `Blob` parts and cuts the media back out
// with `Blob.slice`, so a 250 MB quiz is never read into memory and nothing is base64-ed.
//
//   0   8  magic "QUIZZARD" (ASCII)
//   8   1  container version (1)
//   9   3  reserved, zero
//  12   4  N = length of the header, unsigned 32-bit, big-endian
//  16   N  header: UTF-8 JSON { container, app, file: QuizFile, parts: [{ id, bytes }] }
//  16+N …  the media files' bytes, one after another, in the order of `parts`
import { checkMedia } from "./limits.ts";
import { type OpenFailure, open } from "./migrate.ts";
import type { MediaEntry, QuizFile } from "./model.ts";
import { type Registries, defaultRegistries } from "./registries.ts";

// The two platform APIs this module uses; declared here because the package is built without DOM types.
declare const TextEncoder: new () => { encode(text: string): Uint8Array };
declare const TextDecoder: new (label: string, options: { fatal: boolean }) => { decode(bytes: Uint8Array): string };

/** The first eight bytes of every quiz file. */
export const QUIZ_FILE_MAGIC = "QUIZZARD";
/** The version of the container (the bytes around the quiz), not of the quiz format inside it. */
export const QUIZ_FILE_CONTAINER = 1;
/** Bytes before the header: magic, version, reserved, header length. */
export const QUIZ_FILE_PREFIX_BYTES = 16;
/** The ending of a quiz file's name. */
export const QUIZ_FILE_EXTENSION = ".quizzard";
/** The MIME type a quiz file is saved with. */
export const QUIZ_FILE_MIME = "application/x-quizzard";
/** The longest header read (the quiz as JSON with its small stills); a longer one is not a quiz file. */
export const QUIZ_FILE_HEADER_MAX_BYTES = 64 * 1024 * 1024;

/** One media file inside a quiz file: whose bytes come next and how many. */
export interface QuizFilePart {
  readonly id: string;
  readonly bytes: number;
}

/** Where one media file lies inside a quiz file. */
export interface QuizFileSlice {
  readonly id: string;
  readonly mime: string;
  /** The first byte, counted from the start of the file. */
  readonly start: number;
  /** One past the last byte. */
  readonly end: number;
}

/**
 * Why a quiz file was not opened: the reasons of `open()`, a file that is cut off or changed
 * (`damaged`), or media that this version does not take (`media-format`, `media-too-big`,
 * `quiz-too-big` — SPEC §5).
 */
export type QuizFileFailure = OpenFailure | "damaged" | "media-format" | "media-too-big" | "quiz-too-big";

/** A refusal; `entry` names the media file that caused it, when one did. */
export interface QuizFileRefusal {
  readonly ok: false;
  readonly reason: QuizFileFailure;
  readonly entry?: MediaEntry;
}

/** The result of {@link readQuizFileHeader}. */
export type QuizFileRead = { readonly ok: true; readonly file: QuizFile; readonly slices: readonly QuizFileSlice[] } | QuizFileRefusal;

/**
 * The head of a quiz file: everything before the media bytes.
 * @param file - the quiz; its `media` must be exactly the files that follow
 * @param parts - the size of each file's bytes, in the order they are written
 * @throws {@link RangeError} when `parts` are not the files of `file.media`, one each
 */
export function encodeQuizFileHead(file: QuizFile, parts: readonly QuizFilePart[]): Uint8Array {
  const ids = new Set(parts.map((part) => part.id));
  if (ids.size !== parts.length || parts.length !== file.media.length || !file.media.every((entry) => ids.has(entry.id))) throw new RangeError("quiz file: the parts must be the quiz's media files, one each");
  const sized = { ...file, media: file.media.map((entry) => ({ ...entry, bytes: parts.find((part) => part.id === entry.id)?.bytes ?? entry.bytes })) };
  const header = new TextEncoder().encode(JSON.stringify({ container: QUIZ_FILE_CONTAINER, app: "Quizzard", file: sized, parts }));
  const head = new Uint8Array(QUIZ_FILE_PREFIX_BYTES + header.length);
  for (let index = 0; index < QUIZ_FILE_MAGIC.length; index += 1) head[index] = QUIZ_FILE_MAGIC.charCodeAt(index);
  head[8] = QUIZ_FILE_CONTAINER;
  new DataView(head.buffer).setUint32(12, header.length, false);
  head.set(header, QUIZ_FILE_PREFIX_BYTES);
  return head;
}

/**
 * Reads the first 16 bytes of a file.
 * @param prefix - at least the first 16 bytes
 * @returns the header's length, or why this is not a quiz file this version reads
 */
export function readQuizFilePrefix(prefix: Uint8Array): { readonly ok: true; readonly headerBytes: number } | QuizFileRefusal {
  if (prefix.length < QUIZ_FILE_PREFIX_BYTES) return { ok: false, reason: "not-a-quiz" };
  for (let index = 0; index < QUIZ_FILE_MAGIC.length; index += 1) {
    if (prefix[index] !== QUIZ_FILE_MAGIC.charCodeAt(index)) return { ok: false, reason: "not-a-quiz" };
  }
  const version = prefix[8] ?? 0;
  if (version > QUIZ_FILE_CONTAINER) return { ok: false, reason: "newer" };
  if (version < 1) return { ok: false, reason: "damaged" };
  const headerBytes = new DataView(prefix.buffer, prefix.byteOffset, prefix.byteLength).getUint32(12, false);
  if (headerBytes === 0 || headerBytes > QUIZ_FILE_HEADER_MAX_BYTES) return { ok: false, reason: "damaged" };
  return { ok: true, headerBytes };
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The parts list of a header, or `null` when it is not one. */
function readParts(value: unknown): readonly QuizFilePart[] | null {
  if (!Array.isArray(value)) return null;
  const parts: QuizFilePart[] = [];
  for (const part of value) {
    if (!isRecord(part)) return null;
    const { id, bytes } = part;
    if (typeof id !== "string" || id === "" || typeof bytes !== "number" || !Number.isSafeInteger(bytes) || bytes < 0) return null;
    parts.push({ id, bytes });
  }
  return new Set(parts.map((part) => part.id)).size === parts.length ? parts : null;
}

/** Checks every media file against SPEC §5 and places it in the file; the first that does not fit is the refusal. */
function place(file: QuizFile, parts: readonly QuizFilePart[], firstByte: number): readonly QuizFileSlice[] | QuizFileRefusal {
  const entries = new Map(file.media.map((entry) => [entry.id, entry]));
  const reasons = { format: "media-format", "too-big": "media-too-big", "quiz-full": "quiz-too-big" } as const;
  const slices: QuizFileSlice[] = [];
  let start = firstByte;
  for (const part of parts) {
    const entry = entries.get(part.id);
    if (!entry || entry.bytes !== part.bytes) return { ok: false, reason: "damaged" };
    const check = checkMedia({ type: entry.type, mime: entry.mime, bytes: part.bytes }, start - firstByte);
    if (!check.ok) return { ok: false, reason: reasons[check.reason], entry };
    slices.push({ id: part.id, mime: entry.mime.toLowerCase(), start, end: start + part.bytes });
    start += part.bytes;
  }
  return slices;
}

/**
 * Reads the header of a quiz file and says where each media file lies in it. The quiz inside goes
 * through `open()` like every stored quiz: a newer one is refused whole, an older one is migrated.
 * @param header - the header's bytes (the `N` bytes after the prefix)
 * @param totalBytes - the size of the whole file: a file that is cut off or has bytes left over is `damaged`
 * @param registries - the kinds and answer types this version knows
 */
export function readQuizFileHeader(header: Uint8Array, totalBytes: number, registries: Registries = defaultRegistries): QuizFileRead {
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(header));
  } catch {
    return { ok: false, reason: "damaged" };
  }
  if (!isRecord(parsed) || typeof parsed["container"] !== "number") return { ok: false, reason: "damaged" };
  if (parsed["container"] > QUIZ_FILE_CONTAINER) return { ok: false, reason: "newer" };
  const opened = open(parsed["file"], registries);
  if (!opened.ok) return { ok: false, reason: opened.reason === "not-a-quiz" ? "damaged" : opened.reason };
  const parts = readParts(parsed["parts"]);
  if (parts === null || parts.length !== opened.file.media.length) return { ok: false, reason: "damaged" };
  const firstByte = QUIZ_FILE_PREFIX_BYTES + header.length;
  if (firstByte + parts.reduce((sum, part) => sum + part.bytes, 0) !== totalBytes) return { ok: false, reason: "damaged" };
  const slices = place(opened.file, parts, firstByte);
  return "ok" in slices ? slices : { ok: true, file: opened.file, slices };
}

/**
 * Whether two copies of a quiz are the same, field for field — opening a quiz file whose quiz is
 * already in the library unchanged adds nothing (AC7).
 * @param a - one copy
 * @param b - the other
 */
export function isSameQuizFile(a: QuizFile, b: QuizFile): boolean {
  const byId = (media: readonly MediaEntry[]): readonly MediaEntry[] => [...media].sort((x, y) => x.id.localeCompare(y.id));
  return JSON.stringify(a.quiz) === JSON.stringify(b.quiz) && JSON.stringify(byId(a.media)) === JSON.stringify(byId(b.media));
}
