import { expect, test, type Locator, type Page } from "@playwright/test";
import { control, focused, longRound, openQuiz, pubNight, root, screen, stage, view } from "./support/quiz-ux.ts";

// Back and symmetry on every window size (owner, 2026-11-24). Back — the browser's, `history.back()`
// as Android sends it, the in-app link, Escape in a dialog, the header's arrow — lands where a person
// expects, with the focus on the thing they came from. And the main rows are symmetric to the pixel:
// equal buttons in a row, equal page margins left and right, dialogs in the middle of a wide screen.
const SIZES = [[360, 740], [412, 915], [800, 1100], [1280, 860], [1920, 1080]] as const;
const headerBack = (page: Page): Locator => page.getByRole("banner").getByRole("button", { name: "Back", exact: true });
const box = async (target: Locator): Promise<{ x: number; y: number; width: number; height: number }> => (await target.boundingBox()) ?? { x: -1, y: -1, width: -1, height: -1 };
const sizes = (targets: Locator): Promise<string[]> => targets.evaluateAll((list) => list.filter((one) => (one as HTMLElement).checkVisibility()).map((one) => `${String((one as HTMLElement).offsetWidth)}×${String((one as HTMLElement).offsetHeight)}@${String(Math.round(one.getBoundingClientRect().top))}`));
/** How far the middle of an element is from the middle of the window, in px. */
const offCentre = (target: Locator): Promise<number> => target.evaluate((element) => { const rect = element.getBoundingClientRect(); return Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2); });
const settled = (page: Page): Promise<unknown> => page.evaluate(() => Promise.all(document.getAnimations().filter((one) => one.effect?.getComputedTiming().iterations !== Infinity).map((animation) => animation.finished.catch(() => undefined))));

for (const [width, height] of SIZES) {
  test.describe(`${String(width)} × ${String(height)}`, () => {
    test.skip(({ isMobile, browserName }) => isMobile || browserName !== "chromium", "the sizes are set here: the Chromium project runs them (DECISIONS 2026-11-24)");
    test.use({ viewport: { width, height } });
    const isWide = width >= 700;

    test("Back in the creator: the in-app link, the browser's Back, Escape and the header's arrow", async ({ page }) => {
      test.setTimeout(90_000);
      await openQuiz(page); // a direct launch on the tool: the router puts Home under it
      const card = root(page).locator('[data-focus="question:q1"]');
      const roundCard = root(page).locator('[data-focus="round:r1"]');
      await roundCard.click();
      // Editor → round: the in-app link, then history.back() as a phone's Back button sends it.
      await card.click();
      await expect(screen(page, "editor")).toBeVisible();
      await screen(page, "editor").locator("[data-up]").click();
      await expect(card).toBeFocused();
      await card.click();
      await expect(screen(page, "editor")).toBeVisible();
      await page.evaluate(() => { history.back(); });
      await expect(card).toBeFocused();
      // "Done" is the same move.
      await card.click();
      await root(page).locator("[data-done]").click();
      await expect(card).toBeFocused();
      // The preview: its close button and the browser's Back.
      for (const leave of [() => root(page).locator("[data-close-preview]").click(), () => page.goBack()]) {
        await root(page).locator('[data-question="q1"] [data-more]').click();
        await root(page).locator("[data-sheet] [data-preview]").click();
        await expect(screen(page, "preview")).toBeVisible();
        await leave();
        await expect(screen(page, "preview")).toHaveCount(0);
        await expect(card).toBeFocused();
      }
      // Escape closes what is open and gives the focus back to what opened it.
      const more = root(page).locator('[data-question="q1"] [data-more]');
      await more.click();
      await expect(root(page).locator("[data-sheet]")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(root(page).locator("[data-sheet]")).toHaveCount(0);
      await expect(more).toBeFocused();
      const trash = root(page).locator('.quiz-round-tools [data-round-action="delete"]');
      await trash.click();
      await expect(page.getByRole("alertdialog")).toContainText("Delete “History”?");
      if (isWide) expect(await offCentre(page.getByRole("alertdialog"))).toBeLessThanOrEqual(1);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("alertdialog")).toHaveCount(0);
      await expect(trash).toBeFocused();
      await expect(root(page).locator("[data-question]")).toHaveCount(3); // nothing was deleted
      // Round → quiz (a phone; on a wide screen they are one screen), then quiz → library.
      if (!isWide) {
        await root(page).locator("[data-up]:visible").first().click();
        await expect(roundCard).toBeFocused();
        await roundCard.click();
        await page.goBack();
        await expect(roundCard).toBeFocused();
      }
      await root(page).locator(".quiz-quiz-head [data-up]").click();
      await expect(screen(page, "library")).toBeVisible();
      await expect(root(page).locator(".quiz-card-open").first()).toBeFocused();
      // "New quiz" and renaming: Escape leaves the form and nothing is made.
      await root(page).locator("[data-new-quiz]").click();
      await page.keyboard.press("Escape");
      await expect(root(page).locator("[data-new-quiz]")).toBeFocused();
      await expect(root(page).locator(".quiz-card")).toHaveCount(1);
      // The shell's menu: Escape, and the focus is back on its button.
      await page.locator("[data-menu-open]").click();
      await expect(page.locator("dialog[data-menu][open]")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.locator("dialog[data-menu][open]")).toHaveCount(0);
      await expect(page.locator("[data-menu-open]")).toBeFocused();
      // One browser Back from the library is Home; Forward and deep in, the header's arrow walks one screen at a time.
      await page.goBack();
      await expect(page.locator("[data-view=home]")).toBeVisible();
      await page.goForward();
      await root(page).locator(".quiz-card-open").first().click();
      await roundCard.click();
      await card.click();
      await expect(screen(page, "editor")).toBeVisible();
      // One step: the editor closes and the tool stays (a wide screen shows the round inside the quiz, so the steps differ).
      await headerBack(page).click();
      await expect(screen(page, "editor")).toBeHidden();
      await expect(page).toHaveURL(/#\/quiz/);
      for (let step = 0; step < 3 && !(await screen(page, "library").isVisible()); step += 1) await headerBack(page).click();
      await expect(screen(page, "library")).toBeVisible();
      await headerBack(page).click();
      await expect(page.locator("[data-view=home]")).toBeVisible();
      await expect(page).not.toHaveURL(/#\/quiz/);
      expect(await focused(page)).not.toBe("BODY");
    });

    test("Back in the player: the browser's Back, the leave button, Escape in every dialog", async ({ page }) => {
      test.setTimeout(90_000);
      await openQuiz(page);
      const playButton = root(page).locator("[data-play-quiz]");
      for (const leave of [() => page.goBack(), () => page.evaluate(() => { history.back(); }), () => control(page, "exit").click()]) {
        await playButton.click();
        await expect(view(page, "title")).toBeVisible();
        await leave();
        await expect(stage(page)).toHaveCount(0);
        await expect(playButton).toBeFocused();
        await expect(page.locator(".app-header")).toBeVisible();
      }
      await playButton.click();
      await expect(view(page, "title")).toBeVisible();
      // Each dialog opened from its button with the keyboard: Escape closes it and the button has the focus again.
      for (const [id, dialog] of [["menu", "menu"], ["scores", "scores"]] as const) {
        const button = control(page, id);
        if (!(await button.isVisible())) continue; // a phone's bar keeps Scores in the menu
        await button.focus();
        await page.keyboard.press("Enter");
        const open = page.locator(`[data-dialog="${dialog}"]`);
        await expect(open).toBeVisible();
        if (isWide) expect(await offCentre(open)).toBeLessThanOrEqual(1);
        await page.keyboard.press("Escape");
        await expect(open).toHaveCount(0);
        await expect(button).toBeFocused();
      }
      // The same key that opened a dialog closes it; Escape closes the confirm and nothing is cleared.
      await page.keyboard.press("KeyS");
      await page.locator('[data-dialog="scores"] input').first().fill("2");
      await page.keyboard.press("Escape");
      await page.keyboard.press("KeyM");
      await page.keyboard.press("KeyM");
      await expect(page.locator('[data-dialog="menu"]')).toHaveCount(0);
      await page.keyboard.press("KeyM");
      await page.locator("[data-restart]").click();
      const confirm = page.locator('[data-dialog="confirm"]');
      await expect(confirm).toBeVisible();
      if (isWide) expect(await offCentre(confirm)).toBeLessThanOrEqual(1);
      await expect(confirm.locator("button")).toHaveCount(2);
      expect(new Set(await sizes(confirm.locator("button"))).size).toBe(1); // Cancel and the red button: one size, one line
      await page.keyboard.press("Escape");
      await expect(confirm).toHaveCount(0);
      await page.keyboard.press("KeyS");
      await expect(page.locator('[data-dialog="scores"] [data-table-total]').first()).toHaveText("2");
    });

    test("symmetry: equal buttons in a row, equal page margins, cards of a row aligned inside", async ({ page }) => {
      test.setTimeout(90_000);
      await openQuiz(page);
      await settled(page);
      // The quiz: Preview and Export are twins; the rows of a round card's buttons are equal; the page has equal margins.
      expect(new Set(await sizes(root(page).locator("[data-preview-quiz], [data-export]"))).size).toBe(1);
      expect(new Set(await sizes(root(page).locator('[data-round-card="r1"] [data-card-actions] button'))).size).toBe(1);
      const frame = await box(root(page).locator(".quiz-screen"));
      expect(Math.abs(frame.x - (width - (frame.x + frame.width)))).toBeLessThanOrEqual(1);
      const cards = await root(page).locator("[data-round-card]").evaluateAll((list) => list.map((card) => `${String((card as HTMLElement).offsetLeft)}/${String((card as HTMLElement).offsetWidth)}`));
      expect(new Set(cards).size).toBe(1); // the round cards share their edges
      // The round: cards that share a row have their facts and their buttons on the same lines (UX review S1).
      await page.goto("./#/quiz");
      await openQuizWith(page);
      if (!isWide) await root(page).locator('[data-focus="round:r1"]').click();
      await settled(page);
      const rows = await root(page).locator(".quiz-qcard").evaluateAll((list) => list.map((card) => { const top = Math.round(card.getBoundingClientRect().top); const part = (selector: string): number => Math.round((card.querySelector(selector)?.getBoundingClientRect().top ?? 0) - top); return { top, height: Math.round(card.getBoundingClientRect().height), facts: part(".quiz-qcard-facts"), actions: part("[data-card-actions]") }; }));
      for (const top of new Set(rows.map((row) => row.top))) {
        const sameRow = rows.filter((row) => row.top === top);
        expect(new Set(sameRow.map((row) => `${String(row.height)}/${String(row.facts)}/${String(row.actions)}`)).size, `cards of the row at ${String(top)} px`).toBe(1);
      }
      expect(new Set(await sizes(root(page).locator(".quiz-segment")))).toHaveProperty("size", 2); // "Cards" and "List": one height, their own widths
      expect(new Set((await sizes(root(page).locator(".quiz-segment"))).map((one) => one.split("×")[1])).size).toBe(1);
      // The editor: equal chips in each picker, equal buttons in its bar and at its end.
      await root(page).locator('[data-focus="question:lq2"]').click();
      await settled(page);
      for (const name of ["quiz-kind", "quiz-answer-type"]) {
        const chips = await root(page).locator(`.quiz-chip:has(input[name="${name}"])`).evaluateAll((list) => list.map((chip) => `${String((chip as HTMLElement).offsetWidth)}×${String((chip as HTMLElement).offsetHeight)}`));
        expect(new Set(chips).size, `${name} chips ${chips.join(" ")}`).toBe(1);
      }
      expect(new Set((await sizes(root(page).locator(".quiz-editor-bar button"))).map((one) => one.split("×")[1])).size).toBe(1);
      expect(new Set((await sizes(root(page).locator(".quiz-form-end button"))).map((one) => one.split("@")[0])).size).toBe(1);
      expect(new Set(await sizes(root(page).locator(".quiz-editor-arrows button"))).size).toBe(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      // A card's More list: in the middle of a wide screen, as wide as a phone's.
      await root(page).locator("[data-done]").click();
      await root(page).locator('[data-question="lq2"] [data-more]').click();
      const sheet = root(page).locator("[data-sheet]");
      await expect(sheet).toBeVisible();
      await settled(page);
      expect(await offCentre(sheet)).toBeLessThanOrEqual(1);
      const sheetBox = await box(sheet);
      expect(sheetBox.x).toBeGreaterThanOrEqual(0);
      expect(sheetBox.x + sheetBox.width).toBeLessThanOrEqual(width);
      // Play: the bar's ends are equally far from the window's edges.
      await page.keyboard.press("Escape");
      if (!isWide) await root(page).locator("[data-up]:visible").first().click();
      await root(page).locator("[data-play-quiz]").click();
      await root(page).locator("[data-unfinished-go]").click(); // one question of this quiz is unfinished: Play asks first
      await expect(view(page, "title")).toBeVisible();
      const bar = await page.locator(".qp-bar button:visible").evaluateAll((list) => list.map((button) => { const rect = button.getBoundingClientRect(); return { left: Math.round(rect.left), right: Math.round(rect.right), height: Math.round(rect.height), top: Math.round(rect.top) }; }));
      expect(bar[0]?.left).toBe(width - (bar.at(-1)?.right ?? 0));
      expect(new Set(bar.map((button) => `${String(button.height)}@${String(button.top)}`)).size).toBe(1);
    });
  });
}

/** A round of six questions: two or three cards share a row on a wide screen. */
async function openQuizWith(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) => {
    const request = indexedDB.open("quizzard-quiz");
    request.onsuccess = () => {
      const transaction = request.result.transaction(["quizzes", "media"], "readwrite");
      transaction.objectStore("quizzes").clear();
      transaction.oncomplete = () => { request.result.close(); resolve(); };
    };
  }));
  const base = longRound(6);
  const [round] = base.quiz.rounds;
  if (!round) return;
  // One question with a long points note and one unfinished: what used to push a card's rows down.
  const questions = round.questions.map((question, index) => (index === 1 ? { ...question, points: { value: 2, note: "1 for each, half for the year, and one more" } } : question)).map((question, index) => (index === 2 ? { ...question, answer: { type: "open", text: "" } } : question));
  await openQuiz(page, { ...base, quiz: { ...base.quiz, rounds: [{ ...round, questions }] } });
}

test("the page keeps equal margins and no sideways scroll with a quiz named in 80 Bulgarian characters", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openQuiz(page, pubNight({ name: "Куиз вечер в кръчмата „При Мони“ — голямото есенно издание за 2026 година!!" }));
  const name = root(page).locator("[data-quiz-name]");
  // The whole name is on show: the field grew instead of hiding it (UX review S7).
  expect(await name.evaluate((field: HTMLTextAreaElement) => field.scrollHeight - field.clientHeight)).toBeLessThanOrEqual(1);
  expect(await name.evaluate((field: HTMLTextAreaElement) => field.scrollWidth - field.clientWidth)).toBeLessThanOrEqual(1);
  expect((await name.boundingBox())?.height ?? 0).toBeGreaterThan(60);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
});
