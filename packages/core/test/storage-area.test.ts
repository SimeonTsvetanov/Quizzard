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
