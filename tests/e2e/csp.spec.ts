import { expect, test, type Page } from "@playwright/test";

// Security §1: the meta CSP must not block anything the app does — on first load (smoke.spec.ts) and
// after it. Every test records the `securitypolicyviolation` events of each document the page loads
// and the browser's CSP console errors, and fails on any of them. A blocked inline style or script
// often breaks nothing visible (a scroll lock, a late chunk), so only this list shows it.
// Add the app's own flows, lazy chunks and dialogs to the first test when they appear.

/** Starts recording CSP violations of every document the page loads; returns the live list. */
async function watchCsp(page: Page): Promise<string[]> {
  const violations: string[] = [];
  await page.exposeFunction("reportCspViolation", (text: string) => { violations.push(text); });
  await page.addInitScript(() => {
    const report = (window as unknown as { reportCspViolation: (text: string) => void }).reportCspViolation;
    document.addEventListener("securitypolicyviolation", (e) => {
      report(`${e.effectiveDirective} blocked ${e.blockedURI || "inline"} (${e.sourceFile}:${String(e.lineNumber)}) on ${document.location.pathname}`);
    });
  });
  page.on("console", (message) => {
    if (message.type() === "error" && /Content Security Policy/i.test(message.text())) violations.push(message.text());
  });
  return violations;
}

test("the menu, every shell dialog, a theme change and the confirm alert raise no CSP violation", async ({ page }) => {
  const violations = await watchCsp(page);
  await page.goto("./");
  await page.click("[data-menu-open]");
  await expect(page.locator("dialog[data-menu][open]")).toBeVisible();
  await page.keyboard.press("Escape");
  for (const dialog of ["help", "settings", "about", "whats-new", "report"]) {
    await page.goto(`./#${dialog}`);
    await expect(page.locator(`dialog[data-dialog="${dialog}"][open]`)).toBeVisible();
  }
  await page.goto("./#settings");
  await page.click("label[for=theme-dark]");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Clear my data" }).click();
  const alert = page.getByRole("alertdialog");
  await expect(alert).toBeVisible();
  await alert.getByRole("button", { name: "Cancel" }).click();
  await expect(alert).toHaveCount(0);
  expect(violations).toEqual([]);
});

test("the policy pages and the 404 page raise no CSP violation", async ({ page }) => {
  const violations = await watchCsp(page);
  for (const slug of ["terms", "privacy", "ai-notice", "legal-notice", "support"]) {
    await page.goto(`./${slug}/`);
    await expect(page.locator("[data-year]").first()).toHaveText(String(new Date().getFullYear()));
  }
  await page.goto("./404.html?from=/missing-page");
  await expect(page.locator("[data-ep-path]")).toContainText("/");
  expect(violations).toEqual([]);
});
