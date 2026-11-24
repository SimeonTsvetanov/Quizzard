// "Open a quiz file" (SPEC F10, AC7; lazy): reads the file, refuses with a message that names it
// when it is not a quiz this version can take, and puts the quiz with its media into the library.
// A quiz that is already there: the same content adds nothing; another version asks "Replace" or
// "Keep both" — keeping both is what closing the question does, because it loses nothing, and it can
// be undone. Either way the quiz's media is written in one step that replaces what the quiz had, so
// opening a file twice never leaves two copies of a file.
import { MEDIA_RULES, QUIZ_MEDIA_MAX_BYTES, duplicateQuiz, isSameQuizFile, toFile, usedMedia } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { bytesText, changedText } from "../format.ts";
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

/** The quiz is already in the library in another version: `true` = replace it, `false` = keep both. */
function askReplace(app: App, mine: StoredQuiz, theirs: StoredQuiz): Promise<boolean> {
  const { t, lang } = app;
  const values = { name: theirs.quiz.name, mine: changedText(mine.quiz.updatedAt, lang), theirs: changedText(theirs.quiz.updatedAt, lang) };
  return app.context.shell.confirm({ title: t("file.existsTitle", values), text: t("file.existsText", values), confirm: t("file.replace"), cancel: t("file.keepBoth") });
}

/** Puts a read quiz into the library; returns the id it has there, or `null` when it was not stored. */
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
  if (existing.ok && (await askReplace(app, existing, stored))) {
    await app.store.bring(stored, files);
    app.view.swept.delete(stored.quiz.id);
    app.context.shell.toast(t("file.replaced", { name: stored.quiz.name }));
    return stored.quiz.id;
  }
  // Kept both: the file's quiz comes in as a copy with ids of its own.
  const copy = duplicateQuiz(stored.quiz, { name: t("library.copyName", { name: stored.quiz.name }), now: stored.quiz.updatedAt }, app.env);
  await app.store.bring({ quiz: copy, media: stored.media }, files);
  app.context.shell.toast(t("file.addedCopy", { name: copy.name }), { action: { label: t("undo"), run: () => { void app.store.delete(copy.id).then(() => { if (app.route.screen === "library") return loadLibrary(app); app.go({ screen: "library" }, "replace"); return undefined; }); } } });
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
  if (app.signal.aborted) return;
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
    if (id === null || app.signal.aborted) return;
    app.context.storage.notifySaved();
    if (read.files.size > 0) void keepOnDevice();
    app.go({ screen: "quiz", quiz: id });
  } catch {
    fail(t("file.noSpace", { name: file.name, size: bytesText(file.size, app.lang) }));
  }
}
