// The draft: the small format an AI assistant writes a quiz in (guide.ts tells it how) — no ids, no
// files, nothing it has to count — and `fromDraft`, which turns one into a quiz of the current version
// or says, place by place, what must be fixed. The rounds get the same shape the creator gives a new
// round of their kind (special-rounds.ts), so a quiz made here is a quiz the editor could have made.
import * as limits from "../limits.ts";
import type { Answer, Points, Question, Quiz, Round } from "../model.ts";
import { type Env, defaultEnv } from "../ops.ts";
import type { RoundKind } from "../rounds/round-kind.ts";
import { digitAnswer, listAnswer, standardAnswer } from "./answers.ts";
import type { DraftIssue } from "./issue.ts";
import { type PendingPicture, commonsTitle } from "./pictures.ts";
import { type Raw, type Reader, isRaw, listOf, note, numberOf, pick, textOf } from "./reader.ts";

/** The languages a quiz can be played in. */
export const DRAFT_LANGUAGES = ["en", "bg"] as const;

/** What the caller gives a draft that leaves something out. */
export interface DraftOptions {
  /** The current time (ISO 8601): the quiz's two dates. */
  readonly now: string;
  /** The language of a draft that names none or one that is not supported. */
  readonly language: string;
  /** The name of a quiz whose draft has none. */
  readonly quizName: string;
  /** The name of a round whose draft has none; `number` counts from 1. */
  roundName(number: number): string;
}

/** The result of {@link fromDraft}: the quiz when nothing stops it, and everything that was found. */
export interface DraftResult {
  readonly quiz?: Quiz;
  readonly issues: readonly DraftIssue[];
  /** The pictures the quiz's questions point at and the creator must fetch before it is stored. */
  readonly pictures: readonly PendingPicture[];
}

/** The pictures a reading has met: one media id per file, however many questions show it. */
interface Pictures {
  readonly byTitle: Map<string, string>;
  readonly list: PendingPicture[];
}

const newPictures = (): Pictures => ({ byTitle: new Map(), list: [] });

const SECONDS = { min: limits.MIN_SECONDS, max: limits.MAX_SECONDS };
const POINTS = { min: 0, max: limits.MAX_POINTS };
const ROUND_VALUE = { min: limits.ROUND_VALUE_MIN, max: limits.ROUND_VALUE_MAX };
/** The names a question's text may have in a draft. */
const PROMPT = ["q", "question", "prompt", "text"];

/** What a round of the draft becomes while it is read: its kind, where it is, and the ids. */
interface RoundJob {
  readonly reader: Reader;
  readonly raw: Raw;
  readonly path: string;
  readonly kind: RoundKind;
  readonly env: Env;
  /** The round's time and points: a question that names the same has none of its own. */
  readonly seconds: number;
  readonly points: number;
  /** Whether a question may have points of its own; a Golden pyramid's and a Safe's are fixed by their place. */
  readonly hasOwnPoints: boolean;
  readonly pictures: Pictures;
}

/** A question's own points: only what differs from its round, and never where the round kind fixes them. */
function ownPoints(job: RoundJob, raw: Raw, path: string): Points | undefined {
  const { reader } = job;
  const hasValue = raw["points"] !== undefined && raw["points"] !== null;
  if (!job.hasOwnPoints) {
    for (const field of ["points", "pointsNote"]) {
      if (raw[field] !== undefined && raw[field] !== null) note(reader, "fixed", `${path}.${field}`, "field-ignored", { field, type: job.kind.id });
    }
    return undefined;
  }
  const pointsNote = textOf(reader, raw["pointsNote"], `${path}.pointsNote`, limits.POINTS_NOTE_MAX);
  const value = hasValue ? numberOf(reader, raw["points"], `${path}.points`, { ...POINTS, fallback: job.points }) : job.points;
  if (pointsNote === "") return value === job.points ? undefined : { value };
  return { value, note: pointsNote };
}

/** The parts every question may have: the reveal's explanation, the host's note, its own time and points. */
function extras(job: RoundJob, raw: Raw, path: string): Partial<Question> {
  const { reader } = job;
  const explanation = textOf(reader, raw["explanation"], `${path}.explanation`, limits.EXPLANATION_MAX);
  const hostNote = textOf(reader, raw["note"], `${path}.note`, limits.HOST_NOTE_MAX);
  const points = ownPoints(job, raw, path);
  const given = raw["seconds"] === undefined || raw["seconds"] === null ? job.seconds : numberOf(reader, raw["seconds"], `${path}.seconds`, { ...SECONDS, fallback: job.seconds });
  return { ...(explanation === "" ? {} : { explanation }), ...(hostNote === "" ? {} : { note: hostNote }), ...(given === job.seconds ? {} : { seconds: given }), ...(points ? { points } : {}) };
}

/** The names a question's picture and its answer's picture may have in a draft. */
const PICTURE = ["picture", "image", "photo"];
const ANSWER_PICTURE = ["answerPicture", "answerImage", "answerPhoto"];

/** The media id of a picture a draft names, the same one for the same file; `undefined` (and an error) for a name that is no Commons file. */
function pictureRef(job: RoundJob, reader: Reader, value: unknown, path: string): { readonly id: string } | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const title = typeof value === "string" ? commonsTitle(value) : undefined;
  if (title === undefined) {
    note(reader, "error", path, "picture-not-commons", { value: typeof value === "string" ? value : JSON.stringify(value) });
    return undefined;
  }
  const known = job.pictures.byTitle.get(title);
  if (known !== undefined) return { id: known };
  const id = job.env.ids();
  job.pictures.byTitle.set(title, id);
  const place: Record<string, number> = {};
  for (const [key, number] of Object.entries(reader.place)) if (typeof number === "number") place[key] = number;
  job.pictures.list.push({ id, title, path, place });
  return { id };
}

/** A question with the pictures its draft names: its own (it becomes a picture question) and its answer's. */
function withPictures(job: RoundJob, reader: Reader, raw: Raw, path: string, made: Question): Question {
  const own = pictureRef(job, reader, pick(raw, PICTURE), `${path}.picture`);
  const answer = pictureRef(job, reader, pick(raw, ANSWER_PICTURE), `${path}.answerPicture`);
  return { ...made, ...(own ? { kind: "picture", media: own } : {}), ...(answer ? { answerMedia: answer } : {}) };
}

/** One question of a round with answers; `undefined` when it cannot be used. */
function question(job: RoundJob, value: unknown, index: number, answer: (reader: Reader, raw: Raw, path: string) => Answer | undefined): Question | undefined {
  const path = `${job.path === "" ? "" : `${job.path}.`}questions[${String(index)}]`;
  const reader: Reader = { issues: job.reader.issues, place: { ...job.reader.place, question: index + 1 } };
  if (!isRaw(value)) {
    note(reader, "error", path, "wrong-type", { expected: "an object with \"q\" and its answer" });
    return undefined;
  }
  const prompt = textOf(reader, pick(value, PROMPT), `${path}.q`, limits.PROMPT_MAX);
  if (prompt === "") note(reader, "error", `${path}.q`, "question-no-text");
  const given = answer(reader, value, path);
  if (prompt === "" || !given) return undefined;
  return withPictures(job, reader, value, path, { id: job.env.ids(), kind: "text", prompt, answer: given, ...extras({ ...job, reader }, value, path) });
}

/** The questions of a round with answers, each read with the round kind's own answer. */
function questions(job: RoundJob, answer: (index: number) => (reader: Reader, raw: Raw, path: string) => Answer | undefined): readonly Question[] {
  const given = listOf(job.reader, job.raw["questions"], `${job.path}.questions`);
  const count = job.kind.shape?.count;
  // The questions are still read after a wrong count: every problem comes back in one go, not one a round trip.
  if (count !== undefined && given.length !== count) note(job.reader, "error", `${job.path}.questions`, "wrong-count", { type: job.kind.id, expected: count, found: given.length });
  else if (given.length === 0) note(job.reader, "error", `${job.path}.questions`, "no-questions");
  if (given.length > limits.MAX_QUESTIONS_PER_ROUND) {
    note(job.reader, "error", `${job.path}.questions`, "too-many-questions", { max: limits.MAX_QUESTIONS_PER_ROUND, found: given.length });
    return [];
  }
  return given.flatMap((value, index) => question(job, value, index, answer(index)) ?? []);
}

/** The answer type most of a standard round's questions have: what the round's "new questions" start as. */
function commonAnswer(list: readonly Question[]): string {
  const counts = new Map<string, number>();
  for (const one of list) counts.set(one.answer.type, (counts.get(one.answer.type) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "open";
}

/** A standard round: any number of questions, each with its own kind of answer. */
function standardRound(start: RoundJob, base: Pick<Round, "id" | "kind" | "name">): Round {
  const { reader, raw, path } = start;
  const seconds = numberOf(reader, raw["seconds"], `${path}.seconds`, { ...SECONDS, fallback: limits.DEFAULT_SECONDS });
  const points = numberOf(reader, raw["points"], `${path}.points`, { ...POINTS, fallback: limits.DEFAULT_POINTS });
  const job: RoundJob = { ...start, seconds, points, hasOwnPoints: true };
  const list = questions(job, () => (inner, one, where) => standardAnswer(inner, one, where, job.env.ids));
  return { ...base, defaults: { seconds, points: { value: points }, questionKind: "text", answerType: commonAnswer(list) }, questions: list };
}

/** A round whose kind fixes its questions (Golden pyramid, Safe): their number, answer type and points. */
function shapedRound(start: RoundJob, base: Pick<Round, "id" | "kind" | "name">): Round {
  const { reader, raw, path, kind } = start;
  const shape = kind.shape;
  const seconds = numberOf(reader, raw["seconds"], `${path}.seconds`, { ...SECONDS, fallback: shape?.seconds ?? limits.DEFAULT_SECONDS });
  const job: RoundJob = { ...start, seconds, hasOwnPoints: false };
  const isPyramid = shape?.answerType === "list";
  const list = questions(job, (index) => (inner, one, where) => (isPyramid ? listAnswer(inner, one, where, index + 1) : digitAnswer(inner, one, where)));
  const placed = list.map((one, index) => {
    const value = shape?.pointsAt(index) ?? limits.DEFAULT_POINTS;
    return value === limits.DEFAULT_POINTS ? one : { ...one, points: { value } };
  });
  const bonus = shape?.defaultData?.()["bonus"];
  const data = typeof bonus === "number" ? { bonus: numberOf(reader, raw["bonus"], `${path}.bonus`, { min: limits.SAFE_BONUS_MIN, max: limits.SAFE_BONUS_MAX, fallback: bonus }) } : undefined;
  return { ...base, defaults: { seconds, points: { value: limits.DEFAULT_POINTS }, questionKind: "text", answerType: shape?.answerType ?? "open" }, questions: placed, ...(data ? { data } : {}) };
}

/** A round without answers ("Make the quizmaster laugh", the free game): one screen with a task, a timer and points the host gives. */
function taskRound(job: RoundJob, base: Pick<Round, "id" | "kind" | "name">): Round {
  const { reader, raw, path, kind } = job;
  const shape = kind.shape;
  const seconds = numberOf(reader, raw["seconds"], `${path}.seconds`, { ...SECONDS, fallback: shape?.seconds ?? limits.DEFAULT_SECONDS, min: 30, step: 30 });
  const defaults = shape?.defaultData?.() ?? {};
  const data = Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key, numberOf(reader, raw[key], `${path}.${key}`, { ...ROUND_VALUE, fallback: typeof fallback === "number" ? fallback : 0 })]));
  // An assistant may put the task where a question goes: the first question's text is taken as the task.
  const first = Array.isArray(raw["questions"]) ? (raw["questions"] as readonly unknown[])[0] : undefined;
  const prompt = textOf(reader, pick(raw, ["text", "task", "q"]) ?? (isRaw(first) ? pick(first, PROMPT) : undefined), `${path}.text`, limits.PROMPT_MAX);
  if (prompt === "" && kind.statesTask !== true) note(reader, "error", `${path}.text`, "task-no-text");
  if (defaults["points"] === undefined && raw["points"] !== undefined && raw["points"] !== null) note(reader, "fixed", `${path}.points`, "field-ignored", { field: "points", type: kind.id });
  const round: Round = { ...base, defaults: { seconds, points: { value: limits.DEFAULT_POINTS }, questionKind: "text", answerType: "none" }, questions: [], data };
  const value = kind.maxPoints?.(round) ?? limits.DEFAULT_POINTS;
  return { ...round, questions: [{ id: job.env.ids(), kind: "text", prompt, answer: { type: "none" }, ...(value === limits.DEFAULT_POINTS ? {} : { points: { value } }) }] };
}

/** One round of the draft; `undefined` when its type is not known or it is not an object. */
function round(reader: Reader, value: unknown, index: number, options: DraftOptions, env: Env, pictures: Pictures): Round | undefined {
  const path = `rounds[${String(index)}]`;
  const inner: Reader = { issues: reader.issues, place: { round: index + 1 } };
  if (!isRaw(value)) {
    note(inner, "error", path, "wrong-type", { expected: "an object with \"type\", \"name\" and \"questions\"" });
    return undefined;
  }
  const type = typeof value["type"] === "string" && value["type"].trim() !== "" ? value["type"].trim() : "standard";
  const kind = env.registries.rounds.get(type);
  if (!kind) {
    note(inner, "error", `${path}.type`, "unknown-round-type", { type, allowed: env.registries.rounds.list().map((one) => one.id).join(", ") });
    return undefined;
  }
  let name = textOf(inner, value["name"], `${path}.name`, limits.ROUND_NAME_MAX);
  if (name === "") {
    name = options.roundName(index + 1);
    note(inner, "fixed", `${path}.name`, "name-missing", { used: name });
  }
  const job: RoundJob = { reader: inner, raw: value, path, kind, env, seconds: limits.DEFAULT_SECONDS, points: limits.DEFAULT_POINTS, hasOwnPoints: true, pictures };
  const base = { id: env.ids(), kind: kind.id, name };
  const made = roundOf(job, base);
  const rules = textOf(inner, value["rules"], `${path}.rules`, limits.RULES_MAX);
  return { ...made, ...(rules === "" ? {} : { rules }), ...(value["answersTogether"] === true ? { answersTogether: true } : {}), ...(value["manualAdvance"] === true ? { manualAdvance: true } : {}) };
}

/** Builds the round its kind asks for. */
function roundOf(job: RoundJob, base: Pick<Round, "id" | "kind" | "name">): Round {
  const shape = job.kind.shape;
  if (!shape) return standardRound(job, base);
  return shape.answerType === "none" ? taskRound(job, base) : shapedRound(job, base);
}

/** How a language may be written: its code ("bg", "bg-BG") or its name in English or in the language itself. */
const LANGUAGE_WORDS: readonly (readonly [RegExp, (typeof DRAFT_LANGUAGES)[number]])[] = [[/^(?:bg\b|bul|бълг)/i, "bg"], [/^(?:en\b|eng|англ)/i, "en"]];

/** The quiz's language: the draft's when it is one the player speaks, else the caller's. */
function languageOf(reader: Reader, value: unknown, fallback: string): string {
  if (value === undefined || value === null) return fallback;
  const given = typeof value === "string" ? value.trim() : "";
  const known = LANGUAGE_WORDS.find(([pattern]) => pattern.test(given))?.[1];
  if (known) return known;
  note(reader, "fixed", "language", "language-unknown", { value: typeof value === "string" ? value : JSON.stringify(value), used: fallback });
  return fallback;
}

/** Whether any issue stops the quiz. */
const hasError = (issues: readonly DraftIssue[]): boolean => issues.some((issue) => issue.level === "error");

/** The rounds of a draft, each read with its kind; at most `room` of them are taken (an error says when there are more). */
function rounds(reader: Reader, input: Raw, room: number, options: DraftOptions, env: Env, pictures: Pictures): readonly Round[] {
  const given = listOf(reader, input["rounds"], "rounds");
  if (given.length === 0) note(reader, "error", "rounds", "no-rounds");
  if (given.length > room) note(reader, "error", "rounds", room < limits.MAX_ROUNDS ? "rounds-room" : "too-many-rounds", { max: limits.MAX_ROUNDS, room, found: given.length });
  return given.slice(0, room).flatMap((value, index) => round(reader, value, index, options, env, pictures) ?? []);
}

/**
 * Turns a draft into a quiz. Texts are trimmed and cut and numbers brought into their ranges (each
 * reported as `fixed`); what cannot be put right is an `error`, and then no quiz is returned.
 * @param input - the draft as parsed JSON
 * @param options - the time, and the words for what the draft leaves out
 * @param env - gives the ids and the registries
 */
export function fromDraft(input: unknown, options: DraftOptions, env: Env = defaultEnv): DraftResult {
  const reader: Reader = { issues: [], place: {} };
  const pictures = newPictures();
  if (!isRaw(input)) {
    note(reader, "error", "", "not-object");
    return { issues: reader.issues, pictures: [] };
  }
  let name = textOf(reader, pick(input, ["name", "title"]), "name", limits.QUIZ_NAME_MAX);
  if (name === "") {
    name = options.quizName;
    note(reader, "fixed", "name", "name-missing", { used: name });
  }
  const list = rounds(reader, input, limits.MAX_ROUNDS, options, env, pictures);
  const teams = numberOf(reader, input["teams"], "teams", { min: limits.MIN_TEAMS, max: limits.MAX_TEAMS, fallback: limits.DEFAULT_TEAMS });
  const language = languageOf(reader, input["language"], options.language);
  if (hasError(reader.issues)) return { issues: reader.issues, pictures: [] };
  return { quiz: { id: env.ids(), name, createdAt: options.now, updatedAt: options.now, language, rounds: list, settings: { teams } }, issues: reader.issues, pictures: pictures.list };
}

/** The result of {@link roundsFromDraft}: the new rounds when nothing stops them. */
export interface RoundsResult {
  readonly rounds?: readonly Round[];
  readonly issues: readonly DraftIssue[];
  readonly pictures: readonly PendingPicture[];
}

/**
 * Reads the rounds an assistant wrote to be added to a quiz (a list of rounds, or a quiz with them):
 * the same rules as {@link fromDraft}, and no more rounds than the quiz has room for.
 * @param input - the draft as parsed JSON (`readPasted` gives a list of rounds as `{ rounds }`)
 * @param quiz - the quiz they are for
 * @param options - the words for what the draft leaves out
 * @param env - gives the ids and the registries
 */
export function roundsFromDraft(input: unknown, quiz: Quiz, options: DraftOptions, env: Env = defaultEnv): RoundsResult {
  const reader: Reader = { issues: [], place: {} };
  const pictures = newPictures();
  if (!isRaw(input)) {
    note(reader, "error", "", "not-object");
    return { issues: reader.issues, pictures: [] };
  }
  const named = (number: number): string => options.roundName(quiz.rounds.length + number);
  const list = rounds(reader, input, limits.MAX_ROUNDS - quiz.rounds.length, { ...options, roundName: named }, env, pictures);
  if (hasError(reader.issues)) return { issues: reader.issues, pictures: [] };
  return { rounds: list, issues: reader.issues, pictures: pictures.list };
}

/** The result of {@link questionsFromDraft}: the new questions when nothing stops them. */
export interface QuestionsResult {
  readonly questions?: readonly Question[];
  readonly issues: readonly DraftIssue[];
  readonly pictures: readonly PendingPicture[];
}

/**
 * Reads the questions an assistant wrote to be added to a standard round (`{ "questions": [...] }`, or a
 * round or rounds holding them): each with its own answer, the round's time and points unless it has
 * its own, and no more than the round has room for.
 * @param input - the draft as parsed JSON (`readPasted` gives `{ rounds: [{ questions }] }`)
 * @param target - the round they are for
 * @param env - gives the ids and the registries
 */
export function questionsFromDraft(input: unknown, target: Round, env: Env = defaultEnv): QuestionsResult {
  const reader: Reader = { issues: [], place: {} };
  const pictures = newPictures();
  const kind = env.registries.rounds.get(target.kind);
  if (!isRaw(input) || !kind) {
    note(reader, "error", "", "not-object");
    return { issues: reader.issues, pictures: [] };
  }
  // The questions wherever the assistant put them: on the object itself, or in the round or rounds it wrote.
  const holders = Array.isArray(input["questions"]) ? [input] : listOf(reader, input["rounds"], "rounds").filter(isRaw);
  const all = holders.flatMap((holder) => (Array.isArray(holder["questions"]) ? (holder["questions"] as readonly unknown[]) : []));
  const room = limits.MAX_QUESTIONS_PER_ROUND - target.questions.length;
  if (all.length === 0) note(reader, "error", "questions", "no-questions");
  if (all.length > room) note(reader, "error", "questions", "questions-room", { max: limits.MAX_QUESTIONS_PER_ROUND, room, found: all.length });
  const job: RoundJob = { reader, raw: { questions: all.slice(0, room) }, path: "", kind, env, seconds: target.defaults.seconds, points: target.defaults.points.value, hasOwnPoints: true, pictures };
  const list = all.slice(0, room).flatMap((value, index) => question(job, value, index, (inner, one, where) => standardAnswer(inner, one, where, env.ids)) ?? []);
  if (hasError(reader.issues)) return { issues: reader.issues, pictures: [] };
  return { questions: list, issues: reader.issues, pictures: pictures.list };
}
