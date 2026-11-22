import { expect, test, type Page } from "@playwright/test";
import { GG_COUNTER_STATE_KEY, NEW_STATE_KEY, STATE_KEY, THEME_KEY, V0_STATE, V1_STATE } from "../../../packages/core/test/fixtures/saved-state";
import { openApp, reloadApp } from "../support/entry.ts";
import { isHostKey } from "../support/host.ts";

// Scores keeps its game under its own keys (`quizzard-scores:v1:*`). The shared origin: the keys of the
// GG Counter site and of every other app are never read or changed (engineering → browser-storage §2).

/** Other apps' keys on the same origin: the GG Counter site's (with a game in them), TeamSync's and an unrelated one. */
const OTHER_APPS: Readonly<Record<string, string>> = {
  [STATE_KEY]: JSON.stringify(V1_STATE),
  [THEME_KEY]: "dark",
  [GG_COUNTER_STATE_KEY]: JSON.stringify(V1_STATE),
  "teamsync-random-team-generator:v1:theme": "\"dark\"",
  "teamsync-random-team-generator:v1:state": "{\"teams\":[[\"Ana\"]]}",
  theme: "dark",
};

/** Returns every localStorage key and value of the page's origin. */
const storageOf = (page: Page) =>
  page.evaluate(() => {
    const items: Record<string, string | undefined> = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key !== null) items[key] = localStorage.getItem(key) ?? undefined;
    }
    return items;
  });

/** Returns the game stored in `raw` (a JSON string), or null. */
const gameIn = (raw: string | undefined) => JSON.parse(raw ?? "null") as { players: { name: string; score: number }[] } | null;

const playerNames = (page: Page) => page.getByRole("textbox", { name: /^Player name for / });

test("a game saved by the GG Counter site is not shown, and its keys are never changed", async ({ page }) => {
  await openApp(page, { storage: { ...OTHER_APPS } });
  await expect(playerNames(page)).toHaveCount(0);
  await page.getByRole("textbox", { name: "Player name", exact: true }).fill("Dana");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect.poll(async () => gameIn((await storageOf(page))[NEW_STATE_KEY])?.players.map((player) => player.name)).toEqual(["Dana"]);
  await reloadApp(page);
  await expect(playerNames(page)).toHaveCount(1);
  const stored = await storageOf(page);
  for (const [key, value] of Object.entries(OTHER_APPS)) expect(stored[key]).toBe(value);
});

test("the game loads from Scores' own key and every change is saved there", async ({ page }) => {
  await openApp(page, { storage: { [NEW_STATE_KEY]: JSON.stringify(V0_STATE) } });
  await expect(playerNames(page)).toHaveCount(2);
  await page.getByRole("button", { name: "Increase score for Ana" }).click();
  await expect.poll(async () => gameIn((await storageOf(page))[NEW_STATE_KEY])?.players[0]?.score).toBe(35);
  const stored = await storageOf(page);
  expect(stored[STATE_KEY]).toBeUndefined();
  expect(stored[GG_COUNTER_STATE_KEY]).toBeUndefined();
});

test("another app's keys are unchanged after using and clearing a session", async ({ page }) => {
  await openApp(page, { storage: { ...OTHER_APPS, [NEW_STATE_KEY]: JSON.stringify(V1_STATE) } });
  await page.getByRole("button", { name: "Increase score for Ana" }).click();
  await page.getByRole("textbox", { name: "Player name", exact: true }).fill("Dana");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("button", { name: "Clear session" }).first().click();
  await page.getByRole("alertdialog", { name: "Clear session?" }).getByRole("button").last().click();
  await expect(playerNames(page)).toHaveCount(0);
  await reloadApp(page);
  await expect(playerNames(page)).toHaveCount(0);
  const stored = await storageOf(page);
  for (const [key, value] of Object.entries(OTHER_APPS)) expect(stored[key]).toBe(value);
  // Inside Quizzard the host's own prefs (`quizzard:v1:*`) are on the origin too; they are not another app's.
  const foreign = Object.keys(stored).filter((key) => !key.startsWith("quizzard-scores:v1:") && !isHostKey(key));
  expect(foreign.sort()).toEqual(Object.keys(OTHER_APPS).sort());
});
