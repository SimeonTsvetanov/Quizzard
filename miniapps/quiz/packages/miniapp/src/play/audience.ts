// The audience's window inside the app (presenter mode of "Play"): the tool opened at
// `#/quiz?audience=1` by the host's window shows the stage alone and takes the quiz and every move
// from that window (the player's channel) — it reads no quiz from storage and saves nothing. Only
// the quiz's media files are read here, from this browser's own storage (the two windows share it),
// once the host has said which quiz is on: sending hundreds of megabytes between windows would be
// slow, and the files are already on this device.
import "../styles/play.css";
import { createAudience, openerTransport } from "@simeonts/quizzard-quiz-player";
import type { MiniAppContext, Unmount } from "../contract.ts";
import { h } from "../dom/h.ts";
import { createMediaUrls } from "../media/urls.ts";
import { createQuizStore } from "../storage/store.ts";

/**
 * Mounts the audience's stage.
 * @param element - the mount element of the tool
 * @param context - the host's services
 * @returns the unmount, or `null` when this window was not opened by a playing quiz
 */
export function mountAudience(element: HTMLElement, context: MiniAppContext): Unmount | null {
  const transport = openerTransport();
  if (transport === null) return null;
  const root = h("div");
  element.replaceChildren(h("section", { class: "quiz-play", "data-screen": "audience" }, h("div", { class: "quiz-play-root" }, root)));
  context.shell.setBusy(true);
  const store = createQuizStore();
  const media = createMediaUrls();
  const audience = createAudience({
    root, transport, lang: context.language.get(),
    prepare: async (file) => {
      media.hold(file.quiz.id, await store.media(file.quiz.id));
      return media.url;
    },
  });
  return () => {
    audience.destroy();
    media.release();
    store.close();
    context.shell.setBusy(false);
    element.replaceChildren();
  };
}
