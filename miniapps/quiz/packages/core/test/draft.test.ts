// The draft an AI assistant writes (src/draft): it becomes a quiz the creator could have made, and
// what is wrong with it comes back as issues an assistant can act on.
import { describe, expect, it } from "vitest";
import * as core from "../src/index.ts";
import { DRAFT_EXAMPLE, type DraftOptions, type QuizWishes, addQuestionsPrompt, addRoundsPrompt, checkPrompt, commonsTitle, draftGuide, fromDraft, issueText, issuesForAssistant, newQuizPrompt, questionsFromDraft, readCheck, readPasted, roundsFromDraft } from "../src/draft/index.ts";
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
    const [open, several, choice, truth, scored] = quiz?.rounds[0]?.questions ?? [];
    expect(open?.answer).toEqual({ type: "open", text: "The Seine" });
    expect(open?.explanation).toBe("It splits around two islands in the city centre.");
    expect(choice?.answer.type).toBe("choice");
    const options = choice?.answer["options"] as readonly { id: string; text: string }[];
    expect(options.map((option) => option.text)).toEqual(["World Cup", "Water Closet", "Wash Corner", "West Coast"]);
    expect(choice?.answer["correct"]).toEqual([options[1]?.id]);
    const severalOptions = several?.answer["options"] as readonly { id: string; text: string }[];
    expect(several?.answer["correct"]).toEqual([severalOptions[0]?.id, severalOptions[2]?.id]);
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
    expect(issueText(result.issues[0] ?? { level: "error", path: "", code: "not-object", values: {} })).toContain("Answers this Golden pyramid question asks for: 2,");
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
    expect(guide.length).toBeLessThan(12_000);
  });

  it("the message for the assistant lists every error and asks for the whole quiz again; none when only fixes were made", () => {
    const broken = make(roundOf([{ q: "?" }, { a: "!" }]));
    const message = issuesForAssistant(broken.issues);
    expect(message.split("\n")).toHaveLength(3);
    expect(message.split("\n")[0]).toContain("in several code blocks if it is long");
    expect(message).toContain("Round 1, question 1: The question has no answer.");
    expect(message).toContain("send the whole quiz again");
    expect(issuesForAssistant(make({ rounds: [{ questions: [{ q: "?", a: "!" }] }] }).issues)).toBe("");
  });
});

// Found by the review of 2026-11-28 (assistants simulated from the guide, then reviewers): each is a
// text or a draft a real assistant writes.
describe("readPasted: what assistants and people really paste", () => {
  const round = (name: string): object => ({ name, questions: [{ q: `${name}?`, a: "yes" }] });
  const quiz = (name: string, rounds: readonly object[]): object => ({ name, rounds });
  const names = (text: string): readonly unknown[] => {
    const read = readPasted(text);
    return read.ok ? [read.draft["name"], ...(read.draft["rounds"] as readonly { name: string }[]).map((one) => one.name)] : [read.reason];
  };

  it("parts without fences — the chat's Copy button gives the code only — are joined in order", () => {
    expect(names(`${JSON.stringify(quiz("Q", [round("A")]))}\n\n${JSON.stringify([round("B"), round("C")])}\n${JSON.stringify(round("D"))}`)).toEqual(["Q", "A", "B", "C", "D"]);
    expect(names(`\`\`\`json\n${JSON.stringify(quiz("Q", [round("A")]))}\n\`\`\`\nPart 2 of 2:\n${JSON.stringify([round("B")])}`)).toEqual(["Q", "A", "B"]);
  });

  it("a part that is not valid JSON, or an answer cut off in the middle, is said — never dropped in silence", () => {
    const good = JSON.stringify(quiz("Q", [round("A")]));
    expect(readPasted(`${good}\n[{ "name": "B", "questions": [{ "q": "?" "a": "!" }] }]`)).toEqual({ ok: false, reason: "broken" });
    expect(readPasted(good.slice(0, -12))).toEqual({ ok: false, reason: "broken" });
  });

  it("the last whole quiz wins: the instructions' example above the answer, or a refused version above the corrected one", () => {
    const example = JSON.stringify(DRAFT_EXAMPLE, null, 2);
    expect(names(`# How to make a quiz\n\`\`\`json\n${example}\n\`\`\`\n…\nHere it is:\n\`\`\`json\n${JSON.stringify(quiz("Mine", [round("A")]))}\n\`\`\``)).toEqual(["Mine", "A"]);
    expect(names(`${JSON.stringify(quiz("Old", [round("A"), round("B")]))}\n\n${JSON.stringify([round("C")])}\n\n${JSON.stringify(quiz("New", [round("A2")]))}\n${JSON.stringify([round("B2")])}`)).toEqual(["New", "A2", "B2"]);
  });

  it("leaves every text as written: commas before brackets, backtick fences and curly quotes inside a question", () => {
    const tricky = { name: "Q", rounds: [{ name: "R", questions: [{ q: "What is ```code```? Pick [a, ] or {b, }", a: "„Тихият Дон“ — “quoted”" }] }] };
    const read = readPasted(`Sure:\n\`\`\`json\n${JSON.stringify(tricky, null, 2).replace(/\n(\s*)\}/g, ",\n$1}")}\n\`\`\``);
    expect(read).toEqual({ ok: true, draft: tricky });
  });

  it("takes a BOM, CRLF, no-break spaces as indentation, and sentences with brackets around the JSON", () => {
    const text = `\uFEFFHere you go (5 questions) [draft]:\r\n{\r\n\u00A0\u00A0"name": "Q",\r\n\u00A0\u00A0"rounds": [{ "name": "R", "questions": [{ "q": "?", "a": "!" }] }]\r\n}\r\nEnjoy {really}!`;
    expect(names(text)).toEqual(["Q", "R"]);
  });

  it("ignores small JSON that is not a quiz, and refuses a text too long to be one", () => {
    expect(names(`Settings: {"theme":"dark"}\n${JSON.stringify(quiz("Q", [round("A")]))}\n[1, 2, 3]`)).toEqual(["Q", "A"]);
    expect(readPasted("x".repeat(1_000_001))).toEqual({ ok: false, reason: "too-long" });
  });

  it("reads 200,000 characters of nested brackets without hanging", () => {
    readPasted(`${"[{".repeat(50_000)}"questions": 1`);
    readPasted("```".repeat(60_000));
  }, 2000);
});

describe("fromDraft: slips of real assistants", () => {
  const first = (question: object, more: object = {}): core.Question | undefined => make({ name: "Q", rounds: [{ name: "R", points: 3, seconds: 40, ...more, questions: [question] }] }).quiz?.rounds[0]?.questions[0];

  it("a points note alone keeps the round's points; points and time equal to the round's are not the question's own", () => {
    expect(first({ q: "?", a: "!", pointsNote: "1 each" })?.points).toEqual({ value: 3, note: "1 each" });
    const same = first({ q: "?", a: "!", points: 3, seconds: 40 });
    expect(same?.points).toBeUndefined();
    expect(same?.seconds).toBeUndefined();
    expect(first({ q: "?", a: "!", points: 5, seconds: 20 })).toMatchObject({ points: { value: 5 }, seconds: 20 });
  });

  it("a Golden pyramid's and a Safe's points are fixed by their place: a draft's own are left out and said", () => {
    const result = make({ name: "Q", rounds: [{ type: "safe", name: "S", questions: [1, 2, 3, 4, 5].map((digit) => ({ q: "?", digit, points: 5 })) }] });
    expect(result.quiz?.rounds[0]?.questions.every((question) => question.points === undefined)).toBe(true);
    expect(result.issues.map((issue) => `${issue.level}:${issue.code}`)).toEqual(Array.from({ length: 5 }, () => "fixed:field-ignored"));
  });

  it("the right option: a number is its place, a number that is no place may be its text, a quoted number that could be either is refused", () => {
    const right = (options: readonly string[], correct: unknown): readonly string[] | string => {
      const result = make({ name: "Q", rounds: [{ name: "R", questions: [{ q: "?", options, correct }] }] });
      const answer = result.quiz?.rounds[0]?.questions[0]?.answer;
      if (!answer) return result.issues[0]?.code ?? "";
      const list = answer["options"] as readonly { id: string; text: string }[];
      return list.filter((option) => (answer["correct"] as readonly string[]).includes(option.id)).map((option) => option.text);
    };
    expect(right(["2", "4", "6"], 4)).toEqual(["4"]);
    expect(right(["2", "4", "6"], 2)).toEqual(["4"]);
    expect(right(["3", "1", "2"], "1")).toBe("correct-unknown");
    expect(right(["1", "2", "3"], "2")).toEqual(["2"]);
    expect(right(["Red", "Blue"], "2")).toEqual(["Blue"]);
  });

  it("true / false in quotes is true / false; a language may be written as a word", () => {
    expect(first({ q: "The Moon is a planet.", a: "False" })?.answer).toEqual({ type: "trueFalse", correct: false });
    for (const [written, language] of [["Bulgarian", "bg"], ["български", "bg"], ["bg-BG", "bg"], ["English", "en"], ["EN", "en"]] as const) {
      expect(make({ name: "Q", language: written, rounds: [{ name: "R", questions: [{ q: "?", a: "!" }] }] }).quiz?.language).toBe(language);
    }
  });

  it("the same accepted answer twice counts once, and more than a question holds are cut and said", () => {
    const pyramid = (accepted: readonly string[]): object => ({ name: "Q", rounds: [{ type: "pyramid", name: "P", questions: [{ q: "1", accepted }, { q: "2", accepted: ["a", "b"] }, { q: "3", accepted: ["a", "b", "c"] }, { q: "4", accepted: ["a", "b", "c", "d"] }] }] });
    expect(make(pyramid(["Everest", "everest", " EVEREST "])).quiz?.rounds[0]?.questions[0]?.answer).toEqual({ type: "list", items: ["Everest"] });
    const many = make(pyramid([...Array(core.LIST_ITEMS_MAX + 5).keys()].map((index) => `answer ${String(index)}`)));
    expect((many.quiz?.rounds[0]?.questions[0]?.answer["items"] as readonly string[]).length).toBe(core.LIST_ITEMS_MAX);
    expect(many.issues.map((issue) => issue.code)).toEqual(["list-too-long"]);
  });

  it("a wrong number of questions does not hide what is wrong inside them", () => {
    expect(errors({ name: "Q", rounds: [{ type: "safe", name: "S", questions: [{ q: "?", digit: 12 }, { digit: 1 }] }] })).toEqual(["rounds[0].questions:wrong-count", "rounds[0].questions[0].digit:digit-invalid", "rounds[0].questions[1].q:question-no-text"]);
  });

  it("a task written where a question goes is taken as the task; a laugh round's stray points are left out and said", () => {
    const result = make({ name: "Q", rounds: [{ type: "task", name: "T", questions: [{ q: "Draw a cat" }] }, { type: "laugh", name: "L", points: 5 }] });
    expect(result.quiz?.rounds[0]?.questions[0]?.prompt).toBe("Draw a cat");
    expect(result.issues.map((issue) => `${issue.path}:${issue.code}`)).toEqual(["rounds[1].points:field-ignored"]);
  });

  it("a number that was rounded says so, with the step it goes in", () => {
    const result = make({ name: "Q", rounds: [{ type: "laugh", name: "L", seconds: 100 }] });
    expect(result.quiz?.rounds[0]?.defaults.seconds).toBe(90);
    expect(issueText(result.issues[0] ?? { level: "fixed", path: "", code: "not-object", values: {} })).toBe("Round 1: 100 is not allowed here (whole numbers from 30 to 600, in steps of 30); 90 was used. (rounds[0].seconds)");
  });
});

/** The value, or a failed test when it is missing. */
function must<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("missing");
  return value;
}

// Moni 2026-11-28: pictures from Wikimedia Commons, rounds and questions added to a quiz, a check of the
// answers, the person's choices in the prompt, and the messages in Bulgarian.
describe("pictures: only files of Wikimedia Commons, one media file per file", () => {
  it("reads a file name, a page and a file address; refuses another website and a name without an ending", () => {
    expect(commonsTitle("File:Eiffel Tower.jpg")).toBe("File:Eiffel Tower.jpg");
    expect(commonsTitle("eiffel_Tower.JPG")).toBe("File:Eiffel Tower.JPG");
    expect(commonsTitle("Image: Flag of Bulgaria.svg")).toBe("File:Flag of Bulgaria.svg");
    expect(commonsTitle("https://commons.wikimedia.org/wiki/File:Tour_Eiffel_Wikimedia_Commons.jpg")).toBe("File:Tour Eiffel Wikimedia Commons.jpg");
    expect(commonsTitle("https://commons.m.wikimedia.org/wiki/File:%D0%A1%D0%BE%D1%84%D0%B8%D1%8F.jpg")).toBe("File:София.jpg");
    expect(commonsTitle("https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Flag_of_Bulgaria.svg/1280px-Flag_of_Bulgaria.svg.png")).toBe("File:Flag of Bulgaria.svg");
    expect(commonsTitle("https://upload.wikimedia.org/wikipedia/commons/a/a8/Tour_Eiffel.jpg")).toBe("File:Tour Eiffel.jpg");
    for (const wrong of ["https://example.com/eiffel.jpg", "https://commons.wikimedia.org/wiki/Category:Paris", "Eiffel Tower", "", "File:a|b.jpg"]) expect(commonsTitle(wrong)).toBeUndefined();
  });

  it("a picture makes a picture question; an answer's picture goes with the answer; the same file is one media file", () => {
    const result = make({ name: "Q", rounds: [{ name: "R", questions: [
      { q: "Which city?", a: "Paris", picture: "File:Paris.jpg" },
      { q: "Which tower?", a: "Eiffel", answerPicture: "https://commons.wikimedia.org/wiki/File:Paris.jpg" },
      { q: "No picture", a: "x" },
    ] }] });
    const [city, tower, plain] = result.quiz?.rounds[0]?.questions ?? [];
    expect(city).toMatchObject({ kind: "picture", media: { id: expect.any(String) as string } });
    expect(tower?.kind).toBe("text");
    expect(tower?.answerMedia).toEqual(city?.media);
    expect(plain?.media).toBeUndefined();
    expect(result.pictures).toEqual([{ id: city?.media?.id, title: "File:Paris.jpg", path: "rounds[0].questions[0].picture", place: { round: 1, question: 1 } }]);
  });

  it("a name that is no Commons file stops the quiz with a message that says how to find one", () => {
    const result = make({ name: "Q", rounds: [{ name: "R", questions: [{ q: "?", a: "!", picture: "https://example.com/x.jpg" }] }] });
    expect(result.quiz).toBeUndefined();
    expect(issueText(result.issues[0] ?? { level: "error", path: "", code: "not-object", values: {} })).toContain("is not a file of Wikimedia Commons");
  });
});

describe("rounds and questions added to a quiz", () => {
  const quiz = (rounds: number): core.Quiz => must(make({ name: "Q", rounds: Array.from({ length: rounds }, (_unused, index) => ({ name: `R${String(index + 1)}`, questions: [{ q: "?", a: "!" }] })) }).quiz);

  it("rounds sent as a list are read like a quiz's; their default names count on from the quiz's", () => {
    const read = readPasted(`\`\`\`json\n${JSON.stringify([{ questions: [{ q: "New?", a: "yes" }] }, { type: "safe", name: "S", questions: [1, 2, 3, 4, 5].map((digit) => ({ q: "?", digit })) }])}\n\`\`\``);
    if (!read.ok) throw new Error("not read");
    const result = roundsFromDraft(read.draft, quiz(2), OPTIONS, testEnv("n"));
    expect(result.rounds?.map((round) => `${round.kind}:${round.name}`)).toEqual(["standard:Round 3", "safe:S"]);
  });

  it("no more rounds than the quiz has room for", () => {
    const result = roundsFromDraft({ rounds: [{ name: "A", questions: [{ q: "?", a: "!" }] }, { name: "B", questions: [{ q: "?", a: "!" }] }] }, quiz(core.MAX_ROUNDS - 1), OPTIONS, testEnv("n"));
    expect(result.rounds).toBeUndefined();
    expect(issueText(result.issues[0] ?? { level: "error", path: "", code: "not-object", values: {} })).toBe("New rounds that still fit in the quiz: 1 (at most 20 in all); sent: 2. Send fewer. (rounds)");
  });

  it("questions take the round's time and points unless they have their own, and wherever the assistant put them", () => {
    const target = { ...must(quiz(1).rounds[0]), defaults: { seconds: 40, points: { value: 2 }, questionKind: "text", answerType: "open" } };
    for (const input of [{ questions: [{ q: "A?", a: "a" }, { q: "B?", a: "b", seconds: 20 }] }, { rounds: [{ name: "x", questions: [{ q: "A?", a: "a" }, { q: "B?", a: "b", seconds: 20 }] }] }]) {
      const result = questionsFromDraft(input, target, testEnv("n"));
      expect(result.questions?.map((question) => [question.prompt, question.seconds, question.points])).toEqual([["A?", undefined, undefined], ["B?", 20, undefined]]);
    }
    const full = questionsFromDraft({ questions: Array.from({ length: core.MAX_QUESTIONS_PER_ROUND }, () => ({ q: "?", a: "!" })) }, target, testEnv("n"));
    expect(full.issues.map((issue) => issue.code)).toEqual(["questions-room"]);
    expect(issueText(questionsFromDraft({ questions: [{ q: "?" }] }, target, testEnv("n")).issues[0] ?? { level: "error", path: "", code: "not-object", values: {} })).toBe("Question 1: The question has no answer. Give \"a\" (a text, or true / false), or \"options\" with \"correct\". (questions[0].a)");
  });
});

describe("the check of the answers", () => {
  const quiz = must(make(DRAFT_EXAMPLE).quiz);

  it("the prompt lists every question with the answer taken as right, and skips rounds without answers", () => {
    const prompt = checkPrompt(quiz, "bg");
    expect(prompt).toContain("1. Which river flows through Paris? → The Seine");
    expect(prompt).toContain("1) World Cup; 2) Water Closet (right); 3) Wash Corner; 4) West Coast");
    expect(prompt).toContain("Round 3 · Safe (Safe)\n1. How many sides does a triangle have? → 3");
    expect(prompt.endsWith("Round 4 · Make the quizmaster laugh (Make the quizmaster laugh — no questions)\n")).toBe(true);
    expect(prompt).toContain("in Bulgarian");
    expect(prompt).toContain('"Постави" and "Покажи резултата"');
  });

  it("reads the doubted questions and ties each to the quiz's question; an empty list means all is right", () => {
    const answer = `Sure.\n\`\`\`json\n{ "check": [ { "round": 1, "question": "2", "problem": "Europa is a moon.", "suggestion": "Only Mars and Venus." }, { "round": 9, "question": 1, "problem": "x" }, { "round": 1, "question": 1 } ] }\n\`\`\``;
    const read = readCheck(answer, quiz);
    expect(read.ok && read.items.map((item) => [item.round, item.question, item.found?.prompt, item.suggestion])).toEqual([[1, 2, "Which of these are planets?", "Only Mars and Venus."], [9, 1, undefined, ""]]);
    expect(readCheck('{ "check": [] }', quiz)).toEqual({ ok: true, items: [] });
    expect(readCheck("All good!", quiz)).toEqual({ ok: false, reason: "no-json" });
    expect(readCheck(" ", quiz)).toEqual({ ok: false, reason: "empty" });
  });
});

describe("the prompts with the person's choices", () => {
  const wishes: QuizWishes = { topic: "Bulgarian history", audience: "family", difficulty: "easy", name: "", language: "bg", rounds: 2, perRound: 5, answers: ["open", "choice"], seconds: 45, points: 2, specials: ["safe"], pictures: true, extra: "One question about Ivo" };

  it("say what was chosen and that nothing is asked again; only the chosen special rounds are explained", () => {
    const prompt = newQuizPrompt(wishes);
    expect(prompt).toContain("Do not ask about them: write the quiz now. Talk to the person in Bulgarian.");
    expect(prompt).toContain("- 2 standard rounds of 5 questions each, 45 seconds and 2 points a question; answers: open answers, multiple choice (mix them)");
    expect(prompt).toContain("- Special rounds: Safe");
    expect(prompt).toContain("### Round type `safe`");
    expect(prompt).not.toContain("### Round type `pyramid`");
    expect(prompt).toContain("## Pictures");
    expect(prompt).toContain("NEVER invent, guess, complete, translate or remember a file name");
    expect(prompt).toContain('press "Постави" and "Направи куиза"');
    expect(newQuizPrompt({ ...wishes, pictures: false })).not.toContain("## Pictures");
  });

  it("for more rounds and more questions, name what the quiz already has so nothing is asked twice", () => {
    const quiz = must(make(DRAFT_EXAMPLE).quiz);
    const rounds = addRoundsPrompt(quiz, wishes);
    expect(rounds).toContain("Round 1 · Warm-up\n1. Which river flows through Paris?");
    expect(rounds).not.toContain("→");
    expect(rounds).toContain("ALL the new rounds as one LIST");
    const questions = addQuestionsPrompt(quiz, must(quiz.rounds[0]), wishes);
    expect(questions).toContain("Its questions get 30 seconds and 1 point(s) each");
    expect(questions).toContain("- 5 new questions; answers: open answers, multiple choice (mix them)");
    expect(questions).not.toContain("Special rounds");
    expect(questions).toContain('"Добави въпросите"');
  });

  it("the guide on the site explains every special round and pictures, with the buttons in both languages", () => {
    const guide = draftGuide();
    for (const part of ["`pyramid`", "`safe`", "`laugh`", "`task`", "## Pictures", "## Ask first", "(in Bulgarian: \"Постави\" and \"Направи куиза\")"]) expect(guide).toContain(part);
  });
});

describe("messages in Bulgarian, and the reading's last slips", () => {
  it("the same issue in Bulgarian, with the place in Bulgarian, and the message for the assistant", () => {
    const result = make({ name: "Q", rounds: [{ name: "R", questions: [{ q: "?" }] }] });
    expect(issueText(result.issues[0] ?? { level: "error", path: "", code: "not-object", values: {} }, "bg")).toBe("Рунд 1, въпрос 1: Въпросът няма отговор. Дай \"a\" (текст или true / false) или \"options\" с \"correct\". (rounds[0].questions[0].a)");
    expect(issuesForAssistant(result.issues, "bg").split("\n")[0]).toContain("Quizzard не можа да приеме куиза.");
    expect(issuesForAssistant(result.issues, "en", "rounds").split("\n")[0]).toBe("Quizzard could not take the quiz. Fix these problems and send ALL the new rounds again, as one list in one code block — not the quiz's own rounds:");
  });

  it("a one-round quiz written flat keeps its name, language and teams", () => {
    const read = readPasted(JSON.stringify({ name: "Friday quiz", language: "bg", teams: 6, questions: [{ q: "?", a: "!" }] }));
    const quiz = read.ok ? make(read.draft).quiz : undefined;
    expect([quiz?.name, quiz?.language, quiz?.settings.teams, quiz?.rounds.length]).toEqual(["Friday quiz", "bg", 6, 1]);
  });

  it("JSON typed with curly quotes keeps the quotes of a title inside a text", () => {
    const read = readPasted("{ \u201Ename\u201C: \u201EКуиз\u201C, \u201Crounds\u201D: [ { \u201Cname\u201D: \u201CR\u201D, \u201Cquestions\u201D: [ { \u201Cq\u201D: \u201CКой е написал \u201EПод игото\u201C?\u201D, \u201Ca\u201D: \u201CВазов\u201D } ] } ] }");
    expect(read.ok && (read.draft["rounds"] as readonly { questions: readonly { q: string }[] }[])[0]?.questions[0]?.q).toBe("Кой е написал \u201EПод игото\u201C?");
  });
});

// Found by the review of the AI windows (2026-11-28, 54 findings re-checked).
describe("the second review's findings", () => {
  const quiz = must(make(DRAFT_EXAMPLE).quiz);

  it("a stray [] or an empty check after the real one never hides what the assistant found; a broken answer is said", () => {
    const real = '```json\n{ "check": [ { "round": 1, "question": 2, "problem": "Wrong", "suggestion": "c" } ] }\n```';
    for (const after of ["Press Copy, then - [ ] fix it", "If all is right the check returns [].", 'Else send { "check": [] }.']) {
      const read = readCheck(`${real}\n${after}`, quiz);
      expect(read.ok && read.items.length).toBe(1);
    }
    expect(readCheck('{ "check": [ { "round": 1, "question": 2, "problem": "He said "no" here" } ] }', quiz)).toEqual({ ok: false, reason: "broken" });
  });

  it("a problem with a whole round or the quiz, or a place written in words, is kept — never an all-clear", () => {
    const read = readCheck('{ "check": [ { "round": "Round 1", "question": "Q2", "problem": "p" }, { "round": 2, "question": 0, "problem": "two the same" }, { "round": 0, "problem": "too easy" } ] }', quiz);
    expect(read.ok && read.items.map((item) => [item.round, item.question, item.found?.prompt])).toEqual([[1, 2, "Which of these are planets?"], [2, 0, undefined], [0, 0, undefined]]);
  });

  it("curly-quoted JSON keeps a title followed by a comma or a colon inside its text", () => {
    for (const q of ["\u201CIn \u201CHamlet\u201D, who dies first?\u201D", "\u201EВ \u201EПод игото\u201C, кой е Бай Марко?\u201C", "\u201CFinish the line \u201CTo be or not to be\u201D: what comes next?\u201D"]) {
      const read = readPasted(`{\u201Cname\u201D: \u201CQ\u201D, \u201Crounds\u201D: [{\u201Cquestions\u201D: [{\u201Cq\u201D: ${q}, \u201Ca\u201D: \u201Cx\u201D}]}]}`);
      expect(read.ok).toBe(true);
    }
  });

  it("a later part written as { rounds } continues the quiz; a round in a list keeps its name", () => {
    const read = readPasted(`${JSON.stringify({ name: "Big", language: "en", rounds: [{ name: "R1", questions: [{ q: "?", a: "!" }] }] })}\n${JSON.stringify({ rounds: [{ name: "R2", questions: [{ q: "?", a: "!" }] }] })}`);
    expect(read.ok && [read.draft["name"], (read.draft["rounds"] as readonly { name: string }[]).map((round) => round.name)]).toEqual(["Big", ["R1", "R2"]]);
    const listed = readPasted(JSON.stringify([{ name: "Music", language: "bg", questions: [{ q: "?", a: "!" }] }]));
    expect(listed.ok && (listed.draft["rounds"] as readonly { name: string }[])[0]?.name).toBe("Music");
  });

  it("pictures only where they can be shown: a pyramid's and a task's are left out and said", () => {
    const result = make({ name: "Q", rounds: [{ type: "pyramid", name: "P", questions: [{ q: "1", accepted: ["a"], picture: "File:A.jpg" }, { q: "2", accepted: ["a", "b"] }, { q: "3", accepted: ["a", "b", "c"] }, { q: "4", accepted: ["a", "b", "c", "d"] }] }, { type: "task", name: "T", text: "Draw", picture: "File:B.jpg" }] });
    expect(result.pictures).toEqual([]);
    expect(result.issues.map((issue) => `${issue.path}:${issue.code}`)).toEqual(["rounds[0].questions[0].picture:field-ignored", "rounds[1].picture:field-ignored"]);
  });

  it("language codes with an underscore; the prompt talks in the screen's language and names the room left", () => {
    expect(make({ name: "Q", language: "bg_BG", rounds: [{ name: "R", questions: [{ q: "?", a: "!" }] }] }).quiz?.language).toBe("bg");
    const wishes: QuizWishes = { topic: "", audience: "friends", difficulty: "medium", name: "", language: "bg", rounds: 1, perRound: 5, answers: ["open"], seconds: 30, points: 1, specials: [], pictures: false, extra: "", ui: "en" };
    const prompt = newQuizPrompt(wishes);
    expect(prompt).toContain("Talk to the person in English.");
    expect(prompt).toContain('press "Paste" and "Make the quiz"');
    expect(prompt).not.toContain("\"type\": \"pyramid\"");
    expect(prompt).toContain("Special rounds: none — write no special round");
    expect(addRoundsPrompt(quiz, wishes)).toContain("It has 4 of at most 20 rounds: write at most 16 new rounds.");
  });
});
