import { readFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { PICTURES, axe, openQuiz, pubNight, root, screen, stored } from "./support/quiz-ux.ts";

// The AI windows (DECISIONS 2026-11-28): the person's own assistant writes, the creator reads what is
// pasted — with the sentences and the fence an assistant puts around it — and makes a quiz, adds rounds
// or questions, or shows what a check of the answers found. Pictures are fetched from Wikimedia Commons
// (answered here by Playwright: no request leaves the test).
const dialog = (page: Page): Locator => page.locator("[data-ai-dialog]");
const field = (page: Page): Locator => dialog(page).locator("[data-ai-field]");
const status = (page: Page): Locator => dialog(page).locator("[data-ai-status]");
const make = (page: Page): Locator => dialog(page).locator("[data-ai-make]");
const fence = (value: unknown): string => `Here you go:\n\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\`\n\nPress Copy on the block…`;

const DRAFT = {
  name: "Friday quiz",
  language: "bg",
  rounds: [
    { name: "Загрявка", questions: [{ q: "Коя река минава през Париж?", a: "Сена" }, { q: "WC?", options: ["Water Closet", "World Cup"], correct: 1 }, { q: "Луната е планета.", a: false }] },
    { type: "safe", name: "Сейф", questions: [{ q: "1?", digit: 1 }, { q: "2?", digit: 2 }, { q: "3?", digit: 3 }, { q: "4?", digit: 4 }, { q: "5?", digit: 5 }] },
    { type: "laugh", name: "Разсмей водещия", first: 4, second: 2 },
  ],
};

/** The stored quiz files, with their media lists. */
const files = (page: Page): Promise<{ quiz: { id: string; name: string; language: string; rounds: { id: string; name: string; kind: string; rules?: string; questions: { id: string; kind: string; prompt: string; media?: { id: string }; answerMedia?: { id: string } }[] }[] }; media: { id: string; credit?: string; type: string }[] }[]> =>
  page.evaluate(() => new Promise((resolve) => {
    const request = indexedDB.open("quizzard-quiz");
    request.onsuccess = () => {
      const all = request.result.transaction("quizzes").objectStore("quizzes").getAll();
      all.onsuccess = () => { request.result.close(); resolve(all.result as never); };
    };
  }));

async function openNew(page: Page): Promise<void> {
  await page.goto("#/quiz");
  await screen(page, "library").waitFor();
  await root(page).locator("[data-ai-open-quiz]").click();
  await expect(dialog(page)).toBeVisible();
}

/** Picks "Another" assistant: the main button only copies (no tab opens in the test). */
async function onlyCopy(page: Page): Promise<void> {
  await dialog(page).locator('[data-ai-assistant="other"]').click();
}

/** Answers Wikimedia Commons: the files of `known` exist (a picture each), every other name is missing. */
async function fakeCommons(page: Page, known: readonly string[]): Promise<{ readonly asked: string[] }> {
  const asked: string[] = [];
  const picture = readFileSync(PICTURES.landscape);
  await page.route("https://commons.wikimedia.org/w/api.php**", async (route) => {
    const titles = (new URL(route.request().url()).searchParams.get("titles") ?? "").split("|");
    asked.push(...titles);
    const pages = titles.map((title) => (known.includes(title)
      ? { title, imageinfo: [{ mime: "image/jpeg", thumburl: `https://thumb.wikimedia.org/x/${encodeURIComponent(title)}.jpg`, extmetadata: { Artist: { value: "<a href=\"https://x\">Jane <b>Doe</b></a>" }, LicenseShortName: { value: "CC BY-SA 4.0" } } }] }
      : { title, missing: true }));
    await route.fulfill({ json: { query: { pages } }, headers: { "access-control-allow-origin": "*" } });
  });
  await page.route("https://thumb.wikimedia.org/**", (route) => route.fulfill({ body: picture, contentType: "image/jpeg", headers: { "access-control-allow-origin": "*" } }));
  return { asked };
}

test.describe("AI windows", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "the clipboard is read and written here: Chromium grants it to the test");
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("the form's choices go into the prompt, the ⓘ says what a special round is, and the window passes axe", async ({ page }) => {
    await openNew(page);
    await dialog(page).locator("[data-ai-topic]").fill("Bulgarian history");
    await dialog(page).locator("[data-ai-rounds]").selectOption("2");
    await dialog(page).locator("[data-ai-special-safe]").check();
    const info = dialog(page).getByRole("button", { name: "About Safe" });
    await info.click();
    await expect(info).toHaveAttribute("aria-expanded", "true");
    await expect(dialog(page).locator("#quiz-ai-about-data-ai-special-safe")).toHaveText("5 questions, each answered with one digit: the safe's code. All 5 win a bonus.");
    await onlyCopy(page);
    await expect(dialog(page).locator("[data-ai-copy]")).toHaveText("Copy the instructions");
    await dialog(page).locator("[data-ai-copy]").click();
    await expect(status(page)).toHaveText("Instructions copied — paste them into your assistant");
    const prompt = await page.evaluate(() => navigator.clipboard.readText());
    expect(prompt).toContain("- Topic: Bulgarian history");
    expect(prompt).toContain("- 2 standard rounds of 6 questions each");
    expect(prompt).toContain("- Special rounds: Safe");
    expect(prompt).toContain("Do not ask about them: write the quiz now.");
    await axe(page, "make a quiz with AI");
    // The choices are kept for the next window.
    await page.keyboard.press("Escape");
    await root(page).locator("[data-ai-open-quiz]").click();
    await expect(dialog(page).locator("[data-ai-topic]")).toHaveValue("Bulgarian history");
    await expect(dialog(page).locator("[data-ai-special-safe]")).toBeChecked();
  });

  test("nothing chosen: no prompt is copied and the window says why", async ({ page }) => {
    await openNew(page);
    await dialog(page).locator("[data-ai-rounds]").selectOption("0");
    await onlyCopy(page);
    await dialog(page).locator("[data-ai-copy]").click();
    await expect(status(page)).toHaveText("Choose at least one round.");
  });

  test("an answer pasted with its sentences and its fence becomes a quiz that is ready to play", async ({ page }) => {
    await openNew(page);
    await page.evaluate((text) => navigator.clipboard.writeText(text), fence(DRAFT));
    await dialog(page).locator("[data-ai-paste]").click();
    await make(page).click();
    await expect(screen(page, "quiz")).toBeVisible();
    const quiz = (await files(page)).find((one) => one.quiz.name === "Friday quiz")?.quiz;
    expect(quiz?.language).toBe("bg");
    expect(quiz?.rounds.map((round) => `${round.kind}:${String(round.questions.length)}`)).toEqual(["standard:3", "safe:5", "laugh:1"]);
    expect(quiz?.rounds[1]?.rules).toContain("още 3 бонус точки");
    expect(quiz?.rounds[2]?.rules).toContain("4 точки за първо място, 2 за второ");
    await expect(root(page).locator("[data-play-quiz]")).toBeFocused();
  });

  test("pictures: one request to Commons, a made-up name goes back to the assistant, the real ones come with their credit", async ({ page }) => {
    const commons = await fakeCommons(page, ["File:Paris.jpg"]);
    await openNew(page);
    const draft = { name: "Pictures", rounds: [{ name: "R", questions: [{ q: "Which city?", a: "Paris", picture: "File:Paris.jpg" }, { q: "Which tower?", a: "Eiffel", answerPicture: "File:Made up tower.jpg" }] }] };
    await field(page).fill(fence(draft));
    await make(page).click();
    const problems = dialog(page).locator("[data-ai-problems]");
    await expect(problems.locator("li")).toHaveText([/^Round 1, question 2: There is no file "File:Made up tower.jpg" on Wikimedia Commons\./]);
    expect(commons.asked).toEqual(["File:Paris.jpg", "File:Made up tower.jpg"]);
    expect(await files(page)).toHaveLength(0);
    draft.rounds[0]?.questions.splice(1, 1);
    // The person's own paste (keys, not the Paste button) after a refused answer takes its place too.
    await page.evaluate((text) => navigator.clipboard.writeText(text), fence(draft));
    await field(page).focus();
    await page.keyboard.press("ControlOrMeta+V");
    await expect(field(page)).toHaveValue(fence(draft));
    await make(page).click();
    await expect(screen(page, "quiz")).toBeVisible();
    const [made] = await files(page);
    expect(made?.quiz.rounds[0]?.questions[0]).toMatchObject({ kind: "picture", media: { id: made?.media[0]?.id } });
    expect(made?.media[0]?.credit).toBe("Jane Doe · CC BY-SA 4.0 · Wikimedia Commons");
  });

  test("no connection: the pictures cannot be fetched, the window says so and nothing is made", async ({ page }) => {
    await page.route("https://commons.wikimedia.org/**", (route) => route.abort("internetdisconnected"));
    await openNew(page);
    await field(page).fill(fence({ name: "P", rounds: [{ name: "R", questions: [{ q: "?", a: "!", picture: "File:Paris.jpg" }] }] }));
    await make(page).click();
    await expect(status(page)).toHaveText(/^The pictures could not be downloaded: no connection\./);
    expect(await files(page)).toHaveLength(0);
  });

  test("what cannot be taken is listed in the app's language and copied in one press; the corrected answer goes through", async ({ page }) => {
    await openNew(page);
    const broken = { name: "Q", rounds: [{ name: "R", questions: [{ q: "No answer?" }, { q: "Pick", options: ["only"], correct: 1 }] }, { type: "safe", name: "S", questions: [] }] };
    await field(page).fill(JSON.stringify(broken));
    await make(page).click();
    const problems = dialog(page).locator("[data-ai-problems]");
    await expect(problems.getByRole("heading")).toHaveText("3 things must be fixed first");
    await expect(problems.getByRole("heading")).toBeFocused();
    await problems.locator("[data-ai-copy-problems]").click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied.split("\n")[0]).toBe("Quizzard could not take the quiz. Fix these problems and send the whole quiz again (in several code blocks if it is long, as before):");
    expect(copied.split("\n")).toHaveLength(4);
    // After a refused answer, Paste puts the corrected one in its place (not after it).
    await page.evaluate((text) => navigator.clipboard.writeText(text), JSON.stringify({ name: "Q", rounds: [{ name: "R", questions: [{ q: "Answer?", a: "Yes" }] }] }));
    await dialog(page).locator("[data-ai-paste]").click();
    await expect(field(page)).not.toHaveValue(/No answer\?/);
    await expect(make(page)).toBeFocused();
    await make(page).click();
    await expect(screen(page, "quiz")).toBeVisible();
    expect((await stored(page)).map((one) => one.quiz.name)).toEqual(["Q"]);
  });

  test("an empty field, a text without an answer and a cut-off answer say what to do", async ({ page }) => {
    await openNew(page);
    await make(page).click();
    await expect(status(page)).toHaveText("Paste the assistant's answer first.");
    await expect(field(page)).toBeFocused();
    await field(page).fill("Sorry, I cannot help with that.");
    await make(page).click();
    await expect(status(page)).toHaveText(/^No answer for Quizzard was found in this text\./);
    await field(page).fill('{ "name": "Q", "rounds": [{ "name": "R", "questions": [{ "q": "Cut off he');
    await make(page).click();
    await expect(status(page)).toHaveText(/^A part of the answer is cut off/);
    expect(await stored(page)).toHaveLength(0);
  });

  test("selecting text in the field and letting go outside the window does not close it", async ({ page, isMobile }) => {
    test.skip(isMobile, "a mouse's drag");
    await openNew(page);
    await field(page).fill("some pasted text");
    const box = await field(page).boundingBox();
    if (!box) throw new Error("no field");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(5, 5);
    await page.mouse.up();
    await expect(dialog(page)).toBeVisible();
    await expect(field(page)).toHaveValue("some pasted text");
  });

  test("rounds added with AI come after the quiz's own, the prompt names what it has, and Undo takes them away", async ({ page }) => {
    await openQuiz(page, pubNight());
    await root(page).locator("[data-ai-open-rounds]").click();
    await onlyCopy(page);
    await dialog(page).locator("[data-ai-copy]").click();
    const prompt = await page.evaluate(() => navigator.clipboard.readText());
    expect(prompt).toContain("## The quiz so far");
    expect(prompt).toContain("ALL the new rounds as one LIST");
    await field(page).fill(fence([{ name: "Extra", questions: [{ q: "New?", a: "yes" }] }]));
    await make(page).click();
    await expect(dialog(page)).toBeHidden();
    const names = async (): Promise<string[]> => ((await stored(page))[0]?.quiz.rounds ?? []).map((round) => round.name);
    await expect.poll(names).toEqual(["History", "Music", "Extra"]);
    await page.locator("[data-toasts]").getByRole("button", { name: "Undo" }).click();
    await expect.poll(names).toEqual(["History", "Music"]);
  });

  test("questions added with AI go to the end of the round, with the round's time and points", async ({ page }) => {
    await openQuiz(page, pubNight());
    await root(page).locator('[data-focus="round:r1"]').click();
    await root(page).locator("[data-ai-open-questions]").click();
    await expect(dialog(page).locator("[data-ai-rounds]")).toHaveCount(0);
    await field(page).fill(fence({ questions: [{ q: "Added one?", a: "yes" }, { q: "Added two?", options: ["a", "b"], correct: 2 }] }));
    await make(page).click();
    await expect(dialog(page)).toBeHidden();
    await expect.poll(async () => ((await stored(page))[0]?.quiz.rounds[0]?.questions ?? []).map((question) => question.prompt).slice(-2)).toEqual(["Added one?", "Added two?"]);
  });

  test("the check lists what the assistant doubts, and opens the question", async ({ page }) => {
    await openQuiz(page, pubNight());
    await root(page).locator("[data-ai-open-check]").click();
    await expect(dialog(page).locator("[data-ai-topic]")).toHaveCount(0);
    await onlyCopy(page);
    await dialog(page).locator("[data-ai-copy]").click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("## The quiz: Pub night");
    await field(page).fill(fence({ check: [{ round: 1, question: 1, problem: "The Seine flows through Paris; the answer is right but misspelt.", suggestion: "The Seine" }, { round: 2, question: 0, problem: "Two questions ask the same thing.", suggestion: "" }] }));
    await make(page).click();
    const found = dialog(page).locator("[data-ai-findings]");
    await expect(found.getByRole("heading")).toHaveText("2 things to look at");
    await expect(found.locator("li").nth(1)).toContainText("Round 2");
    await expect(found.locator("li").nth(1).getByRole("button")).toHaveCount(0);
    await found.getByRole("button", { name: "Open the question" }).click();
    await expect(screen(page, "editor")).toBeVisible();
  });

  test("a text shared with the installed app opens Make a quiz with AI with the text in it", async ({ page }) => {
    await page.goto("#/quiz");
    await screen(page, "library").waitFor();
    // What the service worker does with the system's share (scripts/share-target.ts): the text in one cache entry.
    await page.evaluate(async (text) => { await (await caches.open("quizzard-shared")).put("shared-text", new Response(text)); }, fence(DRAFT));
    await page.goto("#/quiz?shared=1");
    await expect(dialog(page)).toBeVisible();
    await expect(field(page)).toHaveValue(fence(DRAFT));
    await expect(status(page)).toHaveText("Text shared from another app is below. Press “Make the quiz”.");
    await make(page).click();
    await expect(screen(page, "quiz")).toBeVisible();
    expect(await page.evaluate(async () => (await (await caches.open("quizzard-shared")).match("shared-text")) === undefined)).toBe(true);
  });

  test("a shared answer goes to the window its instructions came from: Write rounds in its quiz", async ({ page }) => {
    await openQuiz(page, pubNight());
    await root(page).locator("[data-ai-open-rounds]").click();
    await onlyCopy(page);
    await dialog(page).locator("[data-ai-copy]").click();
    await page.keyboard.press("Escape");
    await screen(page, "quiz").waitFor();
    await page.evaluate(async (text) => { await (await caches.open("quizzard-shared")).put("shared-text", new Response(text)); }, fence([{ name: "Shared round", questions: [{ q: "Shared?", a: "yes" }] }]));
    await page.goto("#/quiz?shared=1");
    await expect(dialog(page)).toBeVisible();
    await expect(status(page)).toHaveText("Text shared from another app is below. Press “Add the rounds”.");
    await make(page).click();
    await expect(dialog(page)).toBeHidden();
    await expect.poll(async () => ((await stored(page))[0]?.quiz.rounds ?? []).map((round) => round.name)).toEqual(["History", "Music", "Shared round"]);
  });

  test("closing the window while pictures load stops the job: nothing is made", async ({ page }) => {
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => { release = resolve; });
    await page.route("https://commons.wikimedia.org/w/api.php**", async (route) => {
      await held;
      await route.fulfill({ json: { query: { pages: [{ title: "File:Paris.jpg", imageinfo: [{ mime: "image/jpeg", thumburl: "https://thumb.wikimedia.org/x/p.jpg" }] }] } }, headers: { "access-control-allow-origin": "*" } }).catch(() => undefined);
    });
    await page.route("https://thumb.wikimedia.org/**", (route) => route.fulfill({ body: readFileSync(PICTURES.landscape), contentType: "image/jpeg", headers: { "access-control-allow-origin": "*" } }));
    await openNew(page);
    await field(page).fill(fence({ name: "Stopped", rounds: [{ name: "R", questions: [{ q: "?", a: "!", picture: "File:Paris.jpg" }] }] }));
    await make(page).click();
    await expect(status(page)).toHaveText(/^Downloading pictures…/);
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
    release();
    await page.waitForTimeout(500);
    expect(await files(page)).toHaveLength(0);
    await expect(screen(page, "library")).toBeVisible();
  });

  test("the service worker takes the system's share on the device and keeps the text for the creator", async ({ page }) => {
    await page.goto("#/quiz");
    await screen(page, "library").waitFor();
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await screen(page, "library").waitFor();
    expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
    // What Android sends when "Share" in another app picks Quizzard (manifest share_target).
    const landed = await page.evaluate(async () => {
      const form = new FormData();
      form.append("title", "Quiz");
      form.append("text", "{ \"name\": \"Shared\", \"rounds\": [] }");
      const response = await fetch(`${location.pathname}share-target`, { method: "POST", body: form });
      return response.url;
    });
    expect(new URL(landed).pathname).toMatch(/\/Quizzard\/(?:index\.html)?$/);
    expect(await page.evaluate(async () => (await (await caches.open("quizzard-shared")).match("shared-text"))?.text())).toBe("Quiz\n\n{ \"name\": \"Shared\", \"rounds\": [] }");
  });
});
