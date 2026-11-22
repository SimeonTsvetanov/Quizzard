// The registry the shell ships must pass core's validateRegistry (PLAN T-05): this test is the
// production gate (main.ts validates at start only in development and the e2e build).
import { describe, expect, it } from "vitest";
import { e2eEntries as e2eBuildEntries, probeEntry } from "../../test/fixtures/probe-entry.ts";
import { meta as teamsMeta } from "@simeonts/teamsync-random-team-generator-miniapp/meta";
import { e2eEntries } from "./e2e-entries.ts";
import { SHELL_STORAGE_AREA, launchQuery, miniApps, openableIds, registryErrors } from "./registry.ts";

describe("mini-app registry", () => {
  it("the shipped registry is valid", () => {
    expect(registryErrors()).toEqual([]);
  });
  it("the e2e build's registry (shipped + probe + Home fixtures) is valid and fills Home to 12 cards", () => {
    const e2eRegistry = [...miniApps, ...e2eBuildEntries];
    expect(registryErrors(e2eRegistry)).toEqual([]);
    expect(e2eRegistry).toHaveLength(12);
  });
  it("ships teams ready (PLAN T-10) and two coming cards: scores, quiz", () => {
    expect(miniApps.map(({ meta }) => [meta.id, meta.status])).toEqual([["teams", "ready"], ["scores", "coming"], ["quiz", "coming"]]);
    expect(openableIds()).toEqual(["teams"]);
  });
  it("teams is the vendored package's own meta (one source) and loads its body and Help lazily", async () => {
    const teams = miniApps.find(({ meta }) => meta.id === "teams");
    expect(teams?.meta).toBe(teamsMeta);
    expect(teams?.meta).toMatchObject({ name: { en: "Teams", bg: "Отбори" }, icon: "miniapps/teams.svg", languages: ["en", "bg"] });
    const help = await teams?.help?.();
    expect(help?.default.en.steps.length).toBeGreaterThan(0);
    expect(help?.default.bg?.steps).toHaveLength(help?.default.en.steps.length ?? -1);
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
  it("teams gets only its launch parameter; a share-target text or embed flag stays out", () => {
    const teams = miniApps.find(({ meta }) => meta.id === "teams");
    if (teams === undefined) throw new Error("teams is not registered");
    const query = new URLSearchParams("teams=4&shared=Eve%0AFrank&embed=1&teams=5");
    expect([...launchQuery(teams, query)]).toEqual([["teams", "4"], ["teams", "5"]]);
    expect([...query]).toHaveLength(4); // the router's object is not changed
  });
  it("a mini-app without a parameter list gets the whole query, as a copy", () => {
    const query = new URLSearchParams("step=2&x=y");
    const passed = launchQuery(probeEntry, query);
    expect([...passed]).toEqual([["step", "2"], ["x", "y"]]);
    expect(passed).not.toBe(query);
  });
});
