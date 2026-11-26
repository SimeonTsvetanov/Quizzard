// The music under a question (core music.ts): a sound that plays while the question's time runs, so
// the teams can talk. It follows the timer — playing while it runs, resting while it is paused, back
// at its start when the time is up or was never started — and goes round when it is shorter than the
// time. It plays in the host's own window, also while an audience window shows the stage: a sound has
// no picture to show there, and the host's window is the one the browser lets play without a tap.
import type { GameState } from "../game/state.ts";

/** How loud the music plays (0–1): under the room's talk, not over the host. */
const VOLUME = 0.7;

/** The player's music. */
export interface Music {
  /** Brings the music in step with the game. */
  update(state: GameState): void;
  /** Stops it and lets the sound go. */
  destroy(): void;
}

/**
 * What the music should do for a game: nothing (no music on this screen), play, rest where it is, or
 * rest at its start.
 * @param state - the game
 */
export function musicCue(state: GameState): "none" | "play" | "hold" | "rewind" {
  if (state.screens[state.index]?.music === undefined) return "none";
  if (state.timer.status === "running") return state.curtain === null ? "play" : "hold";
  return state.timer.status === "paused" ? "hold" : "rewind";
}

/**
 * Creates the player's music.
 * @param urlOf - gives the address of a media file of the quiz; without it there is no music
 * @param create - makes the audio element (tests pass their own)
 */
export function createMusic(urlOf: ((id: string) => string | null) | undefined, create: (url: string) => HTMLAudioElement = (url) => new Audio(url)): Music {
  let audio: HTMLAudioElement | null = null;
  let key = "";
  const stop = (): void => {
    audio?.pause();
    audio?.removeAttribute("src");
    audio = null;
  };
  return {
    update(state) {
      const id = state.screens[state.index]?.music;
      const now = id === undefined ? "" : `${String(state.index)}:${id}`;
      if (now !== key) {
        stop();
        key = now;
        const url = id === undefined ? null : (urlOf?.(id) ?? null);
        if (url !== null) {
          audio = create(url);
          audio.loop = true;
          audio.volume = VOLUME;
        }
      }
      if (audio === null) return;
      const cue = musicCue(state);
      // A browser that refuses to start a sound leaves the question silent: nothing else depends on it.
      if (cue === "play") { if (audio.paused) void audio.play().catch(() => undefined); return; }
      if (!audio.paused) audio.pause();
      if (cue === "rewind" && audio.currentTime !== 0) audio.currentTime = 0;
    },
    destroy() {
      stop();
      key = "";
    },
  };
}
