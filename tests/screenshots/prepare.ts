import { expect, type Page } from "@playwright/test";

/** Puts the app into a good-looking state with sample data before the screenshots (edit per app). */
export async function prepare(page: Page): Promise<void> {
  // An explicit "ready" signal instead of networkidle (testing §6): the page heading is shown and fonts are loaded.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}
