// What a view is drawn from, and the registry of views (SPEC §3.2): one entry per screen name, the
// drawn half of the screen kind of the same id (game/kinds.ts). The stage and the host panel look a
// view up by the screen's name and never switch on it — a later round kind registers the view of
// its own screen here and nothing else changes.
import type { MediaEntry, Question, QuizFile, Registry, RegistryEntry, Round } from "@simeonts/quizzard-quiz-core/play";
import type { GameAction, GameScreen, GameState } from "../game/state.ts";
import type { Lang, Translate } from "../i18n/translate.ts";
import type { SlideLabels, SlideMedia, StageRegistries } from "../render/registry.ts";

/** What stays the same for the whole game: the quiz, the words, the registries and how to make a move. */
export interface PlayEnv {
  readonly file: QuizFile;
  readonly lang: Lang;
  readonly t: Translate;
  /** The words of a slide in the quiz's language. */
  readonly labels: SlideLabels;
  /** Question kinds and answer types on the slide. */
  readonly parts: StageRegistries;
  readonly views: Registry<ViewEntry>;
  /** Makes a move of the game (in the audience window: asks the host to). */
  readonly dispatch: (action: GameAction) => void;
  /** Gives the address of a media file of the quiz, or `null`; left out when the quiz has none to show. */
  readonly mediaUrl?: (id: string) => string | null;
  /** Gives the description of a media file of the quiz. */
  entryOf(id: string): MediaEntry | undefined;
  /** A number as people write it in the quiz's language. */
  number(value: number): string;
}

/** What one view is drawn from. */
export interface ViewContext {
  readonly env: PlayEnv;
  readonly state: GameState;
  readonly screen: GameScreen;
  /** The screen's round, on the screens that have one. */
  readonly round: Round | undefined;
  /** The screen's question, on the screens that have one. */
  readonly question: Question | undefined;
  /**
   * `true` = the view may carry its controls (name fields, score steppers): the host plays in this
   * window. `false` = what the audience sees, and the host's small previews.
   */
  readonly canEdit: boolean;
  /** The running timer dial for a screen with a timer; `null` in previews. */
  readonly clock: HTMLElement | null;
  /** The live stage's link to the question's picture or clip; left out in previews, where media is a still. */
  readonly media?: SlideMedia;
}

/** A drawn view. */
export interface DrawnView {
  readonly element: HTMLElement;
  /** Brings texts and numbers up to date after a move that did not change the view's structure. */
  readonly sync?: (state: GameState) => void;
  /** Fits the view to the stage by measuring it: called once it is on the stage and whenever the stage's size changes. */
  readonly layout?: () => void;
}

/** The answer of the screen on show, for the host before the reveal. */
export interface HostAnswer {
  readonly text: string;
  readonly explanation: string;
  readonly points: string;
  /** The host's own note of the question; never drawn on a stage. */
  readonly note: string;
}

/** How a screen shows in the menu's grid of screens. */
export interface JumpTile {
  /** What stands on the tile: a number, or a short word. */
  readonly mark: string;
  /** The tile's full name, for its tooltip and screen readers: "Question 3". */
  readonly name: string;
  /** Tiles of one round that share this heading stand in one row under it ("Questions"); left out = a tile of its own. */
  readonly group?: string;
}

/** A screen's view. */
export interface ViewEntry extends RegistryEntry {
  /** Draws the screen for the stage. */
  stage(context: ViewContext): DrawnView;
  /** The screen's controls for the host panel (real size, the page's theme); none when left out. */
  panel?(context: ViewContext): DrawnView | null;
  /**
   * What the view's structure depends on besides the screen and its reveal step: the view is drawn
   * again when this text changes, and only synced otherwise (so a focused field keeps its caret).
   */
  structure?(state: GameState): string;
  /** The right answer of the screen, for the host. */
  answer?(context: ViewContext): HostAnswer | null;
  /** The screen's tile in the menu's grid; a view without one is not listed there. */
  tile?(context: ViewContext): JumpTile;
}

/**
 * The round and question of a screen.
 * @param file - the quiz
 * @param screen - the screen
 */
export function placeOf(file: QuizFile, screen: GameScreen): { readonly round: Round | undefined; readonly question: Question | undefined } {
  const round = file.quiz.rounds.find((candidate) => candidate.id === screen.roundId);
  return { round, question: round?.questions.find((candidate) => candidate.id === screen.questionId) };
}

/**
 * The context of the screen a game is on.
 * @param env - the game's fixed parts
 * @param state - the game
 * @param options - whether the view may carry controls, and the dial
 */
export function contextOf(env: PlayEnv, state: GameState, options: { readonly canEdit: boolean; readonly clock: HTMLElement | null; readonly media?: SlideMedia }): ViewContext {
  const screen = state.screens[state.index] ?? { screen: "", seconds: 0, steps: 0 };
  return { env, state, screen, ...placeOf(env.file, screen), ...options };
}
