// The UI halves of the registries (SPEC §3.2, PLAN §2 rule 1): what the creator and, later, the
// player need to show a question kind or an answer type — registered under the same id as the core
// entry. Screens and the slide renderer look entries up by id and never switch on a name. A kind or
// answer type whose UI parts are not registered is "coming soon": listed, never selectable.
import { type Answer, type IdSource, type Question, type Registry, type RegistryEntry, createRegistry } from "@simeonts/quizzard-quiz-core";
import type { IconName } from "./dom/icons.ts";
import type { TextKey, Translate } from "./i18n/translate.ts";

/** How a slide is being shown: as the question, or with the answer revealed. */
export interface SlideView {
  readonly reveal: boolean;
  /** The words of the slide in the quiz's language. */
  readonly labels: SlideLabels;
}

/** Every word a slide can show; the caller translates, the renderer has no dictionary of its own. */
export interface SlideLabels {
  readonly trueText: string;
  readonly falseText: string;
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
}

/** What an editor part gets: the value, the translator and how to report a change. */
export interface AnswerEditorContext {
  readonly answer: Answer;
  readonly t: Translate;
  readonly ids: IdSource;
  /** Reports the answer after an edit; the editor saves it and redraws the live preview. */
  readonly change: (answer: Answer) => void;
}

/** What a kind's editor part gets. */
export interface KindEditorContext {
  readonly question: Question;
  readonly t: Translate;
}

/** The parts of a question kind that make it usable: its own editor fields and its area on the slide. */
export interface KindParts {
  /** The kind's own fields in the editor (later: its media picker); `null` when it has none. */
  editor(context: KindEditorContext): HTMLElement | null;
  /** The kind's media area on the slide, between the text and the options; `null` when it shows nothing. */
  slide(question: Question, view: SlideView): HTMLElement | null;
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
  editor(context: AnswerEditorContext): HTMLElement;
  slide(answer: Answer, view: SlideView): HTMLElement | null;
}

/** An answer type's face in the UI. Without `parts` it is listed as "coming soon". */
export interface AnswerUi extends RegistryEntry {
  readonly label: TextKey;
  readonly icon: IconName;
  readonly parts?: AnswerParts;
}

/** The two UI registries the screens and the slide renderer work through. */
export interface UiRegistries {
  readonly kinds: Registry<KindUi>;
  readonly answers: Registry<AnswerUi>;
}

/**
 * Creates a set of UI registries; `kinds-ui/` and `answers-ui/` fill the app's own.
 * @param kinds - question kinds, in any order (the core registry gives the pickers their order)
 * @param answers - answer types
 */
export function createUiRegistries(kinds: readonly KindUi[] = [], answers: readonly AnswerUi[] = []): UiRegistries {
  return { kinds: createRegistry<KindUi>(kinds), answers: createRegistry<AnswerUi>(answers) };
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
