import { expect, test, type Locator, type Page } from "@playwright/test";
import { openQuiz, pubNight, root, screen, type SeedFile } from "./support/quiz-ux.ts";

// A slide never cuts its text (Moni 2026-11-25): a long answer, question or text with the answer is drawn
// smaller until all of it is on the slide — in the editor's live preview and on the thumbnails
// (player/src/render/fit.ts). No "…", nothing below the slide's edge.

const LONG_ANSWER = "Изследване и посещаване на изоставени, разрушени или труднодостъпни сгради и съоръжения";
const LONGEST_ANSWER = "Изследване и посещаване на изоставени сгради ".repeat(7).slice(0, 300);
const LONG_EXPLANATION = "Думата идва от urban exploration и описва хоби, при което хората обикалят места, затворени за обществото. ".repeat(6).slice(0, 700);

/** A quiz of one round with three text questions: a long answer, the longest answer with the longest explanation, a long question. */
function longTexts(): SeedFile {
  const base = pubNight();
  const [first] = base.quiz.rounds;
  if (!first) throw new Error("pubNight has no round");
  const open = (id: string, prompt: string, text: string, extra: object = {}): object => ({ id, kind: "text", prompt, answer: { type: "open", text }, ...extra });
  const questions = [
    open("q1", "Какво е urbex туризъм (urbex tourism)?", LONG_ANSWER),
    open("q2", "Какво е urbex туризъм (urbex tourism)?", LONGEST_ANSWER, { explanation: LONG_EXPLANATION }),
    open("q3", "Защо ".repeat(100).slice(0, 499) + "?", LONG_ANSWER),
  ];
  return { ...base, media: [], quiz: { ...base.quiz, rounds: [{ ...first, questions }] } };
}

/** How many pixels of a slide's content lie below its edge, and how many of its texts are cut. */
async function cut(slide: Locator): Promise<{ below: number; clipped: number }> {
  return slide.evaluate((element) => {
    const canvas = element.querySelector(".quiz-slide-canvas");
    const texts = [...element.querySelectorAll(".quiz-slide-prompt, .quiz-slide-right, .quiz-slide-explanation span")];
    return {
      below: canvas ? Math.max(0, canvas.scrollHeight - canvas.clientHeight - 1) : -1,
      // Half a line or more hidden is a cut; a pixel or two is only the letters' own overhang.
      clipped: texts.filter((text) => text.scrollHeight - text.clientHeight > parseFloat(getComputedStyle(text).lineHeight) / 2).length,
    };
  });
}

async function openQuestion(page: Page, number: number): Promise<Locator> {
  await root(page).locator(".quiz-round-open").first().click();
  await root(page).getByRole("button", { name: new RegExp(`^Question ${String(number)}`) }).first().click();
  await expect(screen(page, "editor")).toBeVisible();
  return screen(page, "editor").locator("[data-live-slide] .quiz-slide");
}

// The live preview stands beside the form on a wide screen; a phone's editor opens the Preview screen instead.
test.skip(({ isMobile }) => isMobile, "the live preview is a wide-screen part");

for (const number of [1, 2, 3]) {
  test(`the live preview shows all of a long text, question and answer side (question ${String(number)})`, async ({ page }) => {
    await page.goto("#/quiz");
    await openQuiz(page, longTexts());
    let slide = await openQuestion(page, number);
    await expect.poll(() => cut(slide)).toEqual({ below: 0, clipped: 0 });

    await screen(page, "editor").locator("[data-live] [data-reveal-toggle]").click();
    slide = screen(page, "editor").locator("[data-live-slide] .quiz-slide[data-reveal]");
    await expect(slide.locator(".quiz-slide-right")).toBeVisible();
    await expect.poll(() => cut(slide)).toEqual({ below: 0, clipped: 0 });
    // The whole answer is in the slide's text, not ended by the stylesheet.
    await expect(slide.locator(".quiz-slide-right")).toHaveCSS("-webkit-line-clamp", "none");
  });
}
