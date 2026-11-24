// Unit tests for scripts/size-check.ts (PLAN T-07): which scripts count as Home's first load and how
// the budget verdict is reached, and the per-mini-app lazy budgets (T-10). `pnpm verify` runs the
// script itself on the real app/dist.
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import {
  HOME_JS_BUDGET_KB, MINIAPP_FIRST_OPEN_BUDGETS_KB, MINIAPP_JS_BUDGETS_KB, checkBudget, checkFirstOpenBudget, checkHomeHasNoMiniAppCode, checkMiniAppBudget, firstLoadScripts,
  measureFirstOpen, measureHomeScripts, measureMiniAppScripts, miniAppChunkPrefix, staticImports,
  checkTemplateBudget,
  PLAYER_TEMPLATE_BUDGET_KB,
} from "./size-check.ts";

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

describe("first open of a mini-app (PLAN T-12)", () => {
  const dist = mkdtempSync(join(tmpdir(), "size-check-first-open-"));
  mkdirSync(join(dist, "assets"));
  const write = (name: string, code: string): void => { writeFileSync(join(dist, "assets", name), code); };
  write("miniapp-scores-main-a.js", `import{a}from"./miniapp-scores-react-b.js";import"./side-c.js";import{h}from"./index-home.js";const l=()=>import("./miniapp-scores-sheet-d.js");${"x".repeat(2000)}`);
  write("miniapp-scores-react-b.js", `import{h}from"./index-home.js";export const a=1;${"y".repeat(3000)}`);
  write("side-c.js", 'import{a}from"./miniapp-scores-react-b.js";');
  write("miniapp-scores-sheet-d.js", "z".repeat(50_000)); // lazy: only import()
  write("index-home.js", "h".repeat(50_000)); // Home's entry: already loaded
  const home = ["assets/index-home.js"];

  it("reads static imports only, relative to the chunk's folder, once each", () => {
    expect(staticImports('import{a}from"./x.js";import "./y.js";import("./z.js");export{b}from"./x.js"', "assets/m.js")).toEqual(["assets/x.js", "assets/y.js"]);
  });
  it("counts the main chunk and its static imports, never a lazy chunk or Home's entry", () => {
    const sizes = measureFirstOpen(dist, "scores", home);
    expect(sizes.map(({ file }) => file)).toEqual(["assets/miniapp-scores-main-a.js", "assets/miniapp-scores-react-b.js", "assets/side-c.js"]);
    expect(checkFirstOpenBudget("scores", sizes, 125)).toMatchObject({ isWithinBudget: true });
  });
  it("fails over the budget, and when the build has no main chunk", () => {
    expect(checkFirstOpenBudget("scores", [{ file: "assets/miniapp-scores-main-a.js", gzipBytes: 126 * 1024 }], 125).report).toContain('FAIL: Mini-app "scores" first-open JS 126 KB');
    const none = checkFirstOpenBudget("teams", measureFirstOpen(dist, "teams", home), 40);
    expect(none.isWithinBudget).toBe(false);
    expect(none.report).toContain("no assets/miniapp-teams-main-*.js");
  });
  it("Home's first load must carry no mini-app chunk and no React runtime", () => {
    expect(checkHomeHasNoMiniAppCode(dist, home).isWithinBudget).toBe(true);
    write("index-react.js", 'const e=Symbol.for("react.transitional.element");');
    expect(checkHomeHasNoMiniAppCode(dist, ["assets/index-react.js", "assets/miniapp-scores-main-a.js"])).toMatchObject({ isWithinBudget: false });
  });
  it("Scores is held to SPEC §7's 125 KB, the quiz creator to its SPEC AC11's 60 KB", () => {
    expect(MINIAPP_FIRST_OPEN_BUDGETS_KB).toEqual({ scores: 125, quiz: 60 });
  });
});

describe("the quiz player's template (quiz-creator SPEC AC11)", () => {
  /** Text that gzip cannot shrink much: every chunk is different. */
  const noise = (bytes: number): string => Array.from({ length: Math.ceil(bytes / 8) }, (_, index) => (index * 2654435761 % 4294967296).toString(36).padStart(8, "0")).join("");
  const font = (bytes: number): string => `@font-face{src:url(data:font/woff2;base64,${"QUJD".repeat(Math.ceil(bytes / 4))}) format("woff2")}`;

  it("budget is 80 KB gzip", () => {
    expect(PLAYER_TEMPLATE_BUDGET_KB).toBe(80);
  });

  it("counts the page without its embedded fonts, and names the fonts and the whole page in the report", () => {
    const code = noise(40 * 1024);
    const withFonts = `<style>${font(50_000)}${font(70_000)}</style><script>${code}</script>`;
    const withoutFonts = `<style>${font(0)}${font(0)}</style><script>${code}</script>`;
    const result = checkTemplateBudget(withFonts);
    expect(result.isWithinBudget).toBe(true);
    expect(result.totalKb).toBeCloseTo(checkTemplateBudget(withoutFonts).totalKb, 1);
    expect(result.report).toMatch(/^size-check PASS: Quiz player template [\d.]+ KB gzip without fonts \(budget 80 KB\) — 2 embedded fonts 117\.2 KB/);
  });

  it("fails when the code alone is over the budget", () => {
    const result = checkTemplateBudget(`<script>${noise(200 * 1024)}</script>`, 80);
    expect(result.isWithinBudget).toBe(false);
    expect(result.report).toContain("size-check FAIL: Quiz player template");
  });

  it("media put into an exported page is not font and would count — the budget is for the template alone", () => {
    const media = `<script type="application/octet-stream">${noise(100 * 1024)}</script>`;
    expect(checkTemplateBudget(`<script>x</script>${media}`, 20).isWithinBudget).toBe(false);
  });
});
