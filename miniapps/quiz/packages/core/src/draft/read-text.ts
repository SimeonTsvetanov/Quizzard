// What a person pastes from their assistant is rarely clean JSON: it comes inside ``` fences, with a
// sentence before and after, sometimes in several blocks (one per round, when the quiz is long). This
// finds the JSON in it and puts the blocks together as one draft.
import { type Raw, isRaw } from "./reader.ts";

/** What a pasted text holds. */
export type PastedDraft =
  | { readonly ok: true; readonly draft: Raw }
  | { readonly ok: false; readonly reason: "empty" | "no-json" };

/** JSON with the two slips assistants make most: a comma before a closing bracket, and curly quotes around names and texts. */
function parse(text: string): unknown {
  const attempts = [text, text.replace(/,(\s*[}\]])/g, "$1"), text.replace(/[“”]/g, '"').replace(/,(\s*[}\]])/g, "$1")];
  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt) as unknown;
    } catch {
      // The next, more forgiving reading is tried.
    }
  }
  return undefined;
}

/** The texts between ``` fences, in order; none when the text has no fence. */
function fenced(text: string): readonly string[] {
  return [...text.matchAll(/```[a-zA-Z0-9]*\s*\n?([\s\S]*?)```/g)].map((match) => match[1] ?? "");
}

/** From the first `{` or `[` to the last `}` or `]`: the JSON inside a sentence around it. */
function inner(text: string): string {
  const start = text.search(/[{[]/);
  const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  return start >= 0 && end > start ? text.slice(start, end + 1) : "";
}

/** Whether a block is a round (or a list of them) rather than a whole quiz. */
function roundsOf(value: unknown): readonly unknown[] | undefined {
  if (Array.isArray(value)) return value as readonly unknown[];
  if (!isRaw(value) || Array.isArray(value["rounds"])) return undefined;
  return value["questions"] !== undefined || value["type"] !== undefined ? [value] : undefined;
}

/** Several blocks as one draft: the first whole quiz gives the name and the settings, every block its rounds, in order. */
function merge(values: readonly unknown[]): Raw | undefined {
  let head: Raw | undefined;
  const rounds: unknown[] = [];
  for (const value of values) {
    const loose = roundsOf(value);
    if (loose) {
      rounds.push(...loose);
    } else if (isRaw(value)) {
      head ??= value;
      if (Array.isArray(value["rounds"])) rounds.push(...(value["rounds"] as readonly unknown[]));
    }
  }
  if (!head && rounds.length === 0) return undefined;
  return { ...head, rounds };
}

/**
 * Finds the draft in a pasted text.
 * @param text - what was pasted or read from a file
 */
export function readPasted(text: string): PastedDraft {
  if (text.trim() === "") return { ok: false, reason: "empty" };
  const blocks = fenced(text);
  const sources = blocks.length > 0 ? blocks : [text];
  const values = sources.map((source) => parse(source.trim()) ?? parse(inner(source))).filter((value) => value !== undefined);
  // A fence that held no JSON (an example of a command) must not hide the JSON beside it.
  const all = values.length > 0 ? values : [parse(inner(text))].filter((value) => value !== undefined);
  const draft = merge(all);
  return draft ? { ok: true, draft } : { ok: false, reason: "no-json" };
}
