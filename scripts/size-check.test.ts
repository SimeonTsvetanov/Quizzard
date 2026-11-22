// Unit tests for scripts/size-check.ts (PLAN T-07): which scripts count as Home's first load and how
// the budget verdict is reached, and the per-mini-app lazy budgets (T-10). `pnpm verify` runs the
// script itself on the real app/dist.
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { HOME_JS_BUDGET_KB, MINIAPP_JS_BUDGETS_KB, checkBudget, checkMiniAppBudget, firstLoadScripts, measureHomeScripts, measureMiniAppScripts, miniAppChunkPrefix } from "./size-check.ts";

const BASE = "/Quizzard/";
const HTML = `<!doctype html><html><head>
<script src="./theme-init.js"></script>
<script type="module" crossorigin src="/Quizzard/assets/index-abc.js"></script>
<link rel="modulepreload" crossorigin href="/Quizzard/assets/shared-def.js">
<link rel="stylesheet" crossorigin href="/Quizzard/assets/index-xyz.css">
<script type="application/ld+json">{"name":"not a file"}</script>
<script src="https://example.com/tracker.js"></script>
</head><body><script type="module" src="/Quizzard/assets/index-abc.js"></script></body></html>`;

describe("firstLoadScripts", () => {
  it("lists classic and module scripts plus modulepreloads, once each, as build paths", () => {
    expect(firstLoadScripts(HTML, BASE)).toEqual(["theme-init.js", "assets/index-abc.js", "assets/shared-def.js"]);
  });
  it("ignores stylesheets, inline JSON-LD and external URLs", () => {
    const files = firstLoadScripts(HTML, BASE);
    expect(files.some((file) => file.endsWith(".css") || file.includes("example.com"))).toBe(false);
  });
  it("a page without scripts has nothing to count", () => {
    expect(firstLoadScripts("<!doctype html><p>static</p>", BASE)).toEqual([]);
  });
});

describe("measureHomeScripts + checkBudget", () => {
  const dist = mkdtempSync(join(tmpdir(), "size-check-"));
  mkdirSync(join(dist, "assets"));
  const entry = "export const x = 1;\n".repeat(200);
  writeFileSync(join(dist, "index.html"), HTML);
  writeFileSync(join(dist, "theme-init.js"), "document.documentElement.dataset.x = '1';");
  writeFileSync(join(dist, "assets/index-abc.js"), entry);
  writeFileSync(join(dist, "assets/shared-def.js"), "export const y = 2;");
  writeFileSync(join(dist, "assets/lazy-chunk.js"), "x".repeat(500_000)); // lazy: never referenced by index.html

  it("sums the gzip size of the first-load scripts only (the lazy chunk is not counted)", () => {
    const sizes = measureHomeScripts(dist, BASE);
    expect(sizes.map(({ file }) => file)).toEqual(["theme-init.js", "assets/index-abc.js", "assets/shared-def.js"]);
    expect(sizes[1]?.gzipBytes).toBe(gzipSync(entry).length);
    expect(checkBudget(sizes).isWithinBudget).toBe(true);
  });
  it("fails over the budget and says so with the total", () => {
    const result = checkBudget([{ file: "assets/big.js", gzipBytes: (HOME_JS_BUDGET_KB + 1) * 1024 }]);
    expect(result).toMatchObject({ isWithinBudget: false, totalKb: HOME_JS_BUDGET_KB + 1 });
    expect(result.report).toContain("FAIL");
  });
  it("exactly the budget passes", () => {
    expect(checkBudget([{ file: "a.js", gzipBytes: HOME_JS_BUDGET_KB * 1024 }]).isWithinBudget).toBe(true);
  });
  it("a missing file is an error that names it (run the build first)", () => {
    const broken = mkdtempSync(join(tmpdir(), "size-check-"));
    writeFileSync(join(broken, "index.html"), '<script type="module" src="/Quizzard/assets/gone.js"></script>');
    expect(() => measureHomeScripts(broken, BASE)).toThrow(/gone\.js/);
  });
});

describe("mini-app budgets (PLAN T-10)", () => {
  const dist = mkdtempSync(join(tmpdir(), "size-check-miniapp-"));
  mkdirSync(join(dist, "assets"));
  writeFileSync(join(dist, "assets/miniapp-teams-src-abc.js"), "export const teams = 1;\n".repeat(100));
  writeFileSync(join(dist, "assets/miniapp-teams-help-def.js"), "export const help = 2;");
  writeFileSync(join(dist, "assets/miniapp-teams-src-abc.css"), "x".repeat(10_000)); // CSS is not JS
  writeFileSync(join(dist, "assets/miniapp-teamsplus-src-ghi.js"), "x".repeat(10_000)); // another id that only starts alike
  writeFileSync(join(dist, "assets/index-abc.js"), "x".repeat(10_000));

  it("chunk names start with miniapp-<id>-", () => {
    expect(miniAppChunkPrefix("teams")).toBe("miniapp-teams-");
  });
  it("counts every JS chunk of the mini-app and nothing else", () => {
    const sizes = measureMiniAppScripts(dist, "teams");
    expect(sizes.map(({ file }) => file)).toEqual(["assets/miniapp-teams-help-def.js", "assets/miniapp-teams-src-abc.js"]);
    expect(checkMiniAppBudget("teams", sizes, 1)).toMatchObject({ isWithinBudget: true });
  });
  it("fails over the budget and names the mini-app", () => {
    const result = checkMiniAppBudget("teams", [{ file: "assets/miniapp-teams-src-abc.js", gzipBytes: 41 * 1024 }], 40);
    expect(result).toMatchObject({ isWithinBudget: false, totalKb: 41 });
    expect(result.report).toContain('FAIL: Mini-app "teams" JS 41 KB');
  });
  it("fails when a budgeted mini-app has no chunk at all (the naming broke)", () => {
    const result = checkMiniAppBudget("scores", measureMiniAppScripts(dist, "scores"), 125);
    expect(result.isWithinBudget).toBe(false);
    expect(result.report).toContain("no assets/miniapp-scores-*.js");
  });
  it("every shipped budget is a positive number of KB", () => {
    for (const budget of Object.values(MINIAPP_JS_BUDGETS_KB)) expect(budget).toBeGreaterThan(0);
  });
});
