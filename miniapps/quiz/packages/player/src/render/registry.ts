// The drawn halves of question kinds and answer types that the slide needs (SPEC §3.2): each is
// registered under the same id as its core entry, and the slide renderer looks them up — it never
// switches on a name. The creator adds its editor parts to these same entries (its ui-registry.ts);
// the player uses them as they are.
import { type Answer, type MediaEntry, type Playback, type PlaybackCommand, type Question, type Registry, type RegistryEntry, type RevealLabels, createRegistry } from "@simeonts/quizzard-quiz-core/play";

/** Every word a slide can show; the caller translates, the renderer has no dictionary of its own. */
export interface SlideLabels extends RevealLabels {
  /** "30 s" */
  seconds(count: number): string;
  /** "2 points" */
  points(count: number): string;
  /** Shown where the question text will be, while it is empty. */
  readonly emptyPrompt: string;
  /** Shown in place of an empty option or answer. */
  readonly emptyAnswer: string;
  /** Heading of the revealed answer of an open question. */
  readonly answer: string;
  /** Shown instead of a question this version cannot draw. */
  readonly unsupported: string;
  /** The word "Round" before a round's counter ("Round 2/5"). */
  readonly round: string;
  /** A counter in words, for screen readers: "2 of 5". */
  of(now: number, total: number): string;
  /** The words of a picture, an audio clip and a video. */
  readonly media: MediaLabels;
}

/** What a slide says about its media. */
export interface MediaLabels {
  /** Shown where a file should be and is not. */
  readonly missing: string;
  /** Names of the buttons on the slide. */
  readonly zoom: string;
  readonly play: string;
  readonly pause: string;
  readonly restart: string;
  /** On the button that appears when the browser wants a tap before it plays sound. */
  readonly tapToPlay: string;
}

/** What a kind drew of a question's media, for whoever drives it. */
export interface DrawnMedia {
  /** Makes the drawn media match the state: plays, pauses, rewinds, zooms. */
  sync(state: Playback): void;
  /** Stops it and lets its file go. */
  destroy(): void;
}

/**
 * The link between a slide's live media and its owner. The slide's buttons only ask (`command`);
 * the owner — the game, or the creator's preview — decides and tells the drawn media what to show
 * (`DrawnMedia.sync`), so the host's window, the audience's window and a key all do the same.
 */
export interface SlideMedia {
  command(command: PlaybackCommand): void;
  /** Called once by the kind's part with what it drew. */
  mount(drawn: DrawnMedia): void;
}

/** How a slide is being shown: as the question, or with the answer revealed. */
export interface SlideView {
  readonly reveal: boolean;
  /** The words of the slide in the quiz's language. */
  readonly labels: SlideLabels;
  /**
   * Gives the address of a media file of the quiz (`QuizFile.media[].id`) that an `<img>`, `<audio>`
   * or `<video>` can load, or `null` when the file is not there. Left out where no media is shown.
   */
  readonly mediaUrl?: (id: string) => string | null;
  /** Gives the description of a media file of the quiz: its shape, its length, its small still. */
  readonly entryOf?: (id: string) => MediaEntry | undefined;
  /**
   * Present = the media is live: a picture can be zoomed, a clip gets its element and its buttons.
   * Left out = a still (thumbnails, the host's small previews): nothing plays and nothing is focusable.
   */
  readonly media?: SlideMedia;
}

/** A question kind on the slide. Without `parts` the slide says "not supported in this version". */
export interface SlideKind extends RegistryEntry {
  /** Which colour marks the kind (`data-tone`). */
  readonly tone: string;
  readonly parts?: {
    /** The kind's media area between the text and the options; `null` when it shows nothing. */
    readonly slide: (question: Question, view: SlideView) => HTMLElement | null;
  };
}

/** An answer type on the slide. Without `parts` the slide says "not supported in this version". */
export interface SlideAnswer extends RegistryEntry {
  readonly parts?: {
    /** How the answer shows under the question, before and at the reveal. */
    readonly slide: (answer: Answer, view: SlideView) => HTMLElement | null;
  };
}

/** The two registries the slide renderer reads; the creator's richer registries fit as they are. */
export interface SlideRegistries {
  readonly kinds: Pick<Registry<SlideKind>, "get">;
  readonly answers: Pick<Registry<SlideAnswer>, "get">;
}

/** An answer type in the player: its slide part and its answer as one line, for the host. */
export interface StageAnswer extends SlideAnswer {
  /** The right answer in words. */
  text(answer: Answer, labels: RevealLabels): string;
}

/** The player's registries. */
export interface StageRegistries {
  readonly kinds: Registry<SlideKind>;
  readonly answers: Registry<StageAnswer>;
}

/**
 * Creates the player's registries.
 * @param kinds - the question kinds
 * @param answers - the answer types
 */
export function createStageRegistries(kinds: readonly SlideKind[], answers: readonly StageAnswer[]): StageRegistries {
  return { kinds: createRegistry<SlideKind>(kinds), answers: createRegistry<StageAnswer>(answers) };
}

/**
 * Whether the slide can draw the question: its kind and its answer type both have their parts.
 * @param question - any question
 * @param ui - the registries
 */
export function canDraw(question: Question, ui: SlideRegistries): boolean {
  return ui.kinds.get(question.kind)?.parts !== undefined && ui.answers.get(question.answer.type)?.parts !== undefined;
}

/**
 * A media file's small still as an address an `<img>` may load: only an inline image passes (the
 * quiz may come from a file someone sent), anything else reads as "no still".
 * @param entry - the file's description
 */
export function stillOf(entry: MediaEntry | undefined): string | null {
  const poster = entry?.poster;
  return poster !== undefined && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(poster) ? poster : null;
}

/** From this width / height on a picture is a panorama: it wants the slide's whole width. */
export const WIDE_RATIO = 2.2;
