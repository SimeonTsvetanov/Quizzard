// The script of the exported page (the template built by build.ts): reads the quiz the creator put
// into the page and starts the player — the host's, or, in the window the host opened for the room
// (`#audience`), the audience's stage. The game is saved in this browser under the quiz's id; a page
// opened from a file may have no storage, and then the game simply is not saved.
import { QUIZZARD_URL } from "./ui/brand.ts";
import "./styles/standalone.css";
import "./render/slide.css";
import "./styles/index.css";
import { EXPORT_QUIZ_ID, readEmbeddedQuiz } from "@simeonts/quizzard-quiz-core/play";
import { createAudience } from "./audience.ts";
import { createTranslator, playerLang } from "./i18n/translate.ts";
import { embeddedMedia } from "./media.ts";
import { type GameStorage, createPlayer } from "./player.ts";
import { h } from "./render/h.ts";
import { openAudienceWindow, openerTransport } from "./windows.ts";

/** The `#…` of the page in the audience window. */
const AUDIENCE_HASH = "#audience";

/** The game of one quiz in this browser's localStorage. */
function browserStorage(quizId: string): GameStorage {
  const key = `quizzard-play:${quizId}`;
  return {
    load: () => {
      const text = localStorage.getItem(key);
      return text === null ? null : (JSON.parse(text) as unknown);
    },
    save: (value) => { localStorage.setItem(key, JSON.stringify(value)); },
  };
}

function start(): void {
  const root = h("div", { id: "qp-root" });
  document.body.prepend(root);
  const block = document.getElementById(EXPORT_QUIZ_ID);
  const file = readEmbeddedQuiz(block?.textContent ?? "");
  const lang = playerLang(file?.quiz.language ?? document.documentElement.lang);
  const t = createTranslator(lang);
  document.documentElement.lang = lang;
  if (file === null) {
    root.className = "qp-player";
    root.append(h("div", { class: "qp-notice", role: "alert" }, h("h1", {}, t("error.title")), h("p", {}, t("error.text"))));
    return;
  }
  if (file.quiz.name.trim() !== "") document.title = file.quiz.name;
  const mediaUrl = embeddedMedia(document);
  const transport = location.hash === AUDIENCE_HASH ? openerTransport() : null;
  if (transport !== null) {
    // The audience's window takes the quiz from the host's (without the host's notes): its own copy,
    // answers and notes included, is taken out of the page.
    block?.remove();
    createAudience({ root, transport, lang, mediaUrl, homeUrl: QUIZZARD_URL });
    return;
  }
  const line = h("p", { class: "qp-toast", role: "status" });
  line.hidden = true;
  createPlayer({
    root,
    file,
    storage: browserStorage(file.quiz.id),
    mediaUrl,
    homeUrl: QUIZZARD_URL,
    openAudience: () => openAudienceWindow(`${location.href.split("#")[0] ?? ""}${AUDIENCE_HASH}`),
    notify: (message) => {
      line.textContent = message;
      line.hidden = false;
      window.setTimeout(() => { line.hidden = true; }, 6000);
    },
  });
  root.append(line);
}

start();
