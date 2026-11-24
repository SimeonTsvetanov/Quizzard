// The moves that lose something pass through here before they are made: removing a team that has
// points asks first, with the numbers; starting the game again asks when there are points to clear
// and can be undone for a few seconds either way. Every other move goes straight on.
import { roundIds, roundScore, total } from "../game/scores.ts";
import type { GameAction, GameState } from "../game/state.ts";
import type { PlayEnv } from "../views/context.ts";
import { confirmDialog } from "./confirm.ts";
import type { UndoStrip } from "./undo.ts";

/** What the guards need from the player. */
export interface GuardOptions {
  readonly root: HTMLElement;
  readonly env: PlayEnv;
  readonly undo: UndoStrip;
  readonly getState: () => GameState;
  /** Makes a move (the reducer, storage, the audience window, the screen). */
  readonly move: (action: GameAction) => void;
  /** Puts a whole game back (Undo). */
  readonly replace: (state: GameState) => void;
}

/** A guard: `true` = it took the action (asked, or made the move itself). */
type Guard = (options: GuardOptions, action: GameAction) => boolean;

/** The points every team has in all, and how many teams have any. */
export function pointsAtStake(state: GameState): { readonly points: number; readonly teams: number } {
  const totals = state.teams.map((team) => total(state, team.id));
  return { points: totals.reduce((sum, value) => sum + value, 0), teams: totals.filter((value) => value > 0).length };
}

const removeTeam: Guard = (options, action) => {
  if (action.type !== "removeTeam") return false;
  const { env, root, getState, move } = options;
  const state = getState();
  const team = state.teams.find((candidate) => candidate.id === action.teamId);
  const points = team ? total(state, team.id) : 0;
  if (!team || points <= 0) return false; // nothing to lose: removed at once
  const rounds = roundIds(state).filter((roundId) => roundScore(state, roundId, team.id) > 0).length;
  void confirmDialog({
    root,
    title: env.t("confirm.removeTeamTitle", { team: team.name }),
    text: env.t("confirm.removeTeamText", { count: Math.max(1, rounds), points: env.labels.points(points) }),
    confirm: env.t("confirm.remove"),
    cancel: env.t("confirm.cancel"),
  }).then((isConfirmed) => { if (isConfirmed) move(action); });
  return true;
};

const restart: Guard = (options, action) => {
  if (action.type !== "restart") return false;
  const { env, root, undo, getState, move, replace } = options;
  const before = getState();
  const stake = pointsAtStake(before);
  const run = (): void => {
    move(action);
    if (getState() !== before) undo.offer(env.t(stake.points > 0 ? "undo.cleared" : "undo.restarted"), () => { replace(before); });
  };
  if (stake.points <= 0) {
    run();
    return true;
  }
  void confirmDialog({
    root,
    title: env.t("confirm.restartTitle"),
    text: env.t("confirm.restartText", { count: stake.teams, points: env.labels.points(stake.points) }),
    confirm: env.t("confirm.restart"),
    cancel: env.t("confirm.cancel"),
  }).then((isConfirmed) => { if (isConfirmed) run(); });
  return true;
};

const GUARDS: readonly Guard[] = [removeTeam, restart];

/**
 * Wraps the player's `dispatch`: a move that loses something asks first or offers Undo.
 * @param options - the player's parts
 * @returns the dispatch the bar, the keys, the menu and the views use
 */
export function guarded(options: GuardOptions): (action: GameAction) => void {
  return (action) => {
    if (!GUARDS.some((guard) => guard(options, action))) options.move(action);
  };
}
