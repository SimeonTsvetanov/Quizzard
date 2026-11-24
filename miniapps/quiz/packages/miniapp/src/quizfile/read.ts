// Reading a quiz file (SPEC F10; docs/quiz-creator/FORMAT.md; lazy): the first 16 bytes, then the
// header — the quiz itself, checked by the core like every stored quiz — and then each media file as
// a slice of the picked file. A slice is a handle: nothing of the media is read into memory here; the
// browser copies the bytes when they are stored.
import { type MediaEntry, QUIZ_FILE_PREFIX_BYTES, type QuizFileFailure, type Registries, readQuizFileHeader, readQuizFilePrefix } from "@simeonts/quizzard-quiz-core";
import type { MediaFiles, StoredQuiz } from "../storage/store.ts";

/** A quiz file that was read: the quiz, and its media files as slices of the file. */
export interface ReadQuizFile {
  readonly ok: true;
  readonly stored: StoredQuiz;
  readonly files: MediaFiles;
  /** The bytes of all its media files together. */
  readonly mediaBytes: number;
}

/** A quiz file that was refused, with the media file that caused it when one did. */
export interface RefusedQuizFile {
  readonly ok: false;
  readonly reason: QuizFileFailure;
  readonly entry?: MediaEntry;
}

/**
 * Reads a picked file as a quiz file.
 * @param file - the file
 * @param registries - the kinds and answer types this version knows
 */
export async function readQuizFile(file: Blob, registries: Registries): Promise<ReadQuizFile | RefusedQuizFile> {
  const prefix = readQuizFilePrefix(new Uint8Array(await file.slice(0, QUIZ_FILE_PREFIX_BYTES).arrayBuffer()));
  if (!prefix.ok) return prefix;
  const end = QUIZ_FILE_PREFIX_BYTES + prefix.headerBytes;
  if (end > file.size) return { ok: false, reason: "damaged" };
  const read = readQuizFileHeader(new Uint8Array(await file.slice(QUIZ_FILE_PREFIX_BYTES, end).arrayBuffer()), file.size, registries);
  if (!read.ok) return read;
  const files = new Map(read.slices.map((slice) => [slice.id, file.slice(slice.start, slice.end, slice.mime)]));
  return { ok: true, stored: { quiz: read.file.quiz, media: read.file.media }, files, mediaBytes: read.slices.reduce((sum, slice) => sum + slice.end - slice.start, 0) };
}
