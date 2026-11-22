import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { app } from "../../app.config.ts";

// Home launcher (PLAN T-07, SPEC F1). The e2e build (app/test/dist) registers the 3 shipped cards +
// the routing probe + 8 Home fixtures (app/test/fixtures/home-entries.ts) = 12 cards; one test
// serves the production build (app/dist) instead and expects exactly the 3 shipped "coming" cards.
test.use({ serviceWorkers: "block" });

const cards = (page: Page) => page.locator("[data-launcher] [data-card]");
const card = (page: Page, id: string) => page.locator(`[data-card="${id}"]`);
const ids = (page: Page): Promise<string[]> => cards(page).evaluateAll((all) => all.map((el) => el.getAttribute("data-card") ?? ""));
const back = (page: Page) => page.getByRole("banner").getByRole("button", { name: "Back to Home" });
/** Registry order of the e2e build's ready cards, then its coming ones (shipped first). */
const E2E_ORDER = ["probe", "alpha", "beta", "gamma", "teams", "scores", "quiz", "delta", "epsilon", "zeta", "eta", "theta"];

for (const viewport of [{ width: 320, height: 640 }, { width: 1280, height: 800 }]) {
  test.describe(`at ${String(viewport.width)}×${String(viewport.height)}`, () => {
    test.use({ viewport });

    test("12 cards fit: no horizontal scroll, every card inside the viewport width, none overlapping", async ({ page }) => {
      await page.goto("./");
      await expect(cards(page)).toHaveCount(12);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      const boxes = await cards(page).evaluateAll((all) => all.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height, overflows: el.scrollWidth > el.clientWidth };
      }));
      for (const box of boxes) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
        expect(box.height).toBeGreaterThanOrEqual(44); // the whole card is the tap target
        expect(box.overflows).toBe(false);
      }
      for (const [i, a] of boxes.entries()) {
        for (const b of boxes.slice(i + 1)) {
          const isApart = a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
          expect(isApart).toBe(true);
        }
      }
      const columns = new Set(boxes.map(({ x }) => Math.round(x))).size;
      expect(columns).toBe(viewport.width < 600 ? 1 : 3);
      // Cards in one row share its height.
      const rows = Map.groupBy(boxes, ({ y }) => Math.round(y));
      for (const row of rows.values()) expect(new Set(row.map(({ height }) => Math.round(height))).size).toBe(1);
    });

    test("ready cards first in registry order, coming ones after; a ready card opens, Back returns to it", async ({ page }) => {
      await page.goto("./");
      expect(await ids(page)).toEqual(E2E_ORDER);
      await card(page, "gamma").click();
      await expect(page).toHaveURL(/#\/gamma$/);
      await expect(page.locator('[data-miniapp="gamma"] [data-probe]')).toBeVisible();
      await back(page).click();
      await expect(page.locator("[data-view=home]")).toBeVisible();
      // Focus goes back to the card that opened the mini-app (accessibility §3), now listed first.
      await expect(card(page, "gamma")).toBeFocused();
      expect((await ids(page))[0]).toBe("gamma");
    });

    test("CLS is 0 while Home loads, also when the app script arrives after the first paint", async ({ page }) => {
      await page.addInitScript(() => {
        const shifts: number[] = [];
        Object.assign(window, { homeLayoutShifts: shifts });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (Reflect.get(entry, "hadRecentInput") !== true) shifts.push(Number(Reflect.get(entry, "value")));
          }
        }).observe({ type: "layout-shift", buffered: true });
      });
      // Hold the entry chunk so the page paints first: the cards must not push visible text or the footer down.
      await page.route("**/assets/index-*.js", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.continue();
      });
      await page.goto("./");
      await expect(cards(page)).toHaveCount(12);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      const shifts = await page.evaluate((): unknown => Reflect.get(window, "homeLayoutShifts"));
      expect(shifts).toEqual([]);
    });
  });
}

test("the last used mini-app comes first, also after a reload and after browser Back", async ({ page }) => {
  await page.goto("./");
  await card(page, "beta").click();
  await expect(page.locator('[data-miniapp="beta"] [data-probe]')).toBeVisible();
  await page.goBack();
  await expect(card(page, "beta")).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem("quizzard:v1:last-app"))).toBe('"beta"');
  await page.reload();
  expect(await ids(page)).toEqual(["beta", "probe", "alpha", "gamma", ...E2E_ORDER.slice(4)]);
});

test("a deep link renders Home's cards too: the list is never left busy (footer and Home text stay hidden while busy)", async ({ page }) => {
  await page.goto("./#/alpha");
  await expect(page.locator('[data-miniapp="alpha"] [data-probe]')).toBeVisible();
  await expect(page.locator("[data-launcher]")).not.toHaveAttribute("aria-busy", "true");
  expect(await page.evaluate(() => localStorage.getItem("quizzard:v1:last-app"))).toBe('"alpha"');
  // Temporary CI diagnostic (Firefox cannot run locally): what Back does to the address and the history.
  console.warn("[diag back]", test.info().project.name, await page.evaluate(() => ({ length: history.length, hash: location.hash, state: history.state as unknown })));
  await page.goBack();
  console.warn("[diag back after]", test.info().project.name, await page.evaluate(() => ({ length: history.length, hash: location.hash, state: history.state as unknown })));
  // Web-first: goBack() can return before the hashchange that re-renders Home (Firefox does), and
  // the cards rendered at load still have the registry order.
  await expect(page.locator("[data-view=home]")).toBeVisible();
  await expect(cards(page).first()).toHaveAttribute("data-card", "alpha");
});

test("a coming card is not a control: no link, not focusable, announced as coming soon, a tap does nothing", async ({ page }) => {
  await page.goto("./");
  const teams = card(page, "teams");
  await expect(teams).toContainText("Soon");
  await expect(teams).toContainText("Coming soon");
  expect(await teams.evaluate((el) => ({ isLink: el.matches(":any-link"), tabIndex: el.tabIndex, role: el.getAttribute("role") }))).toEqual({ isLink: false, tabIndex: -1, role: null });
  const url = page.url();
  await teams.click();
  expect(page.url()).toBe(url);
  await expect(page.locator("[data-view=home]")).toBeVisible();
  await expect(page.locator("[data-outlet]")).toBeHidden();
});

test("a ready card is one link whose name is its visible name and tagline", async ({ page }) => {
  await page.goto("./");
  await expect(card(page, "alpha")).toHaveRole("link");
  await expect(card(page, "alpha")).toHaveAccessibleName("Alpha First ready fixture");
  await expect(card(page, "alpha")).toHaveAttribute("href", "#/alpha");
});

test("switching the language to Bulgarian translates names and taglines (English where none)", async ({ page }) => {
  await page.goto("./#settings");
  await page.locator('label[for="lang-bg"]').click();
  await page.keyboard.press("Escape");
  await expect(card(page, "teams")).toContainText("Отбори");
  await expect(card(page, "teams")).toContainText("Честни случайни отбори за секунди");
  await expect(card(page, "alpha")).toContainText("Алфа");
  await expect(card(page, "delta")).toContainText("Delta"); // no Bulgarian text → English
  await expect(card(page, "teams")).toContainText("Скоро");
});

test("no serious accessibility violations on Home", async ({ page }) => {
  await page.goto("./");
  await expect(cards(page)).toHaveCount(12);
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
});

test("the production build (app/dist) shows exactly the three coming cards", async ({ page, baseURL }) => {
  const dist = fileURLToPath(new URL("../../app/dist/", import.meta.url));
  await page.route(`${baseURL ?? ""}**`, async (route) => {
    const path = decodeURIComponent(new URL(route.request().url()).pathname).slice(app.basePath.length);
    const file = join(dist, path);
    const target = existsSync(file) && statSync(file).isDirectory() ? join(file, "index.html") : file;
    if (existsSync(target)) await route.fulfill({ path: target });
    else await route.fulfill({ status: 404 });
  });
  await page.goto("./");
  await expect(cards(page)).toHaveCount(3);
  expect(await ids(page)).toEqual(["teams", "scores", "quiz"]);
  await expect(cards(page)).toHaveText([/Teams/, /Scores/, /Quiz creator/]);
  await expect(page.locator("[data-launcher] a")).toHaveCount(0);
  for (const id of ["teams", "scores", "quiz"]) await expect(card(page, id)).toHaveAttribute("data-state", "coming");
});
