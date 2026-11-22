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
  /** What a right answer is worth (1 unless the quiz says otherwise, e.g. 0.5 or 2). */
  points: number;
}

/** One round of the quiz. */
export interface Round {
  /** Optional topic, e.g. "History"; empty = just "Round N". */
  name: string;
  questions: Question[];
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
  return { text: "", mark: "none", points: DEFAULT_POINTS };
}

/** Returns a new round with one blank line to write on. */
export function blankRound(): Round {
  return { name: "", questions: [blankQuestion()], bonus: 0 };
}

/** Returns a new sheet: round 1, ready to write. */
export function blankGame(): Game {
  return { version: 1, rounds: [blankRound()] };
}

/** Returns whether nobody has written, marked or re-valued the question. */
export function isBlankQuestion(question: Question): boolean {
  return question.text === "" && question.mark === "none" && question.points === DEFAULT_POINTS;
}

/** Returns whether the round holds nothing worth keeping. */
export function isBlankRound(round: Round): boolean {
  return round.name === "" && round.bonus === 0 && round.questions.every(isBlankQuestion);
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

/** Returns the points of a round: every right answer's points plus the bonus. */
export function roundPoints(round: Round): number {
  let sum = round.bonus;
  for (const question of round.questions) if (question.mark === "right") sum += question.points;
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
 * Makes sure a round ends with exactly one blank line to write on (none once it is full).
 * @returns the same round, changed in place
 */
export function keepBlankLine(round: Round): Round {
  while (round.questions.length > 1 && isBlankQuestion(round.questions.at(-1) ?? blankQuestion()) && isBlankQuestion(round.questions.at(-2) ?? { ...blankQuestion(), text: "x" })) round.questions.pop();
  const last = round.questions.at(-1);
  if ((last === undefined || !isBlankQuestion(last)) && round.questions.length < LIMITS.questions) round.questions.push(blankQuestion());
  return round;
}

/**
 * Returns what is stored: the sheet without the blank lines at the end of each round.
 * @returns null when there is nothing to keep
 */
export function toSaved(game: Game): Game | null {
  if (isBlankGame(game)) return null;
  return {
    version: 1,
    rounds: game.rounds.map((round) => {
      const questions = round.questions.map((question) => ({ ...question }));
      while (questions.length > 0 && isBlankQuestion(questions.at(-1) ?? blankQuestion())) questions.pop();
      return { name: round.name, questions, bonus: round.bonus };
    }),
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

function parseNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= LIMITS.points ? round2(value) : fallback;
}

function parseQuestion(value: unknown): Question | null {
  if (!isRecord(value)) return null;
  const { text, mark } = value;
  return {
    text: typeof text === "string" ? text.slice(0, LIMITS.answer) : "",
    mark: mark === "right" || mark === "wrong" ? mark : "none",
    points: parseNumber(value["points"], DEFAULT_POINTS),
  };
}

function parseRound(value: unknown): Round | null {
  if (!isRecord(value)) return null;
  const { name, questions } = value;
  const parsed = Array.isArray(questions) ? questions.map(parseQuestion).filter((question) => question !== null).slice(0, LIMITS.questions) : [];
  return keepBlankLine({ name: typeof name === "string" ? name.slice(0, LIMITS.name) : "", questions: parsed, bonus: parseNumber(value["bonus"], 0) });
}

/**
 * Reads a stored sheet. The value is untrusted (storage can be edited or imported): anything that is
 * not a round or a question is dropped, texts and numbers are cut to the limits.
 * @param value - what storage returned
 * @returns a sheet ready to draw: at least one round, every round ending with a blank line
 */
export function parseGame(value: unknown): Game {
  if (!isRecord(value) || !Array.isArray(value["rounds"])) return blankGame();
  const rounds = value["rounds"].map(parseRound).filter((round) => round !== null).slice(0, LIMITS.rounds);
  return rounds.length === 0 ? blankGame() : { version: 1, rounds };
}
