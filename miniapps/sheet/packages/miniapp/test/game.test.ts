import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  LIMITS, blankGame, blankQuestion, blankRound, formatPoints, gameTotal, isBlankGame, keepBlankLine, parseGame, parsePoints,
  roundCounts, roundPoints, toSaved, type Game, type Mark, type Round,
} from "../src/core/game.ts";

const question = (text: string, mark: Mark, points = 1) => ({ text, mark, points });

describe("parsePoints", () => {
  it("reads whole numbers, halves with a dot or a comma, and signs", () => {
    expect(parsePoints("1")).toBe(1);
    expect(parsePoints(" 0.5 ")).toBe(0.5);
    expect(parsePoints("0,5")).toBe(0.5);
    expect(parsePoints(".5")).toBe(0.5);
    expect(parsePoints("+3")).toBe(3);
    expect(parsePoints("-2")).toBe(-2);
    expect(parsePoints("−2")).toBe(-2);
    expect(parsePoints("1.257")).toBe(1.26);
  });

  it("rejects what is not a number or is out of range", () => {
    for (const raw of ["", " ", "abc", "1e3", "1.2.3", "--1", "1000", "-1000", "Infinity", "0x10"]) expect(parsePoints(raw)).toBeNull();
  });

  it("never returns a number outside the limit or with more than two decimals", () => {
    fc.assert(fc.property(fc.string({ maxLength: 12 }), (raw) => {
      const value = parsePoints(raw);
      if (value === null) return;
      expect(Math.abs(value)).toBeLessThanOrEqual(LIMITS.points);
      expect(Math.round(value * 100)).toBeCloseTo(value * 100, 6);
    }));
  });
});

describe("formatPoints", () => {
  it("drops trailing zeros and follows the language's decimal mark", () => {
    expect(formatPoints(6, "en")).toBe("6");
    expect(formatPoints(6.5, "en")).toBe("6.5");
    expect(formatPoints(6.5, "bg")).toBe("6,5");
    expect(formatPoints(0.25, "en")).toBe("0.25");
    expect(formatPoints(-0, "en")).toBe("0");
    expect(formatPoints(1234.5, "en")).toBe("1234.5");
  });
});

describe("points of a round and of the sheet", () => {
  const round: Round = { name: "History", bonus: 2, questions: [question("Paris", "right"), question("1066", "wrong"), question("Nile", "right", 0.5), question("", "none"), question("x", "right", 2)] };

  it("a round = the points of its right answers + the bonus", () => {
    expect(roundPoints(round)).toBe(5.5);
    expect(roundPoints({ ...round, bonus: -1 })).toBe(2.5);
    expect(roundCounts(round)).toEqual({ right: 3, judged: 4 });
  });

  it("wrong and unjudged answers give nothing, whatever they are worth", () => {
    expect(roundPoints({ name: "", bonus: 0, questions: [question("a", "wrong", 5), question("b", "none", 5)] })).toBe(0);
  });

  it("the total is the sum of the rounds, without floating-point dust", () => {
    const tenths: Round = { name: "", bonus: 0, questions: [question("a", "right", 0.1), question("b", "right", 0.2)] };
    expect(roundPoints(tenths)).toBe(0.3);
    expect(gameTotal({ version: 1, rounds: [round, tenths, blankRound()] })).toBe(5.8);
  });

  it("the total equals the sum of every round, for any sheet", () => {
    const anyQuestion = fc.record({ text: fc.string({ maxLength: 5 }), mark: fc.constantFrom<Mark>("none", "right", "wrong"), points: fc.integer({ min: -400, max: 400 }).map((n) => n / 4) });
    const anyRound = fc.record({ name: fc.constant(""), bonus: fc.integer({ min: -40, max: 40 }).map((n) => n / 4), questions: fc.array(anyQuestion, { maxLength: 8 }) });
    fc.assert(fc.property(fc.array(anyRound, { maxLength: 6 }), (rounds) => {
      const sum = rounds.reduce((total, one) => total + roundPoints(one), 0);
      expect(gameTotal({ version: 1, rounds })).toBeCloseTo(sum, 6);
    }));
  });
});

describe("the blank line at the end of a round", () => {
  it("is added after a written line and never doubled", () => {
    const round: Round = { name: "", bonus: 0, questions: [question("Paris", "none")] };
    expect(keepBlankLine(round).questions).toHaveLength(2);
    expect(keepBlankLine(round).questions).toHaveLength(2);
    round.questions.push(blankQuestion(), blankQuestion());
    expect(keepBlankLine(round).questions).toHaveLength(2);
  });

  it("is not added to a full round", () => {
    const round: Round = { name: "", bonus: 0, questions: Array.from({ length: LIMITS.questions }, () => question("a", "right")) };
    expect(keepBlankLine(round).questions).toHaveLength(LIMITS.questions);
  });
});

describe("saving and loading", () => {
  it("an untouched sheet stores nothing", () => {
    expect(isBlankGame(blankGame())).toBe(true);
    expect(toSaved(blankGame())).toBeNull();
  });

  it("round-trips a sheet, without the blank lines in storage and with them on screen", () => {
    const game: Game = { version: 1, rounds: [keepBlankLine({ name: "Music", bonus: 1, questions: [question("ABBA", "right"), question("", "wrong", 2)] }), blankRound()] };
    const saved = toSaved(game);
    expect(saved?.rounds[0]?.questions).toHaveLength(2);
    expect(saved?.rounds[1]?.questions).toHaveLength(0);
    expect(parseGame(JSON.parse(JSON.stringify(saved)))).toEqual(game);
  });

  it("drops what is not a sheet and cuts texts and numbers to the limits", () => {
    expect(parseGame(null)).toEqual(blankGame());
    expect(parseGame({ rounds: "no" })).toEqual(blankGame());
    expect(parseGame({ rounds: [] })).toEqual(blankGame());
    const dirty = { rounds: [null, 7, { name: 5, bonus: "2", questions: [null, { text: "a".repeat(500), mark: "maybe", points: 1e9 }, { text: 3, mark: "right", points: 0.5 }] }] };
    const game = parseGame(dirty);
    expect(game.rounds).toHaveLength(1);
    expect(game.rounds[0]).toMatchObject({ name: "", bonus: 0 });
    expect(game.rounds[0]?.questions[0]).toEqual({ text: "a".repeat(LIMITS.answer), mark: "none", points: 1 });
    expect(game.rounds[0]?.questions[1]).toEqual({ text: "", mark: "right", points: 0.5 });
  });

  it("never returns more rounds or questions than the limits, whatever is stored", () => {
    const many = { rounds: Array.from({ length: 80 }, () => ({ questions: Array.from({ length: 90 }, () => ({ text: "a", mark: "right", points: 1 })) })) };
    const game = parseGame(many);
    expect(game.rounds).toHaveLength(LIMITS.rounds);
    for (const round of game.rounds) expect(round.questions).toHaveLength(LIMITS.questions);
  });

  it("parseGame never throws and always gives at least one round", () => {
    fc.assert(fc.property(fc.anything(), (value) => {
      expect(parseGame(value).rounds.length).toBeGreaterThan(0);
    }));
  });
});

describe("texts", () => {
  it("Help has the same number of steps, features and questions in both languages", async () => {
    const { help } = await import("../src/help.ts");
    expect(help.bg.steps).toHaveLength(help.en.steps.length);
    expect(help.bg.features).toHaveLength(help.en.features.length);
    expect(help.bg.faq).toHaveLength(help.en.faq.length);
  });

  it("Bulgarian has every key and placeholder of English", async () => {
    const { en } = await import("../src/i18n/en.ts");
    const { bg } = await import("../src/i18n/bg.ts");
    const placeholders = (text: string): string[] => [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1] ?? "").sort();
    expect(Object.keys(bg).sort()).toEqual(Object.keys(en).sort());
    for (const [key, text] of Object.entries(en)) expect(placeholders(Reflect.get(bg, key) as string), key).toEqual(placeholders(text));
  });
});
