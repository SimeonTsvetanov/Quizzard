// The quiz's files on the quiz screen: how much media it carries (SPEC §5: "the quiz screen shows
// the size used"), "Export to play" with its progress, and the quiz file — "Save quiz file" and,
// where the device's share sheet takes it, "Share". The heavy parts (the player template, the base64
// work, the quiz-file code) are loaded on the first use.
import { QUIZ_FILE_EXTENSION, QUIZ_FILE_MIME, QUIZ_MEDIA_MAX_BYTES, type Quiz, usedMediaBytes } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { labelButton } from "../dom/controls.ts";
import { h } from "../dom/h.ts";
import { canShareFile } from "../dom/share-file.ts";
import { bytesText } from "../format.ts";

/** Whether the quiz screen is still the one on show (a slow export may outlive it). */
function isOnQuiz(app: App): boolean {
  return !app.signal.aborted && (app.route.screen === "quiz" || app.route.screen === "round");
}

/**
 * "Media: 12.4 MB of 250 MB" with a thin meter; nothing for a quiz without media.
 * @param app - the mounted creator
 * @param quiz - the open quiz
 */
export function mediaMeter(app: App, quiz: Quiz): HTMLElement | null {
  const used = usedMediaBytes(quiz, app.current?.media ?? []);
  if (used === 0) return null;
  const fill = h("span", { class: "quiz-meter-fill" });
  fill.style.setProperty("--quiz-share", Math.min(1, used / QUIZ_MEDIA_MAX_BYTES).toFixed(4));
  return h("div", { class: "quiz-meter", "data-media-size": "" },
    h("span", { class: "quiz-meter-words" }, app.t("quiz.media", { used: bytesText(used, app.lang), limit: bytesText(QUIZ_MEDIA_MAX_BYTES, app.lang) })),
    h("span", { class: "quiz-meter-track", "aria-hidden": "true" }, fill));
}

/** Runs "Export to play" from its button, showing how far the media is in. */
async function runExport(app: App, quiz: Quiz, button: HTMLButtonElement, progress: HTMLElement): Promise<void> {
  const { t } = app;
  const words = button.querySelector("span");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  const show = (share: number): void => {
    const percent = Math.round(share * 100);
    const text = t("export.progress", { percent });
    if (words) words.textContent = text;
    button.setAttribute("aria-label", text);
    progress.hidden = false;
    progress.style.setProperty("--quiz-share", share.toFixed(3));
  };
  try {
    const { exportQuiz } = await import("../export/run.ts");
    const made = await exportQuiz(app, app.current?.quiz ?? quiz, app.current?.media ?? [], show);
    if (made === null || app.signal.aborted) return;
    app.view.exported = { quiz: quiz.id, ...made };
    app.context.shell.toast(t("export.done", { name: made.name, size: bytesText(made.bytes, app.lang) }));
  } catch {
    if (!app.signal.aborted) app.context.shell.toast(t("export.failed"), { tone: "error" });
  } finally {
    button.disabled = false;
    button.removeAttribute("aria-busy");
    if (isOnQuiz(app)) app.draw('[data-focus="export"]');
  }
}

/** Saves or shares the quiz file from its button. */
async function runSave(app: App, quiz: Quiz, button: HTMLButtonElement, isShare: boolean): Promise<void> {
  const { t } = app;
  button.disabled = true;
  try {
    await app.saver.flush(); // the file holds the last change
    const { saveQuizFile } = await import("../quizfile/save.ts");
    const made = await saveQuizFile(app, app.current?.quiz ?? quiz, app.current?.media ?? [], isShare);
    if (app.signal.aborted) return;
    if (made.how === "failed") app.context.shell.toast(t("file.saveFailed"), { tone: "error" });
    else if (made.how === "saved") app.context.shell.toast(t("file.saved", { name: made.name, size: bytesText(made.bytes, app.lang) }));
  } catch {
    if (!app.signal.aborted) app.context.shell.toast(t("file.saveFailed"), { tone: "error" });
  } finally {
    button.disabled = false;
  }
}

/**
 * The "Export to play" button with its progress line.
 * @param app - the mounted creator
 * @param quiz - the open quiz
 * @returns the button, the line that goes under the actions and the export itself (the caller decides when it runs)
 */
export function exportControl(app: App, quiz: Quiz): { readonly button: HTMLButtonElement; readonly progress: HTMLElement; readonly run: () => void } {
  // One short word on the button, so the row's buttons are equal; its full name is its accessible name and tooltip.
  const button = labelButton("download", app.t("quiz.exportShort"), { class: "button", "aria-label": app.t("quiz.export"), title: app.t("quiz.export"), "data-export": "", "data-focus": "export" });
  const progress = h("div", { class: "quiz-progress", "aria-hidden": "true", "data-export-progress": "" }, h("span", { class: "quiz-meter-fill" }));
  progress.hidden = true;
  return { button, progress, run: () => { void runExport(app, quiz, button, progress); } };
}

/**
 * The quiz file's row: what it is for, "Save quiz file" and — where the share sheet takes the file — "Share".
 * @param app - the mounted creator
 * @param quiz - the open quiz
 */
export function quizFileRow(app: App, quiz: Quiz): HTMLElement {
  const { t } = app;
  const save = labelButton("file", t("file.save"), { class: "button", "data-save-file": "", "data-focus": "save-file" });
  save.addEventListener("click", () => { void runSave(app, quiz, save, false); });
  const row = h("div", { class: "quiz-actions" }, save);
  if (canShareFile(new File([], `quiz${QUIZ_FILE_EXTENSION}`, { type: QUIZ_FILE_MIME }))) {
    const share = labelButton("share", t("file.share"), { class: "button", "data-share-file": "" });
    share.addEventListener("click", () => { void runSave(app, quiz, share, true); });
    row.append(share);
  }
  return h("div", { class: "quiz-file-row", "data-file-row": "" }, h("p", { class: "quiz-hint" }, t("file.hint")), row);
}
