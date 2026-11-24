// "Save quiz file" and "Share" (SPEC F10; lazy): builds the quiz file and hands it over — to the
// device's share sheet where that takes files (AirDrop, a chat, mail), else to the downloads.
import type { MediaEntry, Quiz } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { downloadBlob } from "../dom/download.ts";
import { canShareFile } from "../dom/share-file.ts";
import { buildQuizFile } from "./write.ts";

/** What became of the file: saved to the device, given to the share sheet, the share sheet closed, or not built. */
export type SaveOutcome = { readonly how: "saved" | "shared" | "cancelled"; readonly name: string; readonly bytes: number } | { readonly how: "failed" };

/**
 * Saves or shares the quiz file of the open quiz.
 * @param app - the mounted creator
 * @param quiz - the quiz
 * @param media - the descriptions of its files
 * @param isShare - `true` = the share sheet (falls back to saving where it takes no such file)
 */
export async function saveQuizFile(app: App, quiz: Quiz, media: readonly MediaEntry[], isShare: boolean): Promise<SaveOutcome> {
  const file = buildQuizFile(quiz, media, app.media.blob, app.t("export.fallbackName"));
  if (file === null) return { how: "failed" };
  const made = { name: file.name, bytes: file.size };
  if (isShare && canShareFile(file)) {
    try {
      await navigator.share({ files: [file], title: quiz.name });
      return { how: "shared", ...made };
    } catch (error) {
      // Closing the share sheet is not a failure; anything else falls back to saving the file.
      if (error instanceof DOMException && error.name === "AbortError") return { how: "cancelled", ...made };
    }
  }
  downloadBlob(file, file.name);
  return { how: "saved", ...made };
}
