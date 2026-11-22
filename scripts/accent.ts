// Per-app accent colours (design → design-system §3, accessibility §2): derives the accent
// token set from app.config.accent and refuses colours that fail WCAG. Used by scripts/generate.ts.
// Quizzard addition (PLAN T-03): besides one hex, an explicit light/dark pair that is checked, not derived.

import { contrast, displayable, formatOklch as fmt, hexToOklch, toRgb, type Oklch, type Rgb } from "./color-math.ts";

/** The generated accent tokens, each as a `light-dark()` pair of oklch() strings. */
export interface AccentTokens {
  readonly accent: string;
  readonly onAccent: string;
  readonly pressed: string;
  readonly text: string;
  readonly tint: string;
  readonly focus: string;
  /** Focus ring contrast against every background it sits on (1.4.11 needs ≥ 3:1). */
  readonly focusContrast: readonly { readonly pair: string; readonly ratio: number }[];
}

// The hardest backgrounds for accent text: light --color-bg #F5F5F7, dark --color-surface-raised #2C2C2E.
const HARDEST_LIGHT: Rgb = [0.961, 0.961, 0.969];
const HARDEST_DARK: Rgb = [0.173, 0.173, 0.18];
// The template's backgrounds (design/tokens.css): bg, surface, surface-raised per theme.
const BACKGROUNDS: readonly { readonly name: string; readonly light: Rgb; readonly dark: Rgb }[] = [
  { name: "--color-bg", light: HARDEST_LIGHT, dark: [0, 0, 0] }, // #F5F5F7 / #000000
  { name: "--color-surface", light: [1, 1, 1], dark: [0.11, 0.11, 0.118] }, // #FFFFFF / #1C1C1E
  { name: "--color-surface-raised", light: [1, 1, 1], dark: HARDEST_DARK }, // #FFFFFF / #2C2C2E
];
const WHITE: Rgb = [1, 1, 1];
const INK: Rgb = [0.114, 0.114, 0.122]; // #1D1D1F ≈ oklch(21% 0.004 286), written as --color-on-accent
const WHITE_CSS = "oklch(100% 0 0)";
const INK_CSS = "oklch(21% 0.004 286)";
const TEXT_MIN = 4.5;
const FOCUS_MIN = 3;
const HEX = /^#[0-9a-fA-F]{6}$/;

const pair = (light: string, dark: string): string => `light-dark(${light}, ${dark})`;

/**
 * Derives the accent token set from a #RRGGBB accent: text on it, pressed state, accent as text
 * (≥ 4.5:1) and the focus ring (≥ 3:1 on every background, both themes).
 * @throws {@link Error} when the colour is not #RRGGBB, no text colour reaches 4.5:1 on it or on
 * its pressed shade, accent text misses 4.5:1, or the focus ring misses 3:1 (accessibility §2).
 */
export function deriveAccent(hex: string): AccentTokens {
  if (!HEX.test(hex)) throw new Error(`app.config.accent must be #RRGGBB, got ${hex}`);
  const base = displayable(hexToOklch(hex));
  const onWhite = contrast(toRgb(base), WHITE);
  const onInk = contrast(toRgb(base), INK);
  if (onWhite < 4.5 && onInk < 4.5) throw new Error(`Accent ${hex}: neither white (${onWhite.toFixed(2)}:1) nor dark text (${onInk.toFixed(2)}:1) reaches 4.5:1. Pick a lighter or darker accent.`);
  const onAccent = onWhite >= 4.5 ? WHITE : INK;
  const pressed = displayable([base[0] - 0.04, base[1], base[2]]);
  const onPressed = contrast(toRgb(pressed), onAccent);
  if (onPressed < 4.5) throw new Error(`Accent ${hex}: text on the pressed accent is ${onPressed.toFixed(2)}:1 (needs 4.5:1). Pick a lighter or darker accent.`);
  // Accent as TEXT: darken / lighten the same hue until it passes 4.5:1 on the hardest background.
  let textLight = displayable([Math.min(base[0], 0.52), base[1], base[2]]);
  while (contrast(toRgb(textLight), HARDEST_LIGHT) < 4.5 && textLight[0] > 0.2) textLight = displayable([textLight[0] - 0.01, base[1], base[2]]);
  let textDark = displayable([Math.max(base[0], 0.68), base[1], base[2]]);
  while (contrast(toRgb(textDark), HARDEST_DARK) < 4.5 && textDark[0] < 0.95) textDark = displayable([textDark[0] + 0.01, base[1], base[2]]);
  const textContrast = [contrast(toRgb(textLight), HARDEST_LIGHT), contrast(toRgb(textDark), HARDEST_DARK)];
  if (textContrast.some((r) => r < 4.5)) throw new Error(`Accent ${hex}: accent text reaches only ${textContrast.map((r) => r.toFixed(2)).join(" / ")}:1 (light / dark; needs 4.5:1).`);
  // Focus = accent-text in both themes: a light accent (mint, yellow) is < 3:1 on light surfaces.
  const focusContrast = BACKGROUNDS.flatMap((bg) => [
    { pair: `light --color-focus on ${bg.name}`, ratio: contrast(toRgb(textLight), bg.light) },
    { pair: `dark --color-focus on ${bg.name}`, ratio: contrast(toRgb(textDark), bg.dark) },
  ]);
  const weak = focusContrast.filter((c) => c.ratio < FOCUS_MIN);
  if (weak.length) throw new Error(`Accent ${hex}: focus ring below ${String(FOCUS_MIN)}:1 — ${weak.map((c) => `${c.pair} ${c.ratio.toFixed(2)}:1`).join(", ")}`);
  return {
    accent: pair(fmt(base), fmt(base)),
    onAccent: onAccent === WHITE ? WHITE_CSS : INK_CSS,
    pressed: pair(fmt(pressed), fmt(pressed)),
    text: pair(fmt(textLight), fmt(textDark)),
    tint: pair(fmt(base, " / 0.1"), fmt(textDark, " / 0.16")),
    focus: pair(fmt(textLight), fmt(textDark)),
    focusContrast,
  };
}

/** An explicit accent per theme: `light` is painted in the light theme, `dark` in the dark one. */
export interface AccentPair {
  readonly light: string;
  readonly dark: string;
}

/** app.config.accent: one #RRGGBB (both themes derived from it) or an explicit {@link AccentPair}. */
export type AccentConfig = string | AccentPair;

/** One measured contrast of the accent set and the WCAG 2.2 AA minimum it must reach. */
export interface ContrastCheck {
  readonly pair: string;
  readonly ratio: number;
  readonly min: number;
}

type Theme = "light" | "dark";

interface ThemeAccent {
  readonly base: Oklch;
  readonly onAccent: Rgb;
  readonly pressed: Oklch;
  readonly checks: readonly ContrastCheck[];
}

/**
 * Measures one theme's half of a pair. The colour is used as written for the fill, the text/link
 * colour and the focus ring (Moni picked exact colours), so it is only checked, never adjusted.
 */
function measureTheme(theme: Theme, hex: string): ThemeAccent {
  if (!HEX.test(hex)) throw new Error(`app.config.accent.${theme} must be #RRGGBB, got ${hex}`);
  const base = displayable(hexToOklch(hex));
  const fill = toRgb(base);
  const onAccent = contrast(fill, WHITE) >= TEXT_MIN ? WHITE : INK;
  const pressed = displayable([base[0] - 0.04, base[1], base[2]]);
  const textName = onAccent === WHITE ? "white" : "dark";
  const checks: ContrastCheck[] = [
    { pair: `${theme} ${textName} --color-on-accent on --color-accent`, ratio: contrast(onAccent, fill), min: TEXT_MIN },
    { pair: `${theme} ${textName} --color-on-accent on --color-accent-pressed`, ratio: contrast(onAccent, toRgb(pressed)), min: TEXT_MIN },
    ...BACKGROUNDS.flatMap((bg) => [
      { pair: `${theme} --color-accent-text on ${bg.name}`, ratio: contrast(fill, bg[theme]), min: TEXT_MIN },
      { pair: `${theme} --color-focus on ${bg.name}`, ratio: contrast(fill, bg[theme]), min: FOCUS_MIN },
    ]),
  ];
  return { base, onAccent, pressed, checks };
}

/**
 * Returns every contrast an explicit pair must pass, both themes: text on the accent and on its
 * pressed shade (4.5:1), the accent as text on bg, surface and raised surface (4.5:1) and as the
 * focus ring there (3:1, WCAG 1.4.11).
 * @throws {@link Error} when a colour is not #RRGGBB.
 */
export function accentPairChecks(accent: AccentPair): readonly ContrastCheck[] {
  return [...measureTheme("light", accent.light).checks, ...measureTheme("dark", accent.dark).checks];
}

/**
 * Builds the accent token set from an explicit light/dark pair; the text on each half is white
 * when it reaches 4.5:1, else near-black.
 * @throws {@link Error} listing every failed check of {@link accentPairChecks} — generate stops.
 */
export function deriveAccentPair(accent: AccentPair): AccentTokens {
  const light = measureTheme("light", accent.light);
  const dark = measureTheme("dark", accent.dark);
  const checks = [...light.checks, ...dark.checks];
  const failed = checks.filter((c) => c.ratio < c.min);
  if (failed.length) {
    const list = failed.map((c) => `${c.pair} ${c.ratio.toFixed(2)}:1 (needs ${String(c.min)}:1)`).join(", ");
    throw new Error(`Accent pair ${accent.light} / ${accent.dark} fails WCAG 2.2 AA: ${list}. Darken the light accent or lighten the dark one.`);
  }
  const textCss = (rgb: Rgb): string => (rgb === WHITE ? WHITE_CSS : INK_CSS);
  return {
    accent: pair(fmt(light.base), fmt(dark.base)),
    onAccent: pair(textCss(light.onAccent), textCss(dark.onAccent)),
    pressed: pair(fmt(light.pressed), fmt(dark.pressed)),
    text: pair(fmt(light.base), fmt(dark.base)),
    tint: pair(fmt(light.base, " / 0.1"), fmt(dark.base, " / 0.16")),
    focus: pair(fmt(light.base), fmt(dark.base)),
    focusContrast: checks.filter((c) => c.pair.includes("--color-focus")).map(({ pair: name, ratio }) => ({ pair: name, ratio })),
  };
}

/** Returns the accent token set for app.config.accent, a single hex or an explicit pair. */
export function resolveAccent(accent: AccentConfig): AccentTokens {
  return typeof accent === "string" ? deriveAccent(accent) : deriveAccentPair(accent);
}

/** Returns the generated accent.css (same `tokens` layer as design/tokens.css, loaded after it). */
export function accentCss(tokens: AccentTokens): string {
  return `@layer tokens {\n  :root {\n    --color-accent: ${tokens.accent};\n    --color-on-accent: ${tokens.onAccent};\n    --color-accent-pressed: ${tokens.pressed};\n    --color-accent-text: ${tokens.text};\n    --color-accent-tint: ${tokens.tint};\n    --color-focus: ${tokens.focus};\n  }\n}\n`;
}
