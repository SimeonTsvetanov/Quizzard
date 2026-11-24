import { expect, test, type Page } from "@playwright/test";
import { LONG_NOTE, PICTURES, axe, focused, hiddenLines, longRound, openQuiz, openQuizAgain, pubNight, root, screen, seed, stored, toastWith, undoToast, unfinishedNight } from "./support/quiz-ux.ts";

// Quiz creator — the creator's side of the UX review of 2026-11-24 (docs/quiz-creator/UX-REVIEW-2026-11-24.md):
// one test per Must item and per new flow. The player's side is quiz-ux-play.spec.ts.

test.describe("on a 390 px phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("M2: opening, adding and duplicating a round never drops the focus to the page", async ({ page }) => {
    await openQuiz(page);
    await root(page).locator('[data-focus="round:r1"]').click();
    await expect(root(page).locator("#quiz-round-title")).toBeFocused();
    await root(page).locator("[data-up]:visible").first().click();
    await root(page).locator("[data-add-round]").click();
    await page.locator("[data-pick-standard]").click(); // "Add round" asks for the kind first (SPEC §10)
    const name = root(page).locator("[data-round-name]");
    await expect(name).toBeFocused();
    // The new round's name is selected whole: typing replaces "Round 3".
    expect(await name.evaluate((field: HTMLInputElement | HTMLTextAreaElement) => [field.selectionStart, field.selectionEnd, field.value.length])).toEqual([0, 7, 7]);
    await page.keyboard.type("Geography");
    await expect(name).toHaveValue("Geography");
    await root(page).locator("[data-round-settings] summary").click();
    await root(page).locator("[data-duplicate-round]").first().click();
    await expect(root(page).locator("#quiz-round-title")).toBeFocused();
    expect(await focused(page)).not.toBe("BODY");
  });

  test("M11: the editor's way back fits the screen however long the round's name is", async ({ page }) => {
    const base = pubNight();
    const long = { ...base, quiz: { ...base.quiz, rounds: [{ ...base.quiz.rounds[0], name: "Кръг за световните столици, реки, планини и морета" }, base.quiz.rounds[1]] } };
    await openQuiz(page, long as typeof base);
    await page.setViewportSize({ width: 360, height: 740 });
    await root(page).locator('[data-focus="round:r1"]').click();
    await root(page).locator('[data-focus="question:q1"]').click();
    await expect(screen(page, "editor")).toBeVisible();
    const box = await screen(page, "editor").locator(".quiz-back").boundingBox();
    expect(box).not.toBeNull();
    expect((box?.x ?? 0) + (box?.width ?? 999)).toBeLessThanOrEqual(360);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
});

test("M2: on a wide screen the round that opens is announced — the focus is its title", async ({ page }) => {
  await openQuiz(page);
  await root(page).locator('[data-focus="round:r2"]').click();
  await expect(root(page).locator("#quiz-round-title")).toBeFocused();
  await expect(root(page).locator("#quiz-round-title")).toHaveText("Round 2: Music");
});

test("M4: removing or replacing a media file, or changing the kind away from it, says so and can be undone", async ({ page }) => {
  await openQuiz(page);
  await root(page).locator('[data-focus="round:r1"]').click();
  await root(page).locator('[data-focus="question:q3"]').click();
  const file = root(page).locator("[data-media-file]");
  await expect(file.locator("[data-media-name]")).toHaveText("landscape.jpg");

  await root(page).locator("[data-media-remove]").click();
  await expect(root(page).locator("[data-media-choose]")).toBeVisible();
  await expect(toastWith(page, "Picture removed")).toBeVisible();
  await undoToast(page).click();
  await expect(file.locator("[data-media-name]")).toHaveText("landscape.jpg");
  await expect(file.locator(".quiz-file-still")).toBeVisible();

  await root(page).locator("[data-media-input]").setInputFiles(PICTURES.tall);
  await expect(file.locator("[data-media-name]")).toHaveText("tall.png");
  await expect(toastWith(page, "Picture replaced")).toBeVisible();
  await undoToast(page).click();
  await expect(file.locator("[data-media-name]")).toHaveText("landscape.jpg");

  // Picture → Text drops the file: said, and Undo brings the kind and the file back.
  await root(page).locator(".quiz-chip", { hasText: "Text" }).first().click();
  await expect(root(page).locator("[data-media-picker]")).toHaveCount(0);
  await expect(toastWith(page, "Picture removed")).toBeVisible();
  await undoToast(page).click();
  await expect(file.locator("[data-media-name]")).toHaveText("landscape.jpg");
  await expect(root(page).locator('input[name="quiz-kind"]:checked')).toHaveValue("picture");
  await expect.poll(async () => (await stored(page))[0]?.quiz.rounds[0]?.questions[2]).toMatchObject({ kind: "picture", media: { id: "m-land" } });
  await axe(page, "editor with a picture and the Undo toast");
});

test("M5: a quiz file over an existing quiz — Cancel and Escape change nothing; Replace can be undone", async ({ page }, testInfo) => {
  await openQuiz(page);
  const download = page.waitForEvent("download");
  await root(page).locator("[data-quiz-more] summary").click();
  await root(page).locator("[data-save-file]").click();
  const path = testInfo.outputPath("Pub night.quizzard");
  await (await download).saveAs(path);
  await root(page).locator("[data-quiz-name]").fill("Pub night, my newer work");
  await expect(page.locator(".quiz-saved[data-saved='saved']")).toBeVisible();
  await page.goto("./#/quiz");

  const ask = page.locator("[data-ask-dialog]");
  await root(page).locator("[data-open-file-input]").setInputFiles(path);
  await expect(ask).toContainText("“Pub night” is already in your quizzes");
  // Both dates in one format, with the time.
  await expect(ask).toContainText(/the file's was changed .*\d{4}.*\d{2}:\d{2}.*, yours .*\d{4}.*\d{2}:\d{2}/);
  await expect(ask.getByRole("button", { name: "Cancel" })).toBeFocused();
  await expect(ask.getByRole("button")).toHaveText(["Cancel", "Keep both", "Replace"]);
  await page.keyboard.press("Escape");
  await expect(ask).toHaveCount(0);
  await expect(screen(page, "library")).toBeVisible(); // no navigation
  await expect(root(page).locator(".quiz-card")).toHaveCount(1);
  await expect(root(page).locator(".quiz-card-name")).toHaveText("Pub night, my newer work");

  await root(page).locator("[data-open-file-input]").setInputFiles(path);
  await ask.getByRole("button", { name: "Cancel" }).click();
  await expect(root(page).locator(".quiz-card")).toHaveCount(1);
  expect((await stored(page)).map((one) => one.quiz.name)).toEqual(["Pub night, my newer work"]);

  await root(page).locator("[data-open-file-input]").setInputFiles(path);
  await ask.getByRole("button", { name: "Replace" }).click();
  await expect(root(page).locator("[data-quiz-name]")).toHaveValue("Pub night");
  await expect(toastWith(page, "was replaced with the file's version")).toBeVisible();
  await undoToast(page).click();
  await expect(root(page).locator("[data-quiz-name]")).toHaveValue("Pub night, my newer work");
  await expect.poll(async () => (await stored(page)).map((one) => one.quiz.name)).toEqual(["Pub night, my newer work"]);
});

test("M7: sizes are written in the unit of the limits — 15 MB, 50 MB, 250 MB", async ({ page }) => {
  await openQuiz(page);
  await expect(root(page).locator("[data-media-size]")).toContainText(/Media: 15\.3 kB of 250 MB/);
  await root(page).locator('[data-focus="round:r2"]').click();
  await root(page).locator('[data-focus="question:q4"]').click();
  for (const [kind, limit] of [["Picture", "15 MB"], ["Audio", "15 MB"], ["Video", "50 MB"]] as const) {
    await root(page).locator(".quiz-chip", { hasText: kind }).first().click();
    await expect(root(page).locator("[data-media-choose]")).toContainText(`up to ${limit}`);
  }
});

test("M10: a chip radio shows its ring on the chip, in a colour that is not the selected fill", async ({ page }) => {
  await openQuiz(page);
  await root(page).locator('[data-focus="round:r1"]').click();
  await root(page).locator('[data-focus="question:q1"]').click();
  const checked = root(page).locator('input[name="quiz-kind"]:checked');
  await checked.focus();
  await page.keyboard.press("ArrowRight"); // keyboard focus: the ring shows
  const ring = await root(page).locator('input[name="quiz-kind"]:checked').evaluate((input) => {
    const chip = input.closest("label");
    if (!chip) return null;
    const style = getComputedStyle(chip);
    const face = chip.querySelector(".quiz-chip-face");
    const size = input.getBoundingClientRect();
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth), color: style.outlineColor, fill: face ? getComputedStyle(face).backgroundColor : "", input: [Math.round(size.width), Math.round(size.height)], chip: [Math.round(chip.getBoundingClientRect().width), Math.round(chip.getBoundingClientRect().height)] };
  });
  expect(ring?.style).toBe("solid");
  expect(ring?.width).toBeGreaterThanOrEqual(2);
  expect(ring?.color).not.toBe(ring?.fill);
  expect(ring?.input).toEqual(ring?.chip); // the focused control is the whole chip, not a clipped pixel
  expect(ring?.chip[1]).toBeGreaterThanOrEqual(44);
});

test("M8 (creator): the longest points note is whole on the slide of the preview", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openQuiz(page);
  await root(page).locator('[data-focus="round:r2"]').click();
  await root(page).locator('[data-question="q4"] [data-more]').click();
  await root(page).locator("[data-sheet] [data-preview]").click();
  const note = root(page).locator("[data-preview-slide] .quiz-slide-chip--points span");
  await expect(note).toContainText(LONG_NOTE);
  expect(await note.evaluate(hiddenLines)).toBe(0);
  expect(await note.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
});

test("S16: “New quiz” asks for the name first and creates nothing until it is confirmed", async ({ page }) => {
  await page.goto("./#/quiz");
  await root(page).locator("[data-new-quiz]").click();
  const name = root(page).locator("[data-new-name]");
  await expect(name).toBeFocused();
  expect(await stored(page)).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(root(page).locator("[data-new-quiz]")).toBeFocused();
  expect(await stored(page)).toEqual([]);
  await root(page).locator("[data-new-quiz]").click();
  await root(page).locator("[data-cancel-new]").click();
  expect(await stored(page)).toEqual([]);
  await root(page).locator("[data-new-quiz]").click();
  await name.fill("Friday night");
  await page.keyboard.press("Enter");
  await expect(root(page).locator("[data-quiz-name]")).toHaveValue("Friday night");
  await expect(root(page).locator("[data-add-round]")).toBeFocused();
  expect((await stored(page)).map((one) => one.quiz.name)).toEqual(["Friday night"]);
  // Back out: one quiz, not a trail of empty "New quiz" cards.
  await page.goBack();
  await expect(root(page).locator(".quiz-card")).toHaveCount(1);
});

const order = (page: Page, attribute: string): Promise<(string | null)[]> => root(page).locator(`[${attribute}]`).evaluateAll((items, name) => items.map((item) => item.getAttribute(name)), attribute);

/** Drags a card by its handle onto another card with real pointer events (mouse down, moves, up). */
async function drag(page: Page, from: string, to: string): Promise<void> {
  // Once the cards have dealt in: a card that is still arriving is not a place to drop on.
  await page.evaluate(() => Promise.all(document.getAnimations().filter((one) => one.effect?.getComputedTiming().iterations !== Infinity).map((animation) => animation.finished.catch(() => undefined))));
  const handle = await root(page).locator(`${from} [data-drag]`).boundingBox();
  const target = await root(page).locator(to).boundingBox();
  if (!handle || !target) throw new Error("nothing to drag");
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2 + 6, handle.y + handle.height / 2 + 6, { steps: 2 });
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 8 });
  await expect(root(page).locator("[data-dragging]")).toHaveCount(1);
  await page.mouse.up();
  await expect(root(page).locator("[data-dragging]")).toHaveCount(0);
}

test("S3–S5: rounds and questions have the same row of actions, and both are reordered by dragging the handle", async ({ page }) => {
  // A tall window: every card of the round is on screen, so the pointer never reaches the edge that scrolls the page while dragging.
  const narrow = (page.viewportSize()?.width ?? 0) < 700;
  if (narrow) await page.setViewportSize({ width: page.viewportSize()?.width ?? 390, height: 2400 });
  await openQuiz(page, longRound(5));
  if (narrow) await root(page).locator('[data-focus="round:r1"]').click();
  const hooks = (scope: string): Promise<string[]> => root(page).locator(`${scope} [data-card-actions] button`).evaluateAll((buttons) => buttons.map((button) => ["data-drag", "data-move", "data-duplicate", "data-delete", "data-more"].find((name) => button.hasAttribute(name)) ?? "?"));
  const row = ["data-drag", "data-move", "data-move", "data-duplicate", "data-delete", "data-more"];
  expect(await hooks('[data-question="lq1"]')).toEqual(row);
  // Every button of the row is a 44 px target and they share one line.
  const boxes = await root(page).locator('[data-question="lq1"] [data-card-actions] button').evaluateAll((buttons) => buttons.map((button) => [(button as HTMLElement).offsetWidth, (button as HTMLElement).offsetHeight, (button as HTMLElement).offsetTop]));
  expect(new Set(boxes.map((box) => box.join("x"))).size).toBe(1);
  expect(boxes[0]?.slice(0, 2)).toEqual([44, 44]);

  await drag(page, '[data-question="lq1"]', '[data-question="lq3"]');
  expect(await order(page, "data-question")).toEqual(["lq2", "lq3", "lq1", "lq4", "lq5"]);
  await expect.poll(async () => (await stored(page))[0]?.quiz.rounds[0]?.questions.map((question) => question.id)).toEqual(["lq2", "lq3", "lq1", "lq4", "lq5"]);
  // Escape while dragging puts the card back.
  const handle = await root(page).locator('[data-question="lq2"] [data-drag]').boundingBox();
  const target = await root(page).locator('[data-question="lq4"]').boundingBox();
  await page.mouse.move((handle?.x ?? 0) + 22, (handle?.y ?? 0) + 22);
  await page.mouse.down();
  await page.mouse.move((target?.x ?? 0) + 40, (target?.y ?? 0) + 40, { steps: 6 });
  await page.keyboard.press("Escape");
  await page.mouse.up();
  expect(await order(page, "data-question")).toEqual(["lq2", "lq3", "lq1", "lq4", "lq5"]);
  // The handle's arrow keys move the card too, and keep the focus on it.
  await root(page).locator('[data-question="lq2"] [data-drag]').focus();
  await page.keyboard.press("ArrowDown");
  expect(await order(page, "data-question")).toEqual(["lq3", "lq2", "lq1", "lq4", "lq5"]);
  await expect(root(page).locator('[data-question="lq2"] [data-drag]')).toBeFocused();

  // Rounds: the same row, the same drag.
  await page.goto("./#/quiz");
  await openQuizAgain(page, pubNight());
  expect(await hooks('[data-round-card="r1"]')).toEqual(row);
  await drag(page, '[data-round-card="r1"]', '[data-round-card="r2"]');
  expect(await order(page, "data-round-card")).toEqual(["r2", "r1"]);
  await root(page).locator('[data-round-card="r1"] [data-move="up"]').click();
  expect(await order(page, "data-round-card")).toEqual(["r1", "r2"]);
});

test("S4: “Move to round…” from a card's More list and from the top of the editor; both can be undone", async ({ page }) => {
  await openQuiz(page);
  await root(page).locator('[data-focus="round:r1"]').click();
  await root(page).locator('[data-question="q2"] [data-more]').click();
  const sheet = root(page).locator("[data-sheet]");
  await expect(sheet.getByRole("button")).toContainText(["Preview", "Play from here", "Move to the top", "Move to the bottom", "Move to round…"]);
  await sheet.locator("[data-move-round-menu]").click();
  await expect(sheet.locator("[data-pick-round]")).toHaveText(["1. History", "2. Music"]);
  await expect(sheet.locator("[data-pick-round]").first()).toHaveAttribute("aria-disabled", "true");
  await sheet.locator("[data-pick-round]").nth(1).click();
  await expect(sheet).toHaveCount(0);
  await expect(root(page).locator('[data-question="q2"]')).toHaveCount(0);
  await expect(toastWith(page, "Question 2 moved to “Music”")).toBeVisible();
  await undoToast(page).click();
  await expect(root(page).locator('[data-question="q2"]')).toHaveCount(1);
  expect(await order(page, "data-question")).toEqual(["q1", "q2", "q3"]);
  // The editor: the round is right under the title.
  await root(page).locator('[data-focus="question:q1"]').click();
  const picker = root(page).locator("[data-move-round]");
  const title = await root(page).locator("#quiz-editor-title").boundingBox();
  const select = await picker.boundingBox();
  expect((select?.y ?? 999) - ((title?.y ?? 0) + (title?.height ?? 0))).toBeLessThan(80);
  await picker.selectOption("r2");
  await expect(root(page).locator("#quiz-editor-title")).toHaveText("Question 2");
  await expect.poll(async () => (await stored(page))[0]?.quiz.rounds.map((round) => round.questions.map((question) => question.id))).toEqual([["q2", "q3"], ["q4", "q1"]]);
});

test("S8: a long round as a compact list — 56 px rows, remembered on this device", async ({ page }) => {
  await openQuiz(page, longRound(14));
  if ((page.viewportSize()?.width ?? 0) < 700) await root(page).locator('[data-focus="round:r1"]').click();
  await expect(root(page).locator('[data-view-mode="cards"]')).toHaveAttribute("aria-pressed", "true");
  const tall = await root(page).locator("[data-question-list]").evaluate((list) => list.getBoundingClientRect().height);
  await root(page).locator('[data-view-mode="list"]').click();
  await expect(root(page).locator('[data-view-mode="list"]')).toBeFocused();
  const rows = root(page).locator(".quiz-qrow");
  await expect(rows).toHaveCount(14);
  const heights = await rows.evaluateAll((list) => list.map((row) => Math.round(row.getBoundingClientRect().height)));
  expect(new Set(heights)).toEqual(new Set([56]));
  // One column of cards is more than three times as long; three columns of cards are still longer than the list.
  expect(await root(page).locator("[data-question-list]").evaluate((list) => list.getBoundingClientRect().height)).toBeLessThan((page.viewportSize()?.width ?? 0) < 700 ? tall / 3 : tall);
  await expect(rows.first()).toContainText("Question number 1?");
  // A row keeps the handle and More; More carries the rest.
  await rows.nth(1).locator("[data-more]").click();
  await expect(root(page).locator("[data-sheet]").getByRole("button")).toContainText(["Move up", "Move down", "Duplicate", "Delete"]);
  await root(page).locator("[data-sheet] [data-delete]").click();
  await expect(rows).toHaveCount(13);
  await undoToast(page).click();
  await expect(rows).toHaveCount(14);
  await expect(page.locator(".toast")).toHaveCount(0, { timeout: 8000 }); // on a phone the note lies over the first rows for a moment
  await drag(page, '[data-question="lq1"]', '[data-question="lq3"]');
  expect((await order(page, "data-question")).slice(0, 3)).toEqual(["lq2", "lq3", "lq1"]);
  await axe(page, "round as a list");
  await page.reload();
  await expect(root(page).locator(".quiz-qrow")).toHaveCount(14);
  await root(page).locator('[data-view-mode="cards"]').click();
  await expect(root(page).locator(".quiz-qcard")).toHaveCount(14);
});

test("S9: Play and Export ask first while questions are unfinished — with the list, a way to each, and a way on", async ({ page }) => {
  await openQuiz(page, unfinishedNight());
  await expect(root(page).locator("[data-quiz-unfinished]")).toHaveText("2 questions are not finished");
  await expect(root(page).locator('[data-round-card="r1"] [data-unfinished-count]')).toHaveText("1 not finished");
  await root(page).locator("[data-play-quiz]").click();
  const sheet = root(page).locator("[data-sheet]");
  await expect(sheet).toContainText("2 questions are not finished");
  await expect(sheet.locator("[data-unfinished-item]")).toContainText(["History · question 2", "Music · question 1"]);
  await expect(sheet.locator("[data-unfinished-cancel]")).toBeFocused();
  await axe(page, "unfinished questions sheet");
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await expect(root(page).locator("[data-play-quiz]")).toBeFocused();
  await root(page).locator("[data-play-quiz]").click();
  await sheet.locator("[data-unfinished-item]").nth(1).click();
  await expect(screen(page, "editor")).toBeVisible();
  await expect(root(page).locator("#quiz-editor-title")).toHaveText("Question 1");
  await page.goBack();
  await root(page).locator("[data-play-quiz]").click();
  await sheet.locator("[data-unfinished-go]").click();
  await expect(page.locator('.qp-stage[data-stage="live"] [data-view="title"]')).toBeVisible();
  await page.locator('.qp-bar [data-control="exit"]').click();
  // Export asks the same question.
  await root(page).locator("[data-export]").click();
  await expect(sheet.locator("[data-unfinished-go]")).toHaveText("Export anyway");
  const download = page.waitForEvent("download");
  await sheet.locator("[data-unfinished-go]").click();
  expect((await download).suggestedFilename()).toMatch(/^Pub[ _]night\.html$/);
});

test("S5 + T1–T4: the editor adds another question that starts like the last one, walks to its neighbours, and deletes with Undo", async ({ page }) => {
  await openQuiz(page);
  await root(page).locator('[data-focus="round:r2"]').click();
  await root(page).locator('[data-focus="question:q4"]').click();
  await expect(root(page).locator("[data-editor-where]")).toHaveText("of 1");
  await root(page).locator(".quiz-form .quiz-chip", { hasText: "Multiple choice" }).click();
  await expect(root(page).locator("[data-sticky-note]")).toHaveText("New questions in this round start like this.");
  await expect(root(page).locator("[data-correct-caption]")).toHaveText("Correct");
  // Enter walks the options and adds one after the last.
  const options = root(page).locator('.quiz-options input[type="text"]');
  await options.first().fill("Queen");
  await page.keyboard.press("Enter");
  await expect(options.nth(1)).toBeFocused();
  await page.keyboard.type("Abba");
  await page.keyboard.press("Enter");
  await expect(options).toHaveCount(3);
  await expect(options.nth(2)).toBeFocused();
  // Removing an option that has text can be undone.
  await root(page).getByRole("button", { name: "Remove option B" }).click();
  await expect(options).toHaveCount(2);
  await expect(toastWith(page, "Option B removed")).toBeVisible();
  await undoToast(page).click();
  await expect(options.nth(1)).toHaveValue("Abba");
  // Ctrl+Enter: done, and the next question — of the kind just used.
  await page.keyboard.press("Control+Enter");
  await expect(root(page).locator("#quiz-editor-title")).toHaveText("Question 2");
  await expect(root(page).locator('input[name="quiz-answer-type"]:checked')).toHaveValue("choice");
  await expect(root(page).locator("[data-prompt]")).toBeFocused();
  await root(page).locator("[data-prompt]").fill("Second");
  await root(page).locator("[data-add-another]").click();
  await expect(root(page).locator("#quiz-editor-title")).toHaveText("Question 3");
  // The arrows walk the quiz without going back to the list.
  await root(page).locator("[data-editor-previous]").click();
  await expect(root(page).locator("#quiz-editor-title")).toHaveText("Question 2");
  await expect(root(page).locator("[data-prompt]")).toHaveValue("Second");
  await expect(root(page).locator("[data-editor-previous]")).toBeFocused();
  await page.keyboard.press("Alt+ArrowDown");
  await expect(root(page).locator("#quiz-editor-title")).toHaveText("Question 3");
  await expect(root(page).locator("[data-editor-next]")).toBeDisabled();
  // Duplicate and delete live in the editor too.
  await root(page).locator("[data-editor-previous]").click();
  await root(page).locator("[data-editor-duplicate]").click();
  await expect(root(page).locator("#quiz-editor-title")).toHaveText("Question 3");
  await expect(root(page).locator("[data-prompt]")).toHaveValue("Second");
  await root(page).locator("[data-editor-delete]").click();
  await expect(screen(page, "editor")).toHaveCount(0);
  await expect(root(page).locator("[data-question]")).toHaveCount(3);
  await undoToast(page).click();
  await expect(root(page).locator("[data-question]")).toHaveCount(4);
  await expect(toastWith(page, "Undone")).toBeVisible();
  // One Back from the round is the quiz (or, wide, the library): the editor's own moves added no entries.
  await axe(page, "round after editing");
});

test("T7: the library has a search field from six quizzes; it filters as it is typed in", async ({ page }) => {
  const named = (id: string, name: string): ReturnType<typeof pubNight> => { const base = pubNight({ id, name }); return { ...base, media: [] }; };
  await seed(page, named("a", "Pub night"), named("b", "Christmas special"), named("c", "Pub classics"), named("d", "Music 80s"), named("e", "Kids"));
  await expect(root(page).locator("[data-search]")).toHaveCount(0);
  await seed(page, named("a", "Pub night"), named("b", "Christmas special"), named("c", "Pub classics"), named("d", "Music 80s"), named("e", "Kids"), named("f", "Sports"));
  const search = root(page).locator("[data-search]");
  await search.fill("pub");
  await expect(root(page).locator(".quiz-card:visible .quiz-card-name")).toHaveText(["Pub night", "Pub classics"], { ignoreCase: true });
  await search.fill("PUB class");
  await expect(root(page).locator(".quiz-card:visible")).toHaveCount(1);
  await search.fill("zzz");
  await expect(root(page).locator(".quiz-card:visible")).toHaveCount(0);
  await expect(root(page).locator("[data-search-none]")).toHaveText("No quiz has “zzz” in its name.");
  await search.fill("");
  await expect(root(page).locator(".quiz-card:visible")).toHaveCount(6);
  await axe(page, "library with search");
});

test("T14: “Print answers” gives the printer a host sheet — rounds, questions, answers, explanations, host notes, points — and nothing else", async ({ page }) => {
  await page.addInitScript(() => { window.print = () => { document.documentElement.setAttribute("data-printed", String(Number(document.documentElement.getAttribute("data-printed") ?? "0") + 1)); }; });
  await openQuiz(page);
  await root(page).locator("[data-quiz-more] summary").click();
  await root(page).locator("[data-print-answers]").click();
  await expect(page.locator("html")).toHaveAttribute("data-printed", "1");
  const sheet = root(page).locator("[data-print-sheet]");
  await expect(sheet).toBeHidden(); // on screen it does not exist
  await expect(sheet.locator("h1")).toHaveText("Pub night");
  await expect(sheet.locator("[data-print-round]")).toHaveCount(2);
  await expect(sheet.locator("[data-print-round] h2")).toHaveText(["Round 1/2 · History", "Round 2/2 · Music"]);
  const first = sheet.locator('[data-print-question="q1"]');
  await expect(first).toContainText("1. Which river flows through Paris?");
  await expect(first.locator("[data-print-answer]")).toHaveText("Answer: The Seine");
  await expect(first.locator("[data-print-explanation]")).toHaveText("Explanation: It splits around two islands.");
  await expect(first.locator("[data-print-note]")).toHaveText("Host note: Accept “Sena”.");
  await expect(sheet.locator('[data-print-question="q4"]')).toContainText(`3 points · ${LONG_NOTE}`);
  // On paper: the sheet alone, black on white, a round to a page.
  await page.emulateMedia({ media: "print" });
  await expect(sheet).toBeVisible();
  for (const selector of [".app-header", ".app-footer", "[data-play-quiz]"]) await expect(page.locator(selector).first()).toBeHidden();
  const paper = await sheet.evaluate((element) => ({ color: getComputedStyle(element).color, background: getComputedStyle(element).backgroundColor, breaks: [...element.querySelectorAll("[data-print-round]")].map((round) => getComputedStyle(round).breakBefore) }));
  expect(paper).toEqual({ color: "rgb(0, 0, 0)", background: "rgb(255, 255, 255)", breaks: ["auto", "page"] });
  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await expect(sheet).toHaveCount(0);
});

test("T11: “Play from here” starts the game at that question; a reload of Play continues there", async ({ page }) => {
  await openQuiz(page);
  await root(page).locator('[data-focus="round:r1"]').click();
  await root(page).locator('[data-question="q3"] [data-more]').click();
  await root(page).locator("[data-sheet] [data-play-from]").click();
  const live = page.locator('.qp-stage[data-stage="live"]');
  await expect(live.locator(".quiz-slide-prompt")).toHaveText("What is this test card called?");
  await expect(live.locator("[data-slide-number] [data-count]")).toHaveAttribute("data-count", "3/3");
  await page.keyboard.press("Space");
  await page.reload();
  await expect(live.locator('[data-view="answers"]')).toBeVisible(); // not thrown back to question 3
  await page.locator('.qp-bar [data-control="exit"]').click();
  if ((page.viewportSize()?.width ?? 0) < 700) await root(page).locator("[data-up]:visible").first().click(); // a phone is back on the round's own page
  await root(page).locator('[data-round-card="r2"] [data-more]').click();
  await root(page).locator("[data-sheet] [data-play-from]").click();
  await expect(live.locator('[data-view="rules"]')).toContainText("Music");
});
