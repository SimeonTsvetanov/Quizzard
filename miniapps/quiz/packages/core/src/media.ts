// The media files of a quiz as data: which ones its questions still use (several questions may share
// one file — a duplicated question points at the same file), how much they weigh, and what one more
// file does to the list. Pure: the bytes themselves live in the creator's storage, which deletes a
// file only when `unusedMedia` names it.
import type { MediaEntry, MediaType, Question, Quiz } from "./model.ts";

/**
 * The ids of the files the quiz's questions point at.
 * @param quiz - the quiz
 */
export function usedMediaIds(quiz: Quiz): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const round of quiz.rounds) {
    for (const question of round.questions) if (question.media) ids.add(question.media.id);
  }
  return ids;
}

/**
 * The files at least one question uses — what the quiz weighs, exports and sends.
 * @param quiz - the quiz
 * @param media - the descriptions kept with it
 */
export function usedMedia(quiz: Quiz, media: readonly MediaEntry[]): readonly MediaEntry[] {
  const ids = usedMediaIds(quiz);
  return media.filter((entry) => ids.has(entry.id));
}

/**
 * The files no question uses any more — the only ones storage may delete.
 * @param quiz - the quiz
 * @param media - the descriptions kept with it
 */
export function unusedMedia(quiz: Quiz, media: readonly MediaEntry[]): readonly MediaEntry[] {
  const ids = usedMediaIds(quiz);
  return media.filter((entry) => !ids.has(entry.id));
}

/**
 * How many questions point at a file.
 * @param quiz - the quiz
 * @param mediaId - the file's id
 */
export function mediaUses(quiz: Quiz, mediaId: string): number {
  return quiz.rounds.reduce((sum, round) => sum + round.questions.filter((question) => question.media?.id === mediaId).length, 0);
}

/**
 * The bytes of a list of files.
 * @param media - their descriptions
 */
export function mediaBytes(media: readonly MediaEntry[]): number {
  return media.reduce((sum, entry) => sum + entry.bytes, 0);
}

/**
 * The bytes of the files the quiz uses — the number the limits of SPEC §5 are checked against.
 * @param quiz - the quiz
 * @param media - the descriptions kept with it
 */
export function usedMediaBytes(quiz: Quiz, media: readonly MediaEntry[]): number {
  return mediaBytes(usedMedia(quiz, media));
}

/**
 * The list with one more file; an entry of the same id is replaced.
 * @param media - the descriptions kept with the quiz
 * @param entry - the new file's description
 */
export function withMedia(media: readonly MediaEntry[], entry: MediaEntry): readonly MediaEntry[] {
  return [...media.filter((candidate) => candidate.id !== entry.id), entry];
}

/**
 * The description of a question's file, when it is there and of the wanted type.
 * @param question - the question
 * @param media - the descriptions kept with the quiz
 * @param type - the media type the caller can show; any when left out
 */
export function mediaOf(question: Question, media: readonly MediaEntry[], type?: MediaType): MediaEntry | undefined {
  const id = question.media?.id;
  const entry = id === undefined ? undefined : media.find((candidate) => candidate.id === id);
  return entry && (type === undefined || entry.type === type) ? entry : undefined;
}
