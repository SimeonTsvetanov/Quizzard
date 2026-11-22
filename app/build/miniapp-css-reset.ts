// The isolation layer of an "isolated" mini-app (PLAN §1.3 point 4, miniapp-css.ts): the first sub-layer
// of `miniapp.<id>`, so no shell rule (`.button`, `.card`, base element styles …) styles the mini-app's
// elements, while the mini-app's own later sub-layers still win and the tokens still inherit.
import postcss, { type AtRule, type Declaration } from "postcss";
import { scopeSelector } from "./miniapp-css-selectors.ts";

/** The isolated mode's first sub-layer; a mini-app's own layers must not use the name. */
export const RESET_LAYER = "reset";

/**
 * Elements whose HTML/SVG attributes are styles: `fill`, `stroke-width`, `width`, `height` … count as
 * author-level "presentational hints", so `all: revert` would drop them too (lucide icons would lose
 * their stroke, images their size). These keep their attributes and only lose what shell rules around
 * them may set — see {@link HINT_SAFE_PROPERTIES}.
 */
const ATTRIBUTE_STYLED = "svg, svg *, [width], [height]";

/**
 * Properties no presentational hint sets, reverted on {@link ATTRIBUTE_STYLED} elements; what the shell
 * sets on `svg`/`img` inside its components today (color, flex, margin, animation) is among them.
 */
const HINT_SAFE_PROPERTIES = [
  "margin", "padding", "border", "border-radius", "outline", "box-shadow", "background", "color", "flex", "order",
  "align-self", "justify-self", "position", "inset", "z-index", "vertical-align", "cursor", "translate", "rotate", "scale",
  "animation", "transition",
];

/**
 * The shell's main column while an isolated mini-app is shown in the outlet (app/index.html: `<main>` >
 * `[data-outlet]` > the mount element). An isolated mini-app brings its own page column — width,
 * inline padding with the safe areas, top and bottom spacing — exactly as on its standalone site, so
 * the shell's column steps aside instead of adding a second inset around it.
 */
const SHELL_MAIN = "main:has(> [data-outlet] > [data-miniapp=\"{id}\"])";

/** Pseudo-elements the reset also reverts, one rule each: an engine that lacks one drops only that rule. */
const PSEUDO_ELEMENTS = ["::backdrop", "::placeholder", "::marker", "::file-selector-button"];

/**
 * Returns `@layer reset { … }` for a mini-app.
 * @remarks `all: revert` rolls every property back to the browser's own stylesheet, skipping every
 * author layer — the shell's included — unless a later layer sets it: the mini-app's own sub-layers
 * come after `reset`, so they still win. `revert-layer` would fall back to the shell's layers, and
 * `unset` would also drop the browser defaults (focus rings, form controls, `dialog`). `all` leaves
 * custom properties alone, so the tokens still inherit. `hidden` is a presentational hint in Chromium,
 * so the layer hides `[hidden]` again the way the browser does. Every selector has specificity 0; the
 * re-hide rules win by coming later. Its last rule gives the mini-app the shell's whole main column
 * ({@link SHELL_MAIN}) — the one rule outside the scope, active only while the mini-app is mounted.
 * @param id - the mini-app id (a route slug)
 */
export function resetLayer(id: string): AtRule {
  const scope = scopeSelector(id);
  const revert = (props: readonly string[]): Declaration[] => props.map((prop) => postcss.decl({ prop, value: "revert" }));
  const rules = [
    postcss.rule({ selector: `${scope} :where(:not(${ATTRIBUTE_STYLED})), ${scope} ::before, ${scope} ::after`, nodes: revert(["all"]) }),
    ...PSEUDO_ELEMENTS.map((pseudo) => postcss.rule({ selector: `${scope} ${pseudo}`, nodes: revert(["all"]) })),
    postcss.rule({ selector: `${scope} :where(${ATTRIBUTE_STYLED})`, nodes: revert(HINT_SAFE_PROPERTIES) }),
    postcss.rule({ selector: `${scope} :where([hidden]:not([hidden="until-found" i]))`, nodes: [postcss.decl({ prop: "display", value: "none" })] }),
    postcss.rule({ selector: `${scope} :where([hidden="until-found" i])`, nodes: [postcss.decl({ prop: "content-visibility", value: "hidden" })] }),
    postcss.rule({ selector: SHELL_MAIN.replace("{id}", id), nodes: [postcss.decl({ prop: "width", value: "100%" }), postcss.decl({ prop: "padding-block", value: "0" })] }),
  ];
  return postcss.atRule({ name: "layer", params: RESET_LAYER, nodes: rules });
}
