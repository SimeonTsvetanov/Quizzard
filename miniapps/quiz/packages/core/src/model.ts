// Version 1 of the quiz format (SPEC §3.1): the types and the Zod schemas of its fixed envelope.
// `kind` and `type` are open strings — what belongs to one kind or answer type is checked by its
// registry entry (validate.ts), so this file never names one. Every object is "loose": fields this
// version does not know are kept, never stripped, so a quiz survives a round trip through older code.
import { z } from "zod";
import { QUIZ_FORMAT, QUIZ_VERSION } from "./format.ts";

export { QUIZ_FORMAT, QUIZ_VERSION } from "./format.ts";

/** The media types a file can have. A closed list: a new one is a new format version. */
export type MediaType = "image" | "audio" | "video";

/** Points of a question: a number for adding up and/or a free text shown to the teams (SPEC F6). */
export interface Points {
  /** What the leaderboard adds; 0 when only the note says how the question is scored. */
  readonly value: number;
  /** Shown on the question and at score entry, e.g. "1 for the band, 2 with the song". */
  readonly note?: string;
}

/** A question's pointer to its file in `QuizFile.media`; several questions may share one file. */
export interface MediaRef {
  readonly id: string;
}

/** One stored file's description; the bytes themselves live apart (IndexedDB blob, quiz file, export). */
export interface MediaEntry {
  readonly id: string;
  readonly type: MediaType;
  readonly mime: string;
  /** The file's name as picked, for messages and lists. */
  readonly name: string;
  /** Size in bytes, for the quiz's size and the limits of SPEC §5. */
  readonly bytes: number;
  readonly width?: number;
  readonly height?: number;
  /** Length of audio or video, in seconds. Set for every clip; a picture has none. */
  readonly seconds?: number;
  /**
   * A small still that stands for the file where it is not played: a picture's thumbnail, a frame of
   * a video. A `data:image/…;base64,` address, so it travels inside the quiz itself.
   */
  readonly poster?: string;
}

/** An answer: `type` names its answer-type registry entry, the other fields are that type's own. */
export interface Answer {
  readonly type: string;
  readonly [field: string]: unknown;
}

/** What a question kind stores for itself (`question.data`, PLAN §2 rule 5); opaque outside its entry. */
export type QuestionData = Readonly<Record<string, unknown>>;

/** One question. `seconds` and `points` exist only when they differ from the round's defaults (SPEC F5). */
export interface Question {
  readonly id: string;
  /** Names the question-kind registry entry; an unknown kind is kept and shown as "not supported". */
  readonly kind: string;
  readonly prompt: string;
  readonly media?: MediaRef;
  readonly answer: Answer;
  /** Shown with the answer at the reveal. */
  readonly explanation?: string;
  /** The host's own note: shown in the editor and on the host panel, never on the stage. */
  readonly note?: string;
  /** The question's own time; absent = the round's. */
  readonly seconds?: number;
  /** The question's own points; absent = the round's. */
  readonly points?: Points;
  /** The kind's own payload, validated by the kind's schema. */
  readonly data?: QuestionData;
}

/** What a round gives its questions: time and points until a question has its own, and the picker's preselection. */
export interface RoundDefaults {
  readonly seconds: number;
  readonly points: Points;
  readonly questionKind: string;
  readonly answerType: string;
}

/** One round: a stack of questions with shared defaults. `kind` names the round-kind registry entry. */
export interface Round {
  readonly id: string;
  readonly kind: string;
  readonly name: string;
  /** Optional text shown before the round. */
  readonly rules?: string;
  readonly defaults: RoundDefaults;
  readonly questions: readonly Question[];
  /** The round kind's own values (a Safe's bonus), checked by its entry; absent for a standard round. */
  readonly data?: Readonly<Record<string, unknown>>;
}

/** A quiz: the deck. Timestamps are ISO 8601 strings; `language` is the player's language ("en", "bg"). */
export interface Quiz {
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly language: string;
  readonly rounds: readonly Round[];
  readonly settings: { readonly teams: number };
}

/** A quiz as it is stored and sent: the versioned wrapper every reader opens through `open()`. */
export interface QuizFile {
  readonly format: typeof QUIZ_FORMAT;
  readonly version: typeof QUIZ_VERSION;
  readonly quiz: Quiz;
  readonly media: readonly MediaEntry[];
}

const id = z.string().min(1);

/** Schema of {@link Points}: a number that is not negative, an optional note. */
export const pointsSchema = z.looseObject({ value: z.number().nonnegative(), note: z.string().optional() });

/** Schema of the answer envelope only: a `type`; the rest belongs to the answer type's own schema. */
export const answerSchema = z.looseObject({ type: id });

/** Schema of the question envelope, the same for every kind — known or not. */
export const questionSchema = z.looseObject({
  id,
  kind: id,
  prompt: z.string(),
  media: z.looseObject({ id }).optional(),
  answer: answerSchema,
  explanation: z.string().optional(),
  note: z.string().optional(),
  seconds: z.number().positive().optional(),
  points: pointsSchema.optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

/** Schema of a round and its defaults. */
export const roundSchema = z.looseObject({
  id,
  kind: id,
  name: z.string(),
  rules: z.string().optional(),
  defaults: z.looseObject({ seconds: z.number().positive(), points: pointsSchema, questionKind: id, answerType: id }),
  questions: z.array(questionSchema),
  data: z.record(z.string(), z.unknown()).optional(),
});

/** Schema of a quiz. */
export const quizSchema = z.looseObject({
  id,
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  language: z.string(),
  rounds: z.array(roundSchema),
  settings: z.looseObject({ teams: z.number().int().positive() }),
});

/** Schema of one media entry. */
export const mediaEntrySchema = z.looseObject({
  id,
  type: z.enum(["image", "audio", "video"]),
  mime: z.string(),
  name: z.string(),
  bytes: z.number().nonnegative(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  seconds: z.number().nonnegative().optional(),
  poster: z.string().optional(),
});

/** Schema of the version-1 quiz file envelope. Kind and answer payloads are checked in validate.ts. */
export const quizFileSchema = z.looseObject({
  format: z.literal(QUIZ_FORMAT),
  version: z.literal(QUIZ_VERSION),
  quiz: quizSchema,
  media: z.array(mediaEntrySchema),
});

/**
 * Builds points from what the author typed: a number, a note, or both (AC3). An empty note is left out.
 * @param value - the number; left out when only the note says how the question is scored (then 0)
 * @param note - the free text shown to the teams
 */
export function makePoints(value = 0, note = ""): Points {
  const trimmed = note.trim();
  const safe = Number.isFinite(value) && value > 0 ? value : 0;
  if (trimmed === "") return { value: safe };
  return { value: safe, note: trimmed };
}

/**
 * Whether two points are the same for the teams: same number and same note.
 * @param a - one side
 * @param b - the other side
 */
export function samePoints(a: Points, b: Points): boolean {
  return a.value === b.value && (a.note ?? "") === (b.note ?? "");
}
