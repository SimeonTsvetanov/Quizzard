// E2E fixture (e2e build only): the markup of the "isolated" CSS probe, shown by the routing probe
// for `#/probe?css=isolated` (probe-miniapp.ts). Importing the stylesheet here makes Vite load it as a
// `<link>` with this lazy chunk — the way a real mini-app's CSS arrives (tests/e2e/css-layers.spec.ts).
import "./css-probe.css";

/** Elements the spec reads, by their `data-css-probe` value. */
const PARTS = [
  // A shell component class inside the isolated scope: must look like a plain browser button.
  { tag: "button", part: "shell-class", className: "button", text: "Shell class" },
  { tag: "button", part: "plain", className: "", text: "Plain" },
  { tag: "p", part: "card", className: "css-probe-card", text: "Accent card" },
  { tag: "p", part: "order", className: "css-probe-order", text: "Layer order" },
  { tag: "p", part: "hidden", className: "", text: "Hidden" },
  { tag: "input", part: "focus", className: "", text: "" },
] as const;

/**
 * Renders the CSS probe into the mount element.
 * @param element - the `[data-miniapp="probe"]` element
 * @returns a function that removes what it rendered
 */
export function renderCssProbe(element: HTMLElement): () => void {
  const section = document.createElement("section");
  section.className = "css-probe";
  for (const { tag, part, className, text } of PARTS) {
    const node = document.createElement(tag);
    node.dataset["cssProbe"] = part;
    if (className !== "") node.className = className;
    if (node instanceof HTMLButtonElement) node.type = "button";
    if (node instanceof HTMLInputElement) node.setAttribute("aria-label", "Focus probe");
    node.textContent = text;
    node.hidden = part === "hidden";
    section.append(node);
  }
  section.append(iconInShellToast());
  element.append(section);
  return () => { section.remove(); };
}

const SVG = "http://www.w3.org/2000/svg";

/**
 * A lucide-style icon (styled by its attributes) inside the shell's `.toast` class, whose rule
 * `.toast > svg` colours icons red: the icon keeps its attributes and loses the shell's colour.
 */
function iconInShellToast(): HTMLElement {
  const toast = document.createElement("p");
  toast.className = "toast";
  toast.dataset["cssProbe"] = "toast";
  const icon = document.createElementNS(SVG, "svg");
  for (const [name, value] of Object.entries({ width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "3" })) {
    icon.setAttribute(name, value);
  }
  icon.dataset["cssProbe"] = "icon";
  const circle = document.createElementNS(SVG, "circle");
  for (const [name, value] of Object.entries({ cx: "12", cy: "12", r: "9" })) circle.setAttribute(name, value);
  circle.dataset["cssProbe"] = "circle";
  icon.append(circle);
  toast.append(icon);
  return toast;
}
