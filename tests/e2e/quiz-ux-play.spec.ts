import { expect, test, type Page } from "@playwright/test";
import { LONG_NOTE, hiddenLines, control, focused, openQuiz, panel, play, pubNight, root, stage, stored, view } from "./support/quiz-ux.ts";

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

test("A (owner): the stage and the host panel count as “n/total” — the place in full, the total quieter", async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 860 });
  await play(page);
  await next(page, 2);
  const kicker = view(page, "rules").locator(".qp-kicker");
  await expect(kicker.locator("[data-count]")).toHaveAttribute("data-count", "1/2"); // "Round 1/2"
  await expect(kicker).toContainText("Round");
  await next(page);
  const badge = stage(page).locator("[data-slide-number] [data-count]");
  await expect(badge).toHaveAttribute("data-count", "1/3");
  await expect(badge.locator(".quiz-count-said")).toHaveText("1 of 3"); // what a screen reader hears
  await expect(stage(page).locator(".quiz-slide-round [data-count]")).toHaveAttribute("data-count", "1/2");
  // The total is smaller and dimmer than the place, and still readable: contrast against what it stands on.
  const measure = (selector: string): Promise<{ now: number; of: number; ratio: number }> => stage(page).locator(selector).evaluate((count) => {
    const parse = (text: string): number[] => {
      const canvas = document.createElement("canvas");
      canvas.width = 1; canvas.height = 1;
      const pen = canvas.getContext("2d", { willReadFrequently: true });
      if (!pen) return [0, 0, 0, 1];
      pen.fillStyle = text; pen.fillRect(0, 0, 1, 1);
      const [r = 0, g = 0, b = 0, a = 255] = pen.getImageData(0, 0, 1, 1).data;
      return [r, g, b, a / 255];
    };
    const luminance = ([r = 0, g = 0, b = 0]: number[]): number => { const [x = 0, y = 0, z = 0] = [r, g, b].map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }); return 0.2126 * x + 0.7152 * y + 0.0722 * z; };
    const now = count.querySelector(".quiz-count-now");
    const total = count.querySelector(".quiz-count-of");
    if (!now || !total) return { now: 0, of: 0, ratio: 0 };
    // The ground under the counter: the nearest opaque background, else the stage's darkest colour (the worst case for light text).
    let ground: number[] | null = null;
    for (let node: Element | null = total; node && !ground; node = node.parentElement) { const color = parse(getComputedStyle(node).backgroundColor); if ((color[3] ?? 0) >= 0.99) ground = color; }
    const base = ground ?? parse(getComputedStyle(document.querySelector(".qp-player") ?? document.body).getPropertyValue("--qp-ground") || "rgb(20, 12, 40)");
    const ink = parse(getComputedStyle(total).color);
    const alpha = ink[3] ?? 1;
    const mixed = [0, 1, 2].map((i) => (ink[i] ?? 0) * alpha + (base[i] ?? 0) * (1 - alpha));
    const [a, b] = [luminance(mixed), luminance(base)];
    return { now: parseFloat(getComputedStyle(now).fontSize), of: parseFloat(getComputedStyle(total).fontSize), ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
  });
  for (const selector of ["[data-slide-number] [data-count]", ".quiz-slide-round [data-count]"]) {
    const sizes = await measure(selector);
    expect(sizes.of).toBeLessThan(sizes.now);
    expect(sizes.ratio, `${selector} contrast`).toBeGreaterThanOrEqual(4.5);
  }
  // The host panel says the same.
  const opened = context.waitForEvent("page");
  await control(page, "audience").click();
  const audience = await opened;
  await expect(panel(page).locator("[data-host-where] [data-count]")).toHaveCount(2);
  await expect(panel(page).locator("[data-host-where] [data-count]").first()).toHaveAttribute("data-count", "1/2");
  await expect(panel(page).locator("[data-host-where] [data-count]").last()).toHaveAttribute("data-count", "1/3");
  await audience.close();
});

/** Every button of the control bar: its hook, its box and its tooltip. */
const barButtons = (page: Page): Promise<{ id: string; x: number; y: number; w: number; h: number; title: string; label: string }[]> =>
  page.locator(".qp-bar button:visible").evaluateAll((buttons) => buttons.map((button) => { const box = button.getBoundingClientRect(); return { id: button.getAttribute("data-control") ?? "", x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height), title: button.getAttribute("title") ?? "", label: button.getAttribute("aria-label") ?? "" }; }));

test("B (owner): one control bar for the stage and the host panel — same buttons, order, sizes and places; the primary button never moves", async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 860 });
  await play(page);
  const onTitle = await barButtons(page);
  expect(onTitle.map((button) => button.id)).toEqual(["exit", "back", "forward", "timer", "reset", "next", "black", "scores", "audience", "fullscreen", "menu"]);
  expect(onTitle.find((button) => button.id === "next")?.label).toBe("Start");
  // Every button 44 px high on one line; the icon buttons 44 px wide; 8 px between neighbours in a group.
  expect(new Set(onTitle.map((button) => `${String(button.y)}/${String(button.h)}`)).size).toBe(1);
  expect(onTitle[0]?.h).toBe(44);
  expect(onTitle.filter((button) => button.id !== "next").map((button) => button.w)).toEqual(Array.from({ length: 10 }, () => 44));
  const gaps = (list: typeof onTitle, ids: string[]): number[] => ids.slice(1).map((id, index) => { const a = list.find((button) => button.id === ids[index]); const b = list.find((button) => button.id === id); return (b?.x ?? 0) - ((a?.x ?? 0) + (a?.w ?? 0)); });
  expect(gaps(onTitle, ["exit", "back", "forward", "timer", "reset"])).toEqual([8, 8, 8, 8]);
  expect(gaps(onTitle, ["black", "scores", "audience", "fullscreen", "menu"])).toEqual([8, 8, 8, 8]);
  // The primary button: in the middle of the bar, one width whatever it says.
  const primary = onTitle.find((button) => button.id === "next");
  expect(Math.abs((primary?.x ?? 0) + (primary?.w ?? 0) / 2 - 640)).toBeLessThanOrEqual(1);
  // Equal page margins: the first button is as far from the left edge as the last from the right.
  expect(onTitle[0]?.x).toBe(1280 - ((onTitle.at(-1)?.x ?? 0) + (onTitle.at(-1)?.w ?? 0)));
  // Every button says what it does, with its key.
  expect(Object.fromEntries(onTitle.map((button) => [button.id, button.title]))).toMatchObject({ back: "Back (←)", next: "Start (Space)", timer: "Start timer (T)", reset: "Restart timer (R)", black: "Black screen (B)", scores: "Scores (S)", fullscreen: "Full screen (F)", menu: "Menu (M)", audience: "Open audience window", exit: "Back to the quiz" });
  await next(page, 3); // a question: "Next"
  const onQuestion = await barButtons(page);
  await next(page, 4); // an answer's slide: "Next" again
  const onReveal = await barButtons(page);
  const places = (list: typeof onTitle): string[] => list.map((button) => `${button.id}:${String(button.x)},${String(button.y)},${String(button.w)},${String(button.h)}`);
  expect(places(onQuestion)).toEqual(places(onTitle));
  expect(places(onReveal)).toEqual(places(onTitle)); // nothing shifts when the label changes

  // The host panel: the very same bar, at the same place.
  const opened = context.waitForEvent("page");
  await control(page, "audience").click();
  const audience = await opened;
  await expect(panel(page)).toBeVisible();
  const onPanel = await barButtons(page);
  expect(places(onPanel)).toEqual(places(onTitle));
  expect(onPanel.find((button) => button.id === "audience")?.label).toBe("Close audience window");
  const colours = (id: string): Promise<string[]> => page.locator(`.qp-bar [data-control="${id}"]`).evaluate((button) => [getComputedStyle(button).backgroundColor, getComputedStyle(button).color, getComputedStyle(button).borderRadius]);
  const panelLook = { next: await colours("next"), back: await colours("back"), menu: await colours("menu") };
  await panel(page).locator('[data-control="next"]').click(); // it works from the panel
  await expect(control(page, "next")).not.toHaveAttribute("aria-label", "Show answer"); // the answer is out, in both windows
  await expect(stage(audience)).toBeVisible();
  await control(page, "audience").click(); // and closes the audience window
  await expect(panel(page)).toHaveCount(0);
  expect({ next: await colours("next"), back: await colours("back"), menu: await colours("menu") }).toEqual(panelLook); // the same colours under the stage
  expect(places(await barButtons(page))).toEqual(places(onTitle));
});

test("B on a phone: the same bar under the stage and the panel, the primary button between two ends that never change", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await play(page);
  const first = await barButtons(page);
  expect(first.map((button) => button.id)).toEqual(["exit", "back", "timer", "next", "menu"]);
  expect(new Set(first.map((button) => button.h))).toEqual(new Set([44]));
  await next(page, 3);
  await next(page, 4);
  expect((await barButtons(page)).map((button) => `${button.id}:${String(button.x)},${String(button.w)}`)).toEqual(first.map((button) => `${button.id}:${String(button.x)},${String(button.w)}`));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
});

test("T8: the screen is kept awake during Play — asked for at the start, again when the page is back on show, let go on leaving", async ({ page }) => {
  await page.addInitScript(() => {
    const log = { requests: 0, releases: 0 };
    Object.defineProperty(window, "__wake", { value: log });
    Object.defineProperty(navigator, "wakeLock", { configurable: true, value: { request: (type: string) => { if (type === "screen") log.requests += 1; return Promise.resolve({ release: () => { log.releases += 1; return Promise.resolve(); } }); } } });
  });
  const wake = (): Promise<{ requests: number; releases: number }> => page.evaluate(() => (window as unknown as { __wake: { requests: number; releases: number } }).__wake);
  await play(page);
  await expect.poll(wake).toEqual({ requests: 1, releases: 0 });
  // The page is hidden (another tab, the phone locked): the lock goes; it is asked for again when the page is back.
  await page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" }); document.dispatchEvent(new Event("visibilitychange")); });
  await expect.poll(wake).toEqual({ requests: 1, releases: 1 });
  await page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" }); document.dispatchEvent(new Event("visibilitychange")); });
  await expect.poll(wake).toEqual({ requests: 2, releases: 1 });
  await control(page, "exit").click();
  await expect(root(page).locator("[data-play-quiz]")).toBeVisible();
  await expect.poll(wake).toEqual({ requests: 2, releases: 2 });
});

test("T12 + T9 + P1: the time-up sound is off until switched on and is remembered; team names survive a restart; no ranks before any points", async ({ page }) => {
  await page.addInitScript(() => {
    let made = 0;
    const Real = window.AudioContext;
    Object.defineProperty(window, "__sounds", { get: () => made });
    window.AudioContext = class extends Real { constructor() { super(); made += 1; } };
  });
  const sounds = (): Promise<number> => page.evaluate(() => (window as unknown as { __sounds: number }).__sounds);
  const base = pubNight();
  const quick = { ...base, quiz: { ...base.quiz, rounds: base.quiz.rounds.map((round) => ({ ...round, defaults: { seconds: 5, points: { value: 1 }, questionKind: "text", answerType: "open" } })) } };
  await play(page, quick);
  await next(page);
  await view(page, "teams-view").locator(".qp-team-field").first().fill("The Quizzy Rascals");
  await page.keyboard.press("Enter");
  await page.keyboard.press("KeyM");
  const menu = page.locator('[data-dialog="menu"]');
  await expect(menu.locator("[data-sound]")).not.toBeChecked(); // off by default
  await menu.locator("[data-jump-screen='board']").first().click();
  await expect(view(page, "board").locator("[data-board-empty]")).toHaveText("No points yet");
  await expect(view(page, "board").locator(".qp-board-rank").first()).toBeHidden();
  // A question's 5 s run out without the sound: nothing is played.
  await page.keyboard.press("KeyM");
  await menu.locator("[data-auto]").uncheck();
  await menu.locator('[data-jump-screen="question"]').first().click();
  await page.keyboard.press("KeyT");
  await expect(stage(page).locator("[data-dial]")).toHaveAttribute("data-status", "done", { timeout: 9000 });
  expect(await sounds()).toBe(0);
  await page.keyboard.press("KeyM");
  await menu.locator("[data-sound]").check();
  await page.keyboard.press("Escape");
  await page.keyboard.press("KeyR");
  await page.keyboard.press("KeyT");
  await expect(stage(page).locator("[data-dial]")).toHaveAttribute("data-status", "done", { timeout: 9000 });
  expect(await sounds()).toBe(1);
  // Remembered with the game, and the team's name is still there after "Start the game again".
  await page.reload();
  await expect(stage(page)).toBeVisible();
  await page.keyboard.press("KeyM");
  await expect(menu.locator("[data-sound]")).toBeChecked();
  await menu.locator("[data-restart]").click();
  await next(page);
  await expect(view(page, "teams-view").locator(".qp-team-field").first()).toHaveValue("The Quizzy Rascals");
});

test("a game that is opened again says it continues and offers Start again; the answer at the reveal stands in the middle", async ({ page }) => {
  await play(page);
  const strip = page.locator("[data-undo-strip]");
  await expect(strip).toBeHidden(); // a first game: nothing to continue
  await next(page, 3);
  await control(page, "exit").click();
  await root(page).locator("[data-play-quiz]").click();
  await expect(strip).toContainText("Continuing your last game");
  await strip.getByRole("button", { name: "Start again" }).click();
  await expect(view(page, "title")).toBeVisible();
  // The reveal: the question steps back to the top, the answer is the larger text and stands lower than it.
  for (let n = 0; n < 30 && (await stage(page).locator(".quiz-slide[data-reveal]").count()) === 0; n += 1) await next(page);
  const slide = stage(page).locator(".quiz-slide[data-reveal]");
  const size = (selector: string): Promise<number> => slide.locator(selector).evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  expect(await size(".quiz-slide-right")).toBeGreaterThan(1.5 * (await size(".quiz-slide-prompt")));
  const middle = await slide.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const answer = element.querySelector(".quiz-slide-answer")?.getBoundingClientRect();
    return answer ? Math.abs((answer.top + answer.bottom) / 2 - (box.top + box.bottom) / 2) / box.height : 1;
  });
  expect(middle).toBeLessThan(0.2);
});

// Moni 2026-11-26: per round — answers one by one or all at once, and whether it moves on by itself.
test("round settings: answers all at once skip the answer slides; a round moved on by hand keeps its question when time is up", async ({ page }) => {
  await openQuiz(page);
  await root(page).locator(".quiz-round-open").first().click();
  const settings = root(page).locator("[data-round-settings]");
  await settings.locator("summary").click();
  await expect(settings.locator("[data-round-one-by-one]")).toBeChecked();
  await expect(settings.locator("[data-round-auto]")).toBeChecked();
  await settings.locator("[data-round-one-by-one]").uncheck();
  await settings.locator("[data-round-auto]").uncheck();
  await expect.poll(async () => (await stored(page))[0]?.quiz.rounds[0]).toMatchObject({ answersTogether: true, manualAdvance: true });
  // Switched on again, nothing is kept on the round.
  await settings.locator("[data-round-auto]").check();
  await expect.poll(async () => Object.keys((await stored(page))[0]?.quiz.rounds[0] ?? {}).includes("manualAdvance")).toBe(false);
  await settings.locator("[data-round-auto]").uncheck();

  if (!(await root(page).locator("[data-play-quiz]").isVisible())) await root(page).locator("[data-up]:visible").first().click();
  await root(page).locator("[data-play-quiz]").click();
  await expect(view(page, "title")).toBeVisible();
  await next(page, 3); // teams, rules, question 1
  await expect(stage(page).locator(".quiz-slide-prompt")).toHaveText("Which river flows through Paris?");
  // Moved on by hand: the timer waits for the host.
  await expect(stage(page).locator("[data-dial]")).toHaveAttribute("data-status", "idle");
  await next(page, 2); // questions 2 and 3
  await next(page); // no "Answers", no answer slides: the score entry with every answer on it
  await expect(view(page, "score")).toBeVisible();
  await expect(view(page, "score").locator("[data-recap-line]")).toHaveCount(3);
});
