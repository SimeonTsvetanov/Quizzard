import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Answer sheet (SPEC F16): a team's own answers and points, round by round, on one app screen. The
// arithmetic is unit tested (miniapps/sheet/packages/miniapp/test/game.test.ts); here: what a person
// does on the screen.
const KEY = "quizzard-sheet:v1:game";
const root = (page: Page) => page.locator('[data-miniapp="sheet"]');
const total = (page: Page) => root(page).locator("[data-total]");
const round = (page: Page) => root(page).locator("[data-round]");
const roundPoints = (page: Page) => round(page).locator("[data-round-points]");
const rows = (page: Page) => round(page).locator(".sheet-row");
const tab = (page: Page, n: number) => root(page).locator(`[data-tab="${String(n - 1)}"]`);
const answer = (row: Locator) => row.locator(".sheet-answer");
const clearGame = (page: Page) =>
  page.getByRole("banner").getByRole("button", { name: "Clear game" });
const saved = (page: Page) =>
  page.evaluate(
    (key) =>
      JSON.parse(localStorage.getItem(key) ?? "null") as {
        rounds: {
          name: string;
          points: number;
          bonus: number;
          questions: { text: string; mark: string; points: number | null }[];
        }[];
      } | null,
    KEY,
  );

async function open(page: Page): Promise<void> {
  await page.goto("./#/sheet");
  await expect(rows(page)).toHaveCount(1);
}

const addLine = (page: Page) => round(page).getByRole("button", { name: "Add an answer" });

/** Writes an answer on line `index` (0-based), adding the line with "+" when it is not there yet, and marks it. */
async function write(
  page: Page,
  index: number,
  text: string,
  mark?: "right" | "wrong",
): Promise<void> {
  if ((await rows(page).count()) <= index) await addLine(page).click();
  const row = rows(page).nth(index);
  await answer(row).fill(text);
  if (mark) await row.locator(`[data-mark-button="${mark}"]`).click();
}

test("opens from Home with round 1 ready: one empty line, total 0, nothing to clear", async ({
  page,
}) => {
  await page.goto("./");
  await page.locator('[data-card="sheet"]').click();
  await expect(page).toHaveURL(/#\/sheet$/);
  await expect(total(page)).toHaveText("0");
  await expect(round(page).getByRole("heading")).toHaveText("Round 1");
  await expect(rows(page)).toHaveCount(1);
  await expect(tab(page, 1)).toHaveAttribute("aria-current", "true");
  await expect(clearGame(page)).toBeHidden();
  expect(await saved(page)).toBeNull();
});

test("it is one screen: on a phone the page itself does not scroll, a long round scrolls inside its card", async ({
  page,
  isMobile,
}) => {
  await open(page);
  for (let index = 0; index < 14; index += 1)
    await write(page, index, `Answer ${String(index + 1)}`);
  // Desktop pages end with the site footer, so only phones are a single fixed screen.
  if (isMobile)
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight),
    ).toBeLessThanOrEqual(1);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
  ).toBeLessThanOrEqual(0);
  const scroll = round(page).locator("[data-scroll]");
  expect(await scroll.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(
    true,
  );
  await expect(total(page)).toBeInViewport();
  await expect(tab(page, 1)).toBeInViewport();
  await expect(roundPoints(page)).toBeInViewport();
  // No row is wider than the card: the last control of a line is fully on screen once the line is.
  await rows(page).nth(13).scrollIntoViewIfNeeded();
  await expect(rows(page).nth(13).getByLabel("Points for question 14")).toBeInViewport({
    ratio: 1,
  });
});

test("lines are added only with “+” or Enter on the last line; right answers count 1 point, wrong ones 0", async ({
  page,
}) => {
  await open(page);
  await answer(rows(page).nth(0)).fill("Paris");
  await expect(rows(page)).toHaveCount(1); // writing adds nothing by itself
  await answer(rows(page).nth(0)).press("Enter");
  await expect(rows(page)).toHaveCount(2);
  await expect(answer(rows(page).nth(1))).toBeFocused();
  await page.keyboard.type("1066");
  await addLine(page).click();
  await expect(rows(page)).toHaveCount(3);
  await expect(answer(rows(page).nth(2))).toBeFocused();
  // Enter in the middle only moves on.
  await answer(rows(page).nth(0)).press("Enter");
  await expect(answer(rows(page).nth(1))).toBeFocused();
  await expect(rows(page)).toHaveCount(3);
  await rows(page).nth(0).getByRole("button", { name: "Right" }).click();
  await rows(page).nth(1).getByRole("button", { name: "Wrong" }).click();
  await expect(total(page)).toHaveText("1");
  await expect(round(page).locator("[data-round-meta]")).toHaveText("1 of 2 right");
  await expect(rows(page).nth(0).getByRole("button", { name: "Right" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  // A second tap takes the mark back.
  await rows(page).nth(0).getByRole("button", { name: "Right" }).click();
  await expect(total(page)).toHaveText("0");
  await expect(round(page).locator("[data-round-meta]")).toHaveText("0 of 1 right");
});

test("marking never adds a line, and the lines are there again after a reload exactly as they were", async ({
  page,
}) => {
  await open(page);
  await write(page, 0, "Paris", "right");
  await write(page, 1, "1066", "wrong");
  await write(page, 2, "", "wrong"); // a question the team left unanswered
  await expect(rows(page)).toHaveCount(3);
  await expect(round(page).locator("[data-round-meta]")).toHaveText("1 of 3 right");
  await expect.poll(async () => (await saved(page))?.rounds[0]?.questions.length).toBe(3);
  await page.reload();
  await expect(rows(page)).toHaveCount(3);
  await expect(round(page).locator("[data-round-meta]")).toHaveText("1 of 3 right");
});

test("the number at the end of a line is what the line brings: typing one makes the line count, a wrong line shows 0", async ({
  page,
}) => {
  await open(page);
  await round(page).getByLabel("A right answer gives").fill("3");
  await write(page, 0, "Cow 1", "right");
  await write(page, 1, "Cow 2", "wrong");
  await write(page, 2, "Cow 3", "right");
  const second = rows(page).nth(1).getByLabel("Points for question 2");
  await expect(second).toHaveValue("0");
  await expect(total(page)).toHaveText("6");
  // Moni 2026-11-23: he typed 6 on a line marked wrong and expected it to count.
  await second.fill("6");
  await expect(rows(page).nth(1).getByRole("button", { name: "Right" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(rows(page).nth(1).getByRole("button", { name: "Wrong" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(total(page)).toHaveText("12");
  // Marking it wrong again shows 0 and takes its points out; marking it right brings the 6 back.
  await second.blur();
  await rows(page).nth(1).getByRole("button", { name: "Wrong" }).click();
  await expect(second).toHaveValue("0");
  await expect(total(page)).toHaveText("6");
  await rows(page).nth(1).getByRole("button", { name: "Right" }).click();
  await expect(second).toHaveValue("6");
  await expect(total(page)).toHaveText("12");
  // Typing 0 is the same as marking the line wrong.
  await rows(page).nth(0).getByLabel("Points for question 1").fill("0");
  await expect(rows(page).nth(0).getByRole("button", { name: "Wrong" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(total(page)).toHaveText("9");
});

test("a round can give other points per right answer; a question changed by hand keeps its own", async ({
  page,
}) => {
  await open(page);
  await write(page, 0, "Paris", "right");
  await write(page, 1, "The Nile", "right");
  await write(page, 2, "Napoleon", "right");
  await rows(page).nth(1).getByLabel("Points for question 2").fill("0,5");
  await expect(total(page)).toHaveText("2.5");
  await round(page).getByLabel("A right answer gives").fill("2");
  await expect(total(page)).toHaveText("4.5");
  await expect(rows(page).nth(0).getByLabel("Points for question 1")).toHaveValue("2");
  await expect(rows(page).nth(1).getByLabel("Points for question 2")).toHaveValue("0.5");
  await addLine(page).click();
  await expect(rows(page).nth(3).getByLabel("Points for question 4")).toHaveValue("2"); // a new line too
  // Typing the round's own value takes the exception away again.
  await rows(page).nth(1).getByLabel("Points for question 2").fill("2");
  await expect(total(page)).toHaveText("6");
  await round(page).getByLabel("A right answer gives").fill("1");
  await expect(total(page)).toHaveText("3");
  await expect.poll(async () => (await saved(page))?.rounds[0]?.points).toBe(1);
});

test("bonus points, also with a minus, change the round and the total; what is not a number is not kept", async ({
  page,
}) => {
  await open(page);
  await write(page, 0, "Paris", "right");
  await round(page).getByLabel("Bonus points").fill("1");
  await expect(total(page)).toHaveText("2");
  await round(page).getByLabel("Bonus points").fill("-2");
  await expect(total(page)).toHaveText("-1");
  await expect(roundPoints(page)).toHaveText("-1");
  const worth = rows(page).nth(0).getByLabel("Points for question 1");
  await worth.fill("abc");
  await worth.blur();
  await expect(worth).toHaveValue("1");
  await expect(total(page)).toHaveText("-1");
});

test("“+” starts the next round ready to write; the tabs show each round's points and switch between them", async ({
  page,
}) => {
  await open(page);
  await round(page).getByLabel("Name of round 1 (optional)").fill("History");
  await write(page, 0, "Paris", "right");
  await write(page, 1, "1066", "right");
  await root(page).getByRole("button", { name: "New round" }).click();
  await expect(round(page).getByRole("heading")).toHaveText("Round 2");
  await expect(answer(rows(page).nth(0))).toBeFocused();
  await expect(round(page).getByLabel("A right answer gives")).toHaveValue("1");
  await write(page, 0, "ABBA", "right");
  await expect(total(page)).toHaveText("3");
  await expect(tab(page, 1)).toHaveAccessibleName("Round 1 2 points");
  await expect(tab(page, 2)).toHaveAttribute("aria-current", "true");
  // Back to round 1 to fix an answer.
  await tab(page, 1).click();
  await expect(round(page).getByRole("heading")).toHaveText("Round 1");
  await expect(tab(page, 1)).toBeFocused(); // the redraw must not drop the focus to <body>
  await expect(round(page).getByLabel("Name of round 1 (optional)")).toHaveValue("History");
  await rows(page).nth(1).getByRole("button", { name: "Wrong" }).click();
  await expect(total(page)).toHaveText("2");
  await expect(tab(page, 1)).toHaveAccessibleName("Round 1 1 points");
});

test("the game is saved and is there after a reload and after going Home and back", async ({
  page,
}) => {
  await open(page);
  await write(page, 0, "Paris", "right");
  await rows(page).nth(0).getByLabel("Points for question 1").fill("2");
  await expect
    .poll(async () => (await saved(page))?.rounds[0]?.questions)
    .toEqual([{ text: "Paris", mark: "right", points: 2 }]);
  await page.reload();
  await expect(answer(rows(page).nth(0))).toHaveValue("Paris");
  await expect(total(page)).toHaveText("2");
  // Typing is saved on the way out, without waiting for the timer.
  await write(page, 1, "Rome");
  await page.getByRole("banner").getByRole("button", { name: "Back to Home" }).click();
  await expect(clearGame(page)).toHaveCount(0); // the header button leaves with the screen
  await page.locator('[data-card="sheet"]').click();
  await expect(answer(rows(page).nth(1))).toHaveValue("Rome");
});

test("Backspace on an empty line removes it; the numbers follow", async ({ page }) => {
  await open(page);
  await write(page, 0, "one");
  await write(page, 1, "two");
  await write(page, 2, "three");
  await answer(rows(page).nth(1)).fill("");
  await answer(rows(page).nth(1)).press("Backspace");
  await expect(rows(page)).toHaveCount(2);
  await expect(answer(rows(page).nth(1))).toHaveValue("three");
  await expect(answer(rows(page).nth(1))).toHaveAccessibleName("Answer 2");
  await expect(answer(rows(page).nth(0))).toBeFocused();
  // The last line of a round stays.
  await answer(rows(page).nth(1)).fill("");
  await answer(rows(page).nth(1)).press("Backspace");
  await answer(rows(page).nth(0)).fill("");
  await answer(rows(page).nth(0)).press("Backspace");
  await expect(rows(page)).toHaveCount(1);
});

test("Delete round offers Undo; Clear game (in the header) asks first and offers Undo", async ({
  page,
}) => {
  await open(page);
  await write(page, 0, "Paris", "right");
  // Deleting the only round empties it; Undo brings it back.
  await round(page).getByRole("button", { name: "Delete round" }).click();
  await expect(total(page)).toHaveText("0");
  await expect(answer(rows(page).nth(0))).toHaveValue("");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(answer(rows(page).nth(0))).toHaveValue("Paris");
  await root(page).getByRole("button", { name: "New round" }).click();
  await write(page, 0, "ABBA", "right");
  await round(page).getByRole("button", { name: "Delete round" }).click();
  await expect(root(page).locator("[data-tab]")).toHaveCount(1);
  await expect(total(page)).toHaveText("1");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(root(page).locator("[data-tab]")).toHaveCount(2);
  await expect(total(page)).toHaveText("2");

  await clearGame(page).click();
  const alert = page.getByRole("alertdialog", { name: "Clear the whole game?" });
  await alert.getByRole("button", { name: "Cancel" }).click();
  await expect(total(page)).toHaveText("2");
  await clearGame(page).click();
  await alert.getByRole("button", { name: "Clear game" }).click();
  await expect(total(page)).toHaveText("0");
  await expect(root(page).locator("[data-tab]")).toHaveCount(1);
  await expect.poll(() => saved(page)).toBeNull();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(total(page)).toHaveText("2");
  await expect.poll(async () => (await saved(page))?.rounds.length).toBe(2);
});

test("Bulgarian: the texts and the decimal comma follow the language", async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem("quizzard:v1:lang", '"bg"');
      sessionStorage.setItem("seeded", "1");
    }
  });
  await open(page);
  await write(page, 0, "Париж", "right");
  await rows(page).nth(0).getByLabel("Точки за въпрос 1").fill("0.5");
  await expect(total(page)).toHaveText("0,5");
  await expect(root(page).getByRole("button", { name: "Нов рунд" })).toBeVisible();
  await expect(round(page).getByRole("heading")).toHaveText("Рунд 1");
  await expect(round(page).getByLabel("Верен отговор дава")).toHaveValue("1");
  await expect(round(page).locator("[data-round-meta]")).toHaveText("1 от 1 верни");
});

test("only its own key is written; Settings lists the sheet and clears it alone", async ({
  page,
}) => {
  await page.goto("./");
  await page.evaluate(() => {
    localStorage.setItem("quizzard-teams:v1:names", '"Ana"');
    localStorage.setItem("other-app:v1:x", "keep");
  });
  await open(page);
  await write(page, 0, "Paris", "right");
  await expect.poll(() => saved(page)).not.toBeNull();
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((key) => key.startsWith("quizzard-sheet:")),
    ),
  ).toEqual([KEY]);
  await page.locator("[data-menu-open]").click();
  await page.locator('[data-menu] [data-action="settings"]').click();
  const row = page.locator('dialog[data-dialog="settings"][open] [data-area="sheet"]');
  await expect(row).toContainText("Answer sheet");
  await row.getByRole("button", { name: "Clear Answer sheet data" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(row.locator(".row-value")).toHaveText("Nothing saved");
  expect(
    await page.evaluate(() => [
      localStorage.getItem("quizzard-sheet:v1:game"),
      localStorage.getItem("quizzard-teams:v1:names"),
      localStorage.getItem("other-app:v1:x"),
    ]),
  ).toEqual([null, '"Ana"', "keep"]);
  await page
    .locator('dialog[data-dialog="settings"][open]')
    .getByRole("button", { name: "Close" })
    .click();
  await expect(total(page)).toHaveText("0");
});

test("the screen has no serious accessibility problem, with a game on it", async ({ page }) => {
  await open(page);
  await write(page, 0, "Paris", "right");
  await write(page, 1, "1066", "wrong");
  await rows(page).nth(0).getByLabel("Points for question 1").fill("3");
  await root(page).getByRole("button", { name: "New round" }).click();
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((one) => one.effect?.getComputedTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    result.violations
      .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
      .map((violation) => `${violation.id}: ${violation.nodes[0]?.html ?? ""}`),
  ).toEqual([]);
});

test("with the keyboard open (a short screen) “Add an answer” still adds a line on every tap", async ({
  page,
}) => {
  await page.setViewportSize({ width: 412, height: 500 });
  await open(page);
  for (let index = 0; index < 6; index += 1)
    await write(page, index, `Answer ${String(index + 1)}`);
  await expect(rows(page)).toHaveCount(6);
  await expect(answer(rows(page).nth(5))).toBeInViewport({ ratio: 1 });
});

// Moni 2026-11-23: more rounds than fit must stay reachable — arrows at the ends of the strip, "+" always there.
test("many rounds: the tabs scroll between two arrows and “+” is always on screen", async ({
  page,
}) => {
  await open(page);
  const add = root(page).getByRole("button", { name: "New round" });
  const previous = root(page).locator('[data-tabs-arrow="prev"]');
  const next = root(page).locator('[data-tabs-arrow="next"]');
  await expect(previous).toBeHidden();
  await expect(next).toBeHidden(); // one round fits: no arrows
  for (let count = 0; count < 24; count += 1) await add.click();
  await expect(root(page).locator("[data-tab]")).toHaveCount(25);
  await expect(add).toBeInViewport({ ratio: 1 });
  await expect(tab(page, 25)).toBeInViewport({ ratio: 1 }); // the open round's tab is brought into view
  await expect(previous).toBeVisible();
  await expect(next).toBeHidden(); // at the end: nothing hidden after it
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
  ).toBeLessThanOrEqual(0);
  // Back to the start, a strip at a time.
  for (let step = 0; step < 12 && (await previous.isVisible()); step += 1) {
    await previous.click();
    await page.waitForTimeout(350);
  }
  await expect(previous).toBeHidden();
  await expect(next).toBeVisible();
  await expect(tab(page, 1)).toBeInViewport({ ratio: 1 });
  await next.click();
  await expect(previous).toBeVisible();
  await expect(add).toBeInViewport({ ratio: 1 });
});

// Moni 2026-11-23: a line that was added must be removable.
test("“Remove answers” turns every line's marks into a remove button; a removed line comes back with Undo", async ({
  page,
}) => {
  await open(page);
  await write(page, 0, "Paris", "right");
  await write(page, 1, "1066", "wrong");
  await write(page, 2, "The Nile", "right");
  await expect(total(page)).toHaveText("2");
  await round(page).getByRole("button", { name: "Remove answers" }).click();
  await expect(rows(page).nth(0).getByRole("button", { name: "Right" })).toBeHidden();
  await expect(addLine(page)).toBeHidden();
  await round(page).getByRole("button", { name: "Remove answer 1", exact: true }).click();
  await expect(rows(page)).toHaveCount(2);
  await expect(answer(rows(page).nth(0))).toHaveValue("1066");
  await expect(answer(rows(page).nth(0))).toHaveAccessibleName("Answer 1");
  await expect(total(page)).toHaveText("1");
  await expect.poll(async () => (await saved(page))?.rounds[0]?.questions.length).toBe(2);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(rows(page)).toHaveCount(3);
  await expect(answer(rows(page).nth(0))).toHaveValue("Paris");
  await expect(total(page)).toHaveText("2");
  // Removing every line leaves one empty line to write on; "Done" brings the marks back.
  for (let left = 3; left > 0; left -= 1)
    await round(page).getByRole("button", { name: "Remove answer 1", exact: true }).click();
  await expect(rows(page)).toHaveCount(1);
  await expect(answer(rows(page).nth(0))).toHaveValue("");
  await round(page).getByRole("button", { name: "Done" }).click();
  await expect(rows(page).nth(0).getByRole("button", { name: "Right" })).toBeVisible();
  await expect(addLine(page)).toBeVisible();
  await expect(total(page)).toHaveText("0");
});
