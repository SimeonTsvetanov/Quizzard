// The exported page's template, built here as `pnpm build` builds it: one self-contained page whose
// policy allows exactly its own script and style, with nothing that points outside the file.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { beforeAll, describe, expect, it } from "vitest";
import { type TemplateBuild, buildTemplate } from "../build.ts";

const SRC = join(import.meta.dirname, "../src");
const hash = (text: string): string => `'sha256-${createHash("sha256").update(text, "utf8").digest("base64")}'`;

describe("the player template", () => {
  let built: TemplateBuild;
  beforeAll(async () => {
    built = await buildTemplate();
  }, 60_000);

  it("is one page: one inline script, one inline style, no address of another file", () => {
    const { html } = built;
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html.match(/<script>/g)).toHaveLength(1);
    expect(html.match(/<style>/g)).toHaveLength(1);
    expect(html).not.toMatch(/<(?:script|link|img|iframe|source|audio|video)\b[^>]*\s(?:src|href)=/i);
    expect(built.css).not.toMatch(/url\((?!data:)/);
    expect(built.css).not.toMatch(/@import/);
    expect(html).toContain(`<style>${built.css}</style>`);
    expect(html).toContain(`<script>${built.js}</script>`);
  });

  it("carries a strict Content-Security-Policy whose hashes are those of its own script and style", () => {
    const policy = /<meta http-equiv="Content-Security-Policy" content="([^"]+)">/.exec(built.html)?.[1] ?? "";
    const directives: Record<string, string> = Object.fromEntries(policy.split("; ").map((part) => [part.split(" ")[0] ?? "", part.split(" ").slice(1).join(" ")] as const));
    expect(directives).toEqual({
      "default-src": "'none'",
      "script-src": hash(built.js),
      "style-src": hash(built.css),
      "img-src": "data: blob:",
      "media-src": "data: blob:",
      "font-src": "data:",
      "base-uri": "'none'",
      "form-action": "'none'",
    });
    expect(policy).not.toMatch(/unsafe|https?:|\*/);
    // The policy stands before anything it governs.
    expect(built.html.indexOf("Content-Security-Policy")).toBeLessThan(built.html.indexOf("<style>"));
  });

  it("has no eval, no Zod and none of the creator's code in its script", () => {
    expect(built.js).not.toMatch(/\beval\(|new Function\(/);
    expect(built.js).not.toMatch(/ZodError|\$ZodType|safeParse/);
    expect(built.js).not.toContain("indexedDB");
    expect(built.js).not.toMatch(/<\/script|<!--/);
  });

  it("has the data mark exactly once, before its script, so the quiz is on the page when the script runs", () => {
    const mark = "<!--quizzard:data-->";
    expect(built.html.split(mark)).toHaveLength(2);
    expect(built.html.indexOf(mark)).toBeLessThan(built.html.indexOf("<script>"));
    expect(built.html.indexOf(mark)).toBeGreaterThan(built.html.indexOf("<body>"));
  });

  it("embeds the fonts it uses — Manrope 400/600/700 and Unbounded 700, Latin and Cyrillic — as data URLs", () => {
    const faces = [...built.css.matchAll(/@font-face\{font-family:"(\w+)";font-style:normal;font-display:block;font-weight:(\d+);src:url\(data:font\/woff2;base64,[A-Za-z0-9+/=]+\) format\("woff2"\);unicode-range:(U\+[^}]+)\}/g)];
    expect(faces.map((face) => `${face[1] ?? ""} ${face[2] ?? ""} ${(face[3] ?? "").includes("U+0400") ? "cyrillic" : "latin"}`)).toEqual([
      "Manrope 400 latin", "Manrope 400 cyrillic", "Manrope 600 latin", "Manrope 600 cyrillic", "Manrope 700 latin", "Manrope 700 cyrillic", "Unbounded 700 latin", "Unbounded 700 cyrillic",
    ]);
    // Every weight the stylesheets ask for is one of the embedded ones.
    const weights = new Set([...built.css.replace(/@font-face\{[^}]+\}/g, "").matchAll(/font-weight:(\d+)/g)].map((match) => match[1]));
    expect([...weights].filter((weight) => !["400", "600", "700"].includes(weight ?? ""))).toEqual([]);
  });

  it("names the licences of what it carries: in the header and in full at the end", () => {
    const header = built.html.slice(0, built.html.indexOf("<html"));
    for (const text of ["Manrope", "Unbounded", "SIL Open Font License", "Lucide", "ISC", "MIT"]) expect(header).toContain(text);
    const block = /<script type="text\/plain" id="qp-licences">([\s\S]*?)<\/script>/.exec(built.html)?.[1] ?? "";
    expect(block).toContain("The Manrope Project Authors");
    expect(block).toContain("The Unbounded Project Authors");
    expect(block).toContain("SIL OPEN FONT LICENSE Version 1.1");
    expect(block).toContain("ISC License");
    expect(block).toContain("Simeon");
  });

  it("is reproducible: a second build gives the same page", async () => {
    expect((await buildTemplate()).html).toBe(built.html);
  }, 60_000);

  it("stays inside its budget: at most 80 KB gzip without the fonts (SPEC AC11)", () => {
    const withoutFonts = built.html.replace(/url\(data:font\/woff2;base64,[A-Za-z0-9+/=]+\)/g, "url()");
    expect(gzipSync(withoutFonts).length / 1024).toBeLessThanOrEqual(80);
  });
});

describe("the stage's colours", () => {
  /** The `--quiz-stage-*` declarations of a stylesheet, as written. */
  function stageTokens(file: string): Record<string, string> {
    const css = readFileSync(file, "utf8");
    return Object.fromEntries([...css.matchAll(/^\s*(--quiz-stage-[\w-]+):\s*([^;]+);/gm)].map((match) => [match[1] ?? "", match[2] ?? ""]));
  }

  it("are the same in the exported page and in the creator, which must declare its own (mini-app token rule)", () => {
    const player = stageTokens(join(SRC, "render/tokens.css"));
    const creator = stageTokens(join(SRC, "../../miniapp/src/styles/tokens.css"));
    expect(Object.keys(player)).toHaveLength(16);
    expect(creator).toEqual(player);
  });

  it("follow the page's theme: every colour is a light and dark pair, and the stage pins none of its own (Moni 2026-11-27)", () => {
    const tokens = stageTokens(join(SRC, "render/tokens.css"));
    const derived = new Set(["--quiz-stage-ground", "--quiz-stage-lift"]);
    for (const [name, value] of Object.entries(tokens)) {
      if (!derived.has(name)) expect(value, name).toMatch(/^light-dark\(/);
    }
    expect(stageTokens(join(SRC, "styles/stage.css"))).toEqual({});
    expect(readFileSync(join(SRC, "styles/stage.css"), "utf8")).not.toContain("color-scheme");
  });
});
