import { z } from "zod";
import { ANSWER_TEXT_MAX, LIST_ITEMS_MAX, cut } from "../limits.ts";
import type { AnswerType } from "./answer-type.ts";
import { type ListAnswer, acceptedItems, listReveal } from "./special-shapes.ts";

export { acceptedItems, isListAnswer, type ListAnswer } from "./special-shapes.ts";

const schema = z.looseObject({ type: z.literal("list"), items: z.array(z.string()) });

/**
 * Answer type `list` (SPEC §10): the answers that count — a Golden pyramid question's accepted answers.
 * Complete with one answer; how many a question needs is its round's rule (round-kind `isComplete`).
 */
export const listAnswer: AnswerType = {
  id: "list",
  schema,
  defaults: (): ListAnswer => ({ type: "list", items: [] }),
  isComplete: (answer) => acceptedItems(answer).length > 0,
  revealText: listReveal,
};

/**
 * The list with one answer changed, added (at `index` = its length) or — with `null` — removed.
 * Texts are cut to the longest answer; a list at its most takes no new answer.
 * @param answer - the answer being edited
 * @param index - the answer's place
 * @param text - its new text, or `null` to remove it
 */
export function setListItem(answer: ListAnswer, index: number, text: string | null): ListAnswer {
  const items = [...answer.items];
  if (text === null) {
    if (index < 0 || index >= items.length) return answer;
    items.splice(index, 1);
  } else if (index === items.length) {
    if (items.length >= LIST_ITEMS_MAX) return answer;
    items.push(cut(text, ANSWER_TEXT_MAX));
  } else if (index >= 0 && index < items.length) {
    items[index] = cut(text, ANSWER_TEXT_MAX);
  } else {
    return answer;
  }
  return { ...answer, items };
}

