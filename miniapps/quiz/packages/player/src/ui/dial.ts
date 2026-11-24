// The timer dial: a ring that empties and the seconds left in its middle. Drawn once; `update`
// moves it (the ring through a style property, so the stylesheet can ease between two ticks).
import type { Timer } from "../game/state.ts";
import type { Translate } from "../i18n/translate.ts";
import { h } from "../render/h.ts";

const SVG = "http://www.w3.org/2000/svg";
const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** From this many seconds the dial turns to its warning colour. */
const LOW_SECONDS = 5;

/** A dial and how to move it. */
export interface Dial {
  readonly element: HTMLElement;
  update(timer: Timer): void;
}

function ring(name: string): SVGCircleElement {
  const circle = document.createElementNS(SVG, "circle");
  circle.setAttribute("class", name);
  circle.setAttribute("cx", "50");
  circle.setAttribute("cy", "50");
  circle.setAttribute("r", String(RADIUS));
  return circle;
}

/**
 * Creates a dial.
 * @param t - the translator, for the dial's name
 */
export function createDial(t: Translate): Dial {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("aria-hidden", "true");
  const progress = ring("qp-dial-progress");
  progress.style.strokeDasharray = String(CIRCUMFERENCE);
  svg.append(ring("qp-dial-track"), progress);
  const number = h("span", { class: "qp-dial-number", "aria-hidden": "true" });
  const element = h("span", { class: "qp-dial", role: "timer", "data-dial": "" }, number);
  element.prepend(svg);
  let shown = -1;
  return {
    element,
    update(timer) {
      const seconds = Math.ceil(timer.leftMs / 1000);
      const share = timer.totalMs > 0 ? timer.leftMs / timer.totalMs : 0;
      progress.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - share));
      element.setAttribute("data-status", timer.status);
      element.toggleAttribute("data-low", seconds <= LOW_SECONDS && timer.status !== "idle");
      if (seconds === shown) return;
      shown = seconds;
      number.textContent = String(seconds);
      element.setAttribute("aria-label", t("stage.timer", { n: seconds }));
    },
  };
}
