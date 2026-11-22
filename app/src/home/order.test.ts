// Home order (PLAN T-07): last used first, ready before coming, registry order otherwise.
import type { MiniAppEntry } from "@simeonts/quizzard-core";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { orderForHome } from "./order.ts";

const entry = (id: string, status: "ready" | "coming"): MiniAppEntry => ({
  meta: {
    contract: 1,
    id,
    name: { en: id },
    tagline: { en: `${id} tagline` },
    icon: "logo.svg",
    languages: ["en"],
    status,
    storage: { prefix: `${id}:v1:` },
  },
  ...(status === "ready" ? { load: () => Promise.reject(new Error("not loaded in tests")) } : {}),
});

const ids = (entries: readonly MiniAppEntry[]): string[] => entries.map(({ meta }) => meta.id);

const registry = [entry("teams", "coming"), entry("alpha", "ready"), entry("quiz", "coming"), entry("beta", "ready"), entry("gamma", "ready")];

describe("orderForHome", () => {
  it("nothing used yet → ready ones in registry order, then coming ones", () => {
    expect(ids(orderForHome(registry, null))).toEqual(["alpha", "beta", "gamma", "teams", "quiz"]);
  });
  it("the last used ready mini-app comes first, the others keep registry order", () => {
    expect(ids(orderForHome(registry, "gamma"))).toEqual(["gamma", "alpha", "beta", "teams", "quiz"]);
    expect(ids(orderForHome(registry, "alpha"))).toEqual(["alpha", "beta", "gamma", "teams", "quiz"]);
  });
  it("a coming or unknown last-used id changes nothing", () => {
    expect(ids(orderForHome(registry, "quiz"))).toEqual(["alpha", "beta", "gamma", "teams", "quiz"]);
    expect(ids(orderForHome(registry, "gone"))).toEqual(["alpha", "beta", "gamma", "teams", "quiz"]);
  });
  it("only coming entries (the production registry today) → registry order", () => {
    const coming = [entry("teams", "coming"), entry("scores", "coming"), entry("quiz", "coming")];
    expect(ids(orderForHome(coming, "scores"))).toEqual(["teams", "scores", "quiz"]);
  });
  it("does not change its input", () => {
    const before = ids(registry);
    orderForHome(registry, "beta");
    expect(ids(registry)).toEqual(before);
  });

  it("property: a permutation with every ready card before every coming card, last used first", () => {
    const registries = fc
      .uniqueArray(fc.tuple(fc.stringMatching(/^[a-z][a-z0-9-]{0,8}$/), fc.boolean()), { selector: ([id]) => id, maxLength: 14 })
      .map((lines) => lines.map(([id, isReady]) => entry(id, isReady ? "ready" : "coming")));
    fc.assert(
      fc.property(registries, fc.option(fc.string({ maxLength: 10 }), { nil: null }), (input, lastUsedId) => {
        const output = orderForHome(input, lastUsedId);
        expect([...ids(output)].sort()).toEqual([...ids(input)].sort());
        const firstComing = output.findIndex(({ meta }) => meta.status === "coming");
        if (firstComing !== -1) expect(output.slice(firstComing).every(({ meta }) => meta.status === "coming")).toBe(true);
        const lastUsed = input.find(({ meta }) => meta.id === lastUsedId && meta.status === "ready");
        if (lastUsed !== undefined) expect(output[0]).toBe(lastUsed);
      }),
    );
  });
});
