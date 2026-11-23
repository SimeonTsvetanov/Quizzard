import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { app } from "../../app.config.ts";

// GG Counter inside Quizzard (PLAN T-12/T-13, SPEC F4, F5, F7, AC3, AC5): what only the host can test —
// the outlet, header slot, title, routing, theme and language, shared storage, overlays over the shell,
// shell toasts and sheets over its dialogs, CSP, axe, isolation and offline. The screen's own flows
// (and SPEC F14) are GG Counter's suite, run unedited by the `scores*` projects (playwright.config.ts).

/** Scores' own storage area (its meta.storage), separate from the GG Counter site's keys (DECISIONS 2026-11-23). */
const STATE_KEY = "quizzard-scores:v1:state";
/** The standalone page's own prefs, inside the same area (its meta.ts): Quizzard never reads or writes them. */
const STANDALONE_PREFS = ["gg-counter:v1:theme", "gg-counter:v1:lang", "gg-counter:v1:last-seen-version"] as const;

/** A game as the standalone site saves it (version 2: Ana 34 with history, Boris 27 scored last, Chen −3). */
const GAME = {
  players: [
    { id: "a1", name: "Ana", score: 34, createdAt: "2025-12-01T19:00:00.000Z", history: [{ id: "e1", delta: 4, at: "2025-12-01T21:00:00.000Z" }, { id: "e2", delta: 12, at: "2025-12-01T21:10:00.000Z" }] },
    { id: "b2", name: "Boris", score: 27, createdAt: "2025-12-01T19:00:05.000Z", history: [{ id: "e3", delta: -1, at: "2025-12-01T21:20:00.000Z" }] },
    { id: "c3", name: "Chen", score: -3, createdAt: "2025-12-01T19:00:09.000Z", history: [] },
  ],
  lastUpdated: "2025-12-01T21:30:00.000Z",
  version: 2,
};

const scoresCard = (page: Page) => page.locator('[data-card="scores"]');
const mountRoot = (page: Page) => page.locator('[data-miniapp="scores"]');
const headerSlot = (page: Page) => page.locator('[data-header-slot="scores"]');
const header = (page: Page) => page.locator("[data-header]");
const backButton = (page: Page) => page.getByRole("banner").getByRole("button", { name: "Back to Home" });
const homeView = (page: Page) => page.locator("[data-view=home]");
const addField = (page: Page) => mountRoot(page).getByRole("textbox", { name: "Player name", exact: true });
const playerField = (page: Page, name: string) => mountRoot(page).getByRole("textbox", { name: `Player name for ${name}` });

/** Writes `entries` to localStorage before the first load of the test only (a reload keeps what the app saved). */
async function seed(page: Page, entries: Readonly<Record<string, string>>): Promise<void> {
  await page.addInitScript((items) => {
    if (sessionStorage.getItem("seeded") !== null) return;
    sessionStorage.setItem("seeded", "1");
    for (const [key, value] of Object.entries(items)) localStorage.setItem(key, value);
  }, entries);
}

/** Opens `#/scores` with a saved game and waits for its cards. */
async function openWithGame(page: Page): Promise<void> {
  await seed(page, { [STATE_KEY]: JSON.stringify(GAME) });
  await page.goto("./#/scores");
  await expect(playerField(page, "Ana")).toBeVisible();
}

/** Adds a player through the Add card, as a person does. */
async function addPlayer(page: Page, name: string): Promise<void> {
  await addField(page).fill(name);
  await mountRoot(page).getByRole("button", { name: "Add", exact: true }).click();
  await expect(playerField(page, name)).toBeVisible();
}

/** Picks a Settings option (radio `<name>-<value>`) the way a person does: menu → Settings. */
async function pickSetting(page: Page, name: "lang" | "theme", value: string): Promise<void> {
  await page.locator("[data-menu-open]").click();
  await page.locator('[data-menu] [data-action="settings"]').click();
  const settings = page.locator('dialog[data-dialog="settings"][open]');
  await settings.locator(`label[for="${name}-${value}"]`).click();
  await expect(settings.locator(`#${name}-${value}`)).toBeChecked();
  await page.keyboard.press("Escape");
  await expect(settings).toHaveCount(0);
  // Closing a dialog opened from the menu returns to the menu (DECISIONS 2026-11-23); leave it too.
  await expect(page.locator("dialog[data-menu]")).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[data-menu]")).not.toHaveAttribute("open", "");
}

/** Records CSP violations (events of every document + console errors), as csp.spec.ts does. */
async function watchCsp(page: Page): Promise<string[]> {
  const violations: string[] = [];
  await page.exposeFunction("reportCspViolation", (text: string) => { violations.push(text); });
  await page.addInitScript(() => {
    const report = (window as unknown as { reportCspViolation: (text: string) => void }).reportCspViolation;
    document.addEventListener("securitypolicyviolation", (e) => { report(`${e.effectiveDirective} blocked ${e.blockedURI || "inline"}`); });
  });
  page.on("console", (message) => {
    if (message.type() === "error" && /Content Security Policy/i.test(message.text())) violations.push(message.text());
  });
  return violations;
}

/** Waits until every animation of the page has finished (dialogs, cards, toasts). */
async function settle(page: Page): Promise<void> {
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));
}

/** axe ids of serious and critical violations, after every animation has finished. */
async function seriousViolations(page: Page): Promise<string[]> {
  await settle(page);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  return results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id);
}

/** True while focus is inside `locator` (also inside a shadow root in it). */
function hasFocus(locator: Locator): Promise<boolean> {
  return locator.evaluate((el) => el.contains(document.activeElement));
}

test.describe("without a service worker", () => {
  test.use({ serviceWorkers: "block" });

  test("the Scores card opens the screen: title, its three header buttons, Back returns focus to the card and leaves nothing behind", async ({ page }) => {
    await page.goto("./");
    await expect(scoresCard(page)).toHaveRole("link");
    await scoresCard(page).click();
    await expect(page).toHaveURL(/#\/scores$/);
    await expect(addField(page)).toBeVisible();
    await expect(page).toHaveTitle(`Scores — ${app.name}`);
    // PLAN open point 8 (DECISIONS 2026-11-22): the session buttons always sit in the header slot.
    await expect(headerSlot(page).getByRole("button")).toHaveText(["", "", ""]);
    for (const name of ["Open leaderboard", "Add player", "Clear session"]) await expect(headerSlot(page).getByRole("button", { name })).toBeVisible();
    await expect(homeView(page)).toBeHidden();
    await backButton(page).click();
    await expect(homeView(page)).toBeVisible();
    await expect(scoresCard(page)).toBeFocused();
    await expect(mountRoot(page)).toHaveCount(0);
    await expect(headerSlot(page)).toHaveCount(0);
  });

  test("a deep link #/scores opens it directly, a reload keeps it, browser Back shows Home", async ({ page }) => {
    // A neutral page first: Firefox's Back ignores the Home entry the app seeds on a first load (DECISIONS).
    await page.goto("about:blank");
    await openWithGame(page);
    await expect(page).toHaveTitle(`Scores — ${app.name}`);
    await page.reload();
    await expect(playerField(page, "Ana")).toBeVisible();
    await page.goBack();
    await expect(homeView(page)).toBeVisible();
    await expect(mountRoot(page)).toHaveCount(0);
  });

  test("theme and language switched in Settings while Scores is open re-style and re-translate it", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await openWithGame(page);
    await expect(mountRoot(page)).toHaveClass(/\blight\b/);
    const cardBackground = () => mountRoot(page).locator(".player-card").first().evaluate((el) => getComputedStyle(el).backgroundColor);
    const light = await cardBackground();
    await pickSetting(page, "theme", "dark");
    await expect(mountRoot(page)).toHaveClass(/\bdark\b/);
    await expect.poll(cardBackground).not.toBe(light);
    await pickSetting(page, "lang", "bg");
    await expect(mountRoot(page).getByRole("button", { name: "Добави", exact: true })).toBeVisible();
    await expect(mountRoot(page)).toHaveAttribute("lang", "bg");
    await expect(page).toHaveTitle(`Точки — ${app.name}`);
    await expect(headerSlot(page).getByRole("button", { name: "Изчисти сесията" })).toBeVisible();
    await pickSetting(page, "lang", "en");
    await expect(mountRoot(page).getByRole("button", { name: "Add", exact: true })).toBeVisible();
    await pickSetting(page, "theme", "light");
    await expect(mountRoot(page)).toHaveClass(/\blight\b/);
  });

  test("a Bulgarian start never shows an English frame (the dictionary loads before the first render)", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("quizzard:v1:lang", JSON.stringify("bg"));
      const seen: string[] = [];
      Object.assign(window, { addButtonTexts: seen });
      new MutationObserver(() => {
        const text = document.querySelector('[data-miniapp="scores"] .card-content .button--primary')?.textContent;
        if (text !== undefined && seen.at(-1) !== text) seen.push(text);
      }).observe(document, { childList: true, subtree: true, characterData: true });
    });
    await page.goto("./#/scores");
    await expect(mountRoot(page).getByRole("button", { name: "Добави", exact: true })).toBeVisible();
    expect(await page.evaluate((): unknown => Reflect.get(window, "addButtonTexts"))).toEqual(["Добави"]);
  });

  test("a game saved by the standalone site shows in #/scores, and one played here is saved where the standalone site reads it", async ({ page }) => {
    await openWithGame(page);
    await expect(mountRoot(page).getByRole("button", { name: "Adjust score for Ana: 34" })).toBeVisible();
    await expect(mountRoot(page).getByRole("button", { name: "Score history for Boris (scored last): −1" })).toBeVisible();
    await mountRoot(page).getByRole("button", { name: "Increase score for Chen" }).click();
    await addPlayer(page, "Dana");
    const saved = () => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null") as typeof GAME | null, STATE_KEY);
    await expect.poll(async () => (await saved())?.players.map(({ name, score }) => [name, score])).toEqual([["Ana", 34], ["Boris", 27], ["Chen", -2], ["Dana", 0]]);
    expect((await saved())?.version).toBe(GAME.version);
    // The shell keeps only its own prefs; the game is never copied under quizzard:.
    const shellValues = await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith("quizzard:")).map((key) => localStorage.getItem(key) ?? ""));
    expect(shellValues.filter((value) => value.includes("Dana"))).toEqual([]);
  });

  test("Quizzard never takes its theme or language from the standalone site's prefs, and Scores never writes them", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await seed(page, { [STATE_KEY]: JSON.stringify(GAME), "gg-counter:v1:theme": JSON.stringify("dark"), "gg-counter:v1:lang": JSON.stringify("bg") });
    await page.goto("./#/scores");
    await expect(mountRoot(page).getByRole("button", { name: "Add", exact: true })).toBeVisible();
    await expect(mountRoot(page)).toHaveClass(/\blight\b/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await mountRoot(page).getByRole("button", { name: "Increase score for Ana" }).click();
    await addPlayer(page, "Dana");
    const prefs = await page.evaluate((keys) => keys.map((key) => localStorage.getItem(key)), [...STANDALONE_PREFS]);
    expect(prefs).toEqual([JSON.stringify("dark"), JSON.stringify("bg"), null]);
    expect(await page.evaluate(() => localStorage.getItem("quizzard:v1:lang"))).toBeNull();
  });

  test("a dialog of Scores covers the whole screen with the shell header, traps focus, closes on Escape and locks the scroll", async ({ page, browserName, isMobile }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await openWithGame(page);
    const opener = headerSlot(page).getByRole("button", { name: "Open leaderboard" });
    await opener.click();
    const dialog = page.getByRole("dialog", { name: "Leaderboard" });
    await expect(dialog).toBeVisible();
    await settle(page);
    // The backdrop is on top everywhere, the header's corners included (no clipping or stacking ancestor).
    const overlaysOnTop = await page.evaluate(() => {
      const overlays = document.querySelector("[data-scores-overlays]");
      const points = [[4, 4], [innerWidth - 4, 4], [innerWidth / 2, 20], [4, innerHeight - 4], [innerWidth - 4, innerHeight - 4]] as const;
      return points.map(([x, y]) => overlays?.contains(document.elementFromPoint(x, y)) ?? false);
    });
    expect(overlaysOnTop).toEqual([true, true, true, true, true]);
    const box = await dialog.boundingBox();
    const viewport = page.viewportSize();
    expect(box !== null && viewport !== null && box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width && box.y + box.height <= viewport.height).toBe(true);
    expect(await hasFocus(dialog)).toBe(true);
    for (let tab = 0; tab < 8; tab += 1) {
      await page.keyboard.press("Tab");
      expect(await hasFocus(dialog)).toBe(true);
    }
    expect(await page.evaluate(() => getComputedStyle(document.body).overflowY)).toBe("hidden");
    // Playwright cannot turn a wheel in mobile WebKit ("Mouse wheel is not supported in mobile WebKit")
    // and has no touch scroll, so on the iPhone project the lock is proved by `overflow: hidden` above
    // alone; every other project also tries to scroll the page under the dialog.
    if (!(browserName === "webkit" && isMobile)) {
      const before = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(100);
      expect(await page.evaluate(() => scrollY)).toBe(before);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => getComputedStyle(document.body).overflowY)).not.toBe("hidden");
  });

  test("the share sheet opened over a Scores dialog stays usable; its toast is shown", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.resolve() } });
    });
    await openWithGame(page);
    await headerSlot(page).getByRole("button", { name: "Open leaderboard" }).click();
    await page.getByRole("dialog", { name: "Leaderboard" }).getByRole("button", { name: "Share", exact: true }).click();
    const sheet = page.locator('dialog[data-dialog="share"][open]');
    await sheet.getByRole("button", { name: "Copy" }).click();
    await expect(page.locator("[data-toasts]").getByText("Leaderboard copied ✓")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
  });

  test("at 320 px the header slot scrolls inside the header, the header never grows and the page never scrolls sideways", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await seed(page, { [STATE_KEY]: JSON.stringify(GAME) });
    await page.goto("./");
    const homeHeight = await header(page).evaluate((el) => el.getBoundingClientRect().height);
    await scoresCard(page).click();
    await expect(playerField(page, "Ana")).toBeVisible();
    expect(await header(page).evaluate((el) => el.getBoundingClientRect().height)).toBe(homeHeight);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    for (const name of ["Open leaderboard", "Add player", "Clear session"]) {
      const button = headerSlot(page).getByRole("button", { name });
      await button.scrollIntoViewIfNeeded();
      await expect(button).toBeInViewport();
      const size = await button.boundingBox();
      expect(Math.round(size?.height ?? 0)).toBeGreaterThanOrEqual(44);
    }
    await expect(page.getByRole("banner").getByRole("button", { name: "Open menu" })).toBeInViewport();
    await expect(backButton(page)).toBeInViewport();
  });

  test("a full game raises no CSP violation: players, scores, custom amount, history sheet, remove, clear, share", async ({ page }) => {
    // The longest flow of the suite (a whole game plus two Settings changes): three times the usual
    // 30 s. On CI's emulated mobile WebKit it ran out of time in the Settings steps on all three
    // attempts while every step itself was fine (2026-11-22).
    test.slow();
    const violations = await watchCsp(page);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", { configurable: true, value: () => Promise.resolve() });
    });
    await page.goto("./#/scores");
    for (const name of ["Ana", "Boris", "Chen", "Dana"]) await addPlayer(page, name);
    await mountRoot(page).getByRole("button", { name: "Increase score for Ana" }).click();
    await mountRoot(page).getByRole("button", { name: "Decrease score for Boris" }).click();
    await mountRoot(page).getByRole("button", { name: /^Adjust score for Chen/ }).click();
    await page.getByRole("spinbutton", { name: "Custom score adjustment" }).or(page.getByRole("textbox", { name: "Custom score adjustment" })).fill("12");
    await page.getByRole("button", { name: "Apply" }).click();
    await mountRoot(page).getByRole("button", { name: /^Score history for Chen/ }).click();
    const sheet = page.getByRole("dialog", { name: "Chen" });
    await sheet.getByRole("button", { name: "Remove +12 from Chen's score" }).click();
    await sheet.getByRole("button", { name: "Restore +12" }).click();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await mountRoot(page).getByRole("button", { name: "Remove Dana" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Remove" }).click();
    await expect(playerField(page, "Dana")).toHaveCount(0);
    await mountRoot(page).locator("[data-flip='main:leaderboard']").getByRole("button", { name: "Share", exact: true }).click();
    await headerSlot(page).getByRole("button", { name: "Clear session" }).click();
    await page.getByRole("alertdialog").getByRole("button").last().click();
    await expect(mountRoot(page).getByRole("textbox", { name: /^Player name for / })).toHaveCount(0);
    await pickSetting(page, "lang", "bg");
    await pickSetting(page, "theme", "dark");
    expect(violations).toEqual([]);
  });

  for (const colorScheme of ["light", "dark"] as const) {
    test(`axe: no serious violation on #/scores with players, medals and a last-scored card (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await openWithGame(page);
      await mountRoot(page).getByRole("button", { name: "Increase score for Boris" }).click();
      await expect(mountRoot(page).locator(".player-card[data-last-scored]")).toHaveCount(1);
      expect(await seriousViolations(page)).toEqual([]);
      await mountRoot(page).getByRole("button", { name: /^Score history for Ana/ }).click();
      await expect(page.getByRole("dialog", { name: "Ana" })).toBeVisible();
      expect(await seriousViolations(page)).toEqual([]);
    });
  }

  test("isolation: a shell component class inside Scores gets none of the shell's styling", async ({ page }) => {
    await openWithGame(page);
    // The same element with and without a shell class: inside the scope the two must compute alike
    // (the isolated reset); outside it the class must make a difference (the check itself works).
    const differences = await page.evaluate(() => {
      // Shell classes Scores does not use itself (its own `.button`, `.card`, `.sheet-head` … are its styling).
      const classes = ["icon-button", "toast", "menu", "launcher-list", "hero", "offline-pill"];
      const compare = (parent: Element): string[] => classes.filter((name) => {
        const plain = document.createElement("div");
        const styled = document.createElement("div");
        styled.className = name;
        parent.append(plain, styled);
        const a = getComputedStyle(plain);
        const b = getComputedStyle(styled);
        const differs = [...a].some((property) => !property.startsWith("--") && a.getPropertyValue(property) !== b.getPropertyValue(property));
        plain.remove();
        styled.remove();
        return differs;
      });
      const inside = document.querySelector('[data-miniapp="scores"] .player-card');
      // The header slot is Scores' too (its header buttons): same scope (app/build/miniapp-css-selectors.ts).
      const slot = document.querySelector('[data-header-slot="scores"]');
      const outside = document.querySelector("main");
      return inside && slot && outside ? { inside: compare(inside), slot: compare(slot), outside: compare(outside) } : null;
    });
    expect(differences?.inside).toEqual([]);
    expect(differences?.slot).toEqual([]);
    expect(differences?.outside.length).toBeGreaterThan(0);
  });
});

test("the service worker precaches every Scores chunk and its stylesheet (PLAN §1.1 item 7)", async ({ request }) => {
  const worker = await (await request.get("./service-worker.js")).text();
  const chunks = [...new Set(worker.match(/assets\/miniapp-scores-[\w-]+\.js/g))];
  // The body (with React in its i18n chunk), the lazy sheet and alert contents, Bulgarian and Help.
  for (const part of ["main", "i18n", "history-sheet-content", "choice-confirm-content", "bg", "help"]) {
    expect(chunks.filter((file) => file.startsWith(`assets/miniapp-scores-${part}-`)), part).toHaveLength(1);
  }
});

test.describe("with the service worker (Chromium only)", () => {
  test("after one visit #/scores reloads offline with the saved game", async ({ page, context, browserName }) => {
    test.skip(browserName !== "chromium", "Service workers are Chromium-only in Playwright");
    await openWithGame(page);
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload();
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
    await context.setOffline(true);
    await page.reload();
    await expect(playerField(page, "Ana")).toBeVisible();
    await mountRoot(page).getByRole("button", { name: /^Score history for Ana/ }).click();
    await expect(page.getByRole("dialog", { name: "Ana" }).getByRole("listitem").first()).toBeVisible();
    await context.setOffline(false);
  });

  test("a shell toast shown while a Scores dialog is open appears inside it, works by keyboard and returns to the page", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Service workers are Chromium-only in Playwright");
    await openWithGame(page);
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload();
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
    await mountRoot(page).getByRole("button", { name: /^Score history for Ana/ }).click();
    const sheet = page.getByRole("dialog", { name: "Ana" });
    await expect(sheet).toBeVisible();
    // The next deploy (preview seam in app/vite.config.ts): the update offer is a shell toast.
    await page.context().addCookies([{ name: "e2e-next-deploy", value: String(Date.now()), url: page.url() }]);
    await page.evaluate(async () => { await (await navigator.serviceWorker.ready).update(); });
    const offer = sheet.getByRole("status").filter({ hasText: "New version available" });
    await expect(offer).toBeVisible({ timeout: 15_000 });
    await settle(page);
    // On top inside the dialog, reachable from the dialog's focus trap.
    const reload = offer.getByRole("button", { name: "Reload" });
    expect(await reload.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const hit = (el.getRootNode() as ShadowRoot).elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return el === hit || el.contains(hit);
    })).toBe(true);
    let reached = false;
    for (let tab = 0; tab < 12 && !reached; tab += 1) {
      await page.keyboard.press("Tab");
      reached = await reload.evaluate((el) => (el.getRootNode() as ShadowRoot).activeElement === el);
    }
    expect(reached).toBe(true);
    expect(await hasFocus(sheet)).toBe(true);
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(page.locator("body > [data-toasts]").getByText("New version available")).toBeVisible();
  });
});
