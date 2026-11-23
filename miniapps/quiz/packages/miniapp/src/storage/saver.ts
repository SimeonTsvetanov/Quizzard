// Saving as you type: a change is written a moment after the last one (as the Answer sheet does),
// and at once when the screen goes away. Writes run one after another, so an older state can never
// land on top of a newer one.
import type { MediaEntry, Quiz } from "@simeonts/quizzard-quiz-core";
import type { QuizStore } from "./store.ts";

/** A change is written this long after the last one. */
export const SAVE_DELAY_MS = 300;

/** What the "Saved" tick shows: nothing yet, a change waiting or being written, written, or refused. */
export type SaveState = "idle" | "saving" | "saved" | "error";

/** The debounced writer of the open quiz. */
export interface Saver {
  /** Remembers the newest state of the quiz and writes it shortly after the last change. */
  soon(quiz: Quiz, media: readonly MediaEntry[]): void;
  /** Writes what is waiting now (unmount, the page being hidden, opening another quiz); resolves when it is stored. */
  flush(): Promise<void>;
  /** Drops what is waiting without writing it (the quiz was deleted). */
  cancel(): void;
  /** The change that is not stored yet — waiting or being written — or `null`. */
  unsaved(): { readonly quiz: Quiz; readonly media: readonly MediaEntry[] } | null;
  readonly state: SaveState;
}

/** Inputs of {@link createSaver}. */
export interface SaverOptions {
  readonly store: Pick<QuizStore, "put">;
  /** Called on every change of the state, for the "Saved" tick. */
  readonly onState?: (state: SaveState) => void;
  readonly delay?: number;
}

/**
 * Creates the debounced writer.
 * @param options - the store, the state listener and the delay (300 ms)
 */
export function createSaver({ store, onState, delay = SAVE_DELAY_MS }: SaverOptions): Saver {
  interface Job { readonly quiz: Quiz; readonly media: readonly MediaEntry[] }
  let waiting: Job | null = null;
  let writing: Job | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let queue: Promise<void> = Promise.resolve();
  let state: SaveState = "idle";
  const setState = (next: SaveState): void => {
    if (state === next) return;
    state = next;
    onState?.(next);
  };
  const write = (): Promise<void> => {
    clearTimeout(timer);
    timer = undefined;
    const job = waiting;
    waiting = null;
    if (job === null) return queue;
    writing = job;
    const settle = (next: SaveState | null): void => {
      if (writing === job) writing = null;
      if (next !== null) setState(next);
    };
    queue = queue.then(() => store.put(job.quiz, job.media)).then(
      () => { settle(waiting === null ? "saved" : null); },
      () => { settle("error"); },
    );
    return queue;
  };
  return {
    soon(quiz, media) {
      waiting = { quiz, media };
      setState("saving");
      clearTimeout(timer);
      timer = setTimeout(() => { void write(); }, delay);
    },
    flush: write,
    cancel() {
      clearTimeout(timer);
      timer = undefined;
      waiting = null;
    },
    unsaved: () => waiting ?? writing,
    get state() { return state; },
  };
}
