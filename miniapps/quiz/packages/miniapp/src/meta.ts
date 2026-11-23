// The eager description of the quiz creator (contract `MiniAppMeta`): the Home card, the route and
// Settings → Your data read it without loading the body.
import type { MiniAppMeta } from "./contract.ts";

/**
 * The quiz creator's meta.
 * @remarks `storage`: quizzes (and later their media files) live in the IndexedDB database
 * `quizzard-quiz` (storage/db.ts names the same one). Under the localStorage prefix only `unsaved`
 * is written: the change that was not stored yet when the page went away, moved into the database
 * at the next start (storage/rescue.ts). No OPFS folder.
 */
export const meta: MiniAppMeta = {
  contract: 1,
  id: "quiz",
  name: { en: "Quiz creator", bg: "Създател на куизове" },
  tagline: { en: "Build your own quiz night", bg: "Подгответе своя куиз вечер" },
  icon: "miniapps/quiz.svg",
  languages: ["en", "bg"],
  status: "ready",
  storage: { prefix: "quizzard-quiz:v1:", databases: ["quizzard-quiz"] },
};
