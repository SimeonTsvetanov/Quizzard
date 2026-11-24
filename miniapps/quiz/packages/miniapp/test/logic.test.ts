// The creator's pure logic: routes in `history.state`, where the focus returns, formats, the Undo
// helpers, the deck's thickness, the registries' pickers (AC10 on the UI side), Help and meta.
import { beforeAll, describe, expect, it } from "vitest";
import { PICTURE_MAX_BYTES, QUIZ_MEDIA_MAX_BYTES, VIDEO_MAX_BYTES, addQuestion, addRound, createQuiz, createRegistries, defineBasicKind, deleteQuestion, deleteRound, sequentialIds, type Env, type Quiz } from "@simeonts/quizzard-quiz-core";
import { answerUis } from "../src/answers-ui/index.ts";
import { returnFocus, settle } from "../src/app/mount.ts";
import { LIBRARY, ROUTE_KEY, SUB_KEY, entryState, readDepth, readRoute, type Route } from "../src/app/routes.ts";
import { bytesText, changedText, dateTimeText, numberText, parseNumber, slideLabels, wholeMinutes } from "../src/format.ts";
import { help } from "../src/help.ts";
import { bg } from "../src/i18n/bg.ts";
import { en } from "../src/i18n/en.ts";
import { createTranslator, loadLanguage } from "../src/i18n/translate.ts";
import { kindUis } from "../src/kinds-ui/index.ts";
import { meta } from "../src/meta.ts";
import { pointsText, promptSize } from "../src/render/slide.ts";
import { withQuestion, withRound } from "../src/screens/common.ts";
import { matches, stackOf } from "../src/screens/library.ts";
import { LIST_MODE_KEY, readListMode, writeListMode } from "../src/storage/view-prefs.ts";
import { playOrder } from "../src/screens/preview.ts";
import { DB_NAME } from "../src/storage/db.ts";
import { answerChoices, canShow, createUiRegistries, kindChoices } from "../src/ui-registry.ts";


// Bulgarian is loaded when it is the language on show; the tests ask for it up front.
beforeAll(() => loadLanguage("bg"));
const env = (): Env => ({ ids: sequentialIds("x"), registries: createRegistries() });

function sample(): Quiz {
  const e = env();
  let quiz = addRound(createQuiz({ name: "Sample", language: "en", now: "2026-11-23T10:00:00.000Z" }, e), "Round 1", e);
  quiz = addRound(quiz, "Round 2", e);
  const [first, second] = quiz.rounds;
  quiz = addQuestion(addQuestion(quiz, first?.id ?? "", {}, e), first?.id ?? "", {}, e);
  return addQuestion(quiz, second?.id ?? "", {}, e);
}

describe("routes in history.state", () => {
  const routes: Route[] = [
    { screen: "quiz", quiz: "a" },
    { screen: "round", quiz: "a", round: "r" },
    { screen: "editor", quiz: "a", question: "q" },
    { screen: "preview", quiz: "a", question: "q" },
  ];
  it("every screen survives entryState → readRoute, with its depth", () => {
    routes.forEach((route, index) => {
      const state = entryState(null, route, index + 1);
      expect(readRoute(state)).toEqual(route);
      expect(readDepth(state)).toBe(index + 1);
    });
  });
  it("passes on what the entry held: the shell's mark stays", () => {
    const state = entryState({ quizzardScreen: { homeBelow: true } }, { screen: "quiz", quiz: "a" }, 1);
    expect(state).toEqual({ quizzardScreen: { homeBelow: true }, [ROUTE_KEY]: { screen: "quiz", quiz: "a" }, [SUB_KEY]: 1 });
  });
  it("the tool's first entry and anything unreadable is the library at depth 0", () => {
    for (const state of [null, undefined, "x", {}, { quizzardScreen: { homeBelow: true } }, { [ROUTE_KEY]: { screen: "round", quiz: "a" } }, { [ROUTE_KEY]: { screen: "editor", quiz: "" } }, { [ROUTE_KEY]: { screen: "nope", quiz: "a" } }]) {
      expect(readRoute(state)).toEqual(LIBRARY);
    }
    for (const state of [null, {}, { [SUB_KEY]: -1 }, { [SUB_KEY]: 1.5 }, { [SUB_KEY]: "2" }]) expect(readDepth(state)).toBe(0);
  });
});

describe("settle and returnFocus", () => {
  const quiz = sample();
  const round = quiz.rounds[0];
  const question = round?.questions[0];
  it("a route whose round or question is gone leads to the quiz; others stay", () => {
    const fine: Route = { screen: "editor", quiz: quiz.id, question: question?.id ?? "" };
    expect(settle(fine, quiz)).toBe(fine);
    expect(settle({ screen: "round", quiz: quiz.id, round: "gone" }, quiz)).toEqual({ screen: "quiz", quiz: quiz.id });
    expect(settle({ screen: "preview", quiz: quiz.id, question: "gone" }, quiz)).toEqual({ screen: "quiz", quiz: quiz.id });
  });
  it("focus returns to the card that opened the screen just left", () => {
    expect(returnFocus({ screen: "editor", quiz: "a", question: "q" }, { screen: "round", quiz: "a", round: "r" })).toBe('[data-focus="question:q"]');
    expect(returnFocus({ screen: "round", quiz: "a", round: "r" }, { screen: "quiz", quiz: "a" })).toBe('[data-focus="round:r"]');
    expect(returnFocus({ screen: "quiz", quiz: "a" }, LIBRARY)).toBe('[data-focus="quiz:a"]');
    expect(returnFocus(LIBRARY, { screen: "quiz", quiz: "a" })).toBeNull();
  });
});

describe("formats", () => {
  it("play time is whole minutes, rounded up", () => {
    expect([0, 1, 60, 61, 150].map(wholeMinutes)).toEqual([0, 1, 1, 2, 3]);
  });
  it("numbers are read with a dot or a comma and written in the language", () => {
    expect(parseNumber("2")).toBe(2);
    expect(parseNumber(" 0,5 ")).toBe(0.5);
    expect(parseNumber("1.25")).toBe(1.25);
    for (const text of ["", "abc", "1,", "-2", "1e3"]) expect(parseNumber(text)).toBeNull();
    expect(numberText(0.5, "en")).toBe("0.5");
    expect(numberText(0.5, "bg")).toBe("0,5");
  });
  it("sizes and dates never throw on odd input", () => {
    expect(bytesText(2048, "en")).toMatch(/2/);
    expect(bytesText(3.5 * 1024 * 1024, "en")).toBe("3.5 MB");
    // The limits are 1024-based (core limits.ts): they read as the round numbers of the SPEC, never "15.7 MB".
    expect(bytesText(PICTURE_MAX_BYTES, "en")).toBe("15 MB");
    expect(bytesText(VIDEO_MAX_BYTES, "en")).toBe("50 MB");
    expect(bytesText(QUIZ_MEDIA_MAX_BYTES, "bg")).toBe("250 MB");
    expect(dateTimeText("2026-11-23T10:05:00.000Z", "en")).toMatch(/2026.*\d{2}:\d{2}/);
    expect(dateTimeText("nope", "en")).toBe("");
    expect(changedText("not a date", "en")).toBe("");
    expect(changedText("2026-11-23T10:00:00.000Z", "en", new Date("2026-11-25T10:00:00.000Z"))).toMatch(/2026/);
  });
  it("points read as a number, a note, or both (AC3), in both languages", () => {
    const labels = slideLabels(createTranslator("en"), "en");
    expect(pointsText({ value: 1 }, labels)).toBe("1 point");
    expect(pointsText({ value: 2 }, labels)).toBe("2 points");
    expect(pointsText({ value: 0, note: "1 for the band, 2 with the song" }, labels)).toBe("1 for the band, 2 with the song");
    expect(pointsText({ value: 2, note: "half for the year" }, labels)).toBe("2 points · half for the year");
    expect(pointsText({ value: 0 }, labels)).toBe("0 points");
    const bgLabels = slideLabels(createTranslator("bg"), "bg");
    expect(pointsText({ value: 1 }, bgLabels)).toBe("1 точка");
    expect(pointsText({ value: 0.5 }, bgLabels)).toBe("0,5 точки");
    expect(bgLabels.seconds(30)).toBe("30 сек");
  });
  it("a longer question steps down a size", () => {
    expect([10, 70, 71, 160, 161, 320, 321].map((length) => promptSize("x".repeat(length)))).toEqual(["l", "l", "m", "m", "s", "s", "xs"]);
  });
  it("a deck is thicker the more questions it holds", () => {
    expect([0, 1, 5, 6, 15, 16, 200].map(stackOf)).toEqual([0, 1, 1, 2, 2, 3, 3]);
  });
});

describe("Undo puts exactly the deleted thing back", () => {
  const quiz = sample();
  const round = quiz.rounds[0];
  const question = round?.questions[0];
  it("a question returns to its place, into the quiz as it is by then", () => {
    if (!round || !question) throw new Error("fixture");
    const later = addRound(deleteQuestion(quiz, question.id), "Round 3", env());
    const restored = withQuestion(later, round.id, question, 0);
    expect(restored.rounds[0]?.questions.map((q) => q.id)).toEqual(round.questions.map((q) => q.id));
    expect(restored.rounds).toHaveLength(3); // the round added meanwhile stays
    expect(withQuestion(restored, round.id, question, 0)).toBe(restored); // never twice
  });
  it("a round returns with its questions", () => {
    if (!round) throw new Error("fixture");
    const restored = withRound(deleteRound(quiz, round.id), round, 0);
    expect(restored.rounds.map((r) => r.id)).toEqual(quiz.rounds.map((r) => r.id));
    expect(withRound(restored, round, 0)).toBe(restored);
  });
  it("the preview walks every question in play order", () => {
    expect(playOrder(quiz).map((stop) => [stop.round.name, stop.number])).toEqual([["Round 1", 1], ["Round 1", 2], ["Round 2", 1]]);
  });
});

describe("pickers come from the registries (PLAN §2 rule 1)", () => {
  const t = createTranslator("en");
  const registries = createRegistries();
  const ui = createUiRegistries(kindUis, answerUis);
  const kindIds = (): string[] => registries.kinds.list().map((kind) => kind.id);
  it("text, picture, audio and video can all be chosen: each has its slide part and its editor part", () => {
    expect(kindChoices(kindIds(), ui, t).map((choice) => [choice.label, choice.isAvailable])).toEqual([["Text", true], ["Picture", true], ["Audio", true], ["Video", true]]);
  });
  it("all three answer types can be chosen", () => {
    expect(answerChoices(registries.answers.list().map((answer) => answer.id), ui, t).map((choice) => [choice.label, choice.isAvailable])).toEqual([["Open answer", true], ["Multiple choice", true], ["True / false", true]]);
  });
  it("AC10: a new kind appears in the picker with no change outside its registry entries — soon without UI parts, selectable with them", () => {
    registries.kinds.register(defineBasicKind("pyramid", null));
    expect(kindChoices(kindIds(), ui, t).at(-1)).toEqual({ id: "pyramid", icon: "unknown", label: "pyramid", tone: "none", isAvailable: false });
    const extended = createUiRegistries([...kindUis, { id: "pyramid", label: "kind.text", icon: "deck", tone: "audio", parts: { editor: () => null, slide: () => null } }], answerUis);
    expect(kindChoices(kindIds(), extended, t).at(-1)).toMatchObject({ id: "pyramid", isAvailable: true, tone: "audio" });
    const question = { id: "q", kind: "pyramid", prompt: "", answer: { type: "open", text: "" } };
    expect(canShow(question, extended)).toBe(true);
    expect(canShow(question, ui)).toBe(false);
    expect(canShow({ ...question, kind: "text", answer: { type: "ladder" } }, ui)).toBe(false);
  });
});

describe("UX review helpers", () => {
  it("the library's search finds a quiz by every typed word, whatever the case", () => {
    expect(matches("Pub night — autumn", "pub")).toBe(true);
    expect(matches("Pub night — autumn", "AUTUMN pub")).toBe(true);
    expect(matches("Pub night — autumn", "pub winter")).toBe(false);
    expect(matches("Куиз вечер", "ВЕЧЕР")).toBe(true);
    expect(matches("Anything", "")).toBe(true);
  });
  it("the list mode is cards until the person chooses the list, and survives odd stored values", () => {
    const values = new Map<string, unknown>();
    const prefs = { get: <T>(key: string, fallback: T): T => (values.has(key) ? (values.get(key) as T) : fallback), set: (key: string, value: unknown): boolean => { values.set(key, value); return true; }, remove: (key: string): void => { values.delete(key); } };
    expect(readListMode(prefs)).toBe("cards");
    writeListMode(prefs, "list");
    expect(readListMode(prefs)).toBe("list");
    values.set(LIST_MODE_KEY, 42);
    expect(readListMode(prefs)).toBe("cards");
  });
  it("a Play route keeps where it starts from, and reads without it as before", () => {
    const from: Route = { screen: "play", quiz: "q", from: "round-2" };
    expect(readRoute(entryState(null, from, 1))).toEqual(from);
    expect(readRoute({ [ROUTE_KEY]: { screen: "play", quiz: "q" } })).toEqual({ screen: "play", quiz: "q" });
  });
});

describe("texts and meta", () => {
  const keys = (node: object, prefix = ""): string[] => Object.entries(node).flatMap(([key, value]) => (typeof value === "string" ? [`${prefix}${key}`] : keys(value as object, `${prefix}${key}.`)));
  it("Bulgarian has every key English has, and no empty text", () => {
    expect(keys(bg)).toEqual(keys(en));
    const texts = (node: object): string[] => Object.values(node).flatMap((value: unknown) => (typeof value === "string" ? [value] : texts(value as object)));
    expect([...texts(en), ...texts(bg)].filter((text) => text.trim() === "")).toEqual([]);
  });
  it("plurals follow the count in both languages", () => {
    expect(createTranslator("en")("count.questions", { count: 1 })).toBe("1 question");
    expect(createTranslator("en")("count.questions", { count: 3 })).toBe("3 questions");
    expect(createTranslator("bg")("count.rounds", { count: 1 })).toBe("1 рунд");
    expect(createTranslator("bg")("count.rounds", { count: 3 })).toBe("3 рунда");
  });
  it("Help has the same number of steps, features and questions in both languages", () => {
    expect(help.bg.steps).toHaveLength(help.en.steps.length);
    expect(help.bg.features).toHaveLength(help.en.features.length);
    expect(help.bg.faq).toHaveLength(help.en.faq.length);
  });
  it("Help quotes the UI labels exactly", () => {
    for (const label of [en.library.new, en.round.add, en.question.add, en.answer.open, en.answer.choice, en.answer.trueFalse, en.done, en.quiz.preview, en.preview.showAnswer, en.round.settings, en.timing.fromRound, en.quiz.play, en.quiz.export, en.library.create, en.editor.another, en.round.view.cards, en.round.view.list, en.print.button, en.quiz.more, en.menu.playFrom, en.menu.toRound, en.editor.round, en.unfinished.go.play, en.unfinished.go.export, en.question.unfinished, en.quiz.exportShort]) expect(JSON.stringify(help.en)).toContain(`“${label}”`);
    for (const label of [bg.library.new, bg.round.add, bg.question.add, bg.answer.open, bg.answer.choice, bg.answer.trueFalse, bg.done, bg.quiz.preview, bg.preview.showAnswer, bg.round.settings, bg.timing.fromRound, bg.quiz.play, bg.quiz.export, bg.library.create, bg.editor.another, bg.round.view.cards, bg.round.view.list, bg.print.button, bg.quiz.more, bg.menu.playFrom, bg.menu.toRound, bg.editor.round, bg.unfinished.go.play, bg.unfinished.go.export, bg.question.unfinished, bg.quiz.exportShort]) expect(JSON.stringify(help.bg)).toContain(`„${label}“`);
  });
  it("meta declares the database the storage module opens, so Settings can measure and clear it", () => {
    expect(meta).toMatchObject({ id: "quiz", status: "ready", contract: 1, languages: ["en", "bg"] });
    expect(meta.storage).toEqual({ prefix: "quizzard-quiz:v1:", databases: [DB_NAME] });
  });
});
