// The persist hook (PLAN T-06 → T-15): today a no-op that must not touch storage or ask the browser.
import { afterEach, describe, expect, it, vi } from "vitest";
import { noteDataSaved } from "./persist.ts";

afterEach(() => { vi.unstubAllGlobals(); });

describe("noteDataSaved", () => {
  it("does not ask for persistent storage and writes nothing yet (PLAN T-15 adds that)", () => {
    const persist = vi.fn(() => Promise.resolve(true));
    const setItem = vi.fn();
    vi.stubGlobal("navigator", { storage: { persist, persisted: () => Promise.resolve(false) } });
    vi.stubGlobal("localStorage", { setItem, getItem: () => null });
    noteDataSaved();
    noteDataSaved();
    expect(persist).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });
});
