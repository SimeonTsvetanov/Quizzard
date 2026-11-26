// The game's reducer: `step(state, action)` gives the next state and never changes its input. Moves
// that cannot be made (back on the first screen, a thirteenth team, a score for an unknown round)
// return the SAME state object, so callers can tell with `next === state`. Screens are asked from
// the screen-kind registry; nothing here names one.
import { type PlaybackCommand, type Registry, MAX_TEAMS, MIN_TEAMS, RESTING_PLAYBACK, clamp, cut, playbackStep, playbackTick } from "@simeonts/quizzard-quiz-core/play";
import { type ScreenKind, screenKinds } from "./kinds.ts";
import { roundIds } from "./scores.ts";
import { CLIP_END_GRACE_MS, CUE_MS, MAX_BREAK_MINUTES, MAX_SCORE, TEAM_NAME_MAX, type GameAction, type GameState, type Timer, freshTimer } from "./state.ts";

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

/**
 * Shows a screen: its reveals at `step`, its media at rest, nothing covering the stage, its timer
 * full — running only when the game got here by going on, and never on a screen with a clip: there
 * the timer waits for the clip to end or for the host (the clip itself waits for the host too).
 */
function enter(state: GameState, index: number, step: number, isForward: boolean): GameState {
  const screen = state.screens[index];
  const isRunning = isForward && state.auto && screen?.media !== "clip";
  return { ...state, index, step, timer: freshTimer(screen?.seconds ?? 0, isRunning), media: RESTING_PLAYBACK, curtain: null };
}

/**
 * Whether the screen on show has reveals to walk through for whoever asks: the parts of an `upright`
 * screen are all on show on a wide stage, so there they are passed over in both directions.
 */
function walksSteps(state: GameState, isWide: boolean): boolean {
  return !(isWide && state.screens[state.index]?.upright === true);
}

function next(state: GameState, kinds: Kinds, isWide = false): GameState {
  // The first press on a covered stage only uncovers it.
  if (state.curtain !== null) return { ...state, curtain: null };
  const steps = state.screens[state.index]?.steps ?? 0;
  if (state.step < steps && walksSteps(state, isWide)) return { ...state, step: state.step + 1 };
  const index = seek(state, state.index + 1, 1, kinds);
  return index === null ? state : enter(state, index, 0, true);
}

/**
 * Whether the host's "next" starts the screen's clip instead of moving on: the clip leads the screen,
 * nothing covers the stage, every reveal is out and the clip has not been started yet.
 * @param state - the game
 * @param isWide - whether the host's screen is wide (an upright screen's parts are passed over there)
 */
export function startsClip(state: GameState, isWide = false): boolean {
  const screen = state.screens[state.index];
  if (screen?.clipFirst !== true || state.curtain !== null) return false;
  if (state.step < screen.steps && walksSteps(state, isWide)) return false;
  return state.media.status === "idle" && state.media.ms === 0;
}

/** The host's "next": the screen's clip first, where it leads and has not played; else on. */
function hostNext(state: GameState, kinds: Kinds, isWide: boolean): GameState {
  return startsClip(state, isWide) ? media(state, "play") : next(state, kinds, isWide);
}

function back(state: GameState, kinds: Kinds, isWide = false): GameState {
  if (state.curtain !== null) return { ...state, curtain: null };
  if (state.step > 0 && walksSteps(state, isWide)) return { ...state, step: state.step - 1 };
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

/** The question's timer after some time. */
function tickTimer(state: GameState, elapsed: number, kinds: Kinds): GameState {
  const { status, leftMs, cueMs } = state.timer;
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

/** A command for the screen's picture or clip. When a clip ends, the timer that waited for it starts. */
function media(state: GameState, command: PlaybackCommand): GameState {
  const screen = state.screens[state.index];
  const kind = screen?.media;
  const isZoom = command === "zoom" || command === "unzoom";
  // A picture only zooms; a clip plays, and zooms when it has a picture of its own (a video).
  if (kind === undefined || (isZoom ? screen?.zoom !== true : kind !== "clip")) return state;
  const moved = playbackStep(state.media, command);
  if (moved === state.media) return state;
  const hasEnded = moved.status === "ended" && state.media.status !== "ended";
  const timer = hasEnded && state.auto && state.timer.status === "idle" && state.timer.totalMs > 0 ? { ...state.timer, status: "running" as const } : state.timer;
  return { ...state, media: moved, timer };
}

/**
 * The clip after some time. One whose window never said "ended" is taken as ended a moment after its
 * length; and a clip longer than the question's time ends when that time has played (Moni 2026-11-25:
 * a clip nobody cut starts at its start and stops at the question's limit — 30 s set, 30 s played).
 */
function tickMedia(state: GameState, elapsed: number): GameState {
  const screen = state.screens[state.index];
  const clipMs = screen?.clipMs ?? 0;
  const limitMs = (screen?.seconds ?? 0) * 1000;
  const moved = playbackTick(state.media, elapsed);
  if (moved === state.media) return state;
  const ticked = { ...state, media: moved };
  const isOver = (clipMs > 0 && moved.ms >= clipMs + CLIP_END_GRACE_MS) || (limitMs > 0 && moved.ms >= limitMs);
  return isOver ? media(ticked, "ended") : ticked;
}

function tick(state: GameState, ms: number, kinds: Kinds): GameState {
  const elapsed = Number.isFinite(ms) && ms > 0 ? ms : 0;
  if (elapsed === 0) return state;
  const { curtain } = state;
  if (curtain !== null) {
    // Behind a cover the question rests; only a break counts down, and stays at zero for the host.
    if (curtain.kind !== "break" || curtain.leftMs === 0 || curtain.paused === true) return state;
    return { ...state, curtain: { ...curtain, leftMs: Math.max(0, curtain.leftMs - elapsed) } };
  }
  return tickTimer(tickMedia(state, elapsed), elapsed, kinds);
}

/** Covers the stage: the question behind the cover rests — a running timer and a playing clip are paused. */
function cover(state: GameState, curtain: NonNullable<GameState["curtain"]>): GameState {
  return { ...pauseTimer(state), media: playbackStep(state.media, "pause"), curtain };
}

const startBreak: Handler<"break"> = (state, { minutes }) => {
  const totalMs = clamp(Math.round(minutes), 1, MAX_BREAK_MINUTES) * 60_000;
  return cover(state, { kind: "break", totalMs, leftMs: totalMs });
};

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
  return { ...state, index: 0, step: 0, scores: {}, bonus: {}, winner: null, timer: freshTimer(0), media: RESTING_PLAYBACK, curtain: null };
}

const HANDLERS: { readonly [T in GameAction["type"]]: Handler<T> } = {
  next: (state, action, kinds) => hostNext(state, kinds, action.wide === true),
  back: (state, action, kinds) => back(state, kinds, action.wide === true),
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
  setSound: (state, action) => ((state.sound === true) === action.value ? state : { ...state, sound: action.value }),
  setLang: (state, action) => (state.lang === action.lang ? state : { ...state, lang: action.lang }),
  media: (state, action) => media(state, action.command),
  black: (state) => (state.curtain?.kind === "black" ? { ...state, curtain: null } : cover(state, { kind: "black" })),
  break: startBreak,
  breakToggle: (state) => {
    const { curtain } = state;
    if (curtain?.kind !== "break" || curtain.leftMs === 0) return state;
    return { ...state, curtain: { kind: "break", totalMs: curtain.totalMs, leftMs: curtain.leftMs, ...(curtain.paused === true ? {} : { paused: true }) } };
  },
  uncover: (state) => (state.curtain === null ? state : { ...state, curtain: null }),
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
