// The game's reducer (SPEC §6, AC9), move by move.
import { MAX_TEAMS, MIN_TEAMS, createRegistry } from "@simeonts/quizzard-quiz-core/play";
import { describe, expect, it } from "vitest";
import { buildScreens, createGame, firstTeams, roundStart } from "../src/game/create.ts";
import { type ScreenKind, createScreenKinds } from "../src/game/kinds.ts";
import { total } from "../src/game/scores.ts";
import { CUE_MS, MAX_SCORE, TEAM_NAME_MAX, type GameAction, type GameState, freshTimer } from "../src/game/state.ts";
import { peekNext, step } from "../src/game/step.ts";
import { at, deepFreeze, newGame, quizFile, screenNames } from "./helpers.ts";

/** The moves that need nothing but their name. */
type PlainMove = "next" | "back" | "reveal" | "timerStart" | "timerPause" | "timerToggle" | "timerReset" | "restart";

/** Makes several moves in a row; a plain move may be given by its name. */
function play(state: GameState, ...actions: (GameAction | PlainMove)[]): GameState {
  return actions.reduce<GameState>((game, action) => step(game, typeof action === "string" ? { type: action } : action), state);
}

/** "next" a number of times. */
const forward = (state: GameState, times: number): GameState => play(state, ...Array.from({ length: times }, () => "next" as const));

describe("createGame", () => {
  it("lists title, teams, each round's screens from its round kind, the tiebreak and the podium", () => {
    expect(screenNames(newGame([2, 1]))).toEqual([
      "title", "teams",
      "rules r1", "question q1.1", "question q1.2", "answers r1", "answer q1.1", "answer q1.2", "score r1", "board r1",
      "rules r2", "question q2.1", "answers r2", "answer q2.1", "score r2", "board r2",
      "tie", "final",
    ]);
  });

  it("writes each screen's timer and reveals next to it: a question has its time, an answer shows whole at once", () => {
    const file = quizFile([2]);
    const withOwnTime = { ...file, quiz: { ...file.quiz, rounds: file.quiz.rounds.map((round) => ({ ...round, questions: round.questions.map((question, index) => (index === 1 ? { ...question, seconds: 45 } : question)) })) } };
    const screens = buildScreens(withOwnTime);
    expect(screens.filter((screen) => screen.screen === "question").map((screen) => screen.seconds)).toEqual([10, 45]);
    expect(screens.filter((screen) => screen.screen === "answer").map((screen) => screen.steps)).toEqual([0, 0]);
    expect(screens.filter((screen) => screen.screen !== "question").every((screen) => screen.seconds === 0)).toBe(true);
  });

  it("leaves out a round without questions and a round of a kind it does not know", () => {
    const file = quizFile([1, 0, 1]);
    const strange = { ...file, quiz: { ...file.quiz, rounds: file.quiz.rounds.map((round, index) => (index === 2 ? { ...round, kind: "wheel" } : round)) } };
    expect(screenNames(createGame(strange, { teamName: String })).filter((name) => name.startsWith("rules"))).toEqual(["rules r1"]);
  });

  it("starts on the title with the quiz's number of teams (kept inside 2–12), no scores, questions running by themselves", () => {
    const game = newGame([1], 5);
    expect(at(game)).toBe("title");
    expect(game.teams).toEqual([1, 2, 3, 4, 5].map((n) => ({ id: `t${String(n)}`, name: `Team ${String(n)}` })));
    expect(game).toMatchObject({ nextTeam: 6, scores: {}, bonus: {}, winner: null, auto: true, step: 0 });
    expect(firstTeams(1, String)).toHaveLength(MIN_TEAMS);
    expect(firstTeams(99, String)).toHaveLength(MAX_TEAMS);
    expect(firstTeams(Number.NaN, String)).toHaveLength(MIN_TEAMS);
  });

  it("a screen of a round kind from the future plays as a plain screen: no timer, no reveal", () => {
    const wheel = createRegistry([{ id: "standard", screens: () => [{ screen: "wheel", roundId: "r1" }] }]);
    const game = createGame(quizFile([1]), { teamName: String, rounds: wheel });
    expect(screenNames(game)).toEqual(["title", "teams", "wheel r1", "tie", "final"]);
    expect(at(forward(game, 3))).toBe("final");
  });
});

describe("next, back and jump", () => {
  it("next walks every screen; an answer's slide takes one press (Moni 2026-11-26)", () => {
    const walk: string[] = [];
    let game = newGame([2]);
    for (let moves = 0; moves < 40; moves += 1) {
      walk.push(at(game));
      const next = step(game, { type: "next" });
      if (next === game) break;
      game = next;
    }
    expect(walk).toEqual([
      "title", "teams", "rules r1", "question q1.1", "question q1.2", "answers r1",
      // An upright screen (no `wide`): the score entry has two parts — the round's answers, then the points.
      "answer q1.1", "answer q1.2", "score r1", "score r1 revealed", "board r1", "final",
    ]);
  });

  it("the score entry is one screen on a wide stage and two parts on an upright one, in both directions", () => {
    const onScore = (game: GameState): GameState => step(game, { type: "jump", index: game.screens.findIndex((screen) => screen.screen === "score") });
    const score = onScore(newGame([2]));
    expect(score.screens[score.index]).toMatchObject({ screen: "score", steps: 1, upright: true });
    expect(at(score)).toBe("score r1");
    // Wide: Next goes straight to the leaderboard; Back from there shows the entry with both parts, and Back again leaves it.
    const board = deepFreeze(step(score, { type: "next", wide: true }));
    expect(at(board)).toBe("board r1");
    const again = deepFreeze(step(board, { type: "back", wide: true }));
    expect(at(again)).toBe("score r1 revealed");
    expect(at(step(again, { type: "back", wide: true }))).toBe("answer q1.2");
    expect(at(step(again, { type: "next", wide: true }))).toBe("board r1");
    // Upright: the answers, then the points, then the leaderboard — and the same way back.
    const points = deepFreeze(step(score, { type: "next", wide: false }));
    expect(at(points)).toBe("score r1 revealed");
    expect(at(step(points, { type: "next" }))).toBe("board r1");
    expect(at(step(points, { type: "back" }))).toBe("score r1");
    expect(at(step(step(points, { type: "back" }), { type: "back" }))).toBe("answer q1.2");
    // Points are entered on either part.
    expect(step(score, { type: "setScore", roundId: "r1", teamId: "t1", value: 3 }).scores).toEqual({ r1: { t1: 3 } });
  });

  it("a round that shows its answers at once has no answer slides; one moved on by hand never moves by itself (Moni 2026-11-26)", () => {
    const file = quizFile([2]);
    const together = { ...file, quiz: { ...file.quiz, rounds: file.quiz.rounds.map((round) => ({ ...round, answersTogether: true })) } };
    expect(buildScreens(together).map((screen) => screen.screen)).toEqual(["title", "teams", "rules", "question", "question", "score", "board", "tie", "final"]);
    const byHand = { ...file, quiz: { ...file.quiz, rounds: file.quiz.rounds.map((round) => ({ ...round, manualAdvance: true })) } };
    const game = createGame(byHand, { teamName: (n) => `Team ${String(n)}` });
    const question = play(game, "next", "next", "next");
    expect(at(question)).toBe("question q1.1");
    expect(question.timer.status).toBe("idle"); // the host starts it
    const over = play(question, { type: "timerStart" }, { type: "tick", ms: 60_000 });
    expect(at(over)).toBe("question q1.1");
    expect(over.timer.status).toBe("done");
  });

  it("stays put at both ends: back on the title and next on the podium return the same game", () => {
    const start = newGame([1]);
    expect(step(start, { type: "back" })).toBe(start);
    const end = step(start, { type: "jump", index: start.screens.length - 1 });
    expect(at(end)).toBe("final");
    expect(step(end, { type: "next" })).toBe(end);
  });

  it("back from an answer shows the answer before, and next comes back to it", () => {
    const second = forward(newGame([2]), 7);
    expect(at(second)).toBe("answer q1.2");
    expect(at(play(second, "back"))).toBe("answer q1.1");
    expect(at(play(second, "back", "back"))).toBe("answers r1");
    expect(at(play(second, "back", "next"))).toBe("answer q1.2");
  });

  it("reveal shows a screen's next part and does nothing more; on a screen without parts — an answer too — it does nothing", () => {
    const answer = forward(newGame([1]), 5);
    expect(at(answer)).toBe("answer q1.1");
    expect(step(answer, { type: "reveal" })).toBe(answer);
    const score = forward(answer, 1);
    expect(at(score)).toBe("score r1");
    const shown = step(score, { type: "reveal" });
    expect(at(shown)).toBe("score r1 revealed");
    expect(step(shown, { type: "reveal" })).toBe(shown);
    const title = newGame([1]);
    expect(step(title, { type: "reveal" })).toBe(title);
  });

  it("jump goes to a screen with nothing revealed, its timer waiting; out of range is kept inside the list", () => {
    const game = newGame([2, 1]);
    const toRound2 = step(game, { type: "jump", index: roundStart(game, "r2") });
    expect(at(toRound2)).toBe("rules r2");
    expect(roundStart(game, "nope")).toBe(-1);
    const toQuestion = step(game, { type: "jump", index: 3 });
    expect(toQuestion.timer).toEqual(freshTimer(10));
    expect(at(step(game, { type: "jump", index: -5 }))).toBe("title");
    expect(at(step(game, { type: "jump", index: 999 }))).toBe("final");
    expect(at(step(game, { type: "jump", index: Number.NaN }))).toBe("title");
  });

  it("the tiebreak screen is passed over — by next, back and jump — unless first place is shared", () => {
    const game = play(newGame([1]), { type: "setScore", roundId: "r1", teamId: "t1", value: 3 });
    const board = step(game, { type: "jump", index: 7 });
    expect(at(board)).toBe("board r1");
    expect(at(play(board, "next"))).toBe("final");
    expect(at(play(board, "next", "back"))).toBe("board r1");
    expect(at(step(game, { type: "jump", index: 8 }))).toBe("final");
    const level = play(board, { type: "setScore", roundId: "r1", teamId: "t2", value: 3 });
    expect(at(play(level, "next"))).toBe("tie");
    expect(at(play(level, "next", "next", "back"))).toBe("tie");
    // Nobody has a point: nothing to break.
    expect(at(play(step(newGame([1]), { type: "jump", index: 7 }), "next"))).toBe("final");
  });

  it("peekNext shows what next would, with a waiting timer, and the same game at the end", () => {
    const rules = forward(newGame([1]), 2);
    const peek = peekNext(rules);
    expect(at(peek)).toBe("question q1.1");
    expect(peek.timer.status).toBe("idle");
    const end = step(rules, { type: "jump", index: 999 });
    expect(peekNext(end)).toBe(end);
  });

  it("a custom screen kind is asked for its rules: skipped while it says so", () => {
    const kinds = createScreenKinds();
    const never: ScreenKind = { id: "never", isSkipped: () => true };
    kinds.register(never);
    const game: GameState = { ...newGame([1]), screens: [{ screen: "title", seconds: 0, steps: 0 }, { screen: "never", seconds: 0, steps: 0 }, { screen: "final", seconds: 0, steps: 0 }] };
    expect(at(step(game, { type: "next" }, kinds))).toBe("final");
    expect(at(step(game, { type: "jump", index: 1 }, kinds))).toBe("final");
  });
});

describe("the timer", () => {
  const onQuestion = (auto = true): GameState => forward(play(newGame([2]), { type: "setAuto", value: auto }), 3);

  it("starts with the question when questions run by themselves, waits when they do not", () => {
    expect(onQuestion().timer).toEqual({ status: "running", totalMs: 10_000, leftMs: 10_000, cueMs: 0 });
    expect(onQuestion(false).timer.status).toBe("idle");
  });

  it("does not start by itself on a question reached by going back or by a jump", () => {
    expect(play(onQuestion(), "next", "back").timer.status).toBe("idle");
    expect(step(onQuestion(), { type: "jump", index: 4 }).timer.status).toBe("idle");
  });

  it("ticks down; ticks of any length add up; time never goes below zero", () => {
    const ticked = play(onQuestion(), { type: "tick", ms: 200 }, { type: "tick", ms: 1300 });
    expect(ticked.timer.leftMs).toBe(8500);
    expect(play(onQuestion(false), "timerStart", { type: "tick", ms: 999_999 }).timer).toMatchObject({ status: "done", leftMs: 0 });
  });

  it("auto-advance: time up → the cue for a moment → the next question, its timer running", () => {
    const up = play(onQuestion(), { type: "tick", ms: 10_000 });
    expect(at(up)).toBe("question q1.1");
    expect(up.timer).toMatchObject({ status: "cue", leftMs: 0, cueMs: CUE_MS });
    const stillCue = play(up, { type: "tick", ms: CUE_MS - 1 });
    expect(at(stillCue)).toBe("question q1.1");
    const moved = play(stillCue, { type: "tick", ms: 1 });
    expect(at(moved)).toBe("question q1.2");
    expect(moved.timer).toEqual({ status: "running", totalMs: 10_000, leftMs: 10_000, cueMs: 0 });
  });

  it("after the round's last question the cue leads to the Answers divider, where nothing runs", () => {
    const last = play(onQuestion(), "next", { type: "tick", ms: 10_000 }, { type: "tick", ms: CUE_MS });
    expect(at(last)).toBe("answers r1");
    expect(last.timer).toEqual(freshTimer(0));
    expect(step(last, { type: "tick", ms: 5000 })).toBe(last);
  });

  it("without auto-advance time up waits for the host", () => {
    const up = play(onQuestion(false), "timerStart", { type: "tick", ms: 10_000 });
    expect(up.timer.status).toBe("done");
    expect(step(up, { type: "tick", ms: 60_000 })).toBe(up);
    expect(at(up)).toBe("question q1.1");
  });

  it("pause, start again, toggle and reset", () => {
    const paused = play(onQuestion(), { type: "tick", ms: 4000 }, "timerPause");
    expect(paused.timer).toMatchObject({ status: "paused", leftMs: 6000 });
    expect(step(paused, { type: "tick", ms: 4000 })).toBe(paused);
    expect(step(paused, { type: "timerPause" })).toBe(paused);
    expect(play(paused, "timerStart").timer).toMatchObject({ status: "running", leftMs: 6000 });
    expect(play(paused, "timerToggle", "timerToggle").timer.status).toBe("paused");
    expect(play(paused, "timerReset").timer).toEqual(freshTimer(10));
    const running = play(paused, "timerStart");
    expect(step(running, { type: "timerStart" })).toBe(running);
  });

  it("pausing the cue keeps the game on the question; starting again runs the time from the top", () => {
    const held = play(onQuestion(), { type: "tick", ms: 10_000 }, "timerToggle");
    expect(held.timer).toMatchObject({ status: "done", cueMs: 0 });
    expect(at(play(held, { type: "tick", ms: CUE_MS * 2 }))).toBe("question q1.1");
    expect(play(held, "timerStart").timer).toMatchObject({ status: "running", leftMs: 10_000 });
  });

  it("a screen without a timer ignores every timer move", () => {
    const title = newGame([1]);
    for (const type of ["timerStart", "timerPause", "timerToggle", "timerReset"] as const) expect(step(title, { type })).toBe(title);
    expect(step(title, { type: "tick", ms: 1000 })).toBe(title);
  });

  it("ignores ticks that are not time: zero, negative, not a number", () => {
    const game = onQuestion();
    for (const ms of [0, -5, Number.NaN, Number.POSITIVE_INFINITY * 0]) expect(step(game, { type: "tick", ms })).toBe(game);
  });
});

describe("teams", () => {
  it("names are set as typed, cut to the longest name; an unknown team or the same name changes nothing", () => {
    const game = newGame([1]);
    expect(step(game, { type: "setTeamName", teamId: "t2", name: "The Foxes" }).teams[1]).toEqual({ id: "t2", name: "The Foxes" });
    expect(step(game, { type: "setTeamName", teamId: "t2", name: "x".repeat(99) }).teams[1]?.name).toHaveLength(TEAM_NAME_MAX);
    expect(step(game, { type: "setTeamName", teamId: "t2", name: "Team 2" })).toBe(game);
    expect(step(game, { type: "setTeamName", teamId: "nope", name: "x" })).toBe(game);
  });

  it("adds teams with new ids up to 12 and removes them down to 2", () => {
    let game = newGame([1], 3);
    for (let n = 0; n < 20; n += 1) game = step(game, { type: "addTeam", name: `New ${String(n)}` });
    expect(game.teams).toHaveLength(MAX_TEAMS);
    expect(new Set(game.teams.map((team) => team.id)).size).toBe(MAX_TEAMS);
    expect(step(game, { type: "addTeam", name: "one more" })).toBe(game);
    for (const team of [...game.teams]) game = step(game, { type: "removeTeam", teamId: team.id });
    expect(game.teams).toHaveLength(MIN_TEAMS);
    expect(step(game, { type: "removeTeam", teamId: game.teams[0]?.id ?? "" })).toBe(game);
  });

  it("an id is never used again after its team was removed", () => {
    const game = play(newGame([1], 3), { type: "removeTeam", teamId: "t3" }, { type: "addTeam", name: "Late" });
    expect(game.teams.map((team) => team.id)).toEqual(["t1", "t2", "t4"]);
  });

  it("removing a team takes its points, its tiebreak points and its win with it", () => {
    const game = play(newGame([1], 3), { type: "setScore", roundId: "r1", teamId: "t3", value: 4 }, { type: "addBonus", teamId: "t3", by: 1 }, { type: "pickWinner", teamId: "t3" }, { type: "removeTeam", teamId: "t3" });
    expect(game.scores).toEqual({ r1: {} });
    expect(game.bonus).toEqual({});
    expect(game.winner).toBeNull();
    expect(step(game, { type: "removeTeam", teamId: "t3" })).toBe(game);
  });
});

describe("scores", () => {
  it("a score is per round and team, kept in halves inside 0–999", () => {
    const game = newGame([1, 1]);
    const set = (value: number): number | undefined => step(game, { type: "setScore", roundId: "r2", teamId: "t1", value }).scores["r2"]?.["t1"];
    expect(set(3)).toBe(3);
    expect(set(2.5)).toBe(2.5);
    expect(set(2.26)).toBe(2.5);
    expect(set(99_999)).toBe(MAX_SCORE);
    expect(step(game, { type: "setScore", roundId: "r2", teamId: "t1", value: -4 })).toBe(game); // already 0
    expect(step(game, { type: "setScore", roundId: "r2", teamId: "t1", value: Number.NaN })).toBe(game);
  });

  it("a score for a team or a round the game does not have changes nothing", () => {
    const game = newGame([1]);
    expect(step(game, { type: "setScore", roundId: "r9", teamId: "t1", value: 2 })).toBe(game);
    expect(step(game, { type: "setScore", roundId: "r1", teamId: "t9", value: 2 })).toBe(game);
  });

  it("tiebreak points add to the total and never go below zero", () => {
    const game = play(newGame([1]), { type: "setScore", roundId: "r1", teamId: "t1", value: 2 }, { type: "addBonus", teamId: "t1", by: 1 }, { type: "addBonus", teamId: "t1", by: 1 });
    expect(total(game, "t1")).toBe(4);
    expect(total(play(game, { type: "addBonus", teamId: "t1", by: -5 }), "t1")).toBe(2);
    const none = newGame([1]);
    expect(step(none, { type: "addBonus", teamId: "t1", by: -1 })).toBe(none);
    expect(step(none, { type: "addBonus", teamId: "t9", by: 1 })).toBe(none);
    expect(step(none, { type: "addBonus", teamId: "t1", by: Number.NaN })).toBe(none);
  });

  it("the winner of a tie is a team of the game, or nobody", () => {
    const game = newGame([1]);
    const picked = step(game, { type: "pickWinner", teamId: "t2" });
    expect(picked.winner).toBe("t2");
    expect(step(picked, { type: "pickWinner", teamId: "t2" })).toBe(picked);
    expect(step(picked, { type: "pickWinner", teamId: null }).winner).toBeNull();
    expect(step(game, { type: "pickWinner", teamId: "t9" })).toBe(game);
  });
});

describe("settings and starting again", () => {
  it("setAuto switches questions running by themselves; the same value changes nothing", () => {
    const game = newGame([1]);
    expect(step(game, { type: "setAuto", value: false }).auto).toBe(false);
    expect(step(game, { type: "setAuto", value: true })).toBe(game);
  });

  it("restart goes back to the title and clears the scores; the teams and their names stay", () => {
    const played = play(forward(newGame([1]), 4), { type: "setTeamName", teamId: "t1", name: "Foxes" }, { type: "setScore", roundId: "r1", teamId: "t1", value: 5 }, { type: "addBonus", teamId: "t1", by: 1 }, { type: "pickWinner", teamId: "t1" }, { type: "setAuto", value: false });
    const again = step(played, { type: "restart" });
    expect(at(again)).toBe("title");
    expect(again).toMatchObject({ scores: {}, bonus: {}, winner: null, auto: false, step: 0 });
    expect(again.teams[0]?.name).toBe("Foxes");
    expect(again.timer).toEqual(freshTimer(0));
  });
});
