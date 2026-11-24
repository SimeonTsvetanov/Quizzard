import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Quiz creator, slice 1 (docs/quiz-creator SPEC F1–F6, F8; AC1 for text, AC2, AC3): what a person does
// on its screens. Storage, routes and formats are unit tested (miniapps/quiz/packages/miniapp/test).
const root = (page: Page) => page.locator('[data-miniapp="quiz"]');
const screen = (page: Page, name: string) => root(page).locator(`[data-screen="${name}"]`);
const cards = (page: Page) => root(page).locator(".quiz-card");
const roundCards = (page: Page) => root(page).locator("[data-round-card]");
const questions = (page: Page) => root(page).locator("[data-question]");
const form = (page: Page) => root(page).locator(".quiz-form");
const liveSlide = (page: Page) => root(page).locator("[data-live-slide]");
const toast = (page: Page) => page.getByRole("status").filter({ hasText: /deleted|изтрит/ });
const back = (page: Page) => page.getByRole("banner").getByRole("button", { name: "Back to Home" });
const isWide = (page: Page): boolean => (page.viewportSize()?.width ?? 0) >= 700;

/** The quizzes as they are stored: straight from the creator's IndexedDB database. */
const stored = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<{ quiz: { name: string; rounds: { name: string; defaults: { seconds: number }; questions: { prompt: string; seconds?: number; points?: { value: number; note?: string }; answer: { type: string } }[] }[] } }[]>((resolve) => {
        const request = indexedDB.open("quizzard-quiz");
        request.onsuccess = () => {
          const all = request.result.transaction("quizzes").objectStore("quizzes").getAll();
          all.onsuccess = () => {
            request.result.close();
            resolve(all.result);
          };
        };
      }),
  );

/**
 * The time limit of a flow of forty steps and more with toasts to wait out: the 30 s of a single check were used up
 * on CI's WebKit before the flow was over, at a different step on every try (run 45430916307). The 5 s of every
 * single expectation stay as they are.
 */
const LONG_FLOW_MS = 90_000;

const noSidewaysScroll = async (page: Page): Promise<void> => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
};

async function open(page: Page): Promise<void> {
  await page.goto("./#/quiz");
  await expect(root(page).getByRole("heading", { name: "Your quizzes" })).toBeVisible();
}

async function newQuiz(page: Page, name: string): Promise<void> {
  // "New quiz" asks for the name first and creates nothing until it is confirmed (UX review S16).
  await root(page).getByRole("button", { name: "New quiz" }).click();
  await expect(root(page).getByLabel("Quiz name")).toBeFocused();
  await root(page).getByLabel("Quiz name").fill(name);
  await page.keyboard.press("Enter");
  await expect(root(page).getByRole("button", { name: "Add round" })).toBeFocused();
}

/** From a round (a screen of its own on a phone) back to the quiz with its rounds. */
async function toQuiz(page: Page): Promise<void> {
  if (!isWide(page)) await root(page).locator("[data-up]:visible").first().click();
  await expect(root(page).getByRole("button", { name: "Add round" })).toBeVisible();
}

async function addRound(page: Page, name: string): Promise<void> {
  const count = await roundCards(page).count();
  await root(page).getByRole("button", { name: "Add round" }).click();
  await root(page).getByLabel(`Name of round ${String(count + 1)}`).fill(name);
}

/** Adds a question to the open round and leaves the editor open on it. */
async function addQuestion(page: Page, prompt: string, answerType?: "Multiple choice" | "True / false"): Promise<void> {
  await root(page).getByRole("button", { name: "Add question" }).click();
  await expect(root(page).getByLabel("Question", { exact: true })).toBeFocused();
  await root(page).getByLabel("Question", { exact: true }).fill(prompt);
  if (answerType) await form(page).getByText(answerType, { exact: true }).click();
}

const done = async (page: Page): Promise<void> => {
  await root(page).getByRole("button", { name: "Done" }).click();
  await expect(root(page).getByRole("button", { name: "Add question" })).toBeVisible();
};

const option = (page: Page, letter: string): Locator => root(page).getByLabel(`Option ${letter}`, { exact: true });

/** A quiz "Pub night" with the round "History" open and one open question in it. */
async function seed(page: Page): Promise<void> {
  await open(page);
  await newQuiz(page, "Pub night");
  await addRound(page, "History");
  await addQuestion(page, "Which river flows through Paris?");
  await root(page).getByLabel("Answer", { exact: true }).fill("The Seine");
  await done(page);
}

test("opens from Home as an empty library: the wizard, one line and “New quiz”", async ({ page }) => {
  await page.goto("./");
  await page.locator('[data-card="quiz"]').click();
  await expect(page).toHaveURL(/#\/quiz$/);
  await expect(root(page).getByRole("heading", { name: "Your quizzes" })).toBeVisible();
  await expect(root(page).getByText("No quizzes yet")).toBeVisible();
  await expect(root(page).locator(".quiz-empty img")).toBeVisible();
  await expect(root(page).getByRole("button", { name: "New quiz" })).toBeVisible();
  await expect(cards(page)).toHaveCount(0);
  expect(await stored(page)).toEqual([]);
  await noSidewaysScroll(page);
});

test.describe("on a 390 px phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("AC1 (text): a quiz with 3 rounds and a question of every answer type, no sideways scroll on any screen, there after a reload", async ({ page }) => {
    test.setTimeout(LONG_FLOW_MS);
    await open(page);
    await newQuiz(page, "Pub night");
    await noSidewaysScroll(page);
    await addRound(page, "History");
    await noSidewaysScroll(page);
    await addQuestion(page, "Which river flows through Paris?");
    await root(page).getByLabel("Answer", { exact: true }).fill("The Seine");
    await noSidewaysScroll(page);
    await done(page);
    await addQuestion(page, "Which of these are planets?", "Multiple choice");
    await option(page, "A").fill("Mars");
    await option(page, "B").fill("Europa");
    await root(page).getByRole("button", { name: "Add option" }).click();
    await option(page, "C").fill("Venus");
    await root(page).getByLabel("Option A is correct").check({ force: true });
    await root(page).getByLabel("Option C is correct").check({ force: true }); // several may be correct
    await noSidewaysScroll(page);
    await done(page);
    await addQuestion(page, "The Great Wall is visible from the Moon.", "True / false");
    await form(page).getByText("False", { exact: true }).click();
    await root(page).getByRole("button", { name: "Preview", exact: true }).click(); // the live slide over the form
    await expect(liveSlide(page)).toBeVisible();
    await noSidewaysScroll(page);
    await done(page);
    await expect(questions(page)).toHaveCount(3);
    await noSidewaysScroll(page);
    await toQuiz(page);
    await addRound(page, "Music");
    await toQuiz(page);
    await addRound(page, "Sport");
    await toQuiz(page);
    await expect(roundCards(page)).toHaveCount(3);
    await expect(root(page).locator("[data-total-questions]")).toHaveText("3");
    await noSidewaysScroll(page);
    await expect(page.getByRole("banner").getByRole("status")).toContainText("Saved");
    await page.reload();
    await expect(roundCards(page)).toHaveCount(3); // the same screen, read from the device
    await expect(roundCards(page).nth(0)).toContainText("History");
    await expect(roundCards(page).nth(0)).toContainText("3 questions");
    const [saved] = await stored(page);
    expect(saved?.quiz.rounds.map((round) => round.name)).toEqual(["History", "Music", "Sport"]);
    expect(saved?.quiz.rounds[0]?.questions.map((question) => question.answer.type)).toEqual(["open", "choice", "trueFalse"]);
    expect(saved?.quiz.rounds[0]?.questions[1]?.answer).toMatchObject({ options: [{ text: "Mars" }, { text: "Europa" }, { text: "Venus" }] });
    expect(saved?.quiz.rounds[0]?.questions[2]?.answer).toMatchObject({ correct: false });
    await page.goBack();
    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page).first()).toContainText("Pub night");
    await expect(cards(page).first()).toContainText("3 rounds · 3 questions · 2 min");
    await noSidewaysScroll(page);
  });

  test("the preview shows each question as a slide; arrows move through the quiz and “Show answer” reveals", async ({ page }) => {
    await seed(page);
    await addQuestion(page, "Is water wet?", "True / false");
    await done(page);
    await questions(page).nth(0).getByRole("button", { name: "More for question 1" }).click(); // Preview is in the card's "More" list
    await root(page).getByRole("dialog").getByRole("button", { name: "Preview" }).click();
    const slide = root(page).locator("[data-preview-slide]");
    await expect(slide).toContainText("Which river flows through Paris?");
    await expect(slide).not.toContainText("The Seine");
    await noSidewaysScroll(page);
    await root(page).getByRole("button", { name: "Show answer" }).click();
    await expect(slide).toContainText("The Seine");
    await root(page).getByRole("button", { name: "Next" }).click();
    await expect(slide).toContainText("Is water wet?");
    await expect(root(page).getByRole("button", { name: "Next" })).toBeDisabled();
    await page.keyboard.press("ArrowLeft");
    await expect(slide).toContainText("Which river flows through Paris?");
    await root(page).getByRole("button", { name: "Close preview" }).click();
    await expect(questions(page)).toHaveCount(2);
  });
});

test("AC2: a question shows the round's time until changed, then keeps its own when the round changes", async ({ page }) => {
  await seed(page);
  await addQuestion(page, "Second question");
  await done(page);
  // Question 1 gets its own time.
  await questions(page).nth(0).getByRole("button", { name: /^Question 1/ }).click();
  const time = root(page).locator('[data-timing="time"]');
  await expect(time.getByLabel("Seconds", { exact: true })).toHaveValue("30");
  await expect(time.getByText("From the round")).toBeVisible();
  await time.getByLabel("Seconds", { exact: true }).fill("45");
  await expect(time.getByText("From the round")).toBeHidden();
  await expect(time.getByRole("button", { name: "Back to the round's: 30 s" })).toBeVisible();
  await expect(liveSlide(page).locator("[data-slide-time]")).toHaveText("45 s");
  await done(page);
  // The round's default changes: question 2 follows, question 1 keeps its own.
  await root(page).locator("[data-round-settings] summary").click();
  await root(page).locator("[data-round-settings]").getByLabel("Seconds", { exact: true }).fill("60");
  await expect(questions(page).nth(0).locator("[data-slide-time]")).toHaveText("45 s");
  await expect(questions(page).nth(1).locator("[data-slide-time]")).toHaveText("60 s");
  await expect.poll(async () => (await stored(page))[0]?.quiz.rounds[0]?.questions.map((question) => question.seconds)).toEqual([45, undefined]);
  // Polled: the save is debounced, and the questions above already matched before this change was written.
  await expect.poll(async () => (await stored(page))[0]?.quiz.rounds[0]?.defaults.seconds).toBe(60);
  // The way back to the round's value.
  await questions(page).nth(0).getByRole("button", { name: /^Question 1/ }).click();
  await time.getByRole("button", { name: "Back to the round's: 60 s" }).click();
  await expect(time.getByLabel("Seconds", { exact: true })).toHaveValue("60");
  await expect(time.getByText("From the round")).toBeVisible();
  await expect.poll(async () => (await stored(page))[0]?.quiz.rounds[0]?.questions[0]?.seconds).toBeUndefined();
});

test("AC3: points are a number, a note, or both — each is on the slide", async ({ page }) => {
  await seed(page);
  const points = (n: number) => questions(page).nth(n).locator("[data-slide-points]");
  await expect(points(0)).toHaveText("1 point"); // from the round
  await questions(page).nth(0).getByRole("button", { name: /^Question 1/ }).click();
  const fields = root(page).locator('[data-timing="points"]');
  await expect(fields.getByText("From the round")).toBeVisible();
  await fields.getByLabel("Points (a number)").fill("3");
  await expect(liveSlide(page).locator("[data-slide-points]")).toHaveText("3 points");
  await fields.getByLabel("Points note").fill("1 for the band, 2 with the song");
  await expect(liveSlide(page).locator("[data-slide-points]")).toHaveText("3 points · 1 for the band, 2 with the song");
  await fields.getByLabel("Points (a number)").fill("");
  await expect(liveSlide(page).locator("[data-slide-points]")).toHaveText("1 for the band, 2 with the song");
  await done(page);
  await expect(points(0)).toHaveText("1 for the band, 2 with the song");
  await expect.poll(async () => (await stored(page))[0]?.quiz.rounds[0]?.questions[0]?.points).toEqual({ value: 0, note: "1 for the band, 2 with the song" });
  // The round's own points take a note too, and a question without its own shows them.
  await root(page).locator("[data-round-settings] summary").click();
  await root(page).locator("[data-round-settings]").getByLabel("Points (a number)").fill("2");
  await root(page).locator("[data-round-settings]").getByLabel("Points note").fill("half for the year");
  await addQuestion(page, "When was the Battle of Hastings?");
  await expect(liveSlide(page).locator("[data-slide-points]")).toHaveText("2 points · half for the year");
});

test("limits explain themselves: 8 options at most, 2 at least", async ({ page }) => {
  await seed(page);
  await addQuestion(page, "Pick one", "Multiple choice");
  const options = root(page).locator(".quiz-option");
  await expect(options).toHaveCount(2);
  await expect(root(page).getByRole("button", { name: "Remove option A" })).toBeDisabled();
  await expect(root(page).getByText("2 to 8 options. Tick every correct one — there can be several.")).toBeVisible();
  const add = root(page).locator("[data-add-option]");
  for (let count = 3; count <= 8; count += 1) {
    await add.click();
    await expect(options).toHaveCount(count);
    await expect(option(page, String.fromCharCode(64 + count))).toBeFocused();
  }
  await expect(add).toHaveText("8 options at most");
  await expect(add).toHaveAttribute("aria-disabled", "true");
  await add.click({ force: true }); // it says why it does nothing; Playwright would wait for it to be enabled
  await expect(options).toHaveCount(8);
  await expect(liveSlide(page).locator(".quiz-slide-option")).toHaveCount(8);
  await root(page).getByRole("button", { name: "Remove option H" }).click();
  await expect(options).toHaveCount(7);
  await expect(add).toHaveText("Add option");
  // What was typed under one answer type is still there after a look at another.
  await option(page, "A").fill("Kept");
  await form(page).getByText("Open answer", { exact: true }).click();
  await form(page).getByText("Multiple choice", { exact: true }).click();
  await expect(option(page, "A")).toHaveValue("Kept");
  await expect(options).toHaveCount(7);
});

test("pictures, audio and video are in the kind picker and can be chosen: each brings its file picker", async ({ page }) => {
  await seed(page);
  await questions(page).nth(0).getByRole("button", { name: /^Question 1/ }).click();
  const kinds = root(page).getByRole("group", { name: "Kind of question" });
  await expect(kinds.getByRole("radio", { name: "Text" })).toBeChecked();
  for (const [name, choose] of [["Picture", "Choose a picture"], ["Audio", "Choose an audio file"], ["Video", "Choose a video"]] as const) {
    await expect(root(page).getByRole("group", { name: "Kind of question" }).getByRole("radio", { name })).toBeEnabled();
    await root(page).getByRole("group", { name: "Kind of question" }).locator("label", { hasText: name }).click();
    await expect(root(page).getByRole("group", { name: "Kind of question" }).getByRole("radio", { name })).toBeChecked();
    await expect(root(page).getByRole("button", { name: new RegExp(`^${choose}`) })).toBeVisible();
  }
  await expect(root(page).getByRole("group", { name: "Kind of question" })).not.toContainText("Soon");
});

test("deletes: a question goes at once with Undo; a round and a quiz with something in them ask first, then offer Undo", async ({ page }) => {
  test.setTimeout(LONG_FLOW_MS);
  await seed(page);
  await addQuestion(page, "Second question");
  await done(page);
  // A question.
  await questions(page).nth(0).getByRole("button", { name: "Delete question 1" }).click();
  await expect(questions(page)).toHaveCount(1);
  await expect(questions(page).nth(0)).toContainText("Second question");
  await toast(page).getByRole("button", { name: "Undo" }).click();
  await expect(questions(page)).toHaveCount(2);
  await expect(questions(page).nth(0)).toContainText("Which river flows through Paris?");
  // A round with questions.
  await root(page).locator("[data-round-settings] summary").click();
  await root(page).getByRole("button", { name: "Delete round" }).click();
  const alert = page.getByRole("alertdialog");
  await expect(alert).toContainText("Delete “History”?");
  await expect(alert).toContainText("The round and its 2 questions will be deleted.");
  await alert.getByRole("button", { name: "Cancel" }).click();
  await expect(questions(page)).toHaveCount(2);
  await root(page).getByRole("button", { name: "Delete round" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete round" }).click();
  await expect(roundCards(page)).toHaveCount(0);
  await expect(root(page).getByText("No rounds yet")).toBeVisible();
  await toast(page).getByRole("button", { name: "Undo" }).click();
  await expect(questions(page)).toHaveCount(2);
  await expect.poll(async () => (await stored(page))[0]?.quiz.rounds[0]?.questions.length).toBe(2);
  // The quiz, from the library.
  await toQuiz(page);
  await root(page).getByRole("button", { name: "Your quizzes" }).click();
  await root(page).getByRole("button", { name: "Delete Pub night" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete quiz" }).click();
  await expect(cards(page)).toHaveCount(0);
  await expect(root(page).getByText("No quizzes yet")).toBeVisible();
  expect(await stored(page)).toEqual([]);
  await toast(page).getByRole("button", { name: "Undo" }).click();
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first()).toContainText("1 round · 2 questions");
});

test("library: rename in place, duplicate, and an empty quiz is deleted without a question", async ({ page }) => {
  await seed(page);
  await toQuiz(page);
  await root(page).getByRole("button", { name: "Your quizzes" }).click();
  await root(page).getByRole("button", { name: "Rename Pub night" }).click();
  await root(page).getByLabel("Quiz name").fill("Friday quiz");
  await root(page).getByLabel("Quiz name").press("Enter");
  await expect(cards(page).first()).toContainText("Friday quiz");
  await root(page).getByRole("button", { name: "Duplicate Friday quiz" }).click();
  await expect(cards(page)).toHaveCount(2);
  await expect(cards(page).first()).toContainText("Friday quiz (copy)");
  await expect(cards(page).first()).toContainText("1 round · 1 question");
  await root(page).getByRole("button", { name: "New quiz" }).click();
  await root(page).getByRole("button", { name: "Create quiz" }).click(); // no name typed: it gets the default one
  await expect(root(page).getByLabel("Quiz name")).toHaveValue("New quiz");
  await page.goBack();
  await expect(cards(page)).toHaveCount(3);
  await root(page).getByRole("button", { name: "Delete New quiz" }).click(); // nothing in it: no question asked
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(cards(page)).toHaveCount(2);
});

test("the Back button walks the screens: editor → round → quiz → library → Home; “Back to Home” leaves in one step", async ({ page }) => {
  test.setTimeout(LONG_FLOW_MS);
  await page.goto("./");
  await page.locator('[data-card="quiz"]').click();
  await newQuiz(page, "Pub night");
  await addRound(page, "History");
  await addQuestion(page, "Which river flows through Paris?");
  await expect(screen(page, "editor")).toBeVisible();
  await expect(page).toHaveURL(/#\/quiz$/); // the address never changes inside the tool
  await page.goBack();
  await expect(screen(page, "round")).toBeVisible();
  await expect(questions(page).first().getByRole("button", { name: /^Question 1/ })).toBeFocused(); // back on the card
  // What was typed just before Back is saved.
  await expect.poll(async () => (await stored(page))[0]?.quiz.rounds[0]?.questions[0]?.prompt).toBe("Which river flows through Paris?");
  if (!isWide(page)) {
    // On a phone the round is a screen of its own; on a wide screen it is a pane of the quiz.
    await page.goBack();
    await expect(screen(page, "quiz")).toBeVisible();
    await expect(roundCards(page).first().locator(".quiz-round-open")).toBeFocused();
  }
  await page.goBack();
  await expect(screen(page, "library")).toBeVisible();
  await expect(cards(page).first()).toContainText("Pub night");
  await page.goBack();
  await expect(page.locator("[data-view=home]")).toBeVisible();
  await expect(page).not.toHaveURL(/#\/quiz/);
  // Forward again, deep into the tool, then the header's Back: Home in one step, over every screen of the tool.
  await page.goForward();
  await expect(screen(page, "library")).toBeVisible();
  await cards(page).first().getByRole("button", { name: /Pub night/ }).first().click();
  await roundCards(page).first().locator(".quiz-round-open").click();
  await questions(page).first().getByRole("button", { name: /^Question 1/ }).click();
  await expect(screen(page, "editor")).toBeVisible();
  await back(page).click();
  await expect(page.locator("[data-view=home]")).toBeVisible();
  await expect(page).not.toHaveURL(/#\/quiz/);
  expect(await page.evaluate((): unknown => Reflect.get(history.state ?? {}, "quizzardSub"))).toBeUndefined(); // Home's own entry, not a replaced one
  await page.locator('[data-card="quiz"]').click();
  await expect(screen(page, "library")).toBeVisible(); // a fresh visit starts at the library
  // The "‹ Your quizzes" link is the same move as Back: afterwards one Back is Home.
  await cards(page).first().getByRole("button", { name: /Pub night/ }).first().click();
  await roundCards(page).first().locator(".quiz-round-open").click();
  await toQuiz(page);
  await root(page).getByRole("button", { name: "Your quizzes" }).click();
  await expect(screen(page, "library")).toBeVisible();
  await page.goBack();
  await expect(page.locator("[data-view=home]")).toBeVisible();
});

test("a reload stays on the screen it was on, and typing just before it is not lost", async ({ page }) => {
  await seed(page);
  await questions(page).nth(0).getByRole("button", { name: /^Question 1/ }).click();
  await root(page).getByLabel("Question", { exact: true }).fill("Typed and reloaded at once");
  await page.reload(); // sooner than the save delay: the change is kept as the page goes and stored at the start
  await expect(screen(page, "editor")).toBeVisible();
  await expect(root(page).getByLabel("Question", { exact: true })).toHaveValue("Typed and reloaded at once");
  await page.goBack();
  await expect(questions(page).nth(0)).toContainText("Typed and reloaded at once");
  await expect.poll(async () => (await stored(page))[0]?.quiz.rounds[0]?.questions[0]?.prompt).toBe("Typed and reloaded at once");
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith("quizzard-quiz:")))).toEqual([]);
});

test("Bulgarian: every screen speaks it, with the decimal comma", async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem("quizzard:v1:lang", '"bg"');
      sessionStorage.setItem("seeded", "1");
    }
  });
  await page.goto("./#/quiz");
  await expect(root(page).getByRole("heading", { name: "Вашите куизове" })).toBeVisible();
  await expect(root(page).getByText("Още няма куизове")).toBeVisible();
  await root(page).getByRole("button", { name: "Нов куиз" }).click();
  await root(page).getByRole("button", { name: "Създай куиза" }).click();
  await expect(root(page).getByLabel("Име на куиза")).toHaveValue("Нов куиз");
  await root(page).getByRole("button", { name: "Добави рунд" }).click();
  await expect(root(page).getByLabel("Име на рунд 1")).toHaveValue("Рунд 1");
  await root(page).getByRole("button", { name: "Добави въпрос" }).click();
  await root(page).getByLabel("Въпрос", { exact: true }).fill("Коя река минава през Париж?");
  await root(page).getByRole("group", { name: "Вид на въпроса" }).locator("label", { hasText: "Снимка" }).click();
  await expect(root(page).getByRole("button", { name: /^Избери снимка/ })).toContainText("JPEG, PNG, WebP или GIF · до 15 MB");
  await root(page).getByRole("group", { name: "Вид на въпроса" }).locator("label", { hasText: "Текст" }).click();
  await form(page).getByText("Избор от няколко", { exact: true }).click();
  await expect(root(page).getByText("От 2 до 8 възможности. Отбележете всяка вярна — може да са няколко.")).toBeVisible();
  const points = root(page).locator('[data-timing="points"]');
  await expect(points.getByText("От рунда")).toBeVisible();
  await points.getByLabel("Точки (число)").fill("0,5");
  await expect(liveSlide(page).locator("[data-slide-points]")).toHaveText("0,5 точки");
  await expect(liveSlide(page).locator("[data-slide-time]")).toHaveText("30 сек");
  await root(page).getByRole("button", { name: "Готово" }).click();
  await expect(questions(page).first()).toContainText("Коя река минава през Париж?");
  await expect(page.getByRole("banner").getByRole("status")).toContainText("Запазено");
  await noSidewaysScroll(page);
  await page.goBack();
  if (!isWide(page)) await page.goBack();
  await expect(cards(page).first()).toContainText("1 рунд · 1 въпрос · 1 мин");
});

test("Settings shows the quizzes' size and clears them alone; the export file does not carry them", async ({ page }) => {
  await page.goto("./");
  await page.evaluate(() => { localStorage.setItem("quizzard-teams:v1:names", '"Ana"'); });
  await seed(page);
  await expect.poll(async () => (await stored(page)).length).toBe(1);
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith("quizzard-quiz:")))).toEqual([]);
  await page.locator("[data-menu-open]").click();
  await page.locator('[data-menu] [data-action="settings"]').click();
  const settings = page.locator('dialog[data-dialog="settings"][open]');
  const row = settings.locator('[data-area="quiz"]');
  await expect(row).toContainText("Quiz creator");
  await expect(row.locator(".row-value")).toHaveText(/\d.*B$/);
  const download = page.waitForEvent("download");
  await settings.getByRole("button", { name: "Export my data" }).click();
  const file = JSON.parse((await (await (await download).createReadStream()).toArray()).join("")) as { tools: Record<string, Record<string, string>> };
  expect(file.tools["quiz"]).toEqual({});
  expect(JSON.stringify(file)).not.toContain("Which river flows through Paris?");
  await row.getByRole("button", { name: "Clear Quiz creator data" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(row.locator(".row-value")).toHaveText("Nothing saved");
  expect(await page.evaluate(() => localStorage.getItem("quizzard-teams:v1:names"))).toBe('"Ana"');
  await settings.getByRole("button", { name: "Close" }).click();
  await expect(root(page).getByText("No quizzes yet")).toBeVisible(); // the open quiz is gone with its data
  expect(await stored(page)).toEqual([]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`no serious accessibility problem on any screen (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    const check = async (name: string): Promise<void> => {
      await page.evaluate(() =>
        Promise.all(
          document
            .getAnimations()
            .filter((one) => one.effect?.getComputedTiming().iterations !== Infinity)
            .map((animation) => animation.finished.catch(() => undefined)),
        ),
      );
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      expect(
        result.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical").map((violation) => `${name}: ${violation.id} ${violation.nodes.map((node) => node.target.join(" ")).join(" | ")}`),
      ).toEqual([]);
    };
    await open(page);
    await check("library, empty");
    await newQuiz(page, "Pub night");
    await check("quiz, empty");
    await addRound(page, "History");
    await check("round, empty");
    await addQuestion(page, "Which of these are planets?", "Multiple choice");
    await option(page, "A").fill("Mars");
    await root(page).getByLabel("Option A is correct").check({ force: true });
    await root(page).locator('[data-timing="time"]').getByLabel("Seconds", { exact: true }).fill("45");
    if (!isWide(page)) await root(page).getByRole("button", { name: "Preview", exact: true }).click();
    await check("editor");
    await done(page);
    await root(page).locator("[data-round-settings] summary").click();
    await check("round with its settings open");
    await questions(page).first().getByRole("button", { name: "More for question 1" }).click();
    await check("a question's More list");
    await root(page).getByRole("dialog").getByRole("button", { name: "Preview" }).click();
    await root(page).getByRole("button", { name: "Show answer" }).click();
    await check("preview, revealed");
    await root(page).getByRole("button", { name: "Close preview" }).click();
    await toQuiz(page);
    await check("quiz with a round");
    await root(page).getByRole("button", { name: "Your quizzes" }).click();
    await expect(cards(page)).toHaveCount(1);
    await check("library");
  });
}

test("reduced motion: nothing on the creator's screens animates", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seed(page);
  expect(await page.evaluate(() => document.querySelector('[data-miniapp="quiz"]')?.getAnimations({ subtree: true }).length)).toBe(0);
});
