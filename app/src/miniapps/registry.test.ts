// The registry the shell ships must pass core's validateRegistry (PLAN T-05): this test is the
// production gate (main.ts validates at start only in development and the e2e build).
import { describe, expect, it } from "vitest";
import { e2eEntries as e2eBuildEntries, probeEntry } from "../../test/fixtures/probe-entry.ts";
import { meta as teamsMeta } from "@simeonts/teamsync-random-team-generator-miniapp/meta";
import { meta as scoresMeta } from "gg-counter-miniapp/meta";
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
  it("ships teams, scores and sheet ready and one coming card: quiz", () => {
    expect(miniApps.map(({ meta }) => [meta.id, meta.status])).toEqual([["teams", "ready"], ["scores", "ready"], ["sheet", "ready"], ["quiz", "coming"]]);
    expect(openableIds()).toEqual(["teams", "scores", "sheet"]);
  });
  it("teams is the vendored package's own meta (one source) and loads its body and Help lazily", async () => {
    const teams = miniApps.find(({ meta }) => meta.id === "teams");
    expect(teams?.meta).toBe(teamsMeta);
    expect(teams?.meta).toMatchObject({ name: { en: "Teams", bg: "Отбори" }, icon: "miniapps/teams.svg", languages: ["en", "bg"] });
    const help = await teams?.help?.();
    expect(help?.default.en.steps.length).toBeGreaterThan(0);
    expect(help?.default.bg?.steps).toHaveLength(help?.default.en.steps.length ?? -1);
  });
  it("scores is the vendored package's own meta (one source) and loads its body and Help lazily", async () => {
    const scores = miniApps.find(({ meta }) => meta.id === "scores");
    expect(scores?.meta).toBe(scoresMeta);
    expect(scores?.meta).toMatchObject({ name: { en: "Scores", bg: "Точки" }, icon: "miniapps/scores.svg", languages: ["en", "bg"] });
    const help = await scores?.help?.();
    expect(help?.default.en.steps.length).toBeGreaterThan(0);
    expect(help?.default.bg?.steps).toHaveLength(help?.default.en.steps.length ?? -1);
  });
  it("every tool has its own area, apart from the standalone sites' keys (DECISIONS 2026-11-23)", () => {
    const areas = Object.fromEntries(miniApps.map(({ meta }) => [meta.id, meta.storage]));
    expect(areas).toEqual({
      teams: { prefix: "quizzard-teams:v1:" },
      scores: { prefix: "quizzard-scores:v1:" },
      sheet: { prefix: "quizzard-sheet:v1:" },
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
    expect([...launchQuery(teams, query)]).toEqual([
      ["teams", "4"], ["teams", "5"],
      ["attribution-name", "Quizzard"], ["attribution-url", "https://simeontsvetanov.github.io/Quizzard/"],
    ]);
    // A link cannot name another app or turn the host's parameters into its own.
    const forged = launchQuery(teams, new URLSearchParams("attribution-name=Evil&attribution-url=https://evil.example/&shuffle-count=off"));
    expect(forged.get("attribution-name")).toBe("Quizzard");
    expect(forged.get("attribution-url")).toBe("https://simeontsvetanov.github.io/Quizzard/");
    expect(forged.has("shuffle-count")).toBe(false);
    expect([...query]).toHaveLength(4); // the router's object is not changed
  });
  it("scores gets no launch parameter (its screen reads none)", () => {
    const scores = miniApps.find(({ meta }) => meta.id === "scores");
    if (scores === undefined) throw new Error("scores is not registered");
    expect([...launchQuery(scores, new URLSearchParams("teams=4&embed=1&attribution-name=Evil"))]).toEqual([
      ["attribution-name", "Quizzard"], ["attribution-url", "https://simeontsvetanov.github.io/Quizzard/"],
    ]);
  });
  it("a mini-app without a parameter list gets the whole query, as a copy", () => {
    const query = new URLSearchParams("step=2&x=y");
    const passed = launchQuery(probeEntry, query);
    expect([...passed]).toEqual([["step", "2"], ["x", "y"]]);
    expect(passed).not.toBe(query);
  });
});
