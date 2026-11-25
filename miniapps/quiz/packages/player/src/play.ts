// The player with a language the host can change while playing (Moni 2026-11-25): everything a game
// draws is built for one language (env.ts), so a change starts a player in the picked one in the
// place of the one that ran. The game goes from the one to the other as it is — a running timer, a
// break, the points — and so does an open audience window, which is told the quiz again instead of
// being closed and opened. The picked language is part of the saved game (game/save.ts), so the next
// visit starts in it.
import { playerLang } from "./i18n/translate.ts";
import type { Handover, Player, PlayerOptions } from "./player-types.ts";
import { startPlayer } from "./player.ts";

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
  const start = (lang: string | null, resume?: Handover) => startPlayer({ ...inLang(options, lang), onLang: relang, ...(resume ? { resume } : {}) });
  // After the move that picked the language is over: the player it came from hands its game on.
  const relang = (lang: string): void => {
    queueMicrotask(() => {
      if (isGone) return;
      inner = start(lang, inner.handOver());
    });
  };
  let inner = start(savedLang(options));
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
