// Adding up and ordering: standings after a round with who moved, shared first place, the podium.
import { describe, expect, it } from "vitest";
import { finalStandings, isFirstShared, leaders, roundIds, roundScore, roundsTotal, standings, total } from "../src/game/scores.ts";
import type { GameAction, GameState } from "../src/game/state.ts";
import { step } from "../src/game/step.ts";
import { newGame } from "./helpers.ts";

/** A game of 3 rounds and 4 teams with the given points per round: `{ r1: [t1, t2, t3, t4], … }`. */
function scored(points: Readonly<Record<string, readonly number[]>>, more: readonly GameAction[] = []): GameState {
  const actions: GameAction[] = Object.entries(points).flatMap(([roundId, values]) => values.map((value, index) => ({ type: "setScore" as const, roundId, teamId: `t${String(index + 1)}`, value })));
  return [...actions, ...more].reduce((game, action) => step(game, action), newGame([1, 1, 1], 4));
}

const line = (lines: ReturnType<typeof standings>): string[] => lines.map((entry) => `${String(entry.rank)}:${entry.team.id}=${String(entry.total)}(${entry.moved > 0 ? "+" : ""}${String(entry.moved)})`);

describe("scores", () => {
  it("rounds are listed in play order; a missing score is 0", () => {
    const game = scored({ r2: [3, 0, 1, 0] });
    expect(roundIds(game)).toEqual(["r1", "r2", "r3"]);
    expect(roundScore(game, "r1", "t1")).toBe(0);
    expect(roundScore(game, "r2", "t1")).toBe(3);
    expect(roundScore(game, "r9", "t1")).toBe(0);
  });

  it("totals add the rounds up to one, or all; the final total adds the tiebreak points", () => {
    const game = scored({ r1: [1, 2, 3, 4], r2: [2, 2, 2, 2], r3: [0.5, 0, 0, 0] }, [{ type: "addBonus", teamId: "t1", by: 2 }]);
    expect(roundsTotal(game, "t1", "r1")).toBe(1);
    expect(roundsTotal(game, "t1", "r2")).toBe(3);
    expect(roundsTotal(game, "t1")).toBe(3.5);
    expect(roundsTotal(game, "t1", "nope")).toBe(3.5);
    expect(total(game, "t1")).toBe(5.5);
    expect(total(game, "t9")).toBe(0);
  });

  it("standings after the first round: by points, level teams share a place and keep their entry order, nobody has moved", () => {
    const game = scored({ r1: [2, 5, 2, 0] });
    expect(line(standings(game, "r1"))).toEqual(["1:t2=5(0)", "2:t1=2(0)", "2:t3=2(0)", "4:t4=0(0)"]);
    expect(standings(game, "r1").map((entry) => entry.gained)).toEqual([5, 2, 2, 0]);
  });

  it("standings after a later round count only the rounds so far and say who moved up or down", () => {
    const game = scored({ r1: [2, 5, 2, 0], r2: [4, 0, 1, 6], r3: [9, 9, 9, 9] });
    expect(line(standings(game, "r2"))).toEqual(["1:t1=6(+1)", "1:t4=6(+3)", "3:t2=5(-2)", "4:t3=3(-2)"]);
    expect(standings(game, "r2").map((entry) => entry.gained)).toEqual([4, 6, 0, 1]);
    expect(line(standings(game)).map((text) => text.split("(")[0])).toEqual(["1:t1=15", "1:t4=15", "3:t2=14", "4:t3=12"]);
  });

  it("first place is shared when several teams have the most points — but not when nobody has any", () => {
    expect(isFirstShared(scored({ r1: [3, 3, 1, 0] }))).toBe(true);
    expect(leaders(scored({ r1: [3, 3, 1, 0] })).map((team) => team.id)).toEqual(["t1", "t2"]);
    expect(isFirstShared(scored({ r1: [3, 2, 1, 0] }))).toBe(false);
    expect(isFirstShared(scored({}))).toBe(false);
    expect(leaders(scored({}))).toHaveLength(4);
  });

  it("tiebreak points do not hide the tie the screen is there to settle", () => {
    const game = scored({ r1: [3, 3, 1, 0] }, [{ type: "addBonus", teamId: "t2", by: 1 }]);
    expect(isFirstShared(game)).toBe(true);
    expect(finalStandings(game).map((entry) => `${String(entry.rank)}:${entry.team.id}=${String(entry.total)}`)).toEqual(["1:t2=4", "2:t1=3", "3:t3=1", "4:t4=0"]);
    expect(finalStandings(game)[0]?.gained).toBe(1);
  });

  it("the podium without a decision: level teams share first place", () => {
    expect(finalStandings(scored({ r1: [3, 3, 1, 0] })).map((entry) => `${String(entry.rank)}:${entry.team.id}`)).toEqual(["1:t1", "1:t2", "3:t3", "4:t4"]);
  });

  it("the podium after the host named the winner: that team is first alone, the others level with it second", () => {
    const game = scored({ r1: [3, 3, 3, 0] }, [{ type: "pickWinner", teamId: "t3" }]);
    expect(finalStandings(game).map((entry) => `${String(entry.rank)}:${entry.team.id}`)).toEqual(["1:t3", "2:t1", "2:t2", "4:t4"]);
  });

  it("a named winner who is not level on the most points changes nothing", () => {
    const game = scored({ r1: [3, 3, 1, 0] }, [{ type: "pickWinner", teamId: "t3" }]);
    expect(finalStandings(game).map((entry) => `${String(entry.rank)}:${entry.team.id}`)).toEqual(["1:t1", "1:t2", "3:t3", "4:t4"]);
  });
});
