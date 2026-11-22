// The eager description of the Answer sheet mini-app (contract `MiniAppMeta`): the Home card, the
// route and Settings → Your data read it without loading the body.
import type { MiniAppMeta } from "./contract.ts";

/**
 * The Answer sheet's meta.
 * @remarks `storage`: the body writes only `game` (the rounds with their answers, marks, points and
 * bonus; removed when the sheet is empty) under the prefix. No IndexedDB database, no OPFS folder.
 */
export const meta: MiniAppMeta = {
  contract: 1,
  id: "sheet",
  name: { en: "Answer sheet", bg: "Лист с отговори" },
  tagline: { en: "Your team's answers and points, round by round", bg: "Отговорите и точките на отбора, рунд по рунд" },
  icon: "miniapps/sheet.svg",
  languages: ["en", "bg"],
  status: "ready",
  storage: { prefix: "quizzard-sheet:v1:" },
};
