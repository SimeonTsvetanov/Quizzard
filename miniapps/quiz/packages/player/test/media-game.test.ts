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
/** title → teams → rules → question `n` (1-based). */
const onQuestion = (n: number): GameState => run(fresh(), ...Array.from({ length: 2 + n }, () => next));

describe("what a question's file is to the game", () => {
  it("a picture is a still, audio and video are clips with their length when known", () => {
    expect(mediaOfScreen(undefined)).toEqual({});
    expect(mediaOfScreen(MEDIA[0])).toEqual({ media: "still" });
    expect(mediaOfScreen(MEDIA[1])).toEqual({ media: "clip", clipMs: 4000 });
    expect(mediaOfScreen(MEDIA[2])).toEqual({ media: "clip" });
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

  it("the host plays the clip; when it ends the timer starts", () => {
    const playing = run(onQuestion(3), media("play"), tick(1500));
    expect(playing.media).toMatchObject({ status: "playing", ms: 1500 });
    expect(playing.timer.status).toBe("idle");
    const ended = run(playing, media("ended"));
    expect(ended.media.status).toBe("ended");
    expect(ended.timer.status).toBe("running");
    expect(run(ended, tick(1000)).timer.leftMs).toBe(9000);
    // Played again, the clip does not touch a timer that is already running or over.
    const again = run(ended, tick(1000), media("play"), media("ended"));
    expect(again.timer).toMatchObject({ status: "running", leftMs: 9000 });
  });

  it("with \"questions run by themselves\" off, the clip's end starts nothing", () => {
    const manual = run(fresh(), { type: "setAuto", value: false }, next, next, next, next, next, media("play"), media("ended"));
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
    // A clip of unknown length only ends when its window says so.
    const unknown = run(onQuestion(4), media("play"), tick(600_000));
    expect(unknown.media).toMatchObject({ status: "playing", ms: 600_000 });
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
