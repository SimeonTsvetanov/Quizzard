// The only file that lists the answer types' UI entries.
import type { AnswerUi } from "../ui-registry.ts";
import { choiceAnswerUi } from "./choice.ts";
import { digitAnswerUi } from "./digit.ts";
import { listAnswerUi } from "./list.ts";
import { openAnswerUi } from "./open.ts";
import { trueFalseAnswerUi } from "./true-false.ts";

/** Every answer type the UI has parts for. */
export const answerUis: readonly AnswerUi[] = [openAnswerUi, choiceAnswerUi, trueFalseAnswerUi, listAnswerUi, digitAnswerUi];
