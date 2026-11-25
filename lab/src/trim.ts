// The trim bar: the clip along one track (frames or loudness), a handle at each end of the part to
// keep, the rest dimmed, a playhead, and Play that plays only that part — the pattern of the phone
// galleries' trimmers. Dragging a handle shows the frame it is on; a tap on the track moves the playhead.
import { button, el } from "./dom.ts";
import { drawStrip } from "./strip.ts";
import { clock, words } from "./text.ts";

/** The chosen part and its controls. */
export interface Trim {
  readonly element: HTMLElement;
  readonly start: () => number;
  readonly end: () => number;
}

/** The least length of a cut, in seconds. */
const MIN_LENGTH = 0.5;

interface State {
  duration: number;
  from: number;
  to: number;
}

interface Bar {
  readonly track: HTMLElement;
  readonly handles: Readonly<Record<"from" | "to", HTMLElement>>;
  readonly label: HTMLElement;
}

const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));

/** Moves one end; the two never come closer than the least length. */
function move(state: State, end: "from" | "to", seconds: number): void {
  if (end === "from") state.from = clamp(seconds, 0, Math.max(0, state.to - MIN_LENGTH));
  else state.to = clamp(seconds, Math.min(state.duration, state.from + MIN_LENGTH), state.duration);
}

function draw(bar: Bar, state: State, at: number): void {
  const share = (seconds: number): string => String(state.duration > 0 ? seconds / state.duration : 0);
  bar.track.style.setProperty("--from", share(state.from));
  bar.track.style.setProperty("--to", share(state.to));
  bar.track.style.setProperty("--at", share(clamp(at, 0, state.duration)));
  for (const end of ["from", "to"] as const) {
    bar.handles[end].setAttribute("aria-valuemax", state.duration.toFixed(1));
    bar.handles[end].setAttribute("aria-valuenow", state[end].toFixed(1));
    bar.handles[end].setAttribute("aria-valuetext", clock(state[end]));
  }
  bar.label.textContent = `${clock(state.from)} – ${clock(state.to)} · ${words.length} ${clock(state.to - state.from)}`;
}

/** The moment under a pointer on the track. */
function momentAt(track: HTMLElement, duration: number, clientX: number): number {
  const box = track.getBoundingClientRect();
  return clamp((clientX - box.left) / Math.max(1, box.width), 0, 1) * duration;
}

function handle(end: "from" | "to", label: string): HTMLElement {
  return el("div", { class: "lab-handle", role: "slider", tabindex: "0", "aria-label": label, "aria-valuemin": "0", "data-handle": end });
}

/** Dragging: a handle moves its end, anywhere else on the track moves the playhead. */
function listenPointer(bar: Bar, state: State, media: HTMLMediaElement, redraw: () => void): void {
  let dragging: "from" | "to" | "playhead" | null = null;
  const follow = (event: PointerEvent): void => {
    if (dragging === null) return;
    const moment = momentAt(bar.track, state.duration, event.clientX);
    if (dragging !== "playhead") move(state, dragging, moment);
    media.currentTime = dragging === "playhead" ? moment : state[dragging];
    redraw();
  };
  bar.track.addEventListener("pointerdown", (event) => {
    const grabbed = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-handle]") : null;
    dragging = grabbed ? (grabbed.getAttribute("data-handle") as "from" | "to") : "playhead";
    media.pause();
    bar.track.setPointerCapture(event.pointerId);
    grabbed?.focus();
    follow(event);
  });
  bar.track.addEventListener("pointermove", follow);
  for (const name of ["pointerup", "pointercancel"] as const) bar.track.addEventListener(name, () => { dragging = null; });
}

/** Arrow keys move a focused handle by 0.1 s (1 s with Shift); Home and End go to the clip's ends. */
function listenKeys(bar: Bar, state: State, media: HTMLMediaElement, redraw: () => void): void {
  for (const end of ["from", "to"] as const) {
    bar.handles[end].addEventListener("keydown", (event) => {
      const by = event.shiftKey ? 1 : 0.1;
      const steps: Readonly<Record<string, number>> = { ArrowLeft: state[end] - by, ArrowRight: state[end] + by, Home: 0, End: state.duration };
      const target = steps[event.key];
      if (target === undefined) return;
      event.preventDefault();
      move(state, end, target);
      media.currentTime = state[end];
      redraw();
    });
  }
}

/** Play plays the kept part only: from its start (or where the playhead is inside it) to its end. */
function createPlay(state: State, media: HTMLMediaElement): HTMLButtonElement {
  const play = button(words.playPart, () => {
    if (!media.paused) {
      media.pause();
      return;
    }
    if (media.currentTime < state.from || media.currentTime >= state.to - 0.05) media.currentTime = state.from;
    void media.play().catch(() => undefined);
  }, { "data-play-part": "" });
  media.addEventListener("click", () => { play.click(); }); // a tap on the picture does the same
  media.addEventListener("play", () => { play.textContent = words.pause; });
  media.addEventListener("pause", () => { play.textContent = words.playPart; });
  return play;
}

/**
 * Creates the trim bar of a clip.
 * @param media - the clip's player (the bar is its only control)
 * @param file - the clip, for the frames or the loudness along the track
 * @param isVideo - whether the track shows frames
 */
export function createTrim(media: HTMLMediaElement, file: Blob, isVideo: boolean): Trim {
  const state: State = { duration: 0, from: 0, to: 0 };
  const canvas = el("canvas", { class: "lab-strip" });
  const handles = { from: handle("from", words.from), to: handle("to", words.to) };
  const track = el("div", { class: "lab-track", "data-track": "" }, canvas, el("div", { class: "lab-dim lab-dim-before" }), el("div", { class: "lab-dim lab-dim-after" }),
    el("div", { class: "lab-kept" }), el("div", { class: "lab-playhead" }), handles.from, handles.to);
  const bar: Bar = { track, handles, label: el("p", { class: "lab-note", "data-trim-label": "" }) };
  const redraw = (): void => { draw(bar, state, media.currentTime); };
  const strips = new AbortController();
  media.addEventListener("loadedmetadata", () => {
    state.duration = Number.isFinite(media.duration) ? media.duration : 0;
    state.to = state.duration;
    redraw();
    const box = track.getBoundingClientRect();
    canvas.width = Math.round(box.width * window.devicePixelRatio);
    canvas.height = Math.round(box.height * window.devicePixelRatio);
    void drawStrip(file, canvas, isVideo, strips.signal);
  }, { once: true });
  // While it plays the playhead follows every frame, and the kept part's end stops it.
  const tick = (): void => {
    if (media.currentTime >= state.to && !media.paused) {
      media.pause();
      media.currentTime = state.from;
    }
    redraw();
    if (!media.paused) requestAnimationFrame(tick);
  };
  media.addEventListener("play", tick);
  media.addEventListener("seeked", redraw);
  listenPointer(bar, state, media, redraw);
  listenKeys(bar, state, media, redraw);
  const element = el("div", { class: "lab-trim" }, track, el("div", { class: "lab-row" }, createPlay(state, media), bar.label));
  return { element, start: () => state.from, end: () => state.to };
}
