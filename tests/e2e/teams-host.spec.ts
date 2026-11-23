import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { app } from "../../app.config.ts";

// TeamSync inside Quizzard (PLAN T-11, SPEC F3, F5, F7, AC3, AC5): what only the host can test. The
// screen's own flows are TeamSync's suite, run by the `teams*` projects (playwright.config.ts).

/** Teams' own storage area (its meta.storage), separate from the TeamSync site's keys (DECISIONS 2026-11-23). */
const PREFIX = "quizzard-teams:v1:";

const teamsCard = (page: Page) => page.locator('[data-card="teams"]');
const screenRoot = (page: Page) => page.locator('[data-miniapp="teams"] [data-workspace]');
const namesBox = (page: Page) => screenRoot(page).locator("#names");
const backButton = (page: Page) => page.getByRole("banner").getByRole("button", { name: "Back to Home" });
const homeView = (page: Page) => page.locator("[data-view=home]");

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

/** axe ids of serious and critical violations, after every animation has finished. */
async function seriousViolations(page: Page): Promise<string[]> {
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  return results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id);
}

test.describe("without a service worker", () => {
  test.use({ serviceWorkers: "block" });

  test("the Teams card opens the screen in the outlet; title, empty header slot, Back returns focus to the card", async ({ page }) => {
    await page.goto("./");
    await expect(teamsCard(page)).toHaveRole("link");
    await teamsCard(page).click();
    await expect(page).toHaveURL(/#\/teams$/);
    await expect(screenRoot(page)).toBeVisible();
    await expect(page).toHaveTitle(`Teams — ${app.name}`);
    await expect(page.locator('[data-header-slot="teams"]')).toBeEmpty();
    await expect(homeView(page)).toBeHidden();
    await backButton(page).click();
    await expect(homeView(page)).toBeVisible();
    await expect(teamsCard(page)).toBeFocused();
    await expect(page.locator('[data-miniapp="teams"]')).toHaveCount(0);
  });

  test("a deep link #/teams?teams=4 starts with 4 teams, a share-target text is not passed on; browser Back shows Home", async ({ page }) => {
    // A neutral page first: Firefox's Back ignores the Home entry the app seeds on a first load (DECISIONS).
    await page.goto("about:blank");
    await page.goto("./#/teams?teams=4&shared=Eve%0AFrank");
    await expect(screenRoot(page).locator("[data-teams-value]")).toHaveText("4");
    await expect(namesBox(page)).toHaveValue(""); // `shared` is the standalone share target's (PLAN §2)
    await expect(page).toHaveTitle(`Teams — ${app.name}`);
    await page.goBack();
    await expect(homeView(page)).toBeVisible();
    await expect(page.locator('[data-miniapp="teams"]')).toHaveCount(0);
  });

  test("switching the language re-renders the screen's texts and the title, and back", async ({ page }) => {
    await page.goto("./#/teams");
    await expect(screenRoot(page).getByRole("button", { name: "Generate teams" })).toBeVisible();
    await pickSetting(page, "lang", "bg");
    await expect(screenRoot(page).getByRole("button", { name: "Направи отбори" })).toBeVisible();
    await expect(page.locator('[data-miniapp="teams"]')).toHaveAttribute("lang", "bg");
    await expect(page).toHaveTitle(`Отбори — ${app.name}`);
    await pickSetting(page, "lang", "en");
    await expect(screenRoot(page).getByRole("button", { name: "Generate teams" })).toBeVisible();
    await expect(page).toHaveTitle(`Teams — ${app.name}`);
  });

  test("names saved by the standalone site appear in #/teams (same keys, same JSON)", async ({ page }) => {
    await page.goto("./");
    // Exactly what the standalone site's storage module writes: JSON under its prefix.
    await page.evaluate((prefix) => {
      localStorage.setItem(`${prefix}names`, JSON.stringify("Ana\nBoris\nVesko"));
      localStorage.setItem(`${prefix}teams`, JSON.stringify(3));
    }, PREFIX);
    await page.goto("./#/teams");
    await expect(namesBox(page)).toHaveValue("Ana\nBoris\nVesko");
    await expect(screenRoot(page).locator("[data-teams-value]")).toHaveText("3");
  });

  test("names typed in #/teams are saved where the standalone site reads them, never under quizzard:", async ({ page }) => {
    await page.goto("./#/teams");
    await namesBox(page).fill("Gergana\nDimitar");
    await screenRoot(page).getByRole("button", { name: "More teams" }).click();
    const saved = () => page.evaluate((prefix) => [localStorage.getItem(`${prefix}names`), localStorage.getItem(`${prefix}teams`)], PREFIX);
    await expect.poll(saved).toEqual([JSON.stringify("Gergana\nDimitar"), JSON.stringify(3)]);
    // The shell keeps its own prefs (last-app …), never the mini-app's data.
    const shellValues = await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith("quizzard:")).map((key) => localStorage.getItem(key) ?? ""));
    expect(shellValues.filter((value) => value.includes("Gergana"))).toEqual([]);
  });

  // Moni 2026-11-22: "Teams copied ✓" stayed on top of the menu he opened right after copying.
  test("a plain note is gone when the menu opens over it; a note with Undo moves into the menu", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.resolve() } });
    });
    await page.goto("./#/teams");
    await screenRoot(page).locator("#names").fill("Ana\nBoris\nChen\nDana");
    await screenRoot(page).getByRole("button", { name: "Generate teams" }).click();
    await screenRoot(page).getByRole("button", { name: "Copy", exact: true }).click();
    const note = page.locator("[data-toasts]").getByText("Teams copied");
    await expect(note).toBeVisible();
    await page.locator("[data-menu-open]").click();
    await expect(page.locator("dialog[data-menu][open]")).toBeVisible();
    await expect(note).toHaveCount(0);
  });

  test("using the screen raises no CSP violation: teams, share sheet, toast with Undo, confirm, language", async ({ page }) => {
    const violations = await watchCsp(page);
    await page.goto("./#/teams");
    await namesBox(page).fill("Ana\nBoris\nVesko\nGergana");
    await screenRoot(page).getByRole("button", { name: "Generate teams" }).click();
    await expect(screenRoot(page).getByRole("article")).toHaveCount(2);
    await page.evaluate(() => { Object.defineProperty(navigator, "share", { value: undefined, configurable: true }); });
    await screenRoot(page).getByRole("button", { name: "Share", exact: true }).click();
    const sheet = page.locator('dialog[data-dialog="share"][open]');
    await expect(sheet).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
    await screenRoot(page).getByRole("button", { name: "Clear and start over" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click();
    // Phones show the results as the next screen (TeamSync's own suite does the same).
    const backToNames = screenRoot(page).locator("[data-results-back]");
    if (await backToNames.isVisible()) await backToNames.click();
    await screenRoot(page).getByRole("button", { name: "Clear", exact: true }).click();
    await page.locator("[data-toasts]").getByRole("button", { name: "Undo" }).click();
    await expect(namesBox(page)).toHaveValue("Ana\nBoris\nVesko\nGergana");
    await pickSetting(page, "lang", "bg");
    await pickSetting(page, "theme", "dark");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(violations).toEqual([]);
  });

  for (const colorScheme of ["light", "dark"] as const) {
    test(`axe: no serious violation on #/teams with teams on screen (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto("./#/teams?teams=3");
      expect(await seriousViolations(page)).toEqual([]);
      await namesBox(page).fill("Ana\nBoris\nVesko\nGergana\nDimitar\nElena");
      await screenRoot(page).getByRole("button", { name: "Generate teams" }).click();
      await expect(screenRoot(page).getByRole("article")).toHaveCount(3);
      expect(await seriousViolations(page)).toEqual([]);
    });
  }
});

test("the service worker precaches every Teams chunk (PLAN §1.1 item 7)", async ({ request }) => {
  const worker = await (await request.get("./service-worker.js")).text();
  const chunks = [...new Set(worker.match(/assets\/miniapp-teams-[\w-]+\.js/g))];
  // The body, its lazily rendered screen and its Help (app/build/miniapp-chunks.ts names them).
  for (const part of ["main", "render", "help"]) expect(chunks.filter((file) => file.startsWith(`assets/miniapp-teams-${part}-`)), part).toHaveLength(1);
});

test("after one visit #/teams reloads offline (its chunks are precached)", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "Service workers are Chromium-only in Playwright");
  await page.goto("./#/teams");
  await expect(screenRoot(page)).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(screenRoot(page)).toBeVisible();
  await expect(screenRoot(page).getByRole("button", { name: "Generate teams" })).toBeVisible();
  await context.setOffline(false);
});
