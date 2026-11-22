// The registry the shell ships must pass core's validateRegistry (PLAN T-05): this test is the
// production gate (main.ts validates at start only in development and the e2e build).
import { describe, expect, it } from "vitest";
import { e2eEntries as e2eBuildEntries, probeEntry } from "../../test/fixtures/probe-entry.ts";
import { e2eEntries } from "./e2e-entries.ts";
import { SHELL_STORAGE_AREA, miniApps, openableIds, registryErrors } from "./registry.ts";

describe("mini-app registry", () => {
  it("the shipped registry is valid", () => {
    expect(registryErrors()).toEqual([]);
  });
  it("the e2e build's registry (shipped + probe + Home fixtures) is valid and fills Home to 12 cards", () => {
    const e2eRegistry = [...miniApps, ...e2eBuildEntries];
    expect(registryErrors(e2eRegistry)).toEqual([]);
    expect(e2eRegistry).toHaveLength(12);
  });
  it("ships exactly three coming cards: teams, scores, quiz (PLAN T-07)", () => {
    expect(miniApps.map(({ meta }) => [meta.id, meta.status])).toEqual([["teams", "coming"], ["scores", "coming"], ["quiz", "coming"]]);
    expect(openableIds()).toEqual([]);
  });
  it("the shipped areas are the standalone apps' real keys (SPEC F7)", () => {
    const areas = Object.fromEntries(miniApps.map(({ meta }) => [meta.id, meta.storage]));
    expect(areas).toEqual({
      teams: { prefix: "teamsync-random-team-generator:v1:" },
      scores: { prefix: "gg-counter:v1:", extraKeys: ["gg-counter/state", "gg-counter-theme"] },
      quiz: { prefix: "quizzard-quiz:v1:" },
    });
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
