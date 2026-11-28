// "Check the answers with AI": the person's assistant reads every question with its answer (guide.ts,
// `checkPrompt`) and answers with the questions it doubts. This reads that answer: the places it names,
// what is wrong and what it would write instead — each tied to the question of the quiz it means.
import type { Question, Quiz } from "../model.ts";
import { type Raw, isRaw } from "./reader.ts";
import { pastedValues } from "./read-text.ts";

/** A question the assistant doubts. */
export interface CheckItem {
  /** The round and the question, from 1, as the assistant named them. */
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
  | { readonly ok: false; readonly reason: "empty" | "no-json" };

/** Longest text kept of a problem or a suggestion, in characters. */
const TEXT_MAX = 600;

/** A text of the answer, trimmed and cut; numbers become their digits. */
function text(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value).trim().slice(0, TEXT_MAX) : "";
}

/** A place: a whole number from 1, also written as a text ("3"). */
function place(value: unknown): number {
  const number = typeof value === "string" ? Number(value.trim()) : value;
  return typeof number === "number" && Number.isInteger(number) && number >= 1 ? number : 0;
}

/** One doubted question; `undefined` when the entry names no place or no problem. */
function item(raw: Raw, quiz: Quiz): CheckItem | undefined {
  const round = place(raw["round"]);
  const question = place(raw["question"]);
  const problem = text(raw["problem"] ?? raw["issue"]);
  if (round === 0 || question === 0 || problem === "") return undefined;
  const found = quiz.rounds[round - 1]?.questions[question - 1];
  return { round, question, problem, suggestion: text(raw["suggestion"] ?? raw["fix"] ?? raw["answer"]), ...(found ? { found } : {}) };
}

/**
 * Reads the assistant's answer to a check: the last `{ "check": [...] }` in it (or a list of entries).
 * An empty list means the assistant found nothing wrong.
 * @param pasted - what was pasted
 * @param quiz - the quiz that was checked
 */
export function readCheck(pasted: string, quiz: Quiz): CheckResult {
  if (pasted.trim() === "") return { ok: false, reason: "empty" };
  const values = pastedValues(pasted) ?? [];
  const lists = values.flatMap((value): readonly unknown[][] => {
    if (isRaw(value) && Array.isArray(value["check"])) return [value["check"] as unknown[]];
    return Array.isArray(value) && value.every((entry) => isRaw(entry) && entry["problem"] !== undefined) ? [value as unknown[]] : [];
  });
  const last = lists.at(-1);
  if (last === undefined) return { ok: false, reason: "no-json" };
  return { ok: true, items: last.flatMap((entry) => (isRaw(entry) ? (item(entry, quiz) ?? []) : [])) };
}
