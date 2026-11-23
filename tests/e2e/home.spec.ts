import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { app } from "../../app.config.ts";

// Home launcher (PLAN T-07, SPEC F1). The e2e build (app/test/dist) registers the 4 shipped cards +
// the routing probe + 7 Home fixtures (app/test/fixtures/home-entries.ts) = 12 cards; one test
// serves the production build (app/dist) instead and expects exactly the 4 shipped cards: Teams,
// Scores and Answer sheet ready, Quiz creator coming.
test.use({ serviceWorkers: "block" });

const cards = (page: Page) => page.locator("[data-launcher] [data-card]");
const card = (page: Page, id: string) => page.locator(`[data-card="${id}"]`);
const ids = (page: Page): Promise<string[]> =>
  cards(page).evaluateAll((all) => all.map((el) => el.getAttribute("data-card") ?? ""));
const back = (page: Page) => page.getByRole("banner").getByRole("button", { name: "Back to Home" });
/** Registry order of the e2e build's ready cards, then its coming ones (shipped first). */
const E2E_ORDER = [
  "teams",
  "scores",
  "sheet",
  "probe",
  "alpha",
  "beta",
  "gamma",
  "quiz",
  "delta",
  "epsilon",
  "zeta",
  "eta",
];

for (const viewport of [
  { width: 320, height: 640 },
  { width: 1280, height: 800 },
]) {
  test.describe(`at ${String(viewport.width)}×${String(viewport.height)}`, () => {
    test.use({ viewport });

    test("12 cards fit: no horizontal scroll, every card inside the viewport width, none overlapping", async ({
      page,
    }) => {
      await page.goto("./");
      await expect(cards(page)).toHaveCount(12);
      // The tiles rise in one after another: measure them where they come to rest.
      await page.evaluate(() =>
        Promise.all(
          document
            .getAnimations()
            .filter((one) => one.effect?.getComputedTiming().iterations !== Infinity)
            .map((animation) => animation.finished.catch(() => undefined)),
        ),
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      ).toBe(true);
      const boxes = await cards(page).evaluateAll((all) =>
        all.map((el) => {
          const r = el.getBoundingClientRect();
          return {
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
            overflows: el.scrollWidth > el.clientWidth,
          };
        }),
      );
      for (const box of boxes) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
        expect(box.height).toBeGreaterThanOrEqual(44); // the whole card is the tap target
        expect(box.overflows).toBe(false);
      }
      for (const [i, a] of boxes.entries()) {
        for (const b of boxes.slice(i + 1)) {
          const isApart =
            a.x + a.width <= b.x ||
            b.x + b.width <= a.x ||
            a.y + a.height <= b.y ||
            b.y + b.height <= a.y;
          expect(isApart).toBe(true);
        }
      }
      const columns = new Set(boxes.map(({ x }) => Math.round(x))).size;
      // One column on the narrowest phones (two from 340 px), four tiles across on a wide screen.
      expect(columns).toBe(viewport.width < 600 ? 1 : 4);
      // Cards in one row share its height.
      const rows = Map.groupBy(boxes, ({ y }) => Math.round(y));
      for (const row of rows.values()) {
        expect(new Set(row.map(({ height }) => Math.round(height))).size).toBe(1);
      }
    });

    test("ready cards first in registry order, coming ones after; a ready card opens, Back returns to it", async ({
      page,
    }) => {
      await page.goto("./");
      expect(await ids(page)).toEqual(E2E_ORDER);
      await card(page, "gamma").click();
      await expect(page).toHaveURL(/#\/gamma$/);
      await expect(page.locator('[data-miniapp="gamma"] [data-probe]')).toBeVisible();
      await back(page).click();
      await expect(page.locator("[data-view=home]")).toBeVisible();
      // Focus goes back to the card that opened the mini-app (accessibility §3). The order of this visit does not
      // change — the tool shrinks back into the tile it grew out of — and it leads the list at the next load.
      await expect(card(page, "gamma")).toBeFocused();
      expect(await ids(page)).toEqual(E2E_ORDER);
      await page.reload();
      await expect(cards(page)).toHaveCount(12);
      expect((await ids(page))[0]).toBe("gamma");
    });

    test("CLS is 0 while Home loads, also when the app script arrives after the first paint", async ({
      page,
    }) => {
      await page.addInitScript(() => {
        const shifts: number[] = [];
        Object.assign(window, { homeLayoutShifts: shifts });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (Reflect.get(entry, "hadRecentInput") !== true) {
              shifts.push(Number(Reflect.get(entry, "value")));
            }
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

test("the last used mini-app comes first, also after a reload and after browser Back", async ({
  page,
}) => {
  await page.goto("./");
  await card(page, "beta").click();
  await expect(page.locator('[data-miniapp="beta"] [data-probe]')).toBeVisible();
  await page.goBack();
  await expect(card(page, "beta")).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem("quizzard:v1:last-app"))).toBe('"beta"');
  await page.reload();
  expect(await ids(page)).toEqual([
    "beta",
    "teams",
    "scores",
    "sheet",
    "probe",
    "alpha",
    "gamma",
    ...E2E_ORDER.slice(7),
  ]);
});

test("a deep link renders Home's cards too: the list is never left busy (footer and Home text stay hidden while busy)", async ({
  page,
}) => {
  // A neutral page first, as in routing.spec.ts: with the deep link as the only load of the page,
  // page.goBack() is a no-op in Playwright's Firefox (see the note above "deep link mounts the probe" there).
  await page.goto("about:blank");
  await page.goto("./#/alpha");
  await expect(page.locator('[data-miniapp="alpha"] [data-probe]')).toBeVisible();
  await expect(page.locator("[data-launcher]")).not.toHaveAttribute("aria-busy", "true");
  expect(await page.evaluate(() => localStorage.getItem("quizzard:v1:last-app"))).toBe('"alpha"');
  await page.goBack();
  // Web-first: goBack() can return before the hashchange that re-renders Home (Firefox does), and
  // the cards rendered at load still have the registry order.
  await expect(page.locator("[data-view=home]")).toBeVisible();
  await expect(cards(page).first()).toHaveAttribute("data-card", "alpha");
});

test("a coming card is not a control: no link, not focusable, announced as coming soon, a tap does nothing", async ({
  page,
}) => {
  await page.goto("./");
  const quiz = card(page, "quiz");
  await expect(quiz).toContainText("Soon");
  await expect(quiz).toContainText("Coming soon");
  expect(
    await quiz.evaluate((el) => ({
      isLink: el.matches(":any-link"),
      tabIndex: el.tabIndex,
      role: el.getAttribute("role"),
    })),
  ).toEqual({ isLink: false, tabIndex: -1, role: null });
  const url = page.url();
  await quiz.click();
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

test("switching the language to Bulgarian translates names and taglines (English where none)", async ({
  page,
}) => {
  await page.goto("./#settings");
  await page.locator('label[for="lang-bg"]').click();
  await page.keyboard.press("Escape");
  await expect(card(page, "teams")).toContainText("Отбори");
  await expect(card(page, "teams")).toContainText("Честни случайни отбори за секунди");
  await expect(card(page, "alpha")).toContainText("Алфа");
  await expect(card(page, "delta")).toContainText("Delta"); // no Bulgarian text → English
  await expect(card(page, "scores")).toContainText("Точки");
  await expect(card(page, "scores")).toContainText("Резултатът на игралната вечер");
  await expect(card(page, "quiz")).toContainText("Създател на куизове");
  await expect(card(page, "quiz")).toContainText("Скоро");
  await expect(card(page, "teams")).toContainText("Отвори");
});

test("no serious accessibility violations on Home", async ({ page }) => {
  await page.goto("./");
  await expect(cards(page)).toHaveCount(12);
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((one) => one.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    ),
  );
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => v.id),
  ).toEqual([]);
});

test("the production build (app/dist) shows Teams, Scores and Answer sheet ready and the Quiz creator coming", async ({
  page,
  baseURL,
}) => {
  const dist = fileURLToPath(new URL("../../app/dist/", import.meta.url));
  await page.route(`${baseURL ?? ""}**`, async (route) => {
    const path = decodeURIComponent(new URL(route.request().url()).pathname).slice(
      app.basePath.length,
    );
    const file = join(dist, path);
    const target =
      existsSync(file) && statSync(file).isDirectory() ? join(file, "index.html") : file;
    if (existsSync(target)) await route.fulfill({ path: target });
    else await route.fulfill({ status: 404 });
  });
  await page.goto("./");
  await expect(cards(page)).toHaveCount(4);
  expect(await ids(page)).toEqual(["teams", "scores", "sheet", "quiz"]);
  await expect(cards(page)).toHaveText([/Teams/, /Scores/, /Answer sheet/, /Quiz creator/]);
  await expect(page.locator("[data-launcher] a")).toHaveCount(3);
  for (const id of ["teams", "scores", "sheet"]) {
    await expect(card(page, id)).toHaveRole("link");
    await expect(card(page, id)).toHaveAttribute("href", `#/${id}`);
    await expect(card(page, id)).toContainText("Open");
  }
  await expect(card(page, "quiz")).toHaveAttribute("data-state", "coming");
});

// Moni 2026-11-23: Home must look and move like an app — the tool used last leads, tiles pair up.
test("the tool used last leads Home as a wide card marked “Last used”; a tile left alone takes the whole row", async ({
  page,
}) => {
  await page.setViewportSize({ width: 412, height: 840 });
  await page.goto("./");
  await expect(page.locator(".launcher-item--featured")).toHaveCount(0); // nothing used yet
  await card(page, "alpha").click();
  await expect(page.locator('[data-miniapp="alpha"] [data-probe]')).toBeVisible();
  await back(page).click();
  await expect(page.locator("[data-view=home]")).toBeVisible();
  await expect(page.locator(".launcher-item--featured")).toHaveCount(0); // same order until the next load
  await page.reload();
  const featured = page.locator(".launcher-item--featured");
  await expect(featured.locator("[data-card]")).toHaveAttribute("data-card", "alpha");
  await expect(featured).toContainText("Last used");
  await expect(card(page, "alpha")).toHaveAccessibleName("Alpha First ready fixture"); // the badge is decoration
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((one) => one.effect?.getComputedTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
  const width = (id: string) =>
    card(page, id).evaluate((element) => Math.round(element.getBoundingClientRect().width));
  // 12 cards: the featured one, then 11 — five pairs and one left over, as wide as the featured card.
  expect(await width("eta")).toBe(await width("alpha"));
  expect(await width("teams")).toBeLessThan((await width("alpha")) / 2 + 1);
});

test("opening a tool and going back works the same with reduced motion (no screen animation)", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await card(page, "beta").click();
  await expect(page.locator('[data-miniapp="beta"] [data-probe]')).toBeVisible();
  await back(page).click();
  await expect(card(page, "beta")).toBeFocused();
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0); // also the endless ones (lights, stars, wizard) are off
});

test("the wordmark arrives again each time Home comes back on screen; it is decoration, not content", async ({
  page,
}) => {
  await page.goto("./");
  const mark = page.locator("[data-wordmark]").filter({ visible: true });
  await expect(mark).toHaveCount(1);
  await expect(mark).toHaveAttribute("aria-hidden", "true");
  await expect(mark).toHaveAttribute("data-play", "");
  await mark.evaluate((element) => {
    element.removeAttribute("data-play");
  });
  await card(page, "alpha").click();
  await expect(page.locator('[data-miniapp="alpha"] [data-probe]')).toBeVisible();
  await back(page).click();
  await expect(mark).toHaveAttribute("data-play", "");
});

test("phones: Home has no header bar — only the menu button, beside the greeting and clear of it; a tool keeps its bar", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("./");
  await expect(cards(page)).toHaveCount(12);
  await expect(page.locator(".brand")).toBeHidden();
  const menu = page.locator("[data-menu-open]");
  await expect(menu).toBeVisible();
  const header = await page
    .locator(".app-header")
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(header).toBe("rgba(0, 0, 0, 0)");
  const menuBox = await menu.boundingBox();
  const titleBox = await page.locator(".launcher-title").boundingBox();
  expect((titleBox?.x ?? 0) + (titleBox?.width ?? 0)).toBeLessThanOrEqual(menuBox?.x ?? 0);
  await card(page, "alpha").click();
  await expect(page.locator('[data-miniapp="alpha"] [data-probe]')).toBeVisible();
  await expect(page.locator(".brand")).toBeVisible();
  await expect(back(page)).toBeVisible();
});

test("Settings → Background: the animated scene by default, Simple turns it off and is remembered", async ({
  page,
}) => {
  await page.goto("./");
  await expect(cards(page)).toHaveCount(12);
  const scene = page.locator(".scene");
  await expect(scene).toBeVisible();
  await expect(scene).toHaveAttribute("aria-hidden", "true");
  await page.locator("[data-menu-open]").click();
  await page.locator('[data-menu] [data-action="settings"]').click();
  const settings = page.locator('dialog[data-dialog="settings"][open]');
  await expect(settings.locator("#backdrop-scene")).toBeChecked();
  await settings.locator('label[for="backdrop-simple"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-backdrop", "simple");
  await expect(scene).toBeHidden();
  await page.reload();
  await expect(cards(page)).toHaveCount(12);
  await expect(page.locator("html")).toHaveAttribute("data-backdrop", "simple");
  await expect(page.locator(".scene")).toBeHidden();
});
