// Selector scoping of the mini-app CSS transform (PLAN §1.3, miniapp-css.ts): every top-level selector
// gets the scope `:where([data-miniapp="<id>"])` as an ancestor, so specificity is unchanged; the
// document roots (`html`, `body`, `:root`, `:host`) become the scope element itself.
import type { AtRule } from "postcss";
import selectorParser from "postcss-selector-parser";
import { MiniAppCssError } from "./miniapp-css-errors.ts";

/** Selectors that mean "the document root" in a standalone app; inside Quizzard the mount element. */
const ROOT_TAGS = new Set(["html", "body"]);
const ROOT_PSEUDOS = new Set([":root", ":host"]);

/** Where a selector list comes from, for error messages. */
export interface SelectorSource {
  /** File the rule is in (relative path), or a label. */
  readonly file: string;
  /** 1-based line of the rule, when known. */
  readonly line: number | undefined;
}

/**
 * Returns the scope selector of a mini-app: `:where([data-miniapp="<id>"])` (specificity 0).
 * @param id - the mini-app id; callers validate it as a route slug first
 */
export function scopeSelector(id: string): string {
  return `:where([data-miniapp="${id}"])`;
}

/**
 * Scopes a top-level selector list: `.a, html .b` → `:where(S) .a, :where(S) .b`.
 * @remarks Duplicates that only differ before scoping (`html, :host`) are kept once.
 * @throws {@link MiniAppCssError} `UNSUPPORTED_SELECTOR` for `&` without a parent rule, a root
 * selector after a combinator or inside `:is()`/`:not()`…, and `:host(…)`/`:host-context(…)`
 */
export function scopeSelectorList(selectors: string, id: string, source: SelectorSource): string {
  const scoped: string[] = [];
  const scopeNode = parseScopeNode(id);
  selectorParser((list) => {
    list.each((selector) => {
      scopeComplexSelector(selector, scopeNode, source);
      scoped.push(selector.toString().trim());
    });
  }).processSync(selectors);
  return [...new Set(scoped)].join(", ");
}

/**
 * Checks a nested rule's selector (relative to its parent, so it needs no scope): it must not name
 * a document root, which would mean an element outside the scope.
 * @throws {@link MiniAppCssError} `UNSUPPORTED_SELECTOR` when it does
 */
export function assertNestedSelector(selectors: string, source: SelectorSource): void {
  selectorParser((list) => {
    list.walk((node) => {
      if (isRootNode(node, source)) throw unsupported(selectors, "a document root (html, body, :root, :host) inside a nested rule", source);
    });
  }).processSync(selectors);
}

/**
 * Scopes an `@scope (<start>) [to (<end>)]` rule: the start selectors get the mini-app scope; the
 * rules inside are relative to the scope root already and are only checked like nested rules.
 * @throws {@link MiniAppCssError} `UNSUPPORTED_SELECTOR` for `@scope` without a start (its root
 * would be the `<link>`'s parent, `<head>`) or a root selector inside
 */
export function scopeAtScope(atRule: AtRule, id: string, source: SelectorSource): void {
  const start = parenthesized(atRule.params.trim());
  if (start === null) throw unsupported(`@scope ${atRule.params}`, "no scope start", source);
  const rest = atRule.params.trim().slice(start.length + 2);
  atRule.params = `(${scopeSelectorList(start, id, source)})${rest}`;
  atRule.walkRules((rule) => {
    assertNestedSelector(rule.selector, { file: source.file, line: rule.source?.start?.line });
  });
}

/** `(.a:is(.b)) to (.c)` → `.a:is(.b)`: the text inside the first balanced parentheses. */
function parenthesized(text: string): string | null {
  if (!text.startsWith("(")) return null;
  let depth = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "(") depth += 1;
    if (text[index] === ")") depth -= 1;
    if (depth === 0) return text.slice(1, index);
  }
  return null;
}

function scopeComplexSelector(selector: selectorParser.Selector, scopeNode: selectorParser.Pseudo, source: SelectorSource): void {
  const text = selector.toString().trim();
  const firstCombinator = selector.nodes.findIndex((node) => node.type === "combinator");
  const compoundEnd = firstCombinator === -1 ? selector.nodes.length : firstCombinator;
  const roots: selectorParser.Node[] = [];
  selector.walk((node) => {
    if (node.type === "nesting") throw unsupported(text, "`&` outside a style rule", source);
    if (!isRootNode(node, source)) return;
    if (node.parent !== selector) throw unsupported(text, "a document root inside :is(), :where(), :not() or :has()", source);
    if (selector.index(node) >= compoundEnd) throw unsupported(text, "a document root after a combinator", source);
    roots.push(node);
  });
  if (selector.first.type === "combinator") throw unsupported(text, "a leading combinator", source);
  const [firstRoot, ...otherRoots] = roots;
  const scope = scopeNode.clone();
  if (firstRoot === undefined) {
    // Ancestor form: `:where(S) X` — the scope element itself never matches X, only its subtree.
    selector.first.spaces.before = "";
    selector.prepend(selectorParser.combinator({ value: " " }));
    selector.prepend(scope);
    return;
  }
  firstRoot.replaceWith(scope);
  for (const root of otherRoots) root.remove(); // `html:root` → one scope element
}

function isRootNode(node: selectorParser.Node, source: SelectorSource): boolean {
  if (node.type === "tag") return ROOT_TAGS.has(node.value.toLowerCase());
  if (node.type !== "pseudo") return false;
  const name = node.value.toLowerCase();
  if (name === ":host-context" || (name === ":host" && node.nodes.length > 0)) {
    throw unsupported(node.toString(), "`:host(…)` and `:host-context(…)` (no shadow DOM in Quizzard)", source);
  }
  return ROOT_PSEUDOS.has(name);
}

function parseScopeNode(id: string): selectorParser.Pseudo {
  const node = selectorParser().astSync(scopeSelector(id)).first.first;
  if (node.type !== "pseudo") throw new Error(`Scope selector did not parse as a pseudo-class: ${scopeSelector(id)}`);
  return node;
}

function unsupported(selector: string, what: string, source: SelectorSource): MiniAppCssError {
  return new MiniAppCssError("UNSUPPORTED_SELECTOR", `${where(source)}: "${selector}" uses ${what}, which the mini-app CSS scope cannot map. Rewrite the selector at the source.`);
}

/**
 * Formats `file:line` for messages.
 * @param source - the rule's file and line
 */
export function where(source: SelectorSource): string {
  return source.line === undefined ? source.file : `${source.file}:${String(source.line)}`;
}
