// The cut window (lazy: loaded when a clip is to be cut — Mediabunny comes with it): the clip, the
// trim bar, how small to make it, and "Cut and shrink" as the one accented button. It answers with
// the new file, or `null` when it was closed. A clip that is too big for a quiz says so at the top;
// one that still is after the cut says so and stays open (Moni 2026-11-25).
import "../../styles/sheet.css";
import "../../styles/cut.css";
import type { Lang } from "../../contract.ts";
import { h } from "../../dom/h.ts";
import { icon } from "../../dom/icons.ts";
import { bytesText } from "../../format.ts";
import type { Translate } from "../../i18n/translate.ts";
import { canRead, canWriteMp4, clipSeconds, cutClip, type CutLevel } from "./convert.ts";
import { createTrim, type Trim } from "./trim.ts";

/** Inputs of {@link openCutDialog}. */
export interface CutDialogOptions {
  /** The tool's element: the window lives in it. */
  readonly host: HTMLElement;
  readonly file: File;
  readonly type: "audio" | "video";
  readonly t: Translate;
  readonly lang: Lang;
  /** The largest clip of this type a quiz takes, in bytes. */
  readonly maxBytes: number;
  /** Whether the file can be used as it is: then cutting is an offer, not a must. */
  readonly fits: boolean;
  /** Ends when the editor is left or drawn again: the window closes with it, and a running cut stops. */
  readonly signal: AbortSignal;
}

interface Parts {
  readonly options: CutDialogOptions;
  readonly trim: Trim;
  readonly size: HTMLSelectElement;
  readonly level: HTMLSelectElement;
  readonly problem: HTMLElement;
  readonly bar: HTMLProgressElement;
  readonly start: HTMLButtonElement;
}

function choice(label: string, options: readonly (readonly [string, string])[], selected: string, hook: string): { readonly field: HTMLElement; readonly select: HTMLSelectElement } {
  const select = h("select", { class: "quiz-input quiz-select", [hook]: "" }, ...options.map(([value, text]) => h("option", { value }, text)));
  select.value = selected;
  return { field: h("label", { class: "quiz-cut-field" }, h("span", { class: "quiz-label" }, label), select), select };
}

/** The new file's name: the picked one's, with the ending of what it is now. */
function cutName(name: string, type: "audio" | "video"): string {
  return `${name.replace(/\.[a-z0-9]{1,5}$/i, "")}.${type === "video" ? "mp4" : "m4a"}`;
}

/** Runs the cut; the new file, or `null` with the reason shown in the window. */
async function run(parts: Parts, signal: AbortSignal): Promise<File | null> {
  const { options, problem, bar, start } = parts;
  const { t, file, type } = options;
  const say = (text: string): null => {
    problem.textContent = text;
    problem.hidden = text === "";
    return null;
  };
  say("");
  start.disabled = true;
  bar.hidden = false;
  bar.value = 0;
  try {
    const result = await cutClip({
      file, isVideo: type === "video", start: parts.trim.start(), end: parts.trim.end(),
      maxHeight: parts.size.value === "original" ? null : Number(parts.size.value), level: parts.level.value as CutLevel,
      maxBytes: options.maxBytes, onProgress: (fraction) => { bar.value = fraction; }, signal,
    });
    if (result.ok) return new File([result.blob], cutName(file.name, type), { type: result.blob.type });
    if (result.reason === "too-big") return say(t("cut.stillTooBig", { limit: bytesText(options.maxBytes, options.lang) }));
    return say(result.reason === "unsupported" ? t("cut.unsupported") : "");
  } catch (error) {
    // Kept for the reports from phones: the message alone does not say what the browser refused.
    if (!signal.aborted) console.error("Quizzard: the clip could not be cut", error);
    return say(signal.aborted ? "" : t("cut.failed"));
  } finally {
    start.disabled = false;
    bar.hidden = true;
  }
}

function player(type: "audio" | "video", url: string): HTMLMediaElement {
  const media = type === "video" ? h("video", { class: "quiz-cut-media", playsinline: "", preload: "metadata" }) : h("audio", { preload: "metadata" });
  media.src = url;
  return media;
}

/**
 * Opens the cut window for a clip.
 * @param options - the clip, its type, the limit and whether it already fits
 * @returns the new file; `null` when the window was closed without one; `"unreadable"` when the file
 * is no clip this browser can read, or the browser cannot write what a quiz carries (no window was shown)
 */
export async function openCutDialog(options: CutDialogOptions): Promise<File | null | "unreadable"> {
  const isVideo = options.type === "video";
  if (!(await canWriteMp4(isVideo)) || !(await canRead(options.file, isVideo))) return "unreadable";
  if (options.signal.aborted) return null;
  return show(options);
}

function show(options: CutDialogOptions): Promise<File | null> {
  const { t, file, type, lang, host } = options;
  const url = URL.createObjectURL(file);
  const media = player(type, url);
  const trim = createTrim(media, file, type === "video", t, clipSeconds(file));
  const size = choice(t("cut.size"), [["original", t("cut.asItIs")], ["1080", "1080p"], ["720", "720p"], ["480", "480p"]], "720", "data-cut-size");
  const level = choice(t("cut.quality"), [["high", t("cut.high")], ["medium", t("cut.medium")], ["low", t("cut.low")]], "medium", "data-cut-quality");
  size.field.hidden = type !== "video";
  const limit = bytesText(options.maxBytes, lang);
  const note = h("p", { class: "quiz-cut-note", "data-cut-note": options.fits ? "fits" : "must" }, t(options.fits ? "cut.fits" : "cut.must", { size: bytesText(file.size, lang), limit }));
  const problem = h("p", { class: "quiz-field-error", role: "alert", "data-cut-error": "" });
  problem.hidden = true;
  const bar = h("progress", { class: "quiz-cut-progress", max: "1", value: "0", "aria-label": t("cut.working") });
  bar.hidden = true;
  const start = h("button", { type: "button", class: "button button--primary", "data-cut-start": "" }, icon("cut", 18), h("span", {}, t("cut.start")));
  // Nothing can be cut until the clip's length is known.
  start.disabled = true;
  void trim.ready.then(() => { start.disabled = false; });
  const cancel = h("button", { type: "button", class: "button quiz-button", "data-cut-cancel": "" }, t("cut.cancel"));
  const heading = h("h2", { class: "quiz-sheet-title", id: "quiz-cut-title" }, t(`cut.title.${type}`));
  const dialog = h("dialog", { class: "quiz-sheet quiz-cut", "aria-labelledby": heading.id, "data-cut": type },
    h("div", { class: "quiz-sheet-head" }, heading), h("div", { class: "quiz-cut-body" }, note, media, trim.element, h("div", { class: "quiz-cut-row" }, size.field, level.field), bar, problem),
    h("div", { class: "quiz-sheet-actions" }, cancel, start));
  const parts: Parts = { options, trim, size: size.select, level: level.select, problem, bar, start };
  const working = new AbortController();
  return new Promise((resolve) => {
    let answer: File | null = null;
    start.addEventListener("click", () => {
      void run(parts, working.signal).then((cut) => {
        if (cut === null) return;
        answer = cut;
        dialog.close();
      });
    });
    cancel.addEventListener("click", () => { dialog.close(); });
    // The editor went away under the window (Back, another screen): it closes, and a running cut stops with it.
    options.signal.addEventListener("abort", () => { dialog.close(); }, { once: true });
    dialog.addEventListener("close", () => {
      working.abort();
      trim.destroy();
      media.pause();
      media.removeAttribute("src");
      URL.revokeObjectURL(url);
      dialog.remove();
      resolve(answer);
    });
    host.append(dialog);
    dialog.showModal();
    start.focus();
  });
}
