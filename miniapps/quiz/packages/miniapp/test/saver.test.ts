// The debounced writer (Q-02): one write a moment after the last change, at once on flush, in order.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createQuiz, createRegistries, renameQuiz, type Quiz } from "@simeonts/quizzard-quiz-core";
import { RESCUE_KEY, keepUnsaved, restoreUnsaved } from "../src/storage/rescue.ts";
import { SAVE_DELAY_MS, createSaver, type SaveState } from "../src/storage/saver.ts";

const quiz = createQuiz({ name: "Pub night", language: "en", now: "2026-11-23T10:00:00.000Z" });

/** A store that records what it is asked to write. */
function fakeStore(fail = false): { put: (written: Quiz) => Promise<Quiz>; names: string[] } {
  const names: string[] = [];
  return {
    names,
    put: (written) => {
      if (fail) return Promise.reject(new Error("QuotaExceededError"));
      names.push(written.name);
      return Promise.resolve(written);
    },
  };
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe("createSaver", () => {
  it("waits 300 ms after the last change and writes only the newest state", async () => {
    const store = fakeStore();
    const saver = createSaver({ store });
    saver.soon(renameQuiz(quiz, "A"), []);
    await vi.advanceTimersByTimeAsync(SAVE_DELAY_MS - 1);
    saver.soon(renameQuiz(quiz, "AB"), []);
    await vi.advanceTimersByTimeAsync(SAVE_DELAY_MS - 1);
    expect(store.names).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    expect(store.names).toEqual(["AB"]);
    expect(SAVE_DELAY_MS).toBe(300);
  });

  it("flush writes what is waiting at once (unmount, the page being hidden) and nothing twice", async () => {
    const store = fakeStore();
    const saver = createSaver({ store });
    saver.soon(renameQuiz(quiz, "Typed last"), []);
    await saver.flush();
    expect(store.names).toEqual(["Typed last"]);
    await vi.advanceTimersByTimeAsync(SAVE_DELAY_MS * 2);
    await saver.flush();
    expect(store.names).toEqual(["Typed last"]);
  });

  it("writes one after another, in the order of the changes", async () => {
    const order: string[] = [];
    let release: (() => void) | undefined;
    const slow = { put: (written: Quiz) => new Promise<Quiz>((resolve) => { order.push(`start ${written.name}`); release = () => { order.push(`end ${written.name}`); resolve(written); }; }) };
    const saver = createSaver({ store: slow });
    saver.soon(renameQuiz(quiz, "one"), []);
    const first = saver.flush();
    saver.soon(renameQuiz(quiz, "two"), []);
    const second = saver.flush();
    await Promise.resolve();
    expect(order).toEqual(["start one"]);
    release?.();
    await first;
    await Promise.resolve();
    release?.();
    await second;
    expect(order).toEqual(["start one", "end one", "start two", "end two"]);
  });

  it("tells the tick: saving while a change waits, saved once it is stored", async () => {
    const states: SaveState[] = [];
    const saver = createSaver({ store: fakeStore(), onState: (state) => states.push(state) });
    expect(saver.state).toBe("idle");
    saver.soon(quiz, []);
    saver.soon(quiz, []);
    expect(states).toEqual(["saving"]);
    await vi.advanceTimersByTimeAsync(SAVE_DELAY_MS);
    expect(states).toEqual(["saving", "saved"]);
    expect(saver.state).toBe("saved");
  });

  it("a refused write is an error, never a silent loss; the next change tries again", async () => {
    const states: SaveState[] = [];
    const saver = createSaver({ store: fakeStore(true), onState: (state) => states.push(state) });
    saver.soon(quiz, []);
    await saver.flush();
    expect(states).toEqual(["saving", "error"]);
    saver.soon(quiz, []);
    expect(saver.state).toBe("saving");
  });

  it("cancel drops what is waiting (the quiz was deleted)", async () => {
    const store = fakeStore();
    const saver = createSaver({ store });
    saver.soon(quiz, []);
    saver.cancel();
    await vi.advanceTimersByTimeAsync(SAVE_DELAY_MS * 2);
    await saver.flush();
    expect(store.names).toEqual([]);
  });
});

describe("the change a closing page must not lose (storage/rescue.ts)", () => {
  /** The host's preferences of the area, in memory. */
  function fakePrefs(): { get<T>(key: string, fallback: T): T; set(key: string, value: unknown): boolean; remove(key: string): void; data: Map<string, string> } {
    const data = new Map<string, string>();
    return {
      data,
      get: <T,>(key: string, fallback: T): T => (data.has(key) ? (JSON.parse(data.get(key) ?? "null") as T) : fallback),
      set: (key, value) => { data.set(key, JSON.stringify(value)); return true; },
      remove: (key) => { data.delete(key); },
    };
  }

  it("the saver knows what is not stored yet: waiting, or being written", async () => {
    let release: (() => void) | undefined;
    const slow = { put: (written: Quiz) => new Promise<Quiz>((resolve) => { release = () => { resolve(written); }; }) };
    const saver = createSaver({ store: slow });
    expect(saver.unsaved()).toBeNull();
    saver.soon(renameQuiz(quiz, "Typed"), []);
    expect(saver.unsaved()?.quiz.name).toBe("Typed");
    const written = saver.flush();
    await Promise.resolve();
    expect(saver.unsaved()?.quiz.name).toBe("Typed"); // on its way, not there yet
    release?.();
    await written;
    expect(saver.unsaved()).toBeNull();
  });

  it("is kept as a quiz file, written into the library at the next start, then forgotten", async () => {
    const prefs = fakePrefs();
    keepUnsaved(prefs, { quiz: renameQuiz(quiz, "Typed last"), media: [] });
    expect(JSON.parse(prefs.data.get(RESCUE_KEY) ?? "{}")).toMatchObject({ format: "quizzard-quiz", version: 1, quiz: { name: "Typed last" } });
    const restored: string[] = [];
    await restoreUnsaved(prefs, { restore: (stored) => { restored.push(stored.quiz.name); return Promise.resolve(); } }, createRegistries());
    expect(restored).toEqual(["Typed last"]);
    expect(prefs.data.size).toBe(0);
    await restoreUnsaved(prefs, { restore: () => Promise.reject(new Error("must not be called")) }, createRegistries());
  });

  it("is removed once the change is stored, and something unreadable is dropped, never written", async () => {
    const prefs = fakePrefs();
    keepUnsaved(prefs, { quiz, media: [] });
    keepUnsaved(prefs, null);
    expect(prefs.data.size).toBe(0);
    prefs.set(RESCUE_KEY, { format: "quizzard-quiz", version: 99, quiz: {} });
    const restored: string[] = [];
    await restoreUnsaved(prefs, { restore: (stored) => { restored.push(stored.quiz.name); return Promise.resolve(); } }, createRegistries());
    expect(restored).toEqual([]);
    expect(prefs.data.size).toBe(0);
  });
});
