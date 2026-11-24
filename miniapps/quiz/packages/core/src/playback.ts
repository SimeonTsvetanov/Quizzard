// How a question's media is being shown, as data: a clip (audio, video) plays, pauses and ends; a
// picture is zoomed or not. The game keeps one of these per screen and the slide draws it — in the
// host's window, the audience's window and the creator's preview alike — so "play" is a move of the
// game, never a click that only one window knows of. No DOM, no clock: time comes in as ticks.

/**
 * What a clip is doing: `idle` (at its start, waiting), `playing`, `paused`, `ended`, or `blocked` —
 * told to play, but the browser of the window that plays it wants a tap there first.
 */
export type PlaybackStatus = "idle" | "playing" | "paused" | "ended" | "blocked";

/** The media of the screen on show. */
export interface Playback {
  readonly status: PlaybackStatus;
  /** About where the clip is, in milliseconds — counted from ticks, for the host's panel. */
  readonly ms: number;
  /** Goes up every time the clip is sent back to its start, so every window rewinds. */
  readonly seq: number;
  /** A picture is shown large. */
  readonly zoom: boolean;
}

/**
 * What can be asked of the media: the host's `play`, `pause`, `toggle`, `restart` and `zoom`, and
 * what the playing window reports back — `ended` and `blocked`.
 */
export type PlaybackCommand = "play" | "pause" | "toggle" | "restart" | "ended" | "blocked" | "zoom";

/** Media at rest: every screen starts with it. */
export const RESTING_PLAYBACK: Playback = { status: "idle", ms: 0, seq: 0, zoom: false };

function play(state: Playback): Playback {
  if (state.status === "playing") return state;
  // Played again after its end: from the top.
  if (state.status === "ended") return { ...state, status: "playing", ms: 0, seq: state.seq + 1 };
  return { ...state, status: "playing" };
}

function pause(state: Playback): Playback {
  return state.status === "playing" || state.status === "blocked" ? { ...state, status: "paused" } : state;
}

const COMMANDS: Readonly<Record<PlaybackCommand, (state: Playback) => Playback>> = {
  play,
  pause,
  toggle: (state) => (state.status === "playing" || state.status === "blocked" ? pause(state) : play(state)),
  restart: (state) => ({ ...state, status: "playing", ms: 0, seq: state.seq + 1 }),
  ended: (state) => (state.status === "playing" || state.status === "blocked" ? { ...state, status: "ended" } : state),
  blocked: (state) => (state.status === "playing" ? { ...state, status: "blocked" } : state),
  zoom: (state) => ({ ...state, zoom: !state.zoom }),
};

/**
 * The media after one command.
 * @param state - the media; never changed
 * @param command - what is asked
 * @returns the next state, or the same object when the command changes nothing
 */
export function playbackStep(state: Playback, command: PlaybackCommand): Playback {
  return COMMANDS[command](state);
}

/**
 * The media after some time: a playing clip moves on, up to its length when that is known.
 * @param state - the media
 * @param ms - the time that passed
 * @param totalMs - the clip's length; 0 when it is not known
 */
export function playbackTick(state: Playback, ms: number, totalMs = 0): Playback {
  if (state.status !== "playing" || !Number.isFinite(ms) || ms <= 0) return state;
  const moved = state.ms + ms;
  return { ...state, ms: totalMs > 0 ? Math.min(moved, totalMs) : moved };
}

/**
 * A time as a clip shows it: `0:07`, `12:30`.
 * @param seconds - the time; anything that is not a number reads as zero
 */
export function clockText(seconds: number): string {
  const whole = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  return `${String(Math.floor(whole / 60))}:${String(whole % 60).padStart(2, "0")}`;
}
