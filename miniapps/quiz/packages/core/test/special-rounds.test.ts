// SPEC §10: the Golden pyramid and the Safe — created ready-made, kept in shape by the ops, finished by
// their own rule, scored through their round kind, and still a version-1 file.
import { describe, expect, it } from "vitest";
import * as core from "../src/index.ts";
import * as play from "../src/play.ts";
import special from "./fixtures/v1/special-rounds.quiz.json" with { type: "json" };
import { NOW, deepFreeze, testEnv } from "./helpers.ts";

/** A frozen quiz: a standard round with one question (`x2`, question `x3`), then a pyramid and a safe. */
function specialQuiz(env: core.Env = testEnv()): core.Quiz {
  let quiz = core.createQuiz({ name: "Special", language: "en", now: NOW }, env);
  quiz = core.addRound(quiz, "Warm-up", env);
  quiz = core.addQuestion(quiz, quiz.rounds[0]?.id ?? "", {}, env);
  quiz = core.addRoundOfKind(quiz, { kind: "pyramid", name: "Pyramid", rules: "  Name them.  " }, env);
  quiz = core.addRoundOfKind(quiz, { kind: "safe", name: "Safe" }, env);
  return deepFreeze(quiz);
}

function roundOf(quiz: core.Quiz, kind: string): core.Round {
  const round = quiz.rounds.find((candidate) => candidate.kind === kind);
  if (!round) throw new Error(`no ${kind} round`);
  return round;
}

function at(round: core.Round, index: number): core.Question {
  const question = round.questions[index];
  if (!question) throw new Error(`no question ${String(index)}`);
  return question;
}

describe("SR1: a special round is created ready-made", () => {
  it("a Golden pyramid has 4 questions asking for 1–4 accepted answers, points 1–4, 60 s and its rules", () => {
    const pyramid = roundOf(specialQuiz(), "pyramid");
    expect(pyramid.questions).toHaveLength(core.PYRAMID_QUESTIONS);
    expect(pyramid.questions.map((question) => question.answer)).toEqual(Array.from({ length: 4 }, () => ({ type: "list", items: [] })));
    expect(pyramid.questions.map((question) => core.effectivePoints(pyramid, question).value)).toEqual([1, 2, 3, 4]);
    expect(pyramid.defaults).toMatchObject({ seconds: 60, answerType: "list", questionKind: "text" });
    expect(pyramid.rules).toBe("Name them.");
    expect(core.roundMaxPoints(pyramid)).toBe(10);
  });

  it("a Safe has 5 digit questions of 1 point, 45 s and a bonus of 3: 8 in all", () => {
    const safe = roundOf(specialQuiz(), "safe");
    expect(safe.questions.map((question) => question.answer)).toEqual(Array.from({ length: 5 }, () => ({ type: "digit" })));
    expect(safe.questions.every((question) => question.points === undefined)).toBe(true);
    expect(safe).toMatchObject({ data: { bonus: 3 }, defaults: { seconds: 45, points: { value: 1 }, answerType: "digit" } });
    expect(safe.rules).toBeUndefined();
    expect(core.safeBonus(safe)).toBe(3);
    expect(core.roundMaxPoints(safe)).toBe(8);
  });

  it("a standard round after special ones takes the defaults of the last free round, not theirs", () => {
    const env = testEnv();
    const quiz = core.setRoundDefaults(specialQuiz(env), "x2", { seconds: 20 });
    const next = core.addRoundOfKind(quiz, { kind: "standard", name: "Free", rules: "Anything" }, env);
    expect(next.rounds.at(-1)).toMatchObject({ kind: "standard", name: "Free", rules: "Anything", questions: [], defaults: { seconds: 20, answerType: "open" } });
    expect(core.addRound(quiz, "Plain", env).rounds.at(-1)?.defaults.answerType).toBe("open");
  });

  it("an unknown kind or a full quiz adds nothing", () => {
    const quiz = specialQuiz();
    expect(core.addRoundOfKind(quiz, { kind: "wheel", name: "Wheel" })).toBe(quiz);
    const full = { ...quiz, rounds: Array.from({ length: core.MAX_ROUNDS }, (_, index) => ({ ...roundOf(quiz, "safe"), id: `r${String(index)}` })) };
    expect(core.addRoundOfKind(full, { kind: "pyramid", name: "One more" })).toBe(full);
  });

  it("a duplicated special round keeps its kind, shape and bonus", () => {
    const env = testEnv();
    const quiz = specialQuiz(env);
    const copy = core.duplicateRound(quiz, roundOf(quiz, "safe").id, env).rounds.at(-1);
    expect(copy).toMatchObject({ kind: "safe", data: { bonus: 3 } });
    expect(copy?.questions).toHaveLength(5);
  });
});

describe("SR2: the ops keep a special round in shape", () => {
  it("no question is added, deleted, duplicated or moved in or out", () => {
    const env = testEnv();
    const quiz = specialQuiz(env);
    const pyramid = roundOf(quiz, "pyramid");
    const first = at(pyramid, 0).id;
    expect(core.canAddQuestion(pyramid)).toBe(false);
    expect(core.canRemoveQuestion(pyramid)).toBe(false);
    expect(core.addQuestion(quiz, pyramid.id, {}, env)).toBe(quiz);
    expect(core.deleteQuestion(quiz, first)).toBe(quiz);
    expect(core.duplicateQuestion(quiz, first, env)).toBe(quiz);
    expect(core.moveQuestion(quiz, first, "x2")).toBe(quiz);
    expect(core.moveQuestion(quiz, "x3", pyramid.id)).toBe(quiz);
    expect(core.moveQuestion(quiz, "x3", roundOf(quiz, "safe").id)).toBe(quiz);
  });

  it("Pyramid questions keep their places; Safe questions may change them", () => {
    const quiz = specialQuiz();
    const pyramid = roundOf(quiz, "pyramid");
    const safe = roundOf(quiz, "safe");
    expect(core.canReorder(pyramid)).toBe(false);
    expect(core.moveQuestion(quiz, at(pyramid, 0).id, pyramid.id, 3)).toBe(quiz);
    const moved = core.moveQuestion(quiz, at(safe, 0).id, safe.id, 4);
    expect(roundOf(moved, "safe").questions.at(-1)?.id).toBe(at(safe, 0).id);
  });

  it("answer type and points stay; the time can change", () => {
    const env = testEnv();
    const quiz = specialQuiz(env);
    const pyramid = roundOf(quiz, "pyramid");
    const second = at(pyramid, 1).id;
    expect(core.setAnswerType(quiz, second, "open", env)).toBe(quiz);
    expect(core.setQuestionPoints(quiz, second, { value: 9 })).toBe(quiz);
    const timed = core.setQuestionSeconds(quiz, second, 90);
    expect(core.findQuestion(timed, second)?.question.seconds).toBe(90);
    const defaults = core.setRoundDefaults(timed, pyramid.id, { seconds: 30, points: { value: 5 }, answerType: "open", questionKind: "picture" });
    expect(roundOf(defaults, "pyramid").defaults).toEqual({ seconds: 30, points: { value: 1 }, answerType: "list", questionKind: "picture" });
    expect(core.ownValueCount(roundOf(defaults, "pyramid"))).toBe(1);
    const applied = core.applyRoundDefaults(defaults, pyramid.id);
    expect(roundOf(applied, "pyramid").questions.map((question) => [question.seconds, question.points?.value])).toEqual([[undefined, undefined], [undefined, 2], [undefined, 3], [undefined, 4]]);
  });

  it("the question kind can change in a special round, the answer stays", () => {
    const env = testEnv();
    const quiz = specialQuiz(env);
    const id = at(roundOf(quiz, "safe"), 2).id;
    const next = core.setQuestionKind(quiz, id, "picture", env);
    expect(core.findQuestion(next, id)?.question).toMatchObject({ kind: "picture", answer: { type: "digit" } });
  });
});

describe("SR3: a special question is finished by its round's rule", () => {
  it("question n of a pyramid needs n accepted answers; more are welcome", () => {
    const quiz = specialQuiz();
    const pyramid = roundOf(quiz, "pyramid");
    const third = at(pyramid, 2).id;
    const withText = pyramid.questions.reduce((next, question) => core.editQuestion(next, question.id, { prompt: "Name them" }), quiz);
    const two = core.editQuestion(withText, third, { answer: { type: "list", items: ["Neon", " ", "Argon"] } });
    expect(core.unfinishedCount(roundOf(two, "pyramid"))).toBe(4);
    const lists = pyramid.questions.reduce((next, question, index) => core.editQuestion(next, question.id, { answer: { type: "list", items: Array.from({ length: index + 2 }, (_, n) => `A${String(n)}`) } }), withText);
    expect(core.unfinishedCount(roundOf(lists, "pyramid"))).toBe(0);
    const short = core.editQuestion(lists, third, { answer: { type: "list", items: ["Neon", "Argon"] } });
    expect(core.unfinishedQuestions(short).filter((one) => one.round.kind !== "safe").map((one) => one.question.id)).toEqual(["x3", third]);
  });

  it("a safe question needs its digit", () => {
    const quiz = specialQuiz();
    const safe = roundOf(quiz, "safe");
    const done = safe.questions.reduce((next, question, index) => core.editQuestion(next, question.id, { prompt: "How many?", answer: { type: "digit", digit: index } }), quiz);
    expect(core.unfinishedCount(roundOf(done, "safe"))).toBe(0);
    expect(core.unfinishedCount(roundOf(core.editQuestion(done, at(safe, 4).id, { answer: { type: "digit" } }), "safe"))).toBe(1);
    expect(core.safeCode(roundOf(done, "safe"))).toEqual([0, 1, 2, 3, 4]);
  });
});

describe("the Safe's score entry and the bonus", () => {
  it("5 digits right store 5 + bonus; fewer store the digits; points read back as digits", () => {
    const safe = roundOf(specialQuiz(), "safe");
    const entry = core.scoreEntryOf(safe);
    expect(entry?.max(safe)).toBe(5);
    expect([0, 4, 5, 9].map((digits) => entry?.toPoints(safe, digits))).toEqual([0, 4, 8, 8]);
    expect([0, 4, 8, 7].map((points) => entry?.fromPoints(safe, points))).toEqual([0, 4, 5, 5]);
    expect(core.scoreEntryOf(roundOf(specialQuiz(), "pyramid"))).toBeNull();
  });

  it("typed points are kept inside what the round can give", () => {
    const quiz = specialQuiz();
    expect(core.cleanRoundPoints(roundOf(quiz, "safe"), 6, 999)).toBe(8);
    expect(core.cleanRoundPoints(roundOf(quiz, "safe"), 3, 999)).toBe(3);
    expect(core.cleanRoundPoints(roundOf(quiz, "pyramid"), 12, 999)).toBe(10);
    expect(core.cleanRoundPoints(roundOf(quiz, "standard"), 50, 999)).toBe(50);
    expect(core.scoreCap(roundOf(quiz, "standard"), 999)).toBe(999);
  });

  it("the bonus is set whole inside 0–20, and counts in the round's most", () => {
    const quiz = specialQuiz();
    const id = roundOf(quiz, "safe").id;
    expect(roundOf(core.setRoundBonus(quiz, id, 25.4), "safe").data).toEqual({ bonus: 20 });
    expect(core.setRoundBonus(quiz, id, 3)).toBe(quiz);
    const five = roundOf(core.setRoundBonus(quiz, id, 5), "safe");
    expect(core.roundMaxPoints(five)).toBe(10);
    expect(core.scoreEntryOf(five)?.toPoints(five, 5)).toBe(10);
    expect(core.safeBonus({ ...five, data: { bonus: "lots" } })).toBe(core.SAFE_BONUS_DEFAULT);
  });
});

describe("the list answer", () => {
  it("adds, changes and removes accepted answers, up to the most", () => {
    const empty: core.ListAnswer = { type: "list", items: [] };
    const one = core.setListItem(empty, 0, "Ohio");
    expect(core.setListItem(one, 0, "Iowa").items).toEqual(["Iowa"]);
    expect(core.setListItem(one, 0, null).items).toEqual([]);
    expect(core.setListItem(one, 5, "Nope")).toBe(one);
    expect(core.setListItem(one, 3, null)).toBe(one);
    const full: core.ListAnswer = { type: "list", items: Array.from({ length: core.LIST_ITEMS_MAX }, () => "x") };
    expect(core.setListItem(full, full.items.length, "one more")).toBe(full);
    expect(core.setListItem(empty, 0, "y".repeat(core.ANSWER_TEXT_MAX + 5)).items[0]).toHaveLength(core.ANSWER_TEXT_MAX);
  });

  it("reads as its accepted answers; a digit as itself", () => {
    expect(play.listReveal({ type: "list", items: [" Ohio ", "", "Iowa"] })).toBe("Ohio, Iowa");
    expect(play.digitReveal({ type: "digit", digit: 7 })).toBe("7");
    expect(play.digitReveal({ type: "digit" })).toBe("");
    expect(play.digitOf({ type: "open", text: "7" })).toBeNull();
  });
});

describe("SR5: special rounds are still a version-1 file", () => {
  it("the fixture opens, keeps every field and reads its code", () => {
    const opened = core.open(special);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;
    expect(opened.file).toEqual(special);
    expect(core.safeCode(roundOf(opened.file.quiz, "safe"))).toEqual([4, 7, 1, 9, 2]);
    expect(core.unfinishedQuestions(opened.file.quiz)).toEqual([]);
  });

  it("a wrong bonus, digit or list is refused; a reader that does not know the kinds keeps them as they are", () => {
    const rounds = special.quiz.rounds;
    const withSafe = (data: unknown): unknown => ({ ...special, quiz: { ...special.quiz, rounds: [rounds[0], { ...rounds[1], data }] } });
    expect(core.open(withSafe({ bonus: -1 })).ok).toBe(false);
    expect(core.open(withSafe({ bonus: 4, extra: "kept" })).ok).toBe(true);
    const digit = JSON.parse(JSON.stringify(special).replace('"digit":4', '"digit":10')) as unknown;
    expect(core.open(digit).ok).toBe(false);
    const older: core.Registries = { ...core.createRegistries(), rounds: core.createRegistry([core.standardRound]), answers: core.createRegistry([core.openAnswer]) };
    const kept = core.open(special, older);
    expect(kept.ok && kept.file).toEqual(special);
    expect(core.screensOf(roundOf(special.quiz as core.Quiz, "safe"), older)).toEqual([]);
  });
});

// Moni 2026-11-25: two round kinds without answers — "Make the quizmaster laugh" and the free game.
describe("rounds without answers: laugh and task", () => {
  const withRound = (kind: string): { quiz: core.Quiz; env: core.Env; round: core.Round } => {
    const env = testEnv();
    const quiz = core.addRoundOfKind(core.createQuiz({ name: "Q", language: "en", now: NOW }, env), { kind, name: "R" }, env);
    return { quiz, env, round: roundOf(quiz, kind) };
  };

  it("a laugh round comes with one task of 5 minutes, no answer, and the two prizes 3 and 1", () => {
    const { round, env } = withRound("laugh");
    expect(round.questions).toHaveLength(1);
    expect(at(round, 0).answer).toEqual({ type: "none" });
    expect(round.defaults.seconds).toBe(300);
    expect(core.laughPrizes(round)).toEqual({ first: 3, second: 1 });
    expect(core.roundMaxPoints(round, env.registries.rounds)).toBe(3);
    // No "Answers", no reveal: rules, the task, the points, the leaderboard.
    expect(core.screensOf(round, env.registries).map((screen) => screen.screen)).toEqual(["rules", "question", "tally", "board"]);
  });

  it("a prize that changes is what the task shows as its points; values stay whole and within 0–20", () => {
    const laugh = withRound("laugh");
    const changed = roundOf(core.setRoundValue(laugh.quiz, laugh.round.id, "first", 5.4, laugh.env), "laugh");
    expect(core.laughPrizes(changed)).toEqual({ first: 5, second: 1 });
    expect(at(changed, 0).points).toEqual({ value: 5 });
    const task = withRound("task");
    expect(core.taskPoints(task.round)).toBe(3);
    const most = roundOf(core.setRoundValue(task.quiz, task.round.id, "points", 99, task.env), "task");
    expect(core.taskPoints(most)).toBe(20);
    expect(at(most, 0).points).toEqual({ value: 20 });
  });

  it("the answer type `none` is not offered in a free round, and a task still needs its words", () => {
    const { round, env, quiz } = withRound("task");
    expect(core.freeAnswerTypes(env.registries)).not.toContain("none");
    expect(core.unfinishedQuestions(quiz, env.registries)).toHaveLength(1);
    const written = core.editQuestion(quiz, at(round, 0).id, { prompt: "Draw the quizmaster." });
    expect(core.unfinishedQuestions(written, env.registries)).toHaveLength(0);
  });
});
