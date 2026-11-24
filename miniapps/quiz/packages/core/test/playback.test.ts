// A clip's playback as data: the commands of the host and what the playing window reports.
import { describe, expect, it } from "vitest";
import { type Playback, type PlaybackCommand, RESTING_PLAYBACK, clockText, playbackStep, playbackTick } from "../src/index.ts";

const run = (commands: readonly PlaybackCommand[], from: Playback = RESTING_PLAYBACK): Playback => commands.reduce(playbackStep, Object.freeze(from));

describe("playbackStep", () => {
  it("play, pause, toggle", () => {
    expect(run(["play"])).toMatchObject({ status: "playing", ms: 0, seq: 0 });
    expect(run(["play", "pause"]).status).toBe("paused");
    expect(run(["toggle"]).status).toBe("playing");
    expect(run(["toggle", "toggle"]).status).toBe("paused");
    expect(run(["toggle", "toggle", "toggle"]).status).toBe("playing");
  });

  it("commands that change nothing give the same object back", () => {
    const playing = run(["play"]);
    expect(playbackStep(playing, "play")).toBe(playing);
    expect(playbackStep(RESTING_PLAYBACK, "pause")).toBe(RESTING_PLAYBACK);
    expect(playbackStep(RESTING_PLAYBACK, "ended")).toBe(RESTING_PLAYBACK);
    expect(playbackStep(RESTING_PLAYBACK, "blocked")).toBe(RESTING_PLAYBACK);
    const paused = run(["play", "pause"]);
    expect(playbackStep(paused, "ended")).toBe(paused);
  });

  it("restart sends every window back to the start; play after the end does too", () => {
    const moved = playbackTick(run(["play"]), 4000);
    expect(playbackStep(moved, "restart")).toEqual({ status: "playing", ms: 0, seq: 1, zoom: false });
    const ended = playbackStep(moved, "ended");
    expect(ended).toMatchObject({ status: "ended", ms: 4000, seq: 0 });
    expect(playbackStep(ended, "play")).toEqual({ status: "playing", ms: 0, seq: 1, zoom: false });
    expect(playbackStep(ended, "toggle")).toMatchObject({ status: "playing", seq: 1 });
    expect(run(["restart", "restart"]).seq).toBe(2);
  });

  it("blocked: the window that plays wants a tap — play again clears it, pause and end leave it", () => {
    const blocked = run(["play", "blocked"]);
    expect(blocked.status).toBe("blocked");
    expect(playbackStep(blocked, "play").status).toBe("playing");
    expect(playbackStep(blocked, "toggle").status).toBe("paused");
    expect(playbackStep(blocked, "ended").status).toBe("ended");
  });

  it("zoom flips and leaves the clip alone", () => {
    expect(run(["zoom"])).toEqual({ ...RESTING_PLAYBACK, zoom: true });
    expect(run(["zoom", "zoom"])).toEqual(RESTING_PLAYBACK);
    expect(run(["play", "zoom"])).toMatchObject({ status: "playing", zoom: true });
    // "unzoom" (Escape) only ever leaves the zoom: the same object when there is none, the clip untouched.
    expect(run(["play", "zoom", "unzoom"])).toMatchObject({ status: "playing", zoom: false });
    expect(playbackStep(RESTING_PLAYBACK, "unzoom")).toBe(RESTING_PLAYBACK);
  });
});

describe("playbackTick", () => {
  it("moves a playing clip on, up to its length when known", () => {
    const playing = run(["play"]);
    expect(playbackTick(playing, 250).ms).toBe(250);
    expect(playbackTick(playbackTick(playing, 250), 250).ms).toBe(500);
    expect(playbackTick(playing, 9000, 2000).ms).toBe(2000);
    expect(playbackTick(playing, 9000, 0).ms).toBe(9000);
  });

  it("leaves everything else as it is", () => {
    for (const state of [RESTING_PLAYBACK, run(["play", "pause"]), run(["play", "ended"]), run(["play", "blocked"])]) expect(playbackTick(state, 500)).toBe(state);
    const playing = run(["play"]);
    for (const ms of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) expect(playbackTick(playing, ms)).toBe(playing);
  });
});

describe("clockText", () => {
  it("writes minutes and seconds", () => {
    expect([0, 7, 59.9, 60, 754, -3, Number.NaN].map(clockText)).toEqual(["0:00", "0:07", "0:59", "1:00", "12:34", "0:00", "0:00"]);
  });
});
