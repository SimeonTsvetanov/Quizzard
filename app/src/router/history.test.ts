// The router's mark in history.state (PLAN T-05): read back exactly, foreign states ignored.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { readScreenState, readSubEntries, screenState } from "./history.ts";

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

describe("a mini-app's own entries below (quizzardSub)", () => {
  it("reads the count next to the router's mark, which stays readable", () => {
    const state = { ...screenState(true), quizzardSub: 3, quizzardQuiz: { screen: "editor" } };
    expect(readSubEntries(state)).toBe(3);
    expect(readScreenState(state)).toEqual({ homeBelow: true });
  });
  it.each([null, undefined, "x", {}, screenState(true), { quizzardSub: -1 }, { quizzardSub: 1.5 }, { quizzardSub: "2" }])("is 0 for the first entry and for anything that is not a count: %j", (state) => {
    expect(readSubEntries(state)).toBe(0);
  });
});
