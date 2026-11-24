// Kinds `audio` and `video` on the slide: a clip with the slide's own controls — a large play/pause,
// its progress, the time and "from the start" — never the browser's default ones. A still (no
// `view.media`: thumbnails, the host's small previews) is the same face with nothing behind it: no
// media element is made, so fifty thumbnails cost nothing. Live, the buttons only ask; whoever owns
// the slide (the game, the creator's preview) answers through `sync`, and this module makes the
// element follow: play, pause, rewind. A browser that refuses to play without a tap in this window
// is reported (`blocked`) and gets a "Tap to play" button, which plays inside that tap.
import { type MediaEntry, type Playback, type Question, clockText } from "@simeonts/quizzard-quiz-core/play";
import { h, releaseAfterPointer } from "../h.ts";
import { icon, type StageIcon } from "../icons.ts";
import { type MediaLabels, type SlideKind, type SlideMedia, type SlideView, layoutOf, stillOf, zoomFace } from "../registry.ts";
import { missingMedia, shapedImage } from "./picture.ts";

/** How many bars the audio clip's level display has. */
const BARS = 28;
/** A redraw in the middle of a clip continues it when the game is at least this far in. */
const RESUME_AFTER_MS = 500;

/** What makes one clip kind: its element and what stands above the controls. */
interface ClipFace {
  readonly name: "audio" | "video";
  /** The mark of the tile shown where the file is missing. */
  readonly mark: StageIcon;
  /** `data-layout` of the clip on the slide: an audio bar wants the whole width, a video stands by its shape. */
  layout(entry: MediaEntry | undefined): Readonly<Record<string, string>>;
  /** Whether the clip has a picture that can fill the slide. */
  readonly canZoom: boolean;
  /** The part above the controls: the video's picture, the audio's bars. */
  visual(element: HTMLMediaElement | null, poster: string | null): HTMLElement;
  create(): HTMLMediaElement;
}

/** A height between 0.12 and 1 for bar `index` at moment `beat`: the same every time, no randomness kept. */
export function barLevel(index: number, beat: number): number {
  const wave = Math.sin(index * 12.9898 + beat * 78.233) * 43758.5453;
  return 0.12 + 0.88 * (wave - Math.floor(wave));
}

function setBars(bars: HTMLElement, beat: number | null): void {
  [...bars.children].forEach((bar, index) => {
    // At rest the bars draw one calm arc; while playing they follow the clip's time.
    const level = beat === null ? 0.18 + 0.3 * Math.sin((index / (BARS - 1)) * Math.PI) : barLevel(index, beat);
    (bar as HTMLElement).style.setProperty("--quiz-bar", level.toFixed(3));
  });
}

const audioFace: ClipFace = {
  name: "audio",
  mark: "audio",
  layout: () => ({ "data-layout": "wide" }),
  canZoom: false,
  create: () => h("audio", { preload: "metadata" }),
  visual(element) {
    const bars = h("div", { class: "quiz-slide-bars", "aria-hidden": "true" }, ...Array.from({ length: BARS }, () => h("span", {})));
    setBars(bars, null);
    // Driven by the clip's own clock: four steps a second while it plays, still when it does not.
    element?.addEventListener("timeupdate", () => { setBars(bars, element.paused ? null : Math.floor(element.currentTime * 4)); });
    for (const name of ["pause", "ended"]) element?.addEventListener(name, () => { setBars(bars, null); });
    return bars;
  },
};

const videoFace: ClipFace = {
  name: "video",
  mark: "play",
  layout: layoutOf,
  canZoom: true,
  create: () => h("video", { class: "quiz-slide-video", preload: "metadata", playsinline: "", "data-loading": "", "data-slide-video": "" }),
  visual(element, poster) {
    if (element instanceof HTMLVideoElement) {
      if (poster !== null) element.poster = poster;
      element.addEventListener("loadedmetadata", () => {
        if (element.videoWidth === 0 || element.videoHeight === 0) return;
        element.style.setProperty("--quiz-ratio", String(element.videoWidth / element.videoHeight));
        element.removeAttribute("data-loading");
      });
      // The video in a box of its own size: the zoom button stands in that box's corner.
      return h("div", { class: "quiz-slide-frame" }, h("div", { class: "quiz-slide-shot" }, element));
    }
    const still = poster === null ? h("span", { class: "quiz-slide-noposter" }, icon("play", 16)) : shapedImage(poster, "data-slide-poster");
    return h("div", { class: "quiz-slide-frame" }, still);
  },
};

/** The controls under a clip and how to bring them up to date. */
interface Controls {
  readonly element: HTMLElement;
  readonly toggle: HTMLElement;
  readonly restart: HTMLElement;
  paint(seconds: number, total: number): void;
  face(isPlaying: boolean): void;
}

function controls(labels: MediaLabels, isLive: boolean, total: number): Controls {
  const tag = isLive ? "button" : "span";
  const toggle = h(tag, { class: "quiz-slide-clip-play", ...(isLive ? { type: "button", "aria-label": labels.play, title: labels.play, "data-clip-toggle": "" } : {}) }, icon("play", 16));
  const restart = h(tag, { class: "quiz-slide-clip-restart", ...(isLive ? { type: "button", "aria-label": labels.restart, title: labels.restart, "data-clip-restart": "" } : {}) }, icon("reset", 16));
  const fill = h("span", { class: "quiz-slide-clip-fill" });
  const time = h("span", { class: "quiz-slide-clip-time", "data-clip-time": "" });
  const paint = (seconds: number, length: number): void => {
    const share = length > 0 ? Math.min(1, Math.max(0, seconds / length)) : 0;
    fill.style.setProperty("--quiz-progress", share.toFixed(4));
    time.textContent = isLive ? `${clockText(seconds)} / ${clockText(length)}` : clockText(length);
  };
  paint(0, total);
  return {
    element: h("div", { class: "quiz-slide-clip-controls" }, toggle, h("span", { class: "quiz-slide-clip-track", "aria-hidden": "true" }, fill), time, restart),
    toggle, restart, paint,
    face(isPlaying) {
      if (!isLive || toggle.getAttribute("aria-label") === (isPlaying ? labels.pause : labels.play)) return;
      toggle.setAttribute("aria-label", isPlaying ? labels.pause : labels.play);
      toggle.title = isPlaying ? labels.pause : labels.play;
      toggle.replaceChildren(icon(isPlaying ? "pause" : "play", 16));
    },
  };
}

/** Makes a live clip follow the game: what `sync` does, and the element's own events. */
function drive(root: HTMLElement, element: HTMLMediaElement, bar: Controls, tap: HTMLElement, media: SlideMedia, zoom: ZoomButton | null): void {
  let seq: number | null = null;
  const start = (): void => {
    // "AbortError" is a pause that overtook the play; only a refusal for lack of a tap is reported.
    element.play().catch((error: unknown) => { if (error instanceof DOMException && error.name === "NotAllowedError") media.command("blocked"); });
  };
  const rewind = (state: Playback): void => {
    const isFirst = seq === null;
    if (seq === state.seq) return;
    seq = state.seq;
    if (!isFirst) element.currentTime = 0;
    else if (state.ms > RESUME_AFTER_MS && state.status !== "ended") element.currentTime = state.ms / 1000;
  };
  element.addEventListener("ended", () => { media.command("ended"); });
  for (const name of ["timeupdate", "loadedmetadata", "seeked"]) element.addEventListener(name, () => { bar.paint(element.currentTime, Number.isFinite(element.duration) ? element.duration : 0); });
  bar.toggle.addEventListener("click", () => { media.command("toggle"); });
  bar.restart.addEventListener("click", () => { media.command("restart"); });
  tap.addEventListener("click", () => {
    void element.play().catch(() => undefined); // inside the tap itself: this is what the browser asked for
    media.command("play");
  });
  media.mount({
    sync(state) {
      rewind(state);
      root.setAttribute("data-status", state.status);
      bar.face(state.status === "playing");
      tap.hidden = state.status !== "blocked";
      zoom?.show(state.zoom);
      if (state.status === "playing" && element.paused) start();
      else if (state.status !== "playing" && state.status !== "blocked" && !element.paused) element.pause();
    },
    destroy() {
      element.pause();
      element.removeAttribute("src");
      element.load();
    },
  });
}

/** A video's zoom button and how to show whether the video fills the slide. */
interface ZoomButton {
  readonly element: HTMLButtonElement;
  show(isZoomed: boolean): void;
}

/**
 * The button in a video's corner that lets it fill the slide — the clip plays on, its controls stay.
 * @param root - the clip: `data-zoom` on it is the zoomed layout
 * @param labels - the words
 * @param media - asks for the zoom
 */
function zoomButton(root: HTMLElement, labels: MediaLabels, media: SlideMedia): ZoomButton {
  const element = h("button", { type: "button", class: "quiz-slide-zoom-mark", ...zoomFace(labels).props }, icon("zoom", 16));
  let isOn = false;
  releaseAfterPointer(element);
  element.addEventListener("click", () => { media.command("zoom"); });
  return {
    element,
    show(isZoomed) {
      if (isZoomed === isOn) return;
      isOn = isZoomed;
      root.toggleAttribute("data-zoom", isZoomed);
      element.setAttribute("aria-pressed", String(isZoomed));
      element.replaceChildren(icon(isZoomed ? "zoomOut" : "zoom", 16));
    },
  };
}

function clipSlide(face: ClipFace): (question: Question, view: SlideView) => HTMLElement {
  return (question, view) => {
    const id = question.media?.id;
    const url = id === undefined ? null : (view.mediaUrl?.(id) ?? null);
    const entry = id === undefined ? undefined : view.entryOf?.(id);
    const poster = stillOf(entry);
    const { media, labels } = view;
    if (id === undefined || (url === null && (media !== undefined || poster === null))) return missingMedia(face.mark, labels.media.missing);
    const element = media && url !== null ? face.create() : null;
    const bar = controls(labels.media, element !== null, entry?.seconds ?? 0);
    const root = h("div", { class: "quiz-slide-clip", "data-clip": face.name, "data-status": "idle", ...face.layout(entry), ...(element ? {} : { "data-still": "" }) }, face.visual(element, poster), bar.element);
    if (!element || !media || url === null) return root;
    const tap = h("button", { type: "button", class: "quiz-slide-clip-tap", "data-clip-tap": "" }, icon("play", 16), h("span", {}, labels.media.tapToPlay));
    tap.hidden = true;
    for (const button of [bar.toggle, bar.restart, tap]) releaseAfterPointer(button as HTMLButtonElement);
    root.append(tap);
    // An audio element has no picture; it still belongs to the slide, so it goes when the slide goes.
    if (element.parentNode === null) root.append(element);
    const zoom = face.canZoom ? zoomButton(root, labels.media, media) : null;
    if (zoom) root.querySelector(".quiz-slide-shot")?.append(zoom.element);
    drive(root, element, bar, tap, media, zoom);
    element.src = url;
    return root;
  };
}

/** Kind `audio`: text and one audio clip. */
export const audioKindSlide: SlideKind = { id: "audio", tone: "audio", parts: { slide: clipSlide(audioFace) } };

/** Kind `video`: text and one video clip. */
export const videoKindSlide: SlideKind = { id: "video", tone: "video", parts: { slide: clipSlide(videoFace) } };
