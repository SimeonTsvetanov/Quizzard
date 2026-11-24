import { describe, expect, it } from "vitest";
import { createRegistries, createRegistry, defaultRegistries, randomId, sequentialIds, textKind } from "../src/index.ts";

describe("createRegistry", () => {
  it("registers, finds and lists entries in registration order", () => {
    const registry = createRegistry([{ id: "b" }, { id: "a" }]);
    registry.register({ id: "c" });
    expect(registry.list().map((entry) => entry.id)).toEqual(["b", "a", "c"]);
    expect(registry.has("a")).toBe(true);
    expect(registry.has("z")).toBe(false);
    expect(registry.get("c")).toEqual({ id: "c" });
    expect(registry.get("z")).toBeUndefined();
  });

  it("refuses a second entry with the same id", () => {
    const registry = createRegistry([{ id: "a" }]);
    expect(() => {
      registry.register({ id: "a" });
    }).toThrow(/already registered/);
  });

  it("list() is a copy: changing it does not change the registry", () => {
    const registry = createRegistry([{ id: "a" }]);
    (registry.list() as { id: string }[]).pop();
    expect(registry.has("a")).toBe(true);
  });
});

describe("the built-in registries", () => {
  it("have the four question kinds, five answer types (two kept for the special rounds) and three round kinds", () => {
    const { kinds, answers, rounds } = createRegistries();
    expect(kinds.list().map((kind) => kind.id)).toEqual(["text", "picture", "audio", "video"]);
    expect(kinds.list().map((kind) => kind.mediaType)).toEqual([null, "image", "audio", "video"]);
    expect(answers.list().map((answer) => answer.id)).toEqual(["open", "choice", "trueFalse", "list", "digit"]);
    expect(rounds.list().map((round) => round.id)).toEqual(["standard", "pyramid", "safe"]);
  });

  it("createRegistries gives independent sets", () => {
    const mine = createRegistries();
    mine.kinds.register({ ...textKind, id: "mine" });
    expect(createRegistries().kinds.has("mine")).toBe(false);
    expect(defaultRegistries.kinds.has("mine")).toBe(false);
  });
});

describe("ids", () => {
  it("randomId gives a different UUID each time", () => {
    const a = randomId();
    expect(a).toMatch(/^[0-9a-f-]{36}$/);
    expect(randomId()).not.toBe(a);
  });

  it("sequentialIds counts up with its prefix", () => {
    const ids = sequentialIds("q");
    expect([ids(), ids(), ids()]).toEqual(["q1", "q2", "q3"]);
    expect(sequentialIds()()).toBe("id1");
  });
});
