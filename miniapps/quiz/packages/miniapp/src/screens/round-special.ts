// What a special round (SPEC §10) shows in its settings instead of the points fields: its rule in a
// line, and — for a Safe — the bonus for the whole code, a stepper 0–20 with what it adds up to.
import { ROUND_VALUE_MAX, ROUND_VALUE_MIN, type Round, SAFE_BONUS_MAX, SAFE_BONUS_MIN, roundMaxPoints, safeBonus, setRoundBonus, setRoundValue, shapeOf } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { iconButton } from "../dom/controls.ts";
import { h } from "../dom/h.ts";
import type { TextKey } from "../i18n/translate.ts";
import { roundKindUis } from "../round-kinds-ui.ts";

/** The Safe's bonus: − [n] +, and "5 + 3 = 8 points" under it. */
function bonusField(app: App, round: Round, onChange: () => void): HTMLElement {
  const { t } = app;
  let current = safeBonus(round);
  const field = h("input", { type: "text", inputmode: "numeric", class: "quiz-input quiz-number", maxlength: "2", autocomplete: "off", enterkeyhint: "done", "aria-label": t("roundKind.bonus"), "data-bonus": "" });
  const hint = h("p", { class: "quiz-hint", "data-bonus-hint": "" });
  const less = iconButton("minus", `${t("roundKind.bonus")} −1`, { class: "quiz-step", "data-bonus-less": "" });
  const more = iconButton("plus", `${t("roundKind.bonus")} +1`, { class: "quiz-step", "data-bonus-more": "" });
  const show = (): void => {
    field.value = String(current);
    hint.textContent = t("roundKind.bonusHint", { bonus: current, total: round.questions.length + current });
    less.disabled = current <= SAFE_BONUS_MIN;
    more.disabled = current >= SAFE_BONUS_MAX;
  };
  const commit = (value: number): void => {
    const quiz = app.current?.quiz;
    if (!quiz) return;
    const next = setRoundBonus(quiz, round.id, value);
    const now = next.rounds.find((candidate) => candidate.id === round.id);
    if (now) current = safeBonus(now);
    if (app.change(next)) onChange();
    show();
  };
  field.addEventListener("change", () => { commit(Number(field.value.trim()) || 0); });
  less.addEventListener("click", () => { commit(current - 1); });
  more.addEventListener("click", () => { commit(current + 1); });
  show();
  return h("div", { class: "quiz-group" }, h("span", { class: "quiz-label" }, t("roundKind.bonus")), h("div", { class: "quiz-stepper", role: "group", "aria-label": t("roundKind.bonus") }, less, field, more), hint);
}

/** One of a round kind's own whole numbers (a prize, the most points): − [n] +, 0–20. */
function valueField(app: App, round: Round, value: { readonly key: string; readonly label: TextKey }, onChange: () => void): HTMLElement {
  const { t } = app;
  const label = t(value.label);
  // A round whose data lacks the value plays with the kind's own default (core): the field shows that, not 0.
  const fallback = shapeOf(round, app.env.registries)?.defaultData?.()[value.key];
  const read = (from: Round): number => {
    const kept = from.data?.[value.key];
    if (typeof kept === "number") return kept;
    return typeof fallback === "number" ? fallback : 0;
  };
  let current = read(round);
  const field = h("input", { type: "text", inputmode: "numeric", class: "quiz-input quiz-number", maxlength: "2", autocomplete: "off", enterkeyhint: "done", "aria-label": label, "data-round-value": value.key });
  const less = iconButton("minus", `${label} −1`, { class: "quiz-step", "data-round-value-less": value.key });
  const more = iconButton("plus", `${label} +1`, { class: "quiz-step", "data-round-value-more": value.key });
  const show = (): void => {
    field.value = String(current);
    less.disabled = current <= ROUND_VALUE_MIN;
    more.disabled = current >= ROUND_VALUE_MAX;
  };
  const commit = (typed: number): void => {
    const quiz = app.current?.quiz;
    if (!quiz) return;
    const next = setRoundValue(quiz, round.id, value.key, typed, app.env);
    const now = next.rounds.find((candidate) => candidate.id === round.id);
    if (now) current = read(now);
    if (app.change(next)) onChange();
    show();
  };
  field.addEventListener("change", () => { commit(Number(field.value.trim()) || 0); });
  less.addEventListener("click", () => { commit(current - 1); });
  more.addEventListener("click", () => { commit(current + 1); });
  show();
  return h("div", { class: "quiz-group" }, h("span", { class: "quiz-label" }, label), h("div", { class: "quiz-stepper", role: "group", "aria-label": label }, less, field, more));
}

/**
 * The parts of a special round's settings that take the points fields' place; `null` for a free round.
 * @param app - the mounted creator
 * @param round - the round as it is now
 * @param onChange - called after the bonus changed
 */
export function specialPoints(app: App, round: Round, onChange: () => void): HTMLElement[] | null {
  const shape = shapeOf(round, app.env.registries);
  const rule = shape ? roundKindUis.get(round.kind)?.points : undefined;
  if (rule === undefined) return null;
  const { t } = app;
  const most = app.t("unit.points", { count: roundMaxPoints(round), n: String(roundMaxPoints(round)) });
  // A kind that keeps a bonus in its own data (the Safe) offers it here; its line under the bonus says the whole.
  const hasBonus = shape?.defaultData?.()["bonus"] !== undefined;
  const points = h("div", { class: "quiz-group", "data-points-fixed": "" }, h("span", { class: "quiz-label" }, t("roundKind.pointsLabel")), h("p", { class: "quiz-fixed-value" }, t(rule)), ...(hasBonus ? [] : [h("p", { class: "quiz-hint" }, most)]));
  const values = (roundKindUis.get(round.kind)?.values ?? []).map((value) => valueField(app, round, value, onChange));
  return hasBonus ? [points, bonusField(app, round, onChange)] : [points, ...values];
}
