// Draws the answer sheet from its model as one app screen: one top bar with the round tabs
// (1, 2, 3 … +) and the running total, and the open round filling the rest — its name and result,
// what a right answer gives, the answer lines (they scroll inside the card), "+" for another line,
// bonus points, "Delete round". Plain DOM; text goes in as text.
import { LIMITS, formatPoints, gameTotal, isBlankGame, roundCounts, roundPoints, shownPoints, type Mark, type Question, type Round } from "../core/game.ts";
import { h } from "../dom/h.ts";
import { icon } from "../dom/icons.ts";
import type { Sheet } from "./state.ts";

/** Writes points in the screen's language. */
export const points = (sheet: Sheet, value: number): string => formatPoints(value, sheet.lang);

/** The round on screen. */
export function currentRound(sheet: Sheet): Round | undefined {
  return sheet.game.rounds[sheet.open];
}

/** Sets everything of a row that depends on its place in the round. */
export function labelRow(sheet: Sheet, row: HTMLElement, index: number): void {
  const n = index + 1;
  const set = (selector: string, name: string, value: string): void => { row.querySelector(selector)?.setAttribute(name, value); };
  const number = row.querySelector(".sheet-number");
  if (number) number.textContent = String(n);
  set(".sheet-answer", "aria-label", sheet.t("answerLabel", { n }));
  set(".sheet-marks", "aria-label", sheet.t("markGroup", { n }));
  set(".sheet-points", "aria-label", sheet.t("pointsLabel", { n }));
  set(".sheet-remove", "aria-label", sheet.t("removeLine", { n }));
}

/** Shows a question's mark on its row. */
export function showMark(row: HTMLElement, mark: Mark): void {
  row.dataset["mark"] = mark;
  row.querySelector('[data-mark-button="right"]')?.setAttribute("aria-pressed", String(mark === "right"));
  row.querySelector('[data-mark-button="wrong"]')?.setAttribute("aria-pressed", String(mark === "wrong"));
}

/**
 * Shows what a line brings at its end: 0 when it is wrong, else what a right answer gives there.
 * A field being typed in is left alone.
 */
export function showWorth(sheet: Sheet, row: HTMLElement, round: Round, question: Question): void {
  const field = row.querySelector<HTMLInputElement>(".sheet-points");
  if (field === null) return;
  row.toggleAttribute("data-own-points", question.points !== null && question.mark !== "wrong");
  if (field !== document.activeElement) field.value = points(sheet, shownPoints(round, question));
}

function markButton(sheet: Sheet, mark: "right" | "wrong"): HTMLButtonElement {
  const button = h("button", { type: "button", class: `sheet-mark sheet-mark--${mark}`, "data-mark-button": mark, "aria-pressed": "false", "aria-label": sheet.t(mark), title: sheet.t(mark) });
  button.append(icon(mark === "right" ? "check" : "x"));
  return button;
}

/** The red "remove this line" button; shown only while "Remove answers" is on (sheet.css). */
function removeButton(): HTMLButtonElement {
  const button = h("button", { type: "button", class: "sheet-remove", "data-remove-line": "" });
  button.append(icon("minus"));
  return button;
}

/** Builds the row of one question. */
export function rowElement(sheet: Sheet, round: Round, question: Question, index: number): HTMLLIElement {
  const answer = h("input", {
    class: "sheet-answer", type: "text", maxlength: String(LIMITS.answer), enterkeyhint: "next", autocomplete: "off",
    autocapitalize: "sentences", spellcheck: "false", placeholder: sheet.t("answerPlaceholder"),
  });
  answer.value = question.text;
  const worth = h("input", { class: "sheet-points", type: "text", inputmode: "decimal", autocomplete: "off", maxlength: "7", enterkeyhint: "done", "data-worth": "" });
  const row = h("li", { class: "sheet-row" },
    h("span", { class: "sheet-number", "aria-hidden": "true" }),
    answer,
    h("div", { class: "sheet-marks", role: "group" }, markButton(sheet, "right"), markButton(sheet, "wrong")),
    worth,
    removeButton());
  labelRow(sheet, row, index);
  showMark(row, question.mark);
  showWorth(sheet, row, round, question);
  return row;
}

/** One tab per round (its number and its points); they scroll sideways between two arrows when they do not fit. */
function tabs(sheet: Sheet): HTMLElement {
  const { t } = sheet;
  const strip = h("nav", { class: "sheet-tabs", "aria-label": t("roundsNav"), "data-tabs": "" });
  sheet.game.rounds.forEach((_round, index) => {
    // Read out as "Round 2 6 points"; sighted people see "2" over "6".
    strip.append(h("button", { type: "button", class: "sheet-tab", "data-tab": String(index) },
      h("span", { class: "sheet-tab-number" }, h("span", { class: "visually-hidden" }, `${t("tabRound")} `), String(index + 1)),
      h("span", { class: "sheet-tab-points" }, h("span", { "data-tab-points": "" }), h("span", { class: "visually-hidden" }, ` ${t("tabPoints")}`))));
  });
  // Pointer shortcuts only: every tab is reachable with Tab and by swiping, so the arrows stay out of the tab order.
  const arrow = (direction: "prev" | "next"): HTMLButtonElement => {
    const label = t(direction === "prev" ? "tabsPrev" : "tabsNext");
    const button = h("button", { type: "button", class: `sheet-tabs-arrow sheet-tabs-arrow--${direction}`, "data-tabs-arrow": direction, tabindex: "-1", "aria-label": label, title: label, hidden: "" });
    button.append(icon(direction === "prev" ? "left" : "right"));
    return button;
  };
  return h("div", { class: "sheet-tabs-box" }, arrow("prev"), strip, arrow("next"));
}

/** Shows an arrow on each side where more tabs are hidden; none when all of them fit. */
export function showTabArrows(sheet: Sheet): void {
  const strip = sheet.host.querySelector<HTMLElement>("[data-tabs]");
  if (strip === null) return;
  const hiddenBefore = strip.scrollLeft > 1;
  const hiddenAfter = strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1;
  sheet.host.querySelector<HTMLElement>('[data-tabs-arrow="prev"]')?.toggleAttribute("hidden", !hiddenBefore);
  sheet.host.querySelector<HTMLElement>('[data-tabs-arrow="next"]')?.toggleAttribute("hidden", !hiddenAfter);
}

/** The open round: head, what a right answer gives, the lines, "+", bonus, delete. */
function roundPanel(sheet: Sheet, round: Round, index: number): HTMLElement {
  const { t } = sheet;
  const n = index + 1;
  const name = h("input", {
    class: "sheet-name", type: "text", maxlength: String(LIMITS.name), autocomplete: "off", autocapitalize: "sentences", enterkeyhint: "done",
    "data-round-name": "", "aria-label": t("roundNameLabel", { n }), placeholder: t("roundNamePlaceholder"),
  });
  name.value = round.name;

  const each = h("input", { class: "sheet-points", id: "sheet-each", type: "text", inputmode: "decimal", autocomplete: "off", maxlength: "7", enterkeyhint: "done", "data-round-worth": "" });
  each.value = points(sheet, round.points);

  const bonus = h("input", { class: "sheet-points", id: "sheet-bonus", type: "text", inputmode: "text", autocomplete: "off", maxlength: "7", enterkeyhint: "done", "data-bonus": "", "aria-describedby": "sheet-bonus-hint", placeholder: "0" });
  bonus.value = round.bonus === 0 ? "" : points(sheet, round.bonus);

  const add = h("button", { type: "button", class: "sheet-add", "data-add-line": "" }, icon("plus"), h("span", {}, t("addLine")));
  // iOS list editing: one switch turns every line's marks into a red remove button, "Done" turns it back.
  const editing = h("button", { type: "button", class: "sheet-edit", "data-remove-toggle": "", "aria-pressed": "false" });
  const remove = h("button", { type: "button", class: "sheet-link sheet-link--danger", "data-round-delete": "" }, icon("trash"), h("span", {}, t("deleteRound")));

  return h("section", { class: "sheet-round", "data-round": String(index), "aria-labelledby": "sheet-round-title" },
    h("div", { class: "sheet-round-head" },
      h("h2", { class: "sheet-round-title", id: "sheet-round-title" }, t("round", { n })),
      name,
      h("span", { class: "sheet-round-points", "data-round-points": "" })),
    h("div", { class: "sheet-each" },
      h("span", { class: "sheet-each-meta", "data-round-meta": "" }),
      h("label", { for: "sheet-each", class: "sheet-each-label" }, t("eachRight")),
      each),
    h("div", { class: "sheet-scroll", "data-scroll": "" },
      h("ol", { class: "sheet-questions", "data-questions": "" }, ...round.questions.map((question, at) => rowElement(sheet, round, question, at))),
      h("div", { class: "sheet-line-actions" }, add, editing),
      h("div", { class: "sheet-bonus" },
        h("label", { for: "sheet-bonus", class: "sheet-bonus-label" }, t("bonus")),
        bonus,
        h("p", { class: "sheet-hint", id: "sheet-bonus-hint" }, t("bonusHint"))),
      h("div", { class: "sheet-round-foot" }, remove)));
}

/** Updates every number and state that follows from the model, without touching the fields. */
export function refresh(sheet: Sheet): void {
  const { host, game, t } = sheet;
  const all = points(sheet, gameTotal(game));
  const total = host.querySelector("[data-total]");
  if (total) total.textContent = all;
  host.querySelector("[data-total-box]")?.setAttribute("aria-label", t("totalLabel", { points: all }));

  host.querySelectorAll<HTMLElement>("[data-tab]").forEach((tab, index) => {
    const round = game.rounds[index];
    if (round === undefined) return;
    const value = points(sheet, roundPoints(round));
    const isOpen = index === sheet.open;
    if (isOpen) tab.setAttribute("aria-current", "true");
    else tab.removeAttribute("aria-current");
    const badge = tab.querySelector("[data-tab-points]");
    if (badge) badge.textContent = value;
  });

  const round = currentRound(sheet);
  if (round === undefined) return;
  const badge = host.querySelector("[data-round-points]");
  if (badge) {
    const value = points(sheet, roundPoints(round));
    badge.textContent = value;
    badge.setAttribute("aria-label", t("roundPointsLabel", { points: value }));
  }
  const { right, judged } = roundCounts(round);
  const meta = host.querySelector("[data-round-meta]");
  if (meta) meta.textContent = judged === 0 ? t("answers") : t("roundRight", { right, judged });
  const add = host.querySelector<HTMLButtonElement>("[data-add-line]");
  if (add) add.hidden = round.questions.length >= LIMITS.questions || sheet.isRemoving;
  // "Remove answers" ↔ "Done": the same switch, named after what the next tap does.
  host.querySelector("[data-questions]")?.toggleAttribute("data-removing", sheet.isRemoving);
  const editing = host.querySelector<HTMLButtonElement>("[data-remove-toggle]");
  if (editing) {
    editing.setAttribute("aria-pressed", String(sheet.isRemoving));
    editing.replaceChildren(...(sheet.isRemoving ? [t("removeDone")] : [icon("trash"), h("span", { class: "visually-hidden" }, t("removeLines"))]));
    editing.title = sheet.isRemoving ? t("removeDone") : t("removeLines");
  }
  if (sheet.clearButton) sheet.clearButton.hidden = isBlankGame(game);
}

/** Draws the whole screen from the model (start, another round, delete, clear, undo, language). */
export function render(sheet: Sheet): void {
  const { t } = sheet;
  const round = currentRound(sheet);
  // "+" stays beside the strip, never inside it: it is always on screen, however many rounds there are.
  const add = h("button", { type: "button", class: "sheet-tab sheet-tab--add", "data-new-round": "", "aria-label": t("newRound"), title: t("newRound") });
  add.append(icon("plus"));
  sheet.host.replaceChildren(h("div", { class: "sheet-screen", "data-sheet": "" },
    h("div", { class: "sheet-top" },
      tabs(sheet),
      add,
      h("div", { class: "sheet-total", "data-total-box": "", role: "group" },
        h("span", { class: "sheet-total-label" }, t("total")),
        h("output", { class: "sheet-total-value", "data-total": "" }))),
    ...(round === undefined ? [] : [roundPanel(sheet, round, sheet.open)])));
  if (sheet.clearButton) {
    sheet.clearButton.setAttribute("aria-label", t("clearGame"));
    sheet.clearButton.title = t("clearGame");
  }
  refresh(sheet);
  sheet.host.querySelector('[data-tab][aria-current="true"]')?.scrollIntoView({ block: "nearest", inline: "center" });
  showTabArrows(sheet);
}
