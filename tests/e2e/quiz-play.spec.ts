import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { expect, test, type Browser, type BrowserContext, type Locator, type Page, type TestInfo } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Quiz creator, slice 2 (docs/quiz-creator SPEC F9, F11, §6; AC6, AC9, AC11): the quiz played in the
// app ("Play"), exported to one HTML file and played from disk with the network off, the audience
// window, and the stage on a phone and a projector. The game's reducer, the export assembler and
// the channel are unit tested (miniapps/quiz/packages/{player,core}/test).
const root = (page: Page) => page.locator('[data-miniapp="quiz"]');
const stage = (page: Page) => page.locator('.qp-stage[data-stage="live"]');
const view = (page: Page, name: string) => stage(page).locator(`[data-view="${name}"]`);
const control = (page: Page, name: string) => page.locator(`.qp-bar [data-control="${name}"]`);
const panel = (page: Page) => page.locator("[data-panel]");
const next = (page: Page, times = 1) => (async () => { for (let n = 0; n < times; n += 1) await page.keyboard.press("Space"); })();

/** The quiz every test plays: two rounds, one question of every answer type, a points note, a 5 s timer in round 1. */
const QUIZ = {
  format: "quizzard-quiz",
  version: 1,
  media: [],
  quiz: {
    id: "play-quiz", name: "Pub night", createdAt: "2026-11-23T10:00:00.000Z", updatedAt: "2026-11-23T10:00:00.000Z", language: "en", settings: { teams: 4 },
    rounds: [
      {
        id: "r1", kind: "standard", name: "History", rules: "No phones.", defaults: { seconds: 5, points: { value: 1 }, questionKind: "text", answerType: "open" },
        questions: [
          { id: "q1", kind: "text", prompt: "Which river flows through Paris?", answer: { type: "open", text: "The Seine" }, explanation: "It splits around two islands." },
          { id: "q2", kind: "text", prompt: "Which of these are planets?", answer: { type: "choice", options: [{ id: "a", text: "Mars" }, { id: "b", text: "Europa" }, { id: "c", text: "Venus" }], correct: ["a", "c"] }, points: { value: 2, note: "1 for each planet" } },
        ],
      },
      {
        id: "r2", kind: "standard", name: "Music", defaults: { seconds: 30, points: { value: 1 }, questionKind: "text", answerType: "open" },
        questions: [{ id: "q3", kind: "text", prompt: "The Beatles played a concert on a rooftop.", answer: { type: "trueFalse", correct: true } }],
      },
    ],
  },
};

/** Puts a quiz into the creator's library (its IndexedDB store) and opens it. */
async function openQuiz(page: Page, file: object = QUIZ): Promise<void> {
  await page.goto("./#/quiz");
  await expect(root(page).getByRole("heading", { name: "Your quizzes" })).toBeVisible();
  await page.evaluate(
    (record) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("quizzard-quiz");
        request.onsuccess = () => {
          const transaction = request.result.transaction("quizzes", "readwrite");
          transaction.objectStore("quizzes").put(record);
          transaction.oncomplete = () => {
            request.result.close();
            resolve();
          };
          transaction.onerror = () => { reject(new Error("seed failed")); };
        };
      }),
    file,
  );
  await page.reload();
  await root(page).locator(".quiz-card button").first().click();
  await expect(root(page).locator("[data-play-quiz]")).toBeVisible();
}

async function play(page: Page, file: object = QUIZ): Promise<void> {
  await openQuiz(page, file);
  await root(page).locator("[data-play-quiz]").click();
  await expect(view(page, "title")).toBeVisible();
}

/** Exports the seeded quiz and saves the downloaded page; returns its path. */
async function exportFile(page: Page, testInfo: TestInfo): Promise<string> {
  await openQuiz(page);
  const download = page.waitForEvent("download");
  await root(page).locator("[data-export]").click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^Pub[ _]night\.html$/); // WebKit writes the space as "_"
  const path = testInfo.outputPath("Pub night.html");
  await file.saveAs(path);
  return path;
}

/** What a page did that an offline, self-contained file must never do. */
interface Watch {
  readonly requests: string[];
  readonly errors: string[];
}

/** A context with the network off that records every request that is not the file itself and every error. */
async function offlineContext(browser: Browser, viewport = { width: 1280, height: 720 }): Promise<{ context: BrowserContext; watch: Watch }> {
  const context = await browser.newContext({ offline: true, viewport });
  const watch: Watch = { requests: [], errors: [] };
  await context.route(/^(?!file:|data:|blob:)/, (route) => {
    watch.requests.push(route.request().url());
    return route.abort();
  });
  context.on("request", (request) => { if (!/^(file|data|blob):/.test(request.url())) watch.requests.push(request.url()); });
  context.on("weberror", (error) => watch.errors.push(error.error().message));
  context.on("console", (message) => { if (message.type() === "error") watch.errors.push(message.text()); });
  return { context, watch };
}

/** The stepper's "+" of a team on the stage or in the host panel. */
const more = (scope: Locator, team: string) => scope.getByRole("button", { name: `One point more for ${team}` });

test("AC9: Play runs a whole game in the app — teams, timer with auto-advance, reveal, scores, leaderboard, tie, podium — and a reload in the middle continues", async ({ page }) => {
  test.slow(); // one question runs its real 5 s timer and cue
  await play(page);
  await expect(view(page, "title")).toContainText("Pub night");
  await expect(view(page, "title")).toContainText("2 rounds · 3 questions");
  await expect(control(page, "back")).toBeDisabled();

  await next(page);
  const teams = view(page, "teams-view");
  await expect(teams.locator("[data-team-name]")).toHaveCount(4);
  await teams.getByRole("button", { name: "Remove Team 4" }).click();
  await expect(teams.locator("[data-team-name]")).toHaveCount(3);
  await teams.getByLabel("Name of team 1").fill("Foxes");
  await page.keyboard.press("Enter"); // leaves the field: Space is "next" again

  await next(page);
  await expect(view(page, "rules")).toContainText("History");
  await expect(view(page, "rules")).toContainText("5 s per question");
  await expect(view(page, "rules")).toContainText("No phones.");

  // The question's timer starts by itself; when it ends the cue shows and the next question follows.
  await next(page);
  await expect(stage(page).locator(".quiz-slide-prompt")).toHaveText("Which river flows through Paris?");
  await expect(stage(page).locator("[data-dial]")).toHaveAttribute("data-status", "running");
  await expect(stage(page).getByText("The Seine")).toHaveCount(0);
  await expect(stage(page).locator(".qp-cue")).toContainText("Time is up", { timeout: 9000 });
  await expect(stage(page).locator(".quiz-slide-prompt")).toHaveText("Which of these are planets?", { timeout: 6000 });
  await expect(stage(page).locator("[data-slide-points]")).toContainText("2 points · 1 for each planet");
  await page.keyboard.press("KeyT");
  await expect(stage(page).locator("[data-dial]")).toHaveAttribute("data-status", "paused");

  // A reload in the middle: the same question, the timer paused, the teams as they were.
  await page.reload();
  await expect(stage(page).locator(".quiz-slide-prompt")).toHaveText("Which of these are planets?");
  await expect(stage(page).locator("[data-dial]")).toHaveAttribute("data-status", "paused");

  await next(page);
  await expect(view(page, "answers")).toContainText("Answers");

  // Answers one by one: the question first, the answer and its explanation only at the reveal.
  await next(page);
  await expect(stage(page).locator(".quiz-slide-prompt")).toHaveText("Which river flows through Paris?");
  await expect(stage(page).getByText("The Seine")).toHaveCount(0);
  await expect(control(page, "next")).toHaveAccessibleName("Show answer");
  await control(page, "next").click();
  await expect(stage(page).locator(".quiz-slide-right")).toHaveText("The Seine");
  await expect(stage(page).locator(".quiz-slide-explanation")).toContainText("It splits around two islands.");
  await next(page);
  await expect(stage(page).locator(".quiz-slide-option[data-correct]")).toHaveCount(0);
  await next(page);
  await expect(stage(page).locator(".quiz-slide-option[data-correct]")).toHaveText(["AMars", "CVenus"]);

  // Score entry: a number per team; the question's points note is on the screen (AC3).
  await next(page);
  const score = view(page, "score");
  await expect(score.locator("[data-score-row]")).toHaveCount(3);
  await expect(score.locator(".qp-guide")).toContainText("2 points · 1 for each planet");
  await more(score, "Foxes").click();
  await more(score, "Foxes").click();
  await more(score, "Team 2").click();
  await score.getByLabel("Points of Team 3").fill("2");
  await page.keyboard.press("Tab");
  await expect(score.locator('[data-score-total="t1"]')).toHaveText("2");
  await expect(score.locator('[data-score-total="t3"]')).toHaveText("2");

  await page.locator(".qp-heading").click(); // focus off the field
  await next(page);
  const board = view(page, "board");
  await expect(board.locator(".qp-board-name")).toHaveText(["Foxes", "Team 3", "Team 2"]);
  await expect(board.locator("[data-board-total]")).toHaveText(["2", "2", "1"]);
  expect(await board.locator(".qp-board-row").evaluateAll((rows) => rows.map((row) => row.getAttribute("data-rank")))).toEqual(["1", "1", "3"]);

  // Round 2, then level on points: the tiebreak, the host names the winner, the podium.
  await next(page, 2);
  await expect(stage(page).locator(".quiz-slide-prompt")).toHaveText("The Beatles played a concert on a rooftop.");
  await next(page, 3);
  await expect(stage(page).locator(".quiz-slide-option[data-correct]")).toHaveText("True");
  await next(page);
  await more(view(page, "score"), "Foxes").click();
  await more(view(page, "score"), "Team 3").click();
  await next(page);
  await expect(view(page, "board").locator("[data-board-total]")).toHaveText(["3", "3", "1"]);
  await next(page);
  const tie = view(page, "tie");
  await expect(tie).toContainText("A tie for first place");
  await expect(tie.locator("[data-tie-team]")).toHaveCount(2);
  await tie.getByRole("button", { name: "Team 3 wins the tiebreak" }).click();
  await expect(tie.locator('[data-tie-team="t3"]')).toHaveAttribute("data-winner", "");
  await next(page);
  const podium = view(page, "final").locator("[data-podium-team]");
  await expect(podium).toHaveCount(3);
  await expect(view(page, "final").locator('[data-podium-team][data-rank="1"]')).toContainText("Team 3");
  await expect(view(page, "final").locator('[data-podium-team][data-rank="2"]')).toContainText("Foxes");
  await expect(view(page, "final").locator('[data-podium-team][data-rank="3"]')).toContainText("Team 2");
  await expect(control(page, "next")).toBeDisabled();

  // Back to the quiz: the creator is as it was, the focus on Play.
  await control(page, "exit").click();
  await expect(root(page).locator("[data-play-quiz]")).toBeFocused();
  await expect(stage(page)).toHaveCount(0);
});

test("AC9: the menu jumps to a round, switches auto-advance off and starts the game again; S shows every round's scores", async ({ page }) => {
  await play(page);
  await page.keyboard.press("KeyM");
  const menu = page.locator('[data-dialog="menu"]');
  await expect(menu).toBeVisible();
  await menu.locator("[data-auto]").uncheck();
  await menu.locator('[data-jump-round="r2"]').click();
  await expect(menu).toHaveCount(0);
  await expect(view(page, "rules")).toContainText("Music");
  await next(page);
  await expect(stage(page).locator("[data-dial]")).toHaveAttribute("data-status", "idle"); // it waits for T
  await page.keyboard.press("KeyT");
  await expect(stage(page).locator("[data-dial]")).toHaveAttribute("data-status", "running");
  await page.keyboard.press("KeyR");
  await expect(stage(page).locator("[data-dial]")).toHaveAttribute("data-status", "idle");
  await page.keyboard.press("ArrowLeft");
  await expect(view(page, "rules")).toBeVisible();

  await page.keyboard.press("KeyS");
  const scores = page.locator('[data-dialog="scores"]');
  await scores.getByLabel("Team 2, History").fill("4");
  await expect(scores.locator('[data-table-total="t2"]')).toHaveText("4");
  await page.keyboard.press("KeyS"); // typing "s" in the field would not close it: the key belongs to the field
  await expect(scores).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(scores).toHaveCount(0);

  // "Start the game again" (UX review M6): a real question with the numbers, Cancel first; then an Undo strip.
  const confirm = page.locator('[data-dialog="confirm"]');
  await page.keyboard.press("KeyM");
  await menu.locator("[data-restart]").click();
  await expect(menu).toHaveCount(0);
  await expect(confirm).toContainText("Start the game again?");
  await expect(confirm).toContainText("This clears 4 points of 1 team");
  await expect(confirm.locator('[data-confirm="cancel"]')).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(confirm).toHaveCount(0);
  await expect(view(page, "rules")).toBeVisible(); // nothing happened
  await page.keyboard.press("KeyM");
  await menu.locator("[data-restart]").click();
  await confirm.locator('[data-confirm="ok"]').click();
  await expect(view(page, "title")).toBeVisible();
  const strip = page.locator("[data-undo-strip]");
  await expect(strip).toContainText("Scores cleared");
  await page.keyboard.press("KeyS");
  await expect(scores.locator('[data-table-total="t2"]')).toHaveText("0");
  await page.keyboard.press("Escape");
  await strip.locator("[data-undo]").click();
  await expect(strip).toBeHidden();
  await expect(view(page, "rules")).toBeVisible(); // the game is back where it was, with its points
  await page.keyboard.press("KeyS");
  await expect(scores.locator('[data-table-total="t2"]')).toHaveText("4");
});

test("AC6: Export to play saves one HTML file that opens from disk with the network off and plays, saves its game and loads nothing", async ({ page, browser }, testInfo) => {
  const path = await exportFile(page, testInfo);
  await expect(root(page).locator("[data-exported]")).toContainText(/Exported: Pub night\.html · \d+(\.\d+)? kB/);
  await expect(page.getByRole("status").filter({ hasText: "Saved “Pub night.html”" })).toBeVisible();

  const html = readFileSync(path, "utf8");
  expect(html).toMatch(/<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'sha256-[A-Za-z0-9+/=]+'; style-src 'sha256-[A-Za-z0-9+/=]+'; img-src data: blob:; media-src data: blob:; font-src data:; base-uri 'none'; form-action 'none'">/);
  expect(html).not.toMatch(/(?:src|href)="https?:/);
  expect(html).toContain('<script type="application/json" id="qp-quiz">');
  expect(html.length).toBeLessThan(400_000); // a text-only quiz is the template and a few KB

  const { context, watch } = await offlineContext(browser);
  const file = await context.newPage();
  await file.goto(pathToFileURL(path).href);
  await expect(view(file, "title")).toContainText("Pub night");
  await expect(file).toHaveTitle("Pub night");
  // The fonts are inside the file.
  expect(await file.evaluate(async () => {
    await document.fonts.ready;
    return [document.fonts.check('700 40px "Unbounded"'), document.fonts.check('600 40px "Manrope"'), [...document.fonts].every((font) => font.status !== "error")];
  })).toEqual([true, true, true]);

  // A round, with the keys of the reference quiz.
  await next(file, 3);
  await expect(stage(file).locator(".quiz-slide-prompt")).toHaveText("Which river flows through Paris?");
  await file.keyboard.press("KeyT");
  await next(file, 3); // question 2, "Answers", answer 1
  await expect(stage(file).getByText("The Seine")).toHaveCount(0);
  await next(file);
  await expect(stage(file).locator(".quiz-slide-right")).toHaveText("The Seine");
  await next(file, 3);
  await more(view(file, "score"), "Team 2").click();
  await next(file);
  await expect(view(file, "board").locator(".qp-board-name").first()).toHaveText("Team 2");

  // The game is saved in the file's own storage: a reload continues on the leaderboard.
  await file.reload();
  await expect(view(file, "board").locator(".qp-board-name").first()).toHaveText("Team 2");
  await expect(view(file, "board").locator("[data-board-total]").first()).toHaveText("1");

  expect(watch.requests).toEqual([]);
  expect(watch.errors).toEqual([]);
  await context.close();
});

test("presenter mode from a local file: the audience window shows only the stage, follows the host and never shows an answer before the reveal", async ({ page, browser }, testInfo) => {
  const path = await exportFile(page, testInfo);
  const { context, watch } = await offlineContext(browser);
  const host = await context.newPage();
  await host.goto(pathToFileURL(path).href);
  await expect(view(host, "title")).toBeVisible();

  const opened = context.waitForEvent("page");
  await control(host, "audience").click();
  const audience = await opened;
  await expect(audience).toHaveURL(/#audience$/);
  await expect(audience.locator('.qp-player[data-role="audience"]')).toBeVisible();
  await expect(view(audience, "title")).toContainText("Pub night");
  await expect(audience.locator(".qp-bar, [data-panel], .qp-dialog")).toHaveCount(0);

  // The host's window is now the control panel: current and next screen, timer, the way through the game.
  await expect(panel(host)).toBeVisible();
  await expect(host.locator(".qp-stage-box")).toBeHidden();
  await expect(panel(host).locator('[data-card="now"] [data-view="title"]')).toBeVisible();
  await expect(panel(host).locator('[data-card="next"] [data-view="teams-view"]')).toBeVisible();

  const forward = panel(host).locator('[data-control="next"]');
  await forward.click();
  await expect(view(audience, "teams-view")).toBeVisible();
  // Team names are typed in the panel and appear on the stage; the stage has no fields.
  await panel(host).getByLabel("Name of team 1").fill("Foxes");
  await expect(view(audience, "teams-view").locator('[data-team-name="t1"]')).toHaveText("Foxes");
  await expect(audience.locator("input, .qp-stepper")).toHaveCount(0);

  await forward.click();
  await forward.click();
  await expect(stage(audience).locator(".quiz-slide-prompt")).toHaveText("Which river flows through Paris?");
  await expect(stage(audience).locator("[data-dial]")).toHaveAttribute("data-status", "running");
  // The host sees the answer early; the audience does not.
  await expect(panel(host).locator("[data-host-answer]")).toHaveText("The Seine");
  await expect(audience.getByText("The Seine")).toHaveCount(0);
  await panel(host).locator('[data-control="timer"]').click();
  await expect(stage(audience).locator("[data-dial]")).toHaveAttribute("data-status", "paused");

  await forward.click();
  await forward.click();
  await forward.click(); // answer 1, not yet revealed
  await expect(stage(audience).locator(".quiz-slide-prompt")).toHaveText("Which river flows through Paris?");
  await expect(panel(host).locator("[data-host-answer]")).toHaveText("The Seine");
  await expect(audience.getByText("The Seine")).toHaveCount(0);
  await expect(audience.getByText("It splits around two islands.")).toHaveCount(0);
  await expect(forward).toHaveAccessibleName("Show answer");
  await forward.click();
  await expect(stage(audience).locator(".quiz-slide-right")).toHaveText("The Seine");

  // A key pressed in the audience window is a move of the host's game.
  await audience.keyboard.press("Space");
  await expect(panel(host).locator("[data-host-where]")).toContainText("Question 2 of 2");
  await expect(audience.locator(".quiz-slide-option[data-correct]")).toHaveCount(0);

  // Score entry happens in the panel; the audience sees the numbers.
  await forward.click();
  await forward.click();
  await more(panel(host), "Foxes").click();
  await expect(view(audience, "score").locator('[data-score-value="t1"]')).toHaveText("1");

  // Closing the audience window gives the host the stage back.
  await panel(host).locator('[data-control="audience"]').click();
  await expect(panel(host)).toHaveCount(0);
  await expect(view(host, "score")).toBeVisible();
  await expect.poll(() => audience.isClosed()).toBe(true);

  expect(watch.requests).toEqual([]);
  expect(watch.errors).toEqual([]);
  await context.close();
});

test("presenter mode in the app: the audience window is the app's own stage, fed by the host's window", async ({ page, context }) => {
  await play(page);
  const opened = context.waitForEvent("page");
  await page.keyboard.press("KeyM");
  await page.locator('[data-dialog="menu"] [data-menu="audience"]').click();
  const audience = await opened;
  await expect(audience).toHaveURL(/#\/quiz\?audience=1$/);
  await expect(view(audience, "title")).toContainText("Pub night");
  await expect(audience.locator(".qp-bar, [data-panel]")).toHaveCount(0);
  await expect(panel(page)).toBeVisible();
  await panel(page).locator('[data-control="next"]').click();
  await expect(view(audience, "teams-view")).toBeVisible();
  // The audience window closed by hand: the host is back on the stage.
  await audience.close();
  await expect(view(page, "teams-view")).toBeVisible();
  await expect(panel(page)).toHaveCount(0);
});

for (const colorScheme of ["light", "dark"] as const) {
test(`AC11: the stage, the menu and the host panel have no serious accessibility problem (${colorScheme})`, async ({ page, context }) => {
  await page.emulateMedia({ colorScheme });
  const check = async (target: Page, name: string): Promise<void> => {
    await target.evaluate(() => Promise.all(document.getAnimations().filter((one) => one.effect?.getComputedTiming().iterations !== Infinity).map((animation) => animation.finished.catch(() => undefined))));
    const result = await new AxeBuilder({ page: target }).include('[data-miniapp="quiz"]').withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(
      result.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical").map((violation) => `${name}: ${violation.id} ${violation.nodes.map((node) => node.target.join(" ")).join(" | ")}`),
    ).toEqual([]);
  };
  await play(page);
  await check(page, "title");
  await next(page);
  await check(page, "teams");
  await next(page, 2);
  await page.keyboard.press("KeyT");
  await check(page, "question");
  await next(page, 4);
  await check(page, "answer revealed");
  await next(page, 3);
  await more(view(page, "score"), "Team 1").click();
  await check(page, "score entry");
  await next(page);
  await check(page, "leaderboard");
  await page.keyboard.press("KeyM");
  await check(page, "menu");
  await page.locator('[data-dialog="menu"] [data-jump="end"]').click();
  await check(page, "podium");
  await page.keyboard.press("KeyS");
  await check(page, "scores dialog");
  await page.keyboard.press("Escape");

  const opened = context.waitForEvent("page");
  await page.keyboard.press("KeyM");
  await page.locator('[data-dialog="menu"] [data-menu="audience"]').click();
  const audience = await opened;
  await expect(panel(page)).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await check(page, "host panel, leaderboard");
  await page.keyboard.press("ArrowLeft");
  await check(page, "host panel, score entry");
  await check(audience, "audience window");
  // Every control of the bar and the panel is at least 44 px (SPEC AC11).
  const sizes = await panel(page).locator("button:visible").evaluateAll((buttons) => buttons.map((button) => Math.min(button.getBoundingClientRect().width, button.getBoundingClientRect().height)));
  expect(Math.min(...sizes)).toBeGreaterThanOrEqual(44);
});
}

for (const viewport of [{ width: 390, height: 844 }, { width: 1920, height: 1080 }, { width: 844, height: 390 }]) {
  test.describe(`on a ${String(viewport.width)} × ${String(viewport.height)} screen`, () => {
    test.use({ viewport });

    test("nothing of any screen of the game leaves the stage, with twelve teams and long texts", async ({ page }) => {
      const long = "Which of these long statements about the history of the world is the one that is actually true, according to most historians?";
      const crowded = {
        ...QUIZ,
        quiz: {
          ...QUIZ.quiz,
          name: "The Great Big End-of-Year Championship Quiz",
          settings: { teams: 12 },
          rounds: [{
            ...QUIZ.quiz.rounds[0],
            name: "History, geography and everything in between",
            questions: [
              { id: "q1", kind: "text", prompt: long, answer: { type: "choice", options: ["a", "b", "c", "d", "e", "f", "g", "h"].map((id) => ({ id, text: `A rather long option ${id.toUpperCase()} that needs room` })), correct: ["b", "g"] }, explanation: "An explanation that is long enough to wrap onto a second line on most screens, so its clamp is tested too.", points: { value: 3, note: "1 for each right one, and a bonus for all" } },
              { id: "q2", kind: "text", prompt: "Short?", answer: { type: "open", text: "A long answer that names three different things at once" } },
            ],
          }],
        },
      };
      await play(page, crowded);
      /**
       * What is wrong with the stage's view as it is drawn: `outside` — every piece of text and every
       * control that sticks out of the stage; `covered` — every control with something else lying over
       * it (a list running under the box beside it). What a list that scrolls inside the stage hides
       * (score entry for twelve teams on an upright phone) is neither: only the part of an element its
       * scrolling ancestors let through is measured.
       */
      const problems = () => page.evaluate(() => {
        const live = document.querySelector('.qp-stage[data-stage="live"]');
        const box = live?.getBoundingClientRect();
        if (!live || !box) return { outside: ["no stage"], covered: [] };
        const shown = (element: Element): DOMRect | null => {
          let rect = element.getBoundingClientRect();
          for (let parent = element.parentElement; parent && parent !== live; parent = parent.parentElement) {
            if (getComputedStyle(parent).overflowY === "visible") continue;
            const clip = parent.getBoundingClientRect();
            const [left, top, right, bottom] = [Math.max(rect.left, clip.left), Math.max(rect.top, clip.top), Math.min(rect.right, clip.right), Math.min(rect.bottom, clip.bottom)];
            if (right - left < 1 || bottom - top < 1) return null;
            rect = new DOMRect(left, top, right - left, bottom - top);
          }
          return rect;
        };
        const name = (element: HTMLElement): string => `${element.getAttribute("aria-label") ?? (element.className || element.tagName)}: ${element.textContent.trim().slice(0, 30)}`;
        const parts = [...live.querySelectorAll<HTMLElement>(".qp-view :is(h1, p, li, button, input, .quiz-slide-top, .quiz-slide-answer, .qp-guide, .qp-dial)")]
          .filter((element) => !element.closest(".qp-visually-hidden") && element.getClientRects().length > 0)
          .flatMap((element) => {
            const rect = shown(element);
            return rect === null ? [] : [{ element, rect }];
          });
        const outside = parts.filter(({ rect }) => rect.left < box.left - 1 || rect.right > box.right + 1 || rect.top < box.top - 1 || rect.bottom > box.bottom + 1).map(({ element }) => name(element));
        const covered = parts.filter(({ element, rect }) => {
          if (!element.matches("button, input")) return false;
          const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
          return top !== null && top !== element && !element.contains(top) && !top.contains(element);
        }).map(({ element }) => name(element));
        return { outside, covered };
      });
      const screens: string[] = [];
      for (let moves = 0; moves < 40; moves += 1) {
        const name = (await stage(page).locator("[data-view]").getAttribute("data-view")) ?? "";
        screens.push(name);
        if (name === "score") {
          await more(view(page, "score"), "Team 3").click();
          await more(view(page, "score"), "Team 12").click(); // the last row can be reached (scrolled to, on an upright phone)
          await expect(view(page, "score").locator('[data-score-total="t12"]')).toHaveText("1");
        }
        expect(await problems(), `${name} (move ${String(moves)})`).toEqual({ outside: [], covered: [] });
        expect(await page.evaluate(() => [document.documentElement.scrollWidth - window.innerWidth, document.documentElement.scrollHeight - window.innerHeight])).toEqual([0, 0]);
        if (await control(page, "next").isDisabled()) break;
        await page.keyboard.press("KeyT"); // a running timer would move the game on its own
        await next(page);
      }
      expect([...new Set(screens)]).toEqual(["title", "teams-view", "rules", "slide-view", "answers", "score", "board", "tie", "final"]); // teams 3 and 12 are level: the tiebreak too
      // The bar's controls are real-size targets on every screen.
      const targets = await page.locator(".qp-bar button:visible").evaluateAll((buttons) => buttons.map((button) => Math.min(button.getBoundingClientRect().width, button.getBoundingClientRect().height)));
      expect(Math.min(...targets)).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => { const bar = document.querySelector(".qp-bar")?.getBoundingClientRect(); return bar ? bar.right <= window.innerWidth && bar.bottom <= window.innerHeight : false; })).toBe(true);
    });
  });
}
