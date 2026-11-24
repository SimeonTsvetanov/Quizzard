// The drawn halves of question kinds and answer types that the slide needs (SPEC §3.2): each is
// registered under the same id as its core entry, and the slide renderer looks them up — it never
// switches on a name. The creator adds its editor parts to these same entries (its ui-registry.ts);
// the player uses them as they are.
import { type Answer, type MediaEntry, type Playback, type PlaybackCommand, type Question, type Registry, type RegistryEntry, type RevealLabels, type Round, createRegistry } from "@simeonts/quizzard-quiz-core/play";

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
  /** The words of the special rounds' parts of a slide. */
  readonly special: SpecialLabels;
}

/** What the special rounds' parts of a slide say (SPEC §10). */
export interface SpecialLabels {
  /** "Write 3 answers" */
  write(count: number): string;
  /** "More than 3 answers: 0 points" */
  over(count: number): string;
  /** "Accepted answers" */
  readonly accepted: string;
  /** "+38 more" */
  more(count: number): string;
  /** "Answer with one digit: 0–9" */
  readonly oneDigit: string;
  /** "Digit 3 of the code" */
  codeDigit(n: number): string;
  /** The pyramid's and the vault's name for screen readers: "Golden pyramid, question 3 of 4" */
  pyramid(n: number, total: number): string;
  safe(n: number, total: number): string;
}

/** What a slide says about its media. */
export interface MediaLabels {
  /** Shown where a file should be and is not. */
  readonly missing: string;
  /** Names of the buttons on the slide. */
  readonly zoom: string;
  /** The key that zooms where the slide is shown, for the button's tooltip ("Zoom (Z)"); left out = no key there. */
  readonly zoomKey?: string;
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

/** Where a special round's slide is shown: with a question, or with its answer (SPEC §10). */
export type SlidePhase = "question" | "answer";

/** What a round kind's slide parts get besides the view. */
export interface RoundSlideView extends SlideView {
  /** The question's round and its place in it, from 0. */
  readonly round: Round;
  readonly index: number;
  readonly phase: SlidePhase;
}

/**
 * A round kind on the slide (SPEC §10): its picture beside the question (the pyramid, the vault) and,
 * when it says more than the answer type does, its own answer area. A standard round has no entry.
 */
export interface SlideRound extends RegistryEntry {
  readonly parts: {
    /** The round's picture: beside the slide's content on a wide slide, above it on an upright one. */
    readonly art: (question: Question, view: RoundSlideView) => HTMLElement;
    /** The answer area instead of the answer type's own; left out = the answer type's. */
    readonly answer?: (question: Question, view: RoundSlideView) => HTMLElement | null;
  };
}

/** The registries the slide renderer reads; the creator's richer registries fit as they are. */
export interface SlideRegistries {
  readonly kinds: Pick<Registry<SlideKind>, "get">;
  readonly answers: Pick<Registry<SlideAnswer>, "get">;
  /** The special rounds; left out = every round is drawn as a standard one. */
  readonly rounds?: Pick<Registry<SlideRound>, "get">;
}

/** An answer type in the player: its slide part and its answer as one line, for the host. */
export interface StageAnswer extends SlideAnswer {
  /** The right answer in words. */
  text(answer: Answer, labels: RevealLabels): string;
  /** The right answer as a list of the round's answers writes it, when that differs: a choice with its letters ("A: Mars · C: Venus"). */
  line?(answer: Answer, labels: RevealLabels): string;
}

/** The player's registries. */
export interface StageRegistries {
  readonly kinds: Registry<SlideKind>;
  readonly answers: Registry<StageAnswer>;
  readonly rounds: Registry<SlideRound>;
}

/**
 * Creates the player's registries.
 * @param kinds - the question kinds
 * @param answers - the answer types
 * @param rounds - the special round kinds
 */
export function createStageRegistries(kinds: readonly SlideKind[], answers: readonly StageAnswer[], rounds: readonly SlideRound[] = []): StageRegistries {
  return { kinds: createRegistry<SlideKind>(kinds), answers: createRegistry<StageAnswer>(answers), rounds: createRegistry<SlideRound>(rounds) };
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
/** Up to this width / height a picture or a video is upright: on a wide slide it stands beside the text at full height. */
export const TALL_RATIO = 0.9;

/**
 * How a picture or a video of a known shape wants to stand on the slide (`data-layout`): `wide` = the
 * whole width (a panorama), `tall` = beside the text at the slide's full height (upright), nothing =
 * between the question and the answer, or beside the options.
 * @param entry - the file's description; without its size nothing is asked for
 */
export function layoutOf(entry: MediaEntry | undefined): Readonly<Record<string, string>> {
  if (entry?.width === undefined || entry.height === undefined || entry.width <= 0 || entry.height <= 0) return {};
  const ratio = entry.width / entry.height;
  if (ratio >= WIDE_RATIO) return { "data-layout": "wide" };
  return ratio <= TALL_RATIO ? { "data-layout": "tall" } : {};
}

/**
 * The zoom button of a picture or a video: its mark, its name, and its key in the tooltip.
 * @param labels - the words
 * @returns how to make an element that button, and how to show whether the media is zoomed
 */
export function zoomFace(labels: MediaLabels): { readonly props: Readonly<Record<string, string>>; readonly title: string } {
  const title = labels.zoomKey === undefined ? labels.zoom : `${labels.zoom} (${labels.zoomKey})`;
  return { title, props: { "aria-label": labels.zoom, title, "aria-pressed": "false", "data-slide-zoom": "", ...(labels.zoomKey === undefined ? {} : { "aria-keyshortcuts": labels.zoomKey }) } };
}
