// The `play` entry is what the exported page loads, without Zod (the player's test/imports.test.ts
// follows its imports): its hand-written answer checks must agree with the Zod schemas the creator
// validates with.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { type Answer, choiceAnswer, openAnswer, trueFalseAnswer } from "../src/index.ts";
import * as play from "../src/play.ts";

describe("@simeonts/quizzard-quiz-core/play", () => {
  it("has what the player needs", () => {
    expect(play.QUIZ_FORMAT).toBe("quizzard-quiz");
    expect(play.createRoundKinds().get("standard")?.id).toBe("standard");
    expect(play.STANDARD_SCREENS.question).toBe("question");
    expect(typeof play.effectiveSeconds).toBe("function");
    expect(typeof play.readEmbeddedQuiz).toBe("function");
  });
});

const jsonValue = fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null), fc.array(fc.string(), { maxLength: 3 }), fc.constant(undefined));
const optionValue = fc.oneof(fc.record({ id: fc.oneof(fc.constantFrom("a", "b", "c", ""), fc.integer()), text: jsonValue }, { requiredKeys: [] }), jsonValue);
/** Answers of every shape, right and wrong: the fields of all three types with values of any kind. */
const anyAnswer = fc.record({
  type: fc.constantFrom("open", "choice", "trueFalse", "other"),
  text: jsonValue,
  correct: fc.oneof(fc.boolean(), fc.array(fc.oneof(fc.constantFrom("a", "b", "c", "z"), fc.integer()), { maxLength: 4 }), jsonValue),
  options: fc.oneof(fc.array(optionValue, { maxLength: 4 }), jsonValue),
}, { requiredKeys: ["type"] });

describe("the hand-written answer checks (answers/shapes.ts)", () => {
  it("property: each agrees with its answer type's Zod schema on any value", () => {
    fc.assert(fc.property(anyAnswer, (value) => {
      const answer = value as Answer;
      expect(play.isOpenAnswer(answer)).toBe(openAnswer.schema.safeParse(answer).success);
      expect(play.isChoiceAnswer(answer)).toBe(choiceAnswer.schema.safeParse(answer).success);
      expect(play.isTrueFalseAnswer(answer)).toBe(trueFalseAnswer.schema.safeParse(answer).success);
    }), { numRuns: 500 });
  });

  it("the reveal texts are the answer types' own", () => {
    const labels = { trueText: "True", falseText: "False" };
    const choice: Answer = { type: "choice", options: [{ id: "a", text: "Mars" }, { id: "b", text: "Europa" }, { id: "c", text: "Venus" }], correct: ["a", "c"] };
    expect(play.choiceReveal(choice)).toBe("Mars, Venus");
    expect(choiceAnswer.revealText(choice, labels)).toBe("Mars, Venus");
    expect(play.openReveal({ type: "open", text: "The Seine" })).toBe("The Seine");
    expect(play.trueFalseReveal({ type: "trueFalse", correct: false }, labels)).toBe("False");
    expect(play.openReveal(choice)).toBe("");
    expect(play.choiceReveal({ type: "open", text: "x" })).toBe("");
    expect(play.trueFalseReveal(choice, labels)).toBe("");
  });
});
