// "Open a quiz file" (SPEC F10, AC7; lazy): reads the file, refuses with a message that names it
// when it is not a quiz this version can take, and puts the quiz with its media into the library.
// A quiz that is already there: the same content adds nothing; another version asks "Cancel", "Keep
// both" or "Replace" — Cancel (also Escape and a click outside) changes nothing; the other two can be
// undone. Either way the quiz's media is written in one step that replaces what the quiz had, so
// opening a file twice never leaves two copies of a file.
import { MEDIA_RULES, QUIZ_MEDIA_MAX_BYTES, duplicateQuiz, isSameQuizFile, toFile, usedMedia } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { ask } from "../dom/ask.ts";
import { bytesText, dateTimeText } from "../format.ts";
import { loadLibrary } from "../screens/library.ts";
import { hasRoomFor, keepOnDevice } from "../storage/space.ts";
import type { StoredQuiz } from "../storage/store.ts";
import { type ReadQuizFile, type RefusedQuizFile, readQuizFile } from "./read.ts";

/**
 * The message for a quiz file that was refused.
 * @param app - gives the translator and the language
 * @param name - the picked file's name
 * @param refused - why
 */
export function refusedText(app: Pick<App, "t" | "lang">, name: string, refused: RefusedQuizFile): string {
  const { t, lang } = app;
  const file = refused.entry?.name ?? "";
  const limit = refused.entry ? bytesText(MEDIA_RULES[refused.entry.type].maxBytes, lang) : "";
  const texts: Readonly<Record<RefusedQuizFile["reason"], () => string>> = {
    "not-a-quiz": () => t("file.notQuiz", { name }),
    newer: () => t("file.newer", { name }),
    invalid: () => t("file.damaged", { name }),
    damaged: () => t("file.damaged", { name }),
    "media-format": () => t("file.mediaFormat", { name, file }),
    "media-too-big": () => t("file.mediaTooBig", { name, file, limit }),
    "quiz-too-big": () => t("file.quizTooBig", { name, limit: bytesText(QUIZ_MEDIA_MAX_BYTES, lang) }),
  };
  return texts[refused.reason]();
}

/** What the person chose for a quiz that is already in the library in another version. */
type Existing = "replace" | "both";

/** The quiz is already in the library in another version: replace it, keep both, or (`null`) leave everything as it is. */
function askExisting(app: App, mine: StoredQuiz, theirs: StoredQuiz): Promise<Existing | null> {
  const { t, lang } = app;
  const values = { name: theirs.quiz.name, mine: dateTimeText(mine.quiz.updatedAt, lang), theirs: dateTimeText(theirs.quiz.updatedAt, lang) };
  return ask<Existing>({
    host: app.host,
    title: t("file.existsTitle", values),
    text: t("file.existsText", values),
    cancel: t("cancel"),
    options: [{ value: "both", label: t("file.keepBoth") }, { value: "replace", label: t("file.replace"), isDanger: true }],
  });
}

/** Shows a quiz again after its stored data changed under the creator (Undo of a replace, a copy taken away). */
async function showAgain(app: App, id: string | null): Promise<void> {
  if (app.signal.aborted) return;
  app.media.release(); // the open quiz is read again
  if (id !== null && app.route.screen !== "library") app.go({ screen: "quiz", quiz: id }, "replace");
  else if (app.route.screen === "library") await loadLibrary(app);
  else app.go({ screen: "library" }, "replace");
}

/** Undo of "Keep both": the copy goes, and the library is what is shown. */
async function removeCopy(app: App, id: string): Promise<void> {
  await app.saver.flush();
  await app.store.delete(id);
  await showAgain(app, null);
}

/** Replaces the library's quiz with the file's and offers Undo, which writes the person's own version and its media back. */
async function replace(app: App, mine: StoredQuiz, read: ReadQuizFile): Promise<void> {
  const { t } = app;
  const id = mine.quiz.id;
  // The files of the version being replaced are held as handles until the offer is gone (as the library does for a delete).
  const before = await app.store.media(id).catch(() => new Map<string, Blob>());
  await app.store.bring(read.stored, read.files);
  app.view.swept.delete(id);
  const undo = async (): Promise<void> => {
    await app.saver.flush();
    await app.store.bring(mine, before);
    app.view.swept.delete(id);
    await showAgain(app, id);
  };
  app.context.shell.toast(t("file.replaced", { name: read.stored.quiz.name }), { action: { label: t("undo"), run: () => { void undo(); } } });
}

/** Puts a read quiz into the library; returns the id it has there, or `null` when the person cancelled. */
async function store(app: App, read: ReadQuizFile): Promise<string | null> {
  const { t } = app;
  const { stored, files } = read;
  const existing = await app.store.get(stored.quiz.id);
  if (existing.ok && isSameQuizFile(toFile(existing.quiz, usedMedia(existing.quiz, existing.media)), toFile(stored.quiz, stored.media))) {
    app.context.shell.toast(t("file.same", { name: stored.quiz.name }));
    return stored.quiz.id;
  }
  if (!existing.ok && existing.reason === "missing") {
    await app.store.bring(stored, files);
    app.context.shell.toast(t("file.added", { name: stored.quiz.name }));
    return stored.quiz.id;
  }
  const choice = existing.ok ? await askExisting(app, existing, stored) : "both";
  if (choice === null) return null;
  if (existing.ok && choice === "replace") {
    await replace(app, existing, read);
    return stored.quiz.id;
  }
  // Kept both: the file's quiz comes in as a copy with ids of its own.
  const copy = duplicateQuiz(stored.quiz, { name: t("library.copyName", { name: stored.quiz.name }), now: stored.quiz.updatedAt }, app.env);
  await app.store.bring({ quiz: copy, media: stored.media }, files);
  app.context.shell.toast(t("file.addedCopy", { name: copy.name }), { action: { label: t("undo"), run: () => { void removeCopy(app, copy.id); } } });
  return copy.id;
}

/**
 * Opens a picked quiz file: adds its quiz to the library and shows it.
 * @param app - the mounted creator
 * @param file - the picked or dropped file
 */
export async function openQuizFile(app: App, file: File): Promise<void> {
  const { t } = app;
  const fail = (message: string): void => { app.context.shell.toast(message, { tone: "error" }); };
  const read = await readQuizFile(file, app.env.registries).catch((): RefusedQuizFile => ({ ok: false, reason: "damaged" }));
  const isGone = (): boolean => app.signal.aborted;
  if (isGone()) return;
  if (!read.ok) {
    fail(refusedText(app, file.name, read));
    return;
  }
  if (!(await hasRoomFor(file.size))) {
    fail(t("file.noSpace", { name: file.name, size: bytesText(file.size, app.lang) }));
    return;
  }
  try {
    const id = await store(app, read);
    if (isGone()) return;
    if (id === null) {
      // Cancelled: nothing was added, nothing replaced, and the library stays where it was.
      app.host.querySelector<HTMLElement>("[data-open-file]")?.focus();
      return;
    }
    app.context.storage.notifySaved();
    if (read.files.size > 0) void keepOnDevice();
    app.go({ screen: "quiz", quiz: id });
  } catch {
    fail(t("file.noSpace", { name: file.name, size: bytesText(file.size, app.lang) }));
  }
}
