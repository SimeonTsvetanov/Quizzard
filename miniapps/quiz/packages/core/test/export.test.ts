// "Export to play" (SPEC F9, AC6): the assembler puts the quiz and its files into the template as
// inert data; what is read back is what went in, whatever the quiz's texts are.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  EXPORT_DATA_MARK, EXPORT_MEDIA_ATTR, EXPORT_QUIZ_ID, ExportError, MEDIA_BLOCK_CLOSE, QUIZ_FILE_EXTENSION, type ExportMedia, type QuizFile, assembleExport, base64Length, editQuestion,
  exportFileName, exportParts, exportSize, extractEmbedded, isPlayableFile, isQuizFile, jsonForScript, mediaBlockOpen, readEmbeddedQuiz, renameQuiz, safeFileName, toFile,
} from "../src/index.ts";
import sample from "./fixtures/v1/sample.quiz.json" with { type: "json" };
import { questionAt, sampleQuiz } from "./helpers.ts";

const CSP = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'sha256-abc='">`;
const TEMPLATE = `<!doctype html><html><head>${CSP}<title>t</title></head><body>${EXPORT_DATA_MARK}<script>run()</script></body></html>`;
const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);

/** A quiz file whose first question carries the given text everywhere a text can go. */
function fileWith(text: string): QuizFile {
  const quiz = sampleQuiz([2, 1]);
  const first = questionAt(quiz, 0, 0);
  return toFile(renameQuiz(editQuestion(quiz, first.id, { prompt: text, explanation: text, answer: { type: "open", text } }), text));
}

/** The quiz read back from an exported page, the way the player reads it. */
function readBack(html: string): QuizFile | null {
  return readEmbeddedQuiz(extractEmbedded(html).quiz ?? "");
}

describe("assembleExport", () => {
  it("puts the quiz into the template at the mark and keeps the rest of the page, its policy included, as it is", () => {
    const file = toFile(sampleQuiz([2, 3]));
    const html = assembleExport(TEMPLATE, file);
    const [before, after] = TEMPLATE.split(EXPORT_DATA_MARK);
    expect(html.startsWith(before ?? "?")).toBe(true);
    expect(html.endsWith(after ?? "?")).toBe(true);
    expect(html).toContain(CSP);
    expect(html).not.toContain(EXPORT_DATA_MARK);
    expect(html).toContain(`<script type="application/json" id="${EXPORT_QUIZ_ID}">`);
    expect(readBack(html)).toEqual(file);
  });

  it("round trip: the version-1 sample file (unknown kinds and fields included) is read back unchanged", () => {
    expect(isQuizFile(sample)).toBe(true);
    const html = assembleExport(TEMPLATE, sample as QuizFile);
    expect(readBack(html)).toEqual(sample);
  });

  it.each([
    ["a closing script tag", "</script><script>alert(1)</script>"],
    ["a closing tag in capitals", "</SCRIPT >"],
    ["an HTML comment", "<!-- <script> -->"],
    ["line and paragraph separators", `a${LS}b${PS}c`],
    ["an ampersand entity", "&lt;/script&gt; &amp;"],
    ["quotes and backslashes", `"\\" \\u003c \\`],
    ["the data mark itself", EXPORT_DATA_MARK],
    ["Cyrillic and emoji", "Въпрос № 1 — „да“ 🎉"],
  ])("a quiz text with %s cannot break out of the data block and is read back exactly", (_name, text) => {
    const file = fileWith(text);
    const html = assembleExport(TEMPLATE, file);
    const block = extractEmbedded(html).quiz ?? "";
    expect(block).not.toMatch(/[<>&\u2028\u2029]/);
    expect(html.match(/<script/g)).toHaveLength(2); // the quiz block and the template's own script — nothing added
    expect(html.match(/<\/script>/g)).toHaveLength(2);
    expect(readBack(html)).toEqual(file);
  });

  it("property: any text in any field survives the round trip and never adds markup", () => {
    fc.assert(fc.property(fc.string({ unit: "binary" }), (text) => {
      const file = fileWith(text.slice(0, 80));
      const html = assembleExport(TEMPLATE, file);
      expect(html.match(/<script/g)).toHaveLength(2);
      expect(readBack(html)).toEqual(file);
    }));
  });

  it("embeds media as base64 blocks that are read back with their id and type", () => {
    const media: ExportMedia[] = [
      { id: "m1", mime: "image/png", base64: "iVBORw0KGgo=" },
      { id: 'odd "id" <1> & co', mime: "audio/mpeg", base64: "" },
      { id: "m3", mime: "video/mp4", base64: "AAAA" },
    ];
    const file = toFile(sampleQuiz([1]));
    const html = assembleExport(TEMPLATE, file, media);
    expect(html).toContain(`<script type="application/octet-stream" ${EXPORT_MEDIA_ATTR}="m1" data-mime="image/png">iVBORw0KGgo=</script>`);
    expect(extractEmbedded(html).media).toEqual(media);
    expect(readBack(html)).toEqual(file);
    expect(html.match(/<script/g)).toHaveLength(2 + media.length);
  });

  it("refuses media that is not base64, has no real type or repeats an id — nothing unchecked goes into the page", () => {
    const file = toFile(sampleQuiz([1]));
    const reason = (media: ExportMedia[]): unknown => {
      try {
        assembleExport(TEMPLATE, file, media);
        return "assembled";
      } catch (error) {
        return error instanceof ExportError ? error.reason : error;
      }
    };
    expect(reason([{ id: "m", mime: "image/png", base64: "</script><script>alert(1)</script>" }])).toBe("media");
    expect(reason([{ id: "m", mime: "image/png", base64: "AAA" }])).toBe("media"); // not a multiple of 4
    expect(reason([{ id: "m", mime: 'image/png" onload="x', base64: "AAAA" }])).toBe("media");
    expect(reason([{ id: "", mime: "image/png", base64: "AAAA" }])).toBe("media");
    expect(reason([{ id: "m", mime: "image/png", base64: "AAAA" }, { id: "m", mime: "image/png", base64: "AAAA" }])).toBe("media");
  });

  it("refuses a template without its data mark, or with two", () => {
    const file = toFile(sampleQuiz([1]));
    expect(() => assembleExport("<html></html>", file)).toThrow(ExportError);
    expect(() => assembleExport(`${TEMPLATE}${EXPORT_DATA_MARK}`, file)).toThrow(/exactly once/);
  });
});

describe("jsonForScript", () => {
  it("gives JSON that parses to the same value and has none of the characters that end a script block", () => {
    const value = { a: `</script>${LS}${PS}&<!--`, b: [1, null, true], c: { d: "<" } };
    const text = jsonForScript(value);
    expect(text).not.toMatch(/[<>&\u2028\u2029]/);
    expect(JSON.parse(text)).toEqual(value);
  });
});

describe("readEmbeddedQuiz / isPlayableFile", () => {
  it("gives null for text that is not a quiz: not JSON, another format, a newer version, a cut file", () => {
    const file = toFile(sampleQuiz([1]));
    expect(readEmbeddedQuiz("")).toBeNull();
    expect(readEmbeddedQuiz("{")).toBeNull();
    expect(readEmbeddedQuiz("[]")).toBeNull();
    expect(readEmbeddedQuiz(JSON.stringify({ ...file, format: "other" }))).toBeNull();
    expect(readEmbeddedQuiz(JSON.stringify({ ...file, version: 2 }))).toBeNull();
    expect(readEmbeddedQuiz(JSON.stringify({ ...file, quiz: { ...file.quiz, rounds: "none" } }))).toBeNull();
    expect(readEmbeddedQuiz(JSON.stringify({ ...file, media: undefined }))).toBeNull();
  });

  it("the hand check accepts every file the Zod validation accepts (the player reads what the creator saved)", () => {
    for (const shape of [[], [0], [1], [3, 2, 1]]) {
      const file = toFile(sampleQuiz(shape));
      expect(isQuizFile(file)).toBe(true);
      expect(isPlayableFile(file)).toBe(true);
    }
    expect(isPlayableFile(sample)).toBe(true);
  });

  it("the hand check refuses a question or a round that lost what the player reads", () => {
    const file = toFile(sampleQuiz([1]));
    const round = file.quiz.rounds[0];
    const question = round?.questions[0];
    const withQuestion = (changed: unknown): unknown => ({ ...file, quiz: { ...file.quiz, rounds: [{ ...round, questions: [changed] }] } });
    expect(isPlayableFile(withQuestion({ ...question, answer: null }))).toBe(false);
    expect(isPlayableFile(withQuestion({ ...question, prompt: 5 }))).toBe(false);
    expect(isPlayableFile(withQuestion({ ...question, seconds: 0 }))).toBe(false);
    expect(isPlayableFile(withQuestion({ ...question, points: { value: "2" } }))).toBe(false);
    expect(isPlayableFile(withQuestion({ ...question, media: {} }))).toBe(false);
    expect(isPlayableFile({ ...file, quiz: { ...file.quiz, rounds: [{ ...round, defaults: { ...round?.defaults, seconds: -1 } }] } })).toBe(false);
    expect(isPlayableFile({ ...file, quiz: { ...file.quiz, settings: {} } })).toBe(false);
  });
});

describe("exportFileName", () => {
  it("is the quiz's name without what file systems refuse, with .html", () => {
    expect(exportFileName("Pub night")).toBe("Pub night.html");
    expect(exportFileName("Куиз вечер № 3")).toBe("Куиз вечер № 3.html");
    expect(exportFileName('a/b\\c:d*e?f"g<h>i|j')).toBe("a b c d e f g h i j.html");
    expect(exportFileName("  .hidden.  ")).toBe("hidden.html");
    expect(exportFileName("tab\there\nline")).toBe("tab here line.html");
    expect(exportFileName("x".repeat(200))).toBe(`${"x".repeat(80)}.html`);
  });

  it("falls back when nothing of the name is left", () => {
    expect(exportFileName("")).toBe("quiz.html");
    expect(exportFileName(" /:. ", "куиз")).toBe("куиз.html");
  });
});

describe("the pieces of an export (large quizzes are written piece by piece)", () => {
  it("exportParts + media blocks join to exactly what assembleExport gives", () => {
    const file = toFile(sampleQuiz([1]));
    const media: ExportMedia[] = [{ id: "m1", mime: "image/png", base64: "aGVsbG8=" }, { id: 'm"2', mime: "audio/mpeg", base64: "" }];
    const parts = exportParts(TEMPLATE, file);
    const joined = [parts.before, parts.quiz, ...media.map((entry) => `${mediaBlockOpen(entry)}${entry.base64}${MEDIA_BLOCK_CLOSE}`), parts.after].join("");
    expect(joined).toBe(assembleExport(TEMPLATE, file, media));
    expect(extractEmbedded(joined).media).toEqual(media);
    expect(() => exportParts("no mark", file)).toThrow(ExportError);
    expect(() => mediaBlockOpen({ id: "", mime: "image/png" })).toThrow(ExportError);
    expect(() => mediaBlockOpen({ id: "a", mime: "<script>" })).toThrow(ExportError);
  });

  it("exportSize: the page plus each file as base64", () => {
    expect(base64Length(0)).toBe(0);
    expect(base64Length(1)).toBe(4);
    expect(base64Length(3)).toBe(4);
    expect(base64Length(4)).toBe(8);
    expect(exportSize(1000, [])).toBe(1000);
    expect(exportSize(1000, [{ bytes: 300 }, { bytes: 1 }])).toBe(1000 + 400 + 120 + 4 + 120);
    const real = assembleExport(TEMPLATE, toFile(sampleQuiz([1])), [{ id: "m1", mime: "image/png", base64: "aGVsbG8=" }]);
    expect(Math.abs(exportSize(assembleExport(TEMPLATE, toFile(sampleQuiz([1]))).length, [{ bytes: 5 }]) - real.length)).toBeLessThan(120);
  });

  it("safeFileName gives the quiz file's name the same care as the export's", () => {
    expect(safeFileName("Pub: night?", "quiz", QUIZ_FILE_EXTENSION)).toBe("Pub night.quizzard");
    expect(safeFileName("  ..  ", "quiz", QUIZ_FILE_EXTENSION)).toBe("quiz.quizzard");
    expect(exportFileName("Pub night")).toBe("Pub night.html");
  });
});
