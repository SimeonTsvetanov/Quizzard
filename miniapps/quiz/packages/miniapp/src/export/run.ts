// "Export to play" (SPEC F9; lazy: loaded on the first export): puts the open quiz into the player
// template — one self-contained page, built from packages/player and shipped with the app as text
// (its own lazy chunk, precached like every other, so exporting works offline) — and saves it as
// "<quiz name>.html".
import { EXPORT_WARN_BYTES, type MediaEntry, type Quiz, assembleExport, exportFileName, toFile } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { downloadBlob } from "../dom/download.ts";
import { bytesText } from "../format.ts";

/** What an export made. */
export interface Exported {
  readonly name: string;
  readonly bytes: number;
}

/**
 * Builds the playable page of a quiz.
 * @param quiz - the quiz
 * @param media - the descriptions of its files
 * @returns the page as a file
 */
export async function buildExport(quiz: Quiz, media: readonly MediaEntry[]): Promise<Blob> {
  const { default: template } = await import("@simeonts/quizzard-quiz-player/template.html?raw");
  // Media bytes join here with the picture, audio and video kinds (slices 3 and 4).
  return new Blob([assembleExport(template, toFile(quiz, media), [])], { type: "text/html" });
}

/**
 * Exports the open quiz: builds the page, asks before saving a file phones may not open, saves it.
 * @param app - the mounted creator
 * @param quiz - the quiz
 * @param media - the descriptions of its files
 * @returns what was saved, or `null` when the person cancelled
 */
export async function exportQuiz(app: App, quiz: Quiz, media: readonly MediaEntry[]): Promise<Exported | null> {
  const { t, lang } = app;
  const blob = await buildExport(quiz, media);
  const name = exportFileName(quiz.name, t("export.fallbackName"));
  const size = bytesText(blob.size, lang);
  if (blob.size > EXPORT_WARN_BYTES) {
    const isWanted = await app.context.shell.confirm({ title: t("export.bigTitle", { size }), text: t("export.bigText", { limit: bytesText(EXPORT_WARN_BYTES, lang) }), confirm: t("export.bigConfirm"), cancel: t("cancel") });
    if (!isWanted) return null;
  }
  downloadBlob(blob, name);
  return { name, bytes: blob.size };
}
