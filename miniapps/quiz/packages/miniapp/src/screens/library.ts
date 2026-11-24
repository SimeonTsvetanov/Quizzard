// The library (SPEC F1): every quiz on this device as a card — a little deck that is thicker the
// more questions it holds — with "New quiz" on top. Open, rename in place, duplicate, delete (asks
// when the quiz has something in it, then offers Undo). The first visit is an empty state, not a blank page.
import { QUIZ_NAME_MAX, createQuiz, renameQuiz } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { iconButton } from "../dom/controls.ts";
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

async function newQuiz(app: App): Promise<void> {
  const quiz = createQuiz({ name: freshName(app), language: app.lang, now: new Date().toISOString() }, app.env);
  try {
    await app.store.put(quiz);
  } catch {
    app.context.shell.toast(app.t("notSaved"), { tone: "error" });
    return;
  }
  app.context.storage.notifySaved();
  if (!app.signal.aborted) app.go({ screen: "quiz", quiz: quiz.id });
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
  const game = takeGame(app.context.storage.prefs, line.id);
  await app.store.delete(line.id);
  await loadLibrary(app, "[data-new-quiz]");
  const undo = (): void => {
    if (!before.ok) return;
    game.putBack();
    void app.store.restore(before).then(() => loadLibrary(app, `[data-focus="quiz:${line.id}"]`));
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
  const name = h("span", { class: "quiz-card-name" }, line.name === "" ? t("library.unnamed") : line.name);
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

/**
 * Draws the library.
 * @param app - the mounted creator; `app.library` holds the lines (`null` while they load)
 */
export function libraryScreen(app: App): HTMLElement {
  const { t, library } = app;
  const create = addButton(t("library.new"), "data-new-quiz");
  create.addEventListener("click", () => { void newQuiz(app); });
  const title = h("h2", { class: "quiz-title", id: "quiz-library-title", tabindex: "-1", "data-screen-title": "" }, t("library.title"));
  const screen = h("section", { class: "quiz-screen quiz-library", "aria-labelledby": "quiz-library-title", "data-screen": "library" });
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
    screen.append(h("div", { class: "quiz-head" }, title), emptyState({ hasWizard: true, title: t("library.emptyTitle"), text: t("library.emptyText"), action: create }));
    return screen;
  }
  screen.append(
    h("div", { class: "quiz-head" }, title, h("p", { class: "quiz-sub" }, t("library.sub", { count: library.length })), create),
    h("ul", { class: "quiz-cards" }, ...library.map((line) => card(app, line))));
  return screen;
}
