import { describe, expect, it } from "vitest";
import fc from "fast-check";
import * as core from "../src/index.ts";
import { deepFreeze, questionIds, sampleQuiz, testEnv } from "./helpers.ts";

/** A frozen quiz of 1–4 rounds with 0–5 questions each; some questions have their own time. */
const quizArb = fc
  .record({ shape: fc.array(fc.integer({ min: 0, max: 5 }), { minLength: 1, maxLength: 4 }), own: fc.array(fc.tuple(fc.nat(), fc.integer({ min: 5, max: 600 })), { maxLength: 4 }) })
  .map(({ shape, own }) => {
    let quiz = sampleQuiz(shape);
    const ids = questionIds(quiz);
    for (const [pick, seconds] of own) {
      const id = ids[pick % Math.max(ids.length, 1)];
      if (id !== undefined) quiz = core.setQuestionSeconds(quiz, id, seconds);
    }
    return deepFreeze(quiz);
  });

const pick = <T>(list: readonly T[], n: number): T => list[n % list.length] as T;
const roundIds = (quiz: core.Quiz): string[] => quiz.rounds.map((round) => round.id);
const allIds = (quiz: core.Quiz): string[] => [quiz.id, ...roundIds(quiz), ...questionIds(quiz)];
const sorted = (list: readonly string[]): string[] => [...list].sort();

describe("ops properties", () => {
  it("moveRound keeps the same set of rounds and puts the round at the clamped index", () => {
    fc.assert(
      fc.property(quizArb, fc.nat(), fc.integer({ min: -3, max: 10 }), (quiz, n, to) => {
        const id = pick(roundIds(quiz), n);
        const next = core.moveRound(quiz, id, to);
        expect(sorted(roundIds(next))).toEqual(sorted(roundIds(quiz)));
        expect(roundIds(next).indexOf(id)).toBe(Math.min(Math.max(to, 0), quiz.rounds.length - 1));
        expect(roundIds(next).filter((other) => other !== id)).toEqual(roundIds(quiz).filter((other) => other !== id));
        expect(questionIds(next).length).toBe(questionIds(quiz).length);
      }),
    );
  });

  it("moveQuestion keeps the total count and the same questions, and lands in the target round", () => {
    fc.assert(
      fc.property(quizArb, fc.nat(), fc.nat(), fc.option(fc.integer({ min: -2, max: 8 }), { nil: undefined }), (quiz, q, r, to) => {
        fc.pre(questionIds(quiz).length > 0);
        const id = pick(questionIds(quiz), q);
        const target = pick(roundIds(quiz), r);
        const before = core.findQuestion(quiz, id);
        const next = core.moveQuestion(quiz, id, target, to);
        expect(sorted(questionIds(next))).toEqual(sorted(questionIds(quiz)));
        expect(core.totals(next).questions).toBe(core.totals(quiz).questions);
        const after = core.findQuestion(next, id);
        expect(after?.round.id).toBe(target);
        expect(after?.question).toBe(before?.question);
        if (to !== undefined) expect(after?.index).toBe(Math.min(Math.max(to, 0), (after?.round.questions.length ?? 1) - 1));
      }),
    );
  });

  it("duplicateRound gives new ids: every id stays unique and the questions are copied", () => {
    fc.assert(
      fc.property(quizArb, fc.nat(), (quiz, n) => {
        const id = pick(roundIds(quiz), n);
        const next = core.duplicateRound(quiz, id, testEnv("dup"));
        expect(new Set(allIds(next)).size).toBe(allIds(next).length);
        const copied = core.findRound(quiz, id)?.questions.length ?? 0;
        expect(core.totals(next)).toMatchObject({ rounds: quiz.rounds.length + 1, questions: questionIds(quiz).length + copied });
        expect(roundIds(next)[roundIds(quiz).indexOf(id) + 1]).toMatch(/^dup/);
      }),
    );
  });

  it("duplicateQuestion gives a new id and one more question, right after the original", () => {
    fc.assert(
      fc.property(quizArb, fc.nat(), (quiz, n) => {
        fc.pre(questionIds(quiz).length > 0);
        const id = pick(questionIds(quiz), n);
        const next = core.duplicateQuestion(quiz, id, testEnv("dup"));
        expect(new Set(allIds(next)).size).toBe(allIds(next).length);
        expect(questionIds(next).length).toBe(questionIds(quiz).length + 1);
        const place = core.findQuestion(next, id);
        expect(place?.round.questions[place.index + 1]).toEqual({ ...place?.question, id: "dup1" });
      }),
    );
  });

  it("deleteQuestion and deleteRound remove exactly their ids", () => {
    fc.assert(
      fc.property(quizArb, fc.nat(), (quiz, n) => {
        const roundId = pick(roundIds(quiz), n);
        const gone = new Set([roundId, ...(core.findRound(quiz, roundId)?.questions.map((question) => question.id) ?? [])]);
        expect(allIds(core.deleteRound(quiz, roundId))).toEqual(allIds(quiz).filter((id) => !gone.has(id)));
        const ids = questionIds(quiz);
        if (ids.length > 0) {
          const questionId = pick(ids, n);
          expect(allIds(core.deleteQuestion(quiz, questionId))).toEqual(allIds(quiz).filter((id) => id !== questionId));
        }
      }),
    );
  });

  it("a change of the round's time never changes a question that has its own (AC2)", () => {
    fc.assert(
      fc.property(quizArb, fc.nat(), fc.integer({ min: 5, max: 600 }), (quiz, n, seconds) => {
        const roundId = pick(roundIds(quiz), n);
        const next = core.setRoundDefaults(quiz, roundId, { seconds });
        const before = core.findRound(quiz, roundId);
        const after = core.findRound(next, roundId);
        after?.questions.forEach((question, index) => {
          const old = before?.questions[index];
          expect(core.effectiveSeconds(after, question)).toBe(old?.seconds ?? seconds);
        });
      }),
    );
  });

  it("play time is the sum of every question's effective seconds", () => {
    fc.assert(
      fc.property(quizArb, (quiz) => {
        const sum = quiz.rounds.flatMap((round) => round.questions.map((question) => core.effectiveSeconds(round, question))).reduce((a, b) => a + b, 0);
        expect(core.totals(quiz)).toEqual({ rounds: quiz.rounds.length, questions: questionIds(quiz).length, seconds: sum });
      }),
    );
  });

  it("every edit of a frozen quiz gives a valid quiz file and never mutates its input", () => {
    const edit = fc.constantFrom<(quiz: core.Quiz, a: string, b: string, n: number) => core.Quiz>(
      (quiz) => core.addRound(quiz, "New", testEnv("e")),
      (quiz, _a, b) => core.addQuestion(quiz, b, { answerType: "choice" }, testEnv("e")),
      (quiz, _a, b, n) => core.moveRound(quiz, b, n),
      (quiz, a, b, n) => core.moveQuestion(quiz, a, b, n),
      (quiz, a) => core.duplicateQuestion(quiz, a, testEnv("e")),
      (quiz, _a, b) => core.duplicateRound(quiz, b, testEnv("e")),
      (quiz, a) => core.deleteQuestion(quiz, a),
      (quiz, _a, b) => core.deleteRound(quiz, b),
      (quiz, a, _b, n) => core.setQuestionSeconds(quiz, a, n * 7),
      (quiz, a, _b, n) => core.setQuestionPoints(quiz, a, { value: n, note: "note" }),
      (quiz, a) => core.setQuestionKind(quiz, a, "video"),
      (quiz, a) => core.setAnswerType(quiz, a, "trueFalse", testEnv("e")),
      (quiz, a) => core.editQuestion(quiz, a, { prompt: "Edited", explanation: "Why" }),
      (quiz, _a, b, n) => core.setRoundDefaults(quiz, b, { seconds: n * 11, points: { value: n } }),
      (quiz, _a, b) => core.setRoundRules(quiz, b, "Rules"),
      (quiz, _a, _b, n) => core.setTeams(quiz, n),
    );
    fc.assert(
      fc.property(quizArb, edit, fc.nat(), fc.nat(), fc.integer({ min: 0, max: 9 }), (quiz, run, q, r, n) => {
        const snapshot = JSON.stringify(quiz);
        const next = run(quiz, pick([...questionIds(quiz), "missing"], q), pick(roundIds(quiz), r), n);
        expect(JSON.stringify(quiz)).toBe(snapshot);
        expect(core.isQuizFile(core.toFile(next))).toBe(true);
        expect(core.open(JSON.parse(JSON.stringify(core.toFile(next))))).toMatchObject({ ok: true });
      }),
    );
  });
});
