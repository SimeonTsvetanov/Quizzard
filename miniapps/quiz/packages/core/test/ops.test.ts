import { describe, expect, it } from "vitest";
import * as core from "../src/index.ts";
import { NOW, deepFreeze, questionAt, questionIds, roundAt, sampleQuiz, testEnv } from "./helpers.ts";

describe("quiz ops", () => {
  it("createQuiz makes an empty quiz with 4 teams", () => {
    const quiz = core.createQuiz({ name: "Friday", language: "bg", now: NOW }, testEnv());
    expect(quiz).toEqual({ id: "x1", name: "Friday", createdAt: NOW, updatedAt: NOW, language: "bg", rounds: [], settings: { teams: 4 } });
    expect(core.createQuiz({ name: "N".repeat(200), language: "en", now: NOW }).name).toHaveLength(core.QUIZ_NAME_MAX);
  });

  it("toFile wraps the quiz in the versioned format", () => {
    const quiz = sampleQuiz([1]);
    expect(core.toFile(quiz)).toEqual({ format: "quizzard-quiz", version: 1, quiz, media: [] });
    const media: core.MediaEntry[] = [{ id: "m1", type: "image", mime: "image/png", name: "a.png", bytes: 10 }];
    expect(core.toFile(quiz, media).media).toBe(media);
  });

  it("renameQuiz, setTeams and touch change only their field", () => {
    const quiz = sampleQuiz([1]);
    expect(core.renameQuiz(quiz, "New name")).toEqual({ ...quiz, name: "New name" });
    expect(core.setTeams(quiz, 6).settings.teams).toBe(6);
    expect(core.setTeams(quiz, 1).settings.teams).toBe(2);
    expect(core.setTeams(quiz, 99).settings.teams).toBe(12);
    expect(core.setTeams(quiz, 3.6).settings.teams).toBe(4);
    expect(core.touch(quiz, "2027-01-01T00:00:00.000Z")).toEqual({ ...quiz, updatedAt: "2027-01-01T00:00:00.000Z" });
  });

  it("duplicateQuiz copies everything under new ids", () => {
    const quiz = sampleQuiz([2, 1]);
    const copy = core.duplicateQuiz(quiz, { name: "Copy", now: "2027-01-01T00:00:00.000Z" }, testEnv("c"));
    expect(copy.name).toBe("Copy");
    expect(copy.createdAt).toBe("2027-01-01T00:00:00.000Z");
    expect(copy.id).toBe("c1");
    expect(questionIds(copy)).toHaveLength(3);
    const old = new Set([quiz.id, ...quiz.rounds.map((round) => round.id), ...questionIds(quiz)]);
    for (const id of [copy.id, ...copy.rounds.map((round) => round.id), ...questionIds(copy)]) expect(old.has(id)).toBe(false);
    expect(copy.rounds.map((round) => round.name)).toEqual(quiz.rounds.map((round) => round.name));
  });
});

describe("round ops", () => {
  it("addRound appends a standard round with the first defaults", () => {
    const quiz = sampleQuiz([0]);
    expect(roundAt(quiz, 0)).toEqual({
      id: "x2",
      kind: "standard",
      name: "Round 1",
      defaults: { seconds: core.DEFAULT_SECONDS, points: { value: core.DEFAULT_POINTS }, questionKind: "text", answerType: "open" },
      questions: [],
    });
  });

  it("addRound starts with the defaults of the round before it", () => {
    const first = sampleQuiz([0]);
    const changed = core.setRoundDefaults(first, "x2", { seconds: 90, answerType: "choice" });
    const quiz = core.addRound(changed, "Round 2", testEnv("n"));
    expect(roundAt(quiz, 1).defaults).toEqual({ ...roundAt(first, 0).defaults, seconds: 90, answerType: "choice" });
  });

  it("addRound stops at the most rounds allowed", () => {
    const quiz = sampleQuiz(Array.from({ length: core.MAX_ROUNDS }, () => 0));
    expect(core.canAddRound(quiz)).toBe(false);
    expect(core.addRound(quiz, "One more")).toBe(quiz);
    expect(core.duplicateRound(quiz, roundAt(quiz, 0).id)).toBe(quiz);
  });

  it("addRound does nothing without a registered round kind", () => {
    const quiz = sampleQuiz([]);
    const env = { ids: core.sequentialIds(), registries: { ...core.createRegistries(), rounds: core.createRegistry<core.RoundKind>() } };
    expect(core.addRound(quiz, "Round", env)).toBe(quiz);
  });

  it("renameRound renames and cuts", () => {
    const quiz = sampleQuiz([0, 0]);
    const next = core.renameRound(quiz, "x3", "Музика");
    expect(next.rounds.map((round) => round.name)).toEqual(["Round 1", "Музика"]);
    expect(roundAt(core.renameRound(quiz, "x3", "N".repeat(100)), 1).name).toHaveLength(core.ROUND_NAME_MAX);
    expect(core.renameRound(quiz, "nope", "x")).toBe(quiz);
  });

  it("setRoundRules sets the text and removes the field when empty", () => {
    const quiz = sampleQuiz([0]);
    const withRules = core.setRoundRules(quiz, "x2", "No phones!");
    expect(roundAt(withRules, 0).rules).toBe("No phones!");
    const cleared = core.setRoundRules(withRules, "x2", "  ");
    expect("rules" in roundAt(cleared, 0)).toBe(false);
    expect(cleared).toEqual(quiz);
  });

  it("setRoundDefaults changes only what is given and cleans the numbers", () => {
    const quiz = sampleQuiz([0]);
    const next = core.setRoundDefaults(quiz, "x2", { seconds: 44.6, points: { value: 500, note: "  double  " }, questionKind: "picture" });
    expect(roundAt(next, 0).defaults).toEqual({ seconds: 45, points: { value: core.MAX_POINTS, note: "double" }, questionKind: "picture", answerType: "open" });
    expect(roundAt(core.setRoundDefaults(quiz, "x2", { seconds: 1 }), 0).defaults.seconds).toBe(core.MIN_SECONDS);
    expect(roundAt(core.setRoundDefaults(quiz, "x2", { seconds: 9999 }), 0).defaults.seconds).toBe(core.MAX_SECONDS);
  });

  it("moveRound reorders and clamps the index", () => {
    const quiz = sampleQuiz([0, 0, 0]);
    const ids = quiz.rounds.map((round) => round.id);
    expect(core.moveRound(quiz, "x2", 2).rounds.map((round) => round.id)).toEqual(["x3", "x4", "x2"]);
    expect(core.moveRound(quiz, "x4", 0).rounds.map((round) => round.id)).toEqual(["x4", "x2", "x3"]);
    expect(core.moveRound(quiz, "x2", 99).rounds.map((round) => round.id)).toEqual(["x3", "x4", "x2"]);
    expect(core.moveRound(quiz, "x3", -5).rounds.map((round) => round.id)).toEqual(["x3", "x2", "x4"]);
    expect(core.moveRound(quiz, "x3", 1).rounds.map((round) => round.id)).toEqual(ids);
    expect(core.moveRound(quiz, "nope", 0)).toBe(quiz);
  });

  it("deleteRound removes the round and its questions", () => {
    const quiz = sampleQuiz([2, 1]);
    const next = core.deleteRound(quiz, "x2");
    expect(next.rounds.map((round) => round.id)).toEqual(["x5"]);
    expect(core.totals(next).questions).toBe(1);
    expect(core.deleteRound(quiz, "nope")).toBe(quiz);
  });

  it("duplicateRound puts a copy with new ids right after the round", () => {
    const quiz = sampleQuiz([2, 0]);
    const next = core.duplicateRound(quiz, "x2", testEnv("d"));
    expect(next.rounds.map((round) => round.id)).toEqual(["x2", "d1", "x5"]);
    expect(roundAt(next, 1).questions.map((question) => question.id)).toEqual(["d2", "d3"]);
    expect({ ...roundAt(next, 1), id: "", questions: [] }).toEqual({ ...roundAt(quiz, 0), id: "", questions: [] });
    expect(core.duplicateRound(quiz, "nope")).toBe(quiz);
  });

  it("findRound and findQuestion find by id", () => {
    const quiz = sampleQuiz([1, 2]);
    expect(core.findRound(quiz, "x4")).toBe(roundAt(quiz, 1));
    expect(core.findRound(quiz, "nope")).toBeUndefined();
    expect(core.findQuestion(quiz, "x6")).toEqual({ round: roundAt(quiz, 1), question: questionAt(quiz, 1, 1), index: 1 });
    expect(core.findQuestion(quiz, "nope")).toBeUndefined();
  });

  it("without and moveItem are pure helpers", () => {
    const value = deepFreeze({ a: 1, b: 2 });
    expect(core.without(value, "b")).toEqual({ a: 1 });
    const list = deepFreeze(["a", "b", "c"]);
    expect(core.moveItem(list, 0, 2)).toEqual(["b", "c", "a"]);
    expect(core.moveItem(list, 7, 0)).toBe(list);
  });
});

describe("question ops", () => {
  it("addQuestion uses the round's default kind and answer type and stores no time or points", () => {
    const quiz = sampleQuiz([1]);
    expect(questionAt(quiz, 0, 0)).toEqual({ id: "x3", kind: "text", prompt: "", answer: { type: "open", text: "" } });
  });

  it("addQuestion takes the picked kind and answer type", () => {
    const quiz = core.addQuestion(sampleQuiz([0]), "x2", { kind: "picture", answerType: "choice" }, testEnv("n"));
    expect(questionAt(quiz, 0, 0)).toEqual({ id: "n1", kind: "picture", prompt: "", answer: { type: "choice", options: [{ id: "n2", text: "" }, { id: "n3", text: "" }], correct: [] } });
  });

  it("addQuestion does nothing for an unknown round, an unregistered kind or a full round", () => {
    const quiz = sampleQuiz([0]);
    expect(core.addQuestion(quiz, "nope")).toBe(quiz);
    expect(core.addQuestion(quiz, "x2", { kind: "future-kind" })).toBe(quiz);
    expect(core.addQuestion(quiz, "x2", { answerType: "future-answer" })).toBe(quiz);
    expect(core.newQuestion("future-kind", "open")).toBeUndefined();
    const full = sampleQuiz([core.MAX_QUESTIONS_PER_ROUND]);
    expect(core.canAddQuestion(roundAt(full, 0))).toBe(false);
    expect(core.addQuestion(full, "x2")).toBe(full);
    expect(core.duplicateQuestion(full, "x3")).toBe(full);
  });

  it("editQuestion changes only the given fields", () => {
    const quiz = sampleQuiz([2]);
    const next = core.editQuestion(quiz, "x3", { prompt: "Коя е столицата?", answer: { type: "open", text: "София" }, explanation: "От 1879 г.", media: { id: "m1" }, data: { a: 1 } });
    expect(questionAt(next, 0, 0)).toEqual({ id: "x3", kind: "text", prompt: "Коя е столицата?", answer: { type: "open", text: "София" }, explanation: "От 1879 г.", media: { id: "m1" }, data: { a: 1 } });
    expect(questionAt(next, 0, 1)).toBe(questionAt(quiz, 0, 1));
    const promptOnly = core.editQuestion(next, "x3", { prompt: "Changed" });
    expect(questionAt(promptOnly, 0, 0)).toEqual({ ...questionAt(next, 0, 0), prompt: "Changed" });
    expect(core.editQuestion(quiz, "nope", { prompt: "x" })).toBe(quiz);
  });

  it("editQuestion removes an empty explanation and a null media, and cuts long text", () => {
    const quiz = core.editQuestion(sampleQuiz([1]), "x3", { explanation: "Because.", media: { id: "m1" } });
    const cleared = questionAt(core.editQuestion(quiz, "x3", { explanation: " ", media: null }), 0, 0);
    expect("explanation" in cleared).toBe(false);
    expect("media" in cleared).toBe(false);
    const long = questionAt(core.editQuestion(quiz, "x3", { prompt: "p".repeat(999), explanation: "e".repeat(999) }), 0, 0);
    expect(long.prompt).toHaveLength(core.PROMPT_MAX);
    expect(long.explanation).toHaveLength(core.EXPLANATION_MAX);
  });

  it("setQuestionKind keeps text and answer; media only for the same media type", () => {
    const base = core.editQuestion(core.addQuestion(sampleQuiz([0]), "x2", { kind: "picture" }, testEnv("n")), "n1", { prompt: "Who?", media: { id: "m1" }, data: { old: true } });
    const asText = questionAt(core.setQuestionKind(base, "n1", "text"), 0, 0);
    expect(asText).toEqual({ id: "n1", kind: "text", prompt: "Who?", answer: { type: "open", text: "" } });
    expect(questionAt(core.setQuestionKind(base, "n1", "audio"), 0, 0).media).toBeUndefined();
    expect(core.setQuestionKind(base, "n1", "picture")).toBe(base);
    expect(core.setQuestionKind(base, "n1", "future-kind")).toBe(base);
    expect(core.setQuestionKind(base, "nope", "text")).toBe(base);
  });

  it("setAnswerType starts the new type's empty answer", () => {
    const quiz = sampleQuiz([1]);
    const next = core.setAnswerType(quiz, "x3", "trueFalse");
    expect(questionAt(next, 0, 0).answer).toEqual({ type: "trueFalse", correct: true });
    expect(core.setAnswerType(next, "x3", "trueFalse")).toBe(next);
    expect(core.setAnswerType(quiz, "x3", "future-answer")).toBe(quiz);
  });

  it("moveQuestion reorders inside a round", () => {
    const quiz = sampleQuiz([3]);
    expect(questionIds(core.moveQuestion(quiz, "x3", "x2", 2))).toEqual(["x4", "x5", "x3"]);
    expect(questionIds(core.moveQuestion(quiz, "x5", "x2", 0))).toEqual(["x5", "x3", "x4"]);
    expect(questionIds(core.moveQuestion(quiz, "x3", "x2"))).toEqual(["x4", "x5", "x3"]);
  });

  it("moveQuestion moves to another round, to its end or to an index", () => {
    const quiz = sampleQuiz([2, 2]);
    const toEnd = core.moveQuestion(quiz, "x3", "x5");
    expect(toEnd.rounds.map((round) => round.questions.map((question) => question.id))).toEqual([["x4"], ["x6", "x7", "x3"]]);
    const toStart = core.moveQuestion(quiz, "x3", "x5", 0);
    expect(toStart.rounds.map((round) => round.questions.map((question) => question.id))).toEqual([["x4"], ["x3", "x6", "x7"]]);
    expect(core.moveQuestion(quiz, "nope", "x5")).toBe(quiz);
    expect(core.moveQuestion(quiz, "x3", "nope")).toBe(quiz);
  });

  it("moveQuestion does not move into a full round", () => {
    const quiz = sampleQuiz([core.MAX_QUESTIONS_PER_ROUND, 1]);
    const last = questionAt(quiz, 1, 0).id;
    expect(core.moveQuestion(quiz, last, "x2")).toBe(quiz);
  });

  it("a moved question keeps its own time; one without takes the new round's", () => {
    const start = core.setRoundDefaults(sampleQuiz([2, 0]), "x5", { seconds: 90 });
    const quiz = core.setQuestionSeconds(start, "x3", 20);
    const moved = core.moveQuestion(core.moveQuestion(quiz, "x3", "x5"), "x4", "x5");
    const target = roundAt(moved, 1);
    expect(target.questions.map((question) => core.effectiveSeconds(target, question))).toEqual([20, 90]);
  });

  it("deleteQuestion removes one question", () => {
    const quiz = sampleQuiz([2]);
    expect(questionIds(core.deleteQuestion(quiz, "x3"))).toEqual(["x4"]);
    expect(core.deleteQuestion(quiz, "nope")).toBe(quiz);
  });

  it("duplicateQuestion puts a copy with a new id right after the question", () => {
    const quiz = core.editQuestion(sampleQuiz([2]), "x3", { prompt: "Original", media: { id: "m1" } });
    const next = core.duplicateQuestion(quiz, "x3", testEnv("d"));
    expect(questionIds(next)).toEqual(["x3", "d1", "x4"]);
    expect(questionAt(next, 0, 1)).toEqual({ ...questionAt(quiz, 0, 0), id: "d1" });
    expect(core.duplicateQuestion(quiz, "nope")).toBe(quiz);
  });
});

describe("AC2: a question has the round's time and points until changed, then keeps its own", () => {
  it("a new question shows the round's time and points and stores neither", () => {
    const quiz = sampleQuiz([1]);
    const round = roundAt(quiz, 0);
    const question = questionAt(quiz, 0, 0);
    expect(core.effectiveSeconds(round, question)).toBe(round.defaults.seconds);
    expect(core.effectivePoints(round, question)).toEqual(round.defaults.points);
    expect("seconds" in question || "points" in question).toBe(false);
  });

  it("a question without its own values follows a change of the round's defaults", () => {
    const quiz = core.setRoundDefaults(sampleQuiz([1]), "x2", { seconds: 45, points: { value: 3 } });
    expect(core.effectiveSeconds(roundAt(quiz, 0), questionAt(quiz, 0, 0))).toBe(45);
    expect(core.effectivePoints(roundAt(quiz, 0), questionAt(quiz, 0, 0))).toEqual({ value: 3 });
  });

  it("after a change the question keeps its own time and points when the round's defaults change", () => {
    let quiz = core.setQuestionSeconds(sampleQuiz([2]), "x3", 75);
    quiz = core.setQuestionPoints(quiz, "x3", { value: 2, note: "1 per name" });
    quiz = core.setRoundDefaults(quiz, "x2", { seconds: 120, points: { value: 5 } });
    const round = roundAt(quiz, 0);
    expect(core.effectiveSeconds(round, questionAt(quiz, 0, 0))).toBe(75);
    expect(core.effectivePoints(round, questionAt(quiz, 0, 0))).toEqual({ value: 2, note: "1 per name" });
    expect(core.effectiveSeconds(round, questionAt(quiz, 0, 1))).toBe(120);
    expect(core.effectivePoints(round, questionAt(quiz, 0, 1))).toEqual({ value: 5 });
  });

  it("its own values survive even when the round's defaults pass through the same value", () => {
    let quiz = core.setQuestionSeconds(sampleQuiz([1]), "x3", 75);
    quiz = core.setRoundDefaults(quiz, "x2", { seconds: 75 });
    quiz = core.setRoundDefaults(quiz, "x2", { seconds: 20 });
    expect(core.effectiveSeconds(roundAt(quiz, 0), questionAt(quiz, 0, 0))).toBe(75);
  });

  it("values equal to the round's are not stored; clearing goes back to the round's", () => {
    const quiz = sampleQuiz([1]);
    expect(core.setQuestionSeconds(quiz, "x3", core.DEFAULT_SECONDS)).toBe(quiz);
    expect(core.setQuestionPoints(quiz, "x3", { value: core.DEFAULT_POINTS })).toBe(quiz);
    expect(core.setQuestionSeconds(quiz, "x3", undefined)).toBe(quiz);
    const own = core.setQuestionPoints(core.setQuestionSeconds(quiz, "x3", 50), "x3", { value: 4 });
    expect(questionAt(own, 0, 0)).toMatchObject({ seconds: 50, points: { value: 4 } });
    const cleared = core.setQuestionPoints(core.setQuestionSeconds(own, "x3", undefined), "x3", undefined);
    expect(cleared).toEqual(quiz);
    expect(questionAt(core.setQuestionSeconds(own, "x3", core.DEFAULT_SECONDS), 0, 0).seconds).toBeUndefined();
  });

  it("a question's own time is whole seconds inside the limits", () => {
    const quiz = sampleQuiz([1]);
    expect(questionAt(core.setQuestionSeconds(quiz, "x3", 12.4), 0, 0).seconds).toBe(12);
    expect(questionAt(core.setQuestionSeconds(quiz, "x3", 0), 0, 0).seconds).toBe(core.MIN_SECONDS);
    expect(questionAt(core.setQuestionSeconds(quiz, "x3", 100000), 0, 0).seconds).toBe(core.MAX_SECONDS);
  });
});

describe("AC3: a question's points are a number, a note, or both", () => {
  it("stores a number, a note alone (value 0), or both", () => {
    const quiz = sampleQuiz([3]);
    let next = core.setQuestionPoints(quiz, "x3", { value: 3 });
    next = core.setQuestionPoints(next, "x4", core.makePoints(undefined, "1 for the band, 2 with the song"));
    next = core.setQuestionPoints(next, "x5", { value: 2, note: " both " });
    const round = roundAt(next, 0);
    expect(round.questions.map((question) => core.effectivePoints(round, question))).toEqual([{ value: 3 }, { value: 0, note: "1 for the band, 2 with the song" }, { value: 2, note: "both" }]);
    expect(core.isQuizFile(core.toFile(next))).toBe(true);
  });

  it("a round's default points may be a note alone too", () => {
    const quiz = core.setRoundDefaults(sampleQuiz([1]), "x2", { points: core.makePoints(0, "Host decides") });
    expect(core.effectivePoints(roundAt(quiz, 0), questionAt(quiz, 0, 0))).toEqual({ value: 0, note: "Host decides" });
  });

  it("the note is cut to its longest length and the value kept in range", () => {
    expect(core.cleanPoints({ value: 1, note: "n".repeat(500) }).note).toHaveLength(core.POINTS_NOTE_MAX);
    expect(core.cleanPoints({ value: -2 })).toEqual({ value: 0 });
    expect(core.cleanPoints({ value: 0.5 })).toEqual({ value: 0.5 });
  });
});

describe("totals", () => {
  it("counts rounds, questions and the timers' seconds with own values", () => {
    let quiz = core.setRoundDefaults(sampleQuiz([2, 1]), "x5", { seconds: 60 });
    quiz = core.setQuestionSeconds(quiz, "x3", 10);
    expect(core.roundTotals(roundAt(quiz, 0))).toEqual({ rounds: 1, questions: 2, seconds: 40 });
    expect(core.totals(quiz)).toEqual({ rounds: 2, questions: 3, seconds: 100 });
    expect(core.totals(sampleQuiz([]))).toEqual({ rounds: 0, questions: 0, seconds: 0 });
  });
});
