// The host panel's card for the media of the screen on show: play / pause and "from the start" for a
// clip with about where it is, the zoom for a picture — and what to do when the audience's window
// wants a tap before it plays sound. The buttons make moves of the game, so the audience's window
// (which is the one that plays) follows.
import { clockText } from "@simeonts/quizzard-quiz-core/play";
import type { GameState } from "../game/state.ts";
import { h } from "../render/h.ts";
import type { PlayEnv } from "../views/context.ts";
import { barButton, setFace } from "./bar.ts";
import type { Commands } from "./commands.ts";

/** A card of the panel that follows the game. */
export interface PanelCard {
  readonly element: HTMLElement;
  update(state: GameState): void;
}

/**
 * Creates the media card.
 * @param env - the game's fixed parts
 * @param commands - what its buttons do
 */
export function createMediaCard(env: PlayEnv, commands: Commands): PanelCard {
  const { t } = env;
  const send = (command: "toggle" | "restart" | "zoom") => (): void => { commands.dispatch({ type: "media", command }); };
  const play = barButton("play", t("media.play"), send("toggle"), { "data-control": "clip", "data-words": "" });
  const restart = barButton("reset", t("media.restart"), send("restart"), { "data-control": "clip-restart" });
  const zoom = barButton("zoom", t("media.zoom"), send("zoom"), { "data-control": "zoom", "data-words": "", "aria-pressed": "false" });
  const time = h("p", { class: "qp-host-clip", "data-host-clip": "" });
  const note = h("p", { class: "qp-host-warning", role: "status", "data-host-blocked": "" }, t("host.blocked"));
  const title = h("h3", { class: "qp-card-title" });
  const clip = h("div", { class: "qp-bar-group" }, play, restart);
  const element = h("section", { class: "qp-card", "data-card": "media" }, title, time, clip, zoom, note);
  return {
    element,
    update(state) {
      const screen = state.screens[state.index];
      const kind = screen?.media;
      const isPlaying = state.media.status === "playing";
      element.hidden = kind === undefined;
      clip.hidden = kind !== "clip";
      time.hidden = kind !== "clip";
      zoom.hidden = kind !== "still";
      note.hidden = state.media.status !== "blocked";
      title.textContent = t(kind === "still" ? "host.picture" : "host.clip");
      setFace(play, isPlaying ? "pause" : "play", t(isPlaying ? "media.pause" : "media.play"));
      zoom.setAttribute("aria-pressed", String(state.media.zoom));
      const total = (screen?.clipMs ?? 0) / 1000;
      time.textContent = total > 0 ? `${clockText(state.media.ms / 1000)} / ${clockText(total)}` : clockText(state.media.ms / 1000);
      time.setAttribute("data-status", state.media.status);
    },
  };
}

/**
 * The "Black screen" button and the line that says what covers the stage right now.
 * @param env - the game's fixed parts
 * @param commands - what the button does
 */
export function createCover(env: PlayEnv, commands: Commands): PanelCard & { readonly button: HTMLButtonElement } {
  const { t } = env;
  const button = barButton("black", t("control.black"), () => { commands.dispatch({ type: "black" }); }, { "data-control": "black", "data-words": "", "aria-pressed": "false" });
  const element = h("p", { class: "qp-host-cover", role: "status", "data-host-cover": "" });
  return {
    element,
    button,
    update(state) {
      const cover = state.curtain;
      button.setAttribute("aria-pressed", String(cover?.kind === "black"));
      element.hidden = cover === null;
      if (cover === null) element.textContent = "";
      else element.textContent = cover.kind === "black" ? t("host.black") : t("host.break", { time: clockText(Math.ceil(cover.leftMs / 1000)) });
    },
  };
}
