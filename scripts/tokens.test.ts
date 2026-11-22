// Guards Quizzard's own tokens in design/tokens.css (PLAN T-03): the highlight gold is a fill with
// dark text on it, never a text colour — as text it is 1.32:1 on the light page (DECISIONS 2026-11-22).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { contrast, toRgb, type Oklch } from "./color-math.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tokens = readFileSync(join(root, "design", "tokens.css"), "utf8");

/** Returns the [light, dark] OKLCH halves of a `light-dark(oklch(…), oklch(…))` token. */
function themePair(name: string): readonly [Oklch, Oklch] {
  const value = new RegExp(`${name}:\\s*light-dark\\(([^;]+)\\);`).exec(tokens)?.[1] ?? "";
  const halves = [...value.matchAll(/oklch\(([\d.]+)% ([\d.]+) ([\d.]+)\)/g)].map((m): Oklch => [Number(m[1]) / 100, Number(m[2]), Number(m[3])]);
  const [light, dark] = halves;
  if (!light || !dark) throw new Error(`${name} is not a light-dark(oklch(), oklch()) pair in design/tokens.css`);
  return [light, dark];
}

const cssFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const path = join(dir, f);
    if (statSync(path).isDirectory()) return f === "node_modules" || f === "dist" ? [] : cssFiles(path);
    return f.endsWith(".css") ? [path] : [];
  });

describe("highlight token", () => {
  it("text on the highlight passes 4.5:1 in both themes", () => {
    const [fillLight, fillDark] = themePair("--color-highlight");
    const [inkLight, inkDark] = themePair("--color-on-highlight");
    expect(contrast(toRgb(inkLight), toRgb(fillLight))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(toRgb(inkDark), toRgb(fillDark))).toBeGreaterThanOrEqual(4.5);
  });

  it("is never a text, icon or outline colour in the app's CSS (only a background)", () => {
    const misuse = /(^|[\s;{])(color|fill|stroke|outline-color|text-decoration-color|-webkit-text-fill-color|caret-color)\s*:[^;]*var\(--color-highlight\)/m;
    const dirs = [join(root, "app", "src"), join(root, "scripts", "page-assets")];
    const offenders = dirs.flatMap(cssFiles).filter((f) => misuse.test(readFileSync(f, "utf8")));
    expect(offenders.map((f) => relative(root, f))).toEqual([]);
  });
});
