// @vitest-environment jsdom
// The moves that lose something (ui/guards.ts) and the Undo strip (ui/undo.ts): a team with points
// is removed only after "Remove", starting again asks when there are points and can be undone.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEnv } from "../src/env.ts";
import type { GameAction, GameState } from "../src/game/state.ts";
import { step } from "../src/game/step.ts";
import { guarded, pointsAtStake } from "../src/ui/guards.ts";
import { UNDO_MS, createUndoStrip } from "../src/ui/undo.ts";
import { newGame, quizFile } from "./helpers.ts";

/** A tiny player: the reducer, a root in the page and the guarded dispatch. */
function setup(start: GameState = newGame()): { root: HTMLElement; state: () => GameState; dispatch: (action: GameAction) => void; strip: ReturnType<typeof createUndoStrip> } {
  let state = start;
  const root = document.createElement("div");
  document.body.replaceChildren(root);
  const strip = createUndoStrip("Undo");
  root.append(strip.element);
  const env = createEnv({ file: quizFile([2, 1]), dispatch: () => undefined });
  const dispatch = guarded({ root, env, undo: strip, getState: () => state, move: (action) => { state = step(state, action); }, replace: (next) => { state = next; } });
  return { root, state: () => state, dispatch, strip };
}

const scored = (): GameState => step(newGame(), { type: "setScore", roundId: "r1", teamId: "t2", value: 3 });
const settle = (): Promise<void> => new Promise((resolve) => { setTimeout(resolve, 0); });

beforeEach(() => {
  // jsdom has no top layer: a modal dialog is "open" and nothing more.
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});
afterEach(() => { vi.useRealTimers(); });

describe("pointsAtStake", () => {
  it("adds every team's points and counts the teams that have any", () => {
    expect(pointsAtStake(newGame())).toEqual({ points: 0, teams: 0 });
    const game = step(step(scored(), { type: "setScore", roundId: "r2", teamId: "t2", value: 1 }), { type: "setScore", roundId: "r1", teamId: "t1", value: 2 });
    expect(pointsAtStake(game)).toEqual({ points: 6, teams: 2 });
  });
});

describe("guarded dispatch", () => {
  it("lets every ordinary move through and removes a team without points at once", () => {
    const player = setup();
    player.dispatch({ type: "next" });
    expect(player.state().index).toBe(1);
    player.dispatch({ type: "removeTeam", teamId: "t3" });
    expect(player.state().teams.map((team) => team.id)).toEqual(["t1", "t2"]);
    expect(player.root.querySelector("dialog")).toBeNull();
  });

  it("asks before removing a team that has points: Cancel keeps it, Remove removes it", async () => {
    const player = setup(scored());
    player.dispatch({ type: "removeTeam", teamId: "t2" });
    const dialog = player.root.querySelector("dialog");
    expect(dialog?.textContent).toContain("Remove Team 2?");
    expect(dialog?.textContent).toContain("Its 3 points in 1 round will be lost.");
    expect(document.activeElement?.getAttribute("data-confirm")).toBe("cancel");
    dialog?.querySelector<HTMLElement>('[data-confirm="cancel"]')?.click();
    await settle();
    expect(player.state().teams).toHaveLength(3);
    player.dispatch({ type: "removeTeam", teamId: "t2" });
    player.root.querySelector<HTMLElement>('[data-confirm="ok"]')?.click();
    await settle();
    expect(player.state().teams.map((team) => team.id)).toEqual(["t1", "t3"]);
    expect(player.root.querySelector("dialog")).toBeNull();
  });

  it("starting again with points asks with the numbers, then offers Undo that brings the whole game back", async () => {
    const before = step(scored(), { type: "next" });
    const player = setup(before);
    player.dispatch({ type: "restart" });
    expect(player.root.querySelector("dialog")?.textContent).toContain("This clears 3 points of 1 team");
    player.root.querySelector<HTMLElement>('[data-confirm="ok"]')?.click();
    await settle();
    expect(player.state().index).toBe(0);
    expect(pointsAtStake(player.state()).points).toBe(0);
    expect(player.strip.element.hidden).toBe(false);
    expect(player.strip.element.textContent).toContain("Scores cleared");
    player.strip.element.querySelector<HTMLElement>("[data-undo]")?.click();
    expect(player.state()).toBe(before);
    expect(player.strip.element.hidden).toBe(true);
  });

  it("starting again without points does not ask, and a game already at its start offers nothing", () => {
    const player = setup(step(newGame(), { type: "next" }));
    player.dispatch({ type: "restart" });
    expect(player.root.querySelector("dialog")).toBeNull();
    expect(player.state().index).toBe(0);
    expect(player.strip.element.textContent).toContain("The game starts again");
  });
});

describe("the Undo strip", () => {
  it("goes after ten seconds, waits while the focus is on it, and runs its action once", () => {
    vi.useFakeTimers();
    const strip = createUndoStrip("Undo");
    document.body.replaceChildren(strip.element);
    const run = vi.fn();
    strip.offer("Scores cleared", run);
    vi.advanceTimersByTime(UNDO_MS - 1);
    expect(strip.element.hidden).toBe(false);
    strip.element.dispatchEvent(new Event("focusin"));
    vi.advanceTimersByTime(UNDO_MS * 2);
    expect(strip.element.hidden).toBe(false); // reaching for it never loses it
    strip.element.dispatchEvent(new Event("focusout"));
    vi.advanceTimersByTime(UNDO_MS);
    expect(strip.element.hidden).toBe(true);
    strip.element.querySelector<HTMLElement>("[data-undo]")?.click();
    expect(run).not.toHaveBeenCalled(); // too late: the offer is gone
    strip.offer("Scores cleared", run);
    strip.element.querySelector<HTMLElement>("[data-undo]")?.click();
    strip.element.querySelector<HTMLElement>("[data-undo]")?.click();
    expect(run).toHaveBeenCalledTimes(1);
  });
});
