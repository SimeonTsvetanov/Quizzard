// Play (SPEC F11, §6): the quiz played right here, by the same player as the exported page — so the
// author can try a quiz without exporting it. The screen is the full window; the player itself is
// loaded when the screen opens (play/run.ts) and stopped when another screen is drawn.
import type { Quiz } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { h } from "../dom/h.ts";
import { up } from "./common.ts";

/**
 * Draws the Play screen of the open quiz and starts the player in it.
 * @param app - the mounted creator
 * @param quiz - the open quiz
 */
export function playScreen(app: App, quiz: Quiz): HTMLElement {
  const { t } = app;
  const name = quiz.name.trim() === "" ? t("quiz.unnamed") : quiz.name;
  // The player makes this element its own (classes, layout); the box around it gives it the window.
  const root = h("div", {}, h("p", { class: "quiz-play-wait", role: "status" }, t("play.loading")));
  const screen = h("section", { class: "quiz-play", "aria-labelledby": "quiz-play-title", "data-screen": "play", "data-immersive": "" },
    h("h1", { class: "visually-hidden", id: "quiz-play-title", tabindex: "-1", "data-screen-title": "" }, t("play.title", { name })),
    h("div", { class: "quiz-play-root" }, root));
  let stop: (() => void) | null = null;
  let isLeft = false;
  app.view.cleanup = () => {
    isLeft = true;
    stop?.();
  };
  const media = app.current?.media ?? [];
  // "Play from here" names a round or a question once: a reload of the Play screen continues the game where it is.
  const from = app.route.screen === "play" ? app.route.from : undefined;
  if (from !== undefined) app.nav.replace({ screen: "play", quiz: quiz.id });
  void import("../play/run.ts").then(({ startPlay }) => {
    if (isLeft || app.signal.aborted) return;
    root.replaceChildren();
    stop = startPlay(app, quiz, media, root, () => { up(app); }, from);
  }).catch(() => {
    if (!isLeft) root.replaceChildren(h("p", { class: "quiz-play-wait", role: "alert" }, t("play.failed")));
  });
  return screen;
}
