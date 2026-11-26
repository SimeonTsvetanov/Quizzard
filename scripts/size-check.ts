// `pnpm size` (the last step of `pnpm verify`) — Home's first-load JavaScript budget (SPEC §7, PLAN
// T-07): the gzip size of every script the built app/dist/index.html loads up front — `<script src>`
// (module entry and classic) and `<link rel="modulepreload">` — never lazy chunks or the service
// worker — and that none of it is mini-app code (React never reaches Home, PLAN §1.1 item 1). Then
// each mini-app's lazy JavaScript (PLAN T-10): every `assets/miniapp-<id>-*.js` chunk (named by
// app/build/miniapp-chunks.ts), and what its first open loads (PLAN T-12): the main chunk and every
// chunk it imports statically. Last, the quiz player's template (quiz-creator SPEC AC11): the one page
// "Export to play" fills, without the fonts inside it. Counted like the forge perf-check: zlib's
// default gzip level, 1 KB = 1024 bytes.
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { app } from "../app.config.ts";

/** Home first-load JS budget in KB gzip (SPEC §7: "Home (shell only) first-load JS ≤ 60 KB gzip"). */
export const HOME_JS_BUDGET_KB = 60;

/**
 * Lazy JS budget per mini-app in KB gzip: all its chunks together (body, lazy parts, Help). TeamSync
 * 1.0.3 is 35 KB, most of it zod (its core validates input); SPEC §7 caps GG Counter at 125 KB.
 */
export const MINIAPP_JS_BUDGETS_KB: Readonly<Record<string, number>> = { teams: 40, sheet: 10 };

/**
 * First-open JS budget per mini-app in KB gzip: its main chunk and every chunk that chunk imports
 * statically (what opening it loads before the first frame), Home's first load not counted again. Its
 * lazy parts — Help, a dialog's content, another language — are not first-open. SPEC §7: GG Counter's
 * screen ≤ 125 KB (React, Radix and Tailwind's output included; its standalone first load had the same
 * budget with its own shell in it). Quiz creator SPEC AC11: "the creator's code ≤ 75 KB gzip on first open" (60 until 2026-11-26, raised by Moni: DECISIONS).
 */
export const MINIAPP_FIRST_OPEN_BUDGETS_KB: Readonly<Record<string, number>> = { scores: 125, quiz: 75 };

/**
 * Budget of the quiz player's template in KB gzip, the embedded fonts not counted (quiz-creator SPEC
 * AC11: "the player template ≤ 80 KB gzip without media"; the fonts are fixed files reported next to it).
 */
export const PLAYER_TEMPLATE_BUDGET_KB = 80;

/** The built template, from the repo root (miniapps/quiz/packages/player/build.ts writes it). */
export const PLAYER_TEMPLATE_FILE = "miniapps/quiz/packages/player/dist/template.html";

/** The main chunk's name part (app/build/miniapp-chunks.ts `MAIN_CHUNK_NAME`). */
const MAIN_CHUNK = "main";

/** A string only React's runtime contains: Home's first load must not have it. */
const REACT_MARK = "react.transitional.element";
/**
 * Returns the file name prefix of a mini-app's chunks inside `assets/` (the build names them so).
 * @param id - the mini-app's registry id
 */
export function miniAppChunkPrefix(id: string): string {
  return `miniapp-${id}-`;
}

/** One first-load script and its gzip size. */
export interface ScriptSize {
  /** Path inside the build folder, e.g. `assets/index-abc.js`. */
  readonly file: string;
  readonly gzipBytes: number;
}

/** Result of {@link checkBudget}. */
export interface BudgetResult {
  readonly isWithinBudget: boolean;
  readonly totalKb: number;
  /** One line for the terminal: the total, the budget and each file. */
  readonly report: string;
}

const SCRIPT_TAG = /<script\b[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi;
const PRELOAD_TAG = /<link\b[^>]*\srel=["']modulepreload["'][^>]*>/gi;
const HREF = /\shref=["']([^"']+)["']/i;

/**
 * Lists the same-origin scripts a page loads before any user action, as paths inside the build.
 * @param html - the built index.html
 * @param basePath - the Pages path the build uses (`app.basePath`, e.g. `/Quizzard/`)
 * @returns unique paths in page order; external URLs are left out (CSP allows none)
 */
export function firstLoadScripts(html: string, basePath: string): string[] {
  const scripts = [...html.matchAll(SCRIPT_TAG)].map((match) => match[1] ?? "");
  const preloads = [...html.matchAll(PRELOAD_TAG)].map((match) => HREF.exec(match[0])?.[1] ?? "");
  const paths = [...scripts, ...preloads].filter((url) => url !== "" && !/^([a-z]+:)?\/\//i.test(url)).map((url) => toBuildPath(url, basePath));
  return [...new Set(paths)];
}

/** `/Quizzard/assets/x.js` or `./theme-init.js` → `assets/x.js`, `theme-init.js`. */
function toBuildPath(url: string, basePath: string): string {
  const path = url.split(/[?#]/)[0] ?? "";
  if (path.startsWith(basePath)) return path.slice(basePath.length);
  return path.replace(/^\.?\//, "");
}

/**
 * Measures the first-load scripts of a build.
 * @param distDir - the build folder (`app/dist`)
 * @param basePath - the Pages path of the build
 * @throws {@link Error} when index.html or one of its scripts is missing (run `pnpm build` first)
 */
export function measureHomeScripts(distDir: string, basePath: string): ScriptSize[] {
  const html = readFileSync(join(distDir, "index.html"), "utf8");
  return firstLoadScripts(html, basePath).map((file) => ({ file, gzipBytes: gzipSync(readFileSync(join(distDir, file))).length }));
}

/**
 * Compares the measured scripts with the budget.
 * @param sizes - from {@link measureHomeScripts}
 * @param budgetKb - the budget in KB gzip
 */
export function checkBudget(sizes: readonly ScriptSize[], budgetKb: number = HOME_JS_BUDGET_KB): BudgetResult {
  return budgetVerdict({ label: "Home first-load JS", sizes, budgetKb });
}

/**
 * Measures the lazy chunks of one mini-app in a build.
 * @param distDir - the build folder (`app/dist`)
 * @param id - the mini-app's registry id
 * @returns its `assets/miniapp-<id>-*.js` files, sorted; none when the build has no such chunk
 */
export function measureMiniAppScripts(distDir: string, id: string): ScriptSize[] {
  const prefix = miniAppChunkPrefix(id);
  return readdirSync(join(distDir, "assets"))
    .filter((name) => name.startsWith(prefix) && name.endsWith(".js"))
    .sort()
    .map((name) => ({ file: `assets/${name}`, gzipBytes: gzipSync(readFileSync(join(distDir, "assets", name))).length }));
}

/**
 * Compares a mini-app's chunks with its budget.
 * @param id - the mini-app's registry id (the report names it)
 * @param sizes - from {@link measureMiniAppScripts}; none fails, because a budgeted mini-app without
 * chunks means the build stopped naming them and the budget would pass unchecked
 * @param budgetKb - the budget in KB gzip
 */
export function checkMiniAppBudget(id: string, sizes: readonly ScriptSize[], budgetKb: number): BudgetResult {
  const result = budgetVerdict({ label: `Mini-app "${id}" JS`, sizes, budgetKb });
  if (sizes.length > 0) return result;
  return { isWithinBudget: false, totalKb: 0, report: `size-check FAIL: no assets/${miniAppChunkPrefix(id)}*.js in the build (app/build/miniapp-chunks.ts names them)` };
}

/**
 * Lists the chunks a chunk imports statically (`import … from "./x.js"`, `import "./x.js"`), not
 * `import("./x.js")`, as paths inside the build.
 * @param code - a built chunk
 * @param file - its path inside the build (imports are relative to its folder)
 */
export function staticImports(code: string, file: string): string[] {
  const folder = file.includes("/") ? file.slice(0, file.lastIndexOf("/") + 1) : "";
  const found = [...code.matchAll(/(?:\bfrom|\bimport)\s*["']\.\/([^"']+\.js)["']/g)].map((match) => `${folder}${match[1] ?? ""}`);
  return [...new Set(found)];
}

/**
 * Measures what the first open of a mini-app loads: its main chunk and, transitively, every chunk
 * imported statically, except Home's first-load scripts (already loaded).
 * @param distDir - the build folder (`app/dist`)
 * @param id - the mini-app's registry id
 * @param home - Home's first-load scripts ({@link firstLoadScripts})
 * @returns main chunk first; none when the build has no `miniapp-<id>-main-*.js`
 */
export function measureFirstOpen(distDir: string, id: string, home: readonly string[]): ScriptSize[] {
  const prefix = `${miniAppChunkPrefix(id)}${MAIN_CHUNK}-`;
  const main = readdirSync(join(distDir, "assets")).filter((name) => name.startsWith(prefix) && name.endsWith(".js"));
  const queue = main.map((name) => `assets/${name}`);
  const seen = new Set<string>(home);
  const sizes: ScriptSize[] = [];
  for (let file = queue.shift(); file !== undefined; file = queue.shift()) {
    if (seen.has(file)) continue;
    seen.add(file);
    const code = readFileSync(join(distDir, file));
    sizes.push({ file, gzipBytes: gzipSync(code).length });
    queue.push(...staticImports(code.toString("utf8"), file));
  }
  return sizes;
}

/**
 * Compares a mini-app's first open with its budget.
 * @param sizes - from {@link measureFirstOpen}; none fails (the main chunk is no longer named)
 */
export function checkFirstOpenBudget(id: string, sizes: readonly ScriptSize[], budgetKb: number): BudgetResult {
  if (sizes.length === 0) return { isWithinBudget: false, totalKb: 0, report: `size-check FAIL: no assets/${miniAppChunkPrefix(id)}${MAIN_CHUNK}-*.js in the build (app/build/miniapp-chunks.ts names it)` };
  return budgetVerdict({ label: `Mini-app "${id}" first-open JS`, sizes, budgetKb });
}

/**
 * Checks that Home's first load carries no mini-app code: no `miniapp-*` chunk and no React runtime.
 * @param distDir - the build folder
 * @param home - Home's first-load scripts
 */
export function checkHomeHasNoMiniAppCode(distDir: string, home: readonly string[]): BudgetResult {
  const offending = home.filter((file) => file.startsWith("assets/miniapp-") || readFileSync(join(distDir, file), "utf8").includes(REACT_MARK));
  const isWithinBudget = offending.length === 0;
  const report = isWithinBudget ? "size-check PASS: Home first load has no mini-app code and no React" : `size-check FAIL: Home first load carries mini-app code or React — ${offending.join(" · ")}`;
  return { isWithinBudget, totalKb: 0, report };
}

/** A font embedded in the template's stylesheet as a data URL. */
const EMBEDDED_FONT = /url\(data:font\/woff2;base64,([A-Za-z0-9+/=]+)\)/g;

/**
 * Compares the quiz player's template with its budget: the gzip size of the page with its embedded
 * fonts taken out (they are counted apart and named in the report).
 * @param html - the built template
 * @param budgetKb - the budget in KB gzip
 */
export function checkTemplateBudget(html: string, budgetKb: number = PLAYER_TEMPLATE_BUDGET_KB): BudgetResult {
  const fonts = [...html.matchAll(EMBEDDED_FONT)].map((match) => match[1] ?? "");
  const fontBytes = fonts.reduce((sum, base64) => sum + base64.length, 0);
  const totalKb = toKb(gzipSync(html.replace(EMBEDDED_FONT, "url()")).length);
  const isWithinBudget = totalKb <= budgetKb;
  const rest = `${String(fonts.length)} embedded fonts ${String(toKb(fontBytes))} KB (base64, not counted) · the whole page ${String(toKb(Buffer.byteLength(html)))} KB, ${String(toKb(gzipSync(html).length))} KB gzip`;
  return { isWithinBudget, totalKb, report: `size-check ${isWithinBudget ? "PASS" : "FAIL"}: Quiz player template ${String(totalKb)} KB gzip without fonts (budget ${String(budgetKb)} KB) — ${rest}` };
}

/** Inputs of {@link budgetVerdict}. */
interface BudgetInput {
  readonly label: string;
  readonly sizes: readonly ScriptSize[];
  readonly budgetKb: number;
}

function budgetVerdict({ label, sizes, budgetKb }: BudgetInput): BudgetResult {
  const totalKb = toKb(sizes.reduce((sum, { gzipBytes }) => sum + gzipBytes, 0));
  const isWithinBudget = totalKb <= budgetKb;
  const files = sizes.map(({ file, gzipBytes }) => `${file} ${String(toKb(gzipBytes))} KB`).join(" · ");
  const verdict = isWithinBudget ? "PASS" : "FAIL";
  return { isWithinBudget, totalKb, report: `size-check ${verdict}: ${label} ${String(totalKb)} KB gzip (budget ${String(budgetKb)} KB) — ${files}` };
}

/** Bytes → KB with one decimal (perf-check's rounding). */
function toKb(bytes: number): number {
  return Math.round(bytes / 102.4) / 10;
}

function main(): void {
  const distDir = resolve(import.meta.dirname, "../app/dist");
  const homeSizes = measureHomeScripts(distDir, app.basePath);
  const home = homeSizes.map(({ file }) => file);
  const results = [
    checkBudget(homeSizes),
    checkHomeHasNoMiniAppCode(distDir, home),
    ...Object.entries(MINIAPP_JS_BUDGETS_KB).map(([id, budgetKb]) => checkMiniAppBudget(id, measureMiniAppScripts(distDir, id), budgetKb)),
    ...Object.entries(MINIAPP_FIRST_OPEN_BUDGETS_KB).map(([id, budgetKb]) => checkFirstOpenBudget(id, measureFirstOpen(distDir, id, home), budgetKb)),
    checkTemplateBudget(readFileSync(resolve(import.meta.dirname, "..", PLAYER_TEMPLATE_FILE), "utf8")),
  ];
  for (const result of results) console.log(result.report);
  if (results.some((result) => !result.isWithinBudget)) process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
