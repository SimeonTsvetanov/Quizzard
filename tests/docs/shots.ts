// The screenshots the user docs use (engineering → user-docs §6). The docs-writer agent adds
// one entry per image a page needs; `pnpm docs:images` writes docs/images/[<page>/]<name>-{light,dark}.png.
// The four images the README also shows (home, teams-result, scores-game, answer-sheet) have `page: ""`
// and sit directly in docs/images/; every other image is in the folder of the page that embeds it.
// Sample data only: mixed, real-looking first names, no personal data.
import { readFileSync } from "node:fs";
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

/** The quiz of the Quiz creator pictures: two rounds, five text questions, one with several right options. */
const QUIZ_FILE = {
  format: "quizzard-quiz",
  version: 1,
  media: [],
  quiz: {
    id: "docs-quiz", name: "Pub night", createdAt: "2026-11-23T18:00:00.000Z", updatedAt: "2026-11-23T18:00:00.000Z", language: "en", settings: { teams: 4 },
    rounds: [
      {
        id: "r1", kind: "standard", name: "History", defaults: { seconds: 30, points: { value: 1 }, questionKind: "text", answerType: "open" },
        questions: [
          { id: "q1", kind: "text", prompt: "Which river flows through Paris?", answer: { type: "open", text: "The Seine" }, explanation: "It splits around two islands." },
          { id: "q2", kind: "text", prompt: "Which of these are planets?", answer: { type: "choice", options: [{ id: "a", text: "Mars" }, { id: "b", text: "Europa" }, { id: "c", text: "Venus" }], correct: ["a", "c"] } },
          { id: "q3", kind: "text", prompt: "The Great Wall of China is visible from the Moon.", answer: { type: "trueFalse", correct: false } },
        ],
      },
      {
        id: "r2", kind: "standard", name: "Music", defaults: { seconds: 30, points: { value: 1 }, questionKind: "text", answerType: "open" },
        questions: [
          { id: "q4", kind: "text", prompt: "Name the band and the song.", answer: { type: "open", text: "Queen — Bohemian Rhapsody" }, points: { value: 2, note: "1 for the band, 1 for the song" } },
          { id: "q5", kind: "text", prompt: "Which instrument has 88 keys?", answer: { type: "open", text: "The piano" } },
        ],
      },
    ],
  },
};

/** Puts the sample quiz into the Quiz creator's library (its IndexedDB database) and opens the library. */
async function seedQuiz(page: Page, file: object = QUIZ_FILE): Promise<void> {
  await openTool(page, "#/quiz", async (p) => { await p.locator('[data-miniapp="quiz"] [data-screen="library"]').waitFor(); });
  await page.evaluate((record) => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open("quizzard-quiz");
    request.onsuccess = () => {
      const transaction = request.result.transaction("quizzes", "readwrite");
      transaction.objectStore("quizzes").put(record);
      transaction.oncomplete = () => { request.result.close(); resolve(); };
      transaction.onerror = () => { reject(new Error("seed failed")); };
    };
  }), file);
  await page.reload();
  await page.locator('[data-miniapp="quiz"] .quiz-card').first().waitFor();
  await waitOutOfflineToast(page);
}

/** Lets the cards finish arriving, so no picture is taken in the middle of a move. */
async function settle(page: Page): Promise<void> {
  await page.evaluate(() => Promise.all(document.getAnimations().filter((one) => one.effect?.getComputedTiming().iterations !== Infinity).map((animation) => animation.finished.catch(() => undefined))));
  await blurFocus(page);
}

/** A quiz with a Golden pyramid and a Safe (the core's own fixture), for the pictures of the special rounds. */
const SPECIAL_FILE = JSON.parse(readFileSync(new URL("../../miniapps/quiz/packages/core/test/fixtures/v1/special-rounds.quiz.json", import.meta.url), "utf8")) as object;

const quizRoot = '[data-miniapp="quiz"]';
const stage = '.qp-stage[data-stage="live"]';

/** Seeds a quiz, opens it and starts Play on its title screen. */
async function playQuiz(page: Page, file: object = QUIZ_FILE): Promise<void> {
  await seedQuiz(page, file);
  await page.locator(`${quizRoot} .quiz-card-open`).first().click();
  await page.locator(`${quizRoot} [data-play-quiz]`).click();
  await page.locator(`${stage} [data-view="title"]`).waitFor();
}

/** Jumps to a screen through the player's menu: the `nth` tile of a kind ("answers", "score"). */
async function jumpTo(page: Page, screen: string, nth: number): Promise<void> {
  await page.keyboard.press("KeyM");
  await page.locator(`[data-dialog="menu"] [data-jump-screen="${screen}"]`).nth(nth).click();
}

/** The Quiz creator pictures of "Make a quiz" and "Play a quiz". */
const QUIZ_SHOTS: readonly DocsShot[] = [
  { page: "make-a-quiz", name: "library", device: "phone", setUp: async (page) => { await seedQuiz(page); await settle(page); } },
  {
    page: "make-a-quiz", name: "ai", device: "phone",
    setUp: async (page) => {
      await seedQuiz(page);
      await settle(page);
      await page.locator("[data-ai-open-quiz]").click();
      await page.locator("[data-ai-topic]").fill("Rivers of Europe");
      await page.locator("[data-ai-special-safe]").check();
      await page.locator("[data-ai-dialog]").getByRole("button", { name: "About Safe" }).click();
      await page.locator("[data-ai-special-safe]").scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
    },
  },
  {
    page: "make-a-quiz", name: "quiz", device: "phone",
    setUp: async (page) => {
      await page.setViewportSize({ width: 390, height: 1000 }); // tall: the header card and both rounds without scrolling
      await seedQuiz(page);
      await page.locator('[data-miniapp="quiz"] .quiz-card-open').first().click();
      await page.locator('[data-miniapp="quiz"] [data-play-quiz]').waitFor();
      await settle(page);
    },
  },
  {
    page: "make-a-quiz", name: "editor", device: "phone",
    setUp: async (page) => {
      await seedQuiz(page);
      await page.locator('[data-miniapp="quiz"] .quiz-card-open').first().click();
      await page.locator('[data-miniapp="quiz"] [data-focus="round:r1"]').click();
      await page.locator('[data-miniapp="quiz"] [data-focus="question:q1"]').click();
      await page.locator('[data-miniapp="quiz"] [data-screen="editor"]').waitFor();
      await settle(page);
    },
  },
  {
    // The open round with its questions shown (the eye) and its settings: time, points and the two switches.
    page: "make-a-quiz", name: "round", device: "phone",
    setUp: async (page) => {
      await page.setViewportSize({ width: 390, height: 1500 });
      await seedQuiz(page);
      await page.locator(`${quizRoot} .quiz-card-open`).first().click();
      await page.locator(`${quizRoot} [data-focus="round:r1"]`).click();
      await page.locator(`${quizRoot} [data-round-action="peek"]`).click();
      await page.locator(`${quizRoot} [data-round-settings] summary`).click();
      await page.locator(`${quizRoot} [data-round-one-by-one]`).waitFor();
      await settle(page);
    },
  },
  {
    page: "make-a-quiz", name: "music", device: "phone",
    setUp: async (page) => {
      await page.setViewportSize({ width: 390, height: 1300 });
      await seedQuiz(page);
      await page.locator(`${quizRoot} .quiz-card-open`).first().click();
      await page.locator(`${quizRoot} [data-quiz-more] summary`).click();
      await page.locator(`${quizRoot} [data-music-row]`).waitFor();
      await settle(page);
    },
    crop: (page) => page.locator(`${quizRoot} [data-quiz-more]`),
  },
  {
    page: "play-a-quiz", name: "answer", device: "desktop",
    setUp: async (page) => {
      await playQuiz(page);
      await jumpTo(page, "answers", 0);
      await page.keyboard.press("Space");
      await page.locator(`${stage} .quiz-slide-right`).waitFor();
      await page.waitForTimeout(1800); // the answer comes in a second after its slide
      await settle(page);
    },
  },
  {
    page: "play-a-quiz", name: "pyramid", device: "desktop",
    setUp: async (page) => {
      await playQuiz(page, SPECIAL_FILE);
      for (let press = 0; press < 3; press += 1) await page.keyboard.press("Space");
      await page.locator(`${stage} [data-view="pyramid"]`).waitFor();
      await page.keyboard.press("KeyT"); // the timer rests: the picture is the same every time
      await settle(page);
    },
  },
  {
    page: "play-a-quiz", name: "safe", device: "desktop",
    setUp: async (page) => {
      await playQuiz(page, SPECIAL_FILE);
      await jumpTo(page, "answers", 1);
      await page.keyboard.press("Space");
      // The code dials itself: the picture is of the third digit, with two found before it.
      await page.locator(`${stage} [data-code-line] [data-code="set"]`).nth(1).waitFor({ timeout: 20_000 });
      await page.keyboard.press("KeyT");
      await page.waitForTimeout(2200);
      await settle(page);
    },
  },
  {
    page: "play-a-quiz", name: "stage", device: "desktop",
    setUp: async (page) => {
      await seedQuiz(page);
      await page.locator('[data-miniapp="quiz"] .quiz-card-open').first().click();
      await page.locator('[data-miniapp="quiz"] [data-play-quiz]').click();
      await page.locator('.qp-stage[data-stage="live"] [data-view="title"]').waitFor();
      for (let press = 0; press < 3; press += 1) await page.keyboard.press("Space");
      await page.locator('.qp-stage[data-stage="live"] .quiz-slide-prompt').waitFor();
      await page.keyboard.press("KeyT"); // the timer rests: the picture is the same every time
      await settle(page);
    },
  },
  {
    page: "play-a-quiz", name: "menu", device: "desktop",
    setUp: async (page) => {
      await seedQuiz(page);
      await page.locator('[data-miniapp="quiz"] .quiz-card-open').first().click();
      await page.locator('[data-miniapp="quiz"] [data-play-quiz]').click();
      await page.locator('.qp-stage[data-stage="live"] [data-view="title"]').waitFor();
      await page.keyboard.press("KeyM");
      await page.locator('[data-dialog="menu"]').waitFor();
      await settle(page);
    },
    crop: (page) => page.locator('[data-dialog="menu"]'),
  },
];

/** The names of the Teams picture: nine people, three teams of three (they fit above the buttons on a phone). */
const NAMES = ["Maria", "Liam", "Aisha", "Kenji", "Elena", "Noah", "Priya", "Carlos", "Sofia"];

/** The Scores game: each player's name and the amount entered, in the order they are entered (Liam last: his card is the last-scored one). */
const SCORES: readonly (readonly [string, number])[] = [["Maria", 34], ["Aisha", 27], ["Kenji", 12], ["Elena", -3], ["Liam", 27]];

/** The colour of each player's name, as picked in the palette; Elena has none. */
const NAME_COLOURS: Readonly<Record<string, string>> = { Maria: "Red", Liam: "Blue", Aisha: "Yellow", Kenji: "Green" };

/** Adds the players through the Add Player card and enters their amounts through Adjust score. */
async function playScoresGame(page: Page): Promise<void> {
  const nameField = page.getByRole("textbox", { name: "Player name", exact: true });
  await nameField.waitFor();
  for (const [name] of [...SCORES].sort(([a], [b]) => NAMES.indexOf(a) - NAMES.indexOf(b))) {
    await nameField.fill(name);
    const colour = NAME_COLOURS[name];
    if (colour !== undefined) {
      await page.getByRole("button", { name: "Colour of the new player's name" }).click();
      await page.getByRole("dialog").getByRole("button", { name: colour, exact: true }).click();
    }
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
    page: "keep-score", name: "name-colour", device: "phone",
    setUp: async (page: Page): Promise<void> => {
      await openTool(page, "#/scores", async (p) => { await p.getByRole("textbox", { name: "Player name", exact: true }).waitFor(); });
      await playScoresGame(page);
      await waitOutOfflineToast(page);
      await page.getByRole("textbox", { name: "Player name for Elena" }).focus();
      await page.getByRole("button", { name: "Name colour for Elena" }).click();
      await page.getByRole("dialog", { name: "Name colour" }).waitFor();
      await page.waitForTimeout(400);
    },
    crop: (page) => page.getByRole("dialog", { name: "Name colour" }),
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
  ...QUIZ_SHOTS,
];
