import { expect, test, type Page } from "@playwright/test";
import { app as config, type AppConfig } from "../../app.config.ts";

// PWA e2e (pwa → pwa §2, §4): manifest power features, offline fallback only when offline.
const app: AppConfig = config;

/** Opens the app and reloads once so the service worker controls the page. */
async function openControlled(page: Page): Promise<void> {
  await page.goto("./");
  await page.evaluate(async () => { await window.navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
}

test("manifest carries shortcuts only when app.config has them, and no share target (PLAN §2)", async ({ request }) => {
  const m = (await (await request.get("./manifest.json")).json()) as Record<string, unknown>;
  expect(m["shortcuts"] !== undefined).toBe(Boolean(app.shortcuts?.length));
  expect(m["share_target"]).toBeUndefined();
});

test("manifest scope and start URL are the Pages path from app.config", async ({ request }) => {
  const m = (await (await request.get("./manifest.json")).json()) as { start_url?: string; scope?: string };
  expect(m.start_url).toBe(app.basePath);
  expect(m.scope).toBe(app.basePath);
});

test("shortcuts have a 96 px icon (pwa §2)", async ({ request }) => {
  const m = (await (await request.get("./manifest.json")).json()) as { shortcuts?: { icons?: { src: string; sizes: string }[] }[] };
  for (const shortcut of m.shortcuts ?? []) expect(shortcut.icons?.some((i) => i.sizes === "96x96")).toBe(true);
  const icon = await request.get("./pwa-96x96.png");
  expect(icon.ok()).toBe(true);
});

test("online: a file the service worker didn't save comes from the network, not our 404 page", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Service workers are Chromium-only in Playwright");
  await openControlled(page);
  const response = await page.goto("./sitemap.xml");
  expect(response?.headers()["content-type"]).toContain("xml");
  expect(await response?.text()).toContain("<urlset");
  // An unknown address online is the server's 404: our page, but never its offline variant
  // ([data-ep-offline] blocks are hidden unless offline; the h1 always carries data-ep-offline-text).
  const missing = await page.goto("./no-such-page");
  expect(missing?.status()).toBe(404);
  await expect(page.locator("[data-ep-offline]").first()).toBeHidden();
});

test("offline: an unsaved address shows our offline page; saved pages reload with any query", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "Service workers are Chromium-only in Playwright");
  await openControlled(page);
  await context.setOffline(true);
  await page.goto("./no-such-page");
  await expect(page.locator("[data-ep-offline]").first()).toBeVisible();
  // Each saved page with a selector only that page has (the 404 page has neither).
  for (const [path, selector] of [["./", "[data-menu-open]"], ["./?teams=3&lang=en", "[data-menu-open]"], ["./terms/", ".page-body"]] as const) {
    await page.goto(path);
    await page.reload();
    await expect(page.locator(selector), path).toBeAttached();
    await expect(page.locator("[data-ep-offline]"), path).toHaveCount(0);
  }
  await context.setOffline(false);
});

/** Opens the probe mini-app (e2e build only) in a controlled page and makes it busy. */
async function openBusyProbe(page: Page): Promise<void> {
  await openControlled(page);
  await page.evaluate(() => { location.hash = "#/probe"; });
  await page.locator("[data-probe]").getByRole("button", { name: "Busy on", exact: true }).click();
}

/** Deploys a new worker (the preview seam in app/vite.config.ts) and waits until it is waiting. */
async function deployNextVersion(page: Page): Promise<void> {
  await page.context().addCookies([{ name: "e2e-next-deploy", value: String(Date.now()), url: page.url() }]);
  await page.evaluate(async () => { await (await navigator.serviceWorker.ready).update(); });
  await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.waiting != null), { timeout: 15_000 }).toBe(true);
  // because the page hears of the waiting worker in its own task right after the registration does
  await page.evaluate(() => new Promise((resolve) => { setTimeout(resolve, 500); }));
}

const updateOffer = (page: Page) => page.getByRole("status").filter({ hasText: "New version available" });

test("an update waits while a mini-app is busy and is offered when it is idle again (context.shell.setBusy)", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Service workers are Chromium-only in Playwright");
  await openBusyProbe(page);
  await deployNextVersion(page);
  await expect(updateOffer(page)).toHaveCount(0);
  await page.locator("[data-probe]").getByRole("button", { name: "Busy off", exact: true }).click();
  await expect(updateOffer(page)).toBeVisible();
});

test("a busy mini-app that unmounts releases the update offer", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Service workers are Chromium-only in Playwright");
  await openBusyProbe(page);
  await deployNextVersion(page);
  await expect(updateOffer(page)).toHaveCount(0);
  await page.getByRole("banner").getByRole("button", { name: "Back to Home" }).click();
  await expect(page.locator("[data-view=home]")).toBeVisible();
  await expect(updateOffer(page)).toBeVisible();
});
