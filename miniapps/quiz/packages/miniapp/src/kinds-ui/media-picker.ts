// The editor part of every kind that carries a file (picture, audio, video): the system's file
// picker, a drop on the area and — on a computer — a paste from the clipboard. With no file it is
// one wide "Choose …" with the formats and the limit under it; with a file it shows the file (its
// still, name, size or length) with Replace and Remove. A refused file's message stays at the
// control, naming the file and the limit (AC5). The checking and storing is the editor's
// (`context.files`); this part only shows.
import { MEDIA_RULES, type MediaType, clockText } from "@simeonts/quizzard-quiz-core";
import { h } from "../dom/h.ts";
import { icon, type IconName } from "../dom/icons.ts";
import { bytesText } from "../format.ts";
import type { KindEditorContext } from "../ui-registry.ts";

/** The file-name endings offered next to the MIME types (some pickers filter by ending only). */
const ENDINGS: Readonly<Record<MediaType, string>> = { image: ".jpg,.jpeg,.png,.webp,.gif", audio: ".mp3,.m4a", video: ".mp4" };
const MARKS: Readonly<Record<MediaType, IconName>> = { image: "picture", audio: "audio", video: "video" };

/** The hidden file input behind "Choose …" and "Replace". */
function fileInput(type: MediaType, canCut: boolean, onFile: (file: File) => void): HTMLInputElement {
  // Where a clip can be cut, any clip can be picked (a phone's .mov, a long recording): it is cut on the way in.
  const accept = canCut && type !== "image" ? `${type}/*,${ENDINGS[type]}` : `${MEDIA_RULES[type].mimes.join(",")},${ENDINGS[type]}`;
  const input = h("input", { type: "file", class: "visually-hidden", accept, tabindex: "-1", "aria-hidden": "true", "data-media-input": "" });
  input.addEventListener("change", () => {
    const [file] = input.files ?? [];
    input.value = ""; // the same file can be picked again after a refusal
    if (file) onFile(file);
  });
  return input;
}

/** What is known of the file, in one line: "1920 × 1080 px · 420 kB" or "0:30 · 1.2 MB". */
function facts({ files, lang, t }: KindEditorContext): string {
  const entry = files.entry;
  if (!entry) return "";
  const size = bytesText(entry.bytes, lang);
  if (entry.seconds !== undefined) return `${clockText(entry.seconds)} · ${size}`;
  return entry.width !== undefined && entry.height !== undefined ? t("media.pixels", { width: entry.width, height: entry.height, size }) : size;
}

/** The file the question has: its still or mark, its name and facts, Replace and Remove. */
function current(context: KindEditorContext, type: MediaType, choose: () => void, fix: (file: File | null) => void): HTMLElement {
  const { files, t } = context;
  const name = files.entry?.name ?? "";
  const thumb = files.still === null ? h("span", { class: "quiz-file-mark" }, icon(MARKS[type], 24)) : h("img", { class: "quiz-file-still", src: files.still, alt: "" });
  const replace = h("button", { type: "button", class: "button quiz-button", "data-media-replace": "", "data-focus": "media" }, icon("replace", 18), h("span", {}, t("media.replace")));
  replace.addEventListener("click", choose);
  const remove = h("button", { type: "button", class: "button quiz-button", "data-media-remove": "" }, icon("trash", 18), h("span", {}, t("media.remove")));
  remove.addEventListener("click", () => { files.remove(); });
  const lines = h("div", { class: "quiz-file-lines" }, h("span", { class: "quiz-file-name", "data-media-name": "" }, name), h("span", { class: "quiz-hint", "data-media-facts": "" }, facts(context)));
  const actions = h("div", { class: "quiz-file-actions" }, replace, remove);
  if (files.canCut && type !== "image") {
    const cut = h("button", { type: "button", class: "button quiz-button", "data-media-cut": "" }, icon("cut", 18), h("span", {}, t("media.cut")));
    cut.addEventListener("click", () => { fix(null); });
    actions.prepend(cut);
  }
  if (files.sharedWith > 0) lines.append(h("span", { class: "quiz-hint" }, t("media.shared", { count: files.sharedWith })));
  return h("div", { class: "quiz-file", "data-media-file": "" }, h("span", { class: "quiz-file-thumb", "aria-hidden": "true" }, thumb), lines, actions);
}

/** No file yet: one wide button and what is accepted. */
function empty({ t, lang, files }: KindEditorContext, type: MediaType, choose: () => void): HTMLElement {
  const button = h("button", { type: "button", class: "quiz-drop-button", "data-media-choose": "", "data-focus": "media" },
    h("span", { class: "quiz-drop-mark", "aria-hidden": "true" }, icon(MARKS[type], 28)),
    h("span", { class: "quiz-drop-words" }, t(`media.choose.${type}`)),
    h("span", { class: "quiz-hint" }, t(`media.accepts.${type}`, { limit: bytesText(MEDIA_RULES[type].maxBytes, lang) })),
    h("span", { class: "quiz-hint quiz-wide-only" }, t("media.drop")));
  if (files.canCut && type !== "image") button.append(h("span", { class: "quiz-hint", "data-media-cut-hint": "" }, t("media.cutHint")));
  button.addEventListener("click", choose);
  return button;
}

/** A dragged or pasted item is ours only when it is a file. */
function fileOf(data: DataTransfer | null): File | undefined {
  return [...(data?.files ?? [])][0];
}

/**
 * Draws the file part of the editor.
 * @param context - the question, its file and how to change it
 * @returns the part, or `null` for a kind without a file
 */
export function mediaPicker(context: KindEditorContext): HTMLElement | null {
  const { files, t, signal } = context;
  const type = files.type;
  if (type === null) return null;
  const problem = h("p", { class: "quiz-field-error", role: "alert", "data-media-error": "" });
  problem.hidden = true;
  const busy = h("p", { class: "quiz-hint", role: "status", "data-media-busy": "" }, t("media.busy"));
  busy.hidden = true;
  const box = h("div", { class: "quiz-drop", "data-media-picker": type, "data-tone": type });
  // A file that must be cut and was not yet: the way on is the accented button under the message.
  const fixButton = h("button", { type: "button", class: "button button--primary quiz-drop-fix", "data-media-fix": "" }, icon("cut", 18), h("span", {}, t("cut.start")));
  fixButton.hidden = true;
  let pending: File | null = null;
  const work = (job: Promise<string | null>, waiting: File | null): void => {
    if (box.hasAttribute("aria-busy")) return;
    box.setAttribute("aria-busy", "true");
    busy.hidden = false;
    problem.hidden = true;
    fixButton.hidden = true;
    void job.catch(() => t("media.failed")).then((message) => {
      box.removeAttribute("aria-busy");
      busy.hidden = true;
      if (message === null) return;
      problem.textContent = message;
      problem.hidden = false;
      pending = waiting;
      fixButton.hidden = waiting === null;
      if (waiting !== null) fixButton.focus();
    });
  };
  const fix = (file: File | null): void => { work(files.cut(file), file); };
  const take = (file: File): void => {
    if (files.needsCut(file)) fix(file);
    else work(files.pick(file), null);
  };
  fixButton.addEventListener("click", () => { if (pending) fix(pending); });
  const input = fileInput(type, files.canCut, take);
  const choose = (): void => { input.click(); };
  box.append(files.entry ? current(context, type, choose, fix) : empty(context, type, choose), input, busy, problem, fixButton);
  box.addEventListener("dragover", (event) => {
    event.preventDefault();
    box.setAttribute("data-over", "");
  });
  for (const name of ["dragleave", "dragend", "drop"]) box.addEventListener(name, () => { box.removeAttribute("data-over"); });
  box.addEventListener("drop", (event) => {
    event.preventDefault();
    const file = fileOf(event.dataTransfer);
    if (file) take(file);
  });
  // A picture copied elsewhere and pasted anywhere in the editor; text pasted into a field is left alone.
  document.addEventListener("paste", (event) => {
    const file = fileOf(event.clipboardData);
    if (!file || !box.isConnected) return;
    event.preventDefault();
    take(file);
  }, { signal });
  return h("div", { class: "quiz-group" }, h("span", { class: "quiz-label" }, t(`media.label.${type}`)), box);
}
