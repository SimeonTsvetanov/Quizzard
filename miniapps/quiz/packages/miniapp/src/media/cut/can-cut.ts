// Whether a picked clip can — or must — be cut here, decided without loading the cutter (Mediabunny
// comes only with the cut window). A clip is cut where the browser can encode (WebCodecs); elsewhere
// the limits refuse it as before.
import { MEDIA_RULES, type MediaType } from "@simeonts/quizzard-quiz-core";

/**
 * The largest file taken in to be cut, in bytes (2 GB). The file is read from the disk in pieces,
 * so this is not a limit of memory: past it browsers' own file handling gets unreliable.
 */
export const CUT_SOURCE_MAX_BYTES = 2 * 1024 * 1024 * 1024;

/** The file-name endings of clips a phone or a camera makes that a quiz does not take as they are. */
const CLIP_ENDINGS: Readonly<Record<"audio" | "video", RegExp>> = { audio: /\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|weba)$/i, video: /\.(mp4|mov|m4v|webm|mkv)$/i };

/** Whether this browser can re-encode a clip of that type. */
export function canCut(type: MediaType): type is "audio" | "video" {
  if (type === "image") return false;
  const scope = globalThis as { AudioEncoder?: unknown; VideoEncoder?: unknown };
  return typeof scope.AudioEncoder === "function" && (type === "audio" || typeof scope.VideoEncoder === "function");
}

/** Whether a file is a clip of the wanted type at all, by its MIME type or its ending. */
function isClipOf(type: "audio" | "video", file: { readonly name: string; readonly type: string }): boolean {
  return file.type.toLowerCase().startsWith(`${type}/`) || CLIP_ENDINGS[type].test(file.name);
}

/**
 * Whether a picked file has to be cut before a quiz takes it: a clip of the right type that is too
 * big or in a format a quiz does not carry, in a browser that can re-encode it.
 * @param type - the media type the question takes
 * @param file - the picked file
 * @param mime - its MIME type as the quiz reads it (core `mimeOf`)
 */
export function mustCut(type: MediaType, file: { readonly name: string; readonly type: string; readonly size: number }, mime: string): boolean {
  if (!canCut(type) || !isClipOf(type, file) || file.size > CUT_SOURCE_MAX_BYTES) return false;
  const rule = MEDIA_RULES[type];
  return file.size > rule.maxBytes || !rule.mimes.includes(mime.toLowerCase());
}
