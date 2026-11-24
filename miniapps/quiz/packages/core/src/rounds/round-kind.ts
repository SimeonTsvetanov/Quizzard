// The pure part of a round kind (SPEC §3.2, §10): which screens the round produces in the player and —
// for a special round — its fixed shape, what makes one of its questions finished and how the host's
// entry turns into points. Free of Zod: the player builds its round registry from these entries.
import type { Question, Round } from "../model.ts";
import type { RegistryEntry } from "../registry.ts";

/**
 * One step of the played quiz. `screen` is an open string like `kind`: a later round kind may add its
 * own screens (a wheel, a hint) and register their renderer in the player.
 */
export interface PlayerScreen {
  readonly screen: string;
  readonly roundId: string;
  /** The question shown or revealed, on the screens that have one. */
  readonly questionId?: string;
}

/** What a special round is made of: it is created with it and the edits keep it (SPEC §10). */
export interface RoundShape {
  /** Exactly this many questions: none are added, removed or moved in or out. */
  readonly count: number;
  /** The answer type every question has; the creator offers no other. */
  readonly answerType: string;
  /** Whether the questions may change places within the round. */
  readonly canReorder: boolean;
  /** Time per question of a new round of this kind, in seconds. */
  readonly seconds: number;
  /** The points of the question at this place (from 0); the creator offers no points of its own. */
  pointsAt(index: number): number;
  /** The round's own `data` when it is created; left out = none. */
  defaultData?(): Readonly<Record<string, unknown>>;
}

/**
 * How the host enters a team's points of the round when it is not simply "points": the Safe's "digits
 * right". The game keeps points only (saved games stay one number per round and team).
 */
export interface ScoreEntry {
  /** The highest number the host can enter. */
  max(round: Round): number;
  /** The points a number entered stands for. */
  toPoints(round: Round, entered: number): number;
  /** The number to show for points kept (the inverse of `toPoints`, for any points). */
  fromPoints(round: Round, points: number): number;
}

/** A round kind's registry entry. */
export interface RoundKind extends RegistryEntry {
  /** The round's screens in the order the host plays them. */
  screens(round: Round): readonly PlayerScreen[];
  /** A special round's fixed shape; left out = questions are free (a standard round). */
  readonly shape?: RoundShape;
  /** Whether the round's `data` is what this kind keeps there (an absent `data` is checked as `undefined`). */
  isDataValid?(data: Readonly<Record<string, unknown>> | undefined): boolean;
  /** What the kind asks of a question at a place beyond its answer type's own check. */
  isQuestionComplete?(question: Question, index: number): boolean;
  /** The most points a team can get in the round; left out = the sum of its questions' points. */
  maxPoints?(round: Round): number;
  /** How the host enters points; left out = as points. */
  readonly entry?: ScoreEntry;
}
