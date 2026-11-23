// The two values a round gives its questions and a question may change for itself (SPEC F5, F6):
// time as a stepper, points as a number and a free note. Used by the round's settings and by the
// question editor. A field keeps what is typed while it is typed and shows the kept value on leaving.
import { MAX_POINTS, MAX_SECONDS, MIN_SECONDS, POINTS_NOTE_MAX, type Points, clamp, makePoints } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { iconButton } from "../dom/controls.ts";
import { h } from "../dom/h.ts";
import { numberText, parseNumber } from "../format.ts";

/** One tap on − or + changes the time by this many seconds. */
const SECONDS_STEP = 5;

/** A time field and the way to set it from outside (back to the round's value). */
export interface SecondsField {
  readonly element: HTMLElement;
  set(seconds: number): void;
}

/**
 * The time stepper: − [seconds] +, 5–600.
 * @param app - gives the translator
 * @param label - what the time is of, e.g. "Time per question"
 * @param value - the seconds shown first
 * @param onChange - called with every valid value
 */
export function secondsField(app: App, label: string, value: number, onChange: (seconds: number) => void): SecondsField {
  const { t } = app;
  let current = value;
  const field = h("input", { type: "text", inputmode: "numeric", class: "quiz-input quiz-number", maxlength: "3", autocomplete: "off", enterkeyhint: "done", "aria-label": t("time.seconds"), "data-seconds": "" });
  const show = (): void => { field.value = String(current); };
  const commit = (seconds: number): void => {
    current = clamp(Math.round(seconds), MIN_SECONDS, MAX_SECONDS);
    onChange(current);
  };
  field.addEventListener("input", () => {
    const typed = parseNumber(field.value);
    if (typed !== null && typed >= MIN_SECONDS && typed <= MAX_SECONDS) commit(typed); // "1" on the way to "120" is not kept
  });
  field.addEventListener("change", () => {
    // Leaving the field with nothing new must change nothing: a redraw here would take away the
    // card the person is just tapping.
    const typed = clamp(Math.round(parseNumber(field.value) ?? current), MIN_SECONDS, MAX_SECONDS);
    if (typed !== current) commit(typed);
    show();
  });
  const step = (by: number): void => {
    commit(current + by);
    show();
  };
  const less = iconButton("minus", t("time.less", { n: SECONDS_STEP }), { class: "quiz-step" });
  const more = iconButton("plus", t("time.more", { n: SECONDS_STEP }), { class: "quiz-step" });
  less.addEventListener("click", () => { step(-SECONDS_STEP); });
  more.addEventListener("click", () => { step(SECONDS_STEP); });
  show();
  const element = h("div", { class: "quiz-stepper", role: "group", "aria-label": label }, less, field, h("span", { class: "quiz-unit", "aria-hidden": "true" }, t("unit.secondsShort")), more);
  return { element, set: (seconds) => { current = seconds; show(); } };
}

/** The points fields and the way to set them from outside. */
export interface PointsFields {
  readonly element: HTMLElement;
  set(points: Points): void;
}

/**
 * Points as a number and a free note — either or both (AC3).
 * @param app - gives the translator and the language of the number
 * @param label - what the points are of, e.g. "Points per question"
 * @param value - the points shown first
 * @param onChange - called with every change
 */
export function pointsFields(app: App, label: string, value: Points, onChange: (points: Points) => void): PointsFields {
  const { t, lang } = app;
  const number = h("input", { type: "text", inputmode: "decimal", class: "quiz-input quiz-number", maxlength: "5", autocomplete: "off", enterkeyhint: "done", "aria-label": t("points.number"), "data-points": "" });
  const note = h("input", { type: "text", class: "quiz-input", maxlength: String(POINTS_NOTE_MAX), autocomplete: "off", enterkeyhint: "done", "aria-label": t("points.note"), placeholder: t("points.notePlaceholder"), "data-points-note": "" });
  let current = value.value;
  const show = (points: Points): void => {
    current = points.value;
    number.value = points.value === 0 && (points.note ?? "") !== "" ? "" : numberText(points.value, lang);
    note.value = points.note ?? "";
  };
  const report = (): void => { onChange(makePoints(current, note.value)); };
  number.addEventListener("input", () => {
    const typed = number.value.trim() === "" ? 0 : parseNumber(number.value);
    if (typed === null) return; // a half-typed "1," keeps the last good value
    current = clamp(typed, 0, MAX_POINTS);
    report();
  });
  number.addEventListener("change", () => { show(makePoints(current, note.value)); });
  note.addEventListener("input", report);
  show(value);
  const element = h("div", { class: "quiz-points", role: "group", "aria-label": label }, number, h("span", { class: "quiz-unit", "aria-hidden": "true" }, t("unit.pointsShort")), note);
  return { element, set: show };
}
