// The only file that lists the answer types the slide knows.
import type { StageAnswer } from "../registry.ts";
import { choiceAnswerSlide } from "./choice.ts";
import { openAnswerSlide } from "./open.ts";
import { trueFalseAnswerSlide } from "./true-false.ts";

/** Every answer type the slide can draw. */
export const answerSlides: readonly StageAnswer[] = [openAnswerSlide, choiceAnswerSlide, trueFalseAnswerSlide];
