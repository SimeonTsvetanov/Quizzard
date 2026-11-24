// The round's answers in one list (views/recap.ts): how one answer is written, how many columns a
// list gets, which round a break may show — and a game saved before the list existed.
import type { Question, QuizFile } from "@simeonts/quizzard-quiz-core/play";
import { describe, expect, it } from "vitest";
import { createEnv } from "../src/env.ts";
import { createGame } from "../src/game/create.ts";
import { restore, toSaved } from "../src/game/save.ts";
import type { GameState } from "../src/game/state.ts";
import { step } from "../src/game/step.ts";
import { shaped } from "../src/ui/commands.ts";
import { BREAK_STEPS, answerLine, recapColumns, recapRound } from "../src/views/recap.ts";
import { at, quizFile } from "./helpers.ts";

const question = (answer: Question["answer"]): Question => ({ id: "q", kind: "text", prompt: "?", answer });
const options = [{ id: "a", text: "Caterpillar" }, { id: "b", text: "Beetle" }, { id: "c", text: " " }, { id: "d", text: "Spider" }];

function envOf(file: QuizFile): ReturnType<typeof createEnv> {
  return createEnv({ file, dispatch: () => undefined });
}

describe("one answer in the list", () => {
  const env = envOf(quizFile([1]));
  const bulgarian = envOf({ ...quizFile([1]), quiz: { ...quizFile([1]).quiz, language: "bg" } });

  it("a choice is written with the letter of every correct option, in option order", () => {
    expect(answerLine(env, question({ type: "choice", options, correct: ["a"] }))).toBe("A: Caterpillar");
    expect(answerLine(env, question({ type: "choice", options, correct: ["d", "a"] }))).toBe("A: Caterpillar · D: Spider");
    // An option without text is its letter alone.
    expect(answerLine(env, question({ type: "choice", options, correct: ["c"] }))).toBe("C");
  });

  it("true / false is the word in the quiz's language; an open answer is its text", () => {
    expect(answerLine(env, question({ type: "trueFalse", correct: true }))).toBe("True");
    expect(answerLine(bulgarian, question({ type: "trueFalse", correct: false }))).toBe("Невярно");
    expect(answerLine(bulgarian, question({ type: "open", text: "Крава" }))).toBe("Крава");
  });

  it("an answer that was left empty, or of a type this version does not know, is the placeholder — never a blank line", () => {
    expect(answerLine(env, question({ type: "open", text: "  " }))).toBe(env.labels.emptyAnswer);
    expect(answerLine(env, question({ type: "choice", options, correct: [] }))).toBe(env.labels.emptyAnswer);
    expect(answerLine(env, question({ type: "from-a-later-quizzard" }))).toBe(env.labels.emptyAnswer);
  });
});

describe("how many columns a list gets on a wide stage", () => {
  it("one up to ten answers, two up to twenty-four, three for the longest round (50)", () => {
    expect([1, 10, 11, 24, 25, 50].map((count) => recapColumns(count))).toEqual([1, 1, 2, 2, 3, 3]);
  });

  it("under a break's countdown the list has the whole height: a column takes more", () => {
    expect([12, 14, 15, 30, 31, 50].map((count) => recapColumns(count, BREAK_STEPS))).toEqual([1, 1, 2, 2, 3, 3]);
  });
});

describe("the round a break shows the answers of", () => {
  const file = quizFile([2, 1]);
  const env = envOf(file);
  const fresh = createGame(file, { teamName: (n) => `Team ${String(n)}` });
  const on = (name: string): GameState => {
    const index = fresh.screens.findIndex((screen) => [screen.screen, screen.questionId ?? screen.roundId].filter((part) => part !== undefined).join(" ") === name);
    return step(fresh, { type: "jump", index });
  };

  it("none while the first round is still played — not even while its answers are being revealed", () => {
    for (const place of ["title", "question q1.2", "answers r1", "answer q1.2"]) expect(recapRound(env, on(place))).toBeUndefined();
  });

  it("a round from its score entry on, until the next round's own score entry", () => {
    expect(recapRound(env, on("score r1"))?.id).toBe("r1");
    expect(recapRound(env, on("board r1"))?.id).toBe("r1");
    expect(recapRound(env, on("question q2.1"))?.id).toBe("r1");
    expect(recapRound(env, on("answer q2.1"))?.id).toBe("r1");
    expect(recapRound(env, on("score r2"))?.id).toBe("r2");
    expect(recapRound(env, on("final"))?.id).toBe("r2");
  });

  it("a break started on the score entry covers it and ends back on it, part and points kept", () => {
    const points = step(step(on("score r1"), { type: "next" }), { type: "setScore", roundId: "r1", teamId: "t1", value: 2 });
    const resting = step(points, { type: "break", minutes: 10 });
    expect(resting.curtain).toEqual({ kind: "break", totalMs: 600_000, leftMs: 600_000 });
    expect(step(resting, { type: "tick", ms: 1000 }).curtain).toMatchObject({ leftMs: 599_000 });
    const back = step(resting, { type: "uncover" });
    expect(at(back)).toBe("score r1 revealed");
    expect(back.scores).toEqual({ r1: { t1: 2 } });
    // Next on a covered stage only uncovers it: the game does not move on behind the break.
    expect(at(step(resting, { type: "next", wide: true }))).toBe("score r1 revealed");
  });
});

describe("a window's shape goes with its moves", () => {
  it("next and back say whether the asking window is wide; every other move is left as it is", () => {
    expect(shaped({ type: "next" }, true)).toEqual({ type: "next", wide: true });
    expect(shaped({ type: "back" }, false)).toEqual({ type: "back", wide: false });
    // Already said (the audience's window sends its own shape): kept.
    expect(shaped({ type: "next", wide: false }, true)).toEqual({ type: "next", wide: false });
    const reveal = { type: "reveal" } as const;
    expect(shaped(reveal, true)).toBe(reveal);
  });
});

describe("games saved before the score entry had two parts", () => {
  const file = quizFile([2]);
  const fresh = createGame(file, { teamName: (n) => `Team ${String(n)}` });
  const scoreIndex = fresh.screens.findIndex((screen) => screen.screen === "score");

  it("an old save on the score entry opens on its first part with its points", () => {
    const old = { v: 1, index: scoreIndex, step: 0, teams: fresh.teams, nextTeam: 4, scores: { r1: { t1: 3 } }, bonus: {}, winner: null, auto: true, timer: { status: "idle", totalMs: 0, leftMs: 0, cueMs: 0 } };
    const game = restore(fresh, JSON.parse(JSON.stringify(old)));
    expect(at(game)).toBe("score r1");
    expect(game.scores).toEqual({ r1: { t1: 3 } });
    expect(game.media.zoom).toBe(false);
  });

  it("a save on the second part comes back on it; a step no screen has is cut to what the screen has", () => {
    const points = step(step(fresh, { type: "jump", index: scoreIndex }), { type: "next" });
    expect(at(restore(fresh, JSON.parse(JSON.stringify(toSaved(points)))))).toBe("score r1 revealed");
    expect(restore(fresh, { ...toSaved(points), step: 7 }).step).toBe(1);
  });
});
