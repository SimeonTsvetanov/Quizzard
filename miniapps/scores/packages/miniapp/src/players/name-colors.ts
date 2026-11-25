// The colours offered for a player's name field: the meeple colours of Carcassonne (base game: blue, red,
// green, yellow, black; pink and grey from the expansions). Any other colour comes from the custom picker.
// `ink` is the text colour on top: whichever of dark and light has the higher contrast (WCAG 1.4.3).

/** One offered colour: `id` names it in the i18n keys (`app.color.<id>`). */
export interface MeepleColor {
  readonly id: "red" | "blue" | "yellow" | "green" | "black" | "pink" | "grey";
  readonly value: string;
}

export const MEEPLE_COLORS: readonly MeepleColor[] = [
  { id: "red", value: "#d62828" },
  { id: "blue", value: "#1d5fd0" },
  { id: "yellow", value: "#f5c400" },
  { id: "green", value: "#2a9d3f" },
  { id: "black", value: "#1c1c1e" },
  { id: "pink", value: "#f06fa8" },
  { id: "grey", value: "#8e8e93" },
];

const DARK_INK = "#111111";
const LIGHT_INK = "#ffffff";

/** Returns the WCAG relative luminance (0–1) of a `#rrggbb` colour. */
function luminance(color: string): number {
  const channel = (start: number): number => {
    const value = Number.parseInt(color.slice(start, start + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** Returns the text colour to use on `color` (`#rrggbb`): dark or light, whichever contrasts more. */
export function inkOn(color: string): string {
  const light = luminance(color);
  const onDark = (light + 0.05) / (luminance(DARK_INK) + 0.05);
  const onLight = 1.05 / (light + 0.05);
  return onDark >= onLight ? DARK_INK : LIGHT_INK;
}

/** Returns the attributes that paint a name field in `color`; none when the player has no colour (field.css). */
export function nameColorProps(color: string | null | undefined): { "data-colored"?: ""; style?: React.CSSProperties } {
  if (color === null || color === undefined) return {};
  return { "data-colored": "", style: { "--name-fill": color, "--name-ink": inkOn(color) } as React.CSSProperties };
}
