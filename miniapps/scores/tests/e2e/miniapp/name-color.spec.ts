import { expect, test, type Page } from "@playwright/test";
import { NEW_STATE_KEY } from "../../../packages/core/test/fixtures/saved-state";
import { openApp, reloadApp } from "../support/entry.ts";

// The colour behind a player's name: the palette beside the name field (Add player and every card) offers the
// Carcassonne meeple colours, a custom colour and "No colour"; it fills the name field only and is saved with the game.

const RED = "rgb(214, 40, 40)";
const nameOf = (page: Page, name: string) => page.getByRole("textbox", { name: `Player name for ${name}` });
const savedColor = (page: Page, name: string) =>
  page.evaluate(({ key, wanted }) => (JSON.parse(localStorage.getItem(key) ?? "null") as { players: { name: string; color?: string }[] } | null)?.players.find((p) => p.name === wanted)?.color ?? null, { key: NEW_STATE_KEY, wanted: name });

/** Adds a player with `name`, in `color` (a swatch's name) when given. */
async function addPlayer(page: Page, name: string, color?: string): Promise<void> {
  await page.getByRole("textbox", { name: "Player name", exact: true }).fill(name);
  if (color !== undefined) {
    await page.getByRole("button", { name: "Colour of the new player's name" }).click();
    await page.getByRole("dialog").getByRole("button", { name: color, exact: true }).click();
  }
  await page.getByRole("button", { name: "Add", exact: true }).click();
}

test("a colour picked while adding fills the new player's name field, is saved, and does not stay for the next player", async ({ page }) => {
  await openApp(page);
  await addPlayer(page, "Moni", "Red");
  await addPlayer(page, "Ani");
  await expect(nameOf(page, "Moni")).toHaveCSS("background-color", RED);
  await expect(nameOf(page, "Moni")).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(nameOf(page, "Ani")).not.toHaveAttribute("data-colored");
  expect(await savedColor(page, "Moni")).toBe("#d62828");
  expect(await savedColor(page, "Ani")).toBeNull();

  await reloadApp(page);
  await expect(nameOf(page, "Moni")).toHaveCSS("background-color", RED);
});

test("an existing player's colour can be set, changed to a custom one and removed", async ({ page }) => {
  await openApp(page);
  await addPlayer(page, "Moni");
  const palette = page.getByRole("button", { name: "Name colour for Moni" });
  const sheet = page.getByRole("dialog", { name: "Name colour" });

  // On a narrow card the palette takes the trash's place while the name is edited.
  await nameOf(page, "Moni").focus();
  await palette.click();
  await expect(sheet.getByRole("button", { name: "No colour" })).toBeDisabled();
  await sheet.getByRole("button", { name: "Yellow", exact: true }).click();
  await expect(sheet).toBeHidden();
  await expect(nameOf(page, "Moni")).toHaveCSS("background-color", "rgb(245, 196, 0)");
  // Dark text on a light colour.
  await expect(nameOf(page, "Moni")).toHaveCSS("color", "rgb(17, 17, 17)");

  // Focus came back to the palette, so it is still in view.
  await expect(palette).toBeFocused();
  await palette.click();
  await expect(sheet.getByRole("button", { name: "Yellow", exact: true })).toHaveAttribute("aria-pressed", "true");
  await sheet.getByLabel("Custom colour").fill("#00aa88");
  await sheet.getByRole("button", { name: "Done" }).click();
  await expect(nameOf(page, "Moni")).toHaveCSS("background-color", "rgb(0, 170, 136)");
  // A custom colour always carries white text.
  await expect(nameOf(page, "Moni")).toHaveCSS("color", "rgb(255, 255, 255)");
  expect(await savedColor(page, "Moni")).toBe("#00aa88");

  await expect(palette).toBeFocused();
  await palette.click();
  await sheet.getByRole("button", { name: "No colour" }).click();
  await expect(nameOf(page, "Moni")).not.toHaveAttribute("data-colored");
  expect(await savedColor(page, "Moni")).toBeNull();
});

test("compact cards: one 44 px button beside the name — the trash, and the palette while the name is edited", async ({ page }) => {
  await openApp(page);
  for (const name of ["Moni", "Ani", "Geri", "Pesho", "Tosho"]) await addPlayer(page, name, "Blue");
  const palette = page.getByRole("button", { name: "Name colour for Pesho" });
  const trash = page.getByRole("button", { name: "Remove Pesho" });
  await expect(trash).toBeVisible();
  await expect(palette).toBeHidden();

  await nameOf(page, "Pesho").focus();
  await expect(palette).toBeVisible();
  await expect(trash).toBeHidden();
  const box = await palette.boundingBox();
  expect(Math.min(box?.width ?? 0, box?.height ?? 0)).toBeGreaterThanOrEqual(44);

  await nameOf(page, "Ani").focus();
  await expect(palette).toBeHidden();
  await expect(trash).toBeVisible();

  // With the keyboard both buttons are reachable: name → palette → trash.
  await nameOf(page, "Pesho").focus();
  await page.keyboard.press("Tab");
  await expect(palette).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(trash).toBeFocused();
});
