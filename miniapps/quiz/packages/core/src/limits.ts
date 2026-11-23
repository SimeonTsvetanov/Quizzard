// Every number of the quiz creator in one place: the media limits of SPEC §5 and the model limits.
// The ops clamp to these; `open()` does NOT check them, so changing a number never locks out a quiz
// that was saved under the old one.
import type { MediaType } from "./model.ts";

const MB = 1024 * 1024;

/** Longest quiz name, in characters. */
export const QUIZ_NAME_MAX = 80;
/** Longest round name, in characters. */
export const ROUND_NAME_MAX = 60;
/** Longest rules text of a round, in characters. */
export const RULES_MAX = 600;
/** Longest question text, in characters. */
export const PROMPT_MAX = 500;
/** Longest open answer, in characters. */
export const ANSWER_TEXT_MAX = 300;
/** Longest text of one multiple-choice option, in characters. */
export const OPTION_TEXT_MAX = 120;
/** Longest explanation shown with the answer, in characters. */
export const EXPLANATION_MAX = 500;
/** Longest points note ("1 for the band, 2 with the song"), in characters. */
export const POINTS_NOTE_MAX = 80;

/** Most rounds in one quiz. */
export const MAX_ROUNDS = 20;
/** Most questions in one round. */
export const MAX_QUESTIONS_PER_ROUND = 50;
/** Fewest options of a multiple-choice answer (SPEC F4). */
export const MIN_OPTIONS = 2;
/** Most options of a multiple-choice answer (SPEC F4). */
export const MAX_OPTIONS = 8;

/** Fewest teams of a game (SPEC §6). */
export const MIN_TEAMS = 2;
/** Most teams of a game (SPEC §6). */
export const MAX_TEAMS = 12;
/** Teams of a new quiz (SPEC §6). */
export const DEFAULT_TEAMS = 4;

/** Shortest time for a question, in seconds. */
export const MIN_SECONDS = 5;
/** Longest time for a question, in seconds. */
export const MAX_SECONDS = 600;
/** Time per question of a new round, in seconds. */
export const DEFAULT_SECONDS = 30;
/** Largest points value of one question. */
export const MAX_POINTS = 100;
/** Points per question of a new round. */
export const DEFAULT_POINTS = 1;

/** Largest picture as picked, in bytes (SPEC §5: 15 MB). */
export const PICTURE_MAX_BYTES = 15 * MB;
/** Largest audio file, in bytes (SPEC §5: 15 MB). */
export const AUDIO_MAX_BYTES = 15 * MB;
/** Largest video file, in bytes (SPEC §5: 50 MB). */
export const VIDEO_MAX_BYTES = 50 * MB;
/** Most media in one quiz, in bytes (SPEC §5: 250 MB ≈ a 335 MB HTML file). */
export const QUIZ_MEDIA_MAX_BYTES = 250 * MB;
/** Media size above which the export warns that the file may not open on a phone (SPEC §8: 100 MB). */
export const EXPORT_WARN_BYTES = 100 * MB;
/** Long side large photos are scaled down to on import, in pixels (SPEC §5). */
export const PICTURE_MAX_EDGE_PX = 1920;

/** What one media type accepts: its formats (MIME types) and the largest file. */
export interface MediaRule {
  readonly mimes: readonly string[];
  readonly maxBytes: number;
}

/** The accepted formats and size per media type (SPEC §5 table). M4A is reported as either MIME type. */
export const MEDIA_RULES: Readonly<Record<MediaType, MediaRule>> = {
  image: { mimes: ["image/jpeg", "image/png", "image/webp", "image/gif"], maxBytes: PICTURE_MAX_BYTES },
  audio: { mimes: ["audio/mpeg", "audio/mp4", "audio/x-m4a"], maxBytes: AUDIO_MAX_BYTES },
  video: { mimes: ["video/mp4"], maxBytes: VIDEO_MAX_BYTES },
};

/** Why a picked file is refused, with the rule that refused it — enough for a message that names the limit (AC5). */
export type MediaCheck =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: "format" | "too-big" | "quiz-full"; readonly rule: MediaRule };

/**
 * Checks a picked file against SPEC §5 before anything is stored from it.
 * @param file - what the picker reported: the wanted media type, the MIME type and the size
 * @param usedBytes - media already in the quiz
 */
export function checkMedia(file: { readonly type: MediaType; readonly mime: string; readonly bytes: number }, usedBytes = 0): MediaCheck {
  const rule = MEDIA_RULES[file.type];
  if (!rule.mimes.includes(file.mime.toLowerCase())) return { ok: false, reason: "format", rule };
  if (file.bytes > rule.maxBytes) return { ok: false, reason: "too-big", rule };
  if (usedBytes + file.bytes > QUIZ_MEDIA_MAX_BYTES) return { ok: false, reason: "quiz-full", rule };
  return { ok: true };
}

/**
 * Keeps a number inside a range; anything that is not a finite number becomes the lowest value.
 * @param value - the number as typed
 * @param min - lowest allowed
 * @param max - highest allowed
 */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * Cuts a text to its longest allowed length, counted in characters as people see them — an emoji or
 * an accented letter is never cut in half.
 * @param text - the text as typed
 * @param max - longest allowed, in characters
 */
export function cut(text: string, max: number): string {
  if (text.length <= max) return text;
  const characters = Array.from(new Intl.Segmenter().segment(text), (part) => part.segment);
  return characters.slice(0, max).join("");
}
