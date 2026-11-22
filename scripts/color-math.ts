// Colour math for the accent build step (scripts/accent.ts): #RRGGBB ↔ OKLCH ↔ sRGB, gamut fitting and the
// WCAG 2.2 contrast ratio. Split out of the forge template's accent.ts unchanged (PLAN T-03).

/** An sRGB colour, each channel 0–1. */
export type Rgb = readonly [number, number, number];
/** An OKLCH colour: [lightness 0–1, chroma, hue in degrees]. */
export type Oklch = readonly [number, number, number];

const lin = (c: number): number => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const delin = (c: number): number => Math.min(1, Math.max(0, c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055));

/** Converts #RRGGBB to OKLCH [L 0–1, C, H degrees]. */
export function hexToOklch(hex: string): Oklch {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255)) as [number, number, number]; // because map keeps the length 3
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [lightness, Math.hypot(a, bb), ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360];
}

/** Converts OKLCH to linear sRGB, unclipped (values outside 0–1 = outside the sRGB gamut). */
function toLinear([lightness, chroma, hue]: Oklch): Rgb {
  const a = chroma * Math.cos((hue * Math.PI) / 180);
  const b = chroma * Math.sin((hue * Math.PI) / 180);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}

/** Converts OKLCH to sRGB (0–1); callers pass displayable() colours, so nothing is clipped. */
export function toRgb(v: Oklch): Rgb {
  const [r, g, b] = toLinear(v);
  return [delin(r), delin(g), delin(b)];
}

/**
 * Returns the colour exactly as it will be written (fmt precision) with the chroma lowered until
 * it is inside sRGB — so the contrast measured here is the contrast the browser paints.
 */
export function displayable([lightness, chroma, hue]: Oklch): Oklch {
  const v: [number, number, number] = [Math.round(lightness * 1000) / 1000, Math.round(chroma * 1000) / 1000, Math.round(hue * 10) / 10];
  const isInside = (c: Oklch): boolean => toLinear(c).every((x) => x >= -1e-4 && x <= 1 + 1e-4);
  while (!isInside(v) && v[1] > 0) v[1] = Math.max(0, Math.round((v[1] - 0.001) * 1000) / 1000);
  return v;
}

/** Returns the WCAG 2.2 contrast ratio of two sRGB colours. */
export function contrast(x: Rgb, y: Rgb): number {
  const lum = (c: Rgb): number => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const [a, b] = [lum(x), lum(y)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Writes an OKLCH colour as CSS `oklch(L% C H)` at the precision displayable() rounds to; `alpha` like " / 0.1". */
export const formatOklch = (v: Oklch, alpha = ""): string => `oklch(${(v[0] * 100).toFixed(1)}% ${v[1].toFixed(3)} ${v[2].toFixed(1)}${alpha})`;
