import { describe, expect, it } from "vitest";
import * as core from "../src/index.ts";
import sample from "./fixtures/v1/sample.quiz.json" with { type: "json" };
import { questionAt } from "./helpers.ts";

/** A fresh copy of the version-1 sample, as `JSON.parse` of the file would give it. */
const clone = (): typeof sample => JSON.parse(JSON.stringify(sample)) as typeof sample;
const sampleCopy = (): Record<string, unknown> => clone();

/** The sample with one change applied to its parsed JSON. */
function changed(change: (file: typeof sample) => void): unknown {
  const copy = clone();
  change(copy);
  return copy;
}

/** Opens a value that must be a valid quiz file. */
function mustOpen(value: unknown): core.QuizFile {
  const result = core.open(value);
  if (!result.ok) throw new Error(`refused: ${result.reason}`);
  return result.file;
}

describe("AC8: the version-1 sample file opens in this version", () => {
  it("opens", () => {
    expect(core.open(sampleCopy())).toMatchObject({ ok: true, file: { format: "quizzard-quiz", version: core.QUIZ_VERSION } });
  });

  it("is the realistic quiz it is meant to be: every kind × every answer type, own time and points", () => {
    const { quiz, media } = mustOpen(sampleCopy());
    const questions = quiz.rounds.flatMap((round) => round.questions);
    const pairs = new Set(questions.map((question) => `${question.kind}/${question.answer.type}`));
    for (const kind of ["text", "picture", "audio", "video"]) {
      for (const type of ["open", "choice", "trueFalse"]) expect(pairs.has(`${kind}/${type}`)).toBe(true);
    }
    expect(pairs.has("future-kind/future-answer")).toBe(true);
    expect(quiz.rounds).toHaveLength(2);
    expect(core.totals(quiz)).toEqual({ rounds: 2, questions: 13, seconds: 6 * 30 + 45 + 6 * 60 });
    expect(questionAt(quiz, 0, 1)).toMatchObject({ seconds: 45, points: { value: 2, note: "1 point per planet" } });
    expect(media.map((entry) => entry.type)).toEqual(["image", "audio", "video"]);
    expect(questions.every((question) => !core.isSupported(question) || core.isComplete(question))).toBe(true);
  });

  it("round-trips unchanged: open → save gives the same JSON, field for field and in the same order", () => {
    const file = mustOpen(sampleCopy());
    expect(file).toEqual(sample);
    expect(JSON.stringify(file)).toBe(JSON.stringify(sample));
    expect(JSON.stringify(mustOpen(JSON.parse(JSON.stringify(file))))).toBe(JSON.stringify(sample));
  });

  it("opens from text as well", () => {
    expect(core.openText(JSON.stringify(sample))).toMatchObject({ ok: true });
    expect(core.openText("not json {")).toEqual({ ok: false, reason: "not-a-quiz" });
  });

  it("a file of a newer version is refused as newer, whatever is in it", () => {
    expect(core.open({ ...sampleCopy(), version: 2 })).toEqual({ ok: false, reason: "newer" });
    expect(core.open({ format: "quizzard-quiz", version: 99, somethingNew: true })).toEqual({ ok: false, reason: "newer" });
  });

  it("an unknown question kind and answer type are kept through open → edit → save → open", () => {
    const unknown = sample.quiz.rounds[0]?.questions.find((question) => question.kind === "future-kind");
    expect(unknown).toMatchObject({ data: { steps: 3 }, extra: { kept: true }, answer: { type: "future-answer" } });
    const opened = mustOpen(sampleCopy());
    let quiz = core.renameQuiz(opened.quiz, "Edited");
    quiz = core.addQuestion(quiz, "r1");
    quiz = core.moveQuestion(quiz, "q7", "r2", 0);
    quiz = core.setQuestionSeconds(quiz, "q7", 99);
    quiz = core.setQuestionSeconds(quiz, "q7", undefined);
    const saved = JSON.stringify(core.toFile(quiz, opened.media));
    const again = mustOpen(JSON.parse(saved));
    expect(questionAt(again.quiz, 1, 0)).toEqual(unknown);
    const copy = core.findQuestion(core.duplicateQuestion(again.quiz, "q7", { ids: () => "copy", registries: core.defaultRegistries }), "copy");
    expect(copy?.question).toEqual({ ...unknown, id: "copy" });
  });

  it("fields this version does not know are kept at every level", () => {
    const file = mustOpen(
      changed((copy) => {
        Object.assign(copy, { exportedBy: "Quizzard 9" });
        Object.assign(copy.quiz, { theme: "neon" });
        Object.assign(copy.quiz.settings, { tiebreak: "closest" });
        Object.assign(copy.quiz.rounds[0] ?? {}, { joker: true });
        Object.assign(copy.media[0] ?? {}, { sha256: "abc" });
      }),
    );
    expect(file).toMatchObject({ exportedBy: "Quizzard 9", quiz: { theme: "neon", settings: { tiebreak: "closest" }, rounds: [{ joker: true }, {}] }, media: [{ sha256: "abc" }, {}, {}] });
  });
});

describe("open refuses what is not a valid quiz", () => {
  it("not a quiz: another value or another format", () => {
    for (const value of [null, undefined, 5, "quiz", [], {}, { format: "something-else", version: 1 }, [sample]]) {
      expect(core.open(value)).toEqual({ ok: false, reason: "not-a-quiz" });
    }
  });

  it("invalid: a version that is not a whole number from 1", () => {
    for (const version of [0, -1, 1.5, "1", null, undefined]) {
      expect(core.open({ ...sampleCopy(), version })).toEqual({ ok: false, reason: "invalid" });
    }
  });

  it.each([
    ["no quiz", (copy: typeof sample) => Reflect.deleteProperty(copy, "quiz")],
    ["no media list", (copy: typeof sample) => Reflect.deleteProperty(copy, "media")],
    ["a question without an id", (copy: typeof sample) => Reflect.deleteProperty(copy.quiz.rounds[0]?.questions[0] ?? {}, "id")],
    ["a question without an answer", (copy: typeof sample) => Reflect.deleteProperty(copy.quiz.rounds[0]?.questions[0] ?? {}, "answer")],
    ["an open answer without text", (copy: typeof sample) => Reflect.deleteProperty(copy.quiz.rounds[0]?.questions[0]?.answer ?? {}, "text")],
    ["a choice answer whose correct id has no option", (copy: typeof sample) => Object.assign(copy.quiz.rounds[0]?.questions[1]?.answer ?? {}, { correct: ["zz"] })],
    ["a true/false answer that is not a boolean", (copy: typeof sample) => Object.assign(copy.quiz.rounds[0]?.questions[2]?.answer ?? {}, { correct: "yes" })],
    ["negative points", (copy: typeof sample) => Object.assign(copy.quiz.rounds[0]?.defaults ?? {}, { points: { value: -1 } })],
    ["zero seconds", (copy: typeof sample) => Object.assign(copy.quiz.rounds[0]?.defaults ?? {}, { seconds: 0 })],
    ["a known kind whose data is not an object", (copy: typeof sample) => Object.assign(copy.quiz.rounds[0]?.questions[0] ?? {}, { data: "text" })],
    ["a repeated question id", (copy: typeof sample) => Object.assign(copy.quiz.rounds[1]?.questions[0] ?? {}, { id: "q1" })],
    ["a repeated round id", (copy: typeof sample) => Object.assign(copy.quiz.rounds[1] ?? {}, { id: "r1" })],
    ["a repeated media id", (copy: typeof sample) => Object.assign(copy.media[1] ?? {}, { id: "m-image" })],
    ["a media type that does not exist", (copy: typeof sample) => Object.assign(copy.media[0] ?? {}, { type: "hologram" })],
    ["teams that are not a whole number", (copy: typeof sample) => Object.assign(copy.quiz.settings, { teams: 2.5 })],
  ])("invalid: %s", (_name, change) => {
    expect(core.open(changed(change))).toEqual({ ok: false, reason: "invalid" });
  });

  it("does not check the limits: a quiz over today's limits still opens", () => {
    const file = changed((copy) => {
      Object.assign(copy.quiz, { name: "N".repeat(1000) });
      Object.assign(copy.quiz.settings, { teams: 40 });
      Object.assign(copy.quiz.rounds[0]?.defaults ?? {}, { seconds: 100000 });
    });
    expect(core.open(file)).toMatchObject({ ok: true });
  });
});

describe("migrations", () => {
  it("there are none yet: version 1 is the current version", () => {
    expect(core.migrations).toEqual([]);
    expect(core.QUIZ_VERSION).toBe(1);
  });

  it("upgrade runs each step in order and stamps the version", () => {
    const steps: core.Migration[] = [
      { from: 2, migrate: (file) => ({ ...file, b: true }) },
      { from: 1, migrate: (file) => ({ ...file, a: true }) },
    ];
    const start = Object.freeze({ format: "quizzard-quiz", version: 1, keep: "me" });
    expect(core.upgrade(start, 1, 3, steps)).toEqual({ format: "quizzard-quiz", version: 3, keep: "me", a: true, b: true });
    expect(core.upgrade(start, 1, 2, steps)).toEqual({ format: "quizzard-quiz", version: 2, keep: "me", a: true });
  });

  it("upgrade gives the file back untouched when it is current, and nothing when a step is missing", () => {
    const start = { format: "quizzard-quiz", version: 1 };
    expect(core.upgrade(start, 1, 1)).toBe(start);
    expect(core.upgrade(start, 1, 2)).toBeUndefined();
    expect(core.upgrade(start, 1, 3, [{ from: 1, migrate: (file) => file }])).toBeUndefined();
  });
});
