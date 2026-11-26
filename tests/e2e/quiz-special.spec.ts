// Special rounds — Golden pyramid and Safe (quiz-creator SPEC §10): made with "Add round", kept in
// shape by the creator, filled in, and played to the end with their pictures and the Safe's bonus.
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { type SeedFile, openQuiz, play, pubNight, root, stage, view, unfinishedNight } from "./support/quiz-ux.ts";

const SPECIAL: SeedFile = JSON.parse(readFileSync(new URL("../../miniapps/quiz/packages/core/test/fixtures/v1/special-rounds.quiz.json", import.meta.url), "utf8")) as SeedFile;

async function next(page: Page, times = 1): Promise<void> {
  for (let n = 0; n < times; n += 1) await page.keyboard.press("Space");
}

/** Adds a round of a kind through the chooser; the new round opens. */
async function addKind(page: Page, kind: "pyramid" | "safe"): Promise<void> {
  await root(page).locator("[data-add-round]").click();
  await expect(page.locator("[data-sheet]")).toContainText("Golden pyramid");
  await page.locator(`[data-pick-${kind}]`).click();
  await expect(root(page).locator("[data-round-name]")).toHaveValue(kind === "pyramid" ? "Golden pyramid" : "Safe");
}

test("SR1–SR3: Add round offers the kinds; a Golden pyramid and a Safe arrive ready-made and keep their shape", async ({ page }) => {
  await openQuiz(page, pubNight());
  await addKind(page, "pyramid");
  const pane = root(page).locator(".quiz-pane--round");
  await expect(pane.locator("[data-round-kind]").first()).toBeVisible();
  await expect(pane.locator(".quiz-qcard")).toHaveCount(4);
  await expect(pane.locator("[data-add-question]")).toHaveCount(0);
  await expect(pane.locator("[data-round-fixed]")).toContainText("exactly 4 questions");
  await expect(pane.locator(".quiz-qcard [data-delete], .quiz-qcard [data-duplicate], .quiz-qcard [data-drag]")).toHaveCount(0);
  await expect(pane.locator("[data-unfinished-count]").first()).toHaveText("4 not finished");

  // Question 3 asks for 3: two accepted answers are not enough, a pasted list is.
  await pane.locator(".quiz-qcard-open").nth(2).click();
  await root(page).locator("[data-prompt]").fill("Name 3 noble gases.");
  await expect(root(page).locator("[data-answer-fixed]")).toContainText("Accepted answers");
  await expect(root(page).locator("[data-move-round]")).toHaveCount(0);
  await root(page).locator("[data-accepted-add]").click();
  await page.keyboard.type("Helium");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Neon");
  await expect(root(page).locator("[data-accepted-counter]")).toHaveText("asks for 3 · 2 accepted");
  await expect(root(page).locator("[data-accepted-short]")).toHaveText("Add 1 more to reach 3");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Argon");
  await expect(root(page).locator("[data-accepted-counter]")).toHaveText("asks for 3 · 3 accepted");
  await expect(root(page).locator("[data-timing='points'][data-fixed]")).toContainText("3 points");
  await expect(root(page).locator("[data-editor-delete], [data-editor-duplicate], [data-add-another]")).toHaveCount(0);
  await root(page).locator("[data-done]").click();

  // A Safe: five digit questions, a bonus of 3 in its settings; its questions may change places.
  await openQuiz(page, pubNight());
  await addKind(page, "safe");
  const safe = root(page).locator(".quiz-pane--round");
  await expect(safe.locator(".quiz-qcard")).toHaveCount(5);
  await expect(safe.locator(".quiz-qcard [data-move='down']").first()).toBeVisible();
  await safe.locator("[data-round-settings] summary").click();
  await expect(safe.locator("[data-bonus]")).toHaveValue("3");
  await safe.locator("[data-bonus-more]").click();
  await expect(safe.locator("[data-bonus-hint]")).toHaveText("Added on top: 5 + 4 = 9 points.");
  await expect(safe.locator("[data-round-gist]")).toHaveText("45 s · 9 points");
  await expect(safe.locator('[data-round-settings] textarea')).toHaveValue(/crack the whole code for 3 bonus points/);
  await safe.locator(".quiz-qcard-open").first().click();
  await root(page).locator(".quiz-digit-key").nth(7).click();
  await expect(root(page).locator("[data-digit-missing]")).toBeHidden();
  await expect(root(page).locator('[data-digit="7"]')).toBeChecked();
});

test("SR4: both rounds play in the app — pictures, accepted answers, the code, the Safe's bonus, totals", async ({ page }) => {
  await play(page, SPECIAL);
  await next(page, 2);
  const rules = view(page, "rules");
  await expect(rules.locator("[data-intro='pyramid'] .quiz-pyramid-tier")).toHaveCount(4);
  await expect(rules).toContainText("Up to 10 points");

  await next(page, 3); // question 3
  const slide = stage(page).locator(".quiz-slide");
  await expect(slide).toHaveAttribute("data-art", "pyramid");
  await expect(slide.locator(".quiz-pyramid-tier[data-state='current'] .quiz-pyramid-block")).toHaveCount(3);
  await expect(slide.locator(".quiz-pyramid-line")).toHaveCount(3);

  await next(page, 2); // question 4, "Answers"
  await next(page, 3); // answer 1, 2, 3 — each one slide with its answer
  await expect(stage(page).locator(".quiz-tile")).toHaveText(["Helium", "Neon", "Argon", "Krypton", "Xenon", "Radon"]);

  // To the Safe's score entry through the menu.
  await page.keyboard.press("KeyM");
  await page.locator('[data-dialog="menu"] [data-jump-screen="score"]').nth(1).click();
  const score = view(page, "score");
  await expect(score.locator("[data-safe-code]")).toHaveText("Code47192");
  // An upright screen shows the answers first and the points entry as the screen's second part.
  if ((await stage(page).getAttribute("data-one-part")) !== null) await next(page);
  const field = score.getByLabel("Digits right for Team 1");
  await field.fill("5");
  await expect(score.locator('[data-score-gives="t1"]')).toHaveText("5 + 3 bonus");
  await expect(score.locator('[data-score-total="t1"]')).toHaveText("8");
  await field.blur();
  await page.keyboard.press("KeyS");
  await expect(page.locator('[data-dialog="scores"] [data-table-total="t1"]')).toHaveText("8");
});

test("SR4: the vault turns, fills and opens on the Safe's answers", async ({ page }) => {
  await play(page, SPECIAL);
  await page.keyboard.press("KeyM");
  await page.locator('[data-dialog="menu"] [data-jump-screen="score"]').nth(1).click();
  await page.keyboard.press("ArrowLeft"); // back: the fifth answer, revealed
  const vault = stage(page).locator(".quiz-vault");
  await expect(vault).toHaveAttribute("data-door", "opening");
  await expect(vault.locator(".quiz-vault-window text")).toHaveText(["4", "7", "1", "9", "2"]);
  await expect(stage(page).locator(".quiz-digit-value")).toHaveText("2");
});

// Moni 2026-11-25: "Make the quizmaster laugh" asks for no question — the round is ready when it is added.
test("a laugh round has no questions: its screen with the built-in explanation, one optional text, never unfinished", async ({ page }) => {
  await openQuiz(page, pubNight());
  await root(page).locator("[data-add-round]").click();
  await page.locator("[data-pick-laugh]").click();
  const pane = root(page).locator(".quiz-pane--round");
  await expect(pane.locator("[data-round-name]")).toHaveValue("Make the quizmaster laugh");
  // No question list, no "Add question", no "not finished" anywhere.
  await expect(pane.locator("[data-question-list]")).toHaveCount(0);
  await expect(pane.locator("[data-unfinished-count]")).toHaveCount(0);
  await expect(root(page).locator("[data-card-unfinished]")).toHaveCount(0);
  const panel = pane.locator('[data-round-task="laugh"]');
  await expect(panel).toContainText("What the teams see");
  await expect(panel.locator(".quiz-slide-prompt")).toContainText("Think up a joke and make the quizmaster laugh!");
  // Time and the two prizes are in the settings, which are open.
  await expect(pane.locator("[data-round-settings]")).toHaveAttribute("open", "");
  await expect(pane.locator('[data-round-value="first"]')).toHaveValue("3");
  // The time is in minutes, in steps of half a minute (Moni 2026-11-26).
  await expect(pane.locator("[data-minutes]")).toHaveText("5");
  await expect(pane.locator("[data-round-gist]")).toHaveText("5 min · 3 points");
  await pane.locator("[data-minutes-less]").click();
  await expect(pane.locator("[data-minutes]")).toHaveText("4.5");
  await pane.locator("[data-minutes-more]").click();
  await pane.locator("[data-minutes-more]").click();
  await expect(pane.locator("[data-minutes]")).toHaveText("5.5");
  await expect(pane.locator("[data-round-gist]")).toHaveText("5.5 min · 3 points");
  // The optional text is shown under the explanation.
  await panel.locator("[data-round-task-text]").fill("The joke must be about the birthday girl");
  await expect(panel.locator(".quiz-slide-prompt")).toContainText("birthday girl");
  await expect(panel.locator(".quiz-slide-prompt")).toContainText("Think up a joke");
  if (process.env["LOOK"]) await page.screenshot({ path: `${process.env["LOOK"]}/laugh-round.png`, fullPage: true });
});

test("an unfinished question's card carries the red mark; a finished one does not", async ({ page }) => {
  await openQuiz(page, unfinishedNight());
  await root(page).locator(".quiz-round-open").first().click();
  const cards = root(page).locator(".quiz-pane--round [data-question-list] > li");
  await expect(cards.nth(1)).toHaveAttribute("data-card-unfinished", "");
  await expect(cards.nth(0)).not.toHaveAttribute("data-card-unfinished");
  if (process.env["LOOK"]) await page.screenshot({ path: `${process.env["LOOK"]}/unfinished.png` });
});
