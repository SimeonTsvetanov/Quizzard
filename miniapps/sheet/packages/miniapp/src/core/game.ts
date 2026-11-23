// The answer sheet's model and arithmetic: rounds of questions, each marked right or wrong and worth
// some points, plus a bonus per round. Pure — no DOM, no storage, no clock.

/** Hard limits of one sheet; more than a quiz night ever needs, small enough to store and draw. */
export const LIMITS = {
  rounds: 40,
  questions: 60,
  /** Characters of one answer. */
  answer: 120,
  /** Characters of a round's name. */
  name: 40,
  /** Largest points of one question or bonus, either sign. */
  points: 999,
} as const;

/** How a question was judged; `none` = not yet. */
export type Mark = "none" | "right" | "wrong";

/** One line of a round. */
export interface Question {
  /** What the team wrote. */
  text: string;
  mark: Mark;
  /** What this question is worth when it differs from the round's points; null = the round's. */
  points: number | null;
}

/** One round of the quiz. */
export interface Round {
  /** Optional topic, e.g. "History"; empty = just "Round N". */
  name: string;
  questions: Question[];
  /** What a right answer is worth in this round (1 unless the quiz says otherwise, e.g. 2 or 0.5). */
  points: number;
  /** Extra points for the round, either sign (a bonus, a correction by the quiz master). */
  bonus: number;
}

/** A whole quiz night of one team. */
export interface Game {
  version: 1;
  rounds: Round[];
}

/** What one right answer is worth unless changed. */
export const DEFAULT_POINTS = 1;

const round2 = (value: number): number => Math.round(value * 100) / 100;

/** Returns a new question nobody has touched. */
export function blankQuestion(): Question {
  return { text: "", mark: "none", points: null };
}

/** Returns a new round with one line to write on. */
export function blankRound(): Round {
  return { name: "", questions: [blankQuestion()], points: DEFAULT_POINTS, bonus: 0 };
}

/** Returns a new sheet: round 1, ready to write. */
export function blankGame(): Game {
  return { version: 1, rounds: [blankRound()] };
}

/** Returns whether nobody has written, marked or re-valued the question. */
export function isBlankQuestion(question: Question): boolean {
  return question.text === "" && question.mark === "none" && question.points === null;
}

/** Returns whether the round holds nothing worth keeping. */
export function isBlankRound(round: Round): boolean {
  return round.name === "" && round.bonus === 0 && round.points === DEFAULT_POINTS && round.questions.every(isBlankQuestion);
}

/** Returns whether the whole sheet is untouched. */
export function isBlankGame(game: Game): boolean {
  return game.rounds.every(isBlankRound);
}

/**
 * Reads points typed by a person.
 * @param raw - e.g. `"1"`, `"0.5"`, `"0,5"`, `"-2"`, `"+3"`; spaces around are ignored
 * @returns the number rounded to two decimals, or null when it is not a number within ±{@link LIMITS.points}
 */
export function parsePoints(raw: string): number | null {
  const text = raw.trim().replace(",", ".").replace(/^\+/, "").replace(/^[−–]/, "-");
  if (!/^-?(\d+(\.\d*)?|\.\d+)$/.test(text)) return null;
  const value = round2(Number(text));
  return Math.abs(value) <= LIMITS.points ? value : null;
}

/**
 * Writes points the way the language does (`6.5` / `6,5`), at most two decimals, no trailing zeros.
 * @param value - the points
 * @param lang - BCP 47 language of the screen
 */
export function formatPoints(value: number, lang: string): string {
  return new Intl.NumberFormat(lang, { maximumFractionDigits: 2, useGrouping: false }).format(round2(value) + 0);
}

/** Returns what a right answer to the question gives: its own points, else the round's. */
export function worthOf(round: Round, question: Question): number {
  return question.points ?? round.points;
}

/**
 * Sets what one question is worth; the round's own value means "no exception".
 * @param round - the question's round
 * @param question - changed in place
 * @param value - the points typed for it
 */
export function setWorth(round: Round, question: Question, value: number): void {
  question.points = value === round.points ? null : value;
}

/**
 * Applies points a person typed at the end of a line. The number there is what the line brings, so
 * typing one says "we got this": the line becomes right with these points; typing 0 marks it wrong.
 * @param round - the question's round
 * @param question - changed in place
 * @param value - the points typed
 */
export function typePoints(round: Round, question: Question, value: number): void {
  if (value === 0) {
    question.mark = "wrong";
    return;
  }
  setWorth(round, question, value);
  question.mark = "right";
}

/** Returns the number shown at the end of a line: 0 for a wrong answer, else what a right one gives. */
export function shownPoints(round: Round, question: Question): number {
  return question.mark === "wrong" ? 0 : worthOf(round, question);
}

/** Returns the points of a round: every right answer's worth plus the bonus. */
export function roundPoints(round: Round): number {
  let sum = round.bonus;
  for (const question of round.questions) if (question.mark === "right") sum += worthOf(round, question);
  return round2(sum);
}

/** Returns how many answers of a round are right and how many were judged at all. */
export function roundCounts(round: Round): { right: number; judged: number } {
  let right = 0;
  let judged = 0;
  for (const question of round.questions) {
    if (question.mark === "right") right += 1;
    if (question.mark !== "none") judged += 1;
  }
  return { right, judged };
}

/** Returns the running total of the whole sheet. */
export function gameTotal(game: Game): number {
  return round2(game.rounds.reduce((sum, round) => sum + roundPoints(round), 0));
}

/**
 * Adds a line at the end of a round (the "+" under the answers, or Enter on the last line). Lines are
 * never added on their own (Moni 2026-11-23: no empty line that is always there).
 * @returns the new line, or null when the round is full
 */
export function addLine(round: Round): Question | null {
  if (round.questions.length >= LIMITS.questions) return null;
  const line = blankQuestion();
  round.questions.push(line);
  return line;
}

/**
 * Returns what is stored: the sheet as it is on screen.
 * @returns null when there is nothing to keep
 */
export function toSaved(game: Game): Game | null {
  if (isBlankGame(game)) return null;
  return { version: 1, rounds: game.rounds.map((round) => ({ name: round.name, questions: round.questions.map((question) => ({ ...question })), points: round.points, bonus: round.bonus })) };
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

function parseNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= LIMITS.points ? round2(value) : fallback;
}

function parseQuestion(value: unknown, roundWorth: number): Question | null {
  if (!isRecord(value)) return null;
  const { text, mark } = value;
  const worth = parseNumber(value["points"], roundWorth);
  return {
    text: typeof text === "string" ? text.slice(0, LIMITS.answer) : "",
    mark: mark === "right" || mark === "wrong" ? mark : "none",
    points: worth === roundWorth ? null : worth,
  };
}

function parseRound(value: unknown): Round | null {
  if (!isRecord(value)) return null;
  const { name, questions } = value;
  const worth = parseNumber(value["points"], DEFAULT_POINTS);
  const parsed = Array.isArray(questions) ? questions.map((question) => parseQuestion(question, worth)).filter((question) => question !== null).slice(0, LIMITS.questions) : [];
  // A round always has a line to write on.
  return { name: typeof name === "string" ? name.slice(0, LIMITS.name) : "", questions: parsed.length === 0 ? [blankQuestion()] : parsed, points: worth, bonus: parseNumber(value["bonus"], 0) };
}

/**
 * Reads a stored sheet. The value is untrusted (storage can be edited or imported): anything that is
 * not a round or a question is dropped, texts and numbers are cut to the limits.
 * @param value - what storage returned
 * @returns a sheet ready to draw: at least one round, every round with at least one line
 */
export function parseGame(value: unknown): Game {
  if (!isRecord(value) || !Array.isArray(value["rounds"])) return blankGame();
  const rounds = value["rounds"].map(parseRound).filter((round) => round !== null).slice(0, LIMITS.rounds);
  return rounds.length === 0 ? blankGame() : { version: 1, rounds };
}
