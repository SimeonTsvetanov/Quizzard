// "Export to play" (SPEC F9; lazy: loaded on the first export): puts the open quiz into the player
// template — one self-contained page, built from packages/player and shipped with the app as text
// (its own lazy chunk, precached like every other, so exporting works offline) — and saves it as
// "<quiz name>.html". The media files go in as base64 blocks, written piece by piece (encode.ts)
// and folded into the growing file as they come: the page is never one string in memory, however
// large the quiz. The size is known before anything is built, and a file phones may not open asks first.
import {
  EXPORT_WARN_BYTES, ExportError, MEDIA_BLOCK_CLOSE, type MediaEntry, type Quiz, exportFileName, exportParts, exportSize, mediaBlockOpen, toFile, usedMedia,
} from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { downloadBlob } from "../dom/download.ts";
import { bytesText } from "../format.ts";
import { base64Pieces } from "./encode.ts";

/** What an export made. */
export interface Exported {
  readonly name: string;
  readonly bytes: number;
}

/** Text pieces are folded into the file once this many characters wait, so they never pile up. */
const FOLD_AFTER_CHARS = 8 * 1024 * 1024;

/** What building a page needs besides the quiz. */
export interface BuildOptions {
  /** Gives a media file's bytes; a file that is missing fails the export. */
  readonly blobOf: (id: string) => Blob | undefined;
  /** Called as the media goes in, with the share done (0 … 1). */
  readonly onProgress?: (share: number) => void;
}

/**
 * Builds the playable page of a quiz.
 * @param template - the player template
 * @param quiz - the quiz
 * @param media - the descriptions of the files its questions use
 * @param options - where the files' bytes are, and who hears the progress
 * @returns the page as a file
 * @throws {@link ExportError} `"media"` when a file of the quiz is not there
 */
export async function buildExport(template: string, quiz: Quiz, media: readonly MediaEntry[], { blobOf, onProgress }: BuildOptions): Promise<Blob> {
  const { before, quiz: data, after } = exportParts(template, toFile(quiz, media));
  const total = media.reduce((sum, entry) => sum + entry.bytes, 0);
  let page = new Blob([before, data]);
  let waiting: string[] = [];
  let waitingChars = 0;
  let done = 0;
  const fold = (): void => {
    page = new Blob([page, ...waiting]);
    waiting = [];
    waitingChars = 0;
  };
  const add = (text: string): void => {
    waiting.push(text);
    waitingChars += text.length;
    if (waitingChars >= FOLD_AFTER_CHARS) fold();
  };
  for (const entry of media) {
    const blob = blobOf(entry.id);
    if (!blob) throw new ExportError("media", `media "${entry.id}" is not on this device`);
    add(mediaBlockOpen(entry));
    for await (const piece of base64Pieces(blob)) {
      add(piece);
      done += (piece.length / 4) * 3;
      onProgress?.(total > 0 ? Math.min(1, done / total) : 1);
    }
    add(MEDIA_BLOCK_CLOSE);
  }
  add(after);
  fold();
  return new Blob([page], { type: "text/html" });
}

/**
 * About how large the exported page of a quiz will be.
 * @param templateBytes - the size of the player template
 * @param quiz - the quiz
 * @param media - the descriptions of the files its questions use
 */
export function estimateExport(templateBytes: number, quiz: Quiz, media: readonly MediaEntry[]): number {
  return exportSize(templateBytes + new Blob([JSON.stringify(toFile(quiz, media))]).size, media);
}

/**
 * Exports the open quiz: says how large the file will be when phones may not open it, builds it and saves it.
 * @param app - the mounted creator
 * @param quiz - the quiz
 * @param media - the descriptions of its files
 * @param onProgress - called as the media goes in, with the share done (0 … 1)
 * @returns what was saved, or `null` when the person cancelled
 */
export async function exportQuiz(app: App, quiz: Quiz, media: readonly MediaEntry[], onProgress?: (share: number) => void): Promise<Exported | null> {
  const { t, lang } = app;
  const { default: template } = await import("@simeonts/quizzard-quiz-player/template.html?raw");
  const used = usedMedia(quiz, media);
  const estimate = estimateExport(new Blob([template]).size, quiz, used);
  if (estimate > EXPORT_WARN_BYTES) {
    const isWanted = await app.context.shell.confirm({ title: t("export.bigTitle", { size: bytesText(estimate, lang) }), text: t("export.bigText", { limit: bytesText(EXPORT_WARN_BYTES, lang) }), confirm: t("export.bigConfirm"), cancel: t("cancel") });
    if (!isWanted) return null;
  }
  const blob = await buildExport(template, quiz, used, { blobOf: app.media.blob, ...(onProgress ? { onProgress } : {}) });
  const name = exportFileName(quiz.name, t("export.fallbackName"));
  downloadBlob(blob, name);
  return { name, bytes: blob.size };
}
