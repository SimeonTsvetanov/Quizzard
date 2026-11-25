// The saved game (AC9: a reload continues): the part of the state that changes while playing. The
// list of screens is not saved — it is built again from the quiz, and what was saved is fitted to
// it, so a quiz that was edited between two sessions in the app still opens (the position is kept
// inside the list, scores of rounds and teams that are gone are dropped). Read with a hand check:
// the stored value may be anything.
import { MAX_TEAMS, MIN_TEAMS, clamp, cut } from "@simeonts/quizzard-quiz-core/play";
import { roundIds } from "./scores.ts";
import { MAX_SCORE, TEAM_NAME_MAX, type GameState, type Team, type Timer, type TimerStatus, freshTimer } from "./state.ts";

/** The version of the saved game's shape. */
export const SAVE_VERSION = 1;

/** What is stored between sessions. */
export interface SavedGame {
  readonly v: typeof SAVE_VERSION;
  readonly index: number;
  readonly step: number;
  readonly teams: readonly Team[];
  readonly nextTeam: number;
  readonly scores: GameState["scores"];
  readonly bonus: GameState["bonus"];
  readonly winner: string | null;
  readonly auto: boolean;
  /** The time-up sound is on; left out by games saved before it existed (= off). */
  readonly sound?: boolean;
  /** The language the host picked; left out = the quiz's own. */
  readonly lang?: string;
  readonly timer: Timer;
}

/** A clock does not run while the page is closed: a running timer is saved paused, a cue as "time is up". */
const RESTING: Readonly<Record<TimerStatus, TimerStatus>> = { idle: "idle", running: "paused", paused: "paused", done: "done", cue: "done" };

/**
 * The timer as it is after a reload.
 * @param timer - the timer of the running game
 */
export function restingTimer(timer: Timer): Timer {
  return { ...timer, status: RESTING[timer.status], cueMs: 0 };
}

/**
 * The part of a game that is saved.
 * @param state - the game
 */
export function toSaved(state: GameState): SavedGame {
  const { index, step, teams, nextTeam, scores, bonus, winner, auto } = state;
  return { v: SAVE_VERSION, index, step, teams, nextTeam, scores, bonus, winner, auto, ...(state.sound === true ? { sound: true } : {}), ...(state.lang === undefined ? {} : { lang: state.lang }), timer: restingTimer(state.timer) };
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function whole(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) ? clamp(value, min, max) : fallback;
}

function readTeams(value: unknown): readonly Team[] | null {
  if (!Array.isArray(value) || value.length < MIN_TEAMS || value.length > MAX_TEAMS) return null;
  const teams: Team[] = [];
  for (const entry of value) {
    if (!isRecord(entry) || typeof entry["id"] !== "string" || entry["id"] === "" || typeof entry["name"] !== "string") return null;
    teams.push({ id: entry["id"], name: cut(entry["name"], TEAM_NAME_MAX) });
  }
  return new Set(teams.map((team) => team.id)).size === teams.length ? teams : null;
}

/** The points of known teams only, each inside 0–999. */
function readPoints(value: unknown, teamIds: ReadonlySet<string>): Readonly<Record<string, number>> {
  if (!isRecord(value)) return {};
  const entries = Object.entries(value).flatMap(([teamId, points]) => (teamIds.has(teamId) && typeof points === "number" && Number.isFinite(points) ? [[teamId, clamp(points, 0, MAX_SCORE)] as const] : []));
  return Object.fromEntries(entries);
}

function readScores(value: unknown, rounds: readonly string[], teamIds: ReadonlySet<string>): GameState["scores"] {
  if (!isRecord(value)) return {};
  return Object.fromEntries(rounds.flatMap((roundId) => (isRecord(value[roundId]) ? [[roundId, readPoints(value[roundId], teamIds)] as const] : [])));
}

const STATUSES: readonly string[] = ["idle", "running", "paused", "done", "cue"];

/** The saved timer when it belongs to the screen (same length), else that screen's fresh one. */
function readTimer(value: unknown, fresh: Timer): Timer {
  if (!isRecord(value) || value["totalMs"] !== fresh.totalMs || fresh.totalMs === 0) return fresh;
  const status = STATUSES.find((name) => name === value["status"]) as TimerStatus | undefined;
  const leftMs = value["leftMs"];
  if (status === undefined || typeof leftMs !== "number" || !Number.isFinite(leftMs)) return fresh;
  return restingTimer({ status, totalMs: fresh.totalMs, leftMs: clamp(leftMs, 0, fresh.totalMs), cueMs: 0 });
}

/**
 * A new game with a saved one put into it.
 * @param fresh - the game just built from the quiz
 * @param saved - what storage gave back; anything
 * @returns the game to continue; `fresh` itself when the saved value is not a game of this version
 */
export function restore(fresh: GameState, saved: unknown): GameState {
  if (!isRecord(saved) || saved["v"] !== SAVE_VERSION) return fresh;
  const teams = readTeams(saved["teams"]);
  if (teams === null) return fresh;
  const teamIds = new Set(teams.map((team) => team.id));
  const index = whole(saved["index"], 0, fresh.screens.length - 1, 0);
  const screen = fresh.screens[index];
  const winner = saved["winner"];
  return {
    ...fresh,
    index,
    step: whole(saved["step"], 0, screen?.steps ?? 0, 0),
    teams,
    nextTeam: whole(saved["nextTeam"], teams.length + 1, Number.MAX_SAFE_INTEGER, teams.length + 1),
    scores: readScores(saved["scores"], roundIds(fresh), teamIds),
    bonus: readPoints(saved["bonus"], teamIds),
    winner: typeof winner === "string" && teamIds.has(winner) ? winner : null,
    auto: saved["auto"] !== false,
    ...(saved["sound"] === true ? { sound: true } : {}),
    ...(typeof saved["lang"] === "string" ? { lang: saved["lang"] } : {}),
    timer: readTimer(saved["timer"], freshTimer(screen?.seconds ?? 0)),
  };
}
