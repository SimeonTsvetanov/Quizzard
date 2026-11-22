// The router's mark in history.state (PLAN T-05): read back exactly, foreign states ignored.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { readScreenState, screenState } from "./history.ts";

describe("screen state in history.state", () => {
  it.each([true, false])("round-trips homeBelow = %s", (homeBelow) => {
    expect(readScreenState(screenState(homeBelow))).toEqual({ homeBelow });
  });
  it.each([null, undefined, 1, "x", {}, { quizzardScreen: null }, { quizzardScreen: { homeBelow: "yes" } }])(
    "ignores a state the router did not write: %j",
    (state) => {
      expect(readScreenState(state)).toBeNull();
    },
  );
  it("never throws and returns a boolean mark or null for any value", () => {
    fc.assert(fc.property(fc.anything(), (state) => {
      const read = readScreenState(state);
      expect(read === null || typeof read.homeBelow === "boolean").toBe(true);
    }));
  });
});
