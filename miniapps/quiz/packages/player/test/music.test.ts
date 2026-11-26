// The music under a question (ui/music.ts): it follows the question's timer — playing while it runs,
// resting while it is paused, back at its start when the time is up — and only on the question's own screen.
import type { MediaEntry, QuizFile } from "@simeonts/quizzard-quiz-core/play";
import { describe, expect, it } from "vitest";
import { createGame } from "../src/game/create.ts";
import type { GameAction, GameState } from "../src/game/state.ts";
import { step } from "../src/game/step.ts";
import { createMusic, musicCue, songsOf } from "../src/ui/music.ts";
import { at, quizFile } from "./helpers.ts";

const MEDIA: readonly MediaEntry[] = [
  { id: "song", type: "audio", mime: "audio/mpeg", name: "s.mp3", bytes: 10, seconds: 4 },
  { id: "film", type: "video", mime: "video/mp4", name: "f.mp4", bytes: 10, seconds: 3 },
];

/** One round of three 10 s questions: q1.1 with music, q1.2 without, q1.3 a video that also points at the song. */
function musicFile(): QuizFile {
  const file = quizFile([3]);
  const [round] = file.quiz.rounds;
  if (!round) throw new Error("round");
  const questions = round.questions.map((question, index) => {
    if (index === 0) return { ...question, music: { id: "song" } };
    return index === 2 ? { ...question, media: { id: "film" }, music: { id: "song" } } : question;
  });
  return { ...file, media: MEDIA, quiz: { ...file.quiz, rounds: [{ ...round, questions }] } };
}

const run = (state: GameState, ...actions: GameAction[]): GameState => actions.reduce((now, action) => step(now, action), state);
const next: GameAction = { type: "next" };
const fresh = (): GameState => createGame(musicFile(), { teamName: (n) => `Team ${String(n)}` });

/** A stand-in for the audio element that records what was asked of it. */
function fakeAudio(): { readonly made: string[]; readonly create: (url: string) => HTMLAudioElement; readonly last: () => { paused: boolean; currentTime: number; loop: boolean }; readonly end: () => void } {
  const made: string[] = [];
  const listeners: (() => void)[] = [];
  let element = { paused: true, currentTime: 0, loop: false, volume: 1, addEventListener(_name: string, run: () => void) { listeners.push(run); }, play() { this.paused = false; return Promise.resolve(); }, pause() { this.paused = true; }, removeAttribute() { /* nothing to drop */ } };
  return {
    made,
    create: (url) => {
      made.push(url);
      element = { ...element, paused: true, currentTime: 0 };
      return element as unknown as HTMLAudioElement;
    },
    last: () => element,
    end: () => { listeners.at(-1)?.(); },
  };
}

describe("music under a question", () => {
  it("only the question's own screen carries the music, and never a screen with a clip", () => {
    const screens = fresh().screens.filter((screen) => screen.music !== undefined);
    expect(screens.map((screen) => `${screen.screen} ${screen.questionId ?? ""}`)).toEqual(["question q1.1"]);
  });

  it("plays while the timer runs, holds while it is paused or the stage is covered, rewinds when the time is up", () => {
    const question = run(fresh(), next, next, next);
    expect(at(question)).toBe("question q1.1");
    expect(musicCue(question)).toBe("play"); // the timer started by itself
    expect(musicCue(run(question, { type: "timerToggle" }))).toBe("hold");
    expect(musicCue(run(question, { type: "black" }))).toBe("hold");
    expect(musicCue(run(question, { type: "setAuto", value: false }, { type: "tick", ms: 10_000 }))).toBe("rewind");
    expect(musicCue(run(question, next))).toBe("none"); // the next question has none
    expect(musicCue(fresh())).toBe("none");
  });

  it("the player's music loops one sound per question and lets it go on the next screen", () => {
    const audio = fakeAudio();
    const music = createMusic((id) => `blob:${id}`, [], audio.create);
    const question = run(fresh(), next, next, next);
    music.update(question);
    expect(audio.made).toEqual(["blob:song"]);
    expect(audio.last()).toMatchObject({ paused: false, loop: true });
    music.update(run(question, { type: "tick", ms: 500 }));
    expect(audio.made).toHaveLength(1); // the same sound goes on
    music.update(run(question, { type: "timerToggle" }));
    expect(audio.last().paused).toBe(true);
    music.update(run(question, next));
    expect(audio.last().paused).toBe(true);
    music.destroy();
  });

  it("without a way to the quiz's files there is no music, and nothing fails", () => {
    const audio = fakeAudio();
    const music = createMusic(undefined, [], audio.create);
    music.update(run(fresh(), next, next, next));
    expect(audio.made).toEqual([]);
  });

  it("a break plays the quiz's songs one after the other from the first, rests while it is paused and stops when it ends", () => {
    const file = musicFile();
    const two: QuizFile = { ...file, media: [...MEDIA, { id: "song2", type: "audio", mime: "audio/mpeg", name: "t.mp3", bytes: 10, seconds: 4 }], quiz: { ...file.quiz, rounds: file.quiz.rounds.map((round) => ({ ...round, questions: round.questions.map((question, index) => (index === 1 ? { ...question, music: { id: "song2" } } : question)) })) } };
    expect(songsOf(two)).toEqual(["song", "song2"]);
    const audio = fakeAudio();
    const music = createMusic((id) => `blob:${id}`, songsOf(two), audio.create);
    const game = createGame(two, { teamName: (n) => `Team ${String(n)}` });
    const onBreak = run(game, { type: "break", minutes: 5 });
    music.update(onBreak);
    expect(audio.made).toEqual(["blob:song"]);
    expect(audio.last()).toMatchObject({ paused: false, loop: false });
    audio.end();
    expect(audio.made).toEqual(["blob:song", "blob:song2"]);
    audio.end();
    expect(audio.made).toEqual(["blob:song", "blob:song2", "blob:song"]); // round again
    music.update(run(onBreak, { type: "breakToggle" }));
    expect(audio.last().paused).toBe(true);
    music.update(run(onBreak, { type: "uncover" }));
    expect(audio.last().paused).toBe(true); // the break is over: the song is let go
    // A quiz without songs has a silent break.
    const silent = fakeAudio();
    createMusic((id) => `blob:${id}`, [], silent.create).update(onBreak);
    expect(silent.made).toEqual([]);
  });
});
