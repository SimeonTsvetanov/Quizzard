// A picked file becomes a media file of the quiz (SPEC F7, §5, AC5; lazy: loaded with the first
// file). In order: the format and the limits (core `checkMedia`) — a refusal says which and nothing
// is read; then the file is prepared (a picture scaled and saved again, a clip tried in the browser);
// then the room on the device. Only a file that passed everything is handed back to be stored.
import { MEDIA_RULES, type MediaCheck, type MediaEntry, type MediaType, QUIZ_MEDIA_MAX_BYTES, checkMedia, mimeOf } from "@simeonts/quizzard-quiz-core";
import { prepareClip } from "./clip.ts";
import { preparePicture, type Prepared } from "./picture.ts";

/**
 * Why a file was not taken: the three reasons of `checkMedia`, `unplayable` (the browser cannot
 * read or play it) and `no-space` (the device is full).
 */
export type RefusalReason = Extract<MediaCheck, { ok: false }>["reason"] | "unplayable" | "no-space";

/** A refusal with what the message needs: the file's name, size and type (AC5). */
export interface MediaRefusal {
  readonly ok: false;
  readonly reason: RefusalReason;
  readonly type: MediaType;
  readonly name: string;
  readonly bytes: number;
  readonly mime: string;
}

/** The result of {@link importMedia}. */
export type ImportResult = { readonly ok: true; readonly entry: MediaEntry; readonly blob: Blob } | MediaRefusal;

/** How each media type is prepared. */
const PREPARE: Readonly<Record<MediaType, (file: Blob, mime: string) => Promise<Prepared | null>>> = {
  image: preparePicture,
  audio: (file, mime) => prepareClip(file, mime, "audio"),
  video: (file, mime) => prepareClip(file, mime, "video"),
};

/**
 * The largest picture taken in to be scaled down, in bytes (60 MB): a photo is stored at 1,920 px,
 * so its limit is checked on what is stored, not on what was picked (Moni 2026-11-25).
 */
export const PICTURE_SOURCE_MAX_BYTES = 60 * 1024 * 1024;

/** What {@link importMedia} needs besides the file. */
export interface ImportOptions {
  /** The media type the question's kind takes. */
  readonly type: MediaType;
  /** Bytes of media the quiz already uses. */
  readonly usedBytes: number;
  /** The id of the new entry. */
  readonly id: string;
  /** Whether the device has room for this many bytes (storage/space.ts). */
  readonly hasRoomFor: (bytes: number) => Promise<boolean>;
}

/**
 * Checks and prepares a picked file.
 * @param file - the file from the picker, a drop or the clipboard
 * @param options - the wanted type, the quiz's media so far, the new id and the room check
 * @returns the entry and the bytes to store, or the refusal — nothing is stored here
 */
export async function importMedia(file: File, options: ImportOptions): Promise<ImportResult> {
  const { type, usedBytes, id } = options;
  const mime = mimeOf(file.type, file.name);
  const refuse = (reason: RefusalReason): MediaRefusal => ({ ok: false, reason, type, name: file.name, bytes: file.size, mime });
  // A picture is checked at the size it is stored at (below); a clip at its own.
  const isLargePicture = type === "image" && file.size > MEDIA_RULES.image.maxBytes;
  if (isLargePicture && file.size > PICTURE_SOURCE_MAX_BYTES) return refuse("too-big");
  const check = checkMedia({ type, mime, bytes: isLargePicture ? MEDIA_RULES.image.maxBytes : file.size }, usedBytes);
  if (!check.ok) return refuse(check.reason);
  const prepared = await PREPARE[type](file, mime).catch(() => null);
  if (prepared === null) return refuse("unplayable");
  const { blob, ...known } = prepared;
  if (blob.size > MEDIA_RULES[type].maxBytes) return refuse("too-big");
  if (usedBytes + blob.size > QUIZ_MEDIA_MAX_BYTES) return refuse("quiz-full");
  if (!(await options.hasRoomFor(blob.size))) return refuse("no-space");
  return { ok: true, blob, entry: { id, type, mime: blob.type === "" ? mime : blob.type, name: file.name, bytes: blob.size, ...known } };
}
