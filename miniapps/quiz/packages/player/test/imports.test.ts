// What the exported page may load. The core's `play` entry must never pull in Zod (the page's
// Content-Security-Policy has no `unsafe-eval`, and its size budget has no room), and the player's
// own layers point one way: the game knows nothing of the DOM, the slide nothing of the game.
import { readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const CORE = join(import.meta.dirname, "../../core/src");
const PLAYER = join(import.meta.dirname, "../src");

/** Every module a file imports for its values (type-only imports are erased and do not count). */
function valueImports(file: string): string[] {
  const code = readFileSync(file, "utf8");
  const found = [...code.matchAll(/^(?:import|export)\s+(?!type\b)[^;]*?\bfrom\s+"([^"]+)";/gms)].map((match) => match[1] ?? "");
  const bare = [...code.matchAll(/^import\s+"([^"]+)";/gm)].map((match) => match[1] ?? "");
  return [...found, ...bare];
}

/** Every file reachable from an entry through value imports, and every package named on the way. */
function graph(entry: string): { files: Set<string>; packages: Set<string> } {
  const files = new Set<string>();
  const packages = new Set<string>();
  const queue = [entry];
  for (let file = queue.pop(); file !== undefined; file = queue.pop()) {
    if (files.has(file)) continue;
    files.add(file);
    for (const target of valueImports(file)) {
      // Stylesheets and raw files (the logo) carry no code.
      if (target.endsWith(".css") || target.endsWith("?raw")) continue;
      if (target.startsWith(".")) queue.push(join(dirname(file), target));
      else if (target === "@simeonts/quizzard-quiz-core/play") queue.push(join(CORE, "play.ts"));
      else packages.add(target);
    }
  }
  return { files, packages };
}

describe("@simeonts/quizzard-quiz-core/play", () => {
  it("reaches no package at all — in particular not Zod", () => {
    const { files, packages } = graph(join(CORE, "play.ts"));
    expect([...packages]).toEqual([]);
    expect(files.size).toBeGreaterThan(5);
    expect([...files].some((file) => file.endsWith("model.ts") || file.endsWith("registries.ts") || file.endsWith("validate.ts"))).toBe(false);
  });

  it("the check sees Zod where it is: the full entry does import it", () => {
    expect(graph(join(CORE, "index.ts")).packages.has("zod")).toBe(true);
  });
});

describe("the player's imports", () => {
  const inPlayer = (files: Set<string>): string[] => [...files].filter((file) => file.startsWith(PLAYER)).map((file) => relative(PLAYER, file)).sort();

  it("the exported page's script reaches only the core's play entry and the icons", () => {
    expect([...graph(join(PLAYER, "standalone.ts")).packages]).toEqual(["lucide"]);
  });

  it("the game is pure: it reaches nothing of the slide, the views, the windows or any package", () => {
    const { files, packages } = graph(join(PLAYER, "game/step.ts"));
    const more = [graph(join(PLAYER, "game/create.ts")), graph(join(PLAYER, "game/save.ts"))];
    expect([...packages, ...more.flatMap((part) => [...part.packages])]).toEqual([]);
    expect(inPlayer(new Set([...files, ...more.flatMap((part) => [...part.files])]))).toEqual(["game/create.ts", "game/kinds.ts", "game/save.ts", "game/scores.ts", "game/state.ts", "game/step.ts"]);
  });

  it("the slide the creator loads up front reaches nothing of the game, the views or the windows", () => {
    const files = inPlayer(graph(join(PLAYER, "render/index.ts")).files);
    expect(files.length).toBeGreaterThan(5);
    expect(files.filter((file) => !file.startsWith("render/"))).toEqual([]);
  });

  it("the channel knows the game only as data (types): it reaches no other module", () => {
    expect(inPlayer(graph(join(PLAYER, "channel.ts")).files)).toEqual(["channel.ts"]);
  });
});
