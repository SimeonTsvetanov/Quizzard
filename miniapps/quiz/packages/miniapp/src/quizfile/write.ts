// Writing a quiz file (SPEC F10; docs/quiz-creator/FORMAT.md; lazy): the head from the core, then
// the media files themselves as parts of one Blob — joined by the browser, never read into memory
// and never turned into text, so a quiz with 250 MB of media saves at once.
import { type MediaEntry, QUIZ_FILE_EXTENSION, QUIZ_FILE_MIME, type Quiz, encodeQuizFileHead, safeFileName, toFile, usedMedia } from "@simeonts/quizzard-quiz-core";

/**
 * Builds the quiz file of a quiz.
 * @param quiz - the quiz
 * @param media - the descriptions kept with it; only the files its questions use go in
 * @param blobOf - gives a media file's bytes
 * @param fallbackName - the file's name when nothing of the quiz's name can be one
 * @returns the file, named after the quiz, or `null` when one of its media files is not on this device
 */
export function buildQuizFile(quiz: Quiz, media: readonly MediaEntry[], blobOf: (id: string) => Blob | undefined, fallbackName: string): File | null {
  const used = usedMedia(quiz, media);
  const blobs: Blob[] = [];
  for (const entry of used) {
    const blob = blobOf(entry.id);
    if (!blob) return null;
    blobs.push(blob);
  }
  const head = encodeQuizFileHead(toFile(quiz, used), used.map((entry, index) => ({ id: entry.id, bytes: blobs[index]?.size ?? 0 })));
  return new File([new Uint8Array(head), ...blobs], safeFileName(quiz.name, fallbackName, QUIZ_FILE_EXTENSION), { type: QUIZ_FILE_MIME });
}
