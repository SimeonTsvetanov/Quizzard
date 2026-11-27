// The Safe's vault door, drawn in SVG by our own code (SPEC §10): a round steel door with its bolts and
// rivets, five lamps, a dial with the digits 0–9 under a red pointer, a handle and five code windows;
// behind it a vault of gold that shows when the door swings open. Every moving part is a CSS animation
// on these elements (rounds.css), so it plays in the exported page under its CSP and stands still with
// reduced motion. The drawing is 400 × 400 and scales with its box.
import { onCircle, svg, uniqueId } from "../svg.ts";

const C = 200;
const DOOR_R = 172;

/** How a code window or its lamp looks: `empty` (to come), `asked`, `current`, `set` (its digit shows), `setting` (it clicks in now). */
export type CodeState = "empty" | "asked" | "current" | "set" | "setting";

/** What the drawing shows. */
export interface VaultInput {
  /** One entry per digit of the code, in order. */
  readonly windows: readonly { readonly state: CodeState; readonly text: string }[];
  /** The dial's angle before this slide and on it, in degrees; `isTurning` = it turns from one to the other now. */
  readonly dial: { readonly from: number; readonly to: number; readonly isTurning: boolean };
  /** `opening` = it swings open now; `open` = it stands open. */
  readonly door: "closed" | "opening" | "open";
  /** The drawing's name for screen readers. */
  readonly label: string;
  /** The whole code is dialled on this one slide: the digits click in one after the other, then the door opens. */
  readonly whole?: boolean;
}

/** The gradients of one drawing, under ids of its own. */
function defs(id: (name: string) => string): SVGDefsElement {
  const stops = (...pairs: readonly (readonly [number, string])[]): SVGStopElement[] => pairs.map(([offset, color]) => svg("stop", { offset, "stop-color": color }));
  return svg("defs", {},
    svg("radialGradient", { id: id("door"), cx: "42%", cy: "36%", r: "75%" }, ...stops([0, "#a3acb6"], [0.55, "#5f6872"], [1, "#2b3138"])),
    svg("linearGradient", { id: id("steel"), x1: 0, x2: 1 }, ...stops([0, "#d3d9df"], [0.5, "#7d8792"], [1, "#3b434c"])),
    svg("linearGradient", { id: id("bolt"), x1: 0, y1: 0, x2: 0, y2: 1 }, ...stops([0, "#e3e7ea"], [0.5, "#8e98a2"], [1, "#454d56"])),
    svg("radialGradient", { id: id("brass"), cx: "35%", cy: "35%" }, ...stops([0, "#f6e2a8"], [0.6, "#c49638"], [1, "#6e4d12"])),
    svg("radialGradient", { id: id("dial"), cx: "40%", cy: "35%" }, ...stops([0, "#30373f"], [1, "#0d0f12"])),
    svg("linearGradient", { id: id("gold"), x1: 0, y1: 0, x2: 0, y2: 1 }, ...stops([0, "#fff1b0"], [0.45, "#f2c14e"], [1, "#a86f12"])),
    svg("radialGradient", { id: id("glow"), cx: "50%", cy: "55%", r: "60%" }, svg("stop", { offset: 0, "stop-color": "#ffd877", "stop-opacity": 0.8 }), svg("stop", { offset: 1, "stop-color": "#ffb43c", "stop-opacity": 0 })),
    svg("clipPath", { id: id("hole") }, svg("circle", { cx: C, cy: C, r: DOOR_R + 2 })));
}

/** A gold bar seen from the front: a trapezoid. */
function bar(x: number, y: number, fill: string): SVGPathElement {
  return svg("path", { d: `M${String(x)} ${String(y + 24)} L${String(x + 6)} ${String(y)} L${String(x + 38)} ${String(y)} L${String(x + 44)} ${String(y + 24)} Z`, fill, stroke: "#8a5a10", "stroke-width": 1.2 });
}

/** What is behind the door: the frame, the hinges, shelves of gold, its glow and a few sparkles. */
function inside(id: (name: string) => string): SVGSVGElement {
  const gold = `url(#${id("gold")})`;
  const shelves = [132, 210, 288].flatMap((y, shelf) => [
    svg("rect", { x: 24, y, width: 352, height: 9, fill: "#3b2b14" }),
    ...Array.from({ length: 7 - shelf }, (_, n) => bar(64 + shelf * 22 + n * 40, y - 25, gold)),
  ]);
  const sparks = [[98, 106], [196, 86], [262, 184], [150, 166], [300, 240], [222, 262]].map(([x = 0, y = 0], index) => {
    const spark = svg("path", { class: "quiz-vault-spark", d: `M${String(x)} ${String(y - 10)} L${String(x + 2.4)} ${String(y - 2.4)} L${String(x + 10)} ${String(y)} L${String(x + 2.4)} ${String(y + 2.4)} L${String(x)} ${String(y + 10)} L${String(x - 2.4)} ${String(y + 2.4)} L${String(x - 10)} ${String(y)} L${String(x - 2.4)} ${String(y - 2.4)} Z`, fill: "#fffbe6" });
    spark.style.setProperty("--quiz-i", String(index));
    return spark;
  });
  return svg("svg", { viewBox: "0 0 400 400", class: "quiz-vault-inside" }, defs(id),
    svg("rect", { x: 2, y: 104, width: 34, height: 56, rx: 6, fill: `url(#${id("steel")})`, stroke: "#15181c", "stroke-width": 2 }),
    svg("rect", { x: 2, y: 240, width: 34, height: 56, rx: 6, fill: `url(#${id("steel")})`, stroke: "#15181c", "stroke-width": 2 }),
    svg("circle", { cx: C, cy: C, r: 196, fill: "#20262d", stroke: "#0b0d10", "stroke-width": 3 }),
    svg("circle", { cx: C, cy: C, r: 188, fill: "none", stroke: "#3a424b", "stroke-width": 2 }),
    svg("g", { "clip-path": `url(#${id("hole")})` },
      svg("rect", { width: 400, height: 400, fill: "#17120a" }),
      svg("circle", { class: "quiz-vault-glow", cx: C, cy: C + 20, r: 190, fill: `url(#${id("glow")})` }),
      ...shelves, ...sparks),
    svg("circle", { cx: C, cy: C, r: DOOR_R + 2, fill: "none", stroke: "#0b0d10", "stroke-width": 4 }));
}

/** The dial: a black face with 50 ticks and the digits 0–9 printed around, turning about the centre. */
function dial(id: (name: string) => string, input: VaultInput["dial"]): SVGGElement {
  const ticks = Array.from({ length: 50 }, (_, tick) => {
    const isLong = tick % 5 === 0;
    const a = onCircle(C, C, 67, tick * 7.2);
    const b = onCircle(C, C, isLong ? 57 : 62, tick * 7.2);
    return svg("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: "#dfe3e8", "stroke-width": isLong ? 2.4 : 1.2 });
  });
  const digits = Array.from({ length: 10 }, (_, digit) => {
    const at = onCircle(C, C, 44, digit * 36);
    return svg("text", { x: at.x, y: at.y + 6.5, transform: `rotate(${String(digit * 36)} ${String(at.x)} ${String(at.y)})`, "text-anchor": "middle", class: "quiz-vault-dial-digit" }, String(digit));
  });
  const group = svg("g", { class: "quiz-vault-dial", ...(input.isTurning ? { "data-turning": "" } : {}) },
    svg("circle", { cx: C, cy: C, r: 72, fill: `url(#${id("dial")})`, stroke: "#c49638", "stroke-width": 4 }),
    ...ticks, ...digits,
    svg("circle", { cx: C, cy: C, r: 24, fill: `url(#${id("brass")})`, stroke: "#5a3d0c", "stroke-width": 2 }));
  group.style.setProperty("--quiz-from", `${String(input.from)}deg`);
  group.style.setProperty("--quiz-to", `${String(input.to)}deg`);
  return group;
}

/** The lamps on an arc above the dial and the code windows under it, one each per digit. */
function code(windows: VaultInput["windows"]): SVGGElement[] {
  const count = Math.max(1, windows.length);
  const span = Math.min(88, 22 * (count - 1));
  const gap = 7;
  const width = Math.min(30, (230 - gap * (count - 1)) / count);
  const start = C - (count * width + (count - 1) * gap) / 2;
  const lamps = windows.map((window, index) => {
    const at = onCircle(C, C, 122, count > 1 ? -span / 2 + (span * index) / (count - 1) : 0);
    const lamp = svg("circle", { class: "quiz-vault-lamp", "data-state": window.state, cx: at.x, cy: at.y, r: 10 });
    lamp.style.setProperty("--quiz-i", String(index));
    return lamp;
  });
  const boxes = windows.map((window, index) => {
    const x = start + index * (width + gap);
    const box = svg("g", { class: "quiz-vault-window", "data-state": window.state },
      svg("rect", { x, y: 290, width, height: 42, rx: 5 }),
      svg("text", { x: x + width / 2, y: 320, "text-anchor": "middle" }, window.text));
    box.style.setProperty("--quiz-i", String(index));
    return box;
  });
  return [svg("g", {}, ...lamps), svg("g", {}, ...boxes)];
}

/** The door: bolts, the steel disc with its rings and rivets, the dial with its pointer, the handle, the code. */
function door(id: (name: string) => string, input: VaultInput): SVGSVGElement {
  const bolts = Array.from({ length: 12 }, (_, n) => svg("g", { transform: `rotate(${String(15 + n * 30)} ${String(C)} ${String(C)})` },
    svg("rect", { class: "quiz-vault-bolt", x: 352, y: 191, width: 34, height: 18, rx: 6, fill: `url(#${id("bolt")})`, stroke: "#20252b", "stroke-width": 1.6 })));
  const rivets = Array.from({ length: 32 }, (_, n) => {
    const at = onCircle(C, C, 158, n * 11.25);
    return svg("circle", { cx: at.x, cy: at.y, r: 3.2, fill: "#c9d0d6", stroke: "#3b434c", "stroke-width": 1 });
  });
  const spokes = [0, 120, 240].map((angle) => svg("g", { transform: `rotate(${String(angle)} 318 200)` },
    svg("rect", { x: 315, y: 160, width: 6, height: 40, rx: 3, fill: `url(#${id("steel")})`, stroke: "#1b1f24" }),
    svg("circle", { cx: 318, cy: 158, r: 8, fill: `url(#${id("brass")})`, stroke: "#1b1f24" })));
  return svg("svg", { viewBox: "0 0 400 400" },
    ...bolts,
    svg("circle", { cx: C, cy: C, r: DOOR_R, fill: `url(#${id("door")})`, stroke: "#1a1e23", "stroke-width": 4 }),
    svg("circle", { cx: C, cy: C, r: 164, fill: "none", stroke: "#c3cad1", "stroke-opacity": 0.45, "stroke-width": 2 }),
    svg("circle", { cx: C, cy: C, r: 150, fill: "none", stroke: "#1d2227", "stroke-opacity": 0.55, "stroke-width": 3 }),
    ...rivets,
    svg("circle", { cx: C, cy: C, r: 98, fill: "#3f474f", stroke: "#1d2227", "stroke-width": 3 }),
    ...code(input.windows),
    dial(id, input.dial),
    svg("path", { d: `M${String(C - 9)} ${String(C - 92)} L${String(C + 9)} ${String(C - 92)} L${String(C)} ${String(C - 76)} Z`, fill: "#e8343a", stroke: "#5b0d10", "stroke-width": 1.5 }),
    svg("g", { class: "quiz-vault-handle" }, svg("circle", { cx: 318, cy: 200, r: 13, fill: `url(#${id("brass")})`, stroke: "#1b1f24", "stroke-width": 2 }), ...spokes));
}

/**
 * Draws the vault.
 * @param input - its code windows, its dial and its door
 */
export function vaultFigure(input: VaultInput): HTMLElement {
  const base = uniqueId("vault");
  const id = (name: string): string => `${base}-${name}`;
  const figure = document.createElement("div");
  figure.className = "quiz-vault";
  figure.setAttribute("role", "img");
  figure.setAttribute("aria-label", input.label);
  figure.setAttribute("data-door", input.door);
  if (input.whole === true) figure.setAttribute("data-whole", "");
  const hinge = document.createElement("div");
  hinge.className = "quiz-vault-door";
  hinge.append(door(id, input));
  figure.append(inside(id), hinge);
  return figure;
}
