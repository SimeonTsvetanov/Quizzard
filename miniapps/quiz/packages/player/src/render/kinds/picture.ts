// Kind `picture` on the slide (AC4): the picture stands in the room between the question and the
// options, whole and in its own shape — never stretched, never cropped — whether it is upright, wide
// or a panorama. The frame is a size container and the picture takes the largest size of its own
// shape that fits (slide.css); the shape comes from the file itself once it has loaded.
// Live (`view.media`), a tap on the picture asks for the zoom: the picture over the whole slide.
import type { Question } from "@simeonts/quizzard-quiz-core/play";
import { h, releaseAfterPointer } from "../h.ts";
import { icon, type StageIcon } from "../icons.ts";
import { WIDE_RATIO, type SlideKind, type SlideView } from "../registry.ts";

/**
 * The tile shown where a file should be and is not (not picked yet, or lost).
 * @param name - the kind's mark
 * @param text - what to say
 */
export function missingMedia(name: StageIcon, text: string): HTMLElement {
  return h("div", { class: "quiz-slide-nomedia", "data-slide-nomedia": "" }, icon(name, 16), h("span", {}, text));
}

/**
 * An image that takes its own shape as soon as it knows it: `--quiz-ratio` is its width / height.
 * @param url - the image's address
 * @param hook - the `data-*` attribute tests and styles find it by
 */
export function shapedImage(url: string, hook: string): HTMLImageElement {
  const image = h("img", { class: "quiz-slide-picture", alt: "", decoding: "async", draggable: "false", "data-loading": "", [hook]: "" });
  const shape = (): void => {
    if (image.naturalWidth === 0 || image.naturalHeight === 0) return;
    image.style.setProperty("--quiz-ratio", String(image.naturalWidth / image.naturalHeight));
    image.removeAttribute("data-loading");
  };
  image.addEventListener("load", shape);
  image.src = url;
  if (image.complete) shape();
  return image;
}

function pictureSlide(question: Question, view: SlideView): HTMLElement {
  const id = question.media?.id;
  const url = id === undefined ? null : (view.mediaUrl?.(id) ?? null);
  if (url === null) return missingMedia("missing", view.labels.media.missing);
  const image = shapedImage(url, "data-slide-picture");
  const { media } = view;
  const entry = id === undefined ? undefined : view.entryOf?.(id);
  // A panorama takes the slide's whole width; every other shape may share the row with the options.
  const layout = entry?.width !== undefined && entry.height !== undefined && entry.width / entry.height >= WIDE_RATIO ? { "data-layout": "wide" } : {};
  if (!media) return h("div", { class: "quiz-slide-frame", ...layout }, image);
  const zoom = h("button", { type: "button", class: "quiz-slide-zoom", "aria-label": view.labels.media.zoom, title: view.labels.media.zoom, "aria-pressed": "false", "data-slide-zoom": "" }, image);
  const frame = h("div", { class: "quiz-slide-frame", ...layout }, zoom);
  releaseAfterPointer(zoom);
  zoom.addEventListener("click", () => { media.command("zoom"); });
  media.mount({
    sync(state) {
      frame.toggleAttribute("data-zoom", state.zoom);
      zoom.setAttribute("aria-pressed", String(state.zoom));
    },
    destroy: () => undefined,
  });
  return frame;
}

/** Kind `picture`: text on top, one picture below. */
export const pictureKindSlide: SlideKind = { id: "picture", tone: "picture", parts: { slide: pictureSlide } };
