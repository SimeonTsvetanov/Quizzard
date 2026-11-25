// AC10: a new question kind and a new answer type are ONE registry entry each. Everything below uses
// the package's public functions as they are — the fake entries exist only in this file.
import { describe, expect, it } from "vitest";
import { z } from "zod";
import * as core from "../src/index.ts";
import { NOW, questionAt, roundAt } from "./helpers.ts";

/** A fake kind with data of its own: a "golden pyramid" of steps. */
const pyramidKind: core.QuestionKind = {
  id: "pyramid",
  mediaType: null,
  dataSchema: z.looseObject({ steps: z.number().int().min(1) }),
  defaultData: () => ({ steps: 3 }),
  summary: (question) => `Pyramid: ${question.prompt}`,
  isComplete: (question) => question.prompt !== "",
};

/** A fake answer type: the closest number wins. */
const closestAnswer: core.AnswerType = {
  id: "closest",
  schema: z.looseObject({ type: z.literal("closest"), target: z.number() }),
  defaults: () => ({ type: "closest", target: 0 }),
  isComplete: (answer) => answer["target"] !== 0,
  revealText: (answer) => String(answer["target"]),
};

/** An environment whose registries have the two fake entries — the only "change" a new kind needs. */
function extendedEnv(): core.Env {
  const registries = core.createRegistries();
  registries.kinds.register(pyramidKind);
  registries.answers.register(closestAnswer);
  return { ids: core.sequentialIds("x"), registries };
}

/** A quiz with one round and one pyramid/closest question (`x3`). */
function pyramidQuiz(env: core.Env): core.Quiz {
  const quiz = core.addRound(core.createQuiz({ name: "Extended", language: "en", now: NOW }, env), "Round 1", env);
  return core.addQuestion(quiz, "x2", { kind: "pyramid", answerType: "closest" }, env);
}

describe("AC10: a fake question kind and answer type need no change outside their registry entry", () => {
  it("appear in the registries' lists (what the pickers show)", () => {
    const { registries } = extendedEnv();
    expect(registries.kinds.list().map((kind) => kind.id)).toEqual(["text", "picture", "audio", "video", "pyramid"]);
    expect(registries.answers.list().map((answer) => answer.id)).toEqual(["open", "choice", "trueFalse", "list", "digit", "none", "closest"]);
  });

  it("ops: add with the entry's defaults, edit, switch kind and answer type, duplicate, move, delete", () => {
    const env = extendedEnv();
    let quiz = pyramidQuiz(env);
    expect(questionAt(quiz, 0, 0)).toEqual({ id: "x3", kind: "pyramid", prompt: "", answer: { type: "closest", target: 0 }, data: { steps: 3 } });

    quiz = core.editQuestion(quiz, "x3", { prompt: "How tall?", answer: { type: "closest", target: 146 }, data: { steps: 5 } });
    quiz = core.setQuestionSeconds(quiz, "x3", 90);
    quiz = core.duplicateQuestion(quiz, "x3", env);
    quiz = core.addRound(quiz, "Round 2", env);
    quiz = core.moveQuestion(quiz, "x3", roundAt(quiz, 1).id);
    expect(questionAt(quiz, 1, 0)).toEqual({ id: "x3", kind: "pyramid", prompt: "How tall?", answer: { type: "closest", target: 146 }, data: { steps: 5 }, seconds: 90 });
    expect(questionAt(quiz, 0, 0)).toMatchObject({ kind: "pyramid", data: { steps: 5 } });

    const asText = questionAt(core.setQuestionKind(quiz, "x3", "text", env), 1, 0);
    expect(asText).toMatchObject({ kind: "text", answer: { type: "closest", target: 146 } });
    expect("data" in asText).toBe(false);
    const back = core.setQuestionKind(core.setQuestionKind(quiz, "x3", "text", env), "x3", "pyramid", env);
    expect(questionAt(back, 1, 0).data).toEqual({ steps: 3 });
    expect(questionAt(core.setAnswerType(quiz, "x3", "open", env), 1, 0).answer).toEqual({ type: "open", text: "" });
    expect(questionAt(core.setAnswerType(core.addQuestion(quiz, "x2", {}, env), "x3", "closest", env), 1, 0).answer).toMatchObject({ type: "closest" });
    expect(core.totals(core.deleteQuestion(quiz, "x3")).questions).toBe(1);
  });

  it("a round can make them its defaults for new questions", () => {
    const env = extendedEnv();
    let quiz = core.setRoundDefaults(pyramidQuiz(env), "x2", { questionKind: "pyramid", answerType: "closest" });
    quiz = core.addQuestion(quiz, "x2", {}, env);
    expect(questionAt(quiz, 0, 1)).toMatchObject({ kind: "pyramid", answer: { type: "closest" }, data: { steps: 3 } });
  });

  it("validation: the entry's schemas decide what is valid", () => {
    const env = extendedEnv();
    const quiz = pyramidQuiz(env);
    expect(core.isQuizFile(core.toFile(quiz), env.registries)).toBe(true);
    const badData = core.editQuestion(quiz, "x3", { data: { steps: 0 } });
    expect(core.isQuizFile(core.toFile(badData), env.registries)).toBe(false);
    expect(core.isValidQuestion(questionAt(badData, 0, 0), env.registries)).toBe(false);
    const badAnswer = core.editQuestion(quiz, "x3", { answer: { type: "closest", target: "tall" } });
    expect(core.isQuizFile(core.toFile(badAnswer), env.registries)).toBe(false);
  });

  it("totals, effective time and points, completeness and support", () => {
    const env = extendedEnv();
    let quiz = core.setQuestionSeconds(pyramidQuiz(env), "x3", 100);
    quiz = core.setQuestionPoints(quiz, "x3", { value: 5, note: "1 per step" });
    const round = roundAt(quiz, 0);
    const question = questionAt(quiz, 0, 0);
    expect(core.totals(quiz)).toEqual({ rounds: 1, questions: 1, seconds: 100 });
    expect(core.effectivePoints(round, question)).toEqual({ value: 5, note: "1 per step" });
    expect(core.isSupported(question, env.registries)).toBe(true);
    expect(core.isComplete(question, env.registries)).toBe(false);
    const filled = questionAt(core.editQuestion(quiz, "x3", { prompt: "How tall?", answer: { type: "closest", target: 146 } }), 0, 0);
    expect(core.isComplete(filled, env.registries)).toBe(true);
    expect(env.registries.kinds.get(filled.kind)?.summary(filled)).toBe("Pyramid: How tall?");
    expect(env.registries.answers.get(filled.answer.type)?.revealText(filled.answer, { trueText: "", falseText: "" })).toBe("146");
    expect(core.screensOf(round, env.registries).map((screen) => screen.screen)).toEqual(["rules", "question", "answers", "answer", "score", "board"]);
  });

  it("open(): validates them where registered and keeps them as opaque data where not", () => {
    const env = extendedEnv();
    const quiz = core.editQuestion(pyramidQuiz(env), "x3", { prompt: "How tall?", answer: { type: "closest", target: 146 } });
    const json: unknown = JSON.parse(JSON.stringify(core.toFile(quiz)));
    expect(core.open(json, env.registries)).toEqual({ ok: true, file: core.toFile(quiz) });

    // This version without the entries: the same file opens, unsupported but untouched.
    const plain = core.open(json);
    expect(plain).toEqual({ ok: true, file: core.toFile(quiz) });
    expect(core.isSupported(questionAt(quiz, 0, 0))).toBe(false);

    // Broken payloads are refused only by a version that knows the kind.
    const broken: unknown = JSON.parse(JSON.stringify(core.toFile(core.editQuestion(quiz, "x3", { data: { steps: "many" } }))));
    expect(core.open(broken, env.registries)).toEqual({ ok: false, reason: "invalid" });
    expect(core.open(broken)).toMatchObject({ ok: true });
  });

  it("the shared registries were not touched", () => {
    expect(core.defaultRegistries.kinds.has("pyramid")).toBe(false);
    expect(core.defaultRegistries.answers.has("closest")).toBe(false);
  });
});
