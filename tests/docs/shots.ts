// The screenshots the user docs use (engineering → user-docs §6). The docs-writer agent adds
// one entry per image a page needs; `pnpm docs:images` writes docs/images/[<page>/]<name>-{light,dark}.png.
// The four images the README also shows (home, teams-result, scores-game, answer-sheet) have `page: ""`
// and sit directly in docs/images/; every other image is in the folder of the page that embeds it.
// Sample data only: mixed, real-looking first names, no personal data.
import type { Locator, Page } from "@playwright/test";

/** One docs image: where it goes, how to reach the state, and what to crop to. */
export interface DocsShot {
  /** Page folder under docs/images/, e.g. "back-up-and-move-your-data"; "" = directly in docs/images/ (images the README shares). */
  readonly page: string;
  /** Image name without theme suffix, e.g. "settings". */
  readonly name: string;
  /** Viewport: "phone" (390×844) or "desktop" (1280×800). */
  readonly device: "phone" | "desktop";
  /** Brings the app into the state to capture (sample data only — never personal data). */
  readonly setUp: (page: Page) => Promise<void>;
  /** Part of the page to crop to; whole viewport when omitted. */
  readonly crop?: (page: Page) => Locator;
  /** Parts to cover with a solid mask (personal or changing data). */
  readonly mask?: (page: Page) => Locator[];
  /** Keep toasts visible — only for an image that documents a toast (hidden by default). */
  readonly showToasts?: boolean;
}

/** The tool's own saved data (`app.id` of the tool + `:v1:` + key); the screens read it when they open. */
const TEAMS_KEY = "quizzard-teams:v1:";
const SHEET_KEY = "quizzard-sheet:v1:game";

/** Stores JSON values under localStorage keys, the way the shell's storage module does. */
async function seed(page: Page, entries: Readonly<Record<string, unknown>>): Promise<void> {
  await page.evaluate((items) => {
    for (const [key, value] of Object.entries(items)) localStorage.setItem(key, JSON.stringify(value));
  }, entries);
}

/** Opens a tool the way a link does, then waits until its screen is there. */
async function openTool(page: Page, hash: string, ready: (page: Page) => Promise<void>): Promise<void> {
  await page.evaluate((target) => { location.hash = target; }, hash);
  await ready(page);
}

/**
 * "Ready to work offline ✓" appears a moment after the first load and goes by itself. Wait until it
 * has gone, so it never covers the top of the screen (the shots also hide toasts as a safety net).
 */
async function waitOutOfflineToast(page: Page): Promise<void> {
  const toast = page.locator("[data-toasts]").getByText("Ready to work offline");
  await toast.waitFor({ state: "visible", timeout: 10_000 }).catch(() => undefined); // already gone or not shown
  await toast.waitFor({ state: "hidden", timeout: 15_000 });
}

/** Takes the focus ring and the caret out of the picture. */
async function blurFocus(page: Page): Promise<void> {
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
}

/** The names of the Teams picture: nine people, three teams of three (they fit above the buttons on a phone). */
const NAMES = ["Maria", "Liam", "Aisha", "Kenji", "Elena", "Noah", "Priya", "Carlos", "Sofia"];

/** The Scores game: each player's name and the amount entered, in the order they are entered (Liam last: his card is the last-scored one). */
const SCORES: readonly (readonly [string, number])[] = [["Maria", 34], ["Aisha", 27], ["Kenji", 12], ["Elena", -3], ["Liam", 27]];

/** Adds the players through the Add Player card and enters their amounts through Adjust score. */
async function playScoresGame(page: Page): Promise<void> {
  const nameField = page.getByRole("textbox", { name: "Player name", exact: true });
  await nameField.waitFor();
  for (const [name] of [...SCORES].sort(([a], [b]) => NAMES.indexOf(a) - NAMES.indexOf(b))) {
    await nameField.fill(name);
    await nameField.press("Enter");
  }
  for (const [name, amount] of SCORES) {
    await page.getByRole("button", { name: new RegExp(`^Adjust score for ${name}:`) }).click();
    const field = page.getByRole("spinbutton", { name: "Custom score adjustment" });
    await field.fill(String(amount));
    await field.press("Enter");
    await field.waitFor({ state: "hidden" });
  }
  await blurFocus(page);
}

/** One answer of the sample sheet: text, mark and own points (null = the round's). */
const answer = (text: string, mark: "none" | "right" | "wrong", points: number | null = null): { text: string; mark: string; points: number | null } => ({ text, mark, points });

/** The sample sheet: two rounds, the second a double round with a 5-point line and a bonus point (total 14). Short answers: they fit the field on a phone. */
const SHEET = {
  version: 1,
  rounds: [
    { name: "General knowledge", points: 1, bonus: 0, questions: [answer("Canberra", "right"), answer("Au", "right"), answer("Jupiter", "right"), answer("Orwell", "wrong"), answer("1969", "right")] },
    { name: "Music", points: 2, bonus: 1, questions: [answer("Queen", "right"), answer("Blur", "right"), answer("Abba", "wrong"), answer("Prince", "right", 5), answer("Adele", "none")] },
  ],
};

/**
 * Every docs image, added by the docs-writer agent with the page that embeds it (an image no page
 * uses fails `pnpm docs:check`).
 */
export const DOCS_SHOTS: readonly DocsShot[] = [
  {
    page: "", name: "home", device: "phone",
    setUp: async (page: Page): Promise<void> => {
      // The routing probe and fixture cards exist only in the e2e build (QUIZZARD_E2E=1); the docs are of the real app.
      if (await page.getByText("Routing test mini-app").count() > 0) throw new Error("docs images need the production build: start `vite preview` without QUIZZARD_E2E (see playwright.docs.config.ts)");
      await waitOutOfflineToast(page);
    },
  },
  {
    page: "", name: "teams-result", device: "phone",
    setUp: async (page: Page): Promise<void> => {
      await seed(page, { [`${TEAMS_KEY}names`]: NAMES.join("\n"), [`${TEAMS_KEY}teams`]: 3 });
      await openTool(page, "#/teams", async (p) => { await p.getByRole("button", { name: "Generate teams" }).waitFor(); });
      await page.getByRole("button", { name: "Generate teams" }).click();
      await page.getByRole("button", { name: "Shuffle again" }).waitFor();
      await waitOutOfflineToast(page);
      await blurFocus(page);
    },
  },
  {
    page: "", name: "scores-game", device: "phone",
    setUp: async (page: Page): Promise<void> => {
      await openTool(page, "#/scores", async (p) => { await p.getByRole("textbox", { name: "Player name", exact: true }).waitFor(); });
      await playScoresGame(page);
      await waitOutOfflineToast(page);
    },
  },
  {
    page: "", name: "answer-sheet", device: "phone",
    setUp: async (page: Page): Promise<void> => {
      await seed(page, { [SHEET_KEY]: SHEET });
      await openTool(page, "#/sheet", async (p) => { await p.locator("[data-sheet]").waitFor(); });
      await waitOutOfflineToast(page);
      await blurFocus(page);
    },
  },
  {
    page: "back-up-and-move-your-data", name: "settings", device: "phone",
    setUp: async (page: Page): Promise<void> => {
      // Tall viewport: the sheet shows every group without scrolling.
      await page.setViewportSize({ width: 390, height: 1120 });
      await seed(page, { [`${TEAMS_KEY}names`]: NAMES.join("\n"), [`${TEAMS_KEY}teams`]: 3, [SHEET_KEY]: SHEET });
      await openTool(page, "#/scores", async (p) => { await p.getByRole("textbox", { name: "Player name", exact: true }).waitFor(); });
      const nameField = page.getByRole("textbox", { name: "Player name", exact: true });
      await nameField.fill("Maria");
      await nameField.press("Enter");
      await waitOutOfflineToast(page);
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.getByText("Settings", { exact: true }).click();
      await page.getByRole("dialog", { name: "Settings" }).waitFor();
    },
    crop: (page) => page.getByRole("dialog", { name: "Settings" }),
    mask: (page) => [page.getByRole("dialog", { name: "Settings" }).locator(".row", { hasText: "Space used" }).locator(".row-value")], // the browser's figure for the whole site: it changes from run to run
  },
];
