// The one slide renderer (PLAN §2): the creator's 16:9 thumbnails, its live preview and Preview
// screen, and the player's question and answer screens draw a question with it. It knows nothing of
// either: it gets the question, its round, the registries and the words, and returns the slide.
// Layout top to bottom: number, round, time and points · the question text · the kind's media area
// · the answer part · the explanation at the reveal. With media the options may stand next to it
// instead of under it (slide.css decides by `data-media` and the number of options).
// Scaling: the slide is a size container and every size on its canvas is in `cqi` (slide.css), so
// the same markup is a thumbnail or a projector slide with crisp text. One script helps: fit.ts draws
// the texts smaller when a slide would otherwise cut them.
import { keepSlideFitted } from "./fit.ts";
import { type MediaEntry, type Points, type Question, type Round, effectivePoints, effectiveSeconds } from "@simeonts/quizzard-quiz-core/play";
import { countMark } from "./count.ts";
import { h } from "./h.ts";
import { icon } from "./icons.ts";
import { canDraw, type RoundSlideView, type SlideLabels, type SlideMedia, type SlidePhase, type SlideRegistries, type SlideView } from "./registry.ts";

/** What one slide is drawn from. */
export interface SlideInput {
  readonly question: Question;
  /** The question's round: its name and the time and points the question takes from it. */
  readonly round: Round;
  /** The question's number in its round, from 1. */
  readonly number: number;
  /** `true` = the answer and the explanation are shown. */
  readonly reveal: boolean;
  readonly ui: SlideRegistries;
  readonly labels: SlideLabels;
  /**
   * What stands where the time is: left out = the question's time as a chip ("30 s"); an element =
   * that element (the player's running dial); `null` = nothing (the player's answer screens).
   */
  readonly clock?: HTMLElement | null;
  /** Gives the address of a media file of the quiz; see {@link SlideView.mediaUrl}. */
  readonly mediaUrl?: (id: string) => string | null;
  /** Gives the description of a media file; see {@link SlideView.entryOf}. */
  readonly entryOf?: (id: string) => MediaEntry | undefined;
  /** Makes the media live; see {@link SlideView.media}. */
  readonly media?: SlideMedia;
  /** The round's place among the quiz's rounds ("Round 2/5" before its name); left out = the name alone. */
  readonly roundPlace?: { readonly n: number; readonly total: number };
  /** A special round's picture follows the game: shown with the question (the default) or with its answer. */
  readonly phase?: SlidePhase;
}

/** Text lengths at which the question text steps down a size. */
const PROMPT_STEPS: readonly (readonly [number, string])[] = [[70, "l"], [160, "m"], [320, "s"]];

/**
 * The size step of a question text by its length, so a long question still fits the slide.
 * @param prompt - the question text
 * @returns `"l"`, `"m"`, `"s"` or `"xs"`
 */
export function promptSize(prompt: string): string {
  return PROMPT_STEPS.find(([max]) => prompt.length <= max)?.[1] ?? "xs";
}

/** The question kind whose slide part draws the picture kept with an answer. */
const ANSWER_FILE_KINDS: Readonly<Record<string, string>> = { image: "picture", audio: "audio", video: "video" };

/** Text lengths at which the revealed answer steps down a size. */
const ANSWER_STEPS: readonly (readonly [number, string])[] = [[22, "s"], [48, "m"]];

/**
 * The size step of a revealed answer by its length, so a long one stays inside its part of the slide.
 * @param answer - the answer as the slide writes it
 * @returns `"s"` (short, the largest size), `"m"` or `"l"`
 */
export function answerSize(answer: string): string {
  return ANSWER_STEPS.find(([max]) => answer.length <= max)?.[1] ?? "l";
}

/** Text lengths at which the explanation steps down a size. */
const EXPLANATION_STEPS: readonly (readonly [number, string])[] = [[140, "s"], [300, "m"]];

/**
 * The size step of an explanation by its length: `"s"` (short, the usual size), `"m"` or `"l"`.
 * @param explanation - the text shown with the answer
 */
export function explanationSize(explanation: string): string {
  return EXPLANATION_STEPS.find(([max]) => explanation.length <= max)?.[1] ?? "l";
}

/**
 * Points as the teams read them: the number, the note, or both (SPEC F6, AC3).
 * @param points - the points the question is played for
 * @param labels - gives "2 points"
 * @returns e.g. `"2 points"`, `"1 for the band, 2 with the song"` or `"2 points · half for the year"`
 */
export function pointsText(points: Points, labels: Pick<SlideLabels, "points">): string {
  const note = points.note?.trim() ?? "";
  if (note === "") return labels.points(points.value);
  return points.value > 0 ? `${labels.points(points.value)} · ${note}` : note;
}

/** The time of the top line: the chip, the caller's clock, or nothing. */
function timePart({ question, round, labels, clock }: SlideInput): HTMLElement | null {
  if (clock !== undefined) return clock;
  return h("span", { class: "quiz-slide-chip", "data-slide-time": "" }, icon("time", 16), h("span", {}, labels.seconds(effectiveSeconds(round, question))));
}

/** The top line: number, round name, time and points. */
function topLine(input: SlideInput): HTMLElement {
  const { question, round, number, labels } = input;
  const points = h("span", { class: "quiz-slide-chip quiz-slide-chip--points", "data-slide-points": "" }, icon("points", 16), h("span", {}, pointsText(effectivePoints(round, question), labels)));
  const meta = h("span", { class: "quiz-slide-meta" }, points);
  const time = timePart(input);
  if (time !== null) meta.prepend(time);
  // "3/10" and "Round 2/5 · History": the place first, out of how many right after it, quieter.
  const where = h("span", { class: "quiz-slide-round" });
  if (input.roundPlace) where.append(`${labels.round} `, countMark(input.roundPlace.n, input.roundPlace.total, labels.of(input.roundPlace.n, input.roundPlace.total)), " · ");
  where.append(round.name);
  const total = round.questions.length;
  const numberMark = h("span", { class: "quiz-slide-number", "data-slide-number": "" }, countMark(number, total, labels.of(number, total)));
  // At the reveal the word "Answer" stands up here, next to the question's number — not between the
  // question and its answer (Moni 2026-11-25).
  const revealMark = input.reveal ? [h("span", { class: "quiz-slide-reveal-mark", "data-slide-reveal-mark": "" }, labels.answer)] : [];
  return h("div", { class: "quiz-slide-top" }, numberMark, ...revealMark, where, meta);
}

/** The middle of a slide this version can draw: the kind's part and the answer type's — or the special round's answer area. */
function parts({ question, ui, round }: SlideInput, view: SlideView, special: RoundSlideView | null): (HTMLElement | null)[] {
  // At the reveal the file kept for the answer — a picture or a clip (Moni 2026-11-25, 26) — is shown in place of
  // the question's own, drawn by the kind of its type whatever the question's kind is. A thumbnail without
  // `entryOf` takes it for a picture.
  const forAnswer = view.reveal ? question.answerMedia : undefined;
  const answerKind = forAnswer ? ANSWER_FILE_KINDS[view.entryOf?.(forAnswer.id)?.type ?? "image"] : undefined;
  const media = forAnswer && answerKind !== undefined
    ? (ui.kinds.get(answerKind)?.parts?.slide({ ...question, media: forAnswer }, view) ?? null)
    : (ui.kinds.get(question.kind)?.parts?.slide(question, view) ?? null);
  const own = special ? ui.rounds?.get(round.kind)?.parts.answer : undefined;
  const answer = own && special ? own(question, special) : (ui.answers.get(question.answer.type)?.parts?.slide(question.answer, view) ?? null);
  return [media === null ? null : h("div", { class: "quiz-slide-media" }, media), answer === null ? null : h("div", { class: "quiz-slide-answer" }, answer)];
}

/**
 * Draws one question as a slide.
 * @param input - the question, its round, how it is shown and the registries
 * @returns the slide element; its width decides its size (16:9 unless its container gives it a height)
 */
export function renderSlide(input: SlideInput): HTMLElement {
  const slide = drawSlide(input);
  keepSlideFitted(slide);
  return slide;
}

/** Builds the slide's markup. */
function drawSlide(input: SlideInput): HTMLElement {
  const { question, reveal, ui, labels } = input;
  const view: SlideView = {
    reveal, labels,
    ...(input.mediaUrl ? { mediaUrl: input.mediaUrl } : {}),
    ...(input.entryOf ? { entryOf: input.entryOf } : {}),
    ...(input.media ? { media: input.media } : {}),
  };
  // A round that states its own task ("Make the quizmaster laugh") shows it first; the question's text only adds to it.
  const task = labels.roundTask?.(input.round.kind);
  const prompt = task === undefined ? question.prompt : [task, question.prompt.trim()].filter((part) => part !== "").join("\n\n");
  const isEmpty = prompt.trim() === "";
  const canvas = h("div", { class: "quiz-slide-canvas" }, topLine(input));
  const slide = h("div", { class: "quiz-slide", "data-tone": ui.kinds.get(question.kind)?.tone ?? "none", "data-size": promptSize(prompt), ...(reveal ? { "data-reveal": "" } : {}) }, canvas);
  // A special round's picture stands beside the content (above it on an upright stage).
  const round = ui.rounds?.get(input.round.kind);
  const special: RoundSlideView | null = round ? { ...view, round: input.round, index: input.number - 1, phase: input.phase ?? "question" } : null;
  if (round && special) {
    slide.setAttribute("data-art", round.id);
    slide.prepend(round.parts.art(question, special));
  }
  if (!canDraw(question, ui)) {
    canvas.append(h("p", { class: "quiz-slide-prompt", "data-empty": "" }, labels.unsupported));
    return slide;
  }
  canvas.append(h("p", { class: "quiz-slide-prompt", ...(isEmpty ? { "data-empty": "" } : {}) }, isEmpty ? labels.emptyPrompt : prompt));
  const [media, answer] = parts(input, view, special);
  // A part that wants the slide's whole width (a panorama, an audio bar) says so; the others may share the row with the options.
  if (media) slide.setAttribute("data-media", media.firstElementChild?.getAttribute("data-layout") ?? "side");
  for (const part of [media, answer]) if (part) canvas.append(part);
  const right = reveal ? (answer?.querySelector(".quiz-slide-right") ?? null) : null;
  if (right) slide.setAttribute("data-answer", answerSize(right.textContent));
  const explanation = question.explanation?.trim() ?? "";
  // A long explanation is set smaller (`data-length`), so all of it is read on the stage, never cut (Moni 2026-11-25).
  if (reveal && explanation !== "") canvas.append(h("p", { class: "quiz-slide-explanation", "data-length": explanationSize(explanation) }, icon("hint", 16), h("span", {}, explanation)));
  return slide;
}
