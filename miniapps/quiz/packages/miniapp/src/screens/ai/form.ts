// The form of an AI window (screens/ai/window.ts): what the person wants, chosen with lists and ticks
// instead of typed to the assistant — so the assistant writes at once and asks nothing. A special round
// and the pictures each have an ⓘ that says what they are. The choices are kept for the next time.
import type { AnswerChoice, AudienceChoice, DifficultyChoice, QuizWishes, SpecialChoice } from "@simeonts/quizzard-quiz-core/draft";
import type { App } from "../../app/state.ts";
import { h } from "../../dom/h.ts";
import { icon } from "../../dom/icons.ts";

/** Which parts the form has: a new quiz, rounds for a quiz, questions for a round. */
export type FormTarget = "quiz" | "rounds" | "questions";

/** The form on screen, and the wishes it holds now. */
export interface WishForm {
  readonly element: HTMLElement;
  wishes(): QuizWishes;
}

/** Where the last choices are kept (the mini-app's own preferences). */
const PREF = "ai.wishes";

const AUDIENCES: readonly AudienceChoice[] = ["friends", "colleagues", "family", "children", "teens", "experts"];
const DIFFICULTIES: readonly DifficultyChoice[] = ["easy", "medium", "hard", "mixed"];
const ANSWERS: readonly AnswerChoice[] = ["open", "choice", "trueFalse"];
const SPECIALS: readonly SpecialChoice[] = ["pyramid", "safe", "laugh", "task"];
const PER_ROUND = [3, 4, 5, 6, 7, 8, 10, 12, 15, 20];
const SECONDS = [10, 15, 20, 30, 45, 60, 90, 120];
const POINTS = [1, 2, 3, 5];

/** The choices a first visit starts with. */
function defaults(app: App): QuizWishes {
  return { topic: "", audience: "friends", difficulty: "medium", name: "", language: app.lang === "bg" ? "bg" : "en", rounds: 3, perRound: 6, answers: ["open", "choice", "trueFalse"], seconds: 30, points: 1, specials: [], pictures: false, extra: "" };
}

/** The last choices, each checked; what is missing or odd takes the default. */
function remembered(app: App): QuizWishes {
  const base = defaults(app);
  const kept = app.context.storage.prefs.get<Record<string, unknown> | null>(PREF, null);
  if (kept === null || typeof kept !== "object") return base;
  const pick = <T>(value: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(value as T) ? (value as T) : fallback);
  const list = <T>(value: unknown, allowed: readonly T[]): T[] | undefined => (Array.isArray(value) ? value.filter((one): one is T => allowed.includes(one as T)) : undefined);
  const text = (value: unknown): string => (typeof value === "string" ? value.slice(0, 300) : "");
  return {
    ...base,
    topic: text(kept["topic"]),
    audience: pick(kept["audience"], AUDIENCES, base.audience),
    difficulty: pick(kept["difficulty"], DIFFICULTIES, base.difficulty),
    rounds: pick(kept["rounds"], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], base.rounds),
    perRound: pick(kept["perRound"], [1, 2, ...PER_ROUND], base.perRound),
    answers: list(kept["answers"], ANSWERS) ?? base.answers,
    seconds: pick(kept["seconds"], SECONDS, base.seconds),
    points: pick(kept["points"], POINTS, base.points),
    specials: list(kept["specials"], SPECIALS) ?? base.specials,
    pictures: kept["pictures"] === true,
    extra: text(kept["extra"]),
  };
}

/** A label above its control. */
function field(label: string, control: HTMLElement, wide = false): HTMLElement {
  return h("label", { class: `quiz-ai-control${wide ? " quiz-ai-control--wide" : ""}` }, h("span", { class: "quiz-ai-label" }, label), control);
}

/** A list to pick one from; `value` is selected. */
function select(options: readonly (readonly [string, string])[], value: string, hook: string): HTMLSelectElement {
  const element = h("select", { class: "quiz-input quiz-ai-select", [hook]: "" }, ...options.map(([key, words]) => h("option", { value: key }, words)));
  element.value = value;
  return element;
}

/** A tick with its words; the ⓘ beside it (when there is a text for it) opens a line that says what it is. */
function tick(app: App, label: string, isOn: boolean, hook: string, about?: string): { readonly row: HTMLElement; readonly box: HTMLInputElement } {
  const box = h("input", { type: "checkbox", class: "quiz-ai-box", [hook]: "" });
  box.checked = isOn;
  const row = h("div", { class: "quiz-ai-tick" }, h("label", { class: "quiz-ai-tick-label" }, box, h("span", {}, label)));
  if (about === undefined) return { row, box };
  const id = `quiz-ai-about-${hook}`;
  const text = h("p", { class: "quiz-ai-about", id, hidden: "" }, about);
  const info = h("button", { type: "button", class: "quiz-icon-button quiz-ai-info", "aria-expanded": "false", "aria-controls": id, "aria-label": app.t("ai.about", { name: label }), title: app.t("ai.about", { name: label }) }, icon("info", 20));
  info.addEventListener("click", () => {
    text.hidden = !text.hidden;
    info.setAttribute("aria-expanded", String(!text.hidden));
  });
  row.append(info, text);
  return { row, box };
}

/** A group of ticks under its heading. */
function group(legend: string, ...rows: HTMLElement[]): HTMLFieldSetElement {
  return h("fieldset", { class: "quiz-ai-group" }, h("legend", { class: "quiz-ai-label" }, legend), ...rows);
}

/** Numbers as list options, with their words. */
const numbers = (values: readonly number[], words: (n: number) => string = String): readonly (readonly [string, string])[] => values.map((n) => [String(n), words(n)] as const);

/** How a time reads in the list: seconds, or minutes from one minute on. */
function secondsWords(app: App, n: number): string {
  return n >= 60 ? app.t("ai.minutesValue", { n: (n / 60).toLocaleString(app.lang, { maximumFractionDigits: 1 }) }) : app.t("ai.secondsValue", { n });
}

/** The special rounds' ticks, each with its ⓘ: the creator's own words for the kind. */
function specialTicks(app: App, chosen: readonly SpecialChoice[]): { readonly element: HTMLElement; readonly value: () => SpecialChoice[] } {
  const ticks = SPECIALS.map((special) => ({ special, ...tick(app, app.t(`roundKind.${special}`), chosen.includes(special), `data-ai-special-${special}`, app.t(`roundKind.${special}Text`)) }));
  return { element: group(app.t("ai.specials"), ...ticks.map((one) => one.row)), value: () => ticks.filter((one) => one.box.checked).map((one) => one.special) };
}

/** The kinds of answer: at least one stays ticked. */
function answerTicks(app: App, chosen: readonly AnswerChoice[]): { readonly element: HTMLElement; readonly value: () => AnswerChoice[] } {
  const ticks = ANSWERS.map((answer) => ({ answer, ...tick(app, app.t(`ai.answerKinds.${answer}`), chosen.includes(answer), `data-ai-answer-${answer}`) }));
  for (const one of ticks) {
    one.box.addEventListener("change", () => { if (ticks.every((other) => !other.box.checked)) one.box.checked = true; });
  }
  return { element: h("div", { class: "quiz-ai-ticks-row" }, group(app.t("ai.answers"), ...ticks.map((one) => one.row))), value: () => ticks.filter((one) => one.box.checked).map((one) => one.answer) };
}

/** The lists every form has: what about, for whom, how hard. */
function aboutFields(app: App, start: QuizWishes): { readonly fields: HTMLElement[]; readonly read: () => Pick<QuizWishes, "topic" | "audience" | "difficulty"> } {
  const { t } = app;
  const topic = h("input", { type: "text", class: "quiz-input", maxlength: "200", autocomplete: "off", placeholder: t("ai.topicPlaceholder"), "data-ai-topic": "" });
  topic.value = start.topic;
  const audience = select(AUDIENCES.map((one) => [one, t(`ai.audiences.${one}`)] as const), start.audience, "data-ai-audience");
  const difficulty = select(DIFFICULTIES.map((one) => [one, t(`ai.difficulties.${one}`)] as const), start.difficulty, "data-ai-difficulty");
  return {
    fields: [field(t("ai.topic"), topic, true), field(t("ai.audience"), audience), field(t("ai.difficulty"), difficulty)],
    read: () => ({ topic: topic.value, audience: audience.value as AudienceChoice, difficulty: difficulty.value as DifficultyChoice }),
  };
}

/** What a form has room for: more rounds of a quiz, more questions of a round. */
export interface FormRoom {
  /** Most standard rounds that can be asked for (a quiz has at most 20). */
  readonly rounds: number;
  /** Most questions that can be asked for (a round has at most 50). */
  readonly questions: number;
}

/** The numbers of the form: rounds and questions, time and points (a round's own time and points are kept). */
function sizeFields(app: App, target: FormTarget, start: QuizWishes, room: FormRoom): { readonly fields: HTMLElement[]; readonly read: () => Pick<QuizWishes, "rounds" | "perRound" | "seconds" | "points"> } {
  const { t } = app;
  const roundCount = Math.min(room.rounds, 10);
  const rounds = select(numbers(Array.from({ length: roundCount + 1 }, (_unused, n) => n)), String(Math.min(start.rounds, roundCount)), "data-ai-rounds");
  const counts = target === "questions" ? [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].filter((n) => n <= room.questions) : PER_ROUND;
  const per = select(numbers(counts), String(counts.includes(start.perRound) ? start.perRound : (counts.at(-1) ?? 1)), "data-ai-per-round");
  const seconds = select(numbers(SECONDS, (n) => secondsWords(app, n)), String(start.seconds), "data-ai-seconds");
  const points = select(numbers(POINTS), String(start.points), "data-ai-points");
  const fields = target === "questions"
    ? [field(t("ai.count"), per)]
    : [field(t("ai.rounds"), rounds), field(t("ai.perRound"), per), field(t("ai.seconds"), seconds), field(t("ai.points"), points)];
  return { fields, read: () => ({ rounds: Number(rounds.value), perRound: Number(per.value), seconds: Number(seconds.value), points: Number(points.value) }) };
}

/** The quiz's own name and language (a new quiz only). */
function quizFields(app: App, start: QuizWishes): { readonly fields: HTMLElement[]; readonly read: () => Pick<QuizWishes, "name" | "language"> } {
  const { t } = app;
  const name = h("input", { type: "text", class: "quiz-input", maxlength: "80", autocomplete: "off", placeholder: t("ai.namePlaceholder"), "data-ai-name": "" });
  const language = select([["bg", "Български"], ["en", "English"]], start.language, "data-ai-language");
  return { fields: [field(t("ai.name"), name), field(t("ai.language"), language)], read: () => ({ name: name.value, language: language.value === "bg" ? "bg" : "en" }) };
}

/**
 * Builds the form of an AI window.
 * @param app - the mounted creator
 * @param target - a new quiz, rounds for a quiz or questions for a round
 * @param language - the language of the quiz the rounds or questions are for (a new quiz asks for it)
 * @param room - how many rounds and questions still fit
 */
export function wishForm(app: App, target: FormTarget, language: "en" | "bg", room: FormRoom): WishForm {
  const { t } = app;
  const start = remembered(app);
  const about = aboutFields(app, start);
  const own = target === "quiz" ? quizFields(app, { ...start, language }) : { fields: [], read: () => ({ name: "", language }) };
  const size = sizeFields(app, target, start, room);
  const answers = answerTicks(app, start.answers);
  const specials = target === "questions" ? undefined : specialTicks(app, start.specials);
  const pictures = tick(app, t("ai.pictures"), start.pictures, "data-ai-pictures", t("ai.picturesInfo"));
  const extra = h("textarea", { class: "quiz-input quiz-ai-extra", rows: "2", maxlength: "300", placeholder: t("ai.extraPlaceholder"), "data-ai-extra": "" });
  extra.value = start.extra;
  // Three small groups, two lists a row: what about and for whom, the quiz's own name and language, its size.
  const grids = [about.fields, own.fields, size.fields].filter((fields) => fields.length > 0).map((fields) => h("div", { class: "quiz-ai-grid" }, ...fields));
  const element = h("div", { class: "quiz-ai-form" }, ...grids, answers.element, ...(specials ? [specials.element] : []), h("div", { class: "quiz-ai-group" }, pictures.row), field(t("ai.extra"), extra, true));
  const wishes = (): QuizWishes => ({ ...about.read(), ...own.read(), ...size.read(), answers: answers.value(), specials: specials?.value() ?? [], pictures: pictures.box.checked, extra: extra.value });
  // Every change is kept: the next window starts where this one was left.
  element.addEventListener("change", () => { app.context.storage.prefs.set(PREF, { ...wishes(), name: "" }); });
  return { element, wishes };
}
