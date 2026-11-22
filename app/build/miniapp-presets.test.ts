// Tests for app/build/miniapp-presets.ts (PLAN T-09): the preset merge and the `quizzard-miniapp-css`
// Vite plugin in a real Vite build and dev server over the fixture package in __fixtures__/plugin/.
import { cpSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build, createServer, type Plugin, type PluginOption } from "vite";
import { describe, expect, it } from "vitest";
import { mergeMiniAppPresets, type MiniAppPackage, type MiniAppVitePreset, type ShellStyles } from "./miniapp-presets.ts";

const FIXTURE = fileURLToPath(new URL("./__fixtures__/plugin/", import.meta.url));

const preset = (id: string, extra: Partial<MiniAppVitePreset> = {}): MiniAppVitePreset => ({ id, css: "shared", alias: {}, plugins: [], ...extra });
const shellOf = (root: string): ShellStyles => ({ paths: [join(root, "shell")], tokenFiles: [join(root, "shell/shell.css")], projectRoot: root });

/** Builds the two stylesheets as entries and returns each emitted CSS file's text by entry name. */
async function buildCss(root: string, packages: readonly MiniAppPackage[]): Promise<Record<string, string>> {
  const output = await build({
    root,
    configFile: false,
    logLevel: "silent",
    plugins: mergeMiniAppPresets(packages, shellOf(root)).plugins,
    build: { write: false, minify: false, cssMinify: false, rolldownOptions: { input: { shell: join(root, "shell/shell.css"), miniapp: join(root, "miniapp/style.css") } } },
  });
  const outputs = Array.isArray(output) ? output : [output];
  const css: Record<string, string> = {};
  for (const result of outputs) {
    if (!("output" in result)) continue;
    for (const file of result.output) {
      if (file.type === "asset" && file.fileName.endsWith(".css")) css[file.names[0]?.replace(/\.css$/, "") ?? file.fileName] = String(file.source);
    }
  }
  return css;
}

/** A writable copy of the fixture, for cases that change a file. */
function fixtureCopy(): string {
  const dir = mkdtempSync(join(tmpdir(), "quizzard-miniapp-css-"));
  cpSync(FIXTURE, dir, { recursive: true });
  return dir;
}

async function buildError(root: string, packages: readonly MiniAppPackage[]): Promise<string> {
  try {
    await buildCss(root, packages);
  } catch (error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
  return "no error";
}

describe("mergeMiniAppPresets", () => {
  it("merges aliases and puts the preset plugins before the CSS plugin and the chunk namer", () => {
    const tailwind: Plugin = { name: "fake-tailwind" };
    const merged = mergeMiniAppPresets(
      [
        { preset: preset("teams", { alias: { a: "/x/a.ts" } }), root: "/r/teams" },
        { preset: preset("scores", { css: "isolated", alias: { b: "/x/b.ts", a: "/x/a.ts" }, plugins: [tailwind] }), root: "/r/scores" },
      ],
      shellOf("/r"),
    );
    expect(merged.alias).toEqual({ a: "/x/a.ts", b: "/x/b.ts" });
    expect(merged.plugins.map((plugin: PluginOption) => (plugin !== null && typeof plugin === "object" && "name" in plugin ? plugin.name : "?"))).toEqual(["fake-tailwind", "quizzard-miniapp-css", "quizzard-miniapp-chunks"]);
  });

  it("refuses a duplicate id, nested folders and one alias with two targets", () => {
    expect(() => mergeMiniAppPresets([{ preset: preset("a"), root: "/r/a" }, { preset: preset("a"), root: "/r/b" }], shellOf("/r"))).toThrow(/listed twice/);
    expect(() => mergeMiniAppPresets([{ preset: preset("a"), root: "/r/a" }, { preset: preset("b"), root: "/r/a/b" }], shellOf("/r"))).toThrow(/inside/);
    expect(() => mergeMiniAppPresets([{ preset: preset("a", { alias: { x: "/1" } }), root: "/r/a" }, { preset: preset("b", { alias: { x: "/2" } }), root: "/r/b" }], shellOf("/r"))).toThrow(/two targets|points to/);
  });

  it("with no package it adds no alias and a plugin that changes nothing", async () => {
    expect(mergeMiniAppPresets([], shellOf(FIXTURE)).alias).toEqual({});
    const css = await buildCss(FIXTURE, []);
    expect(css["miniapp"]).toContain(".card");
    expect(css["miniapp"]).not.toContain("data-miniapp");
    expect(css["shell"]).not.toContain("data-miniapp");
  });
});

describe("quizzard-miniapp-css in a Vite build", () => {
  const fx: MiniAppPackage = { preset: preset("fx", { css: "isolated" }), root: join(FIXTURE, "miniapp") };

  it("scopes the package's CSS (imports inlined first) and leaves the shell's alone", async () => {
    const css = await buildCss(FIXTURE, [fx]);
    expect(css["miniapp"]).toMatch(/^@layer miniapp\.fx \{/);
    expect(css["miniapp"]).toContain('all: revert');
    expect(css["miniapp"]).toContain(':where([data-miniapp="fx"], [data-header-slot="fx"]) .part');
    expect(css["miniapp"]).toContain(':where([data-miniapp="fx"], [data-header-slot="fx"]) .card');
    expect(css["shell"]).not.toContain("data-miniapp");
    expect(css["shell"]).toContain(".button");
  });

  it("fails the build when the package reuses a shell keyframes name", async () => {
    const root = fixtureCopy();
    writeFileSync(join(root, "miniapp/part.css"), "@keyframes shell-in { to { opacity: 1; } }\n");
    const message = await buildError(root, [{ ...fx, root: join(root, "miniapp") }]);
    expect(message).toContain('@keyframes "shell-in" of mini-app "fx" is also defined by the shell (shell/shell.css)');
  });

  it("fails the build on a token-check finding in the package's sources", async () => {
    const root = fixtureCopy();
    writeFileSync(join(root, "miniapp/part.css"), ".part { color: #ff0000; margin: var(--nope); }\n");
    const message = await buildError(root, [{ ...fx, root: join(root, "miniapp") }]);
    expect(message).toContain("miniapp/part.css:1 UNDEFINED_TOKEN var(--nope)");
    expect(message).toContain("miniapp/part.css:1 LITERAL_COLOR color: literal colour #ff0000");
  });
});

describe("quizzard-miniapp-css in the dev server", () => {
  it("serves the package's CSS scoped and the shell's unchanged", async () => {
    const server = await createServer({
      root: FIXTURE,
      configFile: false,
      logLevel: "silent",
      server: { middlewareMode: true, ws: false },
      plugins: mergeMiniAppPresets([{ preset: preset("fx"), root: join(FIXTURE, "miniapp") }], shellOf(FIXTURE)).plugins,
    });
    try {
      const miniapp = await server.transformRequest("/miniapp/style.css");
      const shell = await server.transformRequest("/shell/shell.css");
      expect(miniapp?.code).toContain("@layer miniapp.fx");
      expect(miniapp?.code).toContain(':where([data-miniapp=\\"fx\\"], [data-header-slot=\\"fx\\"]) .card');
      expect(shell?.code).not.toContain("data-miniapp");
    } finally {
      await server.close();
    }
  });
});
