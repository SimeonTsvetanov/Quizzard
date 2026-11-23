// The only way a stored or received quiz is read (PLAN §2 rule 4): refuse what is not a quiz or is
// from a newer Quizzard, bring an older version up step by step, then validate.
import { QUIZ_FORMAT, QUIZ_VERSION, type QuizFile } from "./model.ts";
import { type Registries, defaultRegistries } from "./registries.ts";
import { isQuizFile } from "./validate.ts";

/** A quiz file of some version, before it is validated. */
export type RawFile = Readonly<Record<string, unknown>>;

/** One step up: turns a file of version `from` into version `from + 1`. Pure; never edits its input. */
export interface Migration {
  readonly from: number;
  migrate(file: RawFile): RawFile;
}

/**
 * Every format change, oldest first. Empty while version 1 is the only one. Adding version 2 means:
 * one entry `{ from: 1, migrate }` here, `QUIZ_VERSION = 2`, a fixture `test/fixtures/v2/`, and the
 * version-1 fixture keeps its test for good (AC8). A step must carry over fields it does not know.
 */
export const migrations: readonly Migration[] = [];

/** Why a file was not opened: from a newer Quizzard, damaged, or not a quiz at all. */
export type OpenFailure = "newer" | "invalid" | "not-a-quiz";

/** The result of {@link open}: the quiz file in the current version, or the reason it was refused. */
export type OpenResult = { readonly ok: true; readonly file: QuizFile } | { readonly ok: false; readonly reason: OpenFailure };

/** Whether a value is a JSON object (not an array, not null). */
function isRecord(value: unknown): value is RawFile {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Runs the steps that bring a file from one version to another; `undefined` when a step is missing.
 * @param file - the file as read
 * @param from - its version
 * @param to - the wanted version
 * @param steps - the migrations to use
 */
export function upgrade(file: RawFile, from: number, to: number, steps: readonly Migration[] = migrations): RawFile | undefined {
  let current = file;
  for (let version = from; version < to; version += 1) {
    const step = steps.find((candidate) => candidate.from === version);
    if (!step) return undefined;
    current = { ...step.migrate(current), version: version + 1 };
  }
  return current;
}

/**
 * Opens a quiz file of any version up to the current one. A newer file is refused whole, never
 * half-read; questions of an unknown kind or answer type are kept untouched (SPEC §3.3).
 * @param input - parsed JSON or a stored record
 * @param registries - the kinds and answer types this version knows
 */
export function open(input: unknown, registries: Registries = defaultRegistries): OpenResult {
  if (!isRecord(input) || input["format"] !== QUIZ_FORMAT) return { ok: false, reason: "not-a-quiz" };
  const version = input["version"];
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) return { ok: false, reason: "invalid" };
  if (version > QUIZ_VERSION) return { ok: false, reason: "newer" };
  const file = upgrade(input, version, QUIZ_VERSION);
  if (!isQuizFile(file, registries)) return { ok: false, reason: "invalid" };
  return { ok: true, file };
}

/**
 * Opens a quiz file from its text; text that is not JSON is "not a quiz".
 * @param text - the file's content
 * @param registries - the kinds and answer types this version knows
 */
export function openText(text: string, registries: Registries = defaultRegistries): OpenResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: "not-a-quiz" };
  }
  return open(parsed, registries);
}
