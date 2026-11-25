// The player's own types: what starts it, what it gives back, and what one player hands to the
// next when the language changes (play.ts).
import type { QuizFile } from "@simeonts/quizzard-quiz-core/play";
import type { Channel, Transport } from "./channel.ts";
import type { GameAction, GameState } from "./game/state.ts";

/** Where the game is kept between sessions; both calls may fail silently (a page opened from a file may have no storage). */
export interface GameStorage {
  load(): unknown;
  save(value: unknown): void;
}

/** An open audience window, as the player sees it. */
export interface AudienceLink {
  readonly transport: Transport;
  isClosed(): boolean;
  close(): void;
}

/** Inputs of {@link createPlayer}. */
export interface PlayerOptions {
  /** An empty element; the player fills it and takes it full screen on F. */
  readonly root: HTMLElement;
  readonly file: QuizFile;
  readonly storage?: GameStorage;
  /** Gives the address of a media file of the quiz, or `null`. */
  readonly mediaUrl?: (id: string) => string | null;
  /** Opens the audience window; `null` when the browser refused. Left out = no presenter mode here. */
  readonly openAudience?: () => AudienceLink | null;
  /** Leaves the player (in the app: back to the quiz). */
  readonly onExit?: () => void;
  /** The id of the round or question the game jumps to as it opens ("Play from here"); left out = where the game is. */
  readonly startAt?: string;
  /** Shows a short message to the host (the app's toast); the exported page uses its own line. */
  readonly notify?: (message: string) => void;
  /** Where the logo on the stage leads (the exported page); left out = no link (inside the app, ui/brand.ts). */
  readonly homeUrl?: string;
}

/**
 * What a player hands to the one that takes its place (a language change, play.ts): the game as it
 * is — its running timer, its break, its points — and the open audience window with its channel, so
 * neither goes through storage or is closed and opened again.
 */
export interface Handover {
  readonly state: GameState;
  readonly presenter: { readonly link: AudienceLink; readonly channel: Channel } | null;
}

/** What play.ts adds to the options of the player it starts. */
export interface InnerOptions extends PlayerOptions {
  /** Called when the host picked another language: play.ts starts the player again in it. */
  readonly onLang?: (lang: string) => void;
  /** The game and the audience window of the player this one takes the place of. */
  readonly resume?: Handover;
}

/** A running player. */
export interface Player {
  getState(): GameState;
  dispatch(action: GameAction): void;
  /** Whether the audience window is open. */
  isPresenting(): boolean;
  /** Opens the audience window (inside a click: a browser opens a window only then). */
  present(): void;
  /** Saves the game, closes the audience window and removes every listener and timer. */
  destroy(): void;
}

/** The player play.ts starts: it can also be taken down with its game and audience window handed on. */
export interface InnerPlayer extends Player {
  /** Takes the player down like `destroy`, but keeps the audience window open and full screen on, and hands the game on. */
  handOver(): Handover;
}
