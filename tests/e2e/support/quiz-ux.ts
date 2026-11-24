import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// What the quiz creator's UX specs share (docs/quiz-creator/UX-REVIEW-2026-11-24.md): a quiz put
// straight into the creator's IndexedDB library, and the locators of its screens and of the player.

export const root = (page: Page): Locator => page.locator('[data-miniapp="quiz"]');
export const screen = (page: Page, name: string): Locator => root(page).locator(`[data-screen="${name}"]`);
export const stage = (page: Page): Locator => page.locator('.qp-stage[data-stage="live"]');
export const view = (page: Page, name: string): Locator => stage(page).locator(`[data-view="${name}"]`);
export const control = (page: Page, name: string): Locator => page.locator(`.qp-bar [data-control="${name}"]`);
export const panel = (page: Page): Locator => page.locator("[data-panel]");
export const toastWith = (page: Page, text: string | RegExp): Locator => page.getByRole("status").filter({ hasText: text });
export const undoToast = (page: Page): Locator => page.locator("[data-toasts]").getByRole("button", { name: "Undo" });

const LANDSCAPE = fileURLToPath(new URL("../fixtures/quiz-media/landscape.jpg", import.meta.url));
const TALL = fileURLToPath(new URL("../fixtures/quiz-media/tall.png", import.meta.url));

/** The two picture files of the fixtures folder, by path. */
export const PICTURES = { landscape: LANDSCAPE, tall: TALL } as const;

/** The longest points note the model takes (80 characters). */
export const LONG_NOTE = "1 за групата, 2 за песента, 3 за двете и още една за годината на издаване тук";

const open = (id: string, prompt: string, text: string, extra: object = {}): object => ({ id, kind: "text", prompt, answer: { type: "open", text }, ...extra });

/** A round of a {@link SeedFile}. */
export interface SeedRound {
  readonly id: string;
  readonly kind: string;
  readonly name: string;
  readonly defaults: object;
  readonly questions: readonly object[];
}

/** A quiz file as the library stores it. */
export interface SeedFile {
  readonly format: string;
  readonly version: number;
  readonly media: readonly object[];
  readonly quiz: { readonly id: string; readonly name: string; readonly rounds: readonly SeedRound[] } & Record<string, unknown>;
}

/**
 * "Pub night": History (3 questions: two open ones, a picture with `m-land`) and Music (1
 * question with the longest points note).
 * @param change - fields of the quiz to replace
 */
export function pubNight(change: Record<string, unknown> = {}): SeedFile {
  const defaults = { seconds: 30, points: { value: 1 }, questionKind: "text", answerType: "open" };
  return {
    format: "quizzard-quiz",
    version: 1,
    media: [{ id: "m-land", type: "image", mime: "image/jpeg", name: "landscape.jpg", bytes: 15624, width: 640, height: 360 }],
    quiz: {
      id: "ux-quiz", name: "Pub night", createdAt: "2026-11-23T10:00:00.000Z", updatedAt: "2026-11-23T10:00:00.000Z", language: "en", settings: { teams: 4 },
      rounds: [
        { id: "r1", kind: "standard", name: "History", defaults, questions: [
          open("q1", "Which river flows through Paris?", "The Seine", { explanation: "It splits around two islands.", note: "Accept “Sena”." }),
          open("q2", "Who built the first pyramid?", "Imhotep"),
          { id: "q3", kind: "picture", prompt: "What is this test card called?", media: { id: "m-land" }, answer: { type: "open", text: "Colour bars" } },
        ] },
        { id: "r2", kind: "standard", name: "Music", defaults, questions: [open("q4", "Name the band and the song.", "Queen", { points: { value: 3, note: LONG_NOTE } })] },
      ],
      ...change,
    },
  };
}

/** "Pub night" with two unfinished questions: History 2 has no answer, Music 1 no text. */
export function unfinishedNight(): SeedFile {
  const base = pubNight();
  const [history, music] = base.quiz.rounds;
  if (!history || !music) return base;
  const rounds: SeedRound[] = [
    { ...history, questions: history.questions.map((question, index) => (index === 1 ? open("q2", "Who built the first pyramid?", "") : question)) },
    { ...music, questions: [open("q4", "", "Queen")] },
  ];
  return { ...base, quiz: { ...base.quiz, rounds } };
}

/**
 * A round with many questions, for the long-list tools.
 * @param count - how many questions
 */
export function longRound(count: number): SeedFile {
  const base = pubNight();
  const questions = Array.from({ length: count }, (_unused, index) => open(`lq${String(index + 1)}`, `Question number ${String(index + 1)}?`, `Answer ${String(index + 1)}`));
  const round: SeedRound = { id: "r1", kind: "standard", name: "Marathon", defaults: { seconds: 30, points: { value: 1 }, questionKind: "text", answerType: "open" }, questions };
  return { ...base, media: [], quiz: { ...base.quiz, id: "ux-long", name: "Long night", rounds: [round] } };
}

/**
 * Puts quizzes (and the landscape picture as `m-land` for each that lists it) into the library and shows the library.
 * @param page - the page
 * @param files - the quizzes
 */
export async function seed(page: Page, ...files: readonly SeedFile[]): Promise<void> {
  await page.goto("./#/quiz");
  await expect(root(page).locator("#quiz-library-title")).toBeVisible();
  const picture = readFileSync(LANDSCAPE).toString("base64");
  await page.evaluate(
    ({ records, base64 }) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("quizzard-quiz");
        request.onsuccess = () => {
          const transaction = request.result.transaction(["quizzes", "media"], "readwrite");
          for (const record of records) {
            transaction.objectStore("quizzes").put(record);
            if (record.media.length === 0) continue;
            const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
            transaction.objectStore("media").put({ quizId: record.quiz.id, id: "m-land", blob: new Blob([bytes], { type: "image/jpeg" }) });
          }
          transaction.oncomplete = () => { request.result.close(); resolve(); };
          transaction.onerror = () => { reject(new Error("seed failed")); };
        };
      }),
    { records: files as SeedFile[], base64: picture },
  );
  await page.reload();
  await expect(root(page).locator(".quiz-card")).toHaveCount(files.length);
}

/**
 * Seeds one quiz and opens it (the quiz screen).
 * @param page - the page
 * @param file - the quiz; "Pub night" by default
 */
export async function openQuiz(page: Page, file: SeedFile = pubNight()): Promise<void> {
  await seed(page, file);
  await root(page).locator(".quiz-card-open").first().click();
  await expect(root(page).locator("[data-play-quiz]")).toBeVisible();
}

/**
 * Replaces the library with one quiz and opens it (a second quiz in the same test).
 * @param page - the page
 * @param file - the quiz
 */
export async function openQuizAgain(page: Page, file: SeedFile): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) => {
    const request = indexedDB.open("quizzard-quiz");
    request.onsuccess = () => {
      const transaction = request.result.transaction(["quizzes", "media"], "readwrite");
      transaction.objectStore("quizzes").clear();
      transaction.objectStore("media").clear();
      transaction.oncomplete = () => { request.result.close(); resolve(); };
    };
  }));
  await openQuiz(page, file);
}

/**
 * Seeds one quiz and starts Play on its title screen.
 * @param page - the page
 * @param file - the quiz
 */
export async function play(page: Page, file: SeedFile = pubNight()): Promise<void> {
  await openQuiz(page, file);
  await root(page).locator("[data-play-quiz]").click();
  await expect(view(page, "title")).toBeVisible();
}

/** The element that has the focus, as a short description. */
export const focused = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const element = document.activeElement;
    if (!element || element === document.body) return "BODY";
    return element.id !== "" ? `#${element.id}` : `${element.tagName.toLowerCase()}${[...element.attributes].filter((attribute) => attribute.name.startsWith("data-")).map((attribute) => `[${attribute.name}${attribute.value === "" ? "" : `="${attribute.value}"`}]`).join("")}`;
  });

/**
 * No serious or critical axe violation inside the tool.
 * @param page - the page
 * @param name - what is on show, for the message
 */
export async function axe(page: Page, name: string): Promise<void> {
  await page.evaluate(() => Promise.all(document.getAnimations().filter((one) => one.effect?.getComputedTiming().iterations !== Infinity).map((animation) => animation.finished.catch(() => undefined))));
  const result = await new AxeBuilder({ page }).include('[data-miniapp="quiz"]').withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(result.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical").map((violation) => `${name}: ${violation.id} ${violation.nodes.map((node) => node.target.join(" ")).join(" | ")}`)).toEqual([]);
}

/** Every quiz as it is stored. */
export const stored = (page: Page): Promise<{ quiz: { id: string; name: string; rounds: { id: string; name: string; questions: { id: string; kind: string; prompt: string; media?: { id: string } }[] }[] } }[]> =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        const request = indexedDB.open("quizzard-quiz");
        request.onsuccess = () => {
          const all = request.result.transaction("quizzes").objectStore("quizzes").getAll();
          all.onsuccess = () => { request.result.close(); resolve(all.result); };
        };
      }),
  );

/** How many whole lines of an element's text are cut off below its box (0 = everything is on show). */
export const hiddenLines = (element: Element): number => Math.round((element.scrollHeight - element.clientHeight) / parseFloat(getComputedStyle(element).lineHeight));
