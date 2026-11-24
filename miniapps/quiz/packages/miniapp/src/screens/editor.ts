// The question editor (SPEC §4 screen 4), top to bottom: kind chips → the question text → the kind's
// own fields → answer type → the answer → time and points → explanation → host note, and at the end
// what can be done with the whole question. Every part is looked up in the registries. It saves as
// you type; typing never rebuilds the form. The live preview is the shared slide: next to the form
// on a wide screen, behind the "Preview" switch on a phone.
import {
  EXPLANATION_MAX, HOST_NOTE_MAX, PROMPT_MAX, type Answer, type Quiz, canAddQuestion, editQuestion, mediaOf, setAnswerType, setQuestionKind, setRoundDefaults,
} from "@simeonts/quizzard-quiz-core";
import { type LocalMedia, createLocalMedia } from "@simeonts/quizzard-quiz-player/render";
import type { App } from "../app/state.ts";
import { chipPicker, labelButton, textField } from "../dom/controls.ts";
import { h } from "../dom/h.ts";
import { icon } from "../dom/icons.ts";
import { answerChoices, canShow, kindChoices } from "../ui-registry.ts";
import { backLink, emptyState, up } from "./common.ts";
import { offerMediaUndo, questionFiles } from "./editor-files.ts";
import { editorHead, step } from "./editor-head.ts";
import { timingFields } from "./editor-timing.ts";
import { type CardPlace, duplicate, edit, placeOf, remove } from "./question-moves.ts";
import { newQuestion } from "./round.ts";
import { roundPlace, showLive, slideProps } from "./slide-props.ts";

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
    if (now) showLive(stage, { question: now.question, round: now.round, number: now.index + 1, reveal: app.view.isRevealed, ...slideProps(app), ...roundPlace(app, now.round) }, media);
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

/**
 * Kind and answer-type pickers; a change of either redraws the editor, because its parts change — and
 * becomes what the round's next new question starts as (UX review T2), which a line under the chips says.
 */
function pickers(app: App, { question, round }: CardPlace): { kind: HTMLElement; answer: HTMLElement } {
  const { t, env, ui, view } = app;
  const id = question.id;
  const kind = chipPicker({
    legend: t("editor.kind"), name: "quiz-kind", value: question.kind, soon: t("soon"), hint: t("kind.soonHint"),
    options: kindChoices(env.registries.kinds.list().map((entry) => entry.id), ui, t),
    onPick: (kindId) => {
      const now = placeOf(app, id);
      if (!now || !app.change(setRoundDefaults(setQuestionKind(now.quiz, id, kindId, env), round.id, { questionKind: kindId }))) return;
      view.stickyFor = id;
      app.draw('input[name="quiz-kind"]:checked');
      // A kind that takes another file (or none) lets the question's file go: said, with Undo.
      const lost = app.current ? mediaOf(now.question, app.current.media) : undefined;
      if (lost && placeOf(app, id)?.question.media === undefined) offerMediaUndo(app, now.question, lost, "removed");
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
      const switched = setRoundDefaults(setAnswerType(now.quiz, id, typeId, env), round.id, { answerType: typeId });
      const draft = view.drafts.get(typeId);
      view.stickyFor = id;
      if (app.change(draft ? editQuestion(switched, id, { answer: draft }) : switched)) app.draw('input[name="quiz-answer-type"]:checked');
    },
  });
  if (view.stickyFor === id) answer.append(h("p", { class: "quiz-hint", "data-sticky-note": "" }, t("editor.sticky")));
  return { kind, answer };
}

/** At the end of the form: the whole question duplicated or deleted (the card's own moves, with its Undo). */
function ending(app: App, { question, index, round }: CardPlace): HTMLElement {
  const { t } = app;
  const copy = labelButton("copy", t("editor.duplicate"), { class: "button", "data-editor-duplicate": "" });
  copy.disabled = !canAddQuestion(round);
  copy.addEventListener("click", () => {
    const made = duplicate(app, question.id);
    if (made === undefined) return;
    edit(app, made, "replace", '[data-focus="prompt"]');
    app.context.shell.toast(t("editor.duplicated", { n: index + 2 }));
  });
  const trash = labelButton("trash", t("editor.delete"), { class: "button button--destructive", "data-editor-delete": "" });
  trash.addEventListener("click", () => { remove(app, question.id, () => { up(app); }); });
  return h("div", { class: "quiz-form-end" }, copy, trash);
}

/** The form: every part of the question, in the order it is thought of. */
function form(app: App, place: CardPlace, live: Live, signal: AbortSignal): HTMLElement {
  const { t, env, ui } = app;
  const { question } = place;
  const id = question.id;
  const edited = (change: (quiz: Quiz) => Quiz): void => {
    const quiz = app.current?.quiz;
    if (quiz && app.change(change(quiz))) live.refresh();
  };
  const picker = pickers(app, place);
  const prompt = textField({ label: t("editor.prompt"), value: question.prompt, max: PROMPT_MAX, rows: 3, placeholder: t("editor.promptPlaceholder"), props: { "data-prompt": "", "data-focus": "prompt" }, onInput: (value) => { edited((quiz) => editQuestion(quiz, id, { prompt: value })); } });
  const kindPart = ui.kinds.get(question.kind)?.parts?.editor({ question, t, lang: app.lang, files: questionFiles(app, id), signal }) ?? null;
  const answerPart = ui.answers.get(question.answer.type)?.parts?.editor({
    answer: question.answer, t, ids: env.ids,
    change: (answer: Answer) => { edited((quiz) => editQuestion(quiz, id, { answer })); },
    offerUndo: (message, run) => { app.context.shell.toast(message, { action: { label: t("undo"), run } }); },
  }) ?? null;
  const explanation = textField({ label: t("editor.explanation"), value: question.explanation ?? "", max: EXPLANATION_MAX, rows: 2, placeholder: t("editor.explanationPlaceholder"), props: { "data-explanation": "" }, onInput: (value) => { edited((quiz) => editQuestion(quiz, id, { explanation: value })); } });
  // The host's own note: saved with the question, shown on the host panel, never on the stage — so no preview to refresh.
  const note = textField({ label: t("editor.note"), value: question.note ?? "", max: HOST_NOTE_MAX, rows: 2, placeholder: t("editor.notePlaceholder"), hint: t("editor.noteHint"), props: { "data-host-note": "" }, onInput: (value) => { edited((quiz) => editQuestion(quiz, id, { note: value })); } });
  const parts = [picker.kind, prompt, kindPart, picker.answer, answerPart, timingFields(app, id, live.refresh), explanation, note, ending(app, place)];
  const element = h("form", { class: "quiz-form quiz-panel", novalidate: "" }, ...parts.filter((part) => part !== null));
  element.addEventListener("submit", (event) => { event.preventDefault(); });
  return element;
}

/** Done, and at once a new question in the same round — or, when the round is full, just Done with the reason. */
function addAnother(app: App, place: CardPlace): void {
  const now = placeOf(app, place.question.id) ?? place;
  if (canAddQuestion(now.round)) newQuestion(app, now.round.id, "replace");
  else up(app);
}

/** The bar that stays at the bottom: the phone's "Preview" switch, "Add another" and "Done". */
function bar(app: App, live: Live, place: CardPlace | null): HTMLElement {
  const { t, view } = app;
  const words = (): string => t(view.isLiveOpen ? "editor.previewHide" : "editor.preview");
  const toggle = labelButton(view.isLiveOpen ? "check" : "eye", words(), { class: "button quiz-toggle quiz-narrow-only", "aria-pressed": String(view.isLiveOpen), "data-live-toggle": "" });
  toggle.addEventListener("click", () => {
    view.isLiveOpen = !view.isLiveOpen;
    toggle.setAttribute("aria-pressed", String(view.isLiveOpen));
    toggle.querySelector("span")?.replaceChildren(words());
    toggle.querySelector("svg")?.replaceWith(icon(view.isLiveOpen ? "check" : "eye"));
    live.element.toggleAttribute("data-open", view.isLiveOpen);
  });
  const done = labelButton("check", t("done"), { class: "button button--primary", "data-done": "" });
  done.addEventListener("click", () => { up(app); });
  const box = h("div", { class: "quiz-editor-bar" }, toggle);
  if (place && canAddQuestion(place.round)) {
    const another = labelButton("plus", t("editor.another"), { class: "button", title: t("editor.anotherHint"), "data-add-another": "" });
    another.addEventListener("click", () => { addAnother(app, place); });
    box.append(another);
  }
  box.append(done);
  return box;
}

/** The editor's keys (UX review T1): Ctrl/Cmd+Enter = done and the next new question; Alt+↑/↓ = the previous or next question. */
function keys(app: App, screen: HTMLElement, place: CardPlace): void {
  screen.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      addAnother(app, place);
    } else if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault();
      step(app, placeOf(app, place.question.id) ?? place, event.key === "ArrowUp" ? -1 : 1);
    }
  });
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
  const head = editorHead(app, place);
  if (!canShow(place.question, app.ui)) {
    // Kept exactly as it is (SPEC §3.3): this version cannot edit it, and saving never loses it.
    screen.append(head, emptyState({ icon: "unknown", title: t("question.unsupported"), text: t("editor.unsupportedText") }), bar(app, { element: h("div"), refresh: () => undefined }, null));
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
  keys(app, screen, place);
  screen.append(head, h("div", { class: "quiz-editor-body" }, form(app, place, live, controller.signal), live.element), bar(app, live, place));
  return screen;
}
