import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { app } from "../../app.config.ts";

test("app loads with title, footer year and no CSP errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto("./");
  await expect(page).toHaveTitle(/Quizzard/);
  await expect(page.locator("[data-year]")).toHaveText(String(new Date().getFullYear()));
  expect(errors).toEqual([]);
});

test("no serious accessibility violations", async ({ page }) => {
  await page.goto("./");
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined)))); // axe mis-measures contrast while anything fades in
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
});

test("is served at the Pages path from app.config, and the 404 page links back to it", async ({ page }) => {
  await page.goto("./");
  expect(new URL(page.url()).pathname).toBe(app.basePath);
  await page.goto("./no-such-page");
  await expect(page.getByRole("link", { name: `Open ${app.name}` })).toHaveAttribute("href", app.basePath);
});
