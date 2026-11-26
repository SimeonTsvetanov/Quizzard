// Media as data (slices 3–4): which files a quiz still uses (reference counting), what they weigh,
// the size a picture is stored at, the host note and the round's "apply to all".
import { describe, expect, it } from "vitest";
import * as core from "../src/index.ts";
import sample from "./fixtures/v1/sample.quiz.json" with { type: "json" };
import { NOW, deepFreeze, questionAt, sampleQuiz, testEnv } from "./helpers.ts";

const entry = (id: string, bytes: number, more: Partial<core.MediaEntry> = {}): core.MediaEntry => ({ id, type: "image", mime: "image/jpeg", name: `${id}.jpg`, bytes, ...more });

/** A quiz of two rounds × two questions where q1 and q2 share file `a` and q3 has file `b`. */
function quizWithMedia(): { quiz: core.Quiz; media: readonly core.MediaEntry[]; ids: string[] } {
  let quiz: core.Quiz = sampleQuiz([2, 2]);
  const ids = quiz.rounds.flatMap((round) => round.questions.map((question) => question.id));
  quiz = core.editQuestion(quiz, ids[0] ?? "", { media: { id: "a" } });
  quiz = core.editQuestion(quiz, ids[1] ?? "", { media: { id: "a" } });
  quiz = core.editQuestion(quiz, ids[2] ?? "", { media: { id: "b" } });
  return { quiz: deepFreeze(quiz), media: deepFreeze([entry("a", 100), entry("b", 30), entry("orphan", 7)]), ids };
}

describe("reference counting", () => {
  it("a file is used while any question points at it", () => {
    const { quiz, media, ids } = quizWithMedia();
    expect([...core.usedMediaIds(quiz)].sort()).toEqual(["a", "b"]);
    expect(core.usedMedia(quiz, media).map((item) => item.id)).toEqual(["a", "b"]);
    expect(core.unusedMedia(quiz, media).map((item) => item.id)).toEqual(["orphan"]);
    expect(core.mediaUses(quiz, "a")).toBe(2);
    expect(core.usedMediaBytes(quiz, media)).toBe(130);
    expect(core.mediaBytes(media)).toBe(137);

    // One of the two questions that share `a` is deleted: the file stays.
    const one = core.deleteQuestion(quiz, ids[0] ?? "");
    expect(core.unusedMedia(one, media).map((item) => item.id)).toEqual(["orphan"]);
    expect(core.mediaUses(one, "a")).toBe(1);
    // The second one too: only now is the file free.
    const none = core.deleteQuestion(one, ids[1] ?? "");
    expect(core.unusedMedia(none, media).map((item) => item.id)).toEqual(["a", "orphan"]);
    expect(core.usedMediaBytes(none, media)).toBe(30);
  });

  it("duplicating a question or a round shares the file; deleting the round frees what only it used", () => {
    const { quiz, media, ids } = quizWithMedia();
    const env = testEnv("copy");
    const copied = core.duplicateQuestion(quiz, ids[2] ?? "", env);
    expect(core.mediaUses(copied, "b")).toBe(2);
    const round = copied.rounds[1]?.id ?? "";
    const twice = core.duplicateRound(copied, round, env);
    expect(core.mediaUses(twice, "b")).toBe(4);
    const gone = core.deleteRound(core.deleteRound(twice, round), twice.rounds[2]?.id ?? "");
    expect(core.unusedMedia(gone, media).map((item) => item.id)).toEqual(["b", "orphan"]);
  });

  it("removing or replacing a question's file frees the old one only when no other question has it", () => {
    const { quiz, media, ids } = quizWithMedia();
    const removed = core.editQuestion(quiz, ids[0] ?? "", { media: null });
    expect(core.unusedMedia(removed, media).map((item) => item.id)).toEqual(["orphan"]);
    const replaced = core.editQuestion(quiz, ids[2] ?? "", { media: { id: "c" } });
    expect(core.unusedMedia(replaced, core.withMedia(media, entry("c", 5))).map((item) => item.id)).toEqual(["b", "orphan"]);
  });

  it("changing the kind keeps the file only for a kind of the same media type", () => {
    const start = sampleQuiz([1]);
    const id = questionAt(start, 0, 0).id;
    const picture = core.editQuestion(core.setQuestionKind(start, id, "picture"), id, { media: { id: "a" } });
    expect(core.findQuestion(core.setQuestionKind(picture, id, "picture"), id)?.question.media).toEqual({ id: "a" });
    expect(core.findQuestion(core.setQuestionKind(picture, id, "audio"), id)?.question.media).toBeUndefined();
    expect(core.findQuestion(core.setQuestionKind(picture, id, "text"), id)?.question.media).toBeUndefined();
  });

  it("withMedia adds an entry and replaces one of the same id; mediaOf finds a question's entry by type", () => {
    const { quiz, media, ids } = quizWithMedia();
    expect(core.withMedia(media, entry("a", 999)).filter((item) => item.id === "a")).toEqual([entry("a", 999)]);
    expect(core.withMedia(media, entry("z", 1))).toHaveLength(4);
    const first = questionAt(quiz, 0, 0);
    expect(core.mediaOf(first, media)?.id).toBe("a");
    expect(core.mediaOf(first, media, "image")?.id).toBe("a");
    expect(core.mediaOf(first, media, "video")).toBeUndefined();
    expect(core.mediaOf(questionAt(quiz, 1, 1), media)).toBeUndefined();
    expect(ids).toHaveLength(4);
  });
});

describe("fitWithin — the size a picture is stored at", () => {
  it.each([
    [4000, 3000, 1920, 1440, true],
    [3000, 4000, 1440, 1920, true],
    [6000, 1000, 1920, 320, true],
    [1920, 1080, 1920, 1080, false],
    [640, 480, 640, 480, false],
    [1921, 3, 1920, 3, true],
    [20000, 2, 1920, 1, true],
  ])("%i × %i → %i × %i", (width, height, toWidth, toHeight, isScaled) => {
    expect(core.fitWithin(width, height)).toEqual({ width: toWidth, height: toHeight, isScaled });
  });

  it("never enlarges, keeps the shape within a pixel and takes another edge", () => {
    expect(core.fitWithin(100, 50, 480)).toEqual({ width: 100, height: 50, isScaled: false });
    expect(core.fitWithin(1920, 1080, 480)).toEqual({ width: 480, height: 270, isScaled: true });
    for (const [width, height] of [[5231, 1977], [1977, 5231], [9999, 9998]] as const) {
      const fitted = core.fitWithin(width, height);
      expect(Math.max(fitted.width, fitted.height)).toBe(1920);
      expect(Math.abs(fitted.width / fitted.height - width / height)).toBeLessThan(0.002);
    }
  });
});

describe("mimeOf", () => {
  it("takes what the picker reported, else the type of the name's ending", () => {
    expect(core.mimeOf("IMAGE/JPEG", "a.bin")).toBe("image/jpeg");
    expect(core.mimeOf("", "Holiday.JPG")).toBe("image/jpeg");
    expect(core.mimeOf("", "song.m4a")).toBe("audio/mp4");
    expect(core.mimeOf("", "clip.mov")).toBe("video/quicktime");
    expect(core.mimeOf("", "IMG_0001.HEIC")).toBe("image/heic");
    expect(core.mimeOf("", "noending")).toBe("");
    expect(core.mimeOf("", "what.xyz")).toBe("");
  });
});

describe("the host note", () => {
  it("is set, cut to its limit and removed when emptied", () => {
    const quiz = sampleQuiz([1]);
    const id = questionAt(quiz, 0, 0).id;
    const noted = core.editQuestion(quiz, id, { note: "Accept “Seine” only." });
    expect(questionAt(noted, 0, 0).note).toBe("Accept “Seine” only.");
    expect(questionAt(core.editQuestion(noted, id, { note: "x".repeat(900) }), 0, 0).note).toHaveLength(core.HOST_NOTE_MAX);
    expect("note" in questionAt(core.editQuestion(noted, id, { note: "  " }), 0, 0)).toBe(false);
  });

  it("is part of version 1 as an optional field: the sample has none and opens; one with a note opens and plays", () => {
    const questions: readonly object[] = sample.quiz.rounds.flatMap((round): object[] => round.questions);
    expect(questions.some((question) => "note" in question)).toBe(false);
    const withNote = JSON.parse(JSON.stringify(sample)) as typeof sample;
    Object.assign(withNote.quiz.rounds[0]?.questions[0] ?? {}, { note: "Only for the host" });
    const opened = core.open(withNote);
    expect(opened).toMatchObject({ ok: true });
    expect(opened.ok && opened.file.quiz.rounds[0]?.questions[0]?.note).toBe("Only for the host");
    expect(core.isPlayableFile(withNote)).toBe(true);
    Object.assign(withNote.quiz.rounds[0]?.questions[0] ?? {}, { note: 5 });
    expect(core.open(withNote)).toEqual({ ok: false, reason: "invalid" });
    expect(core.isPlayableFile(withNote)).toBe(false);
  });

  it("a media entry may carry a small still", () => {
    const file = JSON.parse(JSON.stringify(sample)) as typeof sample;
    Object.assign(file.media[0] ?? {}, { poster: "data:image/jpeg;base64,AAAA" });
    expect(core.open(file)).toMatchObject({ ok: true, file: { media: [{ poster: "data:image/jpeg;base64,AAAA" }, {}, {}] } });
    Object.assign(file.media[0] ?? {}, { poster: 1 });
    expect(core.open(file)).toEqual({ ok: false, reason: "invalid" });
  });
});

describe("applyRoundDefaults", () => {
  it("counts and clears the questions' own time and points of one round only", () => {
    let quiz: core.Quiz = sampleQuiz([3, 1]);
    const [a, b, c] = quiz.rounds[0]?.questions.map((question) => question.id) ?? [];
    const other = questionAt(quiz, 1, 0).id;
    quiz = core.setQuestionSeconds(quiz, a ?? "", 90);
    quiz = core.setQuestionPoints(quiz, b ?? "", { value: 3, note: "bonus" });
    quiz = core.setQuestionSeconds(quiz, b ?? "", 15);
    quiz = core.setQuestionSeconds(quiz, other, 120);
    const frozen = deepFreeze(quiz);
    const round = frozen.rounds[0];
    expect(round && core.ownValueCount(round)).toBe(2);
    const applied = core.applyRoundDefaults(frozen, round?.id ?? "");
    expect(applied.rounds[0]?.questions.map((question) => [question.seconds, question.points])).toEqual([[undefined, undefined], [undefined, undefined], [undefined, undefined]]);
    expect(applied.rounds[0]?.questions.map((question) => question.id)).toEqual([a, b, c]);
    expect(questionAt(applied, 1, 0).seconds).toBe(120);
    expect(applied.rounds.slice(0, 1).map((first) => core.roundTotals(first).seconds)[0]).toBe(3 * 30);
  });

  it("returns the same quiz when no question has its own values or the round is unknown", () => {
    const quiz = sampleQuiz([2]);
    expect(core.applyRoundDefaults(quiz, quiz.rounds[0]?.id ?? "")).toBe(quiz);
    expect(core.applyRoundDefaults(quiz, "nope")).toBe(quiz);
  });
});

// Moni 2026-11-25: "the answer may contain a picture if I want".
describe("the picture shown with an answer", () => {
  it("counts as a use of its file, so the file is kept and weighs; removing it frees the file", async () => {
    const core = await import("../src/index.ts");
    const { NOW, testEnv } = await import("./helpers.ts");
    const env = testEnv();
    let quiz = core.addRound(core.createQuiz({ name: "Q", language: "en", now: NOW }, env), "R", env);
    quiz = core.addQuestion(quiz, quiz.rounds[0]?.id ?? "", {}, env);
    const id = quiz.rounds[0]?.questions[0]?.id ?? "";
    const entry: core.MediaEntry = { id: "pic", type: "image", mime: "image/jpeg", name: "p.jpg", bytes: 100, width: 4, height: 3 };
    const withPicture = core.editQuestion(quiz, id, { answerMedia: { id: "pic" } });
    const question = withPicture.rounds[0]?.questions[0];
    expect(question?.answerMedia).toEqual({ id: "pic" });
    expect(question?.media).toBeUndefined(); // the question's own file is another thing
    expect(question && core.answerMediaOf(question, [entry])).toEqual(entry);
    expect(core.mediaUses(withPicture, "pic")).toBe(1);
    expect(core.usedMediaBytes(withPicture, [entry])).toBe(100);
    expect(core.unusedMedia(withPicture, [entry])).toEqual([]);
    const without = core.editQuestion(withPicture, id, { answerMedia: null });
    expect(without.rounds[0]?.questions[0]?.answerMedia).toBeUndefined();
    expect(core.unusedMedia(without, [entry])).toEqual([entry]);
    // A clip can be kept with the answer too (Moni 2026-11-26); a file the quiz does not carry is none.
    const clip: core.MediaEntry = { ...entry, type: "audio", seconds: 3 };
    expect(question && core.answerMediaOf(question, [clip])).toEqual(clip);
    expect(question && core.answerMediaOf(question, [])).toBeUndefined();
  });
});

// Moni 2026-11-26: music under a question, and a playlist over the whole quiz.
describe("music under the questions", () => {
  const env = testEnv();
  const build = (): core.Quiz => {
    let quiz = core.addRound(core.createQuiz({ name: "Q", language: "en", now: NOW }, env), "R", env);
    const roundId = quiz.rounds[0]?.id ?? "";
    for (const kind of ["text", "picture", "audio", "text", "video", "text"]) quiz = core.addQuestion(quiz, roundId, { kind }, env);
    return quiz;
  };
  const musicIds = (quiz: core.Quiz): (string | undefined)[] => (quiz.rounds[0]?.questions ?? []).map((question) => question.music?.id);

  it("only a question whose own file is not a clip can have music", () => {
    expect((build().rounds[0]?.questions ?? []).map((question) => core.canHaveMusic(question, env.registries))).toEqual([true, true, false, true, false, true]);
  });

  it("a playlist goes to the questions without music in order, starts again when it is shorter, and skips the ones that have a song", () => {
    const quiz = build();
    expect(musicIds(core.assignMusic(quiz, ["a", "b", "c", "d", "e"], env.registries))).toEqual(["a", "b", undefined, "c", undefined, "d"]);
    expect(musicIds(core.assignMusic(quiz, ["a", "b"], env.registries))).toEqual(["a", "b", undefined, "a", undefined, "b"]);
    const own = core.editQuestion(quiz, quiz.rounds[0]?.questions[1]?.id ?? "", { music: { id: "mine" } });
    expect(musicIds(core.assignMusic(own, ["a", "b"], env.registries))).toEqual(["a", "mine", undefined, "b", undefined, "a"]);
    expect(core.assignMusic(quiz, [], env.registries)).toBe(quiz);
  });

  it("the questions without music are listed with their place; the quiz remembers that it asks for music", () => {
    const quiz = build();
    expect(core.questionsWithoutMusic(quiz, env.registries).map((item) => `${String(item.roundIndex)}:${String(item.index)}`)).toEqual(["0:0", "0:1", "0:3", "0:5"]);
    const wanted = core.setWantsMusic(core.assignMusic(quiz, ["a"], env.registries), true);
    expect(core.wantsMusic(wanted)).toBe(true);
    expect(core.questionsWithoutMusic(wanted, env.registries)).toEqual([]);
    const cleared = core.clearMusic(wanted);
    expect(core.wantsMusic(cleared)).toBe(false);
    expect(musicIds(cleared)).toEqual([undefined, undefined, undefined, undefined, undefined, undefined]);
    expect(cleared.settings).toEqual(quiz.settings);
  });

  it("a song counts as used, is shared by its questions, and goes when the question becomes a clip", () => {
    const quiz = core.assignMusic(build(), ["song"], env.registries);
    const entry: core.MediaEntry = { id: "song", type: "audio", mime: "audio/mpeg", name: "s.mp3", bytes: 50, seconds: 30 };
    expect(core.mediaUses(quiz, "song")).toBe(4);
    expect(core.usedMediaBytes(quiz, [entry])).toBe(50);
    const first = quiz.rounds[0]?.questions[0];
    expect(first && core.musicOf(first, [entry])).toEqual(entry);
    expect(first && core.musicOf(first, [{ ...entry, type: "image" }])).toBeUndefined();
    const asAudio = core.setQuestionKind(quiz, first?.id ?? "", "audio", env);
    expect(asAudio.rounds[0]?.questions[0]?.music).toBeUndefined();
  });
});
