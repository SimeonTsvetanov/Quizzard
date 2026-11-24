// Properties of the game's reducer over any sequence of moves (SPEC §6, AC9): the game never leaves
// its list of screens, back undoes next, the totals are the sums of what was entered, a saved game
// comes back as it was, and no move ever changes the game it was given.
import fc from "fast-check";
import { MAX_TEAMS, MIN_TEAMS } from "@simeonts/quizzard-quiz-core/play";
import { describe, expect, it } from "vitest";
import { createGame } from "../src/game/create.ts";
import { restingTimer, restore, toSaved } from "../src/game/save.ts";
import { finalStandings, roundIds, roundScore, roundsTotal, standings, total } from "../src/game/scores.ts";
import { MAX_SCORE, type GameAction, type GameState } from "../src/game/state.ts";
import { step } from "../src/game/step.ts";
import { deepFreeze, quizFile } from "./helpers.ts";

const teamId = fc.integer({ min: 1, max: 14 }).map((n) => `t${String(n)}`);
const roundId = fc.integer({ min: 1, max: 4 }).map((n) => `r${String(n)}`);
const simple = (type: "next" | "back" | "reveal" | "timerStart" | "timerPause" | "timerToggle" | "timerReset" | "restart"): fc.Arbitrary<GameAction> => fc.constant({ type });

/** Any move, valid or not: unknown teams and rounds, wild numbers, huge ticks. */
const anyAction: fc.Arbitrary<GameAction> = fc.oneof(
  { weight: 6, arbitrary: simple("next") },
  { weight: 3, arbitrary: simple("back") },
  simple("reveal"), simple("timerStart"), simple("timerPause"), simple("timerToggle"), simple("timerReset"),
  { weight: 1, arbitrary: simple("restart") },
  fc.record({ type: fc.constant("jump" as const), index: fc.oneof(fc.integer({ min: -3, max: 60 }), fc.double()) }),
  { weight: 4, arbitrary: fc.record({ type: fc.constant("tick" as const), ms: fc.oneof(fc.integer({ min: -10, max: 20_000 }), fc.double()) }) },
  fc.record({ type: fc.constant("setTeamName" as const), teamId, name: fc.string({ maxLength: 60 }) }),
  fc.record({ type: fc.constant("addTeam" as const), name: fc.string({ maxLength: 12 }) }),
  fc.record({ type: fc.constant("removeTeam" as const), teamId }),
  { weight: 4, arbitrary: fc.record({ type: fc.constant("setScore" as const), roundId, teamId, value: fc.oneof(fc.integer({ min: -5, max: 1200 }), fc.double()) }) },
  fc.record({ type: fc.constant("addBonus" as const), teamId, by: fc.oneof(fc.integer({ min: -3, max: 3 }), fc.double()) }),
  fc.record({ type: fc.constant("pickWinner" as const), teamId: fc.option(teamId, { nil: null }) }),
  fc.record({ type: fc.constant("setAuto" as const), value: fc.boolean() }),
);

/** A new game of 1–3 rounds with 0–4 questions each and 2–6 teams, frozen. */
const anyGame = fc.record({ shape: fc.array(fc.integer({ min: 0, max: 4 }), { minLength: 1, maxLength: 3 }), teams: fc.integer({ min: 2, max: 6 }) })
  .map(({ shape, teams }) => deepFreeze(createGame(quizFile(shape, teams), { teamName: (n) => `Team ${String(n)}` })));

const actions = fc.array(anyAction, { maxLength: 60 });

/** Plays the moves on a frozen game; every state on the way is frozen too, so a mutation would throw. */
function run(game: GameState, moves: readonly GameAction[]): GameState {
  return moves.reduce((state, action) => deepFreeze(step(state, action)), game);
}

/** What must hold for every game, whatever was done to it. */
function assertSound(state: GameState): void {
  const screen = state.screens[state.index];
  expect(Number.isInteger(state.index) && state.index >= 0 && state.index < state.screens.length).toBe(true);
  expect(screen).toBeDefined();
  expect(state.step).toBeGreaterThanOrEqual(0);
  expect(state.step).toBeLessThanOrEqual(screen?.steps ?? 0);
  expect(state.teams.length).toBeGreaterThanOrEqual(MIN_TEAMS);
  expect(state.teams.length).toBeLessThanOrEqual(MAX_TEAMS);
  expect(new Set(state.teams.map((team) => team.id)).size).toBe(state.teams.length);
  expect(state.timer.totalMs).toBe((screen?.seconds ?? 0) * 1000);
  expect(state.timer.leftMs).toBeGreaterThanOrEqual(0);
  expect(state.timer.leftMs).toBeLessThanOrEqual(state.timer.totalMs);
  if (state.timer.totalMs === 0) expect(state.timer.status).toBe("idle");
  expect(state.winner === null || state.teams.some((team) => team.id === state.winner)).toBe(true);
}

describe("game properties", () => {
  it("the position never leaves the list and the game stays sound after any moves", () => {
    fc.assert(fc.property(anyGame, actions, (game, moves) => {
      let state = game;
      for (const action of moves) {
        state = deepFreeze(step(state, action));
        assertSound(state);
      }
    }), { numRuns: 300 });
  });

  it("no move changes the game it was given (inputs are frozen) and the list of screens is never replaced", () => {
    fc.assert(fc.property(anyGame, actions, (game, moves) => {
      expect(run(game, moves).screens).toBe(game.screens);
    }));
  });

  it("back is the inverse of next: wherever next moved, back returns to the same screen and reveal", () => {
    fc.assert(fc.property(anyGame, actions, (game, moves) => {
      const state = run(game, moves);
      const next = step(state, { type: "next" });
      if (next === state) return;
      const back = step(next, { type: "back" });
      expect([back.index, back.step]).toEqual([state.index, state.step]);
    }), { numRuns: 300 });
  });

  it("next is the inverse of back: wherever back moved, next returns to the same screen and reveal", () => {
    fc.assert(fc.property(anyGame, actions, (game, moves) => {
      const state = run(game, moves);
      const back = step(state, { type: "back" });
      if (back === state) return;
      const next = step(back, { type: "next" });
      expect([next.index, next.step]).toEqual([state.index, state.step]);
    }), { numRuns: 300 });
  });

  it("next from the title reaches the podium in a bounded number of moves, and back returns to the title", () => {
    fc.assert(fc.property(anyGame, (game) => {
      const bound = game.screens.length * 2 + 1;
      let state = game;
      for (let n = 0; n < bound; n += 1) state = step(state, { type: "next" });
      expect(state.index).toBe(state.screens.length - 1);
      for (let n = 0; n < bound; n += 1) state = step(state, { type: "back" });
      expect([state.index, state.step]).toEqual([0, 0]);
    }));
  });

  it("scores sum: a team's total is its rounds plus its tiebreak points, each score inside 0–999 in halves", () => {
    fc.assert(fc.property(anyGame, actions, (game, moves) => {
      const state = run(game, moves);
      const rounds = roundIds(state);
      for (const team of state.teams) {
        const perRound = rounds.map((id) => roundScore(state, id, team.id));
        for (const points of perRound) {
          expect(points).toBeGreaterThanOrEqual(0);
          expect(points).toBeLessThanOrEqual(MAX_SCORE);
          expect(Number.isInteger(points * 2)).toBe(true);
        }
        const sum = perRound.reduce((a, b) => a + b, 0);
        expect(roundsTotal(state, team.id)).toBe(sum);
        expect(total(state, team.id)).toBe(sum + (state.bonus[team.id] ?? 0));
      }
      // Only rounds and teams of the game hold points.
      expect(Object.keys(state.scores).every((id) => rounds.includes(id))).toBe(true);
      const ids = new Set(state.teams.map((team) => team.id));
      expect(Object.values(state.scores).flatMap((round) => Object.keys(round)).every((id) => ids.has(id))).toBe(true);
    }), { numRuns: 300 });
  });

  it("standings list every team once, from most points to fewest, places from 1 without a gap after ties", () => {
    fc.assert(fc.property(anyGame, actions, (game, moves) => {
      const state = run(game, moves);
      for (const lines of [standings(state), finalStandings(state), ...roundIds(state).map((id) => standings(state, id))]) {
        expect(lines.map((line) => line.team.id).sort()).toEqual(state.teams.map((team) => team.id).sort());
        expect(lines[0]?.rank).toBe(1);
        lines.forEach((line, index) => {
          const before = lines[index - 1];
          if (!before) return;
          expect(line.total).toBeLessThanOrEqual(before.total);
          expect(line.rank).toBeGreaterThanOrEqual(before.rank);
          expect(line.rank).toBeLessThanOrEqual(index + 1);
        });
      }
    }));
  });

  it("a saved state restores: through JSON and back it is the same game, its timer at rest", () => {
    fc.assert(fc.property(anyGame, actions, (game, moves) => {
      const state = run(game, moves);
      const restored = restore(game, JSON.parse(JSON.stringify(toSaved(state))));
      expect(restored).toEqual({ ...state, timer: restingTimer(state.timer) });
      assertSound(restored);
    }), { numRuns: 300 });
  });

  it("restore never throws and always gives a sound game, whatever storage holds", () => {
    fc.assert(fc.property(anyGame, fc.jsonValue(), (game, value) => {
      assertSound(restore(game, value));
    }));
    fc.assert(fc.property(anyGame, actions, fc.dictionary(fc.constantFrom("index", "step", "teams", "nextTeam", "scores", "bonus", "winner", "auto", "timer"), fc.jsonValue()), (game, moves, damage) => {
      const saved = { ...(JSON.parse(JSON.stringify(toSaved(run(game, moves)))) as object), ...damage };
      assertSound(restore(game, saved));
    }));
  });
});
