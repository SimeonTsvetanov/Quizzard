import { expect, type Page } from "@playwright/test";

/** A sample quiz night for the wide screenshot: two rounds, marks and a double-points round (no personal data). */
const SAMPLE_SHEET = {
  version: 1,
  rounds: [
    {
      name: "History",
      points: 1,
      bonus: 0,
      questions: [
        { text: "Paris", mark: "right", points: null },
        { text: "1066", mark: "wrong", points: null },
        { text: "The Nile", mark: "right", points: null },
        { text: "Napoleon", mark: "right", points: null },
      ],
    },
    {
      name: "Music",
      points: 2,
      bonus: 1,
      questions: [
        { text: "Queen", mark: "right", points: null },
        { text: "Blur", mark: "right", points: null },
        { text: "Abba", mark: "wrong", points: null },
        { text: "Prince", mark: "right", points: 5 },
        { text: "Adele", mark: "none", points: null },
      ],
    },
  ],
};

/** What each screenshot shows: the phone one is Home with its tool cards, the wide one a tool in use. */
export const SHOT_ROUTES = { narrow: "./", wide: "./#/sheet" } as const;

/**
 * Puts the app into a good-looking state before a screenshot: sample data, fonts loaded, no toast.
 * @param page - a page that has not loaded the app yet
 * @param shot - which screenshot is being taken
 */
export async function prepare(page: Page, shot: keyof typeof SHOT_ROUTES): Promise<void> {
  await page.addInitScript((game) => {
    localStorage.setItem("quizzard-sheet:v1:game", JSON.stringify(game));
    // The "ready to work offline" and install notes are not part of the picture.
    const style = document.createElement("style");
    style.textContent = "[data-toasts]{display:none!important}";
    document.addEventListener("DOMContentLoaded", () => {
      document.head.append(style);
    });
  }, SAMPLE_SHEET);
  await page.goto(SHOT_ROUTES[shot]);
  // An explicit "ready" signal instead of networkidle (testing §6).
  if (shot === "wide")
    await expect(page.locator('[data-miniapp="sheet"] [data-total]')).toHaveText("13");
  else await expect(page.locator('[data-card="sheet"]')).toBeVisible();
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((one) => one.effect?.getComputedTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
}
