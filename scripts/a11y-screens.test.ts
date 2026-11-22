// Unit tests for scripts/a11y-screens.ts (PLAN T-13): the vendored scenarios as Quizzard runs them.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { VENDORED_SCREENS, quizzardScreens, type Screen } from "./a11y-screens.ts";

describe("quizzardScreens", () => {
  it("keeps only the mini-app's own scenarios, each opened from Home by its card", () => {
    const screens: Screen[] = [
      { name: "players", scope: "miniapp", actions: [{ fill: "input", text: "Ana" }] },
      { name: "menu", scope: "shell", actions: [{ click: "[data-menu-open]" }] },
      { name: "unscoped", actions: [] },
    ];
    expect(quizzardScreens("scores", screens)).toEqual([
      { name: "scores:players", scope: "miniapp", actions: [{ click: '[data-card="scores"]' }, { wait: 600 }, { fill: "input", text: "Ana" }] },
    ]);
  });

  it("GG Counter's file has scenarios of its screen (the submodule is checked out)", () => {
    const file = new URL(`../${VENDORED_SCREENS["scores"] ?? ""}`, import.meta.url);
    const screens = quizzardScreens("scores", JSON.parse(readFileSync(file, "utf8")) as Screen[]);
    expect(screens.length).toBeGreaterThan(5);
    expect(screens.every(({ actions }) => actions[0]?.["click"] === '[data-card="scores"]')).toBe(true);
  });
});
