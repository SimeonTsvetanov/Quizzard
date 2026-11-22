// The registry the shell ships must pass core's validateRegistry (PLAN T-05): this test is the
// production gate (main.ts validates at start only in development and the e2e build).
import { describe, expect, it } from "vitest";
import { probeEntry } from "../../test/fixtures/probe-entry.ts";
import { e2eEntries } from "./e2e-entries.ts";
import { SHELL_STORAGE_AREA, miniApps, openableIds, registryErrors } from "./registry.ts";

describe("mini-app registry", () => {
  it("the shipped registry is valid", () => {
    expect(registryErrors()).toEqual([]);
  });
  it("the e2e build's registry (shipped + probe) is valid", () => {
    expect(registryErrors([...miniApps, probeEntry])).toEqual([]);
  });
  it("the probe is registered only in the e2e build", () => {
    expect(e2eEntries).toEqual([]);
    expect(miniApps.map(({ meta }) => meta.id)).not.toContain("probe");
  });
  it("a broken registry is reported with stable codes", () => {
    const shellPrefix = { ...probeEntry, meta: { ...probeEntry.meta, id: "copy", storage: SHELL_STORAGE_AREA } };
    const codes = registryErrors([probeEntry, probeEntry, shellPrefix]).map(({ code }) => code);
    expect(codes).toContain("MINIAPP_ID_DUPLICATE");
    expect(codes).toContain("STORAGE_AREA_OVERLAP");
  });
  it("only ready mini-apps can be opened", () => {
    const coming = { meta: { ...probeEntry.meta, id: "later", status: "coming" as const, storage: { prefix: "later:v1:" } } };
    expect(openableIds([probeEntry, coming])).toEqual(["probe"]);
  });
});
