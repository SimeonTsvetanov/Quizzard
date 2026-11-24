// The audience's window (presenter mode): only the stage. It holds no game of its own — it asks the
// host's window for the quiz and the game, draws every state it is sent, and passes key presses back
// as moves for the host to make. It never draws a view with its controls, and it knows of an answer
// only what the game's reveal step says.
import { type Transport, createChannel } from "./channel.ts";
import { createEnv } from "./env.ts";
import type { GameAction } from "./game/state.ts";
import { type Lang, createTranslator } from "./i18n/translate.ts";
import { h } from "./render/h.ts";
import { icon } from "./render/icons.ts";
import { type Commands, listenKeys, toggleFullscreen } from "./ui/commands.ts";
import { type Stage, createStage } from "./ui/stage.ts";

/** Inputs of {@link createAudience}. */
export interface AudienceOptions {
  /** An empty element; the stage fills it. */
  readonly root: HTMLElement;
  /** Leads to the host's window. */
  readonly transport: Transport;
  /** The language of the "waiting" words, until the quiz arrives with its own. */
  readonly lang: Lang;
  /** Gives the address of a media file of the quiz, or `null`. */
  readonly mediaUrl?: (id: string) => string | null;
}

/** How often the window asks again while the host has not answered. */
const HELLO_EVERY_MS = 500;

/** A notice in place of the stage: waiting for the host, or the host is gone. */
function notice(text: string): HTMLElement {
  return h("div", { class: "qp-notice", role: "status" }, h("p", {}, text));
}

/**
 * Starts the audience's stage in an element.
 * @param options - the element and the way to the host's window
 * @returns how to stop it
 */
export function createAudience(options: AudienceOptions): { destroy(): void } {
  const { root, transport } = options;
  const waiting = createTranslator(options.lang);
  const channel = createChannel(transport);
  const controller = new AbortController();
  let stage: Stage | null = null;
  const send = (action: GameAction): void => { channel.send({ kind: "action", action }); };
  // The audience window has the stage alone: no menu, no scores dialog.
  const commands: Commands = { dispatch: send, openMenu: () => undefined, openScores: () => undefined, toggleFullscreen: () => { toggleFullscreen(root); }, toggleAudience: () => undefined, exit: null };
  root.classList.add("qp-player");
  root.setAttribute("data-role", "audience");
  root.replaceChildren(notice(waiting("audience.waiting")));
  channel.on((message) => {
    if (message.kind === "init") {
      stage?.destroy();
      const env = createEnv({ file: message.file, dispatch: send, mediaUrl: options.mediaUrl });
      stage = createStage(env, { canEdit: false, isLive: true });
      const full = h("button", { type: "button", class: "qp-corner-button", "aria-label": env.t("control.fullscreen"), title: env.t("control.fullscreen") }, icon("fullscreen", 22));
      full.addEventListener("click", commands.toggleFullscreen);
      root.lang = env.lang;
      root.replaceChildren(h("div", { class: "qp-stage-box" }, stage.element), full);
      stage.show(message.state);
    }
    if (message.kind === "state") stage?.show(message.state);
    if (message.kind === "bye") root.replaceChildren(notice(waiting("audience.closed")));
  });
  listenKeys(commands, controller.signal);
  channel.send({ kind: "hello" });
  const asking = window.setInterval(() => { if (stage === null) channel.send({ kind: "hello" }); }, HELLO_EVERY_MS);
  window.addEventListener("pagehide", () => { channel.close(); }, { signal: controller.signal });
  return {
    destroy() {
      if (controller.signal.aborted) return;
      controller.abort();
      window.clearInterval(asking);
      channel.close();
      stage?.destroy();
      root.replaceChildren();
    },
  };
}
