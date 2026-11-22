// Global CSS names (PLAN §1.3 point 3): `@keyframes`, `@property`, `@counter-style`,
// `@font-palette-values`, `@position-try` and container names are not scoped by selectors or layers,
// so a mini-app that reuses a name the shell or another mini-app owns would change their styles.
// The transform collects each file's names here and fails the build on a collision.
import type { AtRule, Declaration, Root } from "postcss";
import { MiniAppCssError } from "./miniapp-css-errors.ts";

/** Kinds of global names the transform tracks. */
type GlobalNameKind = "keyframes" | "property" | "counter-style" | "font-palette-values" | "position-try" | "container";

/** Who defines a global name, and how. */
export interface GlobalNameOwner {
  /** `the shell` or `mini-app "<id>"`; the same owner may repeat a name. */
  readonly owner: string;
  /** File that defines it (relative path), for the error message. */
  readonly file: string;
  /** Normalized `@property` descriptors (two identical registrations are harmless); otherwise "". */
  readonly definition: string;
}

/** Global names by key `<kind> <name>`, e.g. `keyframes toast-in`. */
export type GlobalNames = ReadonlyMap<string, GlobalNameOwner>;

const AT_RULE_KINDS = new Map<string, GlobalNameKind>([
  ["keyframes", "keyframes"],
  ["-webkit-keyframes", "keyframes"],
  ["property", "property"],
  ["counter-style", "counter-style"],
  ["font-palette-values", "font-palette-values"],
  ["position-try", "position-try"],
]);
/** Words that may start an `@container` prelude without being a container name. */
const CONTAINER_KEYWORDS = new Set(["not", "and", "or"]);
const IDENT_AT_START = /^-?[A-Za-z_][\w-]*/;

/** The map key of a global name, e.g. `keyframes toast-in`. */
function globalNameKey(kind: GlobalNameKind, name: string): string {
  return `${kind} ${name}`;
}

/**
 * Collects every global name a stylesheet defines or queries (container names in `@container`).
 * @param root - the parsed stylesheet
 * @param owner - `the shell` or `mini-app "<id>"`
 * @param file - the stylesheet's path for messages
 */
export function collectGlobalNames(root: Root, owner: string, file: string): Map<string, GlobalNameOwner> {
  const names = new Map<string, GlobalNameOwner>();
  const add = (kind: GlobalNameKind, name: string, definition = ""): void => {
    names.set(globalNameKey(kind, name), { owner, file, definition });
  };
  root.walkAtRules((atRule) => {
    const name = atRule.name.toLowerCase();
    const kind = AT_RULE_KINDS.get(name);
    if (kind !== undefined) add(kind, unquote(atRule.params.trim()), kind === "property" ? descriptors(atRule) : "");
    if (name === "container") {
      const queried = queriedContainer(atRule.params);
      if (queried !== null) add("container", queried);
    }
  });
  root.walkDecls(/^container(-name)?$/i, (declaration) => {
    for (const name of declaredContainers(declaration)) add("container", name);
  });
  return names;
}

/**
 * Fails when a name of `names` is owned by someone else in `reserved`.
 * @param names - one mini-app file's names ({@link collectGlobalNames})
 * @param reserved - names of the shell and of mini-apps transformed before
 * @throws {@link MiniAppCssError} `GLOBAL_NAME_COLLISION` naming the file and both owners
 */
export function assertNoCollision(names: GlobalNames, reserved: GlobalNames): void {
  for (const [key, mine] of names) {
    const theirs = reserved.get(key);
    if (theirs === undefined || theirs.owner === mine.owner) continue;
    if (key.startsWith("property ") && theirs.definition === mine.definition) continue;
    const [kind = "", name = ""] = key.split(" ");
    const label = kind === "container" ? "container name" : `@${kind}`;
    throw new MiniAppCssError(
      "GLOBAL_NAME_COLLISION",
      `${mine.file}: ${label} "${name}" of ${mine.owner} is also defined by ${theirs.owner} (${theirs.file}). ` +
        "These names are global in CSS, whatever the layer or selector: rename it at the source (PLAN §1.3).",
    );
  }
}

function unquote(text: string): string {
  return text.replace(/^(["'])(.*)\1$/, "$2");
}

function descriptors(atRule: AtRule): string {
  return (atRule.nodes ?? []).map((node) => node.toString().replace(/\s+/g, " ").trim()).join("; ");
}

/** `main (width > 45rem)` → `main`; `(width > 1px)`, `not (…)`, `style(…)` → no name. */
function queriedContainer(params: string): string | null {
  const text = params.trim();
  const ident = IDENT_AT_START.exec(text)?.[0];
  if (ident === undefined || text.charAt(ident.length) === "(" || CONTAINER_KEYWORDS.has(ident.toLowerCase())) return null;
  return ident;
}

/** `container: main / inline-size` and `container-name: a b` → the names; `none` → none. */
function declaredContainers(declaration: Declaration): string[] {
  const value = declaration.prop.toLowerCase() === "container" ? (declaration.value.split("/")[0] ?? "") : declaration.value;
  return value.split(/\s+/).filter((name) => name !== "" && name.toLowerCase() !== "none");
}
