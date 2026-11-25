import type { StageAnswer } from "../registry.ts";

/** Answer type `none` on the slide: nothing — the screen is a task, and nothing is revealed. */
export const noneAnswerSlide: StageAnswer = {
  id: "none",
  text: () => "",
  parts: { slide: () => null },
};
