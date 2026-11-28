// What the AI windows remember (screens/ai/): the person's last choices in a form and the assistant they
// give prompts to — each read back through a check, so a broken or hand-made value never reaches a form —
// and which job a prompt was last given for, so an answer shared back from another app goes to that job.
import type { AnswerChoice, AudienceChoice, DifficultyChoice, QuizWishes, SpecialChoice } from "@simeonts/quizzard-quiz-core/draft";

/** The mini-app's own small preferences (contract `storage.prefs`). */
interface Prefs {
  get<T>(key: string, fallback: T): T;
  set(key: string, value: unknown): boolean;
}

const WISHES = "ai.wishes";
const COUNT = "ai.count";
const ASSISTANT = "ai.assistant";
const LAST_JOB = "ai.lastJob";

export const AUDIENCES: readonly AudienceChoice[] = ["friends", "colleagues", "family", "children", "teens", "experts"];
export const DIFFICULTIES: readonly DifficultyChoice[] = ["easy", "medium", "hard", "mixed"];
export const ANSWERS: readonly AnswerChoice[] = ["open", "choice", "trueFalse"];
export const SPECIALS: readonly SpecialChoice[] = ["pyramid", "safe", "laugh", "task"];
export const PER_ROUND: readonly number[] = [3, 4, 5, 6, 7, 8, 10, 12, 15, 20];
export const NEW_QUESTIONS: readonly number[] = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20];
export const SECONDS: readonly number[] = [10, 15, 20, 30, 45, 60, 90, 120];
export const POINTS: readonly number[] = [1, 2, 3, 5];
export const ASSISTANTS = ["chatgpt", "gemini", "claude", "other"] as const;
export type Assistant = (typeof ASSISTANTS)[number];

/** What a form remembers: everything but the quiz's own name and language. */
export type KeptWishes = Omit<QuizWishes, "name" | "language" | "ui">;

const DEFAULTS: KeptWishes = { topic: "", audience: "friends", difficulty: "medium", rounds: 3, perRound: 6, answers: ["open", "choice", "trueFalse"], seconds: 30, points: 1, specials: [], pictures: false, extra: "" };

/** One of the allowed values, else the fallback. */
function oneOf<T>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.find((one) => one === value) ?? fallback;
}

/** The allowed values a stored list holds, or the fallback when it is no list. */
function someOf<T>(value: unknown, allowed: readonly T[], fallback: readonly T[]): T[] {
  return Array.isArray(value) ? allowed.filter((one) => value.includes(one)) : [...fallback];
}

/** A stored text, cut to a length. */
const text = (value: unknown): string => (typeof value === "string" ? value.slice(0, 300) : "");

/**
 * The last choices of the forms, each checked; what is missing or odd takes the default.
 * @param prefs - the mini-app's preferences
 */
export function readWishes(prefs: Prefs): KeptWishes {
  const kept = prefs.get<unknown>(WISHES, null);
  if (typeof kept !== "object" || kept === null || Array.isArray(kept)) return DEFAULTS;
  const raw = kept as Record<string, unknown>;
  const answers = someOf(raw["answers"], ANSWERS, DEFAULTS.answers);
  return {
    topic: text(raw["topic"]),
    audience: oneOf(raw["audience"], AUDIENCES, DEFAULTS.audience),
    difficulty: oneOf(raw["difficulty"], DIFFICULTIES, DEFAULTS.difficulty),
    rounds: oneOf(raw["rounds"], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], DEFAULTS.rounds),
    perRound: oneOf(raw["perRound"], PER_ROUND, DEFAULTS.perRound),
    answers: answers.length > 0 ? answers : DEFAULTS.answers,
    seconds: oneOf(raw["seconds"], SECONDS, DEFAULTS.seconds),
    points: oneOf(raw["points"], POINTS, DEFAULTS.points),
    specials: someOf(raw["specials"], SPECIALS, DEFAULTS.specials),
    pictures: raw["pictures"] === true,
    extra: text(raw["extra"]),
  };
}

/**
 * Keeps the choices a form shows; what it does not show stays as it was (the questions form has no rounds).
 * @param prefs - the mini-app's preferences
 * @param shown - the choices of the fields on show
 */
export function writeWishes(prefs: Prefs, shown: Partial<KeptWishes>): void {
  prefs.set(WISHES, { ...readWishes(prefs), ...shown });
}

/** The last number of new questions asked for a round (a list of its own: 1 and 2 are not a round's size). */
export function readCount(prefs: Prefs): number {
  return oneOf(prefs.get<unknown>(COUNT, 5), NEW_QUESTIONS, 5);
}

/** Keeps the number of new questions. */
export function writeCount(prefs: Prefs, count: number): void {
  prefs.set(COUNT, count);
}

/** The assistant prompts are given to; ChatGPT until one is chosen. */
export function readAssistant(prefs: Prefs): Assistant {
  return oneOf(prefs.get<unknown>(ASSISTANT, "chatgpt"), ASSISTANTS, "chatgpt");
}

/** Keeps the chosen assistant. */
export function writeAssistant(prefs: Prefs, assistant: Assistant): void {
  prefs.set(ASSISTANT, assistant);
}

/** The job a prompt was last given for: its kind, and the quiz and round it was about. */
export interface LastJob {
  readonly kind: "quiz" | "rounds" | "questions" | "check";
  readonly quizId?: string;
  readonly roundId?: string;
}

/** The job a prompt was last given for; a new quiz when none is known. */
export function readLastJob(prefs: Prefs): LastJob {
  const kept = prefs.get<unknown>(LAST_JOB, null);
  if (typeof kept !== "object" || kept === null) return { kind: "quiz" };
  const raw = kept as Record<string, unknown>;
  const kind = oneOf(raw["kind"], ["quiz", "rounds", "questions", "check"] as const, "quiz");
  const id = (value: unknown): string | undefined => (typeof value === "string" && value !== "" ? value : undefined);
  const quizId = id(raw["quizId"]);
  const roundId = id(raw["roundId"]);
  return { kind, ...(quizId === undefined ? {} : { quizId }), ...(roundId === undefined ? {} : { roundId }) };
}

/** Keeps the job a prompt was just given for. */
export function writeLastJob(prefs: Prefs, job: LastJob): void {
  prefs.set(LAST_JOB, job);
}
