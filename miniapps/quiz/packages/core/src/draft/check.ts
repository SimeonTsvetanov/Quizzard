// "Check the answers with AI": the person's assistant reads every question with its answer (guide.ts,
// `checkPrompt`) and answers with the questions it doubts. This reads that answer: the places it names,
// what is wrong and what it would write instead — each tied to the question of the quiz it means.
import type { Question, Quiz } from "../model.ts";
import { type Raw, isRaw } from "./reader.ts";
import { pastedValues } from "./read-text.ts";

/** A question the assistant doubts — or a round or the quiz, when it names no question. */
export interface CheckItem {
  /** The round and the question, from 1, as the assistant named them; 0 = none named (a whole round, the whole quiz). */
  readonly round: number;
  readonly question: number;
  /** The question of the quiz at that place; `undefined` when there is none. */
  readonly found?: Question;
  readonly problem: string;
  /** What the assistant would write instead; `""` when it gave nothing. */
  readonly suggestion: string;
}

/** What the assistant's answer to the check says. */
export type CheckResult =
  | { readonly ok: true; readonly items: readonly CheckItem[] }
  | { readonly ok: false; readonly reason: "empty" | "no-json" | "broken" };

/** Longest text kept of a problem or a suggestion, in characters. */
const TEXT_MAX = 600;

/** A text of the answer, trimmed and cut; numbers become their digits. */
function text(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value).trim().slice(0, TEXT_MAX) : "";
}

/** A place: a whole number from 1, also written as a text ("3", "Round 3", "Q2"); 0 when there is none. */
function place(value: unknown): number {
  const number = typeof value === "string" ? Number(/\d+/.exec(value)?.[0] ?? "") : value;
  return typeof number === "number" && Number.isInteger(number) && number >= 1 ? number : 0;
}

/** One doubted question (or round, or the quiz); `undefined` when the entry says no problem. */
function item(raw: Raw, quiz: Quiz): CheckItem | undefined {
  const round = place(raw["round"]);
  const question = round === 0 ? 0 : place(raw["question"]);
  const problem = text(raw["problem"] ?? raw["issue"]);
  if (problem === "") return undefined;
  const found = question === 0 ? undefined : quiz.rounds[round - 1]?.questions[question - 1];
  return { round, question, problem, suggestion: text(raw["suggestion"] ?? raw["fix"] ?? raw["answer"]), ...(found ? { found } : {}) };
}

/** Whether a list holds entries of a check: objects that say a problem. */
const isEntries = (value: unknown): value is readonly unknown[] => Array.isArray(value) && value.length > 0 && value.every((entry) => isRaw(entry) && (entry["problem"] !== undefined || entry["issue"] !== undefined));

/**
 * Reads the assistant's answer to a check: the last `{ "check": [...] }` in it that names something (or a
 * list of entries). Only when every check list in it is empty did the assistant find nothing wrong — a
 * stray `[]` after the answer (a task box, an example) never hides what it found.
 * @param pasted - what was pasted
 * @param quiz - the quiz that was checked
 */
export function readCheck(pasted: string, quiz: Quiz): CheckResult {
  if (pasted.trim() === "") return { ok: false, reason: "empty" };
  const { found, isBroken } = pastedValues(pasted);
  const checks = found.filter((value): value is Raw => isRaw(value) && Array.isArray(value["check"])).map((value) => value["check"] as readonly unknown[]);
  const last = checks.filter((list) => list.length > 0).at(-1) ?? found.filter(isEntries).at(-1);
  if (last === undefined) {
    if (checks.length > 0 && !isBroken) return { ok: true, items: [] };
    return { ok: false, reason: isBroken ? "broken" : "no-json" };
  }
  return { ok: true, items: last.flatMap((entry) => (isRaw(entry) ? (item(entry, quiz) ?? []) : [])) };
}
