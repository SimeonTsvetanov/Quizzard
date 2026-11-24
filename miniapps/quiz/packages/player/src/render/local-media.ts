// Media that nobody else drives: the creator's live preview and its Preview screen show a slide with
// no game behind it, so the slide's own buttons are the whole story. The same commands, the same
// state (core `playbackStep`) — only here it lives and ends with the slide.
import { type Playback, RESTING_PLAYBACK, playbackStep } from "@simeonts/quizzard-quiz-core/play";
import type { DrawnMedia, SlideMedia } from "./registry.ts";

/** Slide media that drives itself. */
export interface LocalMedia extends SlideMedia {
  /** Stops what plays and forgets the slide; call before the slide is thrown away. */
  stop(): void;
}

/** Creates the media link of one self-driven slide (or of several shown one after another). */
export function createLocalMedia(): LocalMedia {
  let state: Playback = RESTING_PLAYBACK;
  const drawn = new Set<DrawnMedia>();
  return {
    command(command) {
      const next = playbackStep(state, command);
      if (next === state) return;
      state = next;
      for (const part of drawn) part.sync(state);
    },
    mount(part) {
      drawn.add(part);
      part.sync(state);
    },
    stop() {
      for (const part of drawn) part.destroy();
      drawn.clear();
      state = RESTING_PLAYBACK;
    },
  };
}
