// Tiny SVG builder for the special rounds' pictures (the vault): elements in the SVG namespace with
// string attributes. Like h.ts, text goes in as text nodes, never parsed as markup.

const NS = "http://www.w3.org/2000/svg";

/**
 * Creates an SVG element.
 * @param tag - the element name
 * @param attributes - its attributes; numbers are written as they are
 * @param children - nodes or text
 */
export function svg<K extends keyof SVGElementTagNameMap>(tag: K, attributes: Readonly<Record<string, string | number>> = {}, ...children: (Node | string)[]): SVGElementTagNameMap[K] {
  const element = document.createElementNS(NS, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value));
  element.append(...children);
  return element;
}

/**
 * A point on a circle, for drawing around a centre: angle 0 is straight up, clockwise.
 * @param cx - centre x
 * @param cy - centre y
 * @param radius - the circle's radius
 * @param degrees - the angle
 */
export function onCircle(cx: number, cy: number, radius: number, degrees: number): { readonly x: number; readonly y: number } {
  const rad = (degrees * Math.PI) / 180;
  return { x: Math.round((cx + radius * Math.sin(rad)) * 10) / 10, y: Math.round((cy - radius * Math.cos(rad)) * 10) / 10 };
}

let next = 0;

/**
 * An id no other drawing on the page has: a page shows many vaults at once (thumbnails), and their
 * gradients are found by id.
 * @param name - what the id is for
 */
export function uniqueId(name: string): string {
  next += 1;
  return `quiz-${name}-${String(next)}`;
}
