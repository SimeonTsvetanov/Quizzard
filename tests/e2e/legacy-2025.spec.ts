import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { app as config, type AppConfig } from "../../app.config.ts";

// PLAN T-02 (pwa → pwa §11, flow → migrate §1): browsers that still run the 2025 site's service
// worker at the same path get the new app after one reload, lose the 2025 caches and keep the 2025
// saved data. `vite preview` serves the real 2025 worker, page and manifest while the cookie
// e2e-legacy-2025=1 is set (app/vite.config.ts); dropping the cookie is the deploy.
const app: AppConfig = config;
const LEGACY_COOKIE = "e2e-legacy-2025";
const LIVE_2025_CACHE = "quizzard-complete-icons-2025";
const fixture = (file: string): string =>
  readFileSync(new URL(`fixtures/legacy-2025/${file}`, import.meta.url), "utf8");

/** What the take-over leaves on the origin, read inside the page. */
async function originState(page: Page, otherAppCache: string): Promise<Record<string, unknown>> {
  return page.evaluate(
    async ({ legacy, other, precachePrefix }) => {
      const registration = await navigator.serviceWorker.getRegistration();
      const names = await caches.keys();
      return {
        controller: navigator.serviceWorker.controller?.scriptURL.split("/").pop() ?? null,
        waiting: registration?.waiting != null,
        installing: registration?.installing != null,
        registrations: (await navigator.serviceWorker.getRegistrations()).length,
        legacyCaches: names.filter((name) => legacy.includes(name)),
        otherApp: names.includes(other),
        ownPrecache: names.some((name) => name.startsWith(precachePrefix)),
      };
    },
    {
      legacy: [...(app.legacyCacheNames ?? [])],
      other: otherAppCache,
      precachePrefix: `${app.id}-precache-`,
    },
  );
}

/** Saves data the way the 2025 app did: a localStorage key and a quiz in IndexedDB "QuizzardDB". */
async function save2025Data(page: Page): Promise<void> {
  await page.evaluate(async () => {
    localStorage.setItem("quizzard_quizzes", '[{"id":"q1","title":"Pub quiz"}]');
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("QuizzardDB", 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("quizzes", { keyPath: "id" });
      };
      request.onerror = () => {
        reject(new Error("QuizzardDB did not open"));
      };
      request.onsuccess = () => {
        const transaction = request.result.transaction("quizzes", "readwrite");
        transaction.objectStore("quizzes").put({ id: "q1", title: "Pub quiz" });
        transaction.oncomplete = () => {
          request.result.close();
          resolve();
        };
      };
    });
  });
}

/** Reads the 2025 data back: the localStorage value and the quiz title from IndexedDB. */
async function read2025Data(page: Page): Promise<{ local: string | null; quiz: unknown }> {
  return page.evaluate(async () => {
    const quiz = await new Promise((resolve) => {
      const request = indexedDB.open("QuizzardDB", 1);
      request.onsuccess = () => {
        const get = request.result.transaction("quizzes").objectStore("quizzes").get("q1");
        get.onsuccess = () => {
          request.result.close();
          resolve(get.result);
        };
      };
    });
    return { local: localStorage.getItem("quizzard_quizzes"), quiz };
  });
}

test("the 2025 worker hands over: one reload shows the new app, its caches go, its data stays", async ({
  page,
  context,
  baseURL,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Service workers are Chromium-only in Playwright");
  if (!baseURL) throw new Error("playwright.config.ts sets baseURL");
  await context.addCookies([{ name: LEGACY_COOKIE, value: "1", url: baseURL }]);
  await page.goto("./");
  await expect(page.locator("[data-legacy-2025]")).toBeVisible();
  // The 2025 worker claims the page itself and caches what it fetches (network first).
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? null))
    .toMatch(/\/service-worker\.js$/);
  await page.evaluate(async () => {
    await fetch("./");
  });
  await expect.poll(() => page.evaluate((name) => caches.has(name), LIVE_2025_CACHE)).toBe(true);
  await save2025Data(page);
  // Another app of the shared origin, visited after the 2025 worker activated.
  const otherAppCache = `teamsync-precache-v2-${new URL(baseURL).origin}/teamsync-random-team-generator/`;
  await page.evaluate(async (name) => {
    await caches.open(name);
  }, otherAppCache);

  await context.clearCookies(); // the deploy of the new build
  await page.reload();
  await expect(page.locator("[data-menu-open]").first()).toBeAttached();
  await expect
    .poll(() => originState(page, otherAppCache), { timeout: 15_000 })
    .toEqual({
      controller: "service-worker.js",
      waiting: false,
      installing: false,
      registrations: 1,
      legacyCaches: [],
      otherApp: true,
      ownPrecache: true,
    });
  // The take-over is not an update: no Reload offer on a page that already runs the new version.
  await expect(page.getByRole("status").filter({ hasText: "New version available" })).toHaveCount(
    0,
  );
  expect(await read2025Data(page)).toEqual({
    local: '[{"id":"q1","title":"Pub quiz"}]',
    quiz: { id: "q1", title: "Pub quiz" },
  });

  // The new worker controls the page: offline, the app still starts (the 2025 caches are gone).
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("[data-menu-open]").first()).toBeAttached();
  await expect(page.locator("[data-legacy-2025]")).toHaveCount(0);
  await context.setOffline(false);
});

test("the manifest keeps the 2025 identity and URL, so installed copies update in place", async ({
  page,
  request,
  baseURL,
}) => {
  if (!baseURL) throw new Error("playwright.config.ts sets baseURL");
  const old = JSON.parse(fixture("manifest.json")) as { id?: string; start_url: string };
  const manifestUrl = new URL("manifest.json", baseURL);
  const current = (await (await request.get(manifestUrl.href)).json()) as {
    id: string;
    start_url: string;
  };
  // Without an id, Chrome uses start_url as the identity (developer.chrome.com pwa-manifest-id).
  expect(old.id).toBeUndefined();
  const oldIdentity = new URL(old.start_url, manifestUrl).href;
  expect(new URL(current.id, new URL(current.start_url, manifestUrl)).href).toBe(oldIdentity);
  await page.goto("./");
  const link = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(new URL(link ?? "", page.url()).pathname).toBe(`${app.basePath}manifest.json`);
});
