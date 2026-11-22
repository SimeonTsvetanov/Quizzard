import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { MAX_PREF_KEY_LENGTH, isPrefKey } from "../src/index.js";

describe("isPrefKey", () => {
  it.each(["theme", "last-seen-version", "draft_names", "v1.2", "a", "A9"])("accepts %j", (key) => {
    expect(isPrefKey(key)).toBe(true);
  });

  it.each([
    "",
    ":theme",
    "v2:state",
    "theme:",
    "../theme",
    "a/b",
    "a\\b",
    "a b",
    " theme",
    "theme\n",
    "the\u0000me",
    "-theme",
    "theme.",
    "тема",
    "x".repeat(MAX_PREF_KEY_LENGTH + 1),
  ])("rejects %j (could leave or blur the area's namespace)", (key) => {
    expect(isPrefKey(key)).toBe(false);
  });

  it("accepts a key of exactly the maximum length", () => {
    expect(isPrefKey("x".repeat(MAX_PREF_KEY_LENGTH))).toBe(true);
  });

  it("never throws, and an accepted key has no separator, path or control character and fits the limit", () => {
    fc.assert(
      fc.property(fc.string({ unit: "binary", maxLength: 80 }), (key) => {
        if (!isPrefKey(key)) return;
        expect(key.length).toBeGreaterThan(0);
        expect(key.length).toBeLessThanOrEqual(MAX_PREF_KEY_LENGTH);
        expect(key).toMatch(/^[A-Za-z0-9._-]+$/);
        expect(key).not.toMatch(/^[._-]|[._-]$/);
      }),
    );
  });
});

describe("ownsKey and areaBytes", () => {
  const area = { prefix: "gg-counter:v1:", extraKeys: ["gg-counter/state"] };

  it("owns keys under the prefix and the extra keys, nothing else", async () => {
    const { ownsKey } = await import("../src/index.js");
    expect(ownsKey(area, "gg-counter:v1:state")).toBe(true);
    expect(ownsKey(area, "gg-counter/state")).toBe(true);
    expect(ownsKey(area, "gg-counter-theme")).toBe(false);
    expect(ownsKey(area, "quizzard:v1:theme")).toBe(false);
  });

  it("counts two bytes per code unit of own keys and values only", async () => {
    const { areaBytes } = await import("../src/index.js");
    expect(areaBytes(area, [["gg-counter:v1:a", "12345"], ["quizzard:v1:theme", "dark"], ["gg-counter/state", ""]])).toBe((15 + 5 + 16) * 2);
  });

  it("never counts a key the area does not own", async () => {
    const { areaBytes, ownsKey } = await import("../src/index.js");
    fc.assert(fc.property(fc.array(fc.tuple(fc.string({ maxLength: 30 }), fc.string({ maxLength: 30 }))), (entries) => {
      const own = entries.filter(([key]) => ownsKey(area, key));
      expect(areaBytes(area, entries)).toBe(areaBytes(area, own));
    }));
  });
});
