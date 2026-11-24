// What every slide the creator draws needs besides its question: the registries, the words and the
// quiz's media files. Thumbnails take a file's small still where it has one (fifty cards never
// decode fifty full pictures); the live preview and the Preview screen take the file itself and
// make its media live — a picture zooms, a clip plays — driven by the slide's own buttons.
import type { MediaEntry } from "@simeonts/quizzard-quiz-core";
import { type LocalMedia, type SlideInput, renderSlide, stillOf } from "@simeonts/quizzard-quiz-player/render";
import type { App } from "../app/state.ts";
import { slideLabels } from "../format.ts";

/** The parts of a slide's input that do not depend on the question. */
export type SlideProps = Pick<SlideInput, "ui" | "labels" | "mediaUrl" | "entryOf">;

/** Looks a file's description up by id in the open quiz. */
function entries(app: App): (id: string) => MediaEntry | undefined {
  const byId = new Map((app.current?.media ?? []).map((entry) => [entry.id, entry]));
  return (id) => byId.get(id);
}

/**
 * The props of a slide that shows the files themselves (the live preview, the Preview screen).
 * @param app - the mounted creator
 */
export function slideProps(app: App): SlideProps {
  return { ui: app.ui, labels: slideLabels(app.t, app.lang), mediaUrl: app.media.url, entryOf: entries(app) };
}

/**
 * The props of a thumbnail: a picture is shown by its small still when the file has one.
 * @param app - the mounted creator
 */
export function thumbProps(app: App): SlideProps {
  const entryOf = entries(app);
  return { ...slideProps(app), entryOf, mediaUrl: (id) => stillOf(entryOf(id)) ?? app.media.url(id) };
}

/**
 * Shows a slide with live media in a stage and keeps what is playing: while the question keeps its
 * kind and its file, the media part already on the stage is moved into the new slide, so typing
 * the question's text neither reloads its picture nor stops its clip.
 * @param stage - the element the slide stands in
 * @param input - the slide to draw, without `media`
 * @param media - the stage's own media link (`createLocalMedia`)
 */
export function showLive(stage: HTMLElement, input: SlideInput, media: LocalMedia): void {
  const key = `${input.question.kind}:${input.question.media?.id ?? ""}`;
  const kept = stage.getAttribute("data-media-key") === key ? stage.querySelector(".quiz-slide-media") : null;
  if (kept === null) media.stop();
  const slide = renderSlide(kept === null ? { ...input, media } : input);
  if (kept !== null) slide.querySelector(".quiz-slide-media")?.replaceWith(kept);
  stage.setAttribute("data-media-key", key);
  stage.replaceChildren(slide);
}
