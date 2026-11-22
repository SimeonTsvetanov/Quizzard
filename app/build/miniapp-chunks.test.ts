// Tests for app/build/miniapp-chunks.ts (PLAN T-10): which chunks belong to a mini-app and the names
// a real Vite build gives them.
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "vite";
import { describe, expect, it } from "vitest";
import { chunkOwner, miniAppChunksPlugin, type ChunkOwner } from "./miniapp-chunks.ts";

const OWNERS: readonly ChunkOwner[] = [{ id: "teams", root: "/repo/vendor/teamsync/packages/miniapp" }];

describe("chunkOwner", () => {
  it("a chunk whose facade is inside a package belongs to that mini-app", () => {
    expect(chunkOwner({ facadeModuleId: "/repo/vendor/teamsync/packages/miniapp/src/index.ts", moduleIds: [] }, OWNERS)).toBe("teams");
  });
  it("a shell chunk, or a folder that only starts like the package, belongs to nobody", () => {
    expect(chunkOwner({ facadeModuleId: "/repo/app/src/main.ts", moduleIds: [] }, OWNERS)).toBeNull();
    expect(chunkOwner({ facadeModuleId: "/repo/vendor/teamsync/packages/miniapp-old/src/index.ts", moduleIds: [] }, OWNERS)).toBeNull();
  });
  it("without a facade: one owner for every module, else nobody", () => {
    const inside = "/repo/vendor/teamsync/packages/miniapp/src/a.ts";
    expect(chunkOwner({ facadeModuleId: null, moduleIds: [inside, `${inside}?raw`] }, OWNERS)).toBe("teams");
    expect(chunkOwner({ facadeModuleId: null, moduleIds: [inside, "/repo/app/src/x.ts"] }, OWNERS)).toBeNull();
    expect(chunkOwner({ facadeModuleId: null, moduleIds: [] }, OWNERS)).toBeNull();
  });
});

describe("miniAppChunksPlugin in a Vite build", () => {
  it("names the mini-app's lazy chunks miniapp-<id>-… and leaves the shell's alone", async () => {
    const root = mkdtempSync(join(tmpdir(), "quizzard-miniapp-chunks-"));
    mkdirSync(join(root, "pkg"));
    writeFileSync(join(root, "index.html"), '<script type="module" src="./main.js"></script>');
    writeFileSync(join(root, "main.js"), 'void import("./pkg/body.js");\nvoid import("./own.js");\n');
    writeFileSync(join(root, "own.js"), 'globalThis.own = "shell";\nexport const own = 1;\n');
    writeFileSync(join(root, "pkg/body.js"), 'globalThis.body = "mini-app";\nexport const body = 2;\n');
    const output = await build({
      root,
      configFile: false,
      logLevel: "silent",
      plugins: [miniAppChunksPlugin([{ id: "teams", root: join(root, "pkg") }])],
      build: { write: false, minify: false },
    });
    const results = Array.isArray(output) ? output : [output];
    const files = results.flatMap((result) => ("output" in result ? result.output.map(({ fileName }) => fileName) : []));
    expect(files.filter((file) => file.startsWith("assets/miniapp-teams-body-"))).toHaveLength(1);
    expect(files.filter((file) => file.startsWith("assets/own-"))).toHaveLength(1);
    expect(files.some((file) => file.startsWith("assets/miniapp-teams-own") || file.startsWith("assets/miniapp-teams-index"))).toBe(false);
  });
});
