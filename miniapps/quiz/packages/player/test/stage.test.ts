// How the stage picks its canvas (ui/stage.ts): the design size the whole stage is scaled from.
import { describe, expect, it } from "vitest";
import { numberText, stageLabels } from "../src/env.ts";
import { bg } from "../src/i18n/bg.ts";
import { en } from "../src/i18n/en.ts";
import { createTranslator, playerLang } from "../src/i18n/translate.ts";
import { designOf } from "../src/ui/stage.ts";

describe("designOf", () => {
  it("a 16:9 screen of any size is the 1600 × 900 slide", () => {
    for (const [width, height] of [[1920, 1080], [1280, 720], [3840, 2160], [640, 360]] as const) {
      expect(designOf(width, height)).toEqual({ width: 1600, height: 900, shape: "wide" });
    }
  });

  it("a wider screen keeps the slide's height and grows sideways; a 4:3 one keeps its width and grows taller", () => {
    const ultraWide = designOf(2560, 1080);
    expect(ultraWide.shape).toBe("wide");
    expect(ultraWide.height).toBeCloseTo(900, 6);
    expect(ultraWide.width).toBeCloseTo(2133.33, 1);
    expect(designOf(1024, 768)).toEqual({ width: 1600, height: 1200, shape: "wide" });
  });

  it("an upright phone gets a narrow canvas, so the type is large against the screen", () => {
    const phone = designOf(390, 844);
    expect(phone.shape).toBe("tall");
    expect(phone.width).toBe(820);
    expect(phone.height).toBeCloseTo(820 * (844 / 390), 5);
  });

  it("the canvas always has the box's proportions, so it fills the box exactly", () => {
    for (const [width, height] of [[390, 844], [844, 390], [800, 800], [1000, 900], [1366, 768], [320, 568]] as const) {
      const design = designOf(width, height);
      expect(design.width / design.height).toBeCloseTo(width / height, 6);
    }
  });

  it("a box without a size yet is treated as the slide", () => {
    expect(designOf(0, 0)).toEqual({ width: 1600, height: 900, shape: "wide" });
  });
});

describe("the player's words", () => {
  /** Every key path of a dictionary with the placeholders of its text. */
  function shape(node: unknown, prefix = ""): string[] {
    if (typeof node === "string") return [`${prefix}:${[...node.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort().join(",")}`];
    return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) => shape(value, prefix === "" ? key : `${prefix}.${key}`));
  }

  it("Bulgarian has every key of English with the same placeholders", () => {
    expect(shape(bg)).toEqual(shape(en));
  });

  it("the quiz's language picks the dictionary; a language the player lacks plays in English", () => {
    expect(playerLang("bg")).toBe("bg");
    expect(playerLang("en")).toBe("en");
    expect(playerLang("de")).toBe("en");
    expect(playerLang("toString")).toBe("en");
    expect(createTranslator("bg")("control.next")).toBe("Напред");
    expect(createTranslator("en")("teamName", { n: 3 })).toBe("Team 3");
    expect(createTranslator("en")("unit.points", { count: 1, n: "1" })).toBe("1 point");
    expect(createTranslator("bg")("unit.points", { count: 2, n: "2" })).toBe("2 точки");
  });

  it("numbers are written the language's way", () => {
    expect(numberText(2.5, "en")).toBe("2.5");
    expect(numberText(2.5, "bg")).toBe("2,5");
    const labels = stageLabels(createTranslator("bg"), "bg");
    expect(labels.points(1.5)).toBe("1,5 точки");
    expect(labels.seconds(30)).toBe("30 сек");
    expect(labels.trueText).toBe("Вярно");
  });
});
