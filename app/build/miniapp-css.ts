// The mini-app CSS transform (PLAN §1.3, T-09), run by the Vite plugin in miniapp-presets.ts on every
// stylesheet of a mini-app package, after Vite has inlined its imports (and Tailwind has compiled it):
// (1) wraps the file in `@layer miniapp.<id>` — the shell's last layer, so mini-app CSS beats shell CSS
// whatever the specificity, and the file's own layers become sub-layers; (2) scopes every selector
// under `[data-miniapp="<id>"]`; (3) fails on global names the shell or another mini-app owns;
// (4) "isolated" mode adds a first sub-layer `reset` so no shell rule styles the mini-app's elements.
import postcss, { type AtRule, type Container, type Node, type Root, type Rule } from "postcss";
import { isRouteSlug } from "@simeonts/quizzard-core";
import { MiniAppCssError, type MiniAppCssWarning } from "./miniapp-css-errors.ts";
import { assertNoCollision, collectGlobalNames, type GlobalNames } from "./miniapp-css-names.ts";
import { RESET_LAYER, resetLayer } from "./miniapp-css-reset.ts";
import { assertNestedSelector, scopeAtScope, scopeSelectorList, where, type SelectorSource } from "./miniapp-css-selectors.ts";

/** How a mini-app's CSS meets the shell's: "shared" uses the shell's forge components on purpose,
 *  "isolated" starts from browser defaults (PLAN §1.3). */
export type MiniAppCssMode = "shared" | "isolated";

/** Inputs of {@link transformMiniAppCss}. */
export interface MiniAppCssOptions {
  /** The mini-app id (`meta.id`): layer `miniapp.<id>`, scope `[data-miniapp="<id>"]`. */
  readonly id: string;
  readonly mode: MiniAppCssMode;
  /** Global names of the shell and of other mini-apps ({@link collectGlobalNames}). */
  readonly reserved: GlobalNames;
  /** The stylesheet's path (relative), used in every message. */
  readonly file: string;
}

/** Output of {@link transformMiniAppCss}. */
export interface MiniAppCssResult {
  readonly css: string;
  readonly warnings: readonly MiniAppCssWarning[];
  /** Global names this file defines; the caller adds them to `reserved` for the next files. */
  readonly names: GlobalNames;
}

/** The shell's last cascade layer (app/src/styles/app.css); each mini-app gets `miniapp.<id>`. */
const MINIAPP_LAYER = "miniapp";

/** At-rules whose children are ordinary rules to scope. */
const GROUPING_AT_RULES = new Set(["media", "supports", "container", "layer", "starting-style"]);
/** At-rules without selectors; their names are checked by miniapp-css-names.ts. */
const NAMED_AT_RULES = new Set(["keyframes", "-webkit-keyframes", "property", "counter-style", "font-palette-values", "position-try", "font-feature-values"]);
/** At-rules that act on the whole document, not on the mini-app's subtree. */
const DOCUMENT_AT_RULES = new Set(["view-transition", "page"]);

interface WalkContext {
  readonly id: string;
  readonly file: string;
  readonly warnings: MiniAppCssWarning[];
}

/**
 * Scopes one mini-app stylesheet (see the file comment for the four steps).
 * @param css - the stylesheet after imports are inlined and Tailwind (if any) has compiled
 * @param options - id, mode, reserved global names and the file for messages
 * @returns the scoped CSS, warnings (`@font-face`, `!important`, document-level at-rules) and the
 * file's global names
 * @throws {@link MiniAppCssError} for an invalid id, a selector or at-rule the scope cannot map, a
 * sub-layer named `reset` in isolated mode, or a global name another owner defines; postcss's
 * `CssSyntaxError` for unparsable CSS
 */
export function transformMiniAppCss(css: string, options: MiniAppCssOptions): MiniAppCssResult {
  const { id, mode, file } = options;
  if (!isRouteSlug(id)) throw new MiniAppCssError("INVALID_ID", `${file}: mini-app id ${JSON.stringify(id)} is not a lower-case slug`);
  const root = postcss.parse(css, { from: file });
  const names = collectGlobalNames(root, `mini-app "${id}"`, file);
  assertNoCollision(names, options.reserved);
  if (mode === "isolated") assertNoResetLayer(root, file);
  const context: WalkContext = { id, file, warnings: [] };
  scopeChildren(root, context);
  warnImportant(root, context);
  wrapInLayer(root, id, mode);
  return { css: root.toString(), warnings: context.warnings, names };
}

function scopeChildren(container: Container, context: WalkContext): void {
  container.each((node) => {
    if (node.type === "rule") scopeRule(node, context);
    if (node.type === "atrule") scopeAtRule(node, context);
  });
}

function scopeRule(rule: Rule, context: WalkContext): void {
  rule.selector = scopeSelectorList(rule.selector, context.id, sourceOf(rule, context));
  // Nested rules are relative to this one (`&`), so they are inside the scope already.
  rule.walkRules((nested) => {
    assertNestedSelector(nested.selector, sourceOf(nested, context));
  });
}

function scopeAtRule(atRule: AtRule, context: WalkContext): void {
  const name = atRule.name.toLowerCase();
  if (GROUPING_AT_RULES.has(name)) {
    scopeChildren(atRule, context);
    return;
  }
  if (NAMED_AT_RULES.has(name)) return;
  const at = where(sourceOf(atRule, context));
  switch (name) {
    case "scope":
      scopeAtScope(atRule, context.id, sourceOf(atRule, context));
      return;
    case "charset":
      atRule.remove(); // only valid as a file's first bytes, which this file no longer is
      return;
    case "font-face":
      context.warnings.push({ code: "FONT_FACE", message: `${at}: @font-face in mini-app CSS — the shell already loads the fonts; mini-apps must not ship fonts (PLAN §1.3).` });
      return;
    default:
      if (DOCUMENT_AT_RULES.has(name)) {
        context.warnings.push({ code: "DOCUMENT_AT_RULE", message: `${at}: @${name} acts on the whole Quizzard page, not on the mini-app — remove it from the mini-app CSS (PLAN §1.1 item 5).` });
        return;
      }
      throw new MiniAppCssError("UNSUPPORTED_AT_RULE", `${at}: @${atRule.name} cannot be scoped to a mini-app (an @import Vite did not inline, @namespace, or uncompiled Tailwind such as @theme/@apply). Remove it or compile it first.`);
  }
}

function warnImportant(root: Root, context: WalkContext): void {
  const lines: number[] = [];
  root.walkDecls((declaration) => {
    if (declaration.important) lines.push(declaration.source?.start?.line ?? 0);
  });
  if (lines.length === 0) return;
  context.warnings.push({
    code: "IMPORTANT",
    message:
      `${context.file}: ${String(lines.length)} !important declaration(s) (line ${lines.join(", ")}). Important declarations reverse the ` +
      "layer order: an important shell rule beats them, and they beat every normal shell rule — remove them (css-architecture §2).",
  });
}

function assertNoResetLayer(root: Root, file: string): void {
  root.walkAtRules("layer", (atRule) => {
    if (hasLayerAncestor(atRule)) return;
    const names = atRule.params.split(",").map((name) => name.trim().split(".")[0]);
    if (!names.includes(RESET_LAYER)) return;
    throw new MiniAppCssError("RESERVED_LAYER", `${where(sourceOf(atRule, { file }))}: layer "${RESET_LAYER}" is the isolation layer of an isolated mini-app; rename the mini-app's own layer.`);
  });
}

function hasLayerAncestor(node: Node): boolean {
  for (let parent = node.parent; parent !== undefined; parent = parent.parent) {
    if ("name" in parent && parent.name === "layer") return true;
  }
  return false;
}

function wrapInLayer(root: Root, id: string, mode: MiniAppCssMode): void {
  const layer = postcss.atRule({ name: "layer", params: `${MINIAPP_LAYER}.${id}` });
  if (mode === "isolated") layer.append(resetLayer(id));
  layer.append(root.nodes); // moves them: postcss takes a node out of its old parent
  root.removeAll();
  root.append(layer);
}

function sourceOf(node: Node, context: Pick<WalkContext, "file">): SelectorSource {
  return { file: context.file, line: node.source?.start?.line };
}
