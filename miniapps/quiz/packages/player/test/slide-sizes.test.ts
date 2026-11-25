// The size steps of the texts that can be long (render/slide.ts): each steps down by its length, so
// the slide's parts never run into each other (Moni 2026-11-25).
import { describe, expect, it } from "vitest";
import { answerSize, explanationSize, promptSize } from "../src/render/slide.ts";

describe("size steps by length", () => {
  it("a revealed answer: short up to 22 characters, middle up to 48, long after", () => {
    expect(answerSize("The Seine")).toBe("s");
    expect(answerSize("x".repeat(22))).toBe("s");
    expect(answerSize("x".repeat(23))).toBe("m");
    expect(answerSize("Positive drive (чрез търговското име Pozidriv)")).toBe("m");
    expect(answerSize("x".repeat(48))).toBe("m");
    expect(answerSize("x".repeat(49))).toBe("l");
  });

  it("an explanation: the usual size up to 140 characters, smaller up to 300, smallest after", () => {
    expect(explanationSize("x".repeat(140))).toBe("s");
    expect(explanationSize("x".repeat(141))).toBe("m");
    expect(explanationSize("x".repeat(300))).toBe("m");
    expect(explanationSize("x".repeat(301))).toBe("l");
  });

  it("a question keeps its four steps", () => {
    expect(["x".repeat(70), "x".repeat(71), "x".repeat(161), "x".repeat(321)].map(promptSize)).toEqual(["l", "m", "s", "xs"]);
  });
});
