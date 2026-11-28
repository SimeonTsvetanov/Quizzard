// Reading a draft's values: every helper takes what the assistant wrote — which may be anything — and
// gives back a value the quiz can hold, noting what it had to put right or could not use.
import { clamp, cut } from "../limits.ts";
import type { DraftCode, DraftIssue, IssueValues } from "./issue.ts";

/** A JSON object as read. */
export type Raw = Readonly<Record<string, unknown>>;

/** Where the reading is, and the list its findings go to. */
export interface Reader {
  readonly issues: DraftIssue[];
  /** `round` and `question` (from 1) of the place being read, for the messages. */
  readonly place: IssueValues;
}

/** Whether a value is a JSON object (not a list, not null). */
export function isRaw(value: unknown): value is Raw {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Notes an issue at a path.
 * @param reader - the reading
 * @param level - whether it stops the quiz
 * @param path - where in the draft
 * @param code - the rule
 * @param values - the rule's numbers
 */
export function note(reader: Reader, level: DraftIssue["level"], path: string, code: DraftCode, values: IssueValues = {}): void {
  reader.issues.push({ level, path, code, values: { ...reader.place, ...values } });
}

/**
 * A text of the draft, trimmed and cut to its longest length; `""` when there is none. Numbers are
 * taken as their digits (an answer "1969" is often written as a number).
 * @param reader - the reading
 * @param value - what the draft holds
 * @param path - where
 * @param max - longest allowed, in characters
 */
export function textOf(reader: Reader, value: unknown, path: string, max: number): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string" && typeof value !== "number") {
    note(reader, "error", path, "wrong-type", { expected: "a text" });
    return "";
  }
  const text = String(value).trim();
  const short = cut(text, max);
  if (short !== text) note(reader, "fixed", path, "text-too-long", { max });
  return short;
}

/** The numbers a value may take. */
export interface Range {
  readonly min: number;
  readonly max: number;
  /** Used when the draft gives nothing. */
  readonly fallback: number;
  /** Rounded to a multiple of this (a time in half minutes); 1 = whole numbers. */
  readonly step?: number;
}

/**
 * A whole number of the draft inside its range; the fallback when there is none.
 * @param reader - the reading
 * @param value - what the draft holds
 * @param path - where
 * @param range - the lowest, the highest and what is used for nothing
 */
export function numberOf(reader: Reader, value: unknown, path: string, range: Range): number {
  if (value === undefined || value === null) return range.fallback;
  const given = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof given !== "number" || !Number.isFinite(given)) {
    note(reader, "error", path, "wrong-type", { expected: "a number" });
    return range.fallback;
  }
  const step = range.step ?? 1;
  const used = clamp(Math.round(given / step) * step, range.min, range.max);
  if (used !== given) note(reader, "fixed", path, "number-out-of-range", { value: given, min: range.min, max: range.max, used });
  return used;
}

/**
 * A list of the draft; an empty one when there is none, and an error when it is something else.
 * @param reader - the reading
 * @param value - what the draft holds
 * @param path - where
 */
export function listOf(reader: Reader, value: unknown, path: string): readonly unknown[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value;
  note(reader, "error", path, "wrong-type", { expected: "a list" });
  return [];
}

/**
 * The first of several names a field may have that the draft uses (`q`, `question`, `text`).
 * @param raw - an object of the draft
 * @param names - the names, the documented one first
 */
export function pick(raw: Raw, names: readonly string[]): unknown {
  for (const name of names) {
    if (raw[name] !== undefined && raw[name] !== null) return raw[name];
  }
  return undefined;
}
