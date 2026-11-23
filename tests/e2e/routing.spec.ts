import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { app } from "../../app.config.ts";

// Router, outlet, header Back and title (PLAN T-05) with the routing probe mini-app
// (app/test/fixtures/probe-miniapp.ts), which only the e2e build registers (app/test/dist).
// Service workers are blocked so `page.route` sees every chunk request.
test.use({ serviceWorkers: "block" });

/** Counters the probe keeps on `window.quizzardProbe`. */
interface ProbeCounters {
  readonly mounts: number;
  readonly unmounts: number;
  readonly pings: number;
  readonly ticks: number;
}

const PROBE_CHUNK = "**/assets/probe-miniapp-*.js";
const HOME_TITLE = `${app.name} — ${app.tagline}`;

const counters = async (page: Page): Promise<ProbeCounters> => {
  const value: unknown = await page.evaluate((): unknown => Reflect.get(window, "quizzardProbe"));
  if (typeof value !== "object" || value === null) throw new Error("the probe has not loaded");
  return value as ProbeCounters; // because the probe's own module writes exactly this shape
};
const homeView = (page: Page) => page.locator("[data-view=home]");
const probe = (page: Page) => page.locator('[data-miniapp="probe"] [data-probe]');
const back = (page: Page) => page.getByRole("banner").getByRole("button", { name: "Back to Home" });
const hashOf = (page: Page): string => new URL(page.url()).hash;

/** Opens the probe from Home the way a link does: one native hash navigation. */
const openProbeFromHome = async (page: Page, query = ""): Promise<void> => {
  await page.goto("about:blank");
  await page.goto("./");
  await expect(homeView(page)).toBeVisible();
  await page.evaluate((hash) => {
    location.hash = hash;
  }, `#/probe${query}`);
  await expect(probe(page)).toBeVisible();
};

/** Expects the Home screen: view, title, no Back button, outlet empty. */
const expectHome = async (page: Page): Promise<void> => {
  await expect(homeView(page)).toBeVisible();
  await expect(page.locator("[data-outlet]")).toBeHidden();
  await expect(page.locator("[data-outlet] *")).toHaveCount(0);
  await expect(back(page)).toBeHidden();
  await expect(page).toHaveTitle(HOME_TITLE);
};

// Why the Back tests open a neutral page before the deep link: page.goBack() in Playwright's Firefox
// (Juggler `Page.goBack`) returns without doing anything unless the tab's `canGoBack` is true, and
// Firefox's Back-button intervention (browser.navigation.requireUserInteraction: bugzil.la/1515073,
// bugzil.la/1645211) does not count entries a page left without a user interaction — which is what
// the seeded Home entry is. With the deep link as the only load, the history is [Home, mini-app],
// nothing counts, and goBack() is a no-op (CI run 45033230432: before and after goBack() Firefox
// reported `length: 2, hash: '#/alpha'`; Chromium and WebKit went from '#/alpha' to '#/'). With a
// page below, canGoBack is true and the traversal is one step, to the seeded Home, as on a phone.
// In stock Firefox with the intervention on, the toolbar Back skips the seeded Home and leaves the
// app (never a stale screen); the header Back uses history.back(), which is not affected.
test("deep link mounts the probe with Home seeded below it; Android Back shows Home, a second Back leaves", async ({
  page,
}) => {
  await page.goto("about:blank");
  await page.goto("./#/probe");
  await expect(probe(page)).toBeVisible();
  await expect(homeView(page)).toBeHidden();
  await expect(page).toHaveTitle(`Probe — ${app.name}`);
  await expect(back(page)).toBeVisible();
  await page.goBack();
  await expectHome(page);
  expect(hashOf(page)).toBe("#/");
  await page.goBack();
  expect(page.url()).toBe("about:blank");
});

test("header Back on a deep link uses history.back(): one more Back leaves the app", async ({
  page,
}) => {
  await page.goto("about:blank");
  await page.goto("./#/probe");
  await back(page).click();
  await expectHome(page);
  await expect(page.locator("[data-home-heading]")).toBeFocused();
  await page.goBack();
  expect(page.url()).toBe("about:blank");
});

test("Home → mini-app adds one entry; header Back returns to it without a new one", async ({
  page,
}) => {
  await openProbeFromHome(page);
  const length = await page.evaluate(() => history.length);
  await expect(page.locator("[data-outlet]")).toBeFocused();
  await back(page).click();
  await expectHome(page);
  expect(await page.evaluate(() => history.length)).toBe(length);
  await page.goBack();
  expect(page.url()).toBe("about:blank");
});

test("reload on a mini-app route keeps it and does not seed Home twice", async ({ page }) => {
  await page.goto("about:blank");
  await page.goto("./#/probe");
  await expect(probe(page)).toBeVisible();
  await page.reload();
  await expect(probe(page)).toBeVisible();
  await page.goBack();
  await expectHome(page);
  await page.goBack();
  expect(page.url()).toBe("about:blank");
});

test("unmount leaves no node, listener or timer of the mini-app", async ({ page }) => {
  await page.goto("./#/probe");
  await expect(probe(page)).toBeVisible();
  await expect.poll(async () => (await counters(page)).ticks).toBeGreaterThan(0);
  await page.evaluate(() => document.dispatchEvent(new Event("probe:ping")));
  expect((await counters(page)).pings).toBe(1);
  await back(page).click();
  await expectHome(page);
  await expect(page.locator("[data-miniapp], [data-probe]")).toHaveCount(0);
  const after = await counters(page);
  expect(after.mounts - after.unmounts).toBe(0);
  await page.evaluate(() => document.dispatchEvent(new Event("probe:ping")));
  await page.waitForTimeout(250); // five probe timer periods
  const later = await counters(page);
  expect(later.pings).toBe(1);
  expect(later.ticks).toBe(after.ticks);
});

for (const hash of ["#/nope", "#/Probe", "#/probe/extra", "#/%70robe", "#a b"]) {
  test(`unknown route ${hash} → Home, replacing the entry`, async ({ page }) => {
    await page.goto("about:blank");
    await page.goto(`./${hash}`);
    await expectHome(page);
    expect(hashOf(page)).toBe("#/");
    await page.goBack();
    expect(page.url()).toBe("about:blank");
  });
}

test("dialog links (#help) open over a mini-app, never unmount it and give its address back", async ({
  page,
}) => {
  await page.goto("./#/probe");
  await expect(probe(page)).toBeVisible();
  await page.evaluate(() => {
    location.hash = "#help";
  });
  await expect(page.locator('dialog[data-dialog="help"][open]')).toBeVisible();
  await page.keyboard.press("Escape");
  await expect.poll(() => hashOf(page)).toBe("#/probe");
  await page.click("[data-menu-open]");
  await page.locator("dialog[data-menu]").getByText("Settings").click();
  await expect(page.locator('dialog[data-dialog="settings"][open]')).toBeVisible();
  expect(hashOf(page)).toBe("#settings");
  await page.keyboard.press("Escape");
  await expect.poll(() => hashOf(page)).toBe("#/probe");
  await expect(probe(page)).toHaveCount(1);
  const { mounts, unmounts } = await counters(page);
  expect([mounts, unmounts]).toEqual([1, 0]);
});

test("the logo link goes Home from a mini-app", async ({ page }) => {
  await openProbeFromHome(page);
  await page.locator("[data-home-link]").click();
  await expectHome(page);
});

test("title names the mini-app in the UI language; setTitle replaces the name; Back is labelled", async ({
  page,
}) => {
  await page.goto("./#/probe");
  await page.getByRole("button", { name: "Rename" }).click();
  await expect(page).toHaveTitle(`Probe step 1 — ${app.name}`);
  await page.goto("./?lang=bg#/probe");
  await expect(page).toHaveTitle(`Проба — ${app.name}`);
  await expect(page.getByRole("button", { name: "Към началото" })).toBeVisible();
  await expect(page.locator("[data-outlet]")).toHaveAttribute("aria-label", "Проба");
});

test("the mount element carries data-miniapp and has no transform, filter, contain or clipping ancestor", async ({
  page,
}) => {
  await page.goto("./#/probe");
  await expect(probe(page)).toBeVisible();
  const offenders = await page.evaluate(() => {
    const found: string[] = [];
    const host = document.querySelector('[data-miniapp="probe"]');
    for (let node = host?.parentElement ?? null; node !== null; node = node.parentElement) {
      const style = getComputedStyle(node);
      const checks: Record<string, boolean> = {
        transform:
          style.transform !== "none" ||
          style.translate !== "none" ||
          style.rotate !== "none" ||
          style.scale !== "none",
        filter: style.filter !== "none" || style.backdropFilter !== "none",
        contain: style.contain !== "none" || style.containerType !== "normal",
        clip:
          style.overflowX !== "visible" ||
          style.overflowY !== "visible" ||
          style.clipPath !== "none",
        other:
          style.perspective !== "none" || /transform|filter|perspective/.test(style.willChange),
      };
      for (const [name, isSet] of Object.entries(checks))
        {if (isSet) found.push(`${node.tagName.toLowerCase()}.${node.className}: ${name}`);}
    }
    return found;
  });
  expect(offenders).toEqual([]);
});

test("a chunk that cannot load (offline, not cached) shows the error view; Try again reloads and recovers", async ({
  page,
}) => {
  await page.route(PROBE_CHUNK, (route) => route.abort("internetdisconnected"));
  await page.goto("about:blank"); // see the note above "deep link mounts the probe"
  await page.goto("./#/probe");
  const error = page.locator("[data-outlet] .es");
  await expect(error.getByRole("heading", { name: "Couldn't open Probe" })).toBeVisible();
  await expect(error.getByRole("heading")).toBeFocused();
  await expect(back(page)).toBeVisible();
  await page.unroute(PROBE_CHUNK);
  await error.getByRole("button", { name: "Try again" }).click();
  await expect(probe(page)).toBeVisible();
  await expect(page.locator("[data-outlet] .es")).toHaveCount(0);
  // The reload kept the route's mark, so the router did not seed Home again.
  expect(await page.evaluate((): unknown => history.state)).toEqual({
    quizzardScreen: { homeBelow: true },
  });
  await page.goBack();
  await expectHome(page);
});

test("a mount that throws shows the error view; Try again mounts again, Back to Home works", async ({
  page,
}) => {
  await page.goto("./#/probe?fail=mount");
  const error = page.locator("[data-outlet] .es");
  await expect(error.getByRole("heading", { name: "Couldn't open Probe" })).toBeVisible();
  await error.getByRole("button", { name: "Try again" }).click();
  await expect(error.getByRole("heading", { name: "Couldn't open Probe" })).toBeFocused(); // focus never drops to <body>
  await error.getByRole("button", { name: "Back to Home" }).click();
  await expectHome(page);
});

for (const hash of ["#/probe", "#/probe?fail=mount"]) {
  test(`no serious accessibility violations on ${hash}`, async ({ page }) => {
    await page.goto(`./${hash}`);
    await expect(page.locator("[data-outlet] > *")).toHaveCount(1);
    await expect(page.locator("[data-outlet]")).not.toHaveAttribute("aria-busy", "true");
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((one) => one.effect?.getComputedTiming().iterations !== Infinity)
          .map((a) => a.finished.catch(() => undefined)),
      ),
    ); // axe mis-measures contrast while anything fades in
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => v.id),
    ).toEqual([]);
  });
}

test("race: fast A → B → A with a slow chunk ends with exactly one mounted instance", async ({
  page,
}) => {
  await page.route(PROBE_CHUNK, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    await route.continue();
  });
  await page.goto("./");
  await page.evaluate(async () => {
    for (const hash of ["#/probe?n=a", "#/", "#/probe?n=b", "#/probe?n=a"]) {
      location.hash = hash;
      await new Promise((resolve) => setTimeout(resolve, 30)); // each hashchange runs before the next
    }
  });
  await expect(probe(page)).toHaveCount(1);
  await page.waitForTimeout(300);
  await expect(probe(page)).toHaveCount(1);
  await expect(page.locator("[data-probe-output]")).toHaveText("a");
  const { mounts, unmounts } = await counters(page);
  expect(mounts - unmounts).toBe(1);
});

test("race: a late async mount of a replaced screen is unmounted at once", async ({ page }) => {
  await page.goto("./#/probe?n=first");
  await expect(probe(page)).toBeVisible();
  await page.evaluate(async () => {
    location.hash = "#/probe?n=slow&mountDelay=300";
    await new Promise((resolve) => setTimeout(resolve, 50));
    location.hash = "#/probe?n=last";
  });
  await expect(page.locator("[data-probe-output]")).toHaveText("last");
  await page.waitForTimeout(500); // the slow mount resolves meanwhile
  await expect(probe(page)).toHaveCount(1);
  await expect(page.locator("[data-probe-output]")).toHaveText("last");
  const { mounts, unmounts } = await counters(page);
  expect(mounts - unmounts).toBe(1);
});

test("the production build (app/dist) contains no probe; the e2e build (app/test/dist) does", () => {
  const appDir = fileURLToPath(new URL("../../app/", import.meta.url));
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? files(path) : [path];
    });
  const withProbe = (dist: string): string[] =>
    files(join(appDir, dist)).filter(
      (path) =>
        /\.(js|html|json|css)$/.test(path) &&
        /probe-miniapp|quizzard-probe|data-probe/.test(readFileSync(path, "utf8")),
    );
  expect(withProbe("dist")).toEqual([]);
  expect(withProbe("test/dist").length).toBeGreaterThan(0);
});
