import { describe, expect, it } from "vitest";
import {
  type Answer,
  type ChoiceAnswer,
  type Question,
  type Round,
  MAX_OPTIONS,
  STANDARD_SCREENS,
  addOption,
  audioKind,
  canAddOption,
  canRemoveOption,
  choiceAnswer,
  createRegistries,
  isChoiceAnswer,
  isComplete,
  isOpenAnswer,
  isSupported,
  isTrueFalseAnswer,
  openAnswer,
  pictureKind,
  removeOption,
  screensOf,
  sequentialIds,
  setOptionText,
  standardRound,
  textKind,
  toggleCorrect,
  trueFalseAnswer,
  videoKind,
} from "../src/index.ts";

const labels = { trueText: "Вярно", falseText: "Невярно" };
const question = (extra: Partial<Question> = {}): Question => ({ id: "q", kind: "text", prompt: "", answer: { type: "open", text: "" }, ...extra });

/** A choice answer with options `a`, `b`, … and the given correct ids. */
function choice(count: number, correct: string[] = []): ChoiceAnswer {
  const options = Array.from({ length: count }, (_, index) => ({ id: "abcdefghij".charAt(index), text: `Option ${String(index + 1)}` }));
  return { type: "choice", options, correct };
}

describe("question kinds", () => {
  it("text: no media, no data, complete with a prompt", () => {
    expect(textKind.mediaType).toBeNull();
    expect(textKind.defaultData()).toBeUndefined();
    expect(textKind.isComplete(question())).toBe(false);
    expect(textKind.isComplete(question({ prompt: "  " }))).toBe(false);
    expect(textKind.isComplete(question({ prompt: "Why?" }))).toBe(true);
  });

  it("picture, audio, video: declared with their media type, complete with a file", () => {
    expect([pictureKind.mediaType, audioKind.mediaType, videoKind.mediaType]).toEqual(["image", "audio", "video"]);
    for (const kind of [pictureKind, audioKind, videoKind]) {
      expect(kind.isComplete(question({ prompt: "Who?" }))).toBe(false);
      expect(kind.isComplete(question({ media: { id: "m1" } }))).toBe(true);
      expect(kind.dataSchema.safeParse({}).success).toBe(true);
    }
  });

  it("summary is the first line of the prompt", () => {
    expect(textKind.summary(question({ prompt: "  Коя е столицата?\nна България " }))).toBe("Коя е столицата?");
    expect(textKind.summary(question())).toBe("");
  });
});

describe("answer type open", () => {
  it("starts empty, is complete with text, reveals its text", () => {
    const answer = openAnswer.defaults(sequentialIds());
    expect(answer).toEqual({ type: "open", text: "" });
    expect(openAnswer.isComplete(answer)).toBe(false);
    expect(openAnswer.isComplete({ type: "open", text: "София" })).toBe(true);
    expect(openAnswer.revealText({ type: "open", text: "София" }, labels)).toBe("София");
  });

  it("does not accept another shape", () => {
    expect(isOpenAnswer({ type: "open" })).toBe(false);
    expect(openAnswer.schema.safeParse({ type: "open", text: 5 }).success).toBe(false);
    expect(openAnswer.revealText({ type: "choice" }, labels)).toBe("");
  });
});

describe("answer type trueFalse", () => {
  it("starts as true, is always complete, reveals the caller's word", () => {
    const answer = trueFalseAnswer.defaults(sequentialIds());
    expect(answer).toEqual({ type: "trueFalse", correct: true });
    expect(trueFalseAnswer.isComplete(answer)).toBe(true);
    expect(trueFalseAnswer.revealText(answer, labels)).toBe("Вярно");
    expect(trueFalseAnswer.revealText({ type: "trueFalse", correct: false }, labels)).toBe("Невярно");
  });

  it("does not accept another shape", () => {
    expect(isTrueFalseAnswer({ type: "trueFalse", correct: "yes" })).toBe(false);
    expect(trueFalseAnswer.revealText({ type: "open", text: "x" }, labels)).toBe("");
  });
});

describe("answer type choice", () => {
  it("starts with two empty options and none correct", () => {
    const answer = choiceAnswer.defaults(sequentialIds("o"));
    expect(answer).toEqual({ type: "choice", options: [{ id: "o1", text: "" }, { id: "o2", text: "" }], correct: [] });
    expect(choiceAnswer.isComplete(answer)).toBe(false);
  });

  it("is complete with 2–8 filled options and one or several correct", () => {
    expect(choiceAnswer.isComplete(choice(2, ["a"]))).toBe(true);
    expect(choiceAnswer.isComplete(choice(8, ["a", "c", "h"]))).toBe(true);
    expect(choiceAnswer.isComplete(choice(3))).toBe(false);
    expect(choiceAnswer.isComplete(choice(1, ["a"]))).toBe(false);
    expect(choiceAnswer.isComplete(choice(9, ["a"]))).toBe(false);
    expect(choiceAnswer.isComplete(setOptionText(choice(2, ["a"]), "b", " "))).toBe(false);
    expect(choiceAnswer.isComplete({ type: "open", text: "x" })).toBe(false);
  });

  it("reveals every correct option in the options' order", () => {
    expect(choiceAnswer.revealText(choice(4, ["c", "a"]), labels)).toBe("Option 1, Option 3");
    expect(choiceAnswer.revealText({ type: "open", text: "x" }, labels)).toBe("");
  });

  it("refuses repeated option ids and a correct id without an option", () => {
    expect(isChoiceAnswer(choice(3, ["b"]))).toBe(true);
    expect(isChoiceAnswer(choice(3, ["z"]))).toBe(false);
    const repeated: Answer = { type: "choice", options: [{ id: "a", text: "1" }, { id: "a", text: "2" }], correct: [] };
    expect(isChoiceAnswer(repeated)).toBe(false);
  });

  it("addOption adds up to 8, then returns the same answer", () => {
    let answer = choice(2);
    const ids = sequentialIds("n");
    while (canAddOption(answer)) answer = addOption(answer, ids);
    expect(answer.options).toHaveLength(MAX_OPTIONS);
    expect(answer.options.at(-1)).toEqual({ id: "n6", text: "" });
    expect(addOption(answer, ids)).toBe(answer);
  });

  it("removeOption removes the option and its correct mark, down to 2", () => {
    const answer = removeOption(choice(3, ["a", "c"]), "c");
    expect(answer.options.map((option) => option.id)).toEqual(["a", "b"]);
    expect(answer.correct).toEqual(["a"]);
    expect(canRemoveOption(answer)).toBe(false);
    expect(removeOption(answer, "a")).toBe(answer);
    const three = choice(3);
    expect(removeOption(three, "nope")).toBe(three);
  });

  it("setOptionText changes one option and cuts long text", () => {
    const answer = setOptionText(choice(2), "b", "Я".repeat(500));
    expect(answer.options[0]?.text).toBe("Option 1");
    expect(answer.options[1]?.text).toHaveLength(120);
  });

  it("toggleCorrect allows several correct options and keeps the options' order", () => {
    let answer = toggleCorrect(choice(3), "c");
    answer = toggleCorrect(answer, "a");
    expect(answer.correct).toEqual(["a", "c"]);
    expect(toggleCorrect(answer, "a").correct).toEqual(["c"]);
    expect(toggleCorrect(answer, "nope")).toBe(answer);
  });
});

describe("round kind standard", () => {
  const round: Round = {
    id: "r1",
    kind: "standard",
    name: "One",
    defaults: { seconds: 30, points: { value: 1 }, questionKind: "text", answerType: "open" },
    questions: [question({ id: "q1" }), question({ id: "q2" })],
  };

  it("plays rules → questions → answers → score → board", () => {
    expect(standardRound.screens(round)).toEqual([
      { screen: "rules", roundId: "r1" },
      { screen: "question", roundId: "r1", questionId: "q1" },
      { screen: "question", roundId: "r1", questionId: "q2" },
      { screen: "answers", roundId: "r1" },
      { screen: "answer", roundId: "r1", questionId: "q1" },
      { screen: "answer", roundId: "r1", questionId: "q2" },
      { screen: "score", roundId: "r1" },
      { screen: "board", roundId: "r1" },
    ]);
    expect(Object.values(STANDARD_SCREENS)).toEqual(["rules", "question", "answers", "answer", "score", "board"]);
  });

  it("screensOf asks the round's kind and gives nothing for an unknown one", () => {
    expect(screensOf(round)).toEqual(standardRound.screens(round));
    expect(screensOf({ ...round, kind: "wheel" }, createRegistries())).toEqual([]);
  });
});

describe("isSupported and isComplete", () => {
  it("a question is supported when its kind and answer type are registered", () => {
    expect(isSupported(question())).toBe(true);
    expect(isSupported(question({ kind: "future-kind" }))).toBe(false);
    expect(isSupported(question({ answer: { type: "future-answer" } }))).toBe(false);
  });

  it("a question is complete when its kind and its answer both are", () => {
    expect(isComplete(question({ prompt: "Capital?", answer: { type: "open", text: "Sofia" } }))).toBe(true);
    expect(isComplete(question({ prompt: "Capital?" }))).toBe(false);
    expect(isComplete(question({ answer: { type: "open", text: "Sofia" } }))).toBe(false);
    expect(isComplete(question({ kind: "future-kind" }))).toBe(true);
  });
});
