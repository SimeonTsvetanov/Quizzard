// "Export to play" (SPEC F9, §6): puts a quiz and its files into the player template — one HTML
// page that needs nothing else. Pure text in, text out; the template is built from packages/player
// and already carries its Content-Security-Policy with the hashes of its own script and style, so
// only inert data blocks are added here: the quiz as JSON in a `<script type="application/json">`
// and each media file as base64 in a `<script type="application/octet-stream">` (a block that is not
// script is never run and needs no CSP grant). No Zod: the player reads its data with the hand check
// below, because the quiz was validated when it was saved and the player must stay small.
import { QUIZ_FORMAT, QUIZ_VERSION } from "./format.ts";
import type { QuizFile } from "./model.ts";

/** Where the template takes the data blocks: this comment, exactly once. */
export const EXPORT_DATA_MARK = "<!--quizzard:data-->";
/** The `id` of the quiz JSON block. */
export const EXPORT_QUIZ_ID = "qp-quiz";
/** The attribute that carries a media block's id; `data-mime` next to it carries its type. */
export const EXPORT_MEDIA_ATTR = "data-qp-media";

/** One file to embed: its id in `QuizFile.media`, its type and its bytes as base64. */
export interface ExportMedia {
  readonly id: string;
  readonly mime: string;
  readonly base64: string;
}

/** Why an export could not be assembled. */
export type ExportFailure = "template" | "media";

/** Thrown by {@link assembleExport}; `reason` says which input was wrong. */
export class ExportError extends Error {
  readonly reason: ExportFailure;

  /**
   * @param reason - which input was wrong
   * @param message - for the log
   */
  constructor(reason: ExportFailure, message: string) {
    super(message);
    this.name = "ExportError";
    this.reason = reason;
  }
}

const MIME = /^[a-z0-9][\w.+-]*\/[\w.+-]+$/i;
const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;
const JSON_ESCAPES: Readonly<Record<string, string>> = { "<": "\\u003c", ">": "\\u003e", "&": "\\u0026", "\u2028": "\\u2028", "\u2029": "\\u2029" };
const ATTRIBUTE_ESCAPES: Readonly<Record<string, string>> = { "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" };

/**
 * JSON that is safe inside a `<script>` block: `<`, `>` and `&` are written as `\uXXXX`, so no text
 * of the quiz can close the block (`</script>`, `<!--`), and U+2028/U+2029 are escaped too.
 * `JSON.parse` gives the same value back.
 * @param value - anything JSON can hold
 */
export function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => JSON_ESCAPES[character] ?? character);
}

function attribute(value: string): string {
  return value.replace(/[&"<>]/g, (character) => ATTRIBUTE_ESCAPES[character] ?? character);
}

function mediaBlock(entry: ExportMedia): string {
  if (entry.id === "" || !MIME.test(entry.mime)) throw new ExportError("media", `media "${entry.id}": not a media type: "${entry.mime}"`);
  if (entry.base64.length % 4 !== 0 || !BASE64.test(entry.base64)) throw new ExportError("media", `media "${entry.id}": not base64`);
  return `<script type="application/octet-stream" ${EXPORT_MEDIA_ATTR}="${attribute(entry.id)}" data-mime="${attribute(entry.mime)}">${entry.base64}</script>`;
}

/**
 * Builds the playable page: the template with the quiz and its files inside.
 * @param template - the player template (packages/player `dist/template.html`)
 * @param file - the quiz as a versioned file
 * @param media - the bytes of its files; none for a quiz without media
 * @returns the complete HTML page
 * @throws {@link ExportError} `"template"` when the data mark is missing or repeated, `"media"` for a
 * file with a repeated id, a broken type or bytes that are not base64
 */
export function assembleExport(template: string, file: QuizFile, media: readonly ExportMedia[] = []): string {
  const parts = template.split(EXPORT_DATA_MARK);
  const [before, after] = parts;
  if (parts.length !== 2 || before === undefined || after === undefined) throw new ExportError("template", "the player template needs its data mark exactly once");
  if (new Set(media.map((entry) => entry.id)).size !== media.length) throw new ExportError("media", "a media id repeats");
  const quiz = `<script type="application/json" id="${EXPORT_QUIZ_ID}">${jsonForScript(file)}</script>`;
  return [before, quiz, ...media.map(mediaBlock), after].join("");
}

/** Characters no file system takes in a name (Windows is the strictest). */
const FORBIDDEN_IN_NAMES = '\\/:*?"<>|';

/** Whether a character may stand in a file name: not a control character, not one of the forbidden ones. */
function isNameCharacter(character: string): boolean {
  const code = character.codePointAt(0) ?? 0;
  return code >= 32 && code !== 127 && !FORBIDDEN_IN_NAMES.includes(character);
}

/**
 * The file name of an export: the quiz's name without the characters file systems refuse.
 * @param name - the quiz's name
 * @param fallback - used when nothing of the name is left
 * @returns e.g. `"Pub night.html"`
 */
export function exportFileName(name: string, fallback = "quiz"): string {
  const kept = Array.from(name, (character) => (isNameCharacter(character) ? character : " ")).join("");
  const cleaned = kept.replace(/\s+/g, " ").replace(/^[\s.]+|[\s.]+$/g, "").slice(0, 80).trim();
  return `${cleaned === "" ? fallback : cleaned}.html`;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const isText = (value: unknown): value is string => typeof value === "string";
const isOptionalText = (value: unknown): boolean => value === undefined || typeof value === "string";
const isAmount = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;

function isPoints(value: unknown): boolean {
  return isRecord(value) && isAmount(value["value"]) && isOptionalText(value["note"]);
}

function isQuestion(value: unknown): boolean {
  if (!isRecord(value) || !isText(value["id"]) || !isText(value["kind"]) || !isText(value["prompt"])) return false;
  const { answer, media, seconds, points } = value;
  if (!isRecord(answer) || !isText(answer["type"]) || !isOptionalText(value["explanation"])) return false;
  if (media !== undefined && !(isRecord(media) && isText(media["id"]))) return false;
  return (seconds === undefined || (isAmount(seconds) && seconds > 0)) && (points === undefined || isPoints(points));
}

function isRound(value: unknown): boolean {
  if (!isRecord(value) || !isText(value["id"]) || !isText(value["kind"]) || !isText(value["name"]) || !isOptionalText(value["rules"])) return false;
  const { defaults, questions } = value;
  if (!isRecord(defaults) || !isAmount(defaults["seconds"]) || defaults["seconds"] <= 0 || !isPoints(defaults["points"])) return false;
  return Array.isArray(questions) && questions.every(isQuestion);
}

/**
 * Whether a value has everything the player reads of a version-1 quiz file. A hand check instead of
 * the Zod schemas (validate.ts): the exported page holds a quiz that was valid when it was saved,
 * this only guards against a page that was cut or edited by hand.
 * @param value - parsed JSON
 */
export function isPlayableFile(value: unknown): value is QuizFile {
  if (!isRecord(value) || value["format"] !== QUIZ_FORMAT || value["version"] !== QUIZ_VERSION) return false;
  const { quiz, media } = value;
  if (!isRecord(quiz) || !isText(quiz["id"]) || !isText(quiz["name"]) || !isText(quiz["language"])) return false;
  const { settings, rounds } = quiz;
  if (!isRecord(settings) || !isAmount(settings["teams"]) || !Array.isArray(rounds) || !rounds.every(isRound)) return false;
  return Array.isArray(media) && media.every((entry) => isRecord(entry) && isText(entry["id"]) && isText(entry["mime"]));
}

/**
 * Reads the quiz of an exported page from the text of its JSON block.
 * @param text - the block's text content
 * @returns the quiz file, or `null` when the text is not one
 */
export function readEmbeddedQuiz(text: string): QuizFile | null {
  try {
    const parsed: unknown = JSON.parse(text);
    return isPlayableFile(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function unescapeAttribute(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

/** What {@link extractEmbedded} finds in an exported page. */
export interface EmbeddedData {
  /** The text of the quiz JSON block, or `null` when the page has none. */
  readonly quiz: string | null;
  readonly media: readonly ExportMedia[];
}

/**
 * Finds the data blocks of an exported page in its text — for tests and tools; the player itself
 * reads them through the DOM.
 * @param html - an exported page
 */
export function extractEmbedded(html: string): EmbeddedData {
  const quiz = new RegExp(`<script type="application/json" id="${EXPORT_QUIZ_ID}">([^<]*)</script>`).exec(html)?.[1] ?? null;
  const blocks = html.matchAll(new RegExp(`<script type="application/octet-stream" ${EXPORT_MEDIA_ATTR}="([^"]*)" data-mime="([^"]*)">([^<]*)</script>`, "g"));
  const media = [...blocks].map((match) => ({ id: unescapeAttribute(match[1] ?? ""), mime: unescapeAttribute(match[2] ?? ""), base64: match[3] ?? "" }));
  return { quiz, media };
}
