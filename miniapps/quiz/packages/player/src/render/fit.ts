// A slide never cuts its text (Moni 2026-11-25): the question, the answer, the options and the text with the
// answer lose their line limits and are drawn smaller, step by step, until the slide holds all of them. A slide
// that fits is left as the stylesheet sets it. Works wherever a slide is drawn: thumbnails, the editor's live
// preview, the Preview screen, the stage and the exported quiz.

/** The texts whose stylesheet rules end them in "…" after a few lines (the fallback without this fit). */
const CLAMPED = ".quiz-slide-prompt, .quiz-slide-right, .quiz-slide-option-text, .quiz-slide-explanation span";
/** The blocks that shrink together, so the slide keeps its order of weight. */
const BLOCKS = ".quiz-slide-prompt, .quiz-slide-answer, .quiz-slide-explanation";
/** The smallest the texts are drawn at, against their normal size. */
const TEXT_FIT_MIN = 0.2;
const TEXT_FIT_STEP = 0.05;

/** The texts in which a word is never broken over two lines while a smaller size can keep it whole (Moni 2026-11-26: "Австрали-я"). */
const WHOLE_WORDS = ".quiz-slide-right";
/** The smallest a text is drawn at so that its longest word stays on one line; below it the word breaks after all. */
const WORD_FIT_MIN = 0.3;

/** Draws a text smaller until its longest word fits its line; a word too long even for that is broken as before. */
function keepWordsWhole(text: HTMLElement): void {
  text.style.removeProperty("zoom");
  text.style.setProperty("overflow-wrap", "normal");
  for (let fit = 1 - TEXT_FIT_STEP; text.scrollWidth > text.clientWidth + 1 && fit >= WORD_FIT_MIN - 0.001; fit -= TEXT_FIT_STEP) {
    text.style.setProperty("zoom", fit.toFixed(2));
  }
  if (text.scrollWidth > text.clientWidth + 1) {
    text.style.removeProperty("zoom");
    text.style.removeProperty("overflow-wrap");
  }
}

/** Whether a block is squeezed shorter than its text; a quarter of a line is the letters' own overhang, not a cut. */
function isSqueezed(block: HTMLElement): boolean {
  return block.scrollHeight - block.clientHeight > (parseFloat(getComputedStyle(block).lineHeight) || 4) / 4;
}

/** Whether anything is lost: content below the canvas, or a block squeezed shorter than its text. */
function isCut(canvas: HTMLElement, blocks: readonly HTMLElement[]): boolean {
  return canvas.scrollHeight > canvas.clientHeight + 1 || blocks.some(isSqueezed);
}

/**
 * Makes a slide's texts fit its height without cutting any of them.
 * @param slide - a drawn slide, in the page (a slide without a size yet is left alone)
 */
export function fitSlideText(slide: HTMLElement): void {
  const canvas = slide.querySelector<HTMLElement>(".quiz-slide-canvas");
  if (!canvas || canvas.clientHeight === 0) return;
  for (const text of slide.querySelectorAll<HTMLElement>(CLAMPED)) text.style.setProperty("-webkit-line-clamp", "none");
  for (const text of slide.querySelectorAll<HTMLElement>(WHOLE_WORDS)) keepWordsWhole(text);
  const blocks = [...slide.querySelectorAll<HTMLElement>(BLOCKS)];
  for (const block of blocks) block.style.removeProperty("zoom");
  for (let fit = 1 - TEXT_FIT_STEP; isCut(canvas, blocks) && fit >= TEXT_FIT_MIN - 0.001; fit -= TEXT_FIT_STEP) {
    for (const block of blocks) block.style.setProperty("zoom", fit.toFixed(2));
  }
}

/** The slides kept fitted, held weakly: a slide that left the page is forgotten with it. */
const kept = new Set<WeakRef<HTMLElement>>();
let isWatchingFonts = false;

/** Fits every kept slide again when a font arrives: the answer's display font is often first used at the reveal. */
function watchFonts(): void {
  if (isWatchingFonts) return;
  isWatchingFonts = true;
  document.fonts.addEventListener("loadingdone", () => {
    for (const reference of kept) {
      const slide = reference.deref();
      if (slide?.isConnected) fitSlideText(slide); else kept.delete(reference);
    }
  });
}

/**
 * Keeps a slide's texts fitted: when it enters the page, when its size changes and when a font comes in.
 * @param slide - a slide just drawn (it need not be in the page yet)
 */
export function keepSlideFitted(slide: HTMLElement): void {
  if (typeof ResizeObserver === "undefined") return;
  // Once more a frame later: the first look can come before the slide's own layout has settled.
  new ResizeObserver(() => {
    fitSlideText(slide);
    requestAnimationFrame(() => { fitSlideText(slide); });
  }).observe(slide);
  kept.add(new WeakRef(slide));
  watchFonts();
}
