// The library (SPEC F1): every quiz on this device as a card — a little deck that is thicker the
// more questions it holds — with "New quiz" on top. Open, rename in place, duplicate, delete (asks
// when the quiz has something in it, then offers Undo). The first visit is an empty state, not a blank page.
import { QUIZ_FILE_EXTENSION, QUIZ_FILE_MIME, QUIZ_NAME_MAX, createQuiz, renameQuiz } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { iconButton, labelButton } from "../dom/controls.ts";
import { h } from "../dom/h.ts";
import { icon } from "../dom/icons.ts";
import { bytesText, changedText, wholeMinutes } from "../format.ts";
import { takeGame } from "../storage/game.ts";
import type { QuizSummary } from "../storage/store.ts";
import { addButton, emptyState } from "./common.ts";

/**
 * How thick a quiz's deck is drawn: 0 (one card) to 3, by its number of questions.
 * @param questions - questions in the quiz
 */
export function stackOf(questions: number): number {
  if (questions <= 0) return 0;
  if (questions <= 5) return 1;
  return questions <= 15 ? 2 : 3;
}

/** Reads the library again and draws it; a browser that refuses storage gets the error state. */
export async function loadLibrary(app: App, focus?: string): Promise<void> {
  app.library = await app.store.list().catch(() => "error" as const);
  if (!app.signal.aborted && app.route.screen === "library") app.draw(focus);
}

/** "New quiz", then "New quiz 2" … — a name no quiz in the library has yet. */
function freshName(app: App): string {
  const lines = app.library === null || app.library === "error" ? [] : app.library;
  const taken = new Set(lines.map((line) => line.name));
  const base = app.t("library.newName");
  if (!taken.has(base)) return base;
  for (let n = 2; ; n += 1) {
    const name = `${base} ${String(n)}`;
    if (!taken.has(name)) return name;
  }
}

/** Creates the quiz once its name is confirmed (UX review S16: nothing is made before that) and opens it on its next step, "Add round". */
async function createNamed(app: App, typed: string): Promise<void> {
  const name = typed.trim() === "" ? freshName(app) : typed.trim();
  const quiz = createQuiz({ name, language: app.lang, now: new Date().toISOString() }, app.env);
  try {
    await app.store.put(quiz);
  } catch {
    app.context.shell.toast(app.t("notSaved"), { tone: "error" });
    return;
  }
  app.view.isNaming = false;
  app.context.storage.notifySaved();
  if (!app.signal.aborted) app.go({ screen: "quiz", quiz: quiz.id }, "push", "[data-add-round]");
}

/** "New quiz" asks for the name first, in place: a focused field, "Create quiz" and "Cancel" (also Escape). */
function newQuizForm(app: App): HTMLElement {
  const { t } = app;
  const field = h("input", { type: "text", class: "quiz-input", maxlength: String(QUIZ_NAME_MAX), autocomplete: "off", enterkeyhint: "done", "aria-label": t("library.nameLabel"), placeholder: t("library.namePlaceholder"), "data-focus": "new-name", "data-new-name": "" });
  const create = h("button", { type: "submit", class: "button button--primary", "data-create-quiz": "" }, t("library.create"));
  const cancel = h("button", { type: "button", class: "button", "data-cancel-new": "" }, t("cancel"));
  const close = (): void => {
    app.view.isNaming = false;
    app.draw("[data-new-quiz]");
  };
  const form = h("form", { class: "quiz-new-form", "aria-label": t("library.new"), "data-new-form": "" }, field, h("div", { class: "quiz-new-buttons" }, cancel, create));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    create.disabled = true;
    void createNamed(app, field.value).finally(() => { create.disabled = false; });
  });
  cancel.addEventListener("click", close);
  form.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    close();
  });
  return form;
}

/** "New quiz" and "Open a quiz file" — or, once "New quiz" was pressed, the form that asks for the name. */
function headActions(app: App): HTMLElement {
  if (app.view.isNaming) return newQuizForm(app);
  const create = addButton(app.t("library.new"), "data-new-quiz");
  create.addEventListener("click", () => {
    app.view.isNaming = true;
    app.draw('[data-focus="new-name"]');
  });
  return h("div", { class: "quiz-head-actions" }, create, openFileButton(app));
}

async function rename(app: App, id: string, name: string): Promise<void> {
  app.view.renaming = null;
  const loaded = await app.store.get(id);
  const cleaned = name.trim();
  if (loaded.ok && cleaned !== "" && cleaned !== loaded.quiz.name) await app.store.put(renameQuiz(loaded.quiz, cleaned), loaded.media);
  await loadLibrary(app, `[data-focus="quiz:${id}"]`);
}

async function duplicate(app: App, line: QuizSummary): Promise<void> {
  const copy = await app.store.duplicate(line.id, app.t("library.copyName", { name: line.name }));
  await loadLibrary(app, copy ? `[data-focus="quiz:${copy.id}"]` : undefined);
  if (copy) app.context.shell.toast(app.t("library.duplicated", { name: copy.name }));
}

/** Deletes a quiz and the game that was being played with it: asks first when it has rounds; Undo writes both back exactly as they were. */
async function remove(app: App, line: QuizSummary): Promise<void> {
  const { t } = app;
  if (line.rounds > 0 || line.problem !== undefined) {
    const isConfirmed = await app.context.shell.confirm({ title: t("library.deleteTitle", { name: line.name }), text: t("library.deleteText"), confirm: t("library.deleteConfirm"), cancel: t("cancel"), danger: true });
    if (!isConfirmed || app.signal.aborted) return;
  }
  const before = await app.store.get(line.id);
  // The quiz's media files are held as handles until the Undo offer is gone: Undo puts them back too.
  const files = await app.store.media(line.id).catch(() => new Map<string, Blob>());
  const game = takeGame(app.context.storage.prefs, line.id);
  await app.store.delete(line.id);
  await loadLibrary(app, "[data-new-quiz]");
  const undo = (): void => {
    if (!before.ok) return;
    game.putBack();
    void app.store.bring(before, files).then(() => loadLibrary(app, `[data-focus="quiz:${line.id}"]`));
  };
  const action = before.ok ? { action: { label: t("undo"), run: undo } } : {};
  app.context.shell.toast(t("library.deleted", { name: line.name }), action);
}

function renameForm(app: App, line: QuizSummary): HTMLElement {
  const { t } = app;
  const field = h("input", { type: "text", class: "quiz-input", maxlength: String(QUIZ_NAME_MAX), autocomplete: "off", enterkeyhint: "done", "aria-label": t("library.nameLabel"), "data-focus": `rename:${line.id}` });
  field.value = line.name;
  const done = h("button", { type: "submit", class: "button button--primary" }, t("done"));
  const form = h("form", { class: "quiz-card-rename" }, field, done);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void rename(app, line.id, field.value);
  });
  field.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    app.view.renaming = null;
    app.draw(`[data-focus="quiz:${line.id}"]`);
  });
  return form;
}

/** The words of a card: name, what is in it, when it changed and its size — or why it cannot be opened. */
function cardText(app: App, line: QuizSummary): HTMLElement[] {
  const { t, lang } = app;
  const shown = line.name === "" ? t("library.unnamed") : line.name;
  // Clamped to three lines with an ellipsis (styles/library.css); the whole name is its tooltip.
  const name = h("span", { class: "quiz-card-name", title: shown }, shown);
  if (line.problem !== undefined) return [name, h("span", { class: "quiz-card-meta" }, t(line.problem === "newer" ? "library.newer" : "library.damaged"))];
  const content = [t("count.rounds", { count: line.rounds }), t("count.questions", { count: line.questions }), t("count.minutes", { count: wholeMinutes(line.seconds) })].join(" · ");
  const changed = t("library.changed", { when: changedText(line.updatedAt, lang) });
  return [name, h("span", { class: "quiz-card-meta" }, content), h("span", { class: "quiz-card-meta quiz-card-meta--quiet" }, `${changed} · ${bytesText(line.bytes, lang)}`)];
}

function card(app: App, line: QuizSummary): HTMLElement {
  const { t } = app;
  const item = h("li", { class: "quiz-card", "data-quiz": line.id, "data-stack": String(stackOf(line.questions)) });
  const mark = h("span", { class: "quiz-card-mark", "aria-hidden": "true" }, icon(line.problem === undefined ? "deck" : "alert", 24));
  if (app.view.renaming === line.id) {
    item.append(mark, renameForm(app, line));
    return item;
  }
  const body = h("span", { class: "quiz-card-body" }, ...cardText(app, line));
  const actions = h("div", { class: "quiz-card-actions" });
  if (line.problem === undefined) {
    const open = h("button", { type: "button", class: "quiz-card-open", "data-focus": `quiz:${line.id}` }, mark, body);
    open.addEventListener("click", () => { app.go({ screen: "quiz", quiz: line.id }); });
    const renameButton = iconButton("pencil", t("library.rename", { name: line.name }));
    renameButton.addEventListener("click", () => {
      app.view.renaming = line.id;
      app.draw(`[data-focus="rename:${line.id}"]`);
      app.host.querySelector<HTMLInputElement>(`[data-focus="rename:${line.id}"]`)?.select();
    });
    const copy = iconButton("copy", t("library.duplicate", { name: line.name }));
    copy.addEventListener("click", () => { void duplicate(app, line); });
    item.append(open);
    actions.append(renameButton, copy);
  } else {
    item.append(h("div", { class: "quiz-card-open", "data-focus": `quiz:${line.id}` }, mark, body));
  }
  const trash = iconButton("trash", t("library.delete", { name: line.name }), { class: "quiz-danger" });
  trash.addEventListener("click", () => { void remove(app, line); });
  actions.append(trash);
  item.append(actions);
  return item;
}

/** Opens a picked or dropped quiz file; the quiz-file code is loaded with the first one. */
function openFile(app: App, file: File): void {
  void import("../quizfile/open.ts").then(({ openQuizFile }) => openQuizFile(app, file)).catch(() => {
    if (!app.signal.aborted) app.context.shell.toast(app.t("file.openFailed"), { tone: "error" });
  });
}

/** "Open a quiz file": the system's file picker behind a button. */
function openFileButton(app: App): HTMLElement {
  const input = h("input", { type: "file", class: "visually-hidden", accept: `${QUIZ_FILE_EXTENSION},${QUIZ_FILE_MIME},application/octet-stream`, tabindex: "-1", "aria-hidden": "true", "data-open-file-input": "" });
  input.addEventListener("change", () => {
    const [file] = input.files ?? [];
    input.value = "";
    if (file) openFile(app, file);
  });
  const button = labelButton("folder", app.t("file.open"), { class: "button", "data-open-file": "" });
  button.addEventListener("click", () => { input.click(); });
  return h("span", { class: "quiz-open-file" }, button, input);
}

/** A quiz file dropped anywhere on the library is opened (a computer's way). */
function takeDrops(app: App, screen: HTMLElement): void {
  const isFile = (event: DragEvent): boolean => event.dataTransfer?.types.includes("Files") ?? false;
  screen.addEventListener("dragover", (event) => {
    if (!isFile(event)) return;
    event.preventDefault();
    screen.setAttribute("data-over", "");
  });
  for (const name of ["dragleave", "dragend", "drop"]) screen.addEventListener(name, () => { screen.removeAttribute("data-over"); });
  screen.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files[0];
    if (!file) return;
    event.preventDefault();
    openFile(app, file);
  });
}

/** From this many quizzes the library has a search field. */
export const SEARCH_FROM = 6;

/**
 * Whether a quiz's name matches what was typed: every typed word is somewhere in it, whatever the case.
 * @param name - the quiz's name
 * @param query - the search text
 */
export function matches(name: string, query: string): boolean {
  const hay = name.toLocaleLowerCase();
  return query.toLocaleLowerCase().split(/\s+/).every((word) => hay.includes(word));
}

/** The search field: it hides the cards whose names do not match, as it is typed in; the text survives a redraw. */
function searchField(app: App, list: HTMLElement): HTMLElement {
  const { t } = app;
  const field = h("input", { type: "search", class: "quiz-input", autocomplete: "off", enterkeyhint: "search", "aria-label": t("library.search"), placeholder: t("library.search"), "data-search": "", "data-focus": "search" });
  const none = h("p", { class: "quiz-hint", role: "status", "data-search-none": "" });
  field.value = app.view.query;
  const apply = (): void => {
    app.view.query = field.value;
    const lines = app.library === null || app.library === "error" ? [] : app.library;
    let shown = 0;
    for (const item of list.querySelectorAll<HTMLElement>("[data-quiz]")) {
      const line = lines.find((one) => one.id === item.getAttribute("data-quiz"));
      item.hidden = line !== undefined && !matches(line.name, field.value.trim());
      if (!item.hidden) shown += 1;
    }
    none.textContent = shown === 0 ? t("library.searchNone", { text: field.value.trim() }) : "";
  };
  field.addEventListener("input", apply);
  apply();
  return h("div", { class: "quiz-search" }, h("span", { class: "quiz-search-mark", "aria-hidden": "true" }, icon("search", 18)), field, none);
}

/**
 * Draws the library.
 * @param app - the mounted creator; `app.library` holds the lines (`null` while they load)
 */
export function libraryScreen(app: App): HTMLElement {
  const { t, library } = app;
  const title = h("h1", { class: "quiz-title", id: "quiz-library-title", tabindex: "-1", "data-screen-title": "" }, t("library.title"));
  const screen = h("section", { class: "quiz-screen quiz-library", "aria-labelledby": "quiz-library-title", "data-screen": "library" });
  takeDrops(app, screen);
  if (library === null) {
    screen.setAttribute("aria-busy", "true");
    screen.append(h("div", { class: "quiz-head" }, title));
    return screen;
  }
  if (library === "error") {
    screen.append(h("div", { class: "quiz-head" }, title), emptyState({ icon: "alert", title: t("library.errorTitle"), text: t("library.errorText") }));
    return screen;
  }
  if (library.length === 0) {
    screen.append(h("div", { class: "quiz-head" }, title), emptyState({ hasWizard: true, title: t("library.emptyTitle"), text: t("library.emptyText"), action: headActions(app) }));
    return screen;
  }
  const list = h("ul", { class: "quiz-cards" }, ...library.map((line) => card(app, line)));
  screen.append(h("div", { class: "quiz-head" }, title, h("p", { class: "quiz-sub" }, t("library.sub", { count: library.length })), headActions(app)));
  if (library.length >= SEARCH_FROM) screen.append(searchField(app, list));
  screen.append(list);
  return screen;
}
