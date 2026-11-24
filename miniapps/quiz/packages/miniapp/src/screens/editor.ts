// The question editor (SPEC §4 screen 4), top to bottom: kind chips → the question text → the kind's
// own fields → answer type → the answer → time and points → explanation. Every part is looked up in
// the registries. It saves as you type; typing never rebuilds the form. The live preview is the
// shared slide: next to the form on a wide screen, behind the "Preview" switch on a phone.
import {
  EXPLANATION_MAX, HOST_NOTE_MAX, MAX_QUESTIONS_PER_ROUND, PROMPT_MAX, type Answer, type Question, type Quiz, type Round, editQuestion, findQuestion, moveQuestion, setAnswerType,
  setQuestionKind,
} from "@simeonts/quizzard-quiz-core";
import { type LocalMedia, createLocalMedia } from "@simeonts/quizzard-quiz-player/render";
import type { App } from "../app/state.ts";
import { chipPicker, labelButton, textField } from "../dom/controls.ts";
import { h } from "../dom/h.ts";
import { answerChoices, canShow, kindChoices } from "../ui-registry.ts";
import { backLink, emptyState, up } from "./common.ts";
import { questionFiles } from "./editor-files.ts";
import { timingFields } from "./editor-timing.ts";
import { showLive, slideProps } from "./slide-props.ts";

/** The question being edited, as it is in the quiz right now. */
interface Place {
  readonly quiz: Quiz;
  readonly round: Round;
  readonly question: Question;
  readonly index: number;
}

function placeOf(app: App, questionId: string): Place | undefined {
  const quiz = app.current?.quiz;
  const found = quiz ? findQuestion(quiz, questionId) : undefined;
  return quiz && found ? { quiz, ...found } : undefined;
}

/** The live preview and how to draw it again. */
interface Live {
  readonly element: HTMLElement;
  readonly refresh: () => void;
}

function livePreview(app: App, questionId: string, media: LocalMedia): Live {
  const { t } = app;
  const stage = h("div", { class: "quiz-stage", "data-live-slide": "" });
  const refresh = (): void => {
    const now = placeOf(app, questionId);
    if (now) showLive(stage, { question: now.question, round: now.round, number: now.index + 1, reveal: app.view.isRevealed, ...slideProps(app) }, media);
  };
  const reveal = h("button", { type: "button", class: "button quiz-toggle", "aria-pressed": String(app.view.isRevealed), "data-reveal-toggle": "" }, t("preview.showAnswer"));
  reveal.addEventListener("click", () => {
    app.view.isRevealed = !app.view.isRevealed;
    reveal.setAttribute("aria-pressed", String(app.view.isRevealed));
    refresh();
  });
  refresh();
  const element = h("aside", { class: "quiz-live", "aria-label": t("editor.live"), "data-live": "" }, h("p", { class: "quiz-label" }, t("editor.live")), stage, reveal);
  return { element, refresh };
}

/** Kind and answer-type pickers; a change of either redraws the editor, because its parts change. */
function pickers(app: App, { question }: Place): { kind: HTMLElement; answer: HTMLElement } {
  const { t, env, ui, view } = app;
  const id = question.id;
  const kind = chipPicker({
    legend: t("editor.kind"), name: "quiz-kind", value: question.kind, soon: t("soon"), hint: t("kind.soonHint"),
    options: kindChoices(env.registries.kinds.list().map((entry) => entry.id), ui, t),
    onPick: (kindId) => {
      const now = placeOf(app, id);
      if (now && app.change(setQuestionKind(now.quiz, id, kindId, env))) app.draw('input[name="quiz-kind"]:checked');
    },
  });
  const answer = chipPicker({
    legend: t("editor.answerType"), name: "quiz-answer-type", value: question.answer.type, soon: t("soon"),
    options: answerChoices(env.registries.answers.list().map((entry) => entry.id), ui, t),
    onPick: (typeId) => {
      const now = placeOf(app, id);
      if (!now) return;
      // What was typed under the other type is kept for this visit: switching back loses nothing.
      view.drafts.set(now.question.answer.type, now.question.answer);
      const switched = setAnswerType(now.quiz, id, typeId, env);
      const draft = view.drafts.get(typeId);
      if (app.change(draft ? editQuestion(switched, id, { answer: draft }) : switched)) app.draw('input[name="quiz-answer-type"]:checked');
    },
  });
  return { kind, answer };
}

/** "Move to another round" — only when the quiz has more than one. */
function roundPicker(app: App, { quiz, round, question }: Place): HTMLElement | null {
  if (quiz.rounds.length < 2) return null;
  const select = h("select", { class: "quiz-input", "data-move-round": "" }, ...quiz.rounds.map((candidate, index) => {
    const option = h("option", { value: candidate.id }, `${String(index + 1)}. ${candidate.name}`);
    option.selected = candidate === round;
    return option;
  }));
  select.addEventListener("change", () => {
    const now = app.current?.quiz;
    if (!now) return;
    if (app.change(moveQuestion(now, question.id, select.value))) app.draw("[data-move-round]");
    else {
      select.value = round.id;
      app.context.shell.toast(app.t("question.full", { max: MAX_QUESTIONS_PER_ROUND }));
    }
  });
  return h("label", { class: "quiz-field" }, h("span", { class: "quiz-label" }, app.t("editor.round")), select);
}

/** The form: every part of the question, in the order it is thought of. */
function form(app: App, place: Place, live: Live, signal: AbortSignal): HTMLElement {
  const { t, env, ui } = app;
  const { question } = place;
  const id = question.id;
  const edit = (change: (quiz: Quiz) => Quiz): void => {
    const quiz = app.current?.quiz;
    if (quiz && app.change(change(quiz))) live.refresh();
  };
  const picker = pickers(app, place);
  const prompt = textField({ label: t("editor.prompt"), value: question.prompt, max: PROMPT_MAX, rows: 3, placeholder: t("editor.promptPlaceholder"), props: { "data-prompt": "", "data-focus": "prompt" }, onInput: (value) => { edit((quiz) => editQuestion(quiz, id, { prompt: value })); } });
  const kindPart = ui.kinds.get(question.kind)?.parts?.editor({ question, t, lang: app.lang, files: questionFiles(app, id), signal }) ?? null;
  const answerPart = ui.answers.get(question.answer.type)?.parts?.editor({ answer: question.answer, t, ids: env.ids, change: (answer: Answer) => { edit((quiz) => editQuestion(quiz, id, { answer })); } }) ?? null;
  const explanation = textField({ label: t("editor.explanation"), value: question.explanation ?? "", max: EXPLANATION_MAX, rows: 2, placeholder: t("editor.explanationPlaceholder"), props: { "data-explanation": "" }, onInput: (value) => { edit((quiz) => editQuestion(quiz, id, { explanation: value })); } });
  // The host's own note: saved with the question, shown on the host panel, never on the stage — so no preview to refresh.
  const note = textField({ label: t("editor.note"), value: question.note ?? "", max: HOST_NOTE_MAX, rows: 2, placeholder: t("editor.notePlaceholder"), hint: t("editor.noteHint"), props: { "data-host-note": "" }, onInput: (value) => { edit((quiz) => editQuestion(quiz, id, { note: value })); } });
  const parts = [picker.kind, prompt, kindPart, picker.answer, answerPart, timingFields(app, id, live.refresh), explanation, note, roundPicker(app, place)];
  const element = h("form", { class: "quiz-form quiz-panel", novalidate: "" }, ...parts.filter((part) => part !== null));
  element.addEventListener("submit", (event) => { event.preventDefault(); });
  return element;
}

/** The bar that stays at the bottom: the phone's "Preview" switch and "Done". */
function bar(app: App, live: Live): HTMLElement {
  const { t, view } = app;
  const toggle = labelButton("eye", t("editor.preview"), { class: "button quiz-toggle quiz-narrow-only", "aria-pressed": String(view.isLiveOpen), "data-live-toggle": "" });
  toggle.addEventListener("click", () => {
    view.isLiveOpen = !view.isLiveOpen;
    toggle.setAttribute("aria-pressed", String(view.isLiveOpen));
    live.element.toggleAttribute("data-open", view.isLiveOpen);
  });
  const done = labelButton("check", t("done"), { class: "button button--primary", "data-done": "" });
  done.addEventListener("click", () => { up(app); });
  return h("div", { class: "quiz-editor-bar" }, toggle, done);
}

/**
 * Draws the editor of the question in `app.route`.
 * @param app - the mounted creator
 * @param quiz - the open quiz
 */
export function editorScreen(app: App, quiz: Quiz): HTMLElement {
  const { t } = app;
  const questionId = app.route.screen === "editor" ? app.route.question : "";
  const place = placeOf(app, questionId);
  const screen = h("section", { class: "quiz-screen quiz-editor", "aria-labelledby": "quiz-editor-title", "data-screen": "editor" });
  if (!place) {
    screen.append(backLink(quiz.name, () => { up(app); }), emptyState({ icon: "alert", title: t("editor.goneTitle"), text: t("editor.goneText") }));
    return screen;
  }
  const title = h("h2", { class: "quiz-title", id: "quiz-editor-title", tabindex: "-1", "data-screen-title": "" }, t("editor.title", { n: place.index + 1 }));
  const head = h("div", { class: "quiz-head" }, backLink(place.round.name, () => { up(app); }), title);
  if (!canShow(place.question, app.ui)) {
    // Kept exactly as it is (SPEC §3.3): this version cannot edit it, and saving never loses it.
    screen.append(head, emptyState({ icon: "unknown", title: t("question.unsupported"), text: t("editor.unsupportedText") }), bar(app, { element: h("div"), refresh: () => undefined }));
    return screen;
  }
  // What the editor starts outside its own elements — a playing clip, the paste listener — ends with it.
  const controller = new AbortController();
  const media = createLocalMedia();
  app.view.cleanup = () => {
    controller.abort();
    media.stop();
  };
  const live = livePreview(app, questionId, media);
  live.element.toggleAttribute("data-open", app.view.isLiveOpen);
  screen.append(head, h("div", { class: "quiz-editor-body" }, form(app, place, live, controller.signal), live.element), bar(app, live));
  return screen;
}
