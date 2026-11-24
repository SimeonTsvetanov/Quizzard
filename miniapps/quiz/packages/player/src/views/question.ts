import { effectivePoints } from "@simeonts/quizzard-quiz-core/play";
import { pointsText, renderSlide } from "../render/slide.ts";
import type { DrawnView, HostAnswer, ViewContext, ViewEntry } from "./context.ts";
import { viewRoot } from "./parts.ts";

/**
 * The right answer of the context's question in words, for the host.
 * @param context - a question or answer screen
 */
export function hostAnswer({ env, round, question }: ViewContext): HostAnswer | null {
  if (!round || !question) return null;
  const text = env.parts.answers.get(question.answer.type)?.text(question.answer, env.labels) ?? "";
  return { text, explanation: question.explanation?.trim() ?? "", points: pointsText(effectivePoints(round, question), env.labels) };
}

/**
 * The slide of the context's question.
 * @param context - a question or answer screen
 * @param isRevealed - whether the answer shows
 * @param clock - what stands where the time is (see `SlideInput.clock`)
 */
export function slideOf({ env, round, question }: ViewContext, isRevealed: boolean, clock: HTMLElement | null | undefined): HTMLElement | null {
  if (!round || !question) return null;
  return renderSlide({
    question,
    round,
    number: round.questions.indexOf(question) + 1,
    reveal: isRevealed,
    ui: env.parts,
    labels: env.labels,
    ...(clock === undefined ? {} : { clock }),
    ...(env.mediaUrl ? { mediaUrl: env.mediaUrl } : {}),
  });
}

/** The smallest a crowded slide is drawn at, against its normal size. */
const FIT_MIN = 0.5;
const FIT_STEP = 0.05;

/**
 * Makes a slide's content fit its height: a long question with eight options and an explanation is
 * drawn a little smaller, step by step, until nothing is cut off. A slide that fits is left at its
 * full size. The size is the canvas's `zoom`: the stylesheet names the layout's own (`--qp-zoom`,
 * larger on an upright screen) and this sets the number — a plain number, which every engine that
 * knows `zoom` takes.
 * @param root - the slide's view
 */
export function fitSlide(root: HTMLElement): void {
  const canvas = root.querySelector<HTMLElement>(".quiz-slide-canvas");
  if (!canvas) return;
  canvas.style.removeProperty("zoom");
  const base = Number(getComputedStyle(canvas).getPropertyValue("--qp-zoom")) || 1;
  for (let fit = 1; fit >= FIT_MIN; fit -= FIT_STEP) {
    canvas.style.setProperty("zoom", (base * fit).toFixed(3));
    if (canvas.scrollHeight <= canvas.clientHeight + 1) return;
  }
}

/**
 * The view of a question's slide: the slide in the middle of the stage, the kind's colour glowing
 * from the stage's own corner (the slide keeps a slide's width on a very wide screen).
 * @param context - a question or answer screen
 * @param slide - the slide, from {@link slideOf}
 */
export function slideView({ env, question }: ViewContext, slide: HTMLElement | null): DrawnView {
  const root = viewRoot("slide-view", slide ?? "");
  root.setAttribute("data-tone", env.parts.kinds.get(question?.kind ?? "")?.tone ?? "none");
  return { element: root, layout: () => { fitSlide(root); } };
}

/** A question with its timer: the shared slide, the running dial where the time chip is. */
export const questionView: ViewEntry = {
  id: "question",
  // In a preview there is no dial: the slide shows the question's time as its chip.
  stage: (context) => slideView(context, slideOf(context, false, context.clock ?? undefined)),
  answer: hostAnswer,
};
