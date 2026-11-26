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
function fileInput(types: readonly MediaType[], canCut: boolean, hook: string, onFile: (file: File) => void): HTMLInputElement {
  // Where a clip can be cut, any clip can be picked (a phone's .mov, a long recording): it is cut on the way in.
  const accept = types.map((type) => (canCut && type !== "image" ? `${type}/*,${ENDINGS[type]}` : `${MEDIA_RULES[type].mimes.join(",")},${ENDINGS[type]}`)).join(",");
  const input = h("input", { type: "file", class: "visually-hidden", accept, tabindex: "-1", "aria-hidden": "true", [hook]: "" });
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

/** A picker's place: the question's own file or the picture with its answer — its hooks (`data-media-*` / `data-answer-*`) and its focus name. */
interface Slot {
  readonly isAnswer: boolean;
  readonly focus: string;
  readonly hook: (name: string) => string;
}

/** The file the question has: its still or mark, its name and facts, Replace and Remove. */
function current(context: KindEditorContext, type: MediaType, choose: () => void, fix: (file: File | null) => void, slot: Slot): HTMLElement {
  const { focus, hook } = slot;
  const { files, t } = context;
  const name = files.entry?.name ?? "";
  const thumb = files.still === null ? h("span", { class: "quiz-file-mark" }, icon(MARKS[type], 24)) : h("img", { class: "quiz-file-still", src: files.still, alt: "" });
  const replace = h("button", { type: "button", class: "button quiz-button", [hook("replace")]: "", "data-focus": focus }, icon("replace", 18), h("span", {}, t("media.replace")));
  replace.addEventListener("click", choose);
  const remove = h("button", { type: "button", class: "button quiz-button", [hook("remove")]: "" }, icon("trash", 18), h("span", {}, t("media.remove")));
  remove.addEventListener("click", () => { files.remove(); });
  const lines = h("div", { class: "quiz-file-lines" }, h("span", { class: "quiz-file-name", [hook("name")]: "" }, name), h("span", { class: "quiz-hint", [hook("facts")]: "" }, facts(context)));
  const actions = h("div", { class: "quiz-file-actions" }, replace, remove);
  if (files.canCut && type !== "image") {
    const cut = h("button", { type: "button", class: "button quiz-button", "data-media-cut": "" }, icon("cut", 18), h("span", {}, t("media.cut")));
    cut.addEventListener("click", () => { fix(null); });
    actions.prepend(cut);
  }
  if (files.sharedWith > 0) lines.append(h("span", { class: "quiz-hint" }, t("media.shared", { count: files.sharedWith })));
  return h("div", { class: "quiz-file", [hook("file")]: "" }, h("span", { class: "quiz-file-thumb", "aria-hidden": "true" }, thumb), lines, actions);
}

/** No file yet: one wide button and what is accepted. */
function empty({ t, lang, files }: KindEditorContext, type: MediaType, choose: () => void, { focus, hook, isAnswer }: Slot): HTMLElement {
  const button = h("button", { type: "button", class: "quiz-drop-button", [hook("choose")]: "", "data-focus": focus },
    h("span", { class: "quiz-drop-mark", "aria-hidden": "true" }, icon(MARKS[type], 28)),
    h("span", { class: "quiz-drop-words" }, isAnswer ? t("media.answerChoose") : t(`media.choose.${type}`)),
    h("span", { class: "quiz-hint" }, isAnswer ? t("media.answerAccepts") : t(`media.accepts.${type}`, { limit: bytesText(MEDIA_RULES[type].maxBytes, lang) })),
    h("span", { class: "quiz-hint quiz-wide-only" }, t("media.drop")));
  if (files.canCut && (type !== "image" || isAnswer)) button.append(h("span", { class: "quiz-hint", "data-media-cut-hint": "" }, t("media.cutHint")));
  button.addEventListener("click", choose);
  return button;
}

/** A dragged or pasted item is ours only when it is a file. */
function fileOf(data: DataTransfer | null): File | undefined {
  return [...(data?.files ?? [])][0];
}

/** A file that could not be added for a reason nobody foresaw: said plainly, and kept in the console for the reports from phones. */
function failed({ t }: KindEditorContext, error: unknown): string {
  console.error("Quizzard: the file could not be added", error);
  return t("media.failed");
}

/**
 * Draws the file part of the editor.
 * @param context - the question, its file and how to change it
 * @param slot - the question's own file, or the picture shown with its answer (its own hooks and words)
 * @returns the part, or `null` for a kind without a file
 */
export function mediaPicker(context: KindEditorContext, slot: "question" | "answer" = "question"): HTMLElement | null {
  const { files, t, signal } = context;
  const type = files.type;
  if (type === null) return null;
  const isAnswer = slot === "answer";
  const place: Slot = { isAnswer, focus: isAnswer ? "answer-media" : "media", hook: (name) => `data-${isAnswer ? "answer" : "media"}-${name}` };
  const problem = h("p", { class: "quiz-field-error", role: "alert", [place.hook("error")]: "" });
  problem.hidden = true;
  const busy = h("p", { class: "quiz-hint", role: "status", [place.hook("busy")]: "" }, t("media.busy"));
  busy.hidden = true;
  const box = h("div", { class: "quiz-drop", [place.hook("picker")]: type, "data-tone": type });
  // A file that must be cut and was not yet: the way on is the accented button under the message.
  const fixButton = h("button", { type: "button", class: "button button--primary quiz-drop-fix", [place.hook("fix")]: "" }, icon("cut", 18), h("span", {}, t("cut.start")));
  fixButton.hidden = true;
  let pending: File | null = null;
  const work = (job: Promise<string | null>, waiting: File | null): void => {
    if (box.hasAttribute("aria-busy")) return;
    box.setAttribute("aria-busy", "true");
    busy.hidden = false;
    problem.hidden = true;
    fixButton.hidden = true;
    void job.catch((error: unknown) => failed(context, error)).then((message) => {
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
  const fix = (file: File | null): void => { work(files.cut(file, signal), file); };
  const take = (file: File): void => {
    if (files.needsCut(file)) fix(file);
    else work(files.pick(file), null);
  };
  fixButton.addEventListener("click", () => { if (pending) fix(pending); });
  const input = fileInput(files.anyType === true ? ["image", "audio", "video"] : [type], files.canCut, place.hook("input"), take);
  const choose = (): void => { input.click(); };
  box.append(files.entry ? current(context, type, choose, fix, place) : empty(context, type, choose, place), input, busy, problem, fixButton);
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
    // A pasted picture belongs to the question's own picker, not to the answer's.
    if (!file || !box.isConnected || isAnswer) return;
    event.preventDefault();
    take(file);
  }, { signal });
  if (isAnswer) return h("div", { class: "quiz-group" }, h("span", { class: "quiz-label" }, t("media.answerLabel")), box, h("p", { class: "quiz-hint" }, t("media.answerHint")));
  return h("div", { class: "quiz-group" }, h("span", { class: "quiz-label" }, t(`media.label.${type}`)), box);
}
