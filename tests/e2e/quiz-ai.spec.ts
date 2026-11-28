import { expect, test, type Locator, type Page } from "@playwright/test";
import { axe, root, screen, stored } from "./support/quiz-ux.ts";

// "Make a quiz with AI" (DECISIONS 2026-11-28): the person's own assistant writes the quiz as a draft,
// the creator reads what is pasted — with the sentences and the fence an assistant puts around it — and
// makes the quiz, or lists what must be fixed in words the assistant can act on.
const dialog = (page: Page): Locator => page.locator("[data-ai-dialog]");
const field = (page: Page): Locator => dialog(page).locator("[data-ai-field]");

const DRAFT = {
  name: "Friday quiz",
  language: "bg",
  rounds: [
    { name: "Загрявка", questions: [{ q: "Коя река минава през Париж?", a: "Сена" }, { q: "WC?", options: ["Water Closet", "World Cup"], correct: 1 }, { q: "Луната е планета.", a: false }] },
    { type: "safe", name: "Сейф", questions: [{ q: "1?", digit: 1 }, { q: "2?", digit: 2 }, { q: "3?", digit: 3 }, { q: "4?", digit: 4 }, { q: "5?", digit: 5 }] },
    { type: "laugh", name: "Разсмей водещия", first: 4, second: 2 },
  ],
};

async function open(page: Page): Promise<void> {
  await page.goto("#/quiz");
  await screen(page, "library").waitFor();
  await root(page).locator("[data-ai-open]").click();
  await expect(dialog(page)).toBeVisible();
}

test.describe("Make a quiz with AI", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "the clipboard is read and written here: Chromium grants it to the test");
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("the instructions are copied whole, and the window passes the accessibility check", async ({ page }) => {
    await open(page);
    await dialog(page).locator("[data-ai-copy]").click();
    await expect(dialog(page).locator("[data-ai-status]")).toHaveText("Instructions copied — paste them into your assistant");
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain("# How to make a quiz for Quizzard");
    expect(copied).toContain('"type": "pyramid"');
    await axe(page, "make a quiz with AI");
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
    await expect(root(page).locator("[data-ai-open]")).toBeFocused();
  });

  test("an answer pasted with its sentences and its fence becomes a quiz that is ready to play", async ({ page }) => {
    await open(page);
    const answer = `Ето вашия куиз:\n\n\`\`\`json\n${JSON.stringify(DRAFT, null, 2)}\n\`\`\`\n\nCopy the block, open Quizzard…`;
    await page.evaluate((text) => navigator.clipboard.writeText(text), answer);
    await dialog(page).locator("[data-ai-paste]").click();
    await expect(field(page)).toHaveValue(answer);
    await dialog(page).locator("[data-ai-make]").click();
    await expect(screen(page, "quiz")).toBeVisible();
    await expect(dialog(page)).toBeHidden();
    const quizzes = await stored(page);
    const quiz = quizzes.find((one) => one.quiz.name === "Friday quiz")?.quiz;
    expect(quiz?.language).toBe("bg");
    expect(quiz?.rounds.map((round) => `${round.kind ?? ""}:${String(round.questions.length)}`)).toEqual(["standard:3", "safe:5", "laugh:1"]);
    // The special rounds got the rules text the creator gives them, in the quiz's language, with the draft's numbers.
    expect(quiz?.rounds[1]?.rules).toContain("още 3 бонус точки");
    expect(quiz?.rounds[2]?.rules).toContain("4 точки за първо място, 2 за второ");
    // Nothing is left to finish: Play is offered, not "add a round".
    await expect(root(page).locator("[data-play-quiz]")).toBeFocused();
  });

  test("what cannot be taken is listed for the assistant, copied in one press, and the corrected answer goes through", async ({ page }) => {
    await open(page);
    const broken = { name: "Q", rounds: [{ name: "R", questions: [{ q: "No answer?" }, { q: "Pick", options: ["only"], correct: 1 }] }, { type: "safe", name: "S", questions: [] }] };
    await field(page).fill(JSON.stringify(broken));
    await dialog(page).locator("[data-ai-make]").click();
    const problems = dialog(page).locator("[data-ai-problems]");
    await expect(problems.getByRole("heading")).toHaveText("3 things must be fixed first");
    await expect(problems.getByRole("heading")).toBeFocused();
    await expect(problems.locator("li")).toHaveText([/^Round 1, question 1: The question has no answer\./, /^Round 1, question 2: A multiple-choice question has 2 to 8 options; this one has 1\./, /^Round 2: A "safe" round has exactly 5 questions; this one has 0\./]);
    await problems.locator("[data-ai-copy-problems]").click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied.split("\n")[0]).toBe("Quizzard could not take the quiz. Fix these problems and send the whole quiz again as one JSON code block:");
    expect(copied.split("\n")).toHaveLength(4);
    expect(await stored(page)).toHaveLength(0);
    await field(page).fill(JSON.stringify({ name: "Q", rounds: [{ name: "R", questions: [{ q: "Answer?", a: "Yes" }] }] }));
    await dialog(page).locator("[data-ai-make]").click();
    await expect(screen(page, "quiz")).toBeVisible();
    expect((await stored(page)).map((one) => one.quiz.name)).toEqual(["Q"]);
  });

  test("an empty field and a text without a quiz say what to do, and nothing is made", async ({ page }) => {
    await open(page);
    await dialog(page).locator("[data-ai-make]").click();
    await expect(dialog(page).locator("[data-ai-status]")).toHaveText("Paste the assistant's answer first.");
    await expect(field(page)).toBeFocused();
    await field(page).fill("Sorry, I cannot help with that.");
    await dialog(page).locator("[data-ai-make]").click();
    await expect(dialog(page).locator("[data-ai-status]")).toHaveText("No quiz was found in this text. Copy the assistant's whole answer, with its block of code.");
    expect(await stored(page)).toHaveLength(0);
  });
});
