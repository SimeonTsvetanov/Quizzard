// Everything one mounted creator needs: the host's services, the storage, the registries, the screen
// on show and the quiz that is open. Screens read it and call its moves; they never touch storage.
import type { Answer, Env, MediaEntry, Quiz } from "@simeonts/quizzard-quiz-core";
import type { Lang, MiniAppContext } from "../contract.ts";
import type { Translate } from "../i18n/translate.ts";
import type { MediaUrls } from "../media/urls.ts";
import type { DeckScreens } from "../screens/deck.ts";
import type { Saver } from "../storage/saver.ts";
import type { QuizStore, QuizSummary, StoredQuiz } from "../storage/store.ts";
import type { UiRegistries } from "../ui-registry.ts";
import type { Navigator, Route } from "./routes.ts";

/** What survives a redraw of the screen but is not part of the quiz. */
export interface ViewState {
  /** The round the wide layout shows next to the rounds list while the route names none. */
  lastRound: string | null;
  /** The round's settings strip is open. */
  isSettingsOpen: boolean;
  /** The questions of a round are shown readable; `false` = blurred, so a screen shared with the players gives nothing away (the start). */
  showsQuestions: boolean;
  /** What is typed in the library's search field. */
  query: string;
  /** The library asks for a new quiz's name ("New quiz" was pressed; nothing is created yet). */
  isNaming: boolean;
  /** The quiz whose name is being edited in the library. */
  renaming: string | null;
  /** Phone: the editor's live preview is shown. */
  isLiveOpen: boolean;
  /** The preview shows the answers. */
  isRevealed: boolean;
  /** Answers typed under another answer type in this editor visit, so switching back loses nothing. */
  readonly drafts: Map<string, Answer>;
  /** The screen was just opened (cards deal in); a redraw of the same screen is not. */
  isEntering: boolean;
  /** Stops what the screen on show started (the player of the Play screen); run before the next screen is drawn. */
  cleanup: (() => void) | null;
  /** The last export of this visit: shown under the quiz's actions. */
  exported: { readonly quiz: string; readonly name: string; readonly bytes: number } | null;
  /** The quizzes whose unused media files were already cleared in this visit (app/open-quiz.ts). */
  readonly swept: Set<string>;
  /** The question whose kind or answer type was just changed: its editor says that new questions of the round now start like it. */
  stickyFor: string | null;
  /** The quiz's "Quiz file and more" is open. */
  isMoreOpen: boolean;
  /** The field the next screen focuses is selected whole (a new round's name: typing replaces it). */
  selectNext: boolean;
  /** The browser was asked to keep this site's storage (once, with the first media file). */
  hasAskedToKeep: boolean;
}

/** One mounted creator. */
export interface App {
  readonly host: HTMLElement;
  readonly context: MiniAppContext;
  readonly signal: AbortSignal;
  readonly store: QuizStore;
  readonly saver: Saver;
  /** The open quiz's media files as addresses the slide can load. */
  readonly media: MediaUrls;
  /** Core's registries and id source: every edit goes through them. */
  readonly env: Env;
  /** The UI halves of the registries; empty until the quiz screens are loaded (`screens`). */
  ui: UiRegistries;
  /** The screens of a quiz (screens/deck.ts), once loaded; the library needs none of them. */
  screens: DeckScreens | null;
  readonly nav: Navigator;
  readonly view: ViewState;
  lang: Lang;
  t: Translate;
  route: Route;
  /** The library's lines; `null` while they load, `"error"` when the browser refused storage. */
  library: readonly QuizSummary[] | "error" | null;
  /** The open quiz (every screen but the library). */
  current: StoredQuiz | null;
  /** Draws the screen of `route` again; then focuses the element with this `data-focus` value. */
  draw(focus?: string): void;
  /** Loads what a screen needs and shows it, on a new history entry or in the current one; then focuses `focus` (default: the screen's title). */
  go(route: Route, mode?: "push" | "replace", focus?: string | null): void;
  /** Settles once the newest screen asked for (by `go` or a move through the history) is drawn. */
  shown(): Promise<void>;
  /**
   * Applies an edit of the open quiz and saves it soon; `false` when nothing changed.
   * @param next - the quiz after the edit
   * @param media - the descriptions of its files, when the edit added one
   */
  change(next: Quiz, media?: readonly MediaEntry[]): boolean;
}
