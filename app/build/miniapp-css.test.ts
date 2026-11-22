// Unit tests for the mini-app CSS transform (app/build/miniapp-css.ts, PLAN §1.3, T-09): layer wrap,
// selector scope, root mapping, nesting, at-rules, global-name collisions, the isolated reset, and two
// real inputs (a TeamSync file and a slice of GG Counter's Tailwind output in __fixtures__/).
// That the browser really applies the result is proved by tests/e2e/css-layers.spec.ts.
import { readFileSync } from "node:fs";
import fc from "fast-check";
import postcss, { AtRule, Rule, type Container, type Document } from "postcss";
import { describe, expect, it } from "vitest";
import { listCssFiles } from "../../scripts/check-miniapp-tokens.ts";
import { MiniAppCssError } from "./miniapp-css-errors.ts";
import { collectGlobalNames, type GlobalNameOwner, type GlobalNames } from "./miniapp-css-names.ts";
import { transformMiniAppCss, type MiniAppCssMode, type MiniAppCssResult } from "./miniapp-css.ts";

/** Ancestor scope: the mount element and the header slot (miniapp-css-selectors.ts `scopeSelector`). */
const S = ':where([data-miniapp="x"], [data-header-slot="x"])';
/** What document roots become: the mount element only (`rootScopeSelector`). */
const R = ':where([data-miniapp="x"])';
const fixture = (name: string): string => readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), "utf8");

function run(css: string, options: { mode?: MiniAppCssMode; reserved?: GlobalNames; id?: string } = {}): MiniAppCssResult {
  return transformMiniAppCss(css, { id: options.id ?? "x", mode: options.mode ?? "shared", reserved: options.reserved ?? new Map(), file: "x.css" });
}

/** The selectors of every style rule in the output, in order, without the isolated reset layer. */
function selectors(css: string): string[] {
  const out: string[] = [];
  postcss.parse(css).walkRules((rule) => {
    if (!isInResetLayer(rule.parent)) out.push(rule.selector);
  });
  return out;
}

function isInResetLayer(node: Container | Document | undefined): boolean {
  for (let parent = node; parent !== undefined; parent = parent.parent) {
    if (parent instanceof AtRule && parent.name === "layer" && parent.params === "reset") return true;
  }
  return false;
}

/** The single top-level at-rule of a transform output. */
function wrapper(css: string): AtRule {
  const first = postcss.parse(css).first;
  if (!(first instanceof AtRule)) throw new Error("expected one @layer");
  return first;
}

function codeOf(action: () => unknown): string {
  try {
    action();
  } catch (error: unknown) {
    if (error instanceof MiniAppCssError) return error.code;
    throw error;
  }
  return "no error";
}

describe("layer wrap", () => {
  it("puts the whole file into @layer miniapp.<id>", () => {
    const { css } = run(".a { color: red; }");
    expect(postcss.parse(css).nodes).toHaveLength(1);
    expect([wrapper(css).name, wrapper(css).params]).toEqual(["layer", "miniapp.x"]);
  });

  it("keeps the file's own layer statements and blocks inside it, in order (Tailwind's too)", () => {
    const css = run("@layer theme, base, components, utilities;\n@layer base { a { color: red; } }\n@layer utilities { .p-4 { padding: 1rem; } }").css;
    const layers: string[] = [];
    postcss.parse(css).walkAtRules("layer", (atRule) => { layers.push(atRule.params); });
    expect(layers).toEqual(["miniapp.x", "theme, base, components, utilities", "base", "utilities"]);
  });

  it("keeps unlayered rules directly in the mini-app layer, so they beat its sub-layers (cascade: implicit last sub-layer)", () => {
    const layer = wrapper(run("@layer base { .a { color: red; } }\n.b { color: blue; }").css);
    const direct = (layer.nodes ?? []).filter((node) => node instanceof Rule).map((rule) => rule.selector);
    expect(direct).toEqual([`${S} .b`]);
  });

  it("shared mode has no reset layer", () => {
    expect(run(".a { color: red; }").css).not.toContain("all: revert");
  });

  it("isolated mode: the first sub-layer is reset — all: revert, attribute-styled elements kept, [hidden] hidden again", () => {
    const reset = wrapper(run("@layer base { .a { color: red; } }", { mode: "isolated" }).css).first;
    if (!(reset instanceof AtRule)) throw new Error("expected the reset layer first");
    expect([reset.name, reset.params]).toEqual(["layer", "reset"]);
    const rules = (reset.nodes ?? []).filter((node) => node instanceof Rule).map((rule) => [rule.selector, rule.nodes.map(String).join("; ")]);
    const attributeStyled = "svg, svg *, [width], [height]";
    expect(rules.slice(0, 5)).toEqual([
      [`${S} :where(:not(${attributeStyled})), ${S} ::before, ${S} ::after`, "all: revert"],
      [`${S} ::backdrop`, "all: revert"],
      [`${S} ::placeholder`, "all: revert"],
      [`${S} ::marker`, "all: revert"],
      [`${S} ::file-selector-button`, "all: revert"],
    ]);
    const [hintSafe, hidden, untilFound, shellMain] = rules.slice(5);
    expect(hintSafe?.[0]).toBe(`${S} :where(${attributeStyled})`);
    // Never a property an SVG presentation attribute or width/height sets.
    expect(hintSafe?.[1]).not.toMatch(/\b(?:all|fill|stroke|width|height|opacity|transform|display|filter): /);
    expect(hintSafe?.[1]).toContain("color: revert");
    expect(hidden).toEqual([`${S} :where([hidden]:not([hidden="until-found" i]))`, "display: none"]);
    expect(untilFound).toEqual([`${S} :where([hidden="until-found" i])`, "content-visibility: hidden"]);
    // The isolated mini-app brings its own page column: the shell's main column steps aside while it is mounted.
    expect(shellMain).toEqual(['main:has(> [data-outlet] > [data-miniapp="x"])', "width: 100%; padding-block: 0"]);
    expect(rules).toHaveLength(9);
  });

  it("shared mode has no reset and leaves the shell's main column alone", () => {
    expect(run(".a { color: red; }").css).not.toMatch(/@layer reset|main:has/);
  });

  it("isolated mode refuses a sub-layer named reset; shared mode allows it", () => {
    expect(codeOf(() => run("@layer reset { .a { color: red; } }", { mode: "isolated" }))).toBe("RESERVED_LAYER");
    expect(codeOf(() => run("@layer reset, base;", { mode: "isolated" }))).toBe("RESERVED_LAYER");
    expect(codeOf(() => run("@layer reset { .a { color: red; } }"))).toBe("no error");
    expect(codeOf(() => run("@layer base { @layer reset { .a { color: red; } } }", { mode: "isolated" }))).toBe("no error");
  });

  it("refuses an id that is not a slug (it is spliced into a selector and a layer name)", () => {
    expect(codeOf(() => run(".a {}", { id: 'x"] *, [y' }))).toBe("INVALID_ID");
    expect(codeOf(() => run(".a {}", { id: "Teams" }))).toBe("INVALID_ID");
  });
});

describe("selector scope", () => {
  it.each([
    [".a", `${S} .a`],
    [".a > .b + .c ~ .d", `${S} .a > .b + .c ~ .d`],
    ["*", `${S} *`],
    ["::before", `${S} ::before`],
    ["::backdrop", `${S} ::backdrop`],
    ["dialog[open]::backdrop", `${S} dialog[open]::backdrop`],
    ["[hidden]:where(:not([hidden='until-found']))", `${S} [hidden]:where(:not([hidden='until-found']))`],
    [":is(.a, .b) :not(.c)", `${S} :is(.a, .b) :not(.c)`],
    [":focus-visible", `${S} :focus-visible`],
    ["a:has(> img)", `${S} a:has(> img)`],
  ])("%s → ancestor scope", (input, expected) => {
    expect(selectors(run(`${input} { color: red; }`).css)).toEqual([expected]);
  });

  it.each([
    ["html", R],
    ["body", R],
    [":root", R],
    [":host", R],
    ["HTML", R],
    ["html.dark .a", `${R}.dark .a`],
    [':root[data-theme="dark"]', `${R}[data-theme="dark"]`],
    [":root .a", `${R} .a`],
    ["html:root", R],
    ["body > main", `${R} > main`],
  ])("%s → the mount element (never the header slot)", (input, expected) => {
    expect(selectors(run(`${input} { color: red; }`).css)).toEqual([expected]);
  });

  it("scopes each selector of a list and keeps root duplicates once (Tailwind's html, :host)", () => {
    expect(selectors(run(".a, .b,\n.c { color: red; }").css)).toEqual([`${S} .a, ${S} .b, ${S} .c`]);
    expect(selectors(run("html, :host { line-height: 1.5; }").css)).toEqual([R]);
  });

  it.each([
    [".a html", "after a combinator"],
    [":is(html) .a", "inside :is()"],
    [".a:not(:root)", "inside :not()"],
    ["& .a", "& without a parent rule"],
    [":host(.dark)", ":host() with an argument"],
    [":host-context(.dark) .a", ":host-context()"],
  ])("refuses %s (%s)", (input) => {
    expect(codeOf(() => run(`${input} { color: red; }`))).toBe("UNSUPPORTED_SELECTOR");
  });

  it("property: a class selector list keeps every selector unchanged after the scope (specificity unchanged)", () => {
    const className = fc.stringMatching(/^[a-z][a-z0-9-]{0,8}$/).map((name) => `.${name}`);
    const complex = fc.array(className, { minLength: 1, maxLength: 3 }).map((parts) => parts.join(" > "));
    fc.assert(
      fc.property(fc.uniqueArray(complex, { minLength: 1, maxLength: 4 }), (list) => {
        const [scoped = ""] = selectors(run(`${list.join(", ")} { color: red; }`).css);
        // The scope itself holds ", " (two scope elements), so the list is compared joined.
        expect(scoped).toBe(list.map((selector) => `${S} ${selector}`).join(", "));
      }),
    );
  });
});

describe("nesting and at-rules", () => {
  it("scopes only the outer rule; nested & rules and nested @media stay relative", () => {
    const css = run(".a { color: red; &:hover { color: blue; } & .b { color: green; } .c { color: gray; } @media (width > 600px) { color: black; } }").css;
    expect(selectors(css)).toEqual([`${S} .a`, "&:hover", "& .b", ".c"]);
  });

  it("refuses a document root inside a nested rule", () => {
    expect(codeOf(() => run(".a { :root & { color: red; } }"))).toBe("UNSUPPORTED_SELECTOR");
  });

  it("scopes rules inside @media, @supports, @container, @layer and @starting-style", () => {
    const css = run("@media print { .a { color: red; } } @supports (display: grid) { .b { color: red; } } @container main (width > 1rem) { .c { color: red; } } @layer base { @media (hover: hover) { .d { color: red; } } } @starting-style { .e { opacity: 0; } }").css;
    expect(selectors(css)).toEqual([`${S} .a`, `${S} .b`, `${S} .c`, `${S} .d`, `${S} .e`]);
  });

  it("leaves @keyframes steps alone", () => {
    const css = run("@keyframes x-in { from { opacity: 0; } 50% { opacity: 0.5; } }").css;
    expect(selectors(css)).toEqual(["from", "50%"]);
  });

  it("scopes the start of @scope and leaves its inner rules relative", () => {
    const css = run("@scope (.card:is(.a, .b)) to (.content) { img { color: red; } :scope { color: blue; } }").css;
    expect(css).toContain(`@scope (${S} .card:is(.a, .b)) to (.content)`);
    expect(selectors(css)).toEqual(["img", ":scope"]);
    expect(codeOf(() => run("@scope { img { color: red; } }"))).toBe("UNSUPPORTED_SELECTOR");
  });

  it("keeps @font-face but warns; warns about !important and document-level at-rules", () => {
    const result = run("@font-face { font-family: X; src: url(x.woff2); }\n.a { display: none !important; }\n@view-transition { navigation: auto; }");
    expect(result.css).toContain("@font-face");
    expect(result.warnings.map((warning) => warning.code)).toEqual(["FONT_FACE", "DOCUMENT_AT_RULE", "IMPORTANT"]);
    expect(result.warnings[2]?.message).toContain("line 2");
  });

  it("drops @charset and refuses at-rules it cannot scope (left-over @import, uncompiled Tailwind)", () => {
    expect(run('@charset "utf-8";\n.a { color: red; }').css).not.toContain("@charset");
    expect(codeOf(() => run('@import "other.css";'))).toBe("UNSUPPORTED_AT_RULE");
    expect(codeOf(() => run("@theme { --color-x: red; }"))).toBe("UNSUPPORTED_AT_RULE");
    expect(codeOf(() => run("@namespace svg url(http://www.w3.org/2000/svg);"))).toBe("UNSUPPORTED_AT_RULE");
  });
});

describe("global names", () => {
  const reserved = (css: string, owner = "the shell"): Map<string, GlobalNameOwner> => collectGlobalNames(postcss.parse(css), owner, "shell.css");

  it("reports the file's keyframes, @property, @counter-style and container names", () => {
    const { names } = run("@keyframes a-in { from { opacity: 0; } }\n@property --x { syntax: '*'; inherits: false; }\n@counter-style stars { system: cyclic; symbols: '*'; }\n.m { container: main / inline-size; }\n.n { container-name: card side; }\n@container panel (width > 1rem) { .o { color: red; } }");
    expect([...names.keys()].sort()).toEqual(["container card", "container main", "container panel", "container side", "counter-style stars", "keyframes a-in", "property --x"]);
  });

  it("fails on a keyframes name another owner defines, naming the file and both owners", () => {
    let message = "";
    try {
      run("@keyframes toast-in { from { opacity: 0; } }", { reserved: reserved("@keyframes toast-in { to { opacity: 1; } }") });
    } catch (error: unknown) {
      message = error instanceof MiniAppCssError ? `${error.code} ${error.message}` : String(error);
    }
    expect(message).toMatch(/^GLOBAL_NAME_COLLISION x\.css: @keyframes "toast-in" of mini-app "x" is also defined by the shell \(shell\.css\)/);
  });

  it("fails on container names and differing @property registrations; identical ones are harmless", () => {
    expect(codeOf(() => run(".a { container: main / inline-size; }", { reserved: reserved(".b { container-name: main; }") }))).toBe("GLOBAL_NAME_COLLISION");
    expect(codeOf(() => run("@container main (width > 1px) { .a { color: red; } }", { reserved: reserved(".b { container: main / size; }") }))).toBe("GLOBAL_NAME_COLLISION");
    const tw = "@property --tw-shadow { syntax: \"*\"; inherits: false; initial-value: 0 0 #0000; }";
    expect(codeOf(() => run(tw, { reserved: reserved(tw, 'mini-app "y"') }))).toBe("no error");
    expect(codeOf(() => run(tw, { reserved: reserved(tw.replace("false", "true"), 'mini-app "y"') }))).toBe("GLOBAL_NAME_COLLISION");
  });

  it("lets the same mini-app repeat its own names across files", () => {
    expect(codeOf(() => run("@keyframes a-in { from { opacity: 0; } }", { reserved: reserved("@keyframes a-in { to { opacity: 1; } }", 'mini-app "x"') }))).toBe("no error");
  });
});

describe("real inputs", () => {
  it("TeamSync teams-stepper.css (shared): every rule scoped, its layer becomes miniapp.teams.components", () => {
    const css = transformMiniAppCss(fixture("teams-stepper.css"), { id: "teams", mode: "shared", reserved: new Map(), file: "teams-stepper.css" }).css;
    const scope = ':where([data-miniapp="teams"], [data-header-slot="teams"])';
    const top = selectors(css).filter((selector) => !selector.startsWith("&"));
    expect(top).toEqual([`${scope} .stepper`, `${scope} .stepper-button`, `${scope} .stepper-value`]);
    expect(css).toMatch(/^@layer miniapp\.teams \{\s*\/\*[^]*@layer components \{/);
  });

  it("GG Counter's compiled Tailwind (isolated): preflight, :root/:host, utilities and properties map into the scope", () => {
    const { css, warnings } = transformMiniAppCss(fixture("gg-counter-compiled.css"), { id: "scores", mode: "isolated", reserved: new Map(), file: "gg.css" });
    const scope = ':where([data-miniapp="scores"], [data-header-slot="scores"])';
    const root = ':where([data-miniapp="scores"])';
    const all = selectors(css);
    expect(all).toContain(`${scope} *, ${scope} ::after, ${scope} ::before, ${scope} ::backdrop, ${scope} ::file-selector-button`);
    expect(all).toContain(root); // html, :host and the print :root
    expect(all).toContain(`${scope} .\\!block`);
    expect(all).toContain(`${scope} *, ${scope} ::before, ${scope} ::after, ${scope} ::backdrop`); // @layer properties
    expect(all.filter((selector) => ![scope, root, "&", "from"].some((start) => selector.startsWith(start)))).toEqual([]);
    expect(warnings.map((warning) => warning.code)).toEqual(["IMPORTANT"]); // preflight [hidden] + the !block utility
    expect(css.indexOf("@layer reset")).toBeLessThan(css.indexOf("@layer properties;"));
  });

  it("GG Counter's toast-in collides with the shell's own toast-in keyframes (fix at the source: GG-02)", () => {
    const shell = new Map<string, GlobalNameOwner>();
    for (const file of listCssFiles([new URL("../src/styles", import.meta.url).pathname])) {
      for (const [key, owner] of collectGlobalNames(postcss.parse(readFileSync(file, "utf8")), "the shell", file)) shell.set(key, owner);
    }
    expect(codeOf(() => transformMiniAppCss(fixture("gg-counter-compiled.css"), { id: "scores", mode: "isolated", reserved: shell, file: "gg.css" }))).toBe("GLOBAL_NAME_COLLISION");
  });
});
