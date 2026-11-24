// A picked audio or video file on its way into a quiz (SPEC §5; lazy, with import.ts). It is kept
// as it is — nothing is re-encoded — but first it is tried: loaded into an element that is not on
// the page until the browser knows its length (and, for a video, its picture). A file the browser
// cannot play here is refused before anything is stored. A video also gives one frame as its small
// still, for thumbnails; a browser that will not show a frame without playing (iPhone) gives none,
// and the file is taken all the same.
import { stillFrom, typed, type Prepared } from "./picture.ts";

/** How long the browser gets to read a file's length. */
const LOAD_TIMEOUT_MS = 10_000;
/** How long it gets to show one frame of a video. */
const FRAME_TIMEOUT_MS = 4000;

/** Resolves when the element fires one of the events, rejects on `error` or after the time. */
function once(element: HTMLMediaElement, names: readonly string[], ms: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const finish = (run: () => void) => (): void => {
      window.clearTimeout(timer);
      controller.abort();
      run();
    };
    const timer = window.setTimeout(finish(() => { reject(new Error("timeout")); }), ms);
    for (const name of names) element.addEventListener(name, finish(resolve), { signal: controller.signal });
    element.addEventListener("error", finish(() => { reject(new Error("media error")); }), { signal: controller.signal });
  });
}

/** One frame of a loaded video as a small still; `undefined` when the browser gives none in time. */
async function frameOf(video: HTMLVideoElement): Promise<string | undefined> {
  try {
    const shown = once(video, ["seeked"], FRAME_TIMEOUT_MS);
    // A little in: the very first frame is often black.
    video.currentTime = Math.min(1, video.duration / 3);
    await shown;
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) await once(video, ["loadeddata", "canplay"], FRAME_TIMEOUT_MS);
    return stillFrom(video, video.videoWidth, video.videoHeight);
  } catch {
    return undefined;
  }
}

/**
 * Tries a picked clip and reads what is known of it.
 * @param file - the file as picked
 * @param mime - its type (already checked against the accepted ones)
 * @param tag - the element that plays it
 * @returns the file with its length (and a video's size and still), or `null` when it cannot be played here
 */
export async function prepareClip(file: Blob, mime: string, tag: "audio" | "video"): Promise<Prepared | null> {
  const blob = typed(file, mime);
  const url = URL.createObjectURL(blob);
  const element = document.createElement(tag);
  element.muted = true;
  element.preload = "auto";
  if (element instanceof HTMLVideoElement) element.playsInline = true;
  try {
    const loaded = once(element, ["loadedmetadata"], LOAD_TIMEOUT_MS);
    element.src = url;
    await loaded;
    const seconds = Math.round(element.duration * 100) / 100;
    if (!Number.isFinite(seconds) || seconds <= 0) return null;
    if (!(element instanceof HTMLVideoElement)) return { blob, seconds };
    // An "MP4" without a picture the browser can show is not a video for the stage.
    if (element.videoWidth === 0 || element.videoHeight === 0) return null;
    const poster = await frameOf(element);
    return { blob, seconds, width: element.videoWidth, height: element.videoHeight, ...(poster === undefined ? {} : { poster }) };
  } catch {
    return null;
  } finally {
    element.removeAttribute("src");
    element.load();
    URL.revokeObjectURL(url);
  }
}
