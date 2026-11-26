// The editor's side of a question's file (SPEC F7, §3.5): what the kind's picker asks for is done
// here — the checks and the preparation (media/import.ts, loaded with the first file), the room on
// the device, the storing, and the question's pointer to the file. The file is stored first and the
// question changed after: a refused file leaves nothing behind (AC5).
import { MEDIA_RULES, type MediaEntry, type MediaType, type Question, type Quiz, answerMediaOf, changeQuestion, editQuestion, findQuestion, mediaOf, mediaUses, mimeOf, musicOf, usedMediaBytes, withMedia, without } from "@simeonts/quizzard-quiz-core";
import { stillOf } from "@simeonts/quizzard-quiz-player/render";
import type { App } from "../app/state.ts";
import { canCut, mustCut } from "../media/cut/can-cut.ts";
import { refusalText } from "../media/refusal-text.ts";
import { hasRoomFor, keepOnDevice } from "../storage/space.ts";
import { bytesText } from "../format.ts";
import type { QuestionFiles } from "../ui-registry.ts";
import { offerUndo } from "./common.ts";

/** Which of a question's files: its own (what the kind shows), the file shown with its answer, or the music under it. */
export type FileSlot = "question" | "answer" | "music";

/** Where each slot keeps its file on the question, and the form part that gets the focus after a change. */
const SLOTS = {
  question: { field: "media", focus: '[data-focus="media"]' },
  answer: { field: "answerMedia", focus: '[data-focus="answer-media"]' },
  music: { field: "music", focus: '[data-focus="music-media"]' },
} as const;

/** How a question lost its file: taken off, swapped for another, or dropped by a change of kind. */
export type MediaLoss = "removed" | "replaced";

/**
 * After a question lost its file: a toast with Undo that gives the question its kind and its file
 * back. The file itself is still on the device — unused files are only cleared when the quiz is
 * opened in a later visit (app/open-quiz.ts) — so Undo has nothing to load.
 * @param app - the mounted creator
 * @param before - the question as it was, with its file
 * @param entry - the description of that file
 * @param how - what happened to it
 * @param slot - the question's own file (the default), or the picture shown with its answer
 */
export function offerMediaUndo(app: App, before: Question, entry: MediaEntry, how: MediaLoss, slot: FileSlot = "question"): void {
  const type: MediaType = entry.type;
  const restoreOwn = (quiz: Quiz): Quiz => changeQuestion(quiz, before.id, (question) => ({
    ...without(question, "data"),
    kind: before.kind,
    ...(before.media ? { media: before.media } : {}),
    ...(before.data === undefined ? {} : { data: before.data }),
  }));
  // The answer's picture is its own field: the question's kind and its own file are left as they are now.
  const restoreAnswer = (quiz: Quiz): Quiz => (before.answerMedia ? editQuestion(quiz, before.id, { answerMedia: before.answerMedia }) : quiz);
  const restoreMusic = (quiz: Quiz): Quiz => (before.music ? editQuestion(quiz, before.id, { music: before.music }) : quiz);
  const restore = { question: restoreOwn, answer: restoreAnswer, music: restoreMusic }[slot];
  offerUndo(app, app.t(`media.${how}.${type}`), restore, () => {
    const now = app.current;
    if (now) app.change(now.quiz, withMedia(now.media, entry));
    if (app.route.screen === "editor" && app.route.question === before.id) app.draw(SLOTS[slot].focus);
    else if (slot === "music") app.draw();
  });
}

/** What a picked file is, by its type or its name's ending: a clip with sound and picture, a sound, else a picture. */
function fileType(file: File): MediaType {
  const mime = mimeOf(file.type, file.name);
  if (mime.startsWith("video/") || /\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(file.name)) return "video";
  if (mime.startsWith("audio/") || /\.(mp3|m4a|wav|ogg|oga|aac|flac|opus)$/i.test(file.name)) return "audio";
  return "image";
}

/** With the first media file the browser is asked, once, to keep this site's storage (SPEC §3.5). */
function askToKeep(app: App): void {
  if (app.view.hasAskedToKeep) return;
  app.view.hasAskedToKeep = true;
  app.context.storage.notifySaved();
  void keepOnDevice();
}

/** Stores a prepared file and points the question at it. */
async function attach(app: App, questionId: string, entry: MediaEntry, blob: Blob, slot: FileSlot): Promise<boolean> {
  const quizId = app.current?.quiz.id;
  if (quizId === undefined) return false;
  await app.store.putMedia(quizId, entry.id, blob);
  const now = app.current;
  if (app.signal.aborted || now?.quiz.id !== quizId || !findQuestion(now.quiz, questionId)) return false;
  app.media.add(entry.id, blob);
  askToKeep(app);
  const edit = { [SLOTS[slot].field]: { id: entry.id } };
  return app.change(editQuestion(now.quiz, questionId, edit), withMedia(now.media, entry));
}

/** Opens the cut window for a picked file — or, with `null`, for the file the slot has — and takes what it makes like a picked file. */
async function cutFor(app: App, files: QuestionFiles, type: MediaType | null, entry: MediaEntry | undefined, source: File | null, signal: AbortSignal): Promise<string | null> {
  const { t } = app;
  if (type === null || !canCut(type)) return null;
  const own = entry ? app.media.blob(entry.id) : undefined;
  const file = source ?? (entry && own ? new File([own], entry.name, { type: entry.mime }) : null);
  if (file === null) return null;
  const maxBytes = MEDIA_RULES[type].maxBytes;
  const { openCutDialog } = await import("../media/cut/dialog.ts");
  const made = await openCutDialog({ host: app.host, file, type, t, lang: app.lang, maxBytes, fits: source === null, signal });
  // No clip this browser can read: the usual check says what is wrong with it (its format, its size).
  if (made === "unreadable") return files.pick(file);
  // Closed without a new file: the question's own stays as it is; a picked one that had to be cut is still not in.
  if (made === null) return source === null ? null : t("media.mustCut", { name: file.name, size: bytesText(file.size, app.lang) });
  return files.pick(made);
}

/**
 * The file of the question in the editor and how to change it.
 * @param app - the mounted creator
 * @param questionId - the question being edited
 * @param slot - the question's own file, or the picture shown with its answer
 */
export function questionFiles(app: App, questionId: string, slot: FileSlot = "question"): QuestionFiles {
  const { t } = app;
  const current = app.current;
  const question = current ? findQuestion(current.quiz, questionId)?.question : undefined;
  const isAnswer = slot === "answer";
  const ownType = question ? (app.env.registries.kinds.get(question.kind)?.mediaType ?? null) : null;
  const answers = question && current ? answerMediaOf(question, current.media) : undefined;
  // The answer's file may be a picture or a clip: its type comes from the file itself (the one it has, or the one picked).
  const answerType: MediaType | null = question ? (answers?.type ?? "image") : null;
  const isMusic = slot === "music";
  const music = question && current ? musicOf(question, current.media) : undefined;
  const musicType: MediaType | null = question ? "audio" : null;
  const slotType = isMusic ? musicType : ownType;
  const type = isAnswer ? answerType : slotType;
  const typeOf = (file: File): MediaType | null => (isAnswer ? fileType(file) : type);
  const own = question && current && ownType !== null ? mediaOf(question, current.media, ownType) : undefined;
  const entry = { question: own, answer: answers, music }[slot];
  // The music's picker also stands in a round's own panel (a round that states its task): there the round is drawn again.
  const redraw = (): void => {
    if (app.route.screen === "editor" && app.route.question === questionId) app.draw(SLOTS[slot].focus);
    else if (isMusic) app.draw();
  };
  const files: QuestionFiles = {
    type,
    entry,
    still: entry ? (stillOf(entry) ?? (entry.type === "image" ? app.media.url(entry.id) : null)) : null,
    sharedWith: entry && current ? mediaUses(current.quiz, entry.id) - 1 : 0,
    async pick(file) {
      const now = app.current;
      const type = typeOf(file);
      if (!now || type === null) return t("media.failed");
      // The file being replaced no longer counts against the quiz — unless another question shows it too.
      const withoutOld = entry && mediaUses(now.quiz, entry.id) <= 1 ? entry.bytes : 0;
      const usedBytes = usedMediaBytes(now.quiz, now.media) - withoutOld;
      const { importMedia } = await import("../media/import.ts");
      const result = await importMedia(file, { type, usedBytes, id: app.env.ids(), hasRoomFor });
      if (!result.ok) return refusalText(t, app.lang, result, usedBytes);
      try {
        if (!(await attach(app, questionId, result.entry, result.blob, slot))) return null;
        redraw();
        // The file that was there is not lost: Undo points the question back at it.
        if (question && entry) offerMediaUndo(app, question, entry, "replaced", slot);
        return null;
      } catch {
        return refusalText(t, app.lang, { reason: "no-space", type, name: file.name, bytes: result.blob.size, mime: result.entry.mime }, usedBytes);
      }
    },
    remove() {
      const now = app.current?.quiz;
      if (!now || !app.change(editQuestion(now, questionId, { [SLOTS[slot].field]: null }))) return;
      redraw();
      if (question && entry) offerMediaUndo(app, question, entry, "removed", slot);
    },
    anyType: isAnswer,
    canCut: isAnswer ? canCut("video") || canCut("audio") : type !== null && canCut(type),
    needsCut: (file) => {
      const picked = typeOf(file);
      return picked !== null && mustCut(picked, file, mimeOf(file.type, file.name));
    },
    cut: (source, signal) => cutFor(app, files, source === null ? (entry?.type ?? null) : typeOf(source), entry, source, signal),
  };
  return files;
}
