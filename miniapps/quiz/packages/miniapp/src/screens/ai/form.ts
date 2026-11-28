// The form of an AI window (screens/ai/window.ts): what the person wants, chosen with lists and ticks
// instead of typed to the assistant — so the assistant writes at once and asks nothing. A special round
// and the pictures each have an ⓘ that says what they are. The choices are kept for the next time.
import type { AnswerChoice, AudienceChoice, DifficultyChoice, QuizWishes, SpecialChoice } from "@simeonts/quizzard-quiz-core/draft";
import type { App } from "../../app/state.ts";
import { h } from "../../dom/h.ts";
import { icon } from "../../dom/icons.ts";
import { ANSWERS, AUDIENCES, DIFFICULTIES, type KeptWishes, NEW_QUESTIONS, PER_ROUND, POINTS, SECONDS, SPECIALS, readCount, readWishes, writeCount, writeWishes } from "../../storage/ai-prefs.ts";

/** Which parts the form has: a new quiz, rounds for a quiz, questions for a round. */
export type FormTarget = "quiz" | "rounds" | "questions";

/** The form on screen, and the wishes it holds now. */
export interface WishForm {
  readonly element: HTMLElement;
  wishes(): QuizWishes;
}

/** A label above its control. */
function field(label: string, control: HTMLElement, wide = false): HTMLElement {
  return h("label", { class: `quiz-ai-control${wide ? " quiz-ai-control--wide" : ""}` }, h("span", { class: "quiz-ai-label" }, label), control);
}

/** A list to pick one from; `value` is selected. An option may name its own language (`[value, words, lang]`). */
function select(options: readonly (readonly [string, string, string?])[], value: string, hook: string): HTMLSelectElement {
  const element = h("select", { class: "quiz-input quiz-ai-select", [hook]: "" }, ...options.map(([key, words, lang]) => h("option", { value: key, ...(lang === undefined ? {} : { lang }) }, words)));
  element.value = value;
  return element;
}

/** A tick with its words; the ⓘ beside it (when there is a text for it) opens a line that says what it is. */
function tick(app: App, label: string, isOn: boolean, hook: string, about?: { readonly text: string; readonly name: string }): { readonly row: HTMLElement; readonly box: HTMLInputElement } {
  const box = h("input", { type: "checkbox", class: "quiz-ai-box", [hook]: "" });
  box.checked = isOn;
  const row = h("div", { class: "quiz-ai-tick" }, h("label", { class: "quiz-ai-tick-label" }, box, h("span", {}, label)));
  if (about === undefined) return { row, box };
  const id = `quiz-ai-about-${hook}`;
  const text = h("p", { class: "quiz-ai-about", id, hidden: "" }, about.text);
  const info = h("button", { type: "button", class: "quiz-icon-button quiz-ai-info", "aria-expanded": "false", "aria-controls": id, "aria-label": about.name, title: about.name }, icon("info", 20));
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
  const ticks = SPECIALS.map((special) => {
    const name = app.t(`roundKind.${special}`);
    return { special, ...tick(app, name, chosen.includes(special), `data-ai-special-${special}`, { text: app.t(`roundKind.${special}Text`), name: app.t("ai.about", { name }) }) };
  });
  return { element: group(app.t("ai.specials"), ...ticks.map((one) => one.row)), value: () => ticks.filter((one) => one.box.checked).map((one) => one.special) };
}

/** The kinds of answer, named as the editor names them: at least one stays ticked, and the form says why when the last is unticked. */
function answerTicks(app: App, chosen: readonly AnswerChoice[], say: (text: string) => void): { readonly element: HTMLElement; readonly value: () => AnswerChoice[] } {
  const ticks = ANSWERS.map((answer) => ({ answer, ...tick(app, app.t(`answer.${answer}`), chosen.includes(answer), `data-ai-answer-${answer}`) }));
  for (const one of ticks) {
    one.box.addEventListener("change", () => {
      if (ticks.some((other) => other.box.checked)) return;
      one.box.checked = true;
      say(app.t("ai.keepOneAnswer"));
    });
  }
  return { element: h("div", { class: "quiz-ai-ticks-row" }, group(app.t("ai.answers"), ...ticks.map((one) => one.row))), value: () => ticks.filter((one) => one.box.checked).map((one) => one.answer) };
}

/** The lists every form has: what about, for whom, how hard. */
function aboutFields(app: App, start: KeptWishes): { readonly fields: HTMLElement[]; readonly read: () => Pick<QuizWishes, "topic" | "audience" | "difficulty"> } {
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

/** The allowed number nearest to the wanted one. */
const nearest = (values: readonly number[], wanted: number): number => values.reduce((best, one) => (Math.abs(one - wanted) < Math.abs(best - wanted) ? one : best), values[0] ?? wanted);

/** The numbers of the form: rounds and questions, time and points (a round's own time and points are kept). */
function sizeFields(app: App, target: FormTarget, start: KeptWishes, room: FormRoom): { readonly fields: HTMLElement[]; readonly read: () => Pick<QuizWishes, "rounds" | "perRound" | "seconds" | "points"> } {
  const { t } = app;
  const roundCount = Math.min(room.rounds, 10);
  const rounds = select(numbers(Array.from({ length: roundCount + 1 }, (_unused, n) => n)), String(Math.min(start.rounds, roundCount)), "data-ai-rounds");
  const counts = target === "questions" ? NEW_QUESTIONS.filter((n) => n <= room.questions) : PER_ROUND;
  const wanted = target === "questions" ? readCount(app.context.storage.prefs) : start.perRound;
  const per = select(numbers(counts), String(nearest(counts, wanted)), "data-ai-per-round");
  const seconds = select(numbers(SECONDS, (n) => secondsWords(app, n)), String(start.seconds), "data-ai-seconds");
  const points = select(numbers(POINTS), String(start.points), "data-ai-points");
  const fields = target === "questions"
    ? [field(t("ai.count"), per)]
    : [field(t("ai.rounds"), rounds), field(t("ai.perRound"), per), field(t("ai.seconds"), seconds), field(t("ai.points"), points)];
  return { fields, read: () => ({ rounds: Number(rounds.value), perRound: Number(per.value), seconds: Number(seconds.value), points: Number(points.value) }) };
}

/** The quiz's own name and language (a new quiz only). */
function quizFields(app: App, language: "en" | "bg"): { readonly fields: HTMLElement[]; readonly read: () => Pick<QuizWishes, "name" | "language"> } {
  const { t } = app;
  const name = h("input", { type: "text", class: "quiz-input", maxlength: "80", autocomplete: "off", placeholder: t("ai.namePlaceholder"), "data-ai-name": "" });
  const choice = select([["bg", "Български", "bg"], ["en", "English", "en"]], language, "data-ai-language");
  return { fields: [field(t("ai.name"), name), field(t("ai.language"), choice)], read: () => ({ name: name.value, language: choice.value === "bg" ? "bg" : "en" }) };
}

/**
 * Builds the form of an AI window.
 * @param app - the mounted creator
 * @param target - a new quiz, rounds for a quiz or questions for a round
 * @param language - the language of the quiz the rounds or questions are for (a new quiz asks for it)
 * @param room - how many rounds and questions still fit
 * @param say - says something in the window's status line
 */
export function wishForm(app: App, target: FormTarget, language: "en" | "bg", room: FormRoom, say: (text: string) => void): WishForm {
  const { t } = app;
  const { prefs } = app.context.storage;
  const start = readWishes(prefs);
  const about = aboutFields(app, start);
  const own = target === "quiz" ? quizFields(app, language) : { fields: [], read: () => ({ name: "", language }) };
  const size = sizeFields(app, target, start, room);
  const answers = answerTicks(app, start.answers, say);
  const specials = target === "questions" ? undefined : specialTicks(app, start.specials);
  const pictures = tick(app, t("ai.pictures"), start.pictures, "data-ai-pictures", { text: t("ai.picturesInfo"), name: t("ai.picturesAbout") });
  const extra = h("textarea", { class: "quiz-input quiz-ai-extra", rows: "2", maxlength: "300", placeholder: t("ai.extraPlaceholder"), "data-ai-extra": "" });
  extra.value = start.extra;
  // Three small groups, two lists a row: what about and for whom, the quiz's own name and language, its size.
  const grids = [about.fields, own.fields, size.fields].filter((fields) => fields.length > 0).map((fields) => h("div", { class: "quiz-ai-grid" }, ...fields));
  const element = h("div", { class: "quiz-ai-form" }, ...grids, answers.element, ...(specials ? [specials.element] : []), h("div", { class: "quiz-ai-group" }, pictures.row), field(t("ai.extra"), extra, true));
  const wishes = (): QuizWishes => ({ ...about.read(), ...own.read(), ...size.read(), answers: answers.value(), specials: specials?.value() ?? [], pictures: pictures.box.checked, extra: extra.value, ui: app.lang === "bg" ? "bg" : "en" });
  // Every change is kept — only what this form shows: the next window starts where it was left.
  element.addEventListener("change", () => {
    const now = wishes();
    const shared = { topic: now.topic, audience: now.audience, difficulty: now.difficulty, answers: now.answers, pictures: now.pictures, extra: now.extra };
    if (target === "questions") {
      writeWishes(prefs, shared);
      writeCount(prefs, now.perRound);
    } else {
      writeWishes(prefs, { ...shared, perRound: now.perRound, seconds: now.seconds, points: now.points, specials: now.specials, ...(room.rounds >= 10 ? { rounds: now.rounds } : {}) });
    }
  });
  return { element, wishes };
}
