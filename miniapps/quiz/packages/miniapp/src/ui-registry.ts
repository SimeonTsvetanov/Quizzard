// The UI halves of the registries (SPEC §3.2, PLAN §2 rule 1): what the creator needs to show a
// question kind or an answer type — registered under the same id as the core entry. The slide part
// of each is the player's (`@simeonts/quizzard-quiz-player/render`, so a question looks the same in
// a thumbnail and when played); the creator adds the face (name, icon) and the editor part. Screens and the slide renderer look entries up by id and never switch on a name. A kind or
// answer type whose UI parts are not registered is "coming soon": listed, never selectable.
import { type Answer, type IdSource, type MediaEntry, type MediaType, type Question, type Registry, type RegistryEntry, type Round, createRegistry } from "@simeonts/quizzard-quiz-core";
import { type SlideAnswer, type SlideKind, type SlideRound, type SlideView, roundSlides } from "@simeonts/quizzard-quiz-player/render";
import type { Lang } from "./contract.ts";
import type { IconName } from "./dom/icons.ts";
import type { TextKey, Translate } from "./i18n/translate.ts";

export type { SlideLabels, SlideView } from "@simeonts/quizzard-quiz-player/render";

/** What an editor part gets: the value, the translator and how to report a change. */
export interface AnswerEditorContext {
  readonly answer: Answer;
  readonly t: Translate;
  readonly ids: IdSource;
  /** Reports the answer after an edit; the editor saves it and redraws the live preview. */
  readonly change: (answer: Answer) => void;
  /** Offers "Undo" after the part removed something a person typed (an option with text); left out where nothing can show it. */
  readonly offerUndo?: (message: string, run: () => void) => void;
  /** The question's place: a special round's answer depends on it (a Golden pyramid's question n asks for n). */
  readonly place?: { readonly round: Round; readonly index: number };
}

/** The file of the question being edited and how to change it; the editor does the storing. */
export interface QuestionFiles {
  /** The media type the question's kind takes (core `QuestionKind.mediaType`); `null` for a kind without a file. */
  readonly type: MediaType | null;
  /** The file the question has now. */
  readonly entry: MediaEntry | undefined;
  /** A small picture of the file for the form, or `null` (an audio clip, no file). */
  readonly still: string | null;
  /** How many other questions of the quiz show the same file. */
  readonly sharedWith: number;
  /**
   * Takes a picked file: checks it, prepares it, stores it and puts it on the question.
   * @returns `null` once the file is on the question (the editor is drawn again), or the message
   * that says why it was refused — nothing was stored then
   */
  pick(file: File): Promise<string | null>;
  /** Takes the file off the question. */
  remove(): void;
  /** Whether a clip can be cut and made smaller in this browser (media/cut/can-cut.ts). */
  readonly canCut: boolean;
  /** Whether a picked file must be cut before the quiz takes it: too big, or in a format a quiz does not carry. */
  needsCut(file: File): boolean;
  /**
   * Opens the cut window for a picked file — or, with `null`, for the file the question has — and
   * takes the new file like {@link pick}.
   * @returns `null` when the new file is on the question or nothing had to change; else the message
   * that says what is still wrong (a file that must be cut was not)
   */
  cut(source: File | null): Promise<string | null>;
}

/** What a kind's editor part gets. */
export interface KindEditorContext {
  readonly question: Question;
  readonly t: Translate;
  readonly lang: Lang;
  readonly files: QuestionFiles;
  /** Ends when the editor is left: what a part listens to outside its own element hangs on it. */
  readonly signal: AbortSignal;
}

/** The parts of a question kind that make it usable: its own editor fields and its area on the slide. */
export interface KindParts {
  /** The kind's own fields in the editor (later: its media picker); `null` when it has none. */
  readonly editor: (context: KindEditorContext) => HTMLElement | null;
  /** The kind's media area on the slide, between the text and the options; `null` when it shows nothing. */
  readonly slide: (question: Question, view: SlideView) => HTMLElement | null;
}

/** A question kind's face in the UI. Without `parts` it is listed as "coming soon". */
export interface KindUi extends RegistryEntry {
  readonly label: TextKey;
  readonly icon: IconName;
  /** Which of the mini-app's colour chips marks the kind (`data-tone`, styles/tones.css). */
  readonly tone: string;
  readonly parts?: KindParts;
}

/** The parts of an answer type: its editor and how it shows on the slide, before and at the reveal. */
export interface AnswerParts {
  readonly editor: (context: AnswerEditorContext) => HTMLElement;
  readonly slide: (answer: Answer, view: SlideView) => HTMLElement | null;
}

/** An answer type's face in the UI. Without `parts` it is listed as "coming soon". */
export interface AnswerUi extends RegistryEntry {
  readonly label: TextKey;
  readonly icon: IconName;
  readonly parts?: AnswerParts;
}

/** The UI registries the screens and the slide renderer work through. */
export interface UiRegistries {
  readonly kinds: Registry<KindUi>;
  readonly answers: Registry<AnswerUi>;
  /** The special rounds on the slide (the player's parts: the pyramid, the vault). */
  readonly rounds: Registry<SlideRound>;
}

/** A kind's name and icon in the creator. */
export interface Face {
  readonly label: TextKey;
  readonly icon: IconName;
}

/**
 * A question kind's creator entry from its slide entry: usable once the slide can draw it AND the
 * creator has its editor part; until then it is listed as "coming soon".
 * @param slide - the kind on the slide (the player's render registry)
 * @param face - its name and icon
 * @param editor - the kind's own fields in the editor; left out while the creator has none
 */
export function kindUi(slide: SlideKind, face: Face, editor?: KindParts["editor"]): KindUi {
  const base: KindUi = { id: slide.id, tone: slide.tone, ...face };
  return slide.parts && editor ? { ...base, parts: { editor, slide: slide.parts.slide } } : base;
}

/**
 * An answer type's creator entry from its slide entry and its editor part.
 * @param slide - the answer type on the slide (the player's render registry)
 * @param face - its name and icon
 * @param editor - the answer's editor
 */
export function answerUi(slide: SlideAnswer, face: Face, editor: AnswerParts["editor"]): AnswerUi {
  const base: AnswerUi = { id: slide.id, ...face };
  return slide.parts ? { ...base, parts: { editor, slide: slide.parts.slide } } : base;
}

/**
 * Creates a set of UI registries; `kinds-ui/` and `answers-ui/` fill the app's own.
 * @param kinds - question kinds, in any order (the core registry gives the pickers their order)
 * @param answers - answer types
 */
export function createUiRegistries(kinds: readonly KindUi[] = [], answers: readonly AnswerUi[] = []): UiRegistries {
  return { kinds: createRegistry<KindUi>(kinds), answers: createRegistry<AnswerUi>(answers), rounds: createRegistry<SlideRound>(roundSlides) };
}

/** What a picker shows for one id: its face and whether it can be chosen. */
export interface Choice {
  readonly id: string;
  readonly icon: IconName;
  /** The translated name, or the id itself for an entry without a face. */
  readonly label: string;
  readonly tone: string;
  readonly isAvailable: boolean;
}

/** The face every id without a UI entry gets: its own id as the name, a neutral mark, not selectable. */
function faceless(id: string): Choice {
  return { id, icon: "unknown", label: id, tone: "none", isAvailable: false };
}

/**
 * The kind picker's entries: every kind the core knows, selectable only when its UI parts are registered.
 * @param ids - the core registry's kind ids, in its order
 * @param ui - the UI registries
 * @param t - the translator
 */
export function kindChoices(ids: readonly string[], ui: UiRegistries, t: Translate): readonly Choice[] {
  return ids.map((id) => {
    const entry = ui.kinds.get(id);
    return entry ? { id, icon: entry.icon, label: t(entry.label), tone: entry.tone, isAvailable: entry.parts !== undefined } : faceless(id);
  });
}

/**
 * The answer-type picker's entries: every type the core knows, selectable only with UI parts.
 * @param ids - the core registry's answer-type ids, in its order
 * @param ui - the UI registries
 * @param t - the translator
 */
export function answerChoices(ids: readonly string[], ui: UiRegistries, t: Translate): readonly Choice[] {
  return ids.map((id) => {
    const entry = ui.answers.get(id);
    return entry ? { id, icon: entry.icon, label: t(entry.label), tone: "none", isAvailable: entry.parts !== undefined } : faceless(id);
  });
}

/**
 * Whether the creator can edit and draw the question: its kind and its answer type both have UI parts.
 * @param question - any question
 * @param ui - the UI registries
 */
export function canShow(question: Question, ui: UiRegistries): boolean {
  return ui.kinds.get(question.kind)?.parts !== undefined && ui.answers.get(question.answer.type)?.parts !== undefined;
}
