// Small builders the views share: the view's root, headings, chips, the number stepper and the
// text that says what a view's structure hangs on.
import type { Round } from "@simeonts/quizzard-quiz-core/play";
import type { GameState } from "../game/state.ts";
import { countMark } from "../render/count.ts";
import { h, releaseAfterPointer } from "../render/h.ts";
import { icon, type StageIcon } from "../render/icons.ts";
import type { PlayEnv } from "./context.ts";

/**
 * The root element of a view.
 * @param name - the view's own class part: `qp-<name>`
 * @param children - its content
 */
export function viewRoot(name: string, ...children: (Node | string)[]): HTMLElement {
  return h("div", { class: `qp-view qp-${name}`, "data-view": name }, ...children);
}

/**
 * The small line above a heading.
 * @param parts - its words, and counters among them
 */
export function kicker(...parts: (Node | string)[]): HTMLElement {
  return h("p", { class: "qp-kicker" }, ...parts);
}

/**
 * A counter in the game's language: "3/10", read out as "3 of 10".
 * @param env - gives the words
 * @param now - where it is, from 1
 * @param total - out of how many
 */
export function count(env: PlayEnv, now: number, total: number): HTMLElement {
  return countMark(now, total, env.labels.of(now, total));
}

/**
 * "Round 2/5": a round's place among the rounds that are played (those with questions).
 * @param env - the quiz and the words
 * @param round - the round
 */
export function roundCount(env: PlayEnv, round: Round): (Node | string)[] {
  const played = env.file.quiz.rounds.filter((candidate) => candidate.questions.length > 0);
  return [`${env.labels.round} `, count(env, played.indexOf(round) + 1, played.length)];
}

/**
 * "Round 2/5 · History": a round by its place and its name, for the line above a heading.
 * @param env - the quiz and the words
 * @param round - the round; `undefined` gives nothing
 */
export function roundLine(env: PlayEnv, round: Round | undefined): (Node | string)[] {
  return round ? [...roundCount(env, round), " · ", round.name] : [];
}

/** Text lengths at which a big heading steps down a size. */
const HEADING_STEPS: readonly (readonly [number, string])[] = [[14, "xl"], [28, "l"], [48, "m"]];

/**
 * A view's big heading; long text steps down in size so it still fits.
 * @param text - its words
 * @param extra - more classes
 */
export function heading(text: string, extra = ""): HTMLElement {
  const size = HEADING_STEPS.find(([max]) => text.length <= max)?.[1] ?? "s";
  return h("h1", { class: `qp-heading ${extra}`.trim(), "data-size": size }, text);
}

/**
 * A pill with a mark and words.
 * @param name - the mark
 * @param text - the words
 * @param tone - `"gold"` for points
 */
export function chip(name: StageIcon, text: string, tone = ""): HTMLElement {
  return h("span", { class: "qp-chip", ...(tone === "" ? {} : { "data-tone": tone }) }, icon(name, 22), h("span", {}, text));
}

/**
 * A round button with a mark and an accessible name.
 * @param name - the mark
 * @param label - what it does, in words
 * @param props - more attributes; `class` adds to `qp-round-button`
 */
export function roundButton(name: StageIcon, label: string, props: Readonly<Record<string, string>> = {}): HTMLButtonElement {
  const { class: extra = "", ...rest } = props;
  const button = h("button", { type: "button", class: `qp-round-button ${extra}`.trim(), "aria-label": label, title: label, ...rest });
  button.append(icon(name, 24));
  releaseAfterPointer(button);
  return button;
}

/** Inputs of {@link stepper}. */
export interface StepperOptions {
  /** The field's accessible name. */
  readonly label: string;
  readonly less: string;
  readonly more: string;
  readonly value: number;
  readonly max: number;
  /** Marks the field so focus returns to it after a redraw. */
  readonly focusKey: string;
  onChange(value: number): void;
}

/** A stepper and how to show another value in it. */
export interface Stepper {
  readonly element: HTMLElement;
  /** Shows a value; a field being typed in is left alone. */
  set(value: number): void;
}

/**
 * A number field with − and + (score entry). Typing accepts a dot or a comma.
 * @param options - names, the value and the listener
 */
export function stepper(options: StepperOptions): Stepper {
  const field = h("input", { type: "text", inputmode: "decimal", class: "qp-stepper-field", "aria-label": options.label, autocomplete: "off", "data-focus": options.focusKey });
  let value = options.value;
  field.value = String(value);
  const change = (next: number): void => {
    value = Math.min(options.max, Math.max(0, next));
    options.onChange(value);
  };
  field.addEventListener("input", () => {
    const typed = Number(field.value.trim().replace(",", "."));
    if (field.value.trim() !== "" && Number.isFinite(typed)) change(typed);
  });
  field.addEventListener("focus", () => { field.select(); });
  field.addEventListener("blur", () => { field.value = String(value); });
  const less = roundButton("minus", options.less, { "data-focus": `${options.focusKey}:less` });
  const more = roundButton("plus", options.more, { "data-focus": `${options.focusKey}:more` });
  const by = (amount: number): void => {
    change(value + amount);
    field.value = String(value);
  };
  less.addEventListener("click", () => { by(-1); });
  more.addEventListener("click", () => { by(1); });
  return {
    element: h("span", { class: "qp-stepper" }, less, field, more),
    set(next) {
      value = next;
      if (document.activeElement !== field) field.value = String(next);
    },
  };
}

/**
 * A text of everything the standings show: views that only display them are drawn again when it changes.
 * @param state - the game
 */
export function scoreDigest(state: GameState): string {
  return JSON.stringify([state.teams, state.scores, state.bonus, state.winner]);
}

/**
 * The ids of the teams: views with name fields or steppers are drawn again only when a team comes or goes.
 * @param state - the game
 */
export function teamDigest(state: GameState): string {
  return state.teams.map((team) => team.id).join(",");
}

/**
 * Tells a list of rows how many it has, so the stylesheet can share the stage's height between them
 * (`--qp-rows`); a long list is split into two columns on a wide stage (`data-split`).
 * @param list - the list element
 * @param count - its rows
 * @param splitAbove - from more rows than this the list has two columns
 */
export function shareRows(list: HTMLElement, count: number, splitAbove: number): void {
  const isSplit = count > splitAbove;
  list.style.setProperty("--qp-rows-all", String(Math.max(1, count)));
  list.style.setProperty("--qp-rows", String(Math.max(1, isSplit ? Math.ceil(count / 2) : count)));
  list.toggleAttribute("data-split", isSplit);
}

/**
 * A pill button with a mark and words, for the stage and the host panel.
 * @param name - the mark
 * @param label - the words
 * @param props - more attributes
 */
export function pillButton(name: StageIcon, label: string, props: Readonly<Record<string, string>> = {}): HTMLButtonElement {
  const button = h("button", { type: "button", class: "qp-button", ...props }, icon(name, 22), h("span", {}, label));
  releaseAfterPointer(button);
  return button;
}
