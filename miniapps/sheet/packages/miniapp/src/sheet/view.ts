// Draws the answer sheet from its model: the running total, one card per round (name, question rows
// with right/wrong marks and points, bonus) and the two actions. Plain DOM; text goes in as text.
import { LIMITS, formatPoints, gameTotal, isBlankGame, roundCounts, roundPoints, type Mark, type Question, type Round } from "../core/game.ts";
import { h } from "../dom/h.ts";
import { icon } from "../dom/icons.ts";
import type { Sheet } from "./state.ts";

/** Writes points in the screen's language. */
export const points = (sheet: Sheet, value: number): string => formatPoints(value, sheet.lang);

/** Sets everything of a row that depends on its place in the round. */
export function labelRow(sheet: Sheet, row: HTMLElement, index: number): void {
  const n = index + 1;
  const set = (selector: string, name: string, value: string): void => { row.querySelector(selector)?.setAttribute(name, value); };
  const number = row.querySelector(".sheet-number");
  if (number) number.textContent = String(n);
  set(".sheet-answer", "aria-label", sheet.t("answerLabel", { n }));
  set(".sheet-marks", "aria-label", sheet.t("markGroup", { n }));
  set(".sheet-points", "aria-label", sheet.t("pointsLabel", { n }));
}

/** Shows a question's mark on its row. */
export function showMark(row: HTMLElement, mark: Mark): void {
  row.dataset["mark"] = mark;
  row.querySelector('[data-mark-button="right"]')?.setAttribute("aria-pressed", String(mark === "right"));
  row.querySelector('[data-mark-button="wrong"]')?.setAttribute("aria-pressed", String(mark === "wrong"));
}

function markButton(sheet: Sheet, mark: "right" | "wrong"): HTMLButtonElement {
  const button = h("button", { type: "button", class: `sheet-mark sheet-mark--${mark}`, "data-mark-button": mark, "aria-pressed": "false", "aria-label": sheet.t(mark), title: sheet.t(mark) });
  button.append(icon(mark === "right" ? "check" : "x"));
  return button;
}

/** Builds the row of one question. */
export function rowElement(sheet: Sheet, question: Question, index: number): HTMLLIElement {
  const answer = h("input", {
    class: "sheet-answer", type: "text", maxlength: String(LIMITS.answer), enterkeyhint: "next", autocomplete: "off",
    autocapitalize: "sentences", spellcheck: "false", placeholder: sheet.t("answerPlaceholder"),
  });
  answer.value = question.text;
  const worth = h("input", { class: "sheet-points", type: "text", inputmode: "decimal", autocomplete: "off", maxlength: "7", enterkeyhint: "done" });
  worth.value = points(sheet, question.points);
  const row = h("li", { class: "sheet-row" },
    h("span", { class: "sheet-number", "aria-hidden": "true" }),
    answer,
    h("div", { class: "sheet-marks", role: "group" }, markButton(sheet, "right"), markButton(sheet, "wrong")),
    worth);
  labelRow(sheet, row, index);
  showMark(row, question.mark);
  return row;
}

function roundElement(sheet: Sheet, round: Round, index: number): HTMLElement {
  const n = index + 1;
  const bodyId = `sheet-round-${String(n)}`;
  const toggle = h("button", { type: "button", class: "sheet-round-toggle", "data-round-toggle": "", "aria-controls": bodyId },
    h("span", { class: "sheet-round-titles" },
      h("span", { class: "sheet-round-title" }, h("span", {}, sheet.t("round", { n })), h("span", { class: "sheet-round-name", "data-round-name-text": "" })),
      h("span", { class: "sheet-round-meta", "data-round-meta": "" })),
    h("span", { class: "sheet-round-points", "data-round-points": "" }),
    h("span", { class: "sheet-round-chevron" }, icon("chevron")));

  const name = h("input", {
    class: "sheet-name", type: "text", maxlength: String(LIMITS.name), autocomplete: "off", autocapitalize: "sentences", enterkeyhint: "next",
    "data-round-name": "", "aria-label": sheet.t("roundNameLabel", { n }), placeholder: sheet.t("roundNamePlaceholder"),
  });
  name.value = round.name;

  const list = h("ol", { class: "sheet-questions", "data-questions": "" }, ...round.questions.map((question, at) => rowElement(sheet, question, at)));

  const bonusId = `sheet-bonus-${String(n)}`;
  const bonus = h("input", { class: "sheet-points sheet-bonus-input", id: bonusId, type: "text", inputmode: "text", autocomplete: "off", maxlength: "7", enterkeyhint: "done", "data-bonus": "", "aria-describedby": `${bonusId}-hint` });
  bonus.value = round.bonus === 0 ? "" : points(sheet, round.bonus);
  bonus.placeholder = "0";
  const remove = h("button", { type: "button", class: "sheet-link sheet-link--danger", "data-round-delete": "" }, icon("trash"), h("span", {}, sheet.t("deleteRound")));

  const body = h("div", { class: "sheet-round-body", id: bodyId },
    name,
    h("div", { class: "sheet-columns", "aria-hidden": "true" }, h("span", {}, sheet.t("pointsHead"))),
    list,
    h("div", { class: "sheet-bonus" },
      h("label", { for: bonusId, class: "sheet-bonus-label" }, sheet.t("bonus")),
      bonus,
      h("p", { class: "sheet-hint", id: `${bonusId}-hint` }, sheet.t("bonusHint"))),
    h("div", { class: "sheet-round-foot" }, remove));

  return h("section", { class: "sheet-round", "data-round": String(index) }, h("h2", { class: "sheet-round-head" }, toggle), body);
}

/** Updates every number and state that follows from the model, without touching the fields. */
export function refresh(sheet: Sheet): void {
  const { host, game, t } = sheet;
  const total = host.querySelector("[data-total]");
  if (total) total.textContent = points(sheet, gameTotal(game));
  host.querySelector("[data-total-box]")?.setAttribute("aria-label", t("totalLabel", { points: points(sheet, gameTotal(game)) }));
  const count = host.querySelector("[data-rounds-count]");
  if (count) count.textContent = t("rounds", { count: game.rounds.length });

  host.querySelectorAll<HTMLElement>("[data-round]").forEach((section, index) => {
    const round = game.rounds[index];
    if (round === undefined) return;
    const isOpen = sheet.open === index;
    section.toggleAttribute("data-open", isOpen);
    section.querySelector("[data-round-toggle]")?.setAttribute("aria-expanded", String(isOpen));
    const body = section.querySelector<HTMLElement>(".sheet-round-body");
    if (body) body.hidden = !isOpen;
    const nameText = section.querySelector("[data-round-name-text]");
    if (nameText) nameText.textContent = round.name === "" ? "" : ` · ${round.name}`;
    const { right, judged } = roundCounts(round);
    const meta = section.querySelector("[data-round-meta]");
    if (meta) meta.textContent = judged === 0 ? "" : t("roundRight", { right, judged });
    const value = points(sheet, roundPoints(round));
    const badge = section.querySelector("[data-round-points]");
    if (badge) {
      badge.textContent = value;
      badge.setAttribute("aria-label", t("roundPointsLabel", { points: value }));
    }
    const remove = section.querySelector<HTMLElement>("[data-round-delete]");
    if (remove) remove.hidden = game.rounds.length < 2;
  });

  const clear = host.querySelector<HTMLElement>("[data-clear]");
  if (clear) clear.hidden = isBlankGame(game);
}

/** Draws the whole sheet from the model (start, new round, delete, clear, undo, language). */
export function render(sheet: Sheet): void {
  const { t } = sheet;
  const add = h("button", { type: "button", class: "button button--primary button--large", "data-new-round": "" }, icon("plus"), h("span", {}, t("newRound")));
  const clear = h("button", { type: "button", class: "sheet-link sheet-link--danger", "data-clear": "" }, t("clearGame"));
  sheet.host.replaceChildren(h("div", { class: "sheet-screen", "data-sheet": "" },
    h("div", { class: "sheet-total", "data-total-box": "", role: "group" },
      h("span", { class: "sheet-total-label" }, t("total")),
      h("output", { class: "sheet-total-value", "data-total": "" }),
      h("span", { class: "sheet-total-rounds", "data-rounds-count": "" })),
    h("div", { class: "sheet-rounds", "data-rounds": "" }, ...sheet.game.rounds.map((round, index) => roundElement(sheet, round, index))),
    h("div", { class: "sheet-actions" }, add, clear)));
  refresh(sheet);
}
