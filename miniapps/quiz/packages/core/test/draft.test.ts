// The draft an AI assistant writes (src/draft): it becomes a quiz the creator could have made, and
// what is wrong with it comes back as issues an assistant can act on.
import { describe, expect, it } from "vitest";
import * as core from "../src/index.ts";
import { DRAFT_EXAMPLE, type DraftOptions, draftGuide, fromDraft, issueText, issuesForAssistant, readPasted } from "../src/draft/index.ts";
import { testEnv } from "./helpers.ts";

const OPTIONS: DraftOptions = { now: "2026-11-28T10:00:00.000Z", language: "en", quizName: "New quiz", roundName: (number) => `Round ${String(number)}` };

const make = (draft: unknown): ReturnType<typeof fromDraft> => fromDraft(draft, OPTIONS, testEnv());
const errors = (draft: unknown): readonly string[] => make(draft).issues.filter((issue) => issue.level === "error").map((issue) => `${issue.path}:${issue.code}`);
const roundOf = (questions: readonly unknown[], more: object = {}): object => ({ name: "Q", rounds: [{ name: "R", questions, ...more }] });

describe("fromDraft: the guide's own example", () => {
  const result = make(DRAFT_EXAMPLE);
  const quiz = result.quiz;

  it("becomes a valid quiz file with no issue at all", () => {
    expect(result.issues).toEqual([]);
    expect(quiz).toBeDefined();
    if (quiz) expect(core.isQuizFile(core.toFile(quiz))).toBe(true);
  });

  it("has nothing left to finish: every question of every round is complete", () => {
    if (!quiz) throw new Error("no quiz");
    expect(core.unfinishedQuestions(quiz, core.defaultRegistries)).toEqual([]);
    expect(quiz.rounds.map((round) => round.kind)).toEqual(["standard", "pyramid", "safe", "laugh"]);
  });

  it("reads each kind of answer of a standard round", () => {
    const [open, choice, truth, scored] = quiz?.rounds[0]?.questions ?? [];
    expect(open?.answer).toEqual({ type: "open", text: "The Seine" });
    expect(open?.explanation).toBe("It splits around two islands in the city centre.");
    expect(choice?.answer.type).toBe("choice");
    const options = choice?.answer["options"] as readonly { id: string; text: string }[];
    expect(options.map((option) => option.text)).toEqual(["Water Closet", "World Cup", "Wash Corner", "West Coast"]);
    expect(choice?.answer["correct"]).toEqual([options[0]?.id]);
    expect(truth?.answer).toEqual({ type: "trueFalse", correct: false });
    expect(scored?.points).toEqual({ value: 2, note: "1 for the band, 1 for the song" });
    expect(scored?.seconds).toBe(45);
  });

  it("gives the special rounds the shape the creator gives them", () => {
    const [, pyramid, safe, laugh] = quiz?.rounds ?? [];
    expect(pyramid?.defaults).toEqual({ seconds: 60, points: { value: 1 }, questionKind: "text", answerType: "list" });
    expect(pyramid?.questions.map((question) => question.points?.value ?? 1)).toEqual([1, 2, 3, 4]);
    expect(safe?.data).toEqual({ bonus: 3 });
    expect(safe ? core.safeCode(safe) : []).toEqual([3, 4, 5, 6, 7]);
    expect(laugh?.questions).toHaveLength(1);
    expect(laugh?.questions[0]?.answer).toEqual({ type: "none" });
    expect(laugh ? core.laughPrizes(laugh) : null).toEqual({ first: 3, second: 1 });
    expect(laugh?.questions[0]?.points).toEqual({ value: 3 });
  });
});

describe("fromDraft: what stops a quiz", () => {
  it("something that is not an object, or has no rounds", () => {
    expect(errors("a quiz")).toEqual([":not-object"]);
    expect(errors({ name: "Q" })).toEqual(["rounds:no-rounds"]);
    expect(errors({ name: "Q", rounds: "many" })).toEqual(["rounds:wrong-type", "rounds:no-rounds"]);
  });

  it("a round of an unknown type, with the known ones named", () => {
    const result = make({ name: "Q", rounds: [{ type: "lightning", name: "R", questions: [] }] });
    expect(result.quiz).toBeUndefined();
    expect(issueText(result.issues[0] ?? { level: "error", path: "", code: "not-object", values: {} })).toBe('Round 1: Unknown round type "lightning". Use one of: standard, pyramid, safe, laugh, task. (rounds[0].type)');
  });

  it("a question without its text or without an answer — every one is reported, not only the first", () => {
    expect(errors(roundOf([{ a: "x" }, { q: "Why?" }, { q: "Fine?", a: "Yes" }]))).toEqual(["rounds[0].questions[0].q:question-no-text", "rounds[0].questions[1].a:answer-missing"]);
  });

  it("a multiple choice with too few options, an empty option, no right one, or a right one that is not there", () => {
    expect(errors(roundOf([{ q: "?", options: ["only"], correct: 1 }]))).toEqual(["rounds[0].questions[0].options:options-count"]);
    expect(errors(roundOf([{ q: "?", options: ["a", " "], correct: 1 }]))).toEqual(["rounds[0].questions[0].options[1]:option-empty"]);
    expect(errors(roundOf([{ q: "?", options: ["a", "b"] }]))).toEqual(["rounds[0].questions[0].correct:correct-missing"]);
    expect(errors(roundOf([{ q: "?", options: ["a", "b"], correct: 3 }]))).toEqual(["rounds[0].questions[0].correct:correct-unknown"]);
    expect(errors(roundOf([{ q: "?", options: ["a", "b"], correct: 0 }]))).toEqual(["rounds[0].questions[0].correct:correct-unknown"]);
  });

  it("a Golden pyramid or a Safe with the wrong number of questions", () => {
    expect(errors({ name: "Q", rounds: [{ type: "pyramid", name: "P", questions: [{ q: "?", accepted: ["a"] }] }] })).toEqual(["rounds[0].questions:wrong-count"]);
    expect(errors({ name: "Q", rounds: [{ type: "safe", name: "S", questions: [] }] })).toEqual(["rounds[0].questions:wrong-count"]);
  });

  it("a pyramid question with fewer accepted answers than it asks for, and a Safe answer that is not one digit", () => {
    const pyramid = { type: "pyramid", name: "P", questions: [{ q: "1", accepted: ["a"] }, { q: "2", accepted: ["a", "a"] }, { q: "3", accepted: ["a", "b", "c"] }, { q: "4", accepted: ["a", "b", "c", "d"] }] };
    const result = make({ name: "Q", rounds: [pyramid] });
    expect(result.issues.map((issue) => issue.code)).toEqual(["accepted-too-few"]);
    expect(issueText(result.issues[0] ?? { level: "error", path: "", code: "not-object", values: {} })).toContain("asks for 2 answers");
    const safe = { type: "safe", name: "S", questions: [{ q: "1", digit: 1 }, { q: "2", digit: 12 }, { q: "3", digit: "7" }, { q: "4", a: 4 }, { q: "5" }] };
    expect(errors({ name: "Q", rounds: [safe] })).toEqual(["rounds[0].questions[1].digit:digit-invalid", "rounds[0].questions[4].digit:digit-invalid"]);
  });

  it("a free game without its task; a laugh round needs none", () => {
    expect(errors({ name: "Q", rounds: [{ type: "task", name: "T" }] })).toEqual(["rounds[0].text:task-no-text"]);
    expect(errors({ name: "Q", rounds: [{ type: "laugh", name: "L" }] })).toEqual([]);
  });

  it("more rounds or questions than a quiz holds", () => {
    const round = { name: "R", questions: [{ q: "?", a: "!" }] };
    expect(errors({ name: "Q", rounds: Array.from({ length: core.MAX_ROUNDS + 1 }, () => round) })).toEqual(["rounds:too-many-rounds"]);
    expect(errors(roundOf(Array.from({ length: core.MAX_QUESTIONS_PER_ROUND + 1 }, () => ({ q: "?", a: "!" }))))).toEqual(["rounds[0].questions:too-many-questions"]);
  });
});

describe("fromDraft: what it puts right and reports", () => {
  it("missing names, a long text, numbers outside their range and an unknown language", () => {
    const result = make({ language: "de", teams: 40, rounds: [{ seconds: 2, points: 500, questions: [{ q: "x".repeat(core.PROMPT_MAX + 10), a: "y" }] }] });
    const quiz = result.quiz;
    expect(result.issues.every((issue) => issue.level === "fixed")).toBe(true);
    expect(result.issues.map((issue) => issue.code).sort()).toEqual(["language-unknown", "name-missing", "name-missing", "number-out-of-range", "number-out-of-range", "number-out-of-range", "text-too-long"]);
    expect(quiz?.name).toBe("New quiz");
    expect(quiz?.language).toBe("en");
    expect(quiz?.settings.teams).toBe(core.MAX_TEAMS);
    expect(quiz?.rounds[0]?.name).toBe("Round 1");
    expect(quiz?.rounds[0]?.defaults).toMatchObject({ seconds: core.MIN_SECONDS, points: { value: core.MAX_POINTS } });
    expect(quiz?.rounds[0]?.questions[0]?.prompt).toHaveLength(core.PROMPT_MAX);
  });

  it("takes the other names assistants use, numbers written as texts, and a right option named by letter or text", () => {
    const quiz = make({ title: "Q", rounds: [{ name: "R", seconds: "45", questions: [
      { question: "Year?", answer: 1969 },
      { q: "Pick", choices: ["Red", "Blue", "Green"], correct: "B" },
      { q: "Pick two", options: ["Red", "Blue", "Green"], correct: ["red", 3] },
    ] }] }).quiz;
    const [year, letter, two] = quiz?.rounds[0]?.questions ?? [];
    expect(quiz?.name).toBe("Q");
    expect(quiz?.rounds[0]?.defaults.seconds).toBe(45);
    expect(year?.answer).toEqual({ type: "open", text: "1969" });
    const texts = (question: core.Question | undefined): readonly string[] => {
      const options = (question?.answer["options"] ?? []) as readonly { id: string; text: string }[];
      const correct = (question?.answer["correct"] ?? []) as readonly string[];
      return options.filter((option) => correct.includes(option.id)).map((option) => option.text);
    };
    expect(texts(letter)).toEqual(["Blue"]);
    expect(texts(two)).toEqual(["Red", "Green"]);
  });

  it("a round's time for a task goes in half minutes; a laugh round's prizes follow the draft", () => {
    const quiz = make({ name: "Q", rounds: [{ type: "laugh", name: "L", seconds: 140, first: 5, second: 2, text: "About the host" }, { type: "task", name: "T", text: "Draw a cat", points: 4 }] }).quiz;
    const [laugh, task] = quiz?.rounds ?? [];
    expect(laugh?.defaults.seconds).toBe(150);
    expect(laugh ? core.laughPrizes(laugh) : null).toEqual({ first: 5, second: 2 });
    expect(laugh?.questions[0]).toMatchObject({ prompt: "About the host", points: { value: 5 } });
    expect(task ? core.taskPoints(task) : null).toBe(4);
    expect(task?.questions[0]).toMatchObject({ prompt: "Draw a cat", points: { value: 4 } });
    if (quiz) expect(core.isQuizFile(core.toFile(quiz))).toBe(true);
  });
});

describe("readPasted: the JSON inside what a person pastes", () => {
  const draft = { name: "Q", rounds: [{ name: "R", questions: [{ q: "?", a: "!" }] }] };

  it("plain JSON, JSON in a fence, and JSON with sentences around it", () => {
    for (const text of [JSON.stringify(draft), `Here is your quiz:\n\n\`\`\`json\n${JSON.stringify(draft, null, 2)}\n\`\`\`\n\nCopy the block.`, `Sure! ${JSON.stringify(draft)} Enjoy.`]) {
      expect(readPasted(text)).toEqual({ ok: true, draft });
    }
  });

  it("forgives a comma before a closing bracket and curly quotes", () => {
    expect(readPasted('{ "name": "Q", "rounds": [ { "name": "R", "questions": [ { "q": "?", "a": "!" }, ], }, ], }')).toEqual({ ok: true, draft });
    expect(readPasted("{ “name”: “Q”, “rounds”: [] }")).toEqual({ ok: true, draft: { name: "Q", rounds: [] } });
  });

  it("puts several blocks together: the quiz first, then lists of rounds or single rounds", () => {
    const second = { name: "R2", questions: [{ q: "2?", a: "2" }] };
    const third = { type: "laugh", name: "L" };
    const text = `\`\`\`json\n${JSON.stringify(draft)}\n\`\`\`\nNext:\n\`\`\`json\n${JSON.stringify([second])}\n\`\`\`\n\`\`\`\n${JSON.stringify(third)}\n\`\`\``;
    const read = readPasted(text);
    expect(read.ok && (read.draft["rounds"] as readonly unknown[]).length).toBe(3);
    expect(read.ok && read.draft["name"]).toBe("Q");
  });

  it("says when there is nothing, or nothing it can read", () => {
    expect(readPasted("  \n ")).toEqual({ ok: false, reason: "empty" });
    expect(readPasted("I could not make the quiz, sorry.")).toEqual({ ok: false, reason: "no-json" });
  });
});

describe("the guide and the message back", () => {
  it("the guide names the limits the reader checks and carries the example", () => {
    const guide = draftGuide();
    expect(guide).toContain(`at most ${String(core.MAX_ROUNDS)} rounds`);
    expect(guide).toContain(`up to ${String(core.PROMPT_MAX)} characters`);
    expect(guide).toContain('"type": "pyramid"');
    expect(guide.length).toBeLessThan(9000);
  });

  it("the message for the assistant lists every error and asks for the whole quiz again; none when only fixes were made", () => {
    const broken = make(roundOf([{ q: "?" }, { a: "!" }]));
    const message = issuesForAssistant(broken.issues);
    expect(message.split("\n")).toHaveLength(3);
    expect(message).toContain("Round 1, question 1: The question has no answer.");
    expect(message).toContain("send the whole quiz again");
    expect(issuesForAssistant(make({ rounds: [{ questions: [{ q: "?", a: "!" }] }] }).issues)).toBe("");
  });
});
