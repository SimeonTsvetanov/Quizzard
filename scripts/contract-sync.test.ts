// Contract sync (PLAN §1.1 item 4, T-10): every vendored mini-app package carries a byte-for-byte copy
// of packages/core/src/contract.ts and declares the contract version this shell supports. Fails
// after a pin bump that brings another contract — fix the source repo, never the copy here.
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { CONTRACT_VERSION } from "../packages/core/src/index.js";

const ROOT = resolve(import.meta.dirname, "..");
const CONTRACT = join(ROOT, "packages/core/src/contract.ts");

/** `vendor/<name>/packages/miniapp` folders below `vendorDir` (the workspace glob's packages). */
function vendoredMiniApps(vendorDir: string): string[] {
  if (!existsSync(vendorDir)) return [];
  return readdirSync(vendorDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(vendorDir, entry.name, "packages/miniapp"))
    .filter((dir) => existsSync(join(dir, "package.json")));
}

/** Packages whose `src/contract.ts` is missing or differs from `contractFile` in any byte. */
function contractDrift(packages: readonly string[], contractFile: string): string[] {
  const source = readFileSync(contractFile);
  return packages.filter((dir) => {
    const copy = join(dir, "src/contract.ts");
    return !existsSync(copy) || !readFileSync(copy).equals(source);
  });
}

/** Reads `meta.contract` of a vendored package (its light `./meta` module). */
async function metaContract(dir: string): Promise<unknown> {
  const loaded: unknown = await import(pathToFileURL(join(dir, "src/meta.ts")).href);
  const meta: unknown = typeof loaded === "object" && loaded !== null ? Reflect.get(loaded, "meta") : undefined;
  return typeof meta === "object" && meta !== null ? Reflect.get(meta, "contract") : undefined;
}

const PACKAGES = vendoredMiniApps(join(ROOT, "vendor"));

describe("vendored mini-app contract", () => {
  it("the submodules are checked out (git submodule update --init)", () => {
    expect(PACKAGES.map((dir) => dir.slice(ROOT.length + 1))).toContain("vendor/teamsync/packages/miniapp");
  });
  it("every vendored src/contract.ts is byte-for-byte packages/core/src/contract.ts", () => {
    expect(contractDrift(PACKAGES, CONTRACT)).toEqual([]);
  });
  it.each(PACKAGES)("%s declares the supported contract version", async (dir) => {
    expect(await metaContract(dir)).toBe(CONTRACT_VERSION);
  });
});

describe("contractDrift (self-test)", () => {
  const vendor = mkdtempSync(join(tmpdir(), "quizzard-contract-sync-"));
  const fake = (name: string, contract: Buffer | null): string => {
    const dir = join(vendor, name, "packages/miniapp");
    mkdirSync(join(dir, "src"), { recursive: true });
    writeFileSync(join(dir, "package.json"), "{}");
    if (contract !== null) writeFileSync(join(dir, "src/contract.ts"), contract);
    return dir;
  };
  const original = readFileSync(CONTRACT);
  const same = fake("same", original);
  const spaced = fake("spaced", Buffer.concat([original, Buffer.from("\n")]));
  const crlf = fake("crlf", Buffer.from(original.toString("utf8").replaceAll("\n", "\r\n")));
  const missing = fake("missing", null);

  it("finds every vendored package and flags a trailing newline, CRLF line ends and a missing copy", () => {
    expect(vendoredMiniApps(vendor).sort()).toEqual([crlf, missing, same, spaced]);
    expect(contractDrift(vendoredMiniApps(vendor), CONTRACT).sort()).toEqual([crlf, missing, spaced]);
  });
  it("reads another contract version from a meta module, so the version check would fail", async () => {
    writeFileSync(join(same, "src/meta.ts"), "export const meta = { contract: 2, id: \"same\" };\n");
    expect(await metaContract(same)).toBe(2);
    expect(await metaContract(same)).not.toBe(CONTRACT_VERSION);
  });
});
