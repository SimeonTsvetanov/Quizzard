// @vitest-environment jsdom
// The special rounds in the player (SPEC §10): their screens, the slide's picture in each state, the
// answer areas, the score entry through the round kind, the answer list with the Safe's code.
import { type Question, type QuizFile, safeCode } from "@simeonts/quizzard-quiz-core/play";
import { describe, expect, it } from "vitest";
import special from "../../core/test/fixtures/v1/special-rounds.quiz.json" with { type: "json" };
import { createEnv } from "../src/env.ts";
import { createGame } from "../src/game/create.ts";
import { roundsTotal } from "../src/game/scores.ts";
import type { GameState } from "../src/game/state.ts";
import { step } from "../src/game/step.ts";
import { renderSlide } from "../src/render/slide.ts";
import { dialAngle, tierState, vaultState } from "../src/render/rounds/index.ts";
import { answerLine, answerList } from "../src/views/recap.ts";
import { contextOf } from "../src/views/context.ts";
import { screenNames } from "./helpers.ts";

const file = special as unknown as QuizFile;
const env = createEnv({ file, dispatch: () => undefined });
const [pyramid, safe] = file.quiz.rounds;
if (!pyramid || !safe) throw new Error("fixture");

function slide(roundIndex: 0 | 1, index: number, reveal: boolean, phase: "question" | "answer"): HTMLElement {
  const round = roundIndex === 0 ? pyramid : safe;
  const question = round?.questions[index];
  if (!round || !question) throw new Error("no question");
  return renderSlide({ question, round, number: index + 1, reveal, phase, ui: env.parts, labels: env.labels });
}

describe("the special rounds play the standard flow", () => {
  it("the Safe's answers play as one sequence: each digit's slide gives way to the next by itself, the last one stays; at once = one slide with the code", () => {
    const game = createGame(file, { teamName: (n) => `Team ${String(n)}` });
    const safeAnswers = game.screens.filter((screen) => screen.screen === "answer" && file.quiz.rounds.find((round) => round.id === screen.roundId)?.kind === "safe");
    expect(safeAnswers.map((screen) => [screen.seconds, screen.silent ?? false])).toEqual([[4.5, true], [4.5, true], [4.5, true], [4.5, true], [0, false]]);
    const first = step(game, { type: "jump", index: game.screens.findIndex((screen) => screen === safeAnswers[0]) - 1 });
    const running = step(first, { type: "next" });
    expect(running.timer.status).toBe("running");
    const second = step(running, { type: "tick", ms: 4500 });
    expect(second.index).toBe(running.index + 1);
    expect(second.timer.status).toBe("running"); // and on it goes, without "Time is up"
    const last = step(step(step(second, { type: "tick", ms: 4500 }), { type: "tick", ms: 4500 }), { type: "tick", ms: 4500 });
    expect(last.index).toBe(running.index + 4);
    expect(step(last, { type: "tick", ms: 60_000 })).toBe(last);
    const atOnce = { ...file, quiz: { ...file.quiz, rounds: file.quiz.rounds.map((round) => (round.kind === "safe" ? { ...round, answersTogether: true } : round)) } };
    const names = createGame(atOnce, { teamName: (n) => `Team ${String(n)}` }).screens.filter((screen) => atOnce.quiz.rounds.find((round) => round.id === screen.roundId)?.kind === "safe").map((screen) => screen.screen);
    expect(names).toEqual(["rules", "question", "question", "question", "question", "question", "code", "score", "board"]);
  });

  it("rules, questions, Answers, answers, scores and the board — the pyramid's four questions on one screen (Moni 2026-11-26)", () => {
    const game = createGame(file, { teamName: (n) => `Team ${String(n)}` });
    const names = screenNames(game).map((name) => name.split(" ")[0]);
    // The Safe's five questions one by one; the pyramid's four together, under their times added up.
    expect(names.filter((name) => name === "question")).toHaveLength(5);
    expect(names.filter((name) => name === "pyramid")).toHaveLength(1);
    const all = game.screens.find((screen) => screen.screen === "pyramid");
    const pyramid = file.quiz.rounds.find((round) => round.kind === "pyramid");
    expect(all?.seconds).toBe((pyramid?.defaults.seconds ?? 0) * 4);
    expect(all?.questionId).toBeUndefined();
    expect(names.filter((name) => name === "answer")).toHaveLength(9);
    expect(names.filter((name) => name === "rules")).toHaveLength(2);
  });
});

describe("the Golden pyramid on the slide", () => {
  it("tiers: asked before, current, ahead on a question; open before, turning at the reveal on an answer", () => {
    const at = (index: number, phase: "question" | "answer", reveal: boolean): string[] => [0, 1, 2, 3].map((tier) => tierState(tier, { index, phase, reveal }));
    expect(at(2, "question", false)).toEqual(["asked", "asked", "current", "ahead"]);
    expect(at(2, "answer", false)).toEqual(["open", "open", "current", "asked"]);
    expect(at(2, "answer", true)).toEqual(["open", "open", "turning", "asked"]);
  });

  it("the slide carries the pyramid, n lines before the reveal and the accepted tiles at it", () => {
    const question = slide(0, 2, false, "question");
    expect(question.getAttribute("data-art")).toBe("pyramid");
    expect(question.querySelectorAll(".quiz-pyramid-tier")).toHaveLength(4);
    expect(question.querySelectorAll(".quiz-pyramid-line")).toHaveLength(3);
    expect(question.querySelector(".quiz-pyramid-ask")?.textContent).toContain("Write 3 answers");
    const revealed = slide(0, 2, true, "answer");
    expect([...revealed.querySelectorAll(".quiz-tile")].map((tile) => tile.textContent)).toEqual(["Helium", "Neon", "Argon", "Krypton", "Xenon", "Radon"]);
    expect(revealed.querySelector('[data-state="turning"]')?.children).toHaveLength(3);
  });

  it("a long list shows 12 tiles and how many more; the answer list shortens it", () => {
    const long: Question = { id: "q-long", kind: "text", prompt: "Name 4 US states.", points: { value: 4 }, answer: { type: "list", items: Array.from({ length: 50 }, (_, n) => `S${String(n)}`) } };
    const drawn = renderSlide({ question: long, round: pyramid, number: 4, reveal: true, phase: "answer", ui: env.parts, labels: env.labels });
    expect(drawn.querySelectorAll(".quiz-tile")).toHaveLength(13);
    expect(drawn.querySelector(".quiz-tile--more")?.textContent).toBe("+38 more");
    expect(answerLine(env, long)).toBe("S0, S1, S2, S3, S4, S5 … +44");
  });
});

describe("the Safe on the slide", () => {
  it("windows and lamps follow the code; the dial turns at a reveal; the fifth opens the door", () => {
    const view = (index: number, phase: "question" | "answer", reveal: boolean): ReturnType<typeof vaultState> => vaultState({ round: safe, index, phase, reveal, labels: env.labels });
    expect(view(2, "question", false).windows.map((one) => one.state)).toEqual(["asked", "asked", "current", "empty", "empty"]);
    const third = view(2, "answer", true);
    expect(third.windows.map((one) => one.text)).toEqual(["4", "7", "1", "?", "?"]);
    expect(third.dial).toEqual({ from: dialAngle(7), to: dialAngle(1) - 360, isTurning: true });
    expect(third.door).toBe("closed");
    expect(view(4, "answer", false).dial.isTurning).toBe(false);
    expect(view(4, "answer", true).door).toBe("opening");
  });

  it("the slide draws the vault and, at the reveal, \"Digit 3 of the code\" with the digit", () => {
    const drawn = slide(1, 2, true, "answer");
    expect(drawn.querySelector(".quiz-vault")?.getAttribute("aria-label")).toBe("Safe, digit 3 of 5");
    expect(drawn.querySelector(".quiz-slide-kicker")?.textContent).toBe("Digit 3 of the code");
    const safe = file.quiz.rounds.find((round) => round.kind === "safe");
    const code = safe ? safeCode(safe) : [];
    // The code as it stands: the two digits found before, this one large, two still to come (Moni 2026-11-26).
    const line = [...drawn.querySelectorAll("[data-code-line] .quiz-digit-box")];
    expect(line.map((box) => box.getAttribute("data-code") ?? "now")).toEqual(["set", "set", "now", "ahead", "ahead"]);
    expect(line.map((box) => box.textContent)).toEqual([String(code[0]), String(code[1]), String(code[2]), "?", "?"]);
    expect(slide(1, 2, false, "question").querySelector(".quiz-digit-value")?.textContent).toBe("?");
  });
});

/** A game moved to its screen of a name in a round. */
function to(state: GameState, screen: string, roundId: string): GameState {
  const index = state.screens.findIndex((one) => one.screen === screen && one.roundId === roundId);
  return step(state, { type: "jump", index });
}

describe("score entry of a Safe", () => {
  it("5 digits store 5 + bonus points; the stepper shows digits and the bonus beside them", () => {
    const actions: unknown[] = [];
    const live = createEnv({ file, dispatch: (action) => { actions.push(action); } });
    let state = to(createGame(file, { teamName: (n) => `Team ${String(n)}` }), "score", safe.id);
    const view = live.views.get("score")?.stage(contextOf(live, state, { canEdit: true, clock: null }));
    const more = view?.element.querySelector<HTMLButtonElement>('[data-score-row="t1"] [data-focus="score:t1:more"]');
    const field = view?.element.querySelector<HTMLInputElement>('[data-score-row="t1"] input');
    expect(field?.getAttribute("aria-label")).toBe("Digits right for Team 1");
    for (let n = 0; n < 6; n += 1) more?.click();
    expect(actions.at(-1)).toEqual({ type: "setScore", roundId: safe.id, teamId: "t1", value: 8 });
    state = step(state, { type: "setScore", roundId: safe.id, teamId: "t1", value: 8 });
    view?.sync?.(state);
    expect(field?.value).toBe("5");
    expect(view?.element.querySelector('[data-score-gives="t1"]')?.textContent).toBe("5 + 3 bonus");
    expect(roundsTotal(state, "t1")).toBe(8);
  });

  it("the round's answers end with the code; the guide says the bonus", () => {
    const list = answerList(env, safe, "Answers");
    expect(list.querySelector("[data-safe-code]")?.textContent).toBe("Code47192");
    const state = to(createGame(file, { teamName: (n) => `Team ${String(n)}` }), "score", pyramid.id);
    const guide = env.views.get("score")?.stage(contextOf(env, state, { canEdit: false, clock: null })).element.querySelector(".qp-guide");
    expect(guide?.textContent).toContain("Question 1: 1 answer");
    expect(guide?.textContent).toContain("Up to 10 points");
  });
});
