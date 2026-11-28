// A draft question's answer, per answer type: what the assistant wrote → the answer the quiz holds.
import type { IdSource } from "../ids.ts";
import * as limits from "../limits.ts";
import type { Answer } from "../model.ts";
import { type Raw, type Reader, listOf, note, pick, textOf } from "./reader.ts";

/** The names an answer field may have in a draft. */
const NAMES = {
  answer: ["a", "answer"],
  options: ["options", "choices"],
  correct: ["correct", "right"],
  accepted: ["accepted", "answers", "items"],
  digit: ["digit", "a", "answer"],
} as const;

/** The option a `correct` entry names: its number (the first is 1), its letter (A, B, …) or its exact text. */
function optionAt(entry: unknown, texts: readonly string[]): number {
  if (typeof entry === "number" && Number.isInteger(entry)) return entry - 1;
  if (typeof entry !== "string") return -1;
  const word = entry.trim();
  const byText = texts.findIndex((text) => text.toLowerCase() === word.toLowerCase());
  if (byText >= 0) return byText;
  if (/^[A-Ha-h]$/.test(word)) return word.toUpperCase().charCodeAt(0) - 65;
  return /^\d+$/.test(word) ? Number(word) - 1 : -1;
}

/** A multiple-choice answer: 2–8 options, at least one of them right. */
function choice(reader: Reader, raw: Raw, path: string, ids: IdSource): Answer | undefined {
  const given = listOf(reader, pick(raw, NAMES.options), `${path}.options`);
  if (given.length < limits.MIN_OPTIONS || given.length > limits.MAX_OPTIONS) {
    note(reader, "error", `${path}.options`, "options-count", { min: limits.MIN_OPTIONS, max: limits.MAX_OPTIONS, found: given.length });
    return undefined;
  }
  const texts = given.map((option, index) => textOf(reader, option, `${path}.options[${String(index)}]`, limits.OPTION_TEXT_MAX));
  const empty = texts.findIndex((text) => text === "");
  if (empty >= 0) {
    note(reader, "error", `${path}.options[${String(empty)}]`, "option-empty", { option: empty + 1 });
    return undefined;
  }
  const marked = pick(raw, NAMES.correct);
  const entries = Array.isArray(marked) ? marked : [marked];
  if (marked === undefined || entries.length === 0) {
    note(reader, "error", `${path}.correct`, "correct-missing");
    return undefined;
  }
  const places = entries.map((entry) => optionAt(entry, texts));
  const unknown = places.findIndex((place) => place < 0 || place >= texts.length);
  if (unknown >= 0) {
    note(reader, "error", `${path}.correct`, "correct-unknown", { value: String(entries[unknown]) });
    return undefined;
  }
  const options = texts.map((text) => ({ id: ids(), text }));
  return { type: "choice", options, correct: options.flatMap((option, index) => (places.includes(index) ? [option.id] : [])) };
}

/** `true` / `false`, also as the words an assistant may write for them. */
function truth(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return undefined;
  const word = value.trim().toLowerCase();
  if (word === "true") return true;
  return word === "false" ? false : undefined;
}

/**
 * The answer of a standard round's question: multiple choice when it has options, true / false when
 * its answer is one of the two, else an open answer.
 * @param reader - the reading
 * @param raw - the draft's question
 * @param path - where the question is
 * @param ids - gives the options' ids
 * @returns `undefined` when the answer cannot be used (the error is noted)
 */
export function standardAnswer(reader: Reader, raw: Raw, path: string, ids: IdSource): Answer | undefined {
  if (pick(raw, NAMES.options) !== undefined) return choice(reader, raw, path, ids);
  const given = pick(raw, NAMES.answer);
  if (typeof given === "boolean") return { type: "trueFalse", correct: given };
  const text = textOf(reader, given, `${path}.a`, limits.ANSWER_TEXT_MAX);
  if (text === "") {
    note(reader, "error", `${path}.a`, "answer-missing");
    return undefined;
  }
  const asTruth = pick(raw, ["type"]) === "trueFalse" ? truth(given) : undefined;
  return asTruth === undefined ? { type: "open", text } : { type: "trueFalse", correct: asTruth };
}

/**
 * The accepted answers of a Golden pyramid question: at least as many as it asks for.
 * @param reader - the reading
 * @param raw - the draft's question
 * @param path - where the question is
 * @param needed - how many answers the question asks for
 */
export function listAnswer(reader: Reader, raw: Raw, path: string, needed: number): Answer | undefined {
  const given = listOf(reader, pick(raw, NAMES.accepted), `${path}.accepted`);
  const all = given.map((item, index) => textOf(reader, item, `${path}.accepted[${String(index)}]`, limits.ANSWER_TEXT_MAX)).filter((item) => item !== "");
  const items = [...new Set(all)].slice(0, limits.LIST_ITEMS_MAX);
  if (items.length < needed) {
    note(reader, "error", `${path}.accepted`, "accepted-too-few", { needed, found: items.length });
    return undefined;
  }
  return { type: "list", items };
}

/**
 * The digit a Safe question is answered with.
 * @param reader - the reading
 * @param raw - the draft's question
 * @param path - where the question is
 */
export function digitAnswer(reader: Reader, raw: Raw, path: string): Answer | undefined {
  const given = pick(raw, NAMES.digit);
  const digit = typeof given === "string" && /^\d$/.test(given.trim()) ? Number(given) : given;
  if (typeof digit !== "number" || !Number.isInteger(digit) || digit < 0 || digit > 9) {
    note(reader, "error", `${path}.digit`, "digit-invalid");
    return undefined;
  }
  return { type: "digit", digit };
}
