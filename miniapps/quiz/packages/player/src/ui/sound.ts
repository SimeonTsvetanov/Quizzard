// A soft sound when a question's time is up — off unless the host switches it on in the menu. Two
// short, quiet tones made with Web Audio: no file is loaded, and the exported page stays one file.
// The visual cue ("Time is up") is always there; the sound only adds to it.
import type { GameState } from "../game/state.ts";

/** How loud the tones are at their peak (0–1): present in a room, never a jolt. */
const PEAK = 0.12;
/** The two tones: a fifth, falling. Hz and where each starts, in seconds. */
const TONES: readonly (readonly [number, number])[] = [[784, 0], [523.25, 0.18]];
const TONE_SECONDS = 0.42;

/**
 * Whether a move just ran a timer out.
 * @param before - the game before the move
 * @param after - the game after it
 */
export function ranOut(before: GameState, after: GameState): boolean {
  const wasRunning = before.timer.status === "running";
  const isOver = after.timer.status === "done" || after.timer.status === "cue";
  return wasRunning && isOver && before.index === after.index;
}

/**
 * Plays the time-up sound. A browser without Web Audio, or one that refuses to start it, stays silent.
 * @param create - makes the audio context (tests pass their own)
 */
export function playTimeUp(create: () => AudioContext = () => new AudioContext()): void {
  try {
    const context = create();
    const end = TONES.reduce((latest, [frequency, start]) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const from = context.currentTime + start;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, from);
      gain.gain.linearRampToValueAtTime(PEAK, from + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, from + TONE_SECONDS);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(from);
      oscillator.stop(from + TONE_SECONDS);
      return Math.max(latest, start + TONE_SECONDS);
    }, 0);
    window.setTimeout(() => { void context.close().catch(() => undefined); }, (end + 0.1) * 1000);
  } catch {
    // No sound here: the stage's own cue says the time is up.
  }
}
