// What a person pastes from their assistant is rarely clean JSON: it comes inside ``` fences, with
// sentences before and after, sometimes in several parts (one per message, when the quiz is long),
// sometimes with the instructions' own example or an earlier, refused version above it. This walks the
// text for every JSON value in it — brackets matched with the strings between them left alone — and
// puts the parts together as one draft: the LAST whole quiz, and the rounds that follow it.
import { type Raw, isRaw } from "./reader.ts";

/** Longest text that is read, in characters: forty questions are about 20,000. */
export const PASTE_MAX_CHARS = 1_000_000;

/** What a pasted text holds. `broken`: a part that looks like a quiz is not valid JSON (cut off, or mistyped). */
export type PastedDraft =
  | { readonly ok: true; readonly draft: Raw }
  | { readonly ok: false; readonly reason: "empty" | "no-json" | "broken" | "too-long" };

/** Where a string that opens at `start` ends (the place after its closing quote); the text's end when it never closes. */
function stringEnd(text: string, start: number): number {
  for (let at = start + 1; at < text.length; at += 1) {
    const sign = text[at];
    if (sign === "\\") at += 1;
    else if (sign === '"') return at + 1;
  }
  return text.length;
}

/** Where the bracket that opens at `start` closes (the place after it), strings skipped; `-1` when it never does. */
function valueEnd(text: string, start: number): number {
  let depth = 0;
  for (let at = start; at < text.length; at += 1) {
    const sign = text[at];
    if (sign === '"') {
      at = stringEnd(text, at) - 1;
    } else if (sign === "{" || sign === "[") {
      depth += 1;
    } else if (sign === "}" || sign === "]") {
      depth -= 1;
      if (depth === 0) return at + 1;
    }
  }
  return -1;
}

/**
 * The same JSON with what stands outside its strings put right: a comma before a closing bracket is
 * dropped and a no-break space becomes a space. The texts themselves are never touched.
 */
function tidy(json: string): string {
  let out = "";
  for (let at = 0; at < json.length; at += 1) {
    const sign = json[at] ?? "";
    if (sign === '"') {
      const end = stringEnd(json, at);
      out += json.slice(at, end);
      at = end - 1;
    } else if (sign === "," && /^\s*[}\]]/.test(json.slice(at + 1, at + 200))) {
      // Dropped: the bracket that follows closes the list.
    } else {
      out += sign === "\u00A0" ? " " : sign;
    }
  }
  return out;
}

/** Where JSON goes on after a key's closing quote: a colon. */
const AFTER_KEY = /^\s*:/;
/** Where JSON goes on after a value's closing quote: the end of its object or list, or a comma and then the next key or value. */
const AFTER_VALUE = /^\s*(?:[}\]]|$|,\s*(?:["\u201C\u201D\u201E{[\d-]|true|false|null))/;

/**
 * JSON typed with curly quotes (a word processor, a phone's keyboard): a curly quote outside a string opens
 * one. Inside a string it closes it only where JSON truly goes on — after a key, a colon; after a value, the
 * end of the object or list, or a comma followed by the next key or value — so the quotes of a title inside
 * a text („Под игото“, кой е…; “Hamlet”, who…) stay text. A straight quote inside such a text is escaped.
 */
function straightened(json: string): string {
  const CURLY = "\u201C\u201D\u201E";
  const opened: string[] = [];
  let out = "";
  let isInside = false;
  let isKey = false;
  let last = "";
  for (let at = 0; at < json.length; at += 1) {
    const sign = json[at] ?? "";
    const isCurly = CURLY.includes(sign);
    if (isInside) {
      const rest = json.slice(at + 1, at + 60);
      if (isCurly && (isKey ? AFTER_KEY : AFTER_VALUE).test(rest)) {
        isInside = false;
        out += '"';
        last = '"';
      } else {
        out += sign === '"' ? '\\"' : sign;
      }
      continue;
    }
    if (isCurly) {
      isInside = true;
      // A string right after "{", or after "," inside an object, is a key.
      isKey = last === "{" || (last === "," && opened.at(-1) === "{");
      out += '"';
      continue;
    }
    if (sign === "{" || sign === "[") opened.push(sign);
    if (sign === "}" || sign === "]") opened.pop();
    if (sign.trim() !== "") last = sign;
    out += sign;
  }
  return out;
}

/** JSON as written, then with the slips outside its strings put right, then with curly quotes as its quotes; `undefined` when none parses. */
function parse(json: string): unknown {
  const attempts = [json, tidy(json)];
  if (/[\u201C\u201D\u201E]/.test(json) && !/"\s*:/.test(json)) attempts.push(tidy(straightened(json)));
  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt) as unknown;
    } catch {
      // The next, more forgiving reading is tried.
    }
  }
  return undefined;
}

/** Whether a piece of text that is not JSON was meant to be a part of a quiz. */
function looksLikeQuiz(text: string): boolean {
  return /["\u201C\u201D\u201E](?:rounds|questions|check|problem)["\u201C\u201D]\s*:/.test(text);
}

/** Every JSON object or list in a text, in order, and whether a part meant as a quiz could not be read. */
function values(text: string): { readonly found: readonly unknown[]; readonly isBroken: boolean } {
  const found: unknown[] = [];
  let isBroken = false;
  let at = 0;
  while (at < text.length) {
    const sign = text[at];
    if (sign !== "{" && sign !== "[") {
      at += 1;
      continue;
    }
    const end = valueEnd(text, at);
    if (end < 0) {
      // Never closed: an answer cut off in the middle, when what is left reads like a quiz.
      isBroken ||= looksLikeQuiz(text.slice(at));
      break;
    }
    const value = parse(text.slice(at, end));
    if (value === undefined) {
      // A part meant as a quiz that cannot be read: said once, and not searched again bracket by bracket.
      const isQuizPart = looksLikeQuiz(text.slice(at, end)) && sign === "{";
      isBroken ||= isQuizPart;
      at = isQuizPart ? end : at + 1;
    } else {
      found.push(value);
      at = end;
    }
  }
  return { found, isBroken };
}

/** Whether a value is a round on its own: an object with questions or a type, and no rounds. */
function isRound(value: unknown): value is Raw {
  return isRaw(value) && !Array.isArray(value["rounds"]) && (Array.isArray(value["questions"]) || typeof value["type"] === "string");
}

/** Whether an object with rounds is the next part of a quiz, not a quiz of its own: it has no name and no language. */
function isContinuation(value: unknown): value is Raw {
  return isRaw(value) && Array.isArray(value["rounds"]) && value["name"] === undefined && value["title"] === undefined && value["language"] === undefined;
}

/** The rounds a value carries when it is not a whole quiz: a round, a list of them, or `{ "rounds" }` with no name. */
function looseRounds(value: unknown): readonly Raw[] {
  if (isRound(value)) return [value];
  if (isContinuation(value)) return (value["rounds"] as readonly unknown[]).filter(isRaw);
  return Array.isArray(value) && value.length > 0 && value.every(isRound) ? value : [];
}

/**
 * Rounds with no quiz around them. A one-round quiz written flat — one bare object `{ "name", "language",
 * "questions" }`, not in a list — is a quiz: its name, language and teams are the quiz's. A round in a list
 * is always a round (what "Write rounds with AI" asks for), and keeps its name.
 */
function liftQuiz(found: readonly unknown[], rounds: readonly Raw[]): Raw {
  const [only] = rounds;
  const isBare = found.length === 1 && found[0] === only;
  if (rounds.length !== 1 || !only || !isBare || (only["language"] === undefined && only["teams"] === undefined)) return { rounds };
  const { name, title, language, teams, ...round } = only;
  return { name: name ?? title, language, teams, rounds: [round] };
}

/**
 * The parts as one draft: the last whole quiz gives the name, the settings and its rounds; the rounds
 * written after it (the next messages of a long quiz) follow. An earlier quiz — the instructions'
 * example, a version that was refused — is left out, with the loose rounds that belonged to it.
 */
function merge(found: readonly unknown[]): Raw | undefined {
  const last = found.findLastIndex((value) => isRaw(value) && Array.isArray(value["rounds"]) && !isContinuation(value));
  const head = last >= 0 ? (found[last] as Raw) : undefined;
  const after = found.slice(last + 1).flatMap(looseRounds);
  if (!head) return after.length > 0 ? liftQuiz(found, after) : undefined;
  return { ...head, rounds: [...(head["rounds"] as readonly unknown[]), ...after] };
}

/**
 * Every JSON object or list in a pasted text, in order — for an answer that is not a quiz (the check of
 * the answers) — and whether a part meant as one could not be read.
 * @param pasted - what was pasted
 */
export function pastedValues(pasted: string): { readonly found: readonly unknown[]; readonly isBroken: boolean } {
  const text = pasted.replace(/^\uFEFF/, "");
  if (text.trim() === "" || text.length > PASTE_MAX_CHARS) return { found: [], isBroken: false };
  return values(text);
}

/**
 * Finds the draft in a pasted text.
 * @param pasted - what was pasted or read from a file
 */
export function readPasted(pasted: string): PastedDraft {
  const text = pasted.replace(/^\uFEFF/, "");
  if (text.trim() === "") return { ok: false, reason: "empty" };
  if (text.length > PASTE_MAX_CHARS) return { ok: false, reason: "too-long" };
  const { found, isBroken } = values(text);
  if (isBroken) return { ok: false, reason: "broken" };
  const draft = merge(found);
  return draft ? { ok: true, draft } : { ok: false, reason: "no-json" };
}
