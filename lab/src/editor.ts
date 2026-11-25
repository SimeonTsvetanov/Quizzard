// One chosen file: its player, the part to keep, the size and quality, "Cut and shrink", the result
// beside the original and a report to copy.
import { cutClip, encoders, type CutResult, type Level } from "./convert.ts";
import { button, choice, el } from "./dom.ts";
import { createRange } from "./range.ts";
import { clock, megabytes, words } from "./text.ts";

interface Parts {
  readonly file: File;
  readonly isVideo: boolean;
  readonly range: ReturnType<typeof createRange>;
  readonly size: HTMLSelectElement;
  readonly level: HTMLSelectElement;
  readonly out: HTMLElement;
}

function player(isVideo: boolean, source: Blob): HTMLMediaElement {
  const media = isVideo ? el("video", { controls: "", playsinline: "", preload: "metadata" }) : el("audio", { controls: "", preload: "metadata" });
  media.src = URL.createObjectURL(source);
  return media;
}

/** The lines of the report: what was asked, on what, and how it ended. */
async function report(parts: Parts, outcome: string): Promise<string> {
  return [
    `Quizzard lab — ${new Date().toISOString()}`,
    navigator.userAgent,
    `encoders: ${await encoders()}`,
    `file: ${parts.file.type || "?"} · ${megabytes(parts.file.size)}`,
    `cut: ${clock(parts.range.start())} – ${clock(parts.range.end())} · size ${parts.size.value} · quality ${parts.level.value}`,
    outcome,
  ].join("\n");
}

function showResult(parts: Parts, result: CutResult, text: string): void {
  const saved = Math.round((1 - result.blob.size / parts.file.size) * 100);
  const summary = `${megabytes(parts.file.size)} → ${megabytes(result.blob.size)} (${saved >= 0 ? "−" : "+"}${String(Math.abs(saved))} %) · ${(result.ms / 1000).toFixed(1)} s · ${result.container} (${result.codecs})`;
  const mp4 = parts.isVideo ? "mp4" : "m4a";
  const link = el("a", { class: "lab-button", download: `cut.${result.container === "MP4" ? mp4 : "webm"}`, href: URL.createObjectURL(result.blob), "data-download": "" }, words.download);
  parts.out.replaceChildren(el("h2", {}, words.result), el("p", { class: "lab-summary", "data-summary": "" }, summary), player(parts.isVideo, result.blob), link, reportBox(text));
}

function reportBox(text: string): HTMLElement {
  const copy = button(words.copy, () => {
    void navigator.clipboard.writeText(text).then(() => { copy.textContent = words.copied; }).catch(() => undefined);
  }, { "data-copy": "" });
  return el("details", { class: "lab-report", open: "" }, el("summary", {}, words.report), el("pre", { "data-report": "" }, text), copy);
}

/** Runs the cut with a progress bar and a Cancel, then shows the result or what went wrong. */
async function run(parts: Parts, start: HTMLButtonElement): Promise<void> {
  const controller = new AbortController();
  const bar = el("progress", { max: "1", value: "0" });
  start.disabled = true;
  parts.out.replaceChildren(el("p", {}, words.working), bar, button(words.cancel, () => { controller.abort(); }));
  try {
    const result = await cutClip({
      file: parts.file, isVideo: parts.isVideo, start: parts.range.start(), end: parts.range.end(),
      maxHeight: parts.size.value === "original" ? null : Number(parts.size.value), level: parts.level.value as Level,
      onProgress: (fraction) => { bar.value = fraction; }, signal: controller.signal,
    });
    const dropped = result.dropped.length > 0 ? ` · dropped: ${result.dropped.join(", ")}` : "";
    showResult(parts, result, await report(parts, `ok: ${result.container} (${result.codecs}) · ${megabytes(result.blob.size)} · ${(result.ms / 1000).toFixed(1)} s${dropped}`));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    parts.out.replaceChildren(el("h2", {}, words.failed), el("p", { class: "lab-note" }, controller.signal.aborted ? words.cancel : words.unsupported), reportBox(await report(parts, `failed: ${message}`)));
  } finally {
    start.disabled = false;
  }
}

/**
 * Builds the editor of one file.
 * @param file - the chosen video or audio file
 */
export function createEditor(file: File): HTMLElement {
  const isVideo = file.type.startsWith("video/");
  const media = player(isVideo, file);
  const range = createRange(media);
  const size = choice(words.size, [["original", words.original], ["1080", "1080p"], ["720", "720p"], ["480", "480p"]], "720");
  const level = choice(words.quality, [["high", words.high], ["medium", words.medium], ["low", words.low]], "medium");
  const out = el("section", { class: "lab-out", "aria-live": "polite" });
  const parts: Parts = { file, isVideo, range, size: size.select, level: level.select, out };
  const start = button(words.cut, () => { void run(parts, start); }, { class: "lab-primary", "data-cut": "" });
  size.field.hidden = !isVideo;
  return el("div", { class: "lab-editor" },
    el("p", { class: "lab-note", "data-source": "" }, `${file.name} · ${megabytes(file.size)}`),
    media, range.element, el("div", { class: "lab-row" }, size.field, level.field), start, out);
}
