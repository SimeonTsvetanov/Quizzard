// The game's reducer: `step(state, action)` gives the next state and never changes its input. Moves
// that cannot be made (back on the first screen, a thirteenth team, a score for an unknown round)
// return the SAME state object, so callers can tell with `next === state`. Screens are asked from
// the screen-kind registry; nothing here names one.
import { type Registry, MAX_TEAMS, MIN_TEAMS, clamp, cut } from "@simeonts/quizzard-quiz-core/play";
import { type ScreenKind, screenKinds } from "./kinds.ts";
import { roundIds } from "./scores.ts";
import { CUE_MS, MAX_SCORE, TEAM_NAME_MAX, type GameAction, type GameState, type Timer, freshTimer } from "./state.ts";

type Kinds = Registry<ScreenKind>;

/** Handles one action type. */
type Handler<T extends GameAction["type"]> = (state: GameState, action: Extract<GameAction, { type: T }>, kinds: Kinds) => GameState;

function isShown(state: GameState, index: number, kinds: Kinds): boolean {
  const screen = state.screens[index];
  return screen !== undefined && !(kinds.get(screen.screen)?.isSkipped?.(state) ?? false);
}

/** The nearest screen from `from` in a direction that is not left out; `null` at the end of the list. */
function seek(state: GameState, from: number, direction: 1 | -1, kinds: Kinds): number | null {
  for (let index = from; index >= 0 && index < state.screens.length; index += direction) {
    if (isShown(state, index, kinds)) return index;
  }
  return null;
}

/** Shows a screen: its reveals at `step`, its timer full — running only when the game got here by going on. */
function enter(state: GameState, index: number, step: number, isForward: boolean): GameState {
  const seconds = state.screens[index]?.seconds ?? 0;
  return { ...state, index, step, timer: freshTimer(seconds, isForward && state.auto) };
}

function next(state: GameState, kinds: Kinds): GameState {
  const steps = state.screens[state.index]?.steps ?? 0;
  if (state.step < steps) return { ...state, step: state.step + 1 };
  const index = seek(state, state.index + 1, 1, kinds);
  return index === null ? state : enter(state, index, 0, true);
}

function back(state: GameState, kinds: Kinds): GameState {
  if (state.step > 0) return { ...state, step: state.step - 1 };
  const index = seek(state, state.index - 1, -1, kinds);
  // A screen gone back to is shown as it was left: with everything revealed.
  return index === null ? state : enter(state, index, state.screens[index]?.steps ?? 0, false);
}

function jump(state: GameState, to: number, kinds: Kinds): GameState {
  const wanted = clamp(Math.trunc(to), 0, state.screens.length - 1);
  const index = seek(state, wanted, 1, kinds) ?? seek(state, wanted, -1, kinds);
  return index === null ? state : enter(state, index, 0, false);
}

function withTimer(state: GameState, change: Partial<Timer>): GameState {
  return { ...state, timer: { ...state.timer, ...change } };
}

function startTimer(state: GameState): GameState {
  const { status, totalMs } = state.timer;
  if (totalMs === 0 || status === "running") return state;
  // Started again after the time ran out: from the top.
  if (status === "done" || status === "cue") return withTimer(state, { status: "running", leftMs: totalMs, cueMs: 0 });
  return withTimer(state, { status: "running" });
}

function pauseTimer(state: GameState): GameState {
  if (state.timer.status === "running") return withTimer(state, { status: "paused" });
  // Stopping the cue keeps the game on this screen.
  if (state.timer.status === "cue") return withTimer(state, { status: "done", cueMs: 0 });
  return state;
}

function tick(state: GameState, ms: number, kinds: Kinds): GameState {
  const elapsed = Number.isFinite(ms) && ms > 0 ? ms : 0;
  const { status, leftMs, cueMs } = state.timer;
  if (elapsed === 0) return state;
  if (status === "running") {
    const left = Math.max(0, leftMs - elapsed);
    if (left > 0) return withTimer(state, { leftMs: left });
    return withTimer(state, state.auto ? { status: "cue", leftMs: 0, cueMs: CUE_MS } : { status: "done", leftMs: 0 });
  }
  if (status !== "cue") return state;
  const left = cueMs - elapsed;
  if (left > 0) return withTimer(state, { cueMs: left });
  const moved = next(state, kinds);
  return moved === state ? withTimer(state, { status: "done", cueMs: 0 }) : moved;
}

/** Points as the game keeps them: 0–999 in halves. */
function cleanScore(value: number): number {
  return clamp(Math.round(value * 2) / 2, 0, MAX_SCORE);
}

function without(record: Readonly<Record<string, number>>, key: string): Readonly<Record<string, number>> {
  return Object.fromEntries(Object.entries(record).filter(([name]) => name !== key));
}

function hasTeam(state: GameState, teamId: string): boolean {
  return state.teams.some((team) => team.id === teamId);
}

const setTeamName: Handler<"setTeamName"> = (state, { teamId, name }) => {
  const cleaned = cut(name, TEAM_NAME_MAX);
  const team = state.teams.find((candidate) => candidate.id === teamId);
  if (!team || team.name === cleaned) return state;
  return { ...state, teams: state.teams.map((candidate) => (candidate === team ? { ...team, name: cleaned } : candidate)) };
};

const addTeam: Handler<"addTeam"> = (state, { name }) => {
  if (state.teams.length >= MAX_TEAMS) return state;
  let number = state.nextTeam;
  while (hasTeam(state, `t${String(number)}`)) number += 1;
  const team = { id: `t${String(number)}`, name: cut(name, TEAM_NAME_MAX) };
  return { ...state, teams: [...state.teams, team], nextTeam: number + 1 };
};

const removeTeam: Handler<"removeTeam"> = (state, { teamId }) => {
  if (state.teams.length <= MIN_TEAMS || !hasTeam(state, teamId)) return state;
  const scores = Object.fromEntries(Object.entries(state.scores).map(([roundId, round]) => [roundId, without(round, teamId)]));
  return { ...state, teams: state.teams.filter((team) => team.id !== teamId), scores, bonus: without(state.bonus, teamId), winner: state.winner === teamId ? null : state.winner };
};

const setScore: Handler<"setScore"> = (state, { roundId, teamId, value }) => {
  const cleaned = cleanScore(value);
  if (!hasTeam(state, teamId) || !roundIds(state).includes(roundId) || (state.scores[roundId]?.[teamId] ?? 0) === cleaned) return state;
  return { ...state, scores: { ...state.scores, [roundId]: { ...state.scores[roundId], [teamId]: cleaned } } };
};

const addBonus: Handler<"addBonus"> = (state, { teamId, by }) => {
  const now = state.bonus[teamId] ?? 0;
  const cleaned = cleanScore(now + (Number.isFinite(by) ? by : 0));
  if (!hasTeam(state, teamId) || cleaned === now) return state;
  return { ...state, bonus: { ...state.bonus, [teamId]: cleaned } };
};

const pickWinner: Handler<"pickWinner"> = (state, { teamId }) => {
  if (teamId === state.winner || (teamId !== null && !hasTeam(state, teamId))) return state;
  return { ...state, winner: teamId };
};

/** A new game with the same teams: back to the title, every score cleared. */
function restart(state: GameState): GameState {
  return { ...state, index: 0, step: 0, scores: {}, bonus: {}, winner: null, timer: freshTimer(0) };
}

const HANDLERS: { readonly [T in GameAction["type"]]: Handler<T> } = {
  next: (state, _action, kinds) => next(state, kinds),
  back: (state, _action, kinds) => back(state, kinds),
  jump: (state, action, kinds) => jump(state, action.index, kinds),
  reveal: (state) => (state.step < (state.screens[state.index]?.steps ?? 0) ? { ...state, step: state.step + 1 } : state),
  timerStart: startTimer,
  timerPause: pauseTimer,
  timerToggle: (state) => (state.timer.status === "running" || state.timer.status === "cue" ? pauseTimer(state) : startTimer(state)),
  timerReset: (state) => (state.timer.totalMs === 0 ? state : { ...state, timer: freshTimer(state.timer.totalMs / 1000) }),
  tick: (state, action, kinds) => tick(state, action.ms, kinds),
  setTeamName,
  addTeam,
  removeTeam,
  setScore,
  addBonus,
  pickWinner,
  setAuto: (state, action) => (state.auto === action.value ? state : { ...state, auto: action.value }),
  restart,
};

/**
 * The game after one move.
 * @param state - the game; never changed
 * @param action - the move
 * @param kinds - the screen kinds (tests pass their own)
 * @returns the next game, or the same object when the move changes nothing
 */
export function step(state: GameState, action: GameAction, kinds: Kinds = screenKinds): GameState {
  // Safe: HANDLERS maps every action type to the handler of that same type.
  const handler = HANDLERS[action.type] as Handler<GameAction["type"]>;
  return handler(state, action, kinds);
}

/**
 * The game as it would be after "next", for the host's preview of what comes — the timer is left alone.
 * @param state - the game
 * @param kinds - the screen kinds
 */
export function peekNext(state: GameState, kinds: Kinds = screenKinds): GameState {
  const moved = next(state, kinds);
  return moved === state ? state : { ...moved, timer: freshTimer(moved.screens[moved.index]?.seconds ?? 0) };
}
