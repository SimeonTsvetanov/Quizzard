import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { app } from "../../app.config.ts";

// The shell's menus with the tools in them (PLAN T-15/T-16; Moni 2026-11-22: "all menus filled in"):
// Help has a section per tool, Settings lists each tool's saved data with its own Clear, Export and
// Import carry the tools' data, and Share app names Quizzard.
const TEAMS_PREFIX = "quizzard-teams:v1:";
const settings = (page: Page) => page.locator('dialog[data-dialog="settings"][open]');
const namesBox = (page: Page) => page.locator('[data-miniapp="teams"] #names');
const teamsKeys = (page: Page) => page.evaluate((prefix) => Object.keys(localStorage).filter((key) => key.startsWith(prefix)), TEAMS_PREFIX);

/** Types a list in Teams and waits until it is saved. */
async function saveTeamsList(page: Page): Promise<void> {
  await page.goto("./#/teams");
  await namesBox(page).fill("Ana\nBoris\nChen\nDana");
  await page.locator('[data-miniapp="teams"]').getByRole("button", { name: "Generate teams" }).click();
  await expect.poll(() => teamsKeys(page)).toContain(`${TEAMS_PREFIX}names`);
}

async function openSettingsFromMenu(page: Page): Promise<void> {
  await page.locator("[data-menu-open]").click();
  await page.locator('[data-menu] [data-action="settings"]').click();
  await expect(settings(page)).toBeVisible();
}

test("Help has a section for Teams and for Scores, in English and Bulgarian", async ({ page }) => {
  await page.goto("./#help");
  const help = page.locator('dialog[data-dialog="help"][open]');
  await expect(help.locator('[data-help-tool="teams"] summary')).toHaveText("Teams — how to use it");
  await expect(help.locator('[data-help-tool="scores"] summary')).toHaveText("Scores — how to use it");
  await help.locator('[data-help-tool="teams"] summary').click();
  await expect(help.locator('[data-help-tool="teams"]')).toContainText("Generate teams");

  await page.evaluate(() => { localStorage.setItem("quizzard:v1:lang", '"bg"'); });
  await page.goto("./");
  await page.goto("./#help");
  await expect(help.locator('[data-help-tool="teams"] summary')).toHaveText("Отбори — как се ползва");
  await expect(help.locator('[data-help-tool="scores"] summary')).toHaveText("Точки — как се ползва");
});

test("Help opened inside a tool starts with that tool's section, open", async ({ page }) => {
  await page.goto("./#/scores");
  await page.locator("[data-menu-open]").click();
  await page.locator('[data-menu] [data-action="help"]').click();
  const first = page.locator('dialog[data-dialog="help"][open] .help-section').first();
  await expect(first).toHaveAttribute("data-help-tool", "scores");
  await expect(first).toHaveAttribute("open", "");
});

test("Settings lists each tool's saved data; clearing Teams empties Teams only", async ({ page }) => {
  await saveTeamsList(page);
  await page.evaluate(() => {
    localStorage.setItem("quizzard-scores:v1:state", '{"players":[],"lastUpdated":"2026-11-23T10:00:00.000Z","version":2}');
    localStorage.setItem("teamsync-random-team-generator:v1:names", '"TeamSync list"');
    localStorage.setItem("other-app:v1:note", "keep me");
  });
  await openSettingsFromMenu(page);
  const teamsRow = settings(page).locator('[data-area="teams"]');
  await expect(teamsRow).toContainText("Teams");
  await expect(teamsRow.locator(".row-value")).not.toHaveText("Nothing saved");
  await expect(settings(page).locator('[data-area="scores"] .row-value')).not.toHaveText("Nothing saved");
  await expect(settings(page).locator(`[data-area="${app.id}"]`)).toContainText("Quizzard settings");

  await teamsRow.getByRole("button", { name: "Clear Teams data" }).click();
  const alert = page.getByRole("alertdialog", { name: "Delete Teams data?" });
  await alert.getByRole("button", { name: "Delete" }).click();

  await expect(settings(page).locator('[data-area="teams"] .row-value')).toHaveText("Nothing saved");
  await expect(settings(page).locator('[data-area="teams"] button')).toHaveCount(0);
  expect(await teamsKeys(page)).toEqual([]);
  // Scores, the TeamSync site's own list and a foreign key stay.
  expect(await page.evaluate(() => [localStorage.getItem("quizzard-scores:v1:state") !== null, localStorage.getItem("teamsync-random-team-generator:v1:names"), localStorage.getItem("other-app:v1:note")])).toEqual([true, '"TeamSync list"', "keep me"]);
  // The open screen came back empty and did not save its old list again.
  await settings(page).getByRole("button", { name: "Close" }).click();
  await expect(namesBox(page)).toHaveValue("");
  expect(await teamsKeys(page)).toEqual([]);
});

test("Export holds the tools' data and Import brings it back", async ({ page }) => {
  await saveTeamsList(page);
  const saved = await page.evaluate((prefix) => Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.startsWith(prefix))), TEAMS_PREFIX);
  await openSettingsFromMenu(page);
  const [download] = await Promise.all([page.waitForEvent("download"), settings(page).getByRole("button", { name: "Export my data" }).click()]);
  const path = await download.path();
  const file = JSON.parse(await readFile(path, "utf8")) as { app: string; tools: Record<string, Record<string, string>> };
  expect(file.app).toBe(app.id);
  expect(file.tools["teams"]).toEqual(saved);
  expect(Object.keys(file.tools)).toEqual(["teams", "scores", "sheet"]);

  await page.evaluate(() => { localStorage.clear(); });
  await page.goto("./");
  await page.goto("./#settings");
  // A forged entry outside the tool's area must not be written.
  const forged = { ...file, tools: { ...file.tools, teams: { ...file.tools["teams"], "other-app:v1:x": "nope" } } };
  await settings(page).locator('input[type="file"]').setInputFiles({ name: "quizzard-data.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(forged)) });
  await page.getByRole("alertdialog").getByRole("button", { name: "Replace" }).click();
  await expect.poll(() => page.evaluate((prefix) => Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.startsWith(prefix))), TEAMS_PREFIX)).toEqual(saved);
  expect(await page.evaluate(() => localStorage.getItem("other-app:v1:x"))).toBeNull();
  await page.goto("./#/teams");
  await expect(namesBox(page)).toHaveValue("Ana\nBoris\nChen\nDana");
});

test("Share app says Quizzard and gives the Quizzard link", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: (data: unknown) => { (window as unknown as { shared: unknown }).shared = data; return Promise.resolve(); } });
  });
  await page.goto("./");
  await page.locator("[data-menu-open]").click();
  await page.locator('[data-menu] [data-action="share"]').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { shared?: unknown }).shared)).toEqual({ title: app.name, text: `${app.name} — ${app.tagline}`, url: app.url });
});

test("Report a problem does not mention an email it never asks for", async ({ page }) => {
  await page.goto("./#report");
  const report = page.locator('dialog[data-dialog="report"][open]');
  await expect(report).toContainText("Reports become public GitHub issues.");
  await expect(report).not.toContainText(/email/i);
  await expect(report.locator('input[type="email"]')).toHaveCount(0);
});
