// Answer type `list` in the editor (SPEC §10, the Golden pyramid): the accepted answers, one field each,
// with a counter that says how many the question asks for and how many count — "asks for 3 · 7
// accepted". Enter adds the next answer; a list pasted with one answer per line is split. The slide
// part is the player's.
import { LIST_ITEMS_MAX, type ListAnswer, acceptedItems, isListAnswer, pyramidAsks, setListItem } from "@simeonts/quizzard-quiz-core";
import { listAnswerSlide } from "@simeonts/quizzard-quiz-player/render";
import { iconButton, labelButton } from "../dom/controls.ts";
import { h } from "../dom/h.ts";
import { type AnswerEditorContext, type AnswerUi, answerUi } from "../ui-registry.ts";

/** What the counter says: how many the question asks for and how many answers count now. */
function counterText({ t }: AnswerEditorContext, answer: ListAnswer, asks: number): { text: string; short: string } {
  const count = acceptedItems(answer).length;
  const missing = Math.max(0, asks - count);
  return { text: t("accepted.counter", { asks, count }), short: missing > 0 ? t("accepted.short", { count: missing, asks }) : "" };
}

/** One accepted answer: its field and its remove button. */
function itemRow(context: AnswerEditorContext, index: number, value: string, actions: { readonly set: (index: number, text: string | null) => void; readonly add: (text: string) => void; readonly next: (index: number) => void }): HTMLLIElement {
  const field = h("input", { type: "text", class: "quiz-input", value, maxlength: "300", autocomplete: "off", "aria-label": context.t("accepted.item", { n: index + 1 }), "data-accepted-item": String(index) });
  field.value = value;
  field.addEventListener("input", () => { actions.set(index, field.value); });
  field.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      actions.next(index);
    }
  });
  field.addEventListener("paste", (event) => {
    const text = event.clipboardData?.getData("text") ?? "";
    if (!text.includes("\n")) return;
    event.preventDefault();
    const [first = "", ...rest] = text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line !== "");
    actions.set(index, first);
    for (const line of rest) actions.add(line);
  });
  const remove = iconButton("x", context.t("accepted.remove", { n: index + 1 }), { "data-accepted-remove": String(index) });
  remove.addEventListener("click", () => { actions.set(index, null); });
  return h("li", { class: "quiz-accepted-row" }, h("span", { class: "quiz-accepted-n", "aria-hidden": "true" }, String(index + 1)), field, remove);
}

/** The editor: the counter, the hint, the list and "Add an answer". */
function listEditor(context: AnswerEditorContext): HTMLElement {
  const { t } = context;
  let answer: ListAnswer = isListAnswer(context.answer) ? context.answer : { type: "list", items: [] };
  const index = context.place?.index ?? 0;
  const asks = pyramidAsks(index);
  const counter = h("span", { class: "quiz-accepted-counter", "data-accepted-counter": "" });
  const short = h("p", { class: "quiz-hint quiz-accepted-short", "data-accepted-short": "" });
  const list = h("ol", { class: "quiz-accepted-list" });
  const add = labelButton("plus", t("accepted.add"), { class: "button", "data-accepted-add": "" });
  const full = h("p", { class: "quiz-hint quiz-limit" }, t("accepted.full", { max: LIST_ITEMS_MAX }));
  const sync = (): void => {
    const words = counterText(context, answer, asks);
    counter.textContent = words.text;
    counter.toggleAttribute("data-short", words.short !== "");
    short.textContent = words.short;
    short.hidden = words.short === "";
    add.hidden = answer.items.length >= LIST_ITEMS_MAX;
    full.hidden = !add.hidden;
  };
  const draw = (focus?: number): void => {
    list.replaceChildren(...answer.items.map((item, at) => itemRow(context, at, item, { set, add: (text) => { set(answer.items.length, text); }, next })));
    sync();
    if (focus !== undefined) list.querySelector<HTMLInputElement>(`[data-accepted-item="${String(focus)}"]`)?.focus();
  };
  function set(at: number, text: string | null): void {
    const before = answer.items.length;
    answer = setListItem(answer, at, text);
    context.change(answer);
    if (answer.items.length === before) sync();
    else draw(text === null ? Math.min(at, answer.items.length - 1) : at);
  }
  function next(at: number): void {
    if (at + 1 < answer.items.length) list.querySelector<HTMLInputElement>(`[data-accepted-item="${String(at + 1)}"]`)?.focus();
    else set(answer.items.length, "");
  }
  add.addEventListener("click", () => { set(answer.items.length, ""); });
  draw();
  return h("div", { class: "quiz-group quiz-accepted", "data-accepted": "" },
    h("div", { class: "quiz-accepted-head" }, h("span", { class: "quiz-label" }, t("answer.list")), counter),
    h("p", { class: "quiz-hint" }, t("accepted.hint", { n: asks })),
    list, short, add, full);
}

/** Answer type `list`: the accepted answers of a Golden pyramid question. */
export const listAnswerUi: AnswerUi = answerUi(listAnswerSlide, { label: "answer.list", icon: "list" }, listEditor);
