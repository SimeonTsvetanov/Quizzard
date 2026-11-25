// The colour behind a player's name (optional): a `#rrggbb` string, so every browser and the colour picker read it the same.

/** True when `value` is a colour a player may carry: `#` and six hex digits. */
export function isPlayerColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

/** Returns `color` in lower case, or null when it is not a `#rrggbb` colour. */
export function toPlayerColor(color: unknown): string | null {
  return isPlayerColor(color) ? color.toLowerCase() : null;
}
