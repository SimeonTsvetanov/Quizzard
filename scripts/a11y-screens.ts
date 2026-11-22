// The forge a11y-check's `--screens` for Quizzard (PLAN T-13): every vendored mini-app's own scenarios
// with `"scope": "miniapp"` (its tests/a11y/screens.json, unedited), each opened from Home by its card.
// The check loads `<url>` again before each scenario with `page.goto(url)`; on a hash URL (`#/scores`)
// that is a same-document navigation that keeps the page — the open dialog, the players — so the run
// starts at Home (`http://localhost:4173/Quizzard/`), which reloads for real every time.
//   node .../a11y-check.mjs http://localhost:4173/Quizzard/ --screens "$(node scripts/a11y-screens.ts)"
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** One a11y-check action (`click` / `fill` + `text` / `focus` / `press` / `wait`). */
export type ScreenAction = Readonly<Record<string, string | number>>;

/** One a11y-check scenario; `scope` marks a mini-app's own screens (GG Counter's file has it). */
export interface Screen {
  readonly name: string;
  readonly scope?: string;
  readonly actions: readonly ScreenAction[];
}

/** Vendored repos with an a11y screens file, by the route id of their mini-app. */
export const VENDORED_SCREENS: Readonly<Record<string, string>> = { scores: "vendor/gg-counter/tests/a11y/screens.json" };

/** How long the scenario waits for the mini-app's chunk after the card is clicked (ms). */
const OPEN_WAIT_MS = 600;

/**
 * Turns a mini-app's scenarios into Quizzard ones: only `"scope": "miniapp"`, each first opens the
 * mini-app from Home; names get the id as a prefix.
 * @param id - the mini-app's route id (its Home card is `[data-card="<id>"]`)
 * @param screens - the mini-app's screens.json
 */
export function quizzardScreens(id: string, screens: readonly Screen[]): Screen[] {
  const open: ScreenAction[] = [{ click: `[data-card="${id}"]` }, { wait: OPEN_WAIT_MS }];
  return screens.filter((screen) => screen.scope === "miniapp").map((screen) => ({ name: `${id}:${screen.name}`, scope: "miniapp", actions: [...open, ...screen.actions] }));
}

function main(): void {
  const root = resolve(import.meta.dirname, "..");
  const screens = Object.entries(VENDORED_SCREENS).flatMap(([id, file]) => {
    const path = join(root, file);
    if (!existsSync(path)) throw new Error(`${file} is missing — run git submodule update --init`);
    return quizzardScreens(id, JSON.parse(readFileSync(path, "utf8")) as Screen[]);
  });
  console.log(JSON.stringify(screens));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
