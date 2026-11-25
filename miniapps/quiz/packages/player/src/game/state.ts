// The played quiz as data (SPEC §6, AC9): where the game is in its list of screens, the teams and
// their scores, the timer and the reveal. Everything here is plain JSON — it is saved after every
// move (save.ts) and sent as it is to the audience window (channel.ts). No DOM, no clock: time comes
// in through the `tick` action.
import type { Playback, PlaybackCommand } from "@simeonts/quizzard-quiz-core/play";

/** The player's own screens around the rounds; a round's screens come from its round kind (core). */
export const PLAYER_SCREENS = {
  /** The quiz's name, before anything starts. */
  title: "title",
  /** Team names. */
  teams: "teams",
  /** First place is shared: the host picks the winner or adds points. Left out when nobody is level. */
  tie: "tie",
  /** The podium. */
  final: "final",
} as const;

/** One step of the game: a round's screen (core `PlayerScreen`) or one of the player's own. */
export interface GameScreen {
  /** Names the screen kind (kinds.ts) and its view (views/); an open string like a question's `kind`. */
  readonly screen: string;
  readonly roundId?: string;
  readonly questionId?: string;
  /** The timer's length on this screen; 0 = no timer. */
  readonly seconds: number;
  /** How many reveals the screen has before the game moves on; 0 = none. */
  readonly steps: number;
  /**
   * The reveals are parts of the screen that only an upright screen shows one after the other (the
   * round's answers, then the points entry): a wide screen shows them at once, so a host on a wide
   * screen passes over them (`next` and `back` with `wide`). Left out = real reveals.
   */
  readonly upright?: true;
  /** The screen's media can fill the stage: a picture, a video (not a sound). Left out = it cannot. */
  readonly zoom?: true;
  /** What the screen's question carries: a picture (`still`) or audio or video (`clip`); left out for none. */
  readonly media?: "still" | "clip";
  /** A clip's length in milliseconds; left out when it is not known. */
  readonly clipMs?: number;
}

/** A team; its id never changes, its name is what the host typed. */
export interface Team {
  readonly id: string;
  readonly name: string;
}

/**
 * What the timer is doing: `idle` (full, waiting), `running`, `paused`, `done` (time is up and the
 * game waits for the host) or `cue` (time is up and the game moves on by itself in a moment).
 */
export type TimerStatus = "idle" | "running" | "paused" | "done" | "cue";

/** The timer of the screen on show, as data. Milliseconds, so ticks of any length add up. */
export interface Timer {
  readonly status: TimerStatus;
  readonly totalMs: number;
  readonly leftMs: number;
  /** While `cue`: how long until the game moves on. */
  readonly cueMs: number;
}

/**
 * What covers the stage: a black screen ("eyes on the host"), or a break with its countdown.
 * While one is up the question behind it rests: its timer and its clip are paused.
 */
export type Curtain = { readonly kind: "black" } | { readonly kind: "break"; readonly totalMs: number; readonly leftMs: number; /** The host paused the countdown; left out = it runs. */ readonly paused?: boolean };

/** The whole game. */
export interface GameState {
  readonly screens: readonly GameScreen[];
  /** The screen on show: an index into `screens`. */
  readonly index: number;
  /** Reveals done on this screen: 0 … its `steps`. */
  readonly step: number;
  readonly teams: readonly Team[];
  /** The number the next added team's id gets. */
  readonly nextTeam: number;
  /** Points per round and team: `scores[roundId][teamId]`; missing = 0. */
  readonly scores: Readonly<Record<string, Readonly<Record<string, number>>>>;
  /** Extra points given at the tiebreak, per team. */
  readonly bonus: Readonly<Record<string, number>>;
  /** The team the host named the winner of a tie; `null` = not picked. */
  readonly winner: string | null;
  /** Questions run by themselves: the timer starts with the question and the game moves on when it ends. */
  readonly auto: boolean;
  /** A soft sound is played when a question's time is up; left out = off (it is off unless the host switches it on). */
  readonly sound?: boolean;
  /** The language the host picked for this game ("en", "bg"); left out = the quiz's own. */
  readonly lang?: string;
  readonly timer: Timer;
  /** The picture or clip of the screen on show; at rest on every new screen. */
  readonly media: Playback;
  /** What covers the stage, or `null`. */
  readonly curtain: Curtain | null;
}

/** How long the "next" cue shows between a finished timer and the next screen. */
export const CUE_MS = 2500;
/** The longest team name. */
export const TEAM_NAME_MAX = 40;
/** The lengths of a break the menu offers, in minutes. */
export const BREAK_MINUTES: readonly number[] = [5, 10, 15];
/** The longest break, in minutes. */
export const MAX_BREAK_MINUTES = 60;
/** A clip that never reported its end is taken as ended this long after its length has passed. */
export const CLIP_END_GRACE_MS = 1500;
/** The most points a team can get in one round (and at the tiebreak). */
export const MAX_SCORE = 999;

/** Every move of the game. */
export type GameAction =
  /** `wide` = the window that asks shows a wide stage: the parts an upright screen shows one by one are passed over. */
  | { readonly type: "next"; readonly wide?: boolean }
  | { readonly type: "back"; readonly wide?: boolean }
  | { readonly type: "jump"; readonly index: number }
  | { readonly type: "reveal" }
  | { readonly type: "timerStart" }
  | { readonly type: "timerPause" }
  | { readonly type: "timerToggle" }
  | { readonly type: "timerReset" }
  | { readonly type: "tick"; readonly ms: number }
  | { readonly type: "setTeamName"; readonly teamId: string; readonly name: string }
  | { readonly type: "addTeam"; readonly name: string }
  | { readonly type: "removeTeam"; readonly teamId: string }
  | { readonly type: "setScore"; readonly roundId: string; readonly teamId: string; readonly value: number }
  | { readonly type: "addBonus"; readonly teamId: string; readonly by: number }
  | { readonly type: "pickWinner"; readonly teamId: string | null }
  | { readonly type: "setAuto"; readonly value: boolean }
  | { readonly type: "setSound"; readonly value: boolean }
  /** The host picks the language of the stage; the player starts again in it, where the game is (play.ts). */
  | { readonly type: "setLang"; readonly lang: string }
  /** The question's picture or clip: play, pause, restart, zoom (a picture, a video) — and what the playing window reports. */
  | { readonly type: "media"; readonly command: PlaybackCommand }
  /** The black screen on or off. */
  | { readonly type: "black" }
  /** Starts a break of that many minutes. */
  | { readonly type: "break"; readonly minutes: number }
  /** Pauses the countdown of a break, or lets it run again. */
  | { readonly type: "breakToggle" }
  /** Takes away whatever covers the stage. */
  | { readonly type: "uncover" }
  | { readonly type: "restart" };

/**
 * A timer at its start.
 * @param seconds - its length; 0 for a screen without a timer
 * @param isRunning - whether it starts at once
 */
export function freshTimer(seconds: number, isRunning = false): Timer {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  return { status: isRunning && totalMs > 0 ? "running" : "idle", totalMs, leftMs: totalMs, cueMs: 0 };
}
