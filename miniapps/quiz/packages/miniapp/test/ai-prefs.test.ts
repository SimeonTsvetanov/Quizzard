// What the AI windows remember (storage/ai-prefs.ts): every value read back through a check.
import { describe, expect, it } from "vitest";
import { readAssistant, readCount, readLastJob, readWishes, writeAssistant, writeLastJob, writeWishes } from "../src/storage/ai-prefs.ts";

/** The contract's small preferences, in memory. */
function prefs(start: Record<string, unknown> = {}): { get<T>(key: string, fallback: T): T; set(key: string, value: unknown): boolean } {
  const kept = new Map(Object.entries(start));
  return {
    get: <T,>(key: string, fallback: T): T => (kept.has(key) ? (kept.get(key) as T) : fallback),
    set: (key, value) => {
      kept.set(key, value);
      return true;
    },
  };
}

describe("what the AI windows remember", () => {
  it("reads defaults when nothing or something broken is kept", () => {
    expect(readWishes(prefs()).rounds).toBe(3);
    const odd = readWishes(prefs({ "ai.wishes": { audience: "aliens", rounds: 99, answers: ["nope"], specials: "safe", topic: 7, pictures: "yes" } }));
    expect(odd).toMatchObject({ audience: "friends", rounds: 3, answers: ["open", "choice", "trueFalse"], specials: [], topic: "", pictures: false });
    expect(readWishes(prefs({ "ai.wishes": [1, 2] })).audience).toBe("friends");
  });

  it("keeps only what a form shows; the rest stays as it was", () => {
    const store = prefs();
    writeWishes(store, { topic: "Space", rounds: 5 });
    writeWishes(store, { topic: "Rivers" });
    expect(readWishes(store)).toMatchObject({ topic: "Rivers", rounds: 5 });
  });

  it("reads a known assistant, a count from its list and the last job, else the fallback", () => {
    const store = prefs({ "ai.assistant": "skynet", "ai.count": 7, "ai.lastJob": { kind: "rounds", quizId: "q1", roundId: "" } });
    expect(readAssistant(store)).toBe("chatgpt");
    expect(readCount(store)).toBe(5);
    expect(readLastJob(store)).toEqual({ kind: "rounds", quizId: "q1" });
    writeAssistant(store, "gemini");
    writeLastJob(store, { kind: "questions", quizId: "q1", roundId: "r2" });
    expect(readAssistant(store)).toBe("gemini");
    expect(readLastJob(store)).toEqual({ kind: "questions", quizId: "q1", roundId: "r2" });
    expect(readLastJob(prefs({ "ai.lastJob": "x" }))).toEqual({ kind: "quiz" });
  });
});
