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

// A toast nobody asked for must not take an Undo away (ui/toast.ts `background`). Seen in CI: the
// worker finished saving the app right after "Clear" in Teams, and "Ready to work offline" replaced
// the Undo toast before it could be pressed.
const probeToast = (page: Page) => page.locator(".toast").filter({ hasText: "Probe" });

test("\"Ready to work offline\" waits for a toast with an action instead of replacing it", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Service workers are Chromium-only in Playwright");
  // The worker registers only when the test says so: the action toast is on screen first, in every run.
  await page.addInitScript(() => {
    const container = navigator.serviceWorker;
    const register = container.register.bind(container);
    const gate = new Promise<void>((resolve) => { window.addEventListener("e2e:release-worker", () => { resolve(); }, { once: true }); });
    container.register = (...args: Parameters<ServiceWorkerContainer["register"]>) => gate.then(() => register(...args));
  });
  await page.goto("./#/probe");
  await page.locator("[data-probe]").getByRole("button", { name: "Toast", exact: true }).click();
  await expect(probeToast(page)).toBeVisible();
  await probeToast(page).hover(); // pauses its 10 s, however long the worker takes to save the app
  await page.evaluate(async () => {
    window.dispatchEvent(new Event("e2e:release-worker"));
    await navigator.serviceWorker.ready;
    // because the page hears that the worker is installed in its own task right after the registration does
    await new Promise((resolve) => { setTimeout(resolve, 500); });
  });
  await expect(probeToast(page)).toBeVisible();
  await expect(page.locator(".toast")).toHaveCount(1);
  await probeToast(page).getByRole("button", { name: "Act" }).click();
  await expect(page.locator("[data-probe-action]")).toHaveText("acted");
  await expect(page.locator(".toast").filter({ hasText: "Ready to work offline" })).toBeVisible();
});

test("the update offer waits for a toast with an action, then stays", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Service workers are Chromium-only in Playwright");
  await openControlled(page);
  await page.evaluate(() => { location.hash = "#/probe"; });
  await page.locator("[data-probe]").getByRole("button", { name: "Toast", exact: true }).click();
  await expect(probeToast(page)).toBeVisible();
  await probeToast(page).hover(); // pauses its 10 s while the next version deploys
  await deployNextVersion(page);
  await expect(probeToast(page)).toBeVisible();
  await expect(updateOffer(page)).toHaveCount(0);
  await probeToast(page).getByRole("button", { name: "Act" }).click();
  await expect(updateOffer(page)).toBeVisible();
});

// PLAN T-18 / T-21 (Moni 2026-11-23: "did you cover the icons?").
test("icons: the tab shows the small mark, each shortcut has its own icon, the manifest has install screenshots", async ({ page, request }) => {
  await page.goto("./");
  const tabIcons = await page.locator('link[rel="icon"]').evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
  expect(tabIcons.some((href) => href.endsWith("favicon.svg"))).toBe(true);
  expect(tabIcons.some((href) => href.endsWith("favicon-48x48.png"))).toBe(true);
  expect(tabIcons.some((href) => href.endsWith("logo.svg"))).toBe(false); // the full wizard is a blur at 16 px
  const manifest = (await (await request.get("./manifest.json")).json()) as {
    icons: { src: string; purpose?: string }[];
    shortcuts?: { url: string; icons?: { src: string }[] }[];
    screenshots?: { src: string; form_factor?: string; sizes: string }[];
  };
  const shortcutIcons = (manifest.shortcuts ?? []).map((shortcut) => shortcut.icons?.[0]?.src ?? "");
  expect(shortcutIcons).toEqual(["shortcut-teams-96x96.png", "shortcut-scores-96x96.png", "shortcut-sheet-96x96.png"]);
  expect(manifest.icons.some((icon) => icon.purpose === "maskable")).toBe(true);
  expect((manifest.screenshots ?? []).map((shot) => [shot.form_factor, shot.sizes])).toEqual([["narrow", "780x1688"], ["wide", "1280x800"]]);
  for (const file of ["favicon.svg", "favicon-48x48.png", ...shortcutIcons, ...(manifest.screenshots ?? []).map((shot) => shot.src), "maskable-icon-512x512.png"]) {
    expect((await request.get(`./${file}`)).status(), file).toBe(200);
  }
});
