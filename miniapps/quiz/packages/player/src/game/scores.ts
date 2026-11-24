// Adding up: a team's points, the standings after a round with who moved, shared first place and
// the final order. Pure; the reducer, the views and the tests all read scores through here.
import type { GameState, Team } from "./state.ts";

/** One line of a leaderboard. */
export interface Standing {
  readonly team: Team;
  /** Points up to and including the round asked for (with the tiebreak's at the end of the game). */
  readonly total: number;
  /** Place from 1; teams level on points share a place. */
  readonly rank: number;
  /** Points of the round asked for alone. */
  readonly gained: number;
  /** Places gained since the round before (negative = lost); 0 for the first round. */
  readonly moved: number;
}

/**
 * The rounds of the game in play order.
 * @param state - the game
 */
export function roundIds(state: GameState): readonly string[] {
  return [...new Set(state.screens.flatMap((screen) => (screen.roundId === undefined ? [] : [screen.roundId])))];
}

/**
 * A team's points in one round.
 * @param state - the game
 * @param roundId - the round
 * @param teamId - the team
 */
export function roundScore(state: GameState, roundId: string, teamId: string): number {
  return state.scores[roundId]?.[teamId] ?? 0;
}

/** The rounds up to and including one; all of them when it is left out or unknown. */
function roundsUpTo(state: GameState, roundId?: string): readonly string[] {
  const all = roundIds(state);
  const at = roundId === undefined ? -1 : all.indexOf(roundId);
  return at === -1 ? all : all.slice(0, at + 1);
}

/**
 * A team's points from the rounds alone.
 * @param state - the game
 * @param teamId - the team
 * @param upTo - count only the rounds up to and including this one
 */
export function roundsTotal(state: GameState, teamId: string, upTo?: string): number {
  return roundsUpTo(state, upTo).reduce((sum, roundId) => sum + roundScore(state, roundId, teamId), 0);
}

/**
 * A team's final points: every round plus what it got at the tiebreak.
 * @param state - the game
 * @param teamId - the team
 */
export function total(state: GameState, teamId: string): number {
  return roundsTotal(state, teamId) + (state.bonus[teamId] ?? 0);
}

/** Places from 1 for totals sorted from the top; equal totals share a place. */
function ranks(totals: readonly number[]): readonly number[] {
  return totals.map((value) => totals.findIndex((other) => other === value) + 1);
}

/** Teams by points, most first; teams level on points keep the order they were entered in. */
function ordered(state: GameState, points: (teamId: string) => number): readonly { team: Team; total: number }[] {
  return state.teams.map((team) => ({ team, total: points(team.id) })).sort((a, b) => b.total - a.total);
}

/**
 * The leaderboard after a round: totals up to it, places, and how each team moved since the round before.
 * @param state - the game
 * @param roundId - the round the board follows; the last one when left out
 */
export function standings(state: GameState, roundId?: string): readonly Standing[] {
  const upTo = roundsUpTo(state, roundId);
  const current = upTo.at(-1);
  const before = upTo.at(-2);
  const now = ordered(state, (teamId) => roundsTotal(state, teamId, current));
  const nowRanks = ranks(now.map((line) => line.total));
  const earlier = before === undefined ? [] : ordered(state, (teamId) => roundsTotal(state, teamId, before));
  const earlierRanks = ranks(earlier.map((line) => line.total));
  return now.map((line, index) => {
    const was = earlierRanks[earlier.findIndex((other) => other.team.id === line.team.id)];
    const rank = nowRanks[index] ?? index + 1;
    return { team: line.team, total: line.total, rank, gained: current === undefined ? 0 : roundScore(state, current, line.team.id), moved: was === undefined ? 0 : was - rank };
  });
}

/**
 * The teams level on the most points from the rounds — before any tiebreak points.
 * @param state - the game
 */
export function leaders(state: GameState): readonly Team[] {
  const lines = ordered(state, (teamId) => roundsTotal(state, teamId));
  const top = lines[0]?.total;
  return lines.filter((line) => line.total === top).map((line) => line.team);
}

/**
 * Whether first place is shared after the rounds, so the tiebreak screen has something to settle.
 * A game without a single point (a try-through) has no tie to break.
 * @param state - the game
 */
export function isFirstShared(state: GameState): boolean {
  const level = leaders(state);
  return level.length > 1 && roundsTotal(state, level[0]?.id ?? "") > 0;
}

/**
 * The final order for the podium: by final points; among teams still level on the most points the
 * one the host named comes first and takes first place alone.
 * @param state - the game
 */
export function finalStandings(state: GameState): readonly Standing[] {
  const lines = ordered(state, (teamId) => total(state, teamId));
  const top = lines[0]?.total;
  const picked = lines.find((line) => line.team.id === state.winner && line.total === top);
  const sorted = picked ? [picked, ...lines.filter((line) => line !== picked)] : lines;
  const places = ranks(sorted.map((line) => line.total));
  return sorted.map((line, index) => {
    const shared = places[index] ?? index + 1;
    const rank = picked && line !== picked && shared === 1 ? 2 : shared;
    return { team: line.team, total: line.total, rank, gained: state.bonus[line.team.id] ?? 0, moved: 0 };
  });
}
