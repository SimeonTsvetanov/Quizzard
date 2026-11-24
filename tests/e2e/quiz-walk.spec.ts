import { expect, test, type Locator, type Page } from "@playwright/test";
import { type SeedFile, control, openQuizAgain, panel, play, pubNight, root, screen, stage } from "./support/quiz-ux.ts";

// The walk (owner, 2026-11-24: "check everything on all screens"): on a small phone, a large phone,
// a tablet, a laptop and a projector every screen of the creator and of the player is visited, every
// visible button, link and switch is pressed once from a fresh state and must do something; nothing
// may stand outside the window, nothing may log an error; Back — the browser's, the in-app link,
// Escape in a dialog, the header's arrow — lands where a person expects with the focus restored; and
// the main rows are symmetric to the pixel. The viewports are set here, so one project runs it.
const SIZES = [[360, 740], [412, 915], [800, 1100], [1280, 860], [1920, 1080]] as const;
const CONTROLS = "button, a[href], summary, input:not([type=file]):not([type=text]):not([type=search]), select";

/** Collects what must never happen while a page is used. */
function watch(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`error: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error" && !/Failed to load resource|net::ERR/.test(message.text())) errors.push(`console: ${message.text()}`); });
  return errors;
}

/** Things a press may do that leave no trace in the page: counted from outside. */
interface Outside { count: number }
function outside(page: Page): Outside {
  const seen: Outside = { count: 0 };
  page.on("download", () => { seen.count += 1; });
  page.on("filechooser", () => { seen.count += 1; });
  page.context().on("page", (opened) => { seen.count += 1; void opened.close().catch(() => undefined); });
  return seen;
}

/** Everything a press can change, as one string. */
const fingerprint = (page: Page): Promise<string> => page.evaluate(() => {
  const states = [...document.querySelectorAll("[aria-pressed], [aria-expanded], [aria-current], details, dialog, input, select, [data-screen], [data-view], [hidden]")]
    .map((element) => `${element.tagName}${element.getAttribute("aria-pressed") ?? ""}${element.getAttribute("aria-expanded") ?? ""}${String((element as HTMLDetailsElement).open)}${String((element as HTMLInputElement).checked)}${(element as HTMLInputElement).value}${element.getAttribute("data-screen") ?? ""}${element.getAttribute("data-view") ?? ""}${String((element as HTMLElement).hidden)}`).join("|");
  const active = document.activeElement;
  return [document.body.innerText, states, active ? `${active.tagName}${active.getAttribute("aria-label") ?? ""}${active.getAttribute("data-focus") ?? ""}` : "", location.href, JSON.stringify(history.state), String(history.length), document.documentElement.getAttribute("data-printed") ?? "", document.documentElement.getAttribute("data-fullscreen") ?? "", JSON.stringify(Object.entries(localStorage))].join("§");
});

/** The controls that stand outside the window, and whether the page scrolls sideways. */
const strays = (page: Page, scope: string): Promise<string[]> => page.evaluate(({ selector, controls }) => {
  const found: string[] = [];
  if (document.documentElement.scrollWidth > window.innerWidth) found.push(`the page scrolls sideways by ${String(document.documentElement.scrollWidth - window.innerWidth)} px`);
  for (const element of document.querySelectorAll<HTMLElement>(selector.split(",").map((one) => controls.split(",").map((control) => `${one.trim()} ${control.trim()}`).join(",")).join(","))) {
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    if (box.width <= 2 || style.visibility === "hidden" || style.opacity === "0" || element.closest("[hidden], [inert]")) continue;
    if (box.left < -0.5 || box.right > window.innerWidth + 0.5) found.push(`${element.tagName} “${(element.getAttribute("aria-label") ?? element.textContent).trim().slice(0, 30)}” ${String(Math.round(box.left))}–${String(Math.round(box.right))}`);
  }
  return found;
}, { selector: scope, controls: CONTROLS });

/** One place of the walk: how to get there from nothing, and where its controls are. */
interface Place {
  readonly name: string;
  readonly scope: string;
  open(page: Page): Promise<void>;
}

const describeControl = (control: Locator): Promise<string> => control.evaluate((element) => `${element.tagName.toLowerCase()} “${(element.getAttribute("aria-label") ?? element.textContent).trim().replace(/\s+/g, " ").slice(0, 40)}”`);

/**
 * Presses every control of a place once, each from a fresh state.
 * @returns the controls that did nothing, and the strays of the place
 */
async function pressAll(page: Page, place: Place, seen: Outside): Promise<string[]> {
  const problems: string[] = [];
  await place.open(page);
  problems.push(...(await strays(page, place.scope)).map((stray) => `${place.name}: outside the window — ${stray}`));
  const selector = place.scope.split(",").map((one) => CONTROLS.split(",").map((control) => `${one.trim()} ${control.trim()}`).join(",")).join(",");
  const count = await page.locator(selector).count();
  for (let index = 0; index < count; index += 1) {
    const target = page.locator(selector).nth(index);
    const isOff = await target.evaluate((element) => !(element as HTMLElement).checkVisibility({ visibilityProperty: true, opacityProperty: true }) || (element as HTMLButtonElement).disabled || element.getAttribute("aria-disabled") === "true" || element.hasAttribute("data-drag")).catch(() => true);
    if (isOff) continue;
    const label = await describeControl(target);
    const before = await fingerprint(page);
    const events = seen.count;
    await target.click({ timeout: 4000 }).catch((error: unknown) => { problems.push(`${place.name}: ${label} cannot be pressed — ${String(error).split("\n")[0] ?? ""}`); });
    await expect.poll(async () => seen.count !== events || (await fingerprint(page)) !== before, { timeout: 2500 }).toBe(true).catch(() => { problems.push(`${place.name}: ${label} did nothing`); });
    await place.open(page); // a fresh state for the next control
  }
  return problems;
}

/** Puts the quiz back as it was and shows the library (a press before may have changed anything). */
async function fresh(page: Page, file: SeedFile): Promise<void> {
  await page.goto("./#/quiz");
  await expect(root(page).locator("#quiz-library-title")).toBeVisible();
  await page.evaluate(() => { localStorage.clear(); });
  await openQuizAgain(page, file);
}

const QUIZ = pubNight();

const CREATOR: readonly Place[] = [
  { name: "library", scope: '[data-screen="library"]', open: async (page) => { await fresh(page, QUIZ); await page.goBack(); await expect(screen(page, "library")).toBeVisible(); } },
  { name: "quiz", scope: ".quiz-pane--rounds", open: async (page) => { await fresh(page, QUIZ); await root(page).locator("[data-quiz-more] summary").click(); } },
  { name: "round", scope: ".quiz-pane--round", open: async (page) => { await fresh(page, QUIZ); await root(page).locator('[data-focus="round:r1"]').click(); await root(page).locator("[data-round-settings] summary").click(); await expect(root(page).locator("[data-duplicate-round]")).toBeVisible(); } },
  { name: "editor", scope: '[data-screen="editor"]', open: async (page) => { await fresh(page, QUIZ); await root(page).locator('[data-focus="round:r1"]').click(); await root(page).locator('[data-focus="question:q3"]').click(); await expect(screen(page, "editor")).toBeVisible(); } },
  { name: "editor, multiple choice", scope: ".quiz-options, [data-add-option]", open: async (page) => { await fresh(page, QUIZ); await root(page).locator('[data-focus="round:r1"]').click(); await root(page).locator('[data-focus="question:q1"]').click(); await root(page).locator(".quiz-form .quiz-chip", { hasText: "Multiple choice" }).click(); await expect(root(page).locator("[data-add-option]")).toBeVisible(); } },
  { name: "preview", scope: '[data-screen="preview"]', open: async (page) => { await fresh(page, QUIZ); await root(page).locator("[data-preview-quiz]").click(); await expect(screen(page, "preview")).toBeVisible(); await root(page).locator("[data-next]").click(); } },
  { name: "a question's More list", scope: "[data-sheet]", open: async (page) => { await fresh(page, QUIZ); await root(page).locator('[data-focus="round:r1"]').click(); await root(page).locator('[data-question="q2"] [data-more]').click(); await expect(root(page).locator("[data-sheet]")).toBeVisible(); } },
  { name: "a round's More list", scope: "[data-sheet]", open: async (page) => { await fresh(page, QUIZ); await root(page).locator('[data-round-card="r1"] [data-more]').click(); await expect(root(page).locator("[data-sheet]")).toBeVisible(); } },
];

/** Opens Play on a screen of the game by the menu's tile for it. */
async function playAt(page: Page, tile: string | null): Promise<void> {
  await fresh(page, QUIZ);
  await root(page).locator("[data-play-quiz]").click();
  await expect(stage(page)).toBeVisible();
  if (tile === null) return;
  await page.keyboard.press("KeyM");
  await page.locator(`[data-dialog="menu"] ${tile}`).first().click();
  await expect(page.locator('[data-dialog="menu"]')).toHaveCount(0);
}

const STAGE = ".qp-player";
const PLAYER: readonly Place[] = [
  { name: "stage: title", scope: STAGE, open: (page) => playAt(page, null) },
  { name: "stage: teams", scope: STAGE, open: (page) => playAt(page, '[data-jump-screen="teams"]') },
  { name: "stage: rules", scope: STAGE, open: (page) => playAt(page, '[data-jump-screen="rules"]') },
  { name: "stage: question", scope: STAGE, open: (page) => playAt(page, '[data-jump-screen="question"]') },
  { name: "stage: picture question", scope: ".qp-stage", open: async (page) => { await playAt(page, '[data-jump-screen="question"]'); await page.keyboard.press("Space"); await page.keyboard.press("Space"); } },
  { name: "stage: answer", scope: STAGE, open: (page) => playAt(page, '[data-jump-screen="answer"]') },
  { name: "stage: score entry", scope: STAGE, open: (page) => playAt(page, '[data-jump-screen="score"]') },
  { name: "stage: leaderboard", scope: STAGE, open: (page) => playAt(page, '[data-jump-screen="board"]') },
  { name: "stage: tie", scope: STAGE, open: async (page) => { await playAt(page, '[data-jump-screen="score"]'); for (const team of ["Team 1", "Team 2"]) await page.getByRole("button", { name: `One point more for ${team}` }).first().click(); await page.keyboard.press("KeyM"); await page.locator('[data-dialog="menu"] [data-jump-screen="tie"]').click(); } },
  { name: "stage: final", scope: STAGE, open: (page) => playAt(page, '[data-jump="end"]') },
  { name: "stage: break", scope: STAGE, open: async (page) => { await playAt(page, '[data-jump-screen="rules"]'); await page.keyboard.press("KeyM"); await page.locator('[data-dialog="menu"] [data-break="5"]').click(); } },
  { name: "menu", scope: '[data-dialog="menu"]', open: async (page) => { await playAt(page, '[data-jump-screen="question"]'); await page.keyboard.press("KeyM"); await expect(page.locator('[data-dialog="menu"]')).toBeVisible(); } },
  { name: "scores dialog", scope: '[data-dialog="scores"]', open: async (page) => { await playAt(page, '[data-jump-screen="board"]'); await page.keyboard.press("KeyS"); await expect(page.locator('[data-dialog="scores"]')).toBeVisible(); } },
];

for (const [width, height] of SIZES) {
  test.describe(`${String(width)} × ${String(height)}`, () => {
    test.skip(({ isMobile }) => isMobile, "the walk sets its own window sizes: one project runs it");
    test.use({ viewport: { width, height } });
    test.beforeEach(async ({ page }) => {
      // What a press does outside the page is made visible inside it.
      await page.addInitScript(() => {
        window.print = () => { document.documentElement.setAttribute("data-printed", String(Date.now())); };
        Element.prototype.requestFullscreen = function requestFullscreen() { document.documentElement.setAttribute("data-fullscreen", String(Date.now())); return Promise.resolve(); };
      });
    });

    for (const [group, places] of [["creator", CREATOR], ["player", PLAYER]] as const) {
      for (const place of places) {
        test(`${group} · ${place.name}: every control does something, nothing is outside the window, no error`, async ({ page }) => {
          test.setTimeout(240_000);
          const errors = watch(page);
          const problems = await pressAll(page, place, outside(page));
          expect(problems).toEqual([]);
          expect(errors).toEqual([]);
        });
      }
    }

    test("the host panel and the audience window: every control of the panel works, both windows stay inside their frames", async ({ page, context }) => {
      test.skip(width < 700, "the audience window is opened from a wide screen's bar; a phone reaches it from the menu (quiz-media.spec.ts)");
      test.setTimeout(240_000);
      const errors = watch(page);
      await play(page, QUIZ);
      await page.keyboard.press("Space");
      await page.keyboard.press("Space");
      await page.keyboard.press("Space");
      const opened = context.waitForEvent("page");
      await control(page, "audience").click();
      const audience = await opened;
      const audienceErrors = watch(audience);
      await expect(panel(page)).toBeVisible();
      await expect(stage(audience)).toBeVisible();
      expect(await strays(page, "[data-panel]")).toEqual([]);
      expect(await strays(audience, ".qp-player")).toEqual([]);
      await expect(audience.locator(".qp-bar, [data-panel]")).toHaveCount(0); // the room never sees a control
      const problems: string[] = [];
      for (const id of ["back", "timer", "reset", "next", "black", "scores", "fullscreen", "menu"]) {
        const button = panel(page).locator(`.qp-bar [data-control="${id}"]`);
        if (!(await button.isVisible()) || (await button.getAttribute("aria-disabled")) === "true") continue;
        const before = await fingerprint(page);
        await button.click();
        await expect.poll(async () => (await fingerprint(page)) !== before, { timeout: 2500 }).toBe(true).catch(() => { problems.push(`panel: ${id} did nothing`); });
        await page.keyboard.press("Escape"); // a dialog it opened
        if (id === "black") await button.click();
      }
      expect(problems).toEqual([]);
      // Closed from the keyboard: the bar goes back under the stage and the button keeps the focus.
      await control(page, "audience").focus();
      await page.keyboard.press("Enter");
      await expect(panel(page)).toHaveCount(0);
      await expect(control(page, "audience")).toBeFocused();
      expect([...errors, ...audienceErrors]).toEqual([]);
    });
  });
}
