// The busy gate (state.ts): who keeps the update offer waiting, and when the app becomes idle.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { nextBusyOwners } from "./state.ts";

const a = Symbol("a");
const b = Symbol("b");

describe("nextBusyOwners", () => {
  it("one owner busy then idle → idle once", () => {
    const busy = nextBusyOwners(new Set(), a, true);
    expect(busy).toEqual({ owners: new Set([a]), becameIdle: false });
    expect(nextBusyOwners(busy.owners, a, false)).toEqual({ owners: new Set(), becameIdle: true });
  });

  it("stays busy while a second owner is busy", () => {
    const owners = new Set([a, b]);
    expect(nextBusyOwners(owners, a, false)).toEqual({ owners: new Set([b]), becameIdle: false });
  });

  it("an owner that was never busy going idle is no change (an unmount without setBusy)", () => {
    expect(nextBusyOwners(new Set(), a, false).becameIdle).toBe(false);
    expect(nextBusyOwners(new Set([b]), a, false)).toEqual({ owners: new Set([b]), becameIdle: false });
  });

  it("never changes its input; idle only when something was busy and nothing is", () => {
    const owners = [a, b, Symbol("c")];
    fc.assert(
      fc.property(fc.uniqueArray(fc.constantFrom(...owners)), fc.constantFrom(...owners), fc.boolean(), (start, owner, isBusy) => {
        const before = new Set(start);
        const change = nextBusyOwners(before, owner, isBusy);
        expect(before).toEqual(new Set(start));
        expect(change.owners.has(owner)).toBe(isBusy);
        expect(change.becameIdle).toBe(before.size > 0 && change.owners.size === 0);
      }),
    );
  });
});
