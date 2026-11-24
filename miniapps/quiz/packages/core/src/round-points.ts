// What a round is worth and how its points are entered (SPEC §10) — asked of the round kind, so the
// player's score entry, its Scores dialog and the creator's lists never switch on a kind. Free of Zod:
// the player imports it through `play.ts`.
import { effectivePoints } from "./effective.ts";
import type { Round } from "./model.ts";
import type { Registry } from "./registry.ts";
import { createRoundKinds } from "./rounds/kinds.ts";
import type { RoundKind, ScoreEntry } from "./rounds/round-kind.ts";

/** The round kinds these functions ask when no other registry is given. */
const builtIn = createRoundKinds();

type RoundKinds = Pick<Registry<RoundKind>, "get">;

/**
 * The most points a team can get in a round: the kind's own number, else its questions' points added up.
 * @param round - the round
 * @param rounds - the round kinds
 */
export function roundMaxPoints(round: Round, rounds: RoundKinds = builtIn): number {
  const kind = rounds.get(round.kind);
  if (kind?.maxPoints) return kind.maxPoints(round);
  return round.questions.reduce((sum, question) => sum + effectivePoints(round, question).value, 0);
}

/**
 * How the host enters a team's points of the round, or `null` when they are entered as points.
 * @param round - the round
 * @param rounds - the round kinds
 */
export function scoreEntryOf(round: Round, rounds: RoundKinds = builtIn): ScoreEntry | null {
  return rounds.get(round.kind)?.entry ?? null;
}

/**
 * The highest points the score entry takes for the round: a special round's most, else `fallback`.
 * @param round - the round
 * @param fallback - the limit of a free round (the player's highest score)
 * @param rounds - the round kinds
 */
export function scoreCap(round: Round, fallback: number, rounds: RoundKinds = builtIn): number {
  return rounds.get(round.kind)?.shape ? roundMaxPoints(round, rounds) : fallback;
}

/**
 * Points as the round keeps them: through the kind's entry (a Safe's 6 is "5 digits", so 5 + bonus),
 * then never above what the round can give.
 * @param round - the round
 * @param points - the points typed
 * @param fallback - the limit of a free round
 * @param rounds - the round kinds
 */
export function cleanRoundPoints(round: Round, points: number, fallback: number, rounds: RoundKinds = builtIn): number {
  const entry = scoreEntryOf(round, rounds);
  const value = entry ? entry.toPoints(round, entry.fromPoints(round, points)) : points;
  return Math.max(0, Math.min(scoreCap(round, fallback, rounds), value));
}
