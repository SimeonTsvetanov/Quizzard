import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { MAX_HASH_LENGTH, isRouteSlug, parseRoute, routeHref, type ParsedRoute, type Route } from "../src/index.js";

const KNOWN: readonly string[] = ["teams", "scores", "quiz"];

/** Route as plain data, so `URLSearchParams` compares by its entries. */
function plain(route: ParsedRoute): unknown {
  return route.kind === "miniapp" ? { ...route, query: [...route.query] } : route;
}

describe("parseRoute", () => {
  it.each(["", "#", "#/", "/", "#/?from=shortcut"])("returns home for %j", (hash) => {
    expect(parseRoute(hash, KNOWN)).toEqual({ kind: "home" });
  });

  it("returns a mini-app with its launch query for #/teams?teams=4", () => {
    const route = parseRoute("#/teams?teams=4", KNOWN);
    expect(plain(route)).toEqual({ kind: "miniapp", id: "teams", query: [["teams", "4"]] });
  });

  it("returns a mini-app with an empty query for #/scores", () => {
    expect(plain(parseRoute("#/scores", KNOWN))).toEqual({ kind: "miniapp", id: "scores", query: [] });
  });

  it("accepts the hash without its leading #", () => {
    expect(parseRoute("/quiz", KNOWN)).toMatchObject({ kind: "miniapp", id: "quiz" });
  });

  it.each(["#help", "#settings", "#whats-new", "#main"])("returns a dialog link for %j", (hash) => {
    expect(parseRoute(hash, KNOWN)).toEqual({ kind: "dialog", name: hash.slice(1) });
  });

  it.each([
    "#/unknown",
    "#/Teams",
    "#/teams/",
    "#/teams/extra",
    "#//teams",
    "#/../teams",
    "#/teams%2F..",
    "#/%74eams",
    "#/teams#x",
    "##help",
    "#Help",
    "#help me",
    "#<script>alert(1)</script>",
    "#/<script>alert(1)</script>",
    "#javascript:alert(1)",
    "#/javascript:alert(1)",
    `#${"a".repeat(41)}`,
  ])("returns unknown for %j", (hash) => {
    expect(parseRoute(hash, KNOWN)).toEqual({ kind: "unknown" });
  });

  it("returns unknown above MAX_HASH_LENGTH even for a known id", () => {
    expect(parseRoute(`#/teams?q=${"a".repeat(MAX_HASH_LENGTH)}`, KNOWN)).toEqual({ kind: "unknown" });
  });

  it("never returns an id that is not known, even when it is a valid slug", () => {
    expect(parseRoute("#/teams", ["scores"])).toEqual({ kind: "unknown" });
  });

  it("ignores a known id that is not a route slug", () => {
    expect(parseRoute("#/a/b", ["a/b"])).toEqual({ kind: "unknown" });
  });
});

describe("routeHref", () => {
  it("builds #/ for home", () => {
    expect(routeHref({ kind: "home" })).toBe("#/");
  });

  it("builds a mini-app hash with an encoded query", () => {
    const query = new URLSearchParams([["teams", "4"], ["names", "Ana & Bo"]]);
    expect(routeHref({ kind: "miniapp", id: "teams", query })).toBe("#/teams?teams=4&names=Ana+%26+Bo");
  });

  it("omits ? when the query is empty", () => {
    expect(routeHref({ kind: "miniapp", id: "scores", query: new URLSearchParams() })).toBe("#/scores");
  });

  it("builds a dialog hash", () => {
    expect(routeHref({ kind: "dialog", name: "help" })).toBe("#help");
  });

  it("throws for an id or name that is not a route slug (programming error)", () => {
    expect(() => routeHref({ kind: "miniapp", id: "../x", query: new URLSearchParams() })).toThrow(/Not a route slug/);
    expect(() => routeHref({ kind: "dialog", name: "/help" })).toThrow(/Not a route slug/);
  });
});

describe("isRouteSlug", () => {
  it("accepts lower-case kebab slugs up to 40 characters", () => {
    expect(isRouteSlug("whats-new")).toBe(true);
    expect(isRouteSlug(`a${"b".repeat(39)}`)).toBe(true);
  });
  it.each(["", "1teams", "-teams", "Teams", "te ams", "te_ams", `a${"b".repeat(40)}`])("rejects %j", (value) => {
    expect(isRouteSlug(value)).toBe(false);
  });
});

describe("routes (properties)", () => {
  const slug = fc.stringMatching(/^[a-z][a-z0-9-]{0,39}$/);
  const text = fc.string({ unit: "grapheme", maxLength: 12 });
  const route: fc.Arbitrary<Route> = fc.oneof(
    fc.constant<Route>({ kind: "home" }),
    fc.record({ id: slug, entries: fc.array(fc.tuple(text, text), { maxLength: 4 }) })
      .map(({ id, entries }): Route => ({ kind: "miniapp", id, query: new URLSearchParams(entries) })),
    slug.map((name): Route => ({ kind: "dialog", name })),
  );

  it("parseRoute(routeHref(r)) equals r", () => {
    // Property test: on failure copy `seed` + `path` into fc.assert(…, { seed, path, endOnFailure: true }) and add the counterexample above.
    fc.assert(
      fc.property(route, (r) => {
        const href = routeHref(r);
        fc.pre(href.length <= MAX_HASH_LENGTH);
        const known = r.kind === "miniapp" ? [r.id] : [];
        expect(plain(parseRoute(href, known))).toEqual(plain(r));
      }),
    );
  });

  it("never throws on hostile input and never yields an id outside knownIds", () => {
    const hostile = fc.oneof(
      fc.string({ unit: "binary", maxLength: 3000 }),
      fc.array(fc.constantFrom("#", "/", "?", "..", "%2F", "%2f", "teams", "Teams", "<script>", "&", "=", "#/", "\u0000"), { maxLength: 30 })
        .map((parts) => parts.join("")),
      fc.string({ unit: "binary", maxLength: 50 }).map((s) => `#/${s}`),
    );
    // Property test: on failure copy `seed` + `path` into fc.assert(…, { seed, path, endOnFailure: true }) and add the counterexample above.
    fc.assert(
      fc.property(hostile, (hash) => {
        const parsed = parseRoute(hash, KNOWN);
        if (parsed.kind === "miniapp") return KNOWN.includes(parsed.id);
        if (parsed.kind === "dialog") return isRouteSlug(parsed.name);
        return true;
      }),
    );
  });
});
