// The scene's DOM (styles/components/scene.css), without imports: the app uses it through ui/scene.ts, and
// scripts/generate.ts turns this file into public/scene.js for the static pages (policies, 404), so every page
// has the same sky. Keep it free of imports and of anything but plain DOM.

/** Square side of one star tile, in px; a tile and its copy right below it scroll up by exactly this much. */
const FIELD = 2000;
/** Wider than tall: a wide screen shows no empty band at the right. */
const FIELD_WIDTH = 2600;
/** Star counts per layer (small, medium, big): the classic pen's density on a wider field. */
const STARS = [800, 240, 110] as const;


/** A small seeded random generator: the sky is the same on every visit (and in screenshots). */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** One layer's stars as a box-shadow list (each shadow of a 1px dot is a star). */
function stars(count: number, random: () => number): string {
  return Array.from(
    { length: count },
    () =>
      `${String(Math.round(random() * FIELD_WIDTH))}px ${String(Math.round(random() * FIELD))}px`,
  ).join(", ");
}

const SVG = "http://www.w3.org/2000/svg";

/** Three ranges of soft, rounded mountains, back to front. */
function mountains(): SVGSVGElement {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("class", "scene-mountains");
  svg.setAttribute("viewBox", "0 0 1440 360");
  svg.setAttribute("preserveAspectRatio", "xMidYMax slice");
  const ranges = [
    "M0 230 C120 170 210 150 330 190 C430 222 500 120 640 110 C780 100 850 200 960 196 C1080 190 1150 130 1270 140 C1350 146 1400 170 1440 180 V360 H0Z",
    "M0 270 C140 232 240 210 360 236 C480 262 560 190 700 186 C840 182 900 250 1040 252 C1170 254 1260 210 1440 226 V360 H0Z",
    "M0 310 C160 284 300 280 430 296 C560 312 680 270 820 272 C980 274 1080 312 1220 306 C1320 302 1390 290 1440 294 V360 H0Z",
  ];
  ranges.forEach((d, index) => {
    const path = document.createElementNS(SVG, "path");
    path.setAttribute("d", d);
    path.setAttribute("class", `scene-range scene-range--${String(index + 1)}`);
    svg.append(path);
  });
  return svg;
}

const div = (className: string): HTMLDivElement => {
  const element = document.createElement("div");
  element.className = className;
  return element;
};

/** Builds the scene once, behind everything (the CSS shows it only while the choice is "scene"). */
export function buildScene(): HTMLElement {
  const scene = div("scene");
  scene.setAttribute("aria-hidden", "true");
  const night = div("scene-night");
  const random = seeded(20261123);
  STARS.forEach((count, index) => {
    const layer = div(`scene-stars scene-stars--${String(index + 1)}`);
    // A custom property, so the layer's ::after (the copy below it) draws the same stars.
    layer.style.setProperty("--scene-stars", stars(count, random));
    night.append(layer);
  });
  const day = div("scene-day");
  // The beams fall over the mountains too (lighter, never darker): they reach the bottom of the screen.
  day.append(mountains(), div("scene-rays"), div("scene-sun"));
  scene.append(night, day);
  document.body.prepend(scene);
  return scene;
}
