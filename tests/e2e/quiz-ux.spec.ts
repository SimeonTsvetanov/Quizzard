import { expect, test } from "@playwright/test";
import { LONG_NOTE, hiddenLines, PICTURES, axe, focused, openQuiz, pubNight, root, screen, stored, toastWith, undoToast } from "./support/quiz-ux.ts";

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
  await root(page).locator('[data-question="q4"] [data-preview]').click();
  const note = root(page).locator("[data-preview-slide] .quiz-slide-chip--points span");
  await expect(note).toContainText(LONG_NOTE);
  expect(await note.evaluate(hiddenLines)).toBe(0);
  expect(await note.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
});
