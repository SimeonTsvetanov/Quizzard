import { expect, test, type Page } from "@playwright/test";
import { LONG_NOTE, hiddenLines, control, focused, panel, play, pubNight, root, stage, view } from "./support/quiz-ux.ts";

// Quiz creator — the player's side of the UX review of 2026-11-24 (docs/quiz-creator/UX-REVIEW-2026-11-24.md).

const next = async (page: Page, times = 1): Promise<void> => { for (let n = 0; n < times; n += 1) await page.keyboard.press("Space"); };
const jump = async (page: Page, selector: string): Promise<void> => {
  await page.keyboard.press("KeyM");
  await page.locator(`[data-dialog="menu"] ${selector}`).first().click();
};

test("M1: the host panel's Next keeps its label under the pointer", async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 860 }); // the audience window is a wide screen's tool
  await play(page);
  const opened = context.waitForEvent("page");
  await control(page, "audience").click();
  const audience = await opened;
  await expect(panel(page)).toBeVisible();
  const forward = panel(page).locator('[data-control="next"]');
  const colours = (): Promise<{ background: string; color: string }> => forward.evaluate((button) => ({ background: getComputedStyle(button).backgroundColor, color: getComputedStyle(button).color }));
  await page.mouse.move(2, 2); // the pointer rests where the bar's button was: away from the panel's Next
  const idle = await colours();
  await forward.hover();
  await expect.poll(async () => (await colours()).background).not.toBe(idle.background); // a darker accent
  const hover = await colours();
  expect(hover.background).not.toBe(hover.color);
  expect(hover.color).toBe(idle.color);
  await audience.close();
});

test("M2: Back at the start, Next at the end and the timer's buttons are switched off without losing the focus", async ({ page }) => {
  await play(page);
  await expect(control(page, "back")).toHaveAttribute("aria-disabled", "true");
  await expect(control(page, "timer")).toHaveAttribute("aria-disabled", "true");
  await jump(page, '[data-jump="end"]');
  await expect(view(page, "final")).toBeVisible();
  await control(page, "back").focus();
  await page.keyboard.press("Enter");
  await control(page, "next").focus();
  await page.keyboard.press("Enter"); // the last screen: Next becomes switched off under the focus
  await expect(control(page, "next")).toHaveAttribute("aria-disabled", "true");
  await expect(control(page, "next")).toBeFocused();
  await page.keyboard.press("Enter"); // a press does nothing, and the focus stays
  await expect(view(page, "final")).toBeVisible();
  expect(await focused(page)).not.toBe("BODY");
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("M3: during Play nothing of the shell behind the stage can be reached with Tab", async ({ page }) => {
    await play(page);
    for (const selector of [".skip-link", ".app-header", ".app-footer"]) expect(await page.locator(selector).evaluate((element) => getComputedStyle(element).visibility)).toBe("hidden");
    const outside: string[] = [];
    for (let n = 0; n < 14; n += 1) {
      await page.keyboard.press("Tab");
      const where = await page.evaluate(() => {
        const element = document.activeElement;
        if (!element || element === document.body) return "page";
        return element.closest('[data-miniapp="quiz"]') ? "player" : `outside: ${element.tagName} ${element.getAttribute("aria-label") ?? element.textContent}`;
      });
      if (where.startsWith("outside")) outside.push(where);
    }
    expect(outside).toEqual([]);
    // Leaving Play brings the header back.
    await control(page, "exit").click();
    await expect(root(page).locator("[data-play-quiz]")).toBeVisible();
    expect(await page.locator(".app-header").evaluate((element) => getComputedStyle(element).visibility)).toBe("visible");
  });

  test("M9: twelve team names are readable and editable on a 360 px phone — one column that scrolls", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await play(page, pubNight({ settings: { teams: 12 } }));
    await next(page);
    const fields = view(page, "teams-view").locator(".qp-team-field");
    await expect(fields).toHaveCount(12);
    const widths = await fields.evaluateAll((list) => list.map((field) => Math.round(field.getBoundingClientRect().width)));
    expect(Math.min(...widths)).toBeGreaterThanOrEqual(180);
    expect(new Set(widths).size).toBe(1); // equal rows
    const last = fields.nth(11);
    await last.scrollIntoViewIfNeeded();
    await last.fill("The Quizzy Rascals");
    await expect(last).toHaveValue("The Quizzy Rascals");
    expect(await last.evaluate((field: HTMLInputElement) => field.scrollWidth <= field.clientWidth + 1)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
});

test("M6: removing a team that has points asks first with the numbers; one without points goes at once", async ({ page }) => {
  await play(page);
  await page.keyboard.press("KeyS");
  await page.locator('[data-dialog="scores"]').getByLabel("Team 2, History").fill("3");
  await page.keyboard.press("Escape");
  await next(page);
  const teams = view(page, "teams-view");
  const confirm = page.locator('[data-dialog="confirm"]');
  await teams.getByRole("button", { name: "Remove Team 2" }).click();
  await expect(confirm).toContainText("Remove Team 2?");
  await expect(confirm).toContainText("Its 3 points in 1 round will be lost.");
  await expect(confirm.getByRole("button")).toHaveText(["Cancel", "Remove"]);
  await expect(confirm.locator('[data-confirm="cancel"]')).toBeFocused();
  await confirm.locator('[data-confirm="cancel"]').click();
  await expect(teams.locator(".qp-team")).toHaveCount(4);
  await teams.getByRole("button", { name: "Remove Team 2" }).click();
  await confirm.locator('[data-confirm="ok"]').click();
  await expect(teams.locator(".qp-team")).toHaveCount(3);
  // No points, nothing to ask.
  await teams.getByRole("button", { name: "Remove Team 4" }).click();
  await expect(confirm).toHaveCount(0);
  await expect(teams.locator(".qp-team")).toHaveCount(2);
});

test("M8: the longest points note and a long round name are whole on the stage at 1280 × 720", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const base = pubNight();
  const quiz = { ...base, quiz: { ...base.quiz, rounds: [base.quiz.rounds[0], { ...base.quiz.rounds[1], name: "Кръг за световните столици, реки и планини" }] } };
  await play(page, quiz as typeof base);
  await jump(page, '[data-jump-round="r2"]');
  await next(page);
  const note = stage(page).locator(".quiz-slide-chip--points span");
  await expect(note).toContainText(LONG_NOTE);
  for (const part of [note, stage(page).locator(".quiz-slide-round")]) {
    expect(await part.evaluate(hiddenLines)).toBe(0);
    expect(await part.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  }
  const slide = await stage(page).locator(".quiz-slide").boundingBox();
  const chip = await stage(page).locator(".quiz-slide-chip--points").boundingBox();
  expect((chip?.x ?? 0) + (chip?.width ?? 0)).toBeLessThanOrEqual((slide?.x ?? 0) + (slide?.width ?? 0));
});
