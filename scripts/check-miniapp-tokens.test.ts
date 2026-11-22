// Unit tests for scripts/check-miniapp-tokens.ts and scripts/css-colors.ts (PLAN T-09): undefined
// tokens, literal colours, forbidden imports and fonts, !important — and what the real TeamSync input
// (app/build/__fixtures__/teams-stepper.css) gets: nothing.
import { readFileSync } from "node:fs";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { checkMiniAppCss, formatFinding, shellTokens, type TokenFindingCode } from "./check-miniapp-tokens.ts";
import { findLiteralColor } from "./css-colors.ts";

const TOKENS = shellTokens([":root { --color-accent: oklch(50% 0.1 150); --space-1: 0.25rem; }", "@layer tokens { :root { --color-text: black; } }"]);

const codes = (css: string): TokenFindingCode[] => checkMiniAppCss([{ path: "m.css", css }], TOKENS).map((finding) => finding.code);

describe("shellTokens", () => {
  it("collects the custom properties of every sheet, inside layers too", () => {
    expect([...TOKENS].sort()).toEqual(["--color-accent", "--color-text", "--space-1"]);
  });
});

describe("checkMiniAppCss", () => {
  it("passes tokens of the shell and of the mini-app itself (any file, any rule, @property)", () => {
    const files = [
      { path: "a.css", css: ":root { --text-score: 3rem; } .a { --a-gap: var(--space-1); }" },
      { path: "b.css", css: "@property --tw-shadow { syntax: '*'; inherits: false; initial-value: 0 0 #0000; } .b { font-size: var(--text-score); gap: var(--a-gap); color: var(--color-accent); box-shadow: var(--tw-shadow); }" },
    ];
    expect(checkMiniAppCss(files, TOKENS)).toEqual([]);
  });

  it("flags a var() nobody defines, with file and line", () => {
    const [finding] = checkMiniAppCss([{ path: "m.css", css: ".a {\n  z-index: var(--z-modal);\n}" }], TOKENS);
    expect(finding && formatFinding(finding)).toBe("m.css:2 UNDEFINED_TOKEN var(--z-modal) is defined neither by Quizzard's tokens nor by the mini-app");
  });

  it("does not count Tailwind @theme variables as defined (Tailwind emits none with `reference`)", () => {
    expect(codes("@theme inline reference { --spacing: var(--space-1); } .a { margin: var(--spacing); }")).toEqual(["UNDEFINED_TOKEN"]);
  });

  it.each([
    [".a { color: #fff; }"],
    [".a { background: rgb(0 0 0 / 50%); }"],
    [".a { box-shadow: 0 0 0 1px oklch(50% 0.1 150); }"],
    [".a { border: 1px solid red; }"],
    [".a { --button-bg: white; }"],
    [".a { color: color-mix(in oklch, var(--color-accent), black); }"],
    ["@media (width > 1px) { :root { color: hsl(0 0% 0%); } }"],
  ])("flags a literal colour: %s", (css) => {
    expect(codes(css)).toEqual(["LITERAL_COLOR"]);
  });

  it.each([
    [":root { --brand: #00804f; }"],
    [":root, :host { --brand: oklch(50% 0.1 150); }"],
    ['@media (prefers-contrast: more) { :root[data-theme="dark"] { --brand: white; } }'],
    [".a { color: transparent; border-color: currentColor; background: inherit; }"],
    ["@media (forced-colors: active) { .a { border: 1px solid CanvasText; } }"],
    [".a { background: url(#grad) no-repeat; content: 'red #fff'; }"],
    [".a { grid-area: tan; transition: color 0.2s; }"],
  ])("allows root tokens, keywords, system colours, strings and non-colour words: %s", (css) => {
    expect(codes(css)).toEqual([]);
  });

  it.each([
    ['@import "../design/tokens.css";'],
    ['@import "../generated/accent.css";'],
    ['@import "./fonts.css";'],
    ['@import "@fontsource-variable/inter";'],
  ])("flags an import of tokens, accent or fonts: %s", (css) => {
    expect(codes(css)).toEqual(["FORBIDDEN_IMPORT"]);
  });

  it("allows other imports (Tailwind preflight) and flags @font-face", () => {
    expect(codes('@import "tailwindcss/preflight.css" layer(base);')).toEqual([]);
    expect(codes("@font-face { font-family: X; src: url(x.woff2); }")).toEqual(["FONT_FACE"]);
  });

  it("flags !important except inside a prefers-reduced-motion block", () => {
    expect(codes(".a { display: none !important; }")).toEqual(["IMPORTANT"]);
    expect(codes("@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; } }")).toEqual([]);
  });

  it("passes the real TeamSync stepper stylesheet", () => {
    const css = readFileSync(new URL("../app/build/__fixtures__/teams-stepper.css", import.meta.url), "utf8");
    const tokens = shellTokens([readFileSync(new URL("../design/tokens.css", import.meta.url), "utf8")]);
    expect(checkMiniAppCss([{ path: "teams-stepper.css", css }], tokens)).toEqual([]);
  });
});

describe("findLiteralColor", () => {
  it("returns the literal as written", () => {
    expect(findLiteralColor("color", "#ABCDEF")).toBe("#ABCDEF");
    expect(findLiteralColor("background", "linear-gradient(red, var(--a))")).toBe("red");
    expect(findLiteralColor("width", "calc(100% - 2px)")).toBeNull();
  });

  it("property: never throws and only reports text that is in the value", () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (property, value) => {
        const literal = findLiteralColor(property, value);
        expect(literal === null || value.toLowerCase().includes(literal.toLowerCase())).toBe(true);
      }),
    );
  });
});
