// Token check of mini-app CSS (PLAN §1.3, T-09): a mini-app's own stylesheets (sources, before Tailwind
// or Vite touch them) may use only Quizzard's tokens (design/tokens.css + the generated accent) and the
// tokens they declare themselves. The Vite plugin (app/build/miniapp-presets.ts) runs it on every listed
// mini-app package at build start, so `pnpm verify` fails on a finding; by hand:
//   node scripts/check-miniapp-tokens.ts <folder-or-file>…
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postcss, { AtRule, Rule, type Declaration, type Node, type Root } from "postcss";
import { findLiteralColor } from "./css-colors.ts";

/** One stylesheet to check. */
export interface CssFile {
  /** Path shown in findings. */
  readonly path: string;
  readonly css: string;
}

/** What a finding is about. */
export type TokenFindingCode = "UNDEFINED_TOKEN" | "LITERAL_COLOR" | "FORBIDDEN_IMPORT" | "FONT_FACE" | "IMPORTANT";

/** One problem in one place. */
export interface TokenFinding {
  readonly code: TokenFindingCode;
  readonly file: string;
  /** 1-based line, 0 when unknown. */
  readonly line: number;
  readonly message: string;
}

const VAR_REFERENCE = /var\(\s*(--[\w-]+)/g;
/** `@import` targets a mini-app must not load: the shell's tokens, its accent, fonts. */
const FORBIDDEN_IMPORT = /tokens\.css|accent\.css|fonts?\b|fontsource|\.(?:woff2?|ttf|otf)\b/i;
/** A rule whose every selector is the document root: its custom properties are the mini-app's tokens. */
const ROOT_SELECTOR = /^(?::root|html|:host|body)(?![\w-])/i;
/** At-rules whose declarations define tokens: `@property` (initial-value) and Tailwind's `@theme`. */
const TOKEN_AT_RULES = new Set(["property", "theme"]);
/** Folders never searched for stylesheets. */
const SKIPPED_FOLDERS = /(?:^|[\\/])(?:node_modules|dist|\.tsbuild)(?:[\\/]|$)/;

/**
 * Returns the custom properties the given stylesheets declare (Quizzard's tokens).
 * @param sheets - CSS text of design/tokens.css and app/src/generated/accent.css
 */
export function shellTokens(sheets: readonly string[]): Set<string> {
  const tokens = new Set<string>();
  for (const css of sheets) declaredProperties(postcss.parse(css), tokens);
  return tokens;
}

/**
 * Checks a mini-app's stylesheets: (a) `var(--x)` that neither Quizzard's tokens nor the mini-app
 * define, (b) literal colours outside the mini-app's own root tokens and `@property` initial values,
 * (c) an `@import` of tokens, accent or fonts and `@font-face`, (d) `!important` outside a
 * `prefers-reduced-motion` block.
 * @param files - every stylesheet of one mini-app (its own definitions count across files)
 * @param tokens - {@link shellTokens}
 * @returns findings in file order; empty = pass
 * @throws postcss's `CssSyntaxError` when a file does not parse
 */
export function checkMiniAppCss(files: readonly CssFile[], tokens: ReadonlySet<string>): TokenFinding[] {
  const parsed = files.map((file) => ({ file, root: postcss.parse(file.css, { from: file.path }) }));
  const defined = new Set(tokens);
  for (const { root } of parsed) declaredProperties(root, defined);
  return parsed.flatMap(({ file, root }) => checkRoot(root, file.path, defined));
}

function checkRoot(root: Root, file: string, defined: ReadonlySet<string>): TokenFinding[] {
  const findings: TokenFinding[] = [];
  const add = (code: TokenFindingCode, node: Node, message: string): void => {
    findings.push({ code, file, line: node.source?.start?.line ?? 0, message });
  };
  root.walkAtRules((atRule) => {
    const name = atRule.name.toLowerCase();
    if (name === "font-face") add("FONT_FACE", atRule, "@font-face: the shell loads the fonts; a mini-app ships none");
    if (name === "import" && FORBIDDEN_IMPORT.test(atRule.params)) add("FORBIDDEN_IMPORT", atRule, `@import ${atRule.params}: tokens, accent and fonts come from the shell`);
  });
  root.walkDecls((declaration) => {
    for (const [, name = ""] of declaration.value.matchAll(VAR_REFERENCE)) {
      if (!defined.has(name)) add("UNDEFINED_TOKEN", declaration, `var(${name}) is defined neither by Quizzard's tokens nor by the mini-app`);
    }
    const literal = isTokenDefinition(declaration) ? null : findLiteralColor(declaration.prop, declaration.value);
    if (literal !== null) add("LITERAL_COLOR", declaration, `${declaration.prop}: literal colour ${literal} — use a token`);
    if (declaration.important && !insideReducedMotion(declaration)) add("IMPORTANT", declaration, `${declaration.prop}: !important reverses the layer order — remove it`);
  });
  return findings;
}

/** Adds every declared custom property and `@property` name to `into`; Tailwind's `@theme` emits none. */
function declaredProperties(root: Root, into: Set<string>): void {
  root.walkDecls(/^--/, (declaration) => {
    if (!hasAncestor(declaration, (node) => node.name.toLowerCase() === "theme")) into.add(declaration.prop);
  });
  root.walkAtRules("property", (atRule) => {
    into.add(atRule.params.trim());
  });
}

/** A custom property on the root (the mini-app's tokens), an `@property` or `@theme` value. */
function isTokenDefinition(declaration: Declaration): boolean {
  const parent = declaration.parent;
  if (parent instanceof AtRule) return TOKEN_AT_RULES.has(parent.name.toLowerCase());
  if (!declaration.prop.startsWith("--") || !(parent instanceof Rule)) return false;
  return parent.selectors.every((selector) => ROOT_SELECTOR.test(selector.trim()));
}

function insideReducedMotion(declaration: Declaration): boolean {
  return hasAncestor(declaration, (node) => node.name.toLowerCase() === "media" && node.params.includes("prefers-reduced-motion"));
}

function hasAncestor(node: Node, test: (atRule: AtRule) => boolean): boolean {
  for (let parent = node.parent; parent !== undefined; parent = parent.parent) {
    if (parent instanceof AtRule && test(parent)) return true;
  }
  return false;
}

/**
 * Lists the `.css` files of folders (recursive, without node_modules/dist) and files.
 * @param paths - absolute or relative folders and files
 */
export function listCssFiles(paths: readonly string[]): string[] {
  return paths.flatMap((path) => {
    if (!statSync(path).isDirectory()) return [path];
    return readdirSync(path, { recursive: true, encoding: "utf8" })
      .filter((file) => file.endsWith(".css") && !SKIPPED_FOLDERS.test(file))
      .sort()
      .map((file) => join(path, file));
  });
}

/**
 * Reads the stylesheets of {@link listCssFiles}.
 * @param paths - folders and files
 */
export function readCssFiles(paths: readonly string[]): CssFile[] {
  return listCssFiles(paths).map((path) => ({ path, css: readFileSync(path, "utf8") }));
}

/**
 * Formats a finding for the terminal: `file:line CODE message`.
 * @param finding - one finding
 */
export function formatFinding(finding: TokenFinding): string {
  return `${finding.file}:${String(finding.line)} ${finding.code} ${finding.message}`;
}

function main(paths: readonly string[]): void {
  const repo = resolve(import.meta.dirname, "..");
  const tokens = shellTokens(["design/tokens.css", "app/src/generated/accent.css"].map((file) => readFileSync(join(repo, file), "utf8")));
  const findings = checkMiniAppCss(readCssFiles(paths), tokens);
  for (const finding of findings) console.log(formatFinding(finding));
  console.log(`check-miniapp-tokens ${findings.length === 0 ? "PASS" : "FAIL"}: ${String(findings.length)} finding(s) in ${paths.join(", ")}`);
  if (findings.length > 0) process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
