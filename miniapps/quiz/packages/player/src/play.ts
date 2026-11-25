// The player with a language the host can change while playing (Moni 2026-11-25): everything a game
// draws is built for one language (env.ts), so a change starts the player again in the picked one —
// the game was saved a moment before and is restored where it was; an open audience window is
// opened again. The picked language is part of the saved game (game/save.ts).
import { playerLang } from "./i18n/translate.ts";
import { type Player, type PlayerOptions, startPlayer } from "./player.ts";

/** The language a saved game was last played in, if the host picked one. */
function savedLang(options: PlayerOptions): string | null {
  try {
    const saved: unknown = options.storage?.load();
    if (typeof saved !== "object" || saved === null || !("lang" in saved)) return null;
    return typeof saved.lang === "string" ? saved.lang : null;
  } catch {
    return null;
  }
}

/** The same quiz, to be played in another language. */
function inLang(options: PlayerOptions, lang: string | null): PlayerOptions {
  if (lang === null) return options;
  return { ...options, file: { ...options.file, quiz: { ...options.file.quiz, language: playerLang(lang) } } };
}

/**
 * Starts the host's player in an element.
 * @param options - the element, the quiz and the page's services
 */
export function createPlayer(options: PlayerOptions): Player {
  let isGone = false;
  const start = (lang: string | null, isRestart: boolean): Player => startPlayer({ ...inLang(options, lang), onLang: relang, isRestart });
  // After the move that picked the language is over: the player it came from is taken down.
  const relang = (lang: string): void => {
    queueMicrotask(() => {
      if (isGone) return;
      const wasPresenting = inner.isPresenting();
      inner.destroy();
      inner = start(lang, true);
      if (wasPresenting) inner.present();
    });
  };
  let inner = start(savedLang(options), false);
  return {
    getState: () => inner.getState(),
    dispatch: (action) => { inner.dispatch(action); },
    isPresenting: () => inner.isPresenting(),
    present: () => { inner.present(); },
    destroy() {
      isGone = true;
      inner.destroy();
    },
  };
}
