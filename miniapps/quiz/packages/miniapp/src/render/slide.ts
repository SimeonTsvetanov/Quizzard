// The one slide renderer (PLAN §2): the 16:9 thumbnails, the editor's live preview and the Preview
// screen draw a question with it, and so will the player — so it knows nothing of the creator: it
// gets the question, its round, the UI registries and the words, and returns the slide.
// Layout top to bottom: number, round, time and points · the question text · the kind's media area
// (later) · the answer part · the explanation at the reveal.
// Scaling: the slide is a 16:9 size container and every size on its canvas is in `cqi`
// (styles/slide.css), so the same markup is a thumbnail or a projector slide with crisp text and no
// script — a scale transform would blur small thumbnails and needs a resize observer.
import { type Points, type Question, type Round, effectivePoints, effectiveSeconds } from "@simeonts/quizzard-quiz-core";
import { h } from "../dom/h.ts";
import { icon } from "../dom/icons.ts";
import { canShow, type SlideLabels, type SlideView, type UiRegistries } from "../ui-registry.ts";

/** What one slide is drawn from. */
export interface SlideInput {
  readonly question: Question;
  /** The question's round: its name and the time and points the question takes from it. */
  readonly round: Round;
  /** The question's number in its round, from 1. */
  readonly number: number;
  /** `true` = the answer and the explanation are shown. */
  readonly reveal: boolean;
  readonly ui: UiRegistries;
  readonly labels: SlideLabels;
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

/** The top line: number, round name, time and points. */
function topLine({ question, round, number, labels }: SlideInput): HTMLElement {
  const time = h("span", { class: "quiz-slide-chip", "data-slide-time": "" }, icon("time", 16), h("span", {}, labels.seconds(effectiveSeconds(round, question))));
  const points = h("span", { class: "quiz-slide-chip quiz-slide-chip--points", "data-slide-points": "" }, icon("points", 16), h("span", {}, pointsText(effectivePoints(round, question), labels)));
  return h("div", { class: "quiz-slide-top" },
    h("span", { class: "quiz-slide-number" }, String(number)),
    h("span", { class: "quiz-slide-round" }, round.name),
    h("span", { class: "quiz-slide-meta" }, time, points));
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
 * @returns the slide element; its width decides its size (16:9)
 */
export function renderSlide(input: SlideInput): HTMLElement {
  const { question, reveal, ui, labels } = input;
  const view: SlideView = { reveal, labels };
  const isEmpty = question.prompt.trim() === "";
  const canvas = h("div", { class: "quiz-slide-canvas" }, topLine(input));
  const slide = h("div", { class: "quiz-slide", "data-tone": ui.kinds.get(question.kind)?.tone ?? "none", "data-size": promptSize(question.prompt), ...(reveal ? { "data-reveal": "" } : {}) }, canvas);
  if (!canShow(question, ui)) {
    canvas.append(h("p", { class: "quiz-slide-prompt", "data-empty": "" }, labels.unsupported));
    return slide;
  }
  canvas.append(h("p", { class: "quiz-slide-prompt", ...(isEmpty ? { "data-empty": "" } : {}) }, isEmpty ? labels.emptyPrompt : question.prompt));
  for (const part of parts(input, view)) if (part !== null) canvas.append(part);
  const explanation = question.explanation?.trim() ?? "";
  if (reveal && explanation !== "") canvas.append(h("p", { class: "quiz-slide-explanation" }, icon("hint", 16), h("span", {}, explanation)));
  return slide;
}
