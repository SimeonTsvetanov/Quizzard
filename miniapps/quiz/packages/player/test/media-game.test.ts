// Media, the black screen and the break as moves of the game (slices 3–4 and the host's extras):
// a clip never starts by itself, the timer of a question with a clip waits for the clip's end or the
// host, a covered stage rests, and nothing of it changes its input.
import type { MediaEntry, QuizFile } from "@simeonts/quizzard-quiz-core/play";
import { describe, expect, it } from "vitest";
import { forAudience } from "../src/channel.ts";
import { createGame, mediaOfScreen } from "../src/game/create.ts";
import { restore, toSaved } from "../src/game/save.ts";
import { CLIP_END_GRACE_MS, type GameAction, type GameState } from "../src/game/state.ts";
import { peekNext, step } from "../src/game/step.ts";
import { at, deepFreeze, quizFile } from "./helpers.ts";

const MEDIA: readonly MediaEntry[] = [
  { id: "pic", type: "image", mime: "image/jpeg", name: "p.jpg", bytes: 10, width: 400, height: 300 },
  { id: "song", type: "audio", mime: "audio/mpeg", name: "s.mp3", bytes: 10, seconds: 4 },
  { id: "film", type: "video", mime: "video/mp4", name: "f.mp4", bytes: 10, seconds: 0 },
];

/** One round: q1.1 text, q1.2 a picture, q1.3 a 4 s song, q1.4 a video of unknown length; 10 s per question. */
function mediaFile(): QuizFile {
  const file = quizFile([4]);
  const [round] = file.quiz.rounds;
  if (!round) throw new Error("round");
  const files = [undefined, "pic", "song", "film"];
  const questions = round.questions.map((question, index) => (files[index] === undefined ? question : { ...question, media: { id: files[index] }, note: `note ${String(index)}` }));
  return { ...file, media: MEDIA, quiz: { ...file.quiz, rounds: [{ ...round, questions }] } };
}

const fresh = (): GameState => deepFreeze(createGame(mediaFile(), { teamName: (n) => `Team ${String(n)}` }));
const run = (state: GameState, ...actions: GameAction[]): GameState => actions.reduce((now, action) => deepFreeze(step(now, action)), state);
const next: GameAction = { type: "next" };
const media = (command: Extract<GameAction, { type: "media" }>["command"]): GameAction => ({ type: "media", command });
const tick = (ms: number): GameAction => ({ type: "tick", ms });
/** Presses next until the game is on question `n` (1-based) of the round — twice on a clip's screen on the way (it plays first). */
function walkTo(state: GameState, n: number): GameState {
  let now = state;
  for (let press = 0; press < 20 && at(now) !== `question q1.${String(n)}`; press += 1) now = run(now, next);
  return now;
}
/** title → teams → rules → question `n` (1-based). */
const onQuestion = (n: number): GameState => walkTo(fresh(), n);

describe("what a question's file is to the game", () => {
  it("a picture is a still, audio and video are clips with their length when known", () => {
    expect(mediaOfScreen(undefined)).toEqual({});
    // A picture and a video can fill the stage (`zoom`); a sound has nothing to enlarge.
    expect(mediaOfScreen(MEDIA[0])).toEqual({ media: "still", zoom: true });
    expect(mediaOfScreen(MEDIA[1])).toEqual({ media: "clip", clipMs: 4000 });
    expect(mediaOfScreen(MEDIA[2])).toEqual({ media: "clip", zoom: true });
    const timed: MediaEntry = { id: "film", type: "video", mime: "video/mp4", name: "f.mp4", bytes: 10, seconds: 3 };
    expect(mediaOfScreen(timed)).toEqual({ media: "clip", clipMs: 3000, zoom: true });
    const screens = fresh().screens.filter((screen) => screen.questionId !== undefined);
    expect(screens.map((screen) => [screen.screen, screen.media ?? "none"])).toEqual([
      ["question", "none"], ["question", "still"], ["question", "clip"], ["question", "clip"],
      ["answer", "none"], ["answer", "still"], ["answer", "clip"], ["answer", "clip"],
    ]);
  });

  it("a media entry the quiz does not have leaves the question without media", () => {
    const file = mediaFile();
    const game = createGame({ ...file, media: [] }, { teamName: () => "T" });
    expect(game.screens.every((screen) => screen.media === undefined)).toBe(true);
  });
});

// Moni 2026-11-26: on a screen with a clip, "next" starts the clip; the following "next" moves on.
describe("the host's next on a screen with a clip", () => {
  it("the first next plays the question's clip, the second moves on; a clip already started is not started again", () => {
    const clip = onQuestion(3);
    const playing = run(clip, next);
    expect(at(playing)).toBe("question q1.3");
    expect(playing.media.status).toBe("playing");
    expect(at(run(playing, next))).toBe("question q1.4");
    // Started with the clip's own button, paused or ended: next moves on at once.
    expect(at(run(clip, media("play"), next))).toBe("question q1.4");
    expect(at(run(clip, media("play"), tick(500), media("pause"), next))).toBe("question q1.4");
    expect(at(run(clip, media("play"), media("ended"), next))).toBe("question q1.4");
  });

  it("a text or picture question moves on at the first next; a covered stage is uncovered first", () => {
    expect(at(run(onQuestion(1), next))).toBe("question q1.2");
    expect(at(run(onQuestion(2), next))).toBe("question q1.3");
    const covered = run(onQuestion(3), { type: "black" }, next);
    expect(covered.curtain).toBeNull();
    expect(covered.media.status).toBe("idle");
    expect(run(covered, next).media.status).toBe("playing");
  });

  it("an answer screen that only shows the question's clip again does not ask for it; the host's preview shows the screen after", () => {
    const screens = fresh().screens;
    expect(screens.filter((screen) => screen.clipFirst === true).map((screen) => `${screen.screen} ${screen.questionId ?? ""}`)).toEqual(["question q1.3", "question q1.4"]);
    expect(at(peekNext(onQuestion(3)))).toBe("question q1.4");
  });

  it("a clip kept for the answer leads its answer screen: after the reveal, next plays it, then moves on", () => {
    const file = mediaFile();
    const [round] = file.quiz.rounds;
    if (!round) throw new Error("round");
    const questions = round.questions.map((question, index) => (index === 0 ? { ...question, answerMedia: { id: "song" } } : question));
    const game = deepFreeze(createGame({ ...file, quiz: { ...file.quiz, rounds: [{ ...round, questions }] } }, { teamName: () => "T" }));
    const index = game.screens.findIndex((screen) => screen.screen === "answer" && screen.questionId === "q1.1");
    expect(game.screens[index]).toMatchObject({ media: "clip", clipFirst: true });
    let state = run(game, { type: "jump", index });
    for (let reveal = 0; reveal < (game.screens[index]?.steps ?? 0); reveal += 1) state = run(state, next);
    expect(state.media.status).toBe("idle");
    state = run(state, next);
    expect(state.index).toBe(index);
    expect(state.media.status).toBe("playing");
    expect(run(state, next).index).toBe(index + 1);
  });
});

describe("clips and the timer", () => {
  it("a text or picture question starts its timer by itself; a question with a clip waits", () => {
    expect(onQuestion(1).timer.status).toBe("running");
    expect(onQuestion(2).timer.status).toBe("running");
    const clip = onQuestion(3);
    expect(at(clip)).toBe("question q1.3");
    expect(clip.timer).toMatchObject({ status: "idle", leftMs: 10_000 });
    expect(clip.media.status).toBe("idle"); // and the clip waits for the host too
    expect(run(clip, tick(5000))).toBe(clip);
  });

  it("the timer starts with the clip and goes on after a shorter clip has ended (Moni 2026-11-26)", () => {
    const playing = run(onQuestion(3), media("play"), tick(1500));
    expect(playing.media).toMatchObject({ status: "playing", ms: 1500 });
    expect(playing.timer).toMatchObject({ status: "running", leftMs: 8500 });
    const ended = run(playing, media("ended"));
    expect(ended.media.status).toBe("ended");
    expect(run(ended, tick(1000)).timer).toMatchObject({ status: "running", leftMs: 7500 });
    // Played again, the clip does not touch a timer that is already running or over.
    const again = run(ended, tick(1000), media("play"), media("ended"));
    expect(again.timer).toMatchObject({ status: "running", leftMs: 7500 });
  });

  it("the time running out stops a clip that still plays, and the game moves on to the next clip and starts it", () => {
    // Question 3's song was paused for a while, so it is behind the timer when the time is up.
    const behind = run(onQuestion(3), media("play"), tick(1000), media("pause"), tick(8000), media("play"), tick(999));
    expect(behind.media.status).toBe("playing");
    const over = run(behind, tick(1));
    expect(over.timer.status).toBe("cue");
    expect(over.media.status).toBe("ended");
    // After the cue the game is on question 4 — a video — which plays by itself, with its timer.
    const moved = run(over, tick(60_000));
    expect(at(moved)).toBe("question q1.4");
    expect(moved.media.status).toBe("playing");
    expect(moved.timer.status).toBe("running");
    // With "questions run by themselves" off nothing starts by itself.
    const manual = run(walkTo(run(fresh(), { type: "setAuto", value: false }), 3), media("play"), tick(10_000));
    expect(manual.timer.status).toBe("idle");
    expect(at(manual)).toBe("question q1.3");
  });

  it("with \"questions run by themselves\" off, the clip's end starts nothing", () => {
    const manual = run(walkTo(run(fresh(), { type: "setAuto", value: false }), 3), media("play"), media("ended"));
    expect(at(manual)).toBe("question q1.3");
    expect(manual.timer.status).toBe("idle");
  });

  it("the host may start the timer while the clip plays; pause and restart act on the clip alone", () => {
    const both = run(onQuestion(3), media("play"), { type: "timerStart" }, tick(1000));
    expect(both.timer).toMatchObject({ status: "running", leftMs: 9000 });
    expect(both.media).toMatchObject({ status: "playing", ms: 1000 });
    const paused = run(both, media("toggle"), tick(1000));
    expect(paused.media).toMatchObject({ status: "paused", ms: 1000 });
    expect(paused.timer.leftMs).toBe(8000);
    expect(run(paused, media("restart")).media).toMatchObject({ status: "playing", ms: 0, seq: 1 });
  });

  it("a clip whose window never said \"ended\" is taken as ended a moment after its length", () => {
    const late = run(onQuestion(3), media("play"), tick(4000 + CLIP_END_GRACE_MS - 1));
    expect(late.media.status).toBe("playing");
    const over = run(late, tick(1));
    expect(over.media.status).toBe("ended");
    expect(over.timer.status).toBe("running");
    // A clip of unknown length ends when its window says so — or when the question's time has played (below).
    const unknown = run(onQuestion(4), media("play"), tick(9_000));
    expect(unknown.media).toMatchObject({ status: "playing", ms: 9_000 });
  });

  it("a clip longer than the question's time stops when that time has played, and plays again from its start", () => {
    // Question 4: a video of unknown length on a 10 s question.
    const almost = run(onQuestion(4), media("play"), tick(9_999));
    expect(almost.media.status).toBe("playing");
    const over = run(almost, tick(1));
    expect(over.media.status).toBe("ended");
    expect(over.timer.status).toBe("cue"); // the timer ran with the clip: the time is up for both
    expect(run(over, media("toggle")).media).toMatchObject({ status: "playing", ms: 0 });
    // A clip shorter than the time is not touched: the 4 s song ends at its own end.
    expect(run(onQuestion(3), media("play"), tick(3_999)).media.status).toBe("playing");
  });

  it("a video zooms like a picture and plays on: the clip, its timer and the zoom do not touch each other; Escape only leaves", () => {
    const video = onQuestion(4);
    const zoomed = run(video, media("play"), tick(700), media("zoom"));
    expect(zoomed.media).toMatchObject({ status: "playing", ms: 700, zoom: true });
    expect(run(zoomed, tick(300)).media).toMatchObject({ status: "playing", ms: 1000, zoom: true });
    expect(run(zoomed, media("pause")).media).toMatchObject({ status: "paused", zoom: true });
    // The timer started with the clip and runs on under the zoom, also after the clip's end.
    const ended = run(zoomed, media("ended"));
    expect(ended.media).toMatchObject({ status: "ended", zoom: true });
    expect(ended.timer.status).toBe("running");
    expect(run(ended, tick(1000)).timer.leftMs).toBe(8300);
    // Escape (`unzoom`) leaves the zoom and does nothing when there is none; Z (`zoom`) goes both ways.
    expect(run(zoomed, media("unzoom")).media).toMatchObject({ status: "playing", zoom: false });
    expect(step(video, media("unzoom"))).toBe(video);
    expect(run(zoomed, media("zoom")).media.zoom).toBe(false);
    // A sound has no zoom at all.
    const song = onQuestion(3);
    expect(step(song, media("zoom"))).toBe(song);
    expect(step(song, media("unzoom"))).toBe(song);
    // The audience gets the zoom with the state, and a saved game comes back unzoomed.
    expect(restore(fresh(), toSaved(zoomed)).media.zoom).toBe(false);
  });

  it("zoom is for pictures, play for clips, and neither for a question without media", () => {
    const text = onQuestion(1);
    expect(step(text, media("play"))).toBe(text);
    expect(step(text, media("zoom"))).toBe(text);
    const picture = onQuestion(2);
    expect(step(picture, media("play"))).toBe(picture);
    expect(run(picture, media("zoom")).media.zoom).toBe(true);
    expect(run(picture, media("zoom"), media("zoom")).media.zoom).toBe(false);
    const clip = onQuestion(3);
    expect(step(clip, media("zoom"))).toBe(clip);
  });

  it("every new screen starts with its media at rest — also going back, jumping and at the answer", () => {
    const zoomed = run(onQuestion(2), media("zoom"));
    expect(run(zoomed, next).media).toEqual({ status: "idle", ms: 0, seq: 0, zoom: false });
    expect(run(zoomed, { type: "back" }).media.zoom).toBe(false);
    const playing = run(onQuestion(3), media("play"), tick(500));
    expect(run(playing, { type: "jump", index: 0 }).media.status).toBe("idle");
    // The answer screen of the clip question: the clip can be played again, and there is no timer to start.
    const answer = run(fresh(), { type: "jump", index: fresh().screens.findIndex((screen) => screen.screen === "answer" && screen.questionId === "q1.3") });
    const replayed = run(answer, media("play"), media("ended"));
    expect(replayed.media.status).toBe("ended");
    expect(replayed.timer.totalMs).toBe(0);
    // The reveal keeps the clip where it is.
    expect(run(answer, media("play"), tick(700), { type: "reveal" }).media).toMatchObject({ status: "playing", ms: 700 });
  });

  it("the audience window's \"blocked\" is kept until the clip is played or paused", () => {
    const blocked = run(onQuestion(3), media("play"), media("blocked"));
    expect(blocked.media.status).toBe("blocked");
    expect(run(blocked, tick(900)).media.ms).toBe(0);
    expect(run(blocked, media("play")).media.status).toBe("playing");
  });
});

describe("the black screen and the break", () => {
  it("B covers the stage and rests the question: the timer and the clip pause; B again uncovers", () => {
    const running = run(onQuestion(1), tick(2000));
    const black = run(running, { type: "black" });
    expect(black.curtain).toEqual({ kind: "black" });
    expect(black.timer).toMatchObject({ status: "paused", leftMs: 8000 });
    expect(run(black, tick(60_000))).toBe(black);
    const back = run(black, { type: "black" });
    expect(back.curtain).toBeNull();
    expect(back.timer.status).toBe("paused"); // the host starts it again
    const clip = run(onQuestion(3), media("play"), { type: "black" });
    expect(clip.media.status).toBe("paused");
  });

  it("Next or Back on a covered stage only uncovers it", () => {
    const black = run(onQuestion(1), { type: "black" });
    for (const type of ["next", "back"] as const) {
      const uncovered = run(black, { type });
      expect(uncovered.curtain).toBeNull();
      expect(at(uncovered)).toBe("question q1.1");
    }
    expect(at(run(black, next, next))).toBe("question q1.2");
    expect(peekNext(black).curtain).toBeNull();
    expect(at(peekNext(black))).toBe("question q1.1");
  });

  it("a cue that was about to move on is stopped by the cover", () => {
    const cue = run(onQuestion(1), tick(10_000));
    expect(cue.timer.status).toBe("cue");
    const black = run(cue, { type: "black" }, tick(60_000), { type: "uncover" });
    expect(at(black)).toBe("question q1.1");
    expect(black.timer.status).toBe("done");
  });

  it("a break counts down, stays at zero for the host and ends with Next, the menu or a jump", () => {
    const started = run(onQuestion(1), { type: "break", minutes: 5 });
    expect(started.curtain).toEqual({ kind: "break", totalMs: 300_000, leftMs: 300_000 });
    expect(started.timer.status).toBe("paused");
    const later = run(started, tick(60_500));
    expect(later.curtain).toEqual({ kind: "break", totalMs: 300_000, leftMs: 239_500 });
    expect(later.timer.leftMs).toBe(10_000);
    const over = run(later, tick(999_999));
    expect(over.curtain).toMatchObject({ kind: "break", leftMs: 0 });
    expect(run(over, tick(1000))).toBe(over);
    expect(run(over, { type: "uncover" }).curtain).toBeNull();
    expect(run(over, next).curtain).toBeNull();
    expect(run(over, { type: "jump", index: 0 }).curtain).toBeNull();
  });

  it("a break is 1 to 60 whole minutes; a black screen replaces a break and the other way round", () => {
    const lengths = [0, 0.4, 12.6, 500, Number.NaN].map((minutes) => run(fresh(), { type: "break", minutes }).curtain);
    expect(lengths.map((curtain) => (curtain?.kind === "break" ? curtain.totalMs / 60_000 : null))).toEqual([1, 1, 13, 60, 1]);
    expect(run(fresh(), { type: "break", minutes: 5 }, { type: "black" }).curtain).toEqual({ kind: "black" });
    expect(run(fresh(), { type: "black" }, { type: "break", minutes: 10 }).curtain).toMatchObject({ kind: "break", totalMs: 600_000 });
  });

  it("uncover on an open stage and a restart: nothing covers a new game", () => {
    const open = onQuestion(1);
    expect(step(open, { type: "uncover" })).toBe(open);
    expect(run(open, { type: "black" }, { type: "restart" })).toMatchObject({ curtain: null, index: 0, media: { status: "idle" } });
  });
});

describe("what is saved and what is sent", () => {
  it("a reload continues with the media at rest and the stage open", () => {
    const game = run(onQuestion(3), media("play"), tick(900), { type: "black" });
    const restored = restore(fresh(), JSON.parse(JSON.stringify(toSaved(game))));
    expect(at(restored)).toBe("question q1.3");
    expect(restored.media).toEqual({ status: "idle", ms: 0, seq: 0, zoom: false });
    expect(restored.curtain).toBeNull();
  });

  it("the audience's window gets the quiz without the host's notes — and nothing else is touched", () => {
    const file = deepFreeze(mediaFile());
    const sent = forAudience(file);
    const questions = sent.quiz.rounds.flatMap((round) => round.questions);
    expect(questions.some((question) => "note" in question)).toBe(false);
    expect(JSON.stringify(sent)).not.toContain("note 1");
    expect(sent.media).toBe(file.media);
    expect(questions.map((question) => ({ ...question, note: undefined }))).toEqual(file.quiz.rounds.flatMap((round) => round.questions).map((question) => ({ ...question, note: undefined })));
  });
});
