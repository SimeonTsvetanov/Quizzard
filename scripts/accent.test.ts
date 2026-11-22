import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { accentCss, accentPairChecks, deriveAccent, deriveAccentPair, resolveAccent } from "./accent.ts";
import { contrast, displayable, hexToOklch, toRgb } from "./color-math.ts";

// TeamSync's mint, oklch(79.7% 0.164 159.7): the light accent whose focus ring was 1.62:1 (2026-11-08).
const MINT = "#3CDC97";

describe("deriveAccent", () => {
  it("mint: the focus ring is ≥ 3:1 on bg, surface and raised surface in both themes", () => {
    const tokens = deriveAccent(MINT);
    expect(tokens.focusContrast).toHaveLength(6);
    for (const { pair, ratio } of tokens.focusContrast) expect(ratio, pair).toBeGreaterThanOrEqual(3);
  });

  it("mint: light-mode focus is the darker accent-text colour, not the light accent", () => {
    const tokens = deriveAccent(MINT);
    expect(tokens.focus).toBe(tokens.text);
    const lightL = Number(/^light-dark\(oklch\(([\d.]+)%/.exec(tokens.focus)?.[1]);
    expect(lightL).toBeLessThanOrEqual(55); // light half darkened (mint is 79.7 %); dark half may stay mint
    expect(tokens.onAccent).toBe("oklch(21% 0.004 286)"); // dark text on mint
  });

  it("default blue keeps white text and a passing focus ring", () => {
    const tokens = deriveAccent("#0071E3");
    expect(tokens.onAccent).toBe("oklch(100% 0 0)");
    expect(Math.min(...tokens.focusContrast.map((c) => c.ratio))).toBeGreaterThanOrEqual(3);
  });

  it("rejects a malformed colour and one no text colour can sit on", () => {
    expect(() => deriveAccent("mint")).toThrow(/#RRGGBB/);
    expect(() => deriveAccent("#808080")).toThrow(/reaches 4.5:1/);
  });

  it("accentCss writes every token into the tokens layer", () => {
    const css = accentCss(deriveAccent(MINT));
    expect(css).toMatch(/^@layer tokens \{/);
    for (const name of ["--color-accent:", "--color-on-accent:", "--color-accent-pressed:", "--color-accent-text:", "--color-accent-tint:", "--color-focus:"]) expect(css).toContain(name);
  });

  it("vivid accents either pass every check or fail the build with a reason", () => {
    for (const hex of ["#FF0000", "#00FF00", "#0000FF", "#FFD60A", "#FF2D55"]) {
      try {
        const tokens = deriveAccent(hex);
        expect(Math.min(...tokens.focusContrast.map((c) => c.ratio)), hex).toBeGreaterThanOrEqual(3);
      } catch (e: unknown) {
        expect(String(e), hex).toMatch(/4\.5:1/);
      }
    }
  });
});

describe("displayable", () => {
  it("lowers chroma of an out-of-sRGB colour and keeps the in-gamut one as written", () => {
    const [, chroma] = displayable([0.5, 0.4, 140]);
    expect(chroma).toBeLessThan(0.4);
    expect(displayable([0.5, chroma, 140])).toEqual([0.5, chroma, 140]);
    expect(displayable([0.797, 0.164, 159.7])).toEqual([0.797, 0.164, 159.7]); // mint is inside sRGB
  });
});

// Quizzard's palette C · Emerald (DECISIONS 2026-11-22) and the rejected persimmon of option B.
const EMERALD = { light: "#00804F", dark: "#34D399" } as const;
const PERSIMMON = "#FF6B2C";
const ratioOf = (checks: readonly { pair: string; ratio: number }[], name: string): number => {
  const found = checks.find((c) => c.pair === name);
  if (!found) throw new Error(`no check "${name}" in ${checks.map((c) => c.pair).join(", ")}`);
  return found.ratio;
};

describe("deriveAccentPair", () => {
  it("emerald: every check passes in both themes, with the numbers of PALETTE-RESEARCH", () => {
    const checks = accentPairChecks(EMERALD);
    expect(checks).toHaveLength(16); // 2 on-accent + 3 backgrounds × (text, focus), per theme
    for (const { pair, ratio, min } of checks) expect(ratio, pair).toBeGreaterThanOrEqual(min);
    expect(ratioOf(checks, "light white --color-on-accent on --color-accent")).toBeCloseTo(5.0, 1);
    expect(ratioOf(checks, "light --color-accent-text on --color-bg")).toBeCloseTo(4.59, 1);
    expect(ratioOf(checks, "dark --color-accent-text on --color-bg")).toBeCloseTo(10.9, 0);
    expect(ratioOf(checks, "dark dark --color-on-accent on --color-accent")).toBeGreaterThanOrEqual(7);
    expect(ratioOf(checks, "dark --color-accent-text on --color-surface-raised")).toBeGreaterThanOrEqual(4.5);
  });

  it("emerald: white text in the light theme, near-black in the dark one; the colours are used as written", () => {
    const tokens = deriveAccentPair(EMERALD);
    expect(tokens.onAccent).toBe("light-dark(oklch(100% 0 0), oklch(21% 0.004 286))");
    expect(tokens.accent).toBe("light-dark(oklch(52.8% 0.123 158.1), oklch(77.3% 0.153 163.2))");
    expect(tokens.text).toBe(tokens.accent);
    expect(tokens.focus).toBe(tokens.accent);
    expect(tokens.focusContrast).toHaveLength(6);
    for (const { pair, ratio } of tokens.focusContrast) expect(ratio, pair).toBeGreaterThanOrEqual(3);
  });

  it("persimmon: white text is 2.84:1, so dark text is picked — and as link text on the light page it fails (2.61:1)", () => {
    expect(contrast([1, 1, 1], toRgb(displayable(hexToOklch(PERSIMMON))))).toBeCloseTo(2.84, 1);
    const checks = accentPairChecks({ light: PERSIMMON, dark: PERSIMMON });
    expect(ratioOf(checks, "light dark --color-on-accent on --color-accent")).toBeGreaterThanOrEqual(4.5);
    expect(() => deriveAccentPair({ light: PERSIMMON, dark: PERSIMMON })).toThrow(/light --color-accent-text on --color-bg 2\.6\d:1 \(needs 4\.5:1\)/);
  });

  it("a light accent in the dark theme fails as text on the dark surfaces and names the theme", () => {
    expect(() => deriveAccentPair({ light: EMERALD.light, dark: EMERALD.light })).toThrow(/^Accent pair #00804F \/ #00804F fails WCAG 2\.2 AA: dark --color-accent-text on --color-bg/);
  });

  it("rejects a malformed half", () => {
    expect(() => deriveAccentPair({ light: "green", dark: EMERALD.dark })).toThrow(/accent\.light must be #RRGGBB/);
    expect(() => deriveAccentPair({ light: EMERALD.light, dark: "#34D39" })).toThrow(/accent\.dark must be #RRGGBB/);
  });

  it("any pair either passes every check or fails with the list of misses", () => {
    const hex = fc.integer({ min: 0, max: 0xffffff }).map((n) => `#${n.toString(16).padStart(6, "0")}`);
    fc.assert(
      fc.property(hex, hex, (light, dark) => {
        try {
          deriveAccentPair({ light, dark });
          return accentPairChecks({ light, dark }).every((c) => c.ratio >= c.min);
        } catch (e: unknown) {
          return e instanceof Error && /fails WCAG 2\.2 AA: .+:1 \(needs [\d.]+:1\)/.test(e.message);
        }
      }),
    );
  });
});

describe("resolveAccent", () => {
  it("derives from one hex and checks an explicit pair", () => {
    expect(resolveAccent(MINT)).toEqual(deriveAccent(MINT));
    expect(resolveAccent(EMERALD)).toEqual(deriveAccentPair(EMERALD));
  });
});
