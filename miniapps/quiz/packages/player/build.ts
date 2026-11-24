// `pnpm build` of the player (run by the repo's `pnpm build` and `pnpm verify` before the app is
// built): bundles src/standalone.ts and its stylesheets with Vite and writes ONE self-contained page,
// dist/template.html — script and style inline, the fonts as data URLs, no address of any other
// file. The creator loads that page as text and "Export to play" (core `assembleExport`) puts a quiz
// into it at the data mark.
//
// Content-Security-Policy of the page: `default-src 'none'` — nothing is ever fetched — and exactly
// one script and one style are allowed, each by the SHA-256 hash of its text. Hashes instead of
// `'unsafe-inline'`: the script is the same in every exported file (the quiz is added as inert data
// blocks, which need no grant), so the hash can be computed here once, and an edited or injected
// script in a copy of the file does not run. No `unsafe-eval`: the bundle has no Zod and no `eval`
// (checked below). Pictures, audio and video come from `data:`/`blob:` only; fonts from `data:`.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { EXPORT_DATA_MARK } from "../core/src/export.ts";

const root = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/** The subsets embedded, with the characters each covers (as @fontsource declares them). */
const RANGES = {
  latin: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
  cyrillic: "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116",
} as const;

/** The fonts and weights the player's stylesheets use — the same as the app's. */
const FACES = [
  { family: "Manrope", pkg: "manrope", weights: [400, 600, 700] },
  { family: "Unbounded", pkg: "unbounded", weights: [700] },
] as const;

const packageDir = (name: string): string => dirname(require.resolve(`${name}/package.json`));

/** `@font-face` rules with every font file inline. */
function fontCss(): string {
  const rules: string[] = [];
  for (const face of FACES) {
    for (const weight of face.weights) {
      for (const [subset, range] of Object.entries(RANGES)) {
        const file = join(packageDir(`@fontsource/${face.pkg}`), "files", `${face.pkg}-${subset}-${String(weight)}-normal.woff2`);
        const data = readFileSync(file).toString("base64");
        rules.push(`@font-face{font-family:"${face.family}";font-style:normal;font-display:block;font-weight:${String(weight)};src:url(data:font/woff2;base64,${data}) format("woff2");unicode-range:${range}}`);
      }
    }
  }
  return rules.join("");
}

/** The licences of what the page carries: its fonts (OFL needs the licence with every copy) and its icons. */
function licences(): string {
  const parts = [
    ["Manrope (font)", join(packageDir("@fontsource/manrope"), "LICENSE")],
    ["Unbounded (font)", join(packageDir("@fontsource/unbounded"), "LICENSE")],
    ["Lucide (icons)", join(packageDir("lucide"), "LICENSE")],
    ["Quizzard (the player)", join(root, "../../LICENSE")],
  ] as const;
  return parts.map(([title, file]) => `${"=".repeat(72)}\n${title}\n${"=".repeat(72)}\n\n${readFileSync(file, "utf8").trim()}\n`).join("\n");
}

const hash = (text: string): string => `'sha256-${createHash("sha256").update(text, "utf8").digest("base64")}'`;

/** Bundles the player; returns its script (one IIFE) and its stylesheet. */
async function bundle(): Promise<{ js: string; css: string }> {
  const result = await build({
    configFile: false,
    root,
    logLevel: "warn",
    build: {
      write: false,
      target: "es2022",
      cssTarget: ["chrome123", "firefox121", "safari17.5"],
      minify: true,
      lib: { entry: join(root, "src/standalone.ts"), formats: ["iife"], name: "QuizzardPlayer", fileName: "player", cssFileName: "player" },
    },
  });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap((part) => ("output" in part ? part.output : []));
  const js = outputs.flatMap((file) => (file.type === "chunk" ? [file.code] : []));
  const css = outputs.flatMap((file) => (file.type === "asset" && file.fileName.endsWith(".css") ? [String(file.source)] : []));
  const [script] = js;
  if (js.length !== 1 || script === undefined || css.length !== 1) throw new Error(`player build: expected one script and one stylesheet, got ${String(js.length)} and ${String(css.length)}`);
  return { js: script.trim(), css: css.join("").trim() };
}

/** What must never be in the page's script or style; each would break the page or its policy. */
function check(js: string, css: string): void {
  const problems = [
    [/<\/script/i.test(js) || js.includes("<!--"), "the script contains </script or <!--"],
    [/<\/style/i.test(css), "the stylesheet contains </style"],
    [/\beval\(|new Function\(/.test(js), "the script uses eval or new Function (blocked by the page's policy)"],
    [/ZodError|\$ZodType/.test(js), "Zod is in the bundle (the player imports core's `play` entry only)"],
    [/url\((?!data:)/.test(css) || /https?:\/\//.test(css), "the stylesheet names an address outside the page"],
    [js.includes(EXPORT_DATA_MARK), "the script contains the data mark"],
  ] as const;
  const found = problems.filter(([isWrong]) => isWrong).map(([, message]) => message);
  if (found.length > 0) throw new Error(`player build:\n- ${found.join("\n- ")}`);
}

const HEADER = `<!--
  A quiz made with Quizzard — https://simeontsvetanov.github.io/Quizzard/
  One file: the player, the quiz and its pictures, audio and video. Nothing is loaded from the internet.

  Player: Copyright (c) Simeon Tsvetanov, MIT License.
  Fonts: Manrope, Copyright 2019 The Manrope Project Authors; Unbounded, Copyright 2022 The Unbounded
  Project Authors. Both under the SIL Open Font License 1.1.
  Icons: Lucide, ISC License.
  The full licence texts are in the block "qp-licences" at the end of this file.
-->`;

/** The page: policy, style, the data mark, the script, the licences. */
function page(js: string, css: string): string {
  const policy = [
    "default-src 'none'", `script-src ${hash(js)}`, `style-src ${hash(css)}`, "img-src data: blob:", "media-src data: blob:", "font-src data:", "base-uri 'none'", "form-action 'none'",
  ].join("; ");
  return [
    "<!doctype html>",
    HEADER,
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    `<meta http-equiv="Content-Security-Policy" content="${policy}">`,
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
    '<meta name="referrer" content="no-referrer">',
    '<meta name="robots" content="noindex">',
    '<meta name="color-scheme" content="light dark">',
    "<title>Quizzard quiz</title>",
    `<style>${css}</style>`,
    "</head>",
    "<body>",
    "<noscript>This quiz needs JavaScript to play. / Този куиз има нужда от JavaScript.</noscript>",
    EXPORT_DATA_MARK,
    `<script>${js}</script>`,
    `<script type="text/plain" id="qp-licences">\n${licences().replace(/<\/script/gi, "<\\/script")}</script>`,
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

/** The built template and its two inline parts (the tests check the policy's hashes against them). */
export interface TemplateBuild {
  readonly html: string;
  readonly js: string;
  readonly css: string;
}

/**
 * Builds the player template in memory.
 * @throws {@link Error} when the bundle is not one script and one style, or carries something the page must not have
 */
export async function buildTemplate(): Promise<TemplateBuild> {
  const { js, css: styles } = await bundle();
  const css = `${fontCss()}${styles}`;
  check(js, css);
  const html = page(js, css);
  if (html.split(EXPORT_DATA_MARK).length !== 2) throw new Error("player build: the page needs its data mark exactly once");
  return { html, js, css };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { html, js, css } = await buildTemplate();
  mkdirSync(join(root, "dist"), { recursive: true });
  writeFileSync(join(root, "dist/template.html"), html);
  process.stdout.write(`player template: ${String(Math.round(html.length / 1024))} KB (script ${String(Math.round(js.length / 1024))} KB, style with fonts ${String(Math.round(css.length / 1024))} KB)\n`);
}
