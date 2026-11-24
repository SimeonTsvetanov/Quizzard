// Opening a quiz for the screens: its data, and its media files as addresses the slide can load.
// It is also where media files nobody uses any more are cleared (reference counting, core
// `usedMediaIds`): a file is deleted only when no question of the quiz points at it — and only at
// the first opening of a visit, never at the moment its question is deleted, so "Undo" right after
// a delete always finds the file still there.
import { usedMedia, usedMediaIds } from "@simeonts/quizzard-quiz-core";
import type { MediaFiles, StoredQuiz } from "../storage/store.ts";
import type { App } from "./state.ts";

/** Deletes the files of a quiz that none of its questions uses and drops their descriptions. */
async function sweep(app: App, stored: StoredQuiz, files: MediaFiles): Promise<{ readonly stored: StoredQuiz; readonly files: MediaFiles }> {
  const used = usedMediaIds(stored.quiz);
  const unused = [...files.keys()].filter((id) => !used.has(id));
  const media = usedMedia(stored.quiz, stored.media);
  if (unused.length === 0 && media.length === stored.media.length) return { stored, files };
  const kept = { quiz: stored.quiz, media };
  // The quiz first (as it was — no new "last changed"), then the files: a failure in between leaves files without a description, never the reverse.
  await app.store.restore(kept);
  await app.store.deleteMedia(stored.quiz.id, unused);
  return { stored: kept, files: new Map([...files].filter(([id]) => used.has(id))) };
}

/**
 * Loads the quiz of a route unless it is the open one.
 * @param app - the mounted creator
 * @param quizId - the quiz
 * @returns `false` when it cannot be opened
 */
export async function openQuiz(app: App, quizId: string): Promise<boolean> {
  if (app.current?.quiz.id === quizId && app.media.quizId === quizId) return true;
  await app.saver.flush();
  const loaded = await app.store.get(quizId).catch(() => ({ ok: false as const }));
  if (!loaded.ok) return false;
  let stored: StoredQuiz = { quiz: loaded.quiz, media: loaded.media };
  let files: MediaFiles = await app.store.media(quizId).catch(() => new Map<string, Blob>());
  if (!app.view.swept.has(quizId)) {
    app.view.swept.add(quizId);
    ({ stored, files } = await sweep(app, stored, files).catch(() => ({ stored, files })));
  }
  app.current = stored;
  app.media.hold(quizId, files);
  app.view.lastRound = null;
  return true;
}
