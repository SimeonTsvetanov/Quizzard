// `pnpm size` (the last step of `pnpm verify`) — Home's first-load JavaScript budget (SPEC §7, PLAN
// T-07): the gzip size of every script the built app/dist/index.html loads up front — `<script src>`
// (module entry and classic) and `<link rel="modulepreload">` — never lazy chunks or the service
// worker. Counted like the forge perf-check: zlib's default gzip level, 1 KB = 1024 bytes.
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { app } from "../app.config.ts";

/** Home first-load JS budget in KB gzip (SPEC §7: "Home (shell only) first-load JS ≤ 60 KB gzip"). */
export const HOME_JS_BUDGET_KB = 60;

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
  const totalKb = toKb(sizes.reduce((sum, { gzipBytes }) => sum + gzipBytes, 0));
  const isWithinBudget = totalKb <= budgetKb;
  const files = sizes.map(({ file, gzipBytes }) => `${file} ${String(toKb(gzipBytes))} KB`).join(" · ");
  const verdict = isWithinBudget ? "PASS" : "FAIL";
  return { isWithinBudget, totalKb, report: `size-check ${verdict}: Home first-load JS ${String(totalKb)} KB gzip (budget ${String(budgetKb)} KB) — ${files}` };
}

/** Bytes → KB with one decimal (perf-check's rounding). */
function toKb(bytes: number): number {
  return Math.round(bytes / 102.4) / 10;
}

function main(): void {
  const distDir = resolve(import.meta.dirname, "../app/dist");
  const result = checkBudget(measureHomeScripts(distDir, app.basePath));
  console.log(result.report);
  if (!result.isWithinBudget) process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
