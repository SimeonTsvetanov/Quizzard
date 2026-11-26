// The pure half of every screen (the views/ registry holds the drawn half under the same ids): what
// the game needs to know to move through it — whether it has a timer, how many reveals, whether it
// is left out right now. The reducer asks this registry and never switches on a screen's name, so a
// later round kind adds its screen here (and its view) and nothing else changes.
import { type Question, type Registry, type RegistryEntry, type Round, STANDARD_SCREENS, TASK_SCREENS, createRegistry, effectiveSeconds } from "@simeonts/quizzard-quiz-core/play";
import { isFirstShared } from "./scores.ts";
import { PLAYER_SCREENS, type GameState } from "./state.ts";

/** A screen kind's rules. */
export interface ScreenKind extends RegistryEntry {
  /** The timer's length on this screen; no function = no timer. */
  seconds?(round: Round, question: Question): number;
  /** Reveals before the game moves on; none when left out. */
  readonly steps?: number;
  /** The reveals are parts that a wide screen shows at once (see `GameScreen.upright`). */
  readonly upright?: true;
  /** Whether the game passes over the screen as things stand. */
  isSkipped?(state: GameState): boolean;
}

/** A fresh registry with the screens of a standard round and the player's own. */
export function createScreenKinds(): Registry<ScreenKind> {
  return createRegistry<ScreenKind>([
    { id: PLAYER_SCREENS.title },
    { id: PLAYER_SCREENS.teams },
    { id: STANDARD_SCREENS.rules },
    { id: STANDARD_SCREENS.question, seconds: effectiveSeconds },
    { id: STANDARD_SCREENS.answers },
    // One press shows the answer's slide whole (Moni 2026-11-26): the answer comes in by itself a moment after the question (styles/clock.css).
    { id: STANDARD_SCREENS.answer },
    // The round's answers in one list, then the points entry: two parts on an upright screen, one screen on a wide one.
    { id: STANDARD_SCREENS.score, steps: 1, upright: true },
    // A round without answers: the points alone, in one part on any screen.
    { id: TASK_SCREENS.tally },
    { id: STANDARD_SCREENS.board },
    { id: PLAYER_SCREENS.tie, isSkipped: (state) => !isFirstShared(state) },
    { id: PLAYER_SCREENS.final },
  ]);
}

/** The player's shared screen kinds: the default of every function that needs them. */
export const screenKinds: Registry<ScreenKind> = createScreenKinds();
