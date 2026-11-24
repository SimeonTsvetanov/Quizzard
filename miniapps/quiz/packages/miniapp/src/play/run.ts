// "Play" (lazy: loaded when the Play screen opens, so the player and its stylesheet stay out of the
// creator's first chunk): starts the player — the same code as in an exported page — on the open
// quiz. The game is kept per quiz in the mini-app's storage area; the audience window is this app
// again, opened at `#/quiz?audience=1` (audience.ts).
import "../styles/play.css";
import { type MediaEntry, type Quiz, toFile } from "@simeonts/quizzard-quiz-core";
import { createPlayer, openAudienceWindow } from "@simeonts/quizzard-quiz-player";
import { AUDIENCE_PARAM } from "../app/routes.ts";
import type { App } from "../app/state.ts";
import { gameStorage } from "../storage/game.ts";

/**
 * Starts the player.
 * @param app - the mounted creator
 * @param quiz - the open quiz
 * @param media - the descriptions of its files
 * @param root - an empty element that fills the screen
 * @param exit - leaves the Play screen
 * @returns how to stop the player (it saves the game first)
 */
export function startPlay(app: App, quiz: Quiz, media: readonly MediaEntry[], root: HTMLElement, exit: () => void): () => void {
  const { shell, storage } = app.context;
  shell.setBusy(true); // no update offer in the middle of a game
  const player = createPlayer({
    root,
    file: toFile(quiz, media),
    storage: gameStorage(storage.prefs, quiz.id),
    openAudience: () => openAudienceWindow(`${location.href.split("#")[0] ?? ""}#/quiz?${AUDIENCE_PARAM}=1`),
    onExit: exit,
    notify: (message) => { shell.toast(message, { tone: "error" }); },
  });
  return () => {
    player.destroy();
    shell.setBusy(false);
  };
}
