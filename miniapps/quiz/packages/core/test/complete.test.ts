import { describe, expect, it } from "vitest";
import * as core from "../src/index.ts";
import { sampleQuiz, testEnv } from "./helpers.ts";

describe("unfinished questions", () => {
  it("counts the questions without a text or an answer, per round and in play order", () => {
    const env = testEnv();
    const empty = sampleQuiz([2, 1], env);
    expect(empty.rounds.map((round) => core.unfinishedCount(round, env.registries))).toEqual([2, 1]);
    const [first, second] = empty.rounds[0]?.questions ?? [];
    const done = core.editQuestion(empty, first?.id ?? "", { prompt: "Which river?", answer: { type: "open", text: "The Seine" } });
    expect(done.rounds.map((round) => core.unfinishedCount(round, env.registries))).toEqual([1, 1]);
    const list = core.unfinishedQuestions(done, env.registries);
    expect(list.map((one) => [one.roundIndex, one.index, one.question.id])).toEqual([[0, 1, second?.id], [1, 0, done.rounds[1]?.questions[0]?.id]]);
    expect(list[0]?.round).toBe(done.rounds[0]);
  });

  it("a question with a text but no answer is unfinished; a finished quiz has none", () => {
    const env = testEnv();
    const quiz = sampleQuiz([1], env);
    const id = quiz.rounds[0]?.questions[0]?.id ?? "";
    const asked = core.editQuestion(quiz, id, { prompt: "Which river?" });
    expect(core.unfinishedQuestions(asked, env.registries)).toHaveLength(1);
    expect(core.unfinishedQuestions(core.editQuestion(asked, id, { answer: { type: "open", text: "The Seine" } }), env.registries)).toEqual([]);
  });

  it("a question of a kind this version does not know is not counted: it cannot be finished here", () => {
    const env = testEnv();
    const quiz = sampleQuiz([1], env);
    const strange = core.changeQuestion(quiz, quiz.rounds[0]?.questions[0]?.id ?? "", (question) => ({ ...question, kind: "hologram" }));
    expect(core.unfinishedQuestions(strange, env.registries)).toEqual([]);
    expect(strange.rounds.map((round) => core.unfinishedCount(round, env.registries))).toEqual([0]);
  });
});
