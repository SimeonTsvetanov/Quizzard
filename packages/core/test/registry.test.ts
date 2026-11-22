import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { RESERVED_IDS, validateRegistry, type MiniAppEntry, type MiniAppModule, type RegistryResult, type StorageArea } from "../src/index.js";

const SHELL: StorageArea = { prefix: "quizzard:v1:" };
const MODULE: MiniAppModule = { mount: () => () => undefined };
const load = (): Promise<{ default: MiniAppModule }> => Promise.resolve({ default: MODULE });

interface EntryOptions {
  readonly storage?: StorageArea;
  readonly status?: "ready" | "coming";
  readonly withLoad?: boolean;
  readonly contract?: number;
}

/** A minimal registry line; `contract` may be any number to simulate a foreign mini-app. */
function entry(id: string, options: EntryOptions = {}): MiniAppEntry {
  const status = options.status ?? "ready";
  const meta = {
    contract: 1 as const,
    id,
    name: { en: id },
    tagline: { en: `${id} tagline` },
    icon: `./${id}.svg`,
    languages: ["en"] as const,
    status,
    storage: options.storage ?? { prefix: `${id}:v1:` },
  };
  // because a mini-app built against another contract version reaches the shell untyped
  const foreign = options.contract === undefined ? meta : ({ ...meta, contract: options.contract } as unknown as typeof meta);
  const withLoad = options.withLoad ?? status === "ready";
  return withLoad ? { meta: foreign, load } : { meta: foreign };
}

function codes(result: RegistryResult): string[] {
  return result.ok ? [] : result.errors.map((e) => e.code);
}

function messages(result: RegistryResult): string[] {
  return result.ok ? [] : result.errors.map((e) => e.message);
}

describe("validateRegistry", () => {
  it("accepts the planned registry and returns the same entries", () => {
    const entries = [
      entry("teams", { storage: { prefix: "teamsync:v1:", extraKeys: ["teamsync-names"] } }),
      entry("scores", { storage: { prefix: "gg-counter:v1:", extraKeys: ["gg-counter/state", "gg-counter-theme"] } }),
      entry("quiz", { status: "coming", storage: { prefix: "quiz:v1:", databases: ["quiz"], opfsDir: "quiz" } }),
    ];
    expect(validateRegistry(entries, SHELL)).toEqual({ ok: true, value: entries });
  });

  it("accepts an empty registry", () => {
    expect(validateRegistry([], SHELL)).toEqual({ ok: true, value: [] });
  });

  it("returns MINIAPP_ID_DUPLICATE once per repeated id", () => {
    const result = validateRegistry([entry("teams"), entry("teams", { storage: { prefix: "t2:" } }), entry("teams", { storage: { prefix: "t3:" } })], SHELL);
    expect(codes(result)).toEqual(["MINIAPP_ID_DUPLICATE"]);
  });

  it("returns MINIAPP_CONTRACT_VERSION for another contract version", () => {
    const result = validateRegistry([entry("teams", { contract: 2 })], SHELL);
    expect(codes(result)).toEqual(["MINIAPP_CONTRACT_VERSION"]);
    expect(messages(result)[0]).toContain("contract 2");
  });

  it.each(["Teams", "1teams", "te/ams", "", "../x", `a${"b".repeat(40)}`])("returns MINIAPP_ID_INVALID for %j", (id) => {
    expect(codes(validateRegistry([entry(id, { storage: { prefix: "x:" } })], SHELL))).toEqual(["MINIAPP_ID_INVALID"]);
  });

  it.each(RESERVED_IDS)("returns MINIAPP_ID_RESERVED for %j", (id) => {
    expect(codes(validateRegistry([entry(id)], SHELL))).toEqual(["MINIAPP_ID_RESERVED"]);
  });

  it("returns MINIAPP_STATUS_LOAD for a ready entry without load", () => {
    expect(codes(validateRegistry([entry("teams", { withLoad: false })], SHELL))).toEqual(["MINIAPP_STATUS_LOAD"]);
  });

  it("returns MINIAPP_STATUS_LOAD for a coming entry with load", () => {
    expect(codes(validateRegistry([entry("quiz", { status: "coming", withLoad: true })], SHELL))).toEqual(["MINIAPP_STATUS_LOAD"]);
  });

  it("returns STORAGE_AREA_OVERLAP when one prefix starts with another", () => {
    const result = validateRegistry([entry("teams", { storage: { prefix: "app:" } }), entry("scores", { storage: { prefix: "app:scores:" } })], SHELL);
    expect(codes(result)).toEqual(["STORAGE_AREA_OVERLAP"]);
    expect(messages(result)[0]).toContain('mini-app "teams" and mini-app "scores"');
  });

  it("checks the shell's own area like a mini-app's", () => {
    const result = validateRegistry([entry("teams", { storage: { prefix: "quizzard:v1:teams:" } })], SHELL);
    expect(codes(result)).toEqual(["STORAGE_AREA_OVERLAP"]);
    expect(messages(result)[0]).toContain("the shell");
  });

  it("returns STORAGE_AREA_OVERLAP for an extra key inside another area's prefix", () => {
    const result = validateRegistry([entry("teams", { storage: { prefix: "t:", extraKeys: ["quizzard:v1:theme"] } })], SHELL);
    expect(codes(result)).toEqual(["STORAGE_AREA_OVERLAP"]);
  });

  it("returns STORAGE_AREA_OVERLAP for an extra key declared by two areas", () => {
    const result = validateRegistry([
      entry("teams", { storage: { prefix: "t:", extraKeys: ["legacy"] } }),
      entry("scores", { storage: { prefix: "s:", extraKeys: ["legacy"] } }),
    ], SHELL);
    expect(codes(result)).toEqual(["STORAGE_AREA_OVERLAP"]);
    expect(messages(result)[0]).toContain('"legacy"');
  });

  it("returns STORAGE_AREA_OVERLAP for a shared database and a shared OPFS folder", () => {
    const result = validateRegistry([
      entry("teams", { storage: { prefix: "t:", databases: ["db", "own"], opfsDir: "files" } }),
      entry("scores", { storage: { prefix: "s:", databases: ["db"], opfsDir: "files" } }),
    ], SHELL);
    expect(codes(result)).toEqual(["STORAGE_AREA_OVERLAP", "STORAGE_AREA_OVERLAP"]);
  });

  it("allows an extra key inside the area's own prefix", () => {
    expect(validateRegistry([entry("teams", { storage: { prefix: "t:", extraKeys: ["t:old"] } })], SHELL).ok).toBe(true);
  });

  it.each<StorageArea>([{ prefix: "" }, { prefix: "t:", extraKeys: [""] }, { prefix: "t:", databases: [""] }, { prefix: "t:", opfsDir: "" }])(
    "returns STORAGE_AREA_INVALID for an empty name in %j",
    (storage) => {
      expect(codes(validateRegistry([entry("teams", { storage })], SHELL))).toContain("STORAGE_AREA_INVALID");
    },
  );

  it("reports every problem at once", () => {
    const result = validateRegistry([entry("help", { contract: 3, withLoad: false }), entry("help")], SHELL);
    expect(codes(result).sort()).toEqual(["MINIAPP_CONTRACT_VERSION", "MINIAPP_ID_DUPLICATE", "MINIAPP_ID_RESERVED", "MINIAPP_ID_RESERVED", "MINIAPP_STATUS_LOAD", "STORAGE_AREA_OVERLAP"]);
  });
});

describe("validateRegistry (properties)", () => {
  const slug = fc.stringMatching(/^[a-z][a-z0-9-]{0,15}$/).filter((id) => !RESERVED_IDS.includes(id));

  it("accepts any set of unique ids with their own prefixes", () => {
    // Property test: on failure copy `seed` + `path` into fc.assert(…, { seed, path, endOnFailure: true }) and add the counterexample above.
    fc.assert(
      fc.property(fc.uniqueArray(slug, { maxLength: 8 }), (ids) => {
        expect(validateRegistry(ids.map((id) => entry(id, { storage: { prefix: `${id}:` } })), SHELL).ok).toBe(true);
      }),
    );
  });

  it("never throws and never accepts overlapping prefixes or duplicate ids", () => {
    const area = fc.record({ prefix: fc.string({ maxLength: 6 }), extraKeys: fc.array(fc.string({ maxLength: 6 }), { maxLength: 3 }) });
    const line = fc.record({ id: fc.string({ maxLength: 8 }), storage: area });
    // Property test: on failure copy `seed` + `path` into fc.assert(…, { seed, path, endOnFailure: true }) and add the counterexample above.
    fc.assert(
      fc.property(fc.array(line, { maxLength: 6 }), (lines) => {
        const result = validateRegistry(lines.map(({ id, storage }) => entry(id, { storage })), SHELL);
        if (!result.ok) return result.errors.every((e) => e.message.length > 0);
        const prefixes = [SHELL.prefix, ...lines.map((l) => l.storage.prefix)];
        const ids = lines.map((l) => l.id);
        const isPrefixFree = prefixes.every((p, i) => prefixes.every((q, j) => i === j || !q.startsWith(p)));
        return new Set(ids).size === ids.length && isPrefixFree;
      }),
    );
  });
});
