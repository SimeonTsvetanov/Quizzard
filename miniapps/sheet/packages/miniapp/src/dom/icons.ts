// The body's Lucide icons (ISC): inline SVG, 20 px, stroke 1.75 (2.25 for the two marks, which are
// read at a glance), currentColor, aria-hidden. Only the marks the sheet shows are bundled.
import { Check, Eraser, Plus, Trash2, X, createElement, type IconNode } from "lucide";

const ICONS = { check: Check, eraser: Eraser, plus: Plus, trash: Trash2, x: X } satisfies Record<string, IconNode>;

/** A mark the body can draw. */
export type IconName = keyof typeof ICONS;

/** Returns a 20 px SVG element of the icon. */
export function icon(name: IconName): SVGElement {
  const isMark = name === "check" || name === "x";
  return createElement(ICONS[name], { width: 20, height: 20, "stroke-width": isMark ? 2.25 : 1.75, "aria-hidden": "true" });
}
