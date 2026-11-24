// The one slide renderer (PLAN §2): the creator's 16:9 thumbnails, its live preview and Preview
// screen, and the player's question and answer screens draw a question with it. It knows nothing of
// either: it gets the question, its round, the registries and the words, and returns the slide.
// Layout top to bottom: number, round, time and points · the question text · the kind's media area
// · the answer part · the explanation at the reveal.
// Scaling: the slide is a size container and every size on its canvas is in `cqi` (slide.css), so
// the same markup is a thumbnail or a projector slide with crisp text and no script.
import { type Points, type Question, type Round, effectivePoints, effectiveSeconds } from "@simeonts/quizzard-quiz-core/play";
import { h } from "./h.ts";
import { icon } from "./icons.ts";
import { canDraw, type SlideLabels, type SlideRegistries, type SlideView } from "./registry.ts";

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
  return h("div", { class: "quiz-slide-top" },
    h("span", { class: "quiz-slide-number" }, String(number)),
    h("span", { class: "quiz-slide-round" }, round.name),
    meta);
}

/** The middle of a slide this version can draw: the kind's and the answer type's own parts. */
function parts({ question, ui }: SlideInput, view: SlideView): (HTMLElement | null)[] {
  const media = ui.kinds.get(question.kind)?.parts?.slide(question, view) ?? null;
  const answer = ui.answers.get(question.answer.type)?.parts?.slide(question.answer, view) ?? null;
  return [media === null ? null : h("div", { class: "quiz-slide-media" }, media), answer === null ? null : h("div", { class: "quiz-slide-answer" }, answer)];
}

/**
 * Draws one question as a slide.
 * @param input - the question, its round, how it is shown and the registries
 * @returns the slide element; its width decides its size (16:9 unless its container gives it a height)
 */
export function renderSlide(input: SlideInput): HTMLElement {
  const { question, reveal, ui, labels } = input;
  const view: SlideView = { reveal, labels, ...(input.mediaUrl ? { mediaUrl: input.mediaUrl } : {}) };
  const isEmpty = question.prompt.trim() === "";
  const canvas = h("div", { class: "quiz-slide-canvas" }, topLine(input));
  const slide = h("div", { class: "quiz-slide", "data-tone": ui.kinds.get(question.kind)?.tone ?? "none", "data-size": promptSize(question.prompt), ...(reveal ? { "data-reveal": "" } : {}) }, canvas);
  if (!canDraw(question, ui)) {
    canvas.append(h("p", { class: "quiz-slide-prompt", "data-empty": "" }, labels.unsupported));
    return slide;
  }
  canvas.append(h("p", { class: "quiz-slide-prompt", ...(isEmpty ? { "data-empty": "" } : {}) }, isEmpty ? labels.emptyPrompt : question.prompt));
  for (const part of parts(input, view)) if (part !== null) canvas.append(part);
  const explanation = question.explanation?.trim() ?? "";
  if (reveal && explanation !== "") canvas.append(h("p", { class: "quiz-slide-explanation" }, icon("hint", 16), h("span", {}, explanation)));
  return slide;
}
