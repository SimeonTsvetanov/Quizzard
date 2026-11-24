// The editor's side of a question's file (SPEC F7, §3.5): what the kind's picker asks for is done
// here — the checks and the preparation (media/import.ts, loaded with the first file), the room on
// the device, the storing, and the question's pointer to the file. The file is stored first and the
// question changed after: a refused file leaves nothing behind (AC5).
import { type MediaEntry, editQuestion, findQuestion, mediaOf, mediaUses, usedMediaBytes, withMedia } from "@simeonts/quizzard-quiz-core";
import { stillOf } from "@simeonts/quizzard-quiz-player/render";
import type { App } from "../app/state.ts";
import { refusalText } from "../media/refusal-text.ts";
import { hasRoomFor, keepOnDevice } from "../storage/space.ts";
import type { QuestionFiles } from "../ui-registry.ts";

/** With the first media file the browser is asked, once, to keep this site's storage (SPEC §3.5). */
function askToKeep(app: App): void {
  if (app.view.hasAskedToKeep) return;
  app.view.hasAskedToKeep = true;
  app.context.storage.notifySaved();
  void keepOnDevice();
}

/** Stores a prepared file and points the question at it. */
async function attach(app: App, questionId: string, entry: MediaEntry, blob: Blob): Promise<boolean> {
  const quizId = app.current?.quiz.id;
  if (quizId === undefined) return false;
  await app.store.putMedia(quizId, entry.id, blob);
  const now = app.current;
  if (app.signal.aborted || now?.quiz.id !== quizId || !findQuestion(now.quiz, questionId)) return false;
  app.media.add(entry.id, blob);
  askToKeep(app);
  return app.change(editQuestion(now.quiz, questionId, { media: { id: entry.id } }), withMedia(now.media, entry));
}

/**
 * The file of the question in the editor and how to change it.
 * @param app - the mounted creator
 * @param questionId - the question being edited
 */
export function questionFiles(app: App, questionId: string): QuestionFiles {
  const { t } = app;
  const current = app.current;
  const question = current ? findQuestion(current.quiz, questionId)?.question : undefined;
  const type = question ? (app.env.registries.kinds.get(question.kind)?.mediaType ?? null) : null;
  const entry = question && current && type !== null ? mediaOf(question, current.media, type) : undefined;
  const redraw = (): void => { if (app.route.screen === "editor" && app.route.question === questionId) app.draw('[data-focus="media"]'); };
  return {
    type,
    entry,
    still: entry ? (stillOf(entry) ?? (entry.type === "image" ? app.media.url(entry.id) : null)) : null,
    sharedWith: entry && current ? mediaUses(current.quiz, entry.id) - 1 : 0,
    async pick(file) {
      const now = app.current;
      if (!now || type === null) return t("media.failed");
      // The file being replaced no longer counts against the quiz — unless another question shows it too.
      const withoutOld = entry && mediaUses(now.quiz, entry.id) <= 1 ? entry.bytes : 0;
      const usedBytes = usedMediaBytes(now.quiz, now.media) - withoutOld;
      const { importMedia } = await import("../media/import.ts");
      const result = await importMedia(file, { type, usedBytes, id: app.env.ids(), hasRoomFor });
      if (!result.ok) return refusalText(t, app.lang, result, usedBytes);
      try {
        if (await attach(app, questionId, result.entry, result.blob)) redraw();
        return null;
      } catch {
        return refusalText(t, app.lang, { reason: "no-space", type, name: file.name, bytes: result.blob.size, mime: result.entry.mime }, usedBytes);
      }
    },
    remove() {
      const now = app.current?.quiz;
      if (now && app.change(editQuestion(now, questionId, { media: null }))) redraw();
    },
  };
}
