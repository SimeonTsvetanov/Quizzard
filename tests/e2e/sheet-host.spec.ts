import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Answer sheet (SPEC F16): a team's own answers and points, round by round. The arithmetic is unit
// tested (miniapps/sheet/packages/miniapp/test/game.test.ts); here: what a person does on the screen.
const KEY = "quizzard-sheet:v1:game";
const root = (page: Page) => page.locator('[data-miniapp="sheet"]');
const total = (page: Page) => root(page).locator("[data-total]");
const openRound = (page: Page) => root(page).locator("[data-round][data-open]");
const rows = (page: Page) => openRound(page).locator(".sheet-row");
const answer = (row: Locator) => row.locator(".sheet-answer");
const saved = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null") as { rounds: { name: string; bonus: number; questions: { text: string; mark: string; points: number }[] }[] } | null, KEY);

async function open(page: Page): Promise<void> {
  await page.goto("./#/sheet");
  await expect(rows(page)).toHaveCount(1);
}

/** Writes an answer on line `index` (0-based) and marks it. */
async function write(page: Page, index: number, text: string, mark?: "right" | "wrong"): Promise<void> {
  const row = rows(page).nth(index);
  await answer(row).fill(text);
  if (mark) await row.locator(`[data-mark-button="${mark}"]`).click();
}

test("opens from Home with round 1 ready: one empty line, total 0, nothing to clear", async ({ page }) => {
  await page.goto("./");
  await page.locator('[data-card="sheet"]').click();
  await expect(page).toHaveURL(/#\/sheet$/);
  await expect(total(page)).toHaveText("0");
  await expect(openRound(page).locator(".sheet-round-title")).toHaveText("Round 1");
  await expect(rows(page)).toHaveCount(1);
  await expect(root(page).getByRole("button", { name: "Clear game" })).toBeHidden();
  expect(await saved(page)).toBeNull();
});

test("writing adds the next line; Enter moves to it; right answers count 1 point, wrong ones 0", async ({ page }) => {
  await open(page);
  await answer(rows(page).nth(0)).fill("Paris");
  await expect(rows(page)).toHaveCount(2);
  await answer(rows(page).nth(0)).press("Enter");
  await expect(answer(rows(page).nth(1))).toBeFocused();
  await page.keyboard.type("1066");
  await expect(rows(page)).toHaveCount(3);
  await rows(page).nth(0).getByRole("button", { name: "Right" }).click();
  await rows(page).nth(1).getByRole("button", { name: "Wrong" }).click();
  await expect(total(page)).toHaveText("1");
  await expect(openRound(page).locator("[data-round-meta]")).toHaveText("1 of 2 right");
  await expect(rows(page).nth(0).getByRole("button", { name: "Right" })).toHaveAttribute("aria-pressed", "true");
  // A second tap takes the mark back.
  await rows(page).nth(0).getByRole("button", { name: "Right" }).click();
  await expect(total(page)).toHaveText("0");
  await expect(openRound(page).locator("[data-round-meta]")).toHaveText("0 of 1 right");
});

test("points per question (0.5, 2, a comma), a bonus and a minus bonus change the round and the total", async ({ page }) => {
  await open(page);
  await write(page, 0, "Paris", "right");
  await write(page, 1, "The Nile", "right");
  await write(page, 2, "Napoleon", "right");
  await rows(page).nth(1).getByLabel("Points for question 2").fill("0,5");
  await rows(page).nth(2).getByLabel("Points for question 3").fill("2");
  await expect(total(page)).toHaveText("3.5");
  await openRound(page).getByLabel("Bonus points").fill("1");
  await expect(total(page)).toHaveText("4.5");
  await openRound(page).getByLabel("Bonus points").fill("-2");
  await expect(total(page)).toHaveText("1.5");
  // Something that is not a number is not kept: the field shows the last good value again.
  const worth = rows(page).nth(0).getByLabel("Points for question 1");
  await worth.fill("abc");
  await worth.blur();
  await expect(worth).toHaveValue("1");
  await expect(total(page)).toHaveText("1.5");
  await expect(openRound(page).locator("[data-round-points]")).toHaveText("1.5");
});

test("a new round opens ready to write, the earlier one folds to its result and can be reopened and fixed", async ({ page }) => {
  await open(page);
  await openRound(page).getByLabel("Name of round 1 (optional)").fill("History");
  await write(page, 0, "Paris", "right");
  await write(page, 1, "1066", "right");
  await root(page).getByRole("button", { name: "New round" }).click();
  await expect(openRound(page).locator(".sheet-round-title")).toContainText("Round 2");
  await expect(answer(rows(page).nth(0))).toBeFocused();
  await write(page, 0, "ABBA", "right");
  await expect(total(page)).toHaveText("3");
  const first = root(page).locator('[data-round="0"]');
  await expect(first.locator(".sheet-round-body")).toBeHidden();
  await expect(first.locator(".sheet-round-title")).toHaveText("Round 1 · History");
  await expect(first.locator("[data-round-points]")).toHaveText("2");
  await first.getByRole("button", { name: /Round 1/ }).click();
  await first.locator(".sheet-row").nth(1).getByRole("button", { name: "Wrong" }).click();
  await expect(total(page)).toHaveText("2");
  await expect(root(page).locator("[data-rounds-count]")).toHaveText("2 rounds");
});

test("the game is saved and is there after a reload and after going Home and back", async ({ page }) => {
  await open(page);
  await write(page, 0, "Paris", "right");
  await rows(page).nth(0).getByLabel("Points for question 1").fill("2");
  await expect.poll(async () => (await saved(page))?.rounds[0]?.questions).toEqual([{ text: "Paris", mark: "right", points: 2 }]);
  await page.reload();
  await expect(answer(rows(page).nth(0))).toHaveValue("Paris");
  await expect(total(page)).toHaveText("2");
  // Typing is saved on the way out, without waiting for the timer.
  await answer(rows(page).nth(1)).fill("Rome");
  await page.getByRole("banner").getByRole("button", { name: "Back to Home" }).click();
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
  await expect(rows(page)).toHaveCount(3);
  await expect(answer(rows(page).nth(1))).toHaveValue("three");
  await expect(answer(rows(page).nth(1))).toHaveAccessibleName("Answer 2");
  await expect(answer(rows(page).nth(0))).toBeFocused();
});

test("Delete round and Clear game ask or offer Undo, and Undo brings everything back", async ({ page }) => {
  await open(page);
  await write(page, 0, "Paris", "right");
  await root(page).getByRole("button", { name: "New round" }).click();
  await write(page, 0, "ABBA", "right");
  await openRound(page).getByRole("button", { name: "Delete round" }).click();
  await expect(root(page).locator("[data-round]")).toHaveCount(1);
  await expect(total(page)).toHaveText("1");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(root(page).locator("[data-round]")).toHaveCount(2);
  await expect(total(page)).toHaveText("2");

  await root(page).getByRole("button", { name: "Clear game" }).click();
  const alert = page.getByRole("alertdialog", { name: "Clear the whole game?" });
  await alert.getByRole("button", { name: "Cancel" }).click();
  await expect(total(page)).toHaveText("2");
  await root(page).getByRole("button", { name: "Clear game" }).click();
  await alert.getByRole("button", { name: "Clear" }).click();
  await expect(total(page)).toHaveText("0");
  await expect(root(page).locator("[data-round]")).toHaveCount(1);
  await expect.poll(() => saved(page)).toBeNull();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(total(page)).toHaveText("2");
  await expect.poll(async () => (await saved(page))?.rounds.length).toBe(2);
});

test("Bulgarian: the texts and the decimal comma follow the language, the game stays", async ({ page }) => {
  await page.addInitScript(() => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("quizzard:v1:lang", '"bg"'); sessionStorage.setItem("seeded", "1"); } });
  await open(page);
  await write(page, 0, "Париж", "right");
  await rows(page).nth(0).getByLabel("Точки за въпрос 1").fill("0.5");
  await expect(total(page)).toHaveText("0,5");
  await expect(root(page).getByRole("button", { name: "Нов рунд" })).toBeVisible();
  await expect(openRound(page).locator(".sheet-round-title")).toHaveText("Рунд 1");
  await expect(openRound(page).locator("[data-round-meta]")).toHaveText("1 от 1 верни");
});

test("only its own key is written; Settings lists the sheet and clears it alone", async ({ page }) => {
  await page.goto("./");
  await page.evaluate(() => { localStorage.setItem("quizzard-teams:v1:names", '"Ana"'); localStorage.setItem("other-app:v1:x", "keep"); });
  await open(page);
  await write(page, 0, "Paris", "right");
  await expect.poll(() => saved(page)).not.toBeNull();
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith("quizzard-sheet:")))).toEqual([KEY]);
  await page.locator("[data-menu-open]").click();
  await page.locator('[data-menu] [data-action="settings"]').click();
  const row = page.locator('dialog[data-dialog="settings"][open] [data-area="sheet"]');
  await expect(row).toContainText("Answer sheet");
  await row.getByRole("button", { name: "Clear Answer sheet data" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(row.locator(".row-value")).toHaveText("Nothing saved");
  expect(await page.evaluate(() => [localStorage.getItem("quizzard-sheet:v1:game"), localStorage.getItem("quizzard-teams:v1:names"), localStorage.getItem("other-app:v1:x")])).toEqual([null, '"Ana"', "keep"]);
  await page.locator('dialog[data-dialog="settings"][open]').getByRole("button", { name: "Close" }).click();
  await expect(total(page)).toHaveText("0");
});

test("the screen has no serious accessibility problem, with a game on it", async ({ page }) => {
  await open(page);
  await write(page, 0, "Paris", "right");
  await write(page, 1, "1066", "wrong");
  await root(page).getByRole("button", { name: "New round" }).click();
  await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined))));
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(result.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical").map((violation) => `${violation.id}: ${violation.nodes[0]?.html ?? ""}`)).toEqual([]);
});
