// @vitest-environment jsdom
// A language change starts a player in the place of the one that ran (play.ts). The game goes from
// the one to the other as it is, never through storage: a page opened from a file may have none, and
// storage keeps neither a break nor a running timer.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPlayer } from "../src/play.ts";
import { quizFile } from "./helpers.ts";

// jsdom has no ResizeObserver (the stage watches its own size); nothing here depends on a size.
class NoResize {
  observe(): void { /* not needed */ }
  unobserve(): void { /* not needed */ }
  disconnect(): void { /* not needed */ }
}
beforeEach(() => { vi.stubGlobal("ResizeObserver", NoResize); });

/** Lets the microtask in which the players change places run. */
const settle = (): Promise<void> => new Promise((resolve) => { setTimeout(resolve, 0); });

describe("changing the language while playing", () => {
  it("keeps the points, the place and a break when storage refuses every read and write", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    const storage = { load: (): unknown => { throw new Error("no storage"); }, save: (): void => { throw new Error("no storage"); } };
    const player = createPlayer({ root, file: quizFile([2]), storage });
    player.dispatch({ type: "next" });
    player.dispatch({ type: "next" });
    const before = player.getState();
    const [team] = before.teams;
    const roundId = before.screens[before.index]?.roundId ?? "";
    player.dispatch({ type: "setScore", roundId, teamId: team?.id ?? "", value: 4 });
    player.dispatch({ type: "break", minutes: 5 });
    player.dispatch({ type: "setLang", lang: "bg" });
    await settle();
    const after = player.getState();
    expect(root.lang).toBe("bg");
    expect(after.index).toBe(before.index);
    expect(after.scores[roundId]?.[team?.id ?? ""]).toBe(4);
    expect(after.curtain).toMatchObject({ kind: "break", totalMs: 300_000 });
    expect(after.lang).toBe("bg");
    player.destroy();
    root.remove();
  });
});
