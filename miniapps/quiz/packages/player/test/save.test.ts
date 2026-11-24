// The saved game (AC9): what is stored, and how anything that comes back from storage is fitted
// to the quiz as it is now.
import { describe, expect, it } from "vitest";
import { SAVE_VERSION, restingTimer, restore, toSaved } from "../src/game/save.ts";
import type { GameAction, GameState } from "../src/game/state.ts";
import { step } from "../src/game/step.ts";
import { at, newGame } from "./helpers.ts";

const play = (state: GameState, ...actions: GameAction[]): GameState => actions.reduce((game, action) => step(game, action), state);
/** What storage gives back: the saved value through JSON. */
const stored = (state: GameState): unknown => JSON.parse(JSON.stringify(toSaved(state)));

describe("the saved game", () => {
  it("holds the moving parts only — not the list of screens", () => {
    const saved = toSaved(newGame([1]));
    expect(Object.keys(saved).sort()).toEqual(["auto", "bonus", "index", "nextTeam", "scores", "step", "teams", "timer", "v", "winner"]);
    expect(saved.v).toBe(SAVE_VERSION);
  });

  it("a reload in the middle continues: position, reveal, teams, scores, settings", () => {
    const fresh = newGame([2, 1]);
    const played = play(fresh, { type: "setTeamName", teamId: "t1", name: "Foxes" }, { type: "addTeam", name: "Late" }, { type: "setAuto", value: false },
      { type: "setScore", roundId: "r1", teamId: "t1", value: 2.5 }, { type: "addBonus", teamId: "t2", by: 1 }, { type: "pickWinner", teamId: "t2" }, { type: "jump", index: 7 }, { type: "next" });
    expect(at(played)).toBe("answer q1.2 revealed");
    expect(restore(fresh, stored(played))).toEqual(played);
  });

  it("a running timer comes back paused with the time it had; a cue comes back as time up", () => {
    const fresh = newGame([2]);
    const running = play(fresh, { type: "next" }, { type: "next" }, { type: "next" }, { type: "tick", ms: 3500 });
    expect(running.timer.status).toBe("running");
    expect(restore(fresh, stored(running)).timer).toEqual({ status: "paused", totalMs: 10_000, leftMs: 6500, cueMs: 0 });
    const cue = play(running, { type: "tick", ms: 99_999 });
    expect(cue.timer.status).toBe("cue");
    expect(restore(fresh, stored(cue)).timer).toEqual({ status: "done", totalMs: 10_000, leftMs: 0, cueMs: 0 });
    expect(restingTimer({ status: "idle", totalMs: 5, leftMs: 5, cueMs: 0 }).status).toBe("idle");
  });

  it("gives the new game back for anything that is not a saved game of this version", () => {
    const fresh = newGame([1]);
    for (const value of [null, undefined, "x", 5, [], {}, { v: 2, teams: fresh.teams }, { v: SAVE_VERSION }, { v: SAVE_VERSION, teams: [] }, { v: SAVE_VERSION, teams: [{ id: "t1" }, { id: "t2", name: "B" }] }]) {
      expect(restore(fresh, value)).toBe(fresh);
    }
    const twice = { ...toSaved(fresh), teams: [{ id: "t1", name: "A" }, { id: "t1", name: "B" }] };
    expect(restore(fresh, twice)).toBe(fresh);
    const thirteen = { ...toSaved(fresh), teams: Array.from({ length: 13 }, (_, index) => ({ id: `t${String(index)}`, name: "x" })) };
    expect(restore(fresh, thirteen)).toBe(fresh);
  });

  it("fits a saved game to a quiz that was edited since: the place stays inside the list, scores of rounds and teams that are gone are dropped", () => {
    const long = newGame([3, 2]);
    const played = play(long, { type: "setScore", roundId: "r2", teamId: "t1", value: 4 }, { type: "setScore", roundId: "r1", teamId: "t1", value: 1 }, { type: "jump", index: long.screens.length - 1 });
    const shorter = newGame([1]);
    const fitted = restore(shorter, stored(played));
    expect(fitted.index).toBe(shorter.screens.length - 1);
    expect(fitted.screens).toBe(shorter.screens);
    expect(fitted.scores).toEqual({ r1: { t1: 1 } });
  });

  it("cleans what it reads: wrong numbers, strange scores, an unknown winner, a timer of another screen", () => {
    const fresh = newGame([1]);
    const dirty = {
      ...toSaved(fresh), index: 2.5, step: 7, nextTeam: "many", winner: "t9", auto: "yes",
      scores: { r1: { t1: 5000, t2: "3", t9: 2, t3: Number.NaN }, r9: { t1: 1 }, r2: "x" }, bonus: { t1: -3, t2: 1.5 },
      timer: { status: "running", totalMs: 123, leftMs: 50, cueMs: 0 },
    };
    const game = restore(fresh, JSON.parse(JSON.stringify(dirty)));
    expect(game).toMatchObject({ index: 0, step: 0, nextTeam: 4, winner: null, auto: true, scores: { r1: { t1: 999 } }, bonus: { t1: 0, t2: 1.5 } });
    expect(game.timer).toEqual(fresh.timer);
    const onQuestion = { ...toSaved(fresh), index: 3, timer: { status: "weird", totalMs: 10_000, leftMs: 4000, cueMs: 0 } };
    expect(restore(fresh, onQuestion).timer).toEqual({ status: "idle", totalMs: 10_000, leftMs: 10_000, cueMs: 0 });
    const overTime = { ...toSaved(fresh), index: 3, step: 1, timer: { status: "paused", totalMs: 10_000, leftMs: 999_999, cueMs: 0 } };
    expect(restore(fresh, overTime)).toMatchObject({ step: 0, timer: { status: "paused", leftMs: 10_000 } });
  });

  it("team names from storage are cut to the longest name", () => {
    const fresh = newGame([1]);
    const saved = { ...toSaved(fresh), teams: [{ id: "a", name: "x".repeat(200) }, { id: "b", name: "B" }] };
    expect(restore(fresh, saved).teams[0]?.name).toHaveLength(40);
  });
});
