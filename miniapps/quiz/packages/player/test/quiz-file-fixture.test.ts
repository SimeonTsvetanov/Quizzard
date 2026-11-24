// The version-1 quiz-file fixture kept in the repo (core/test/fixtures/quiz-file/v1; the format:
// docs/quiz-creator/FORMAT.md) must open in every later version, and this version must still write
// the same bytes for the same quiz. The test lives here because it reads files: the core is checked
// without Node types (it uses none), this package's tests have them. The creator's own reader opens
// the same file in tests/e2e/quiz-media.spec.ts.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type QuizFile, type QuizFileRead, QUIZ_FILE_PREFIX_BYTES, encodeQuizFileHead, mediaUses, readQuizFileHeader, readQuizFilePrefix } from "../../core/src/index.ts";

const FIXTURES = join(import.meta.dirname, "../../core/test/fixtures/quiz-file/v1");
const bytes = new Uint8Array(readFileSync(join(FIXTURES, "fixture-night.quizzard")));
const expected = JSON.parse(readFileSync(join(FIXTURES, "fixture-night.json"), "utf8")) as QuizFile;

function read(file: Uint8Array): QuizFileRead {
  const prefix = readQuizFilePrefix(file.subarray(0, QUIZ_FILE_PREFIX_BYTES));
  if (!prefix.ok) return prefix;
  return readQuizFileHeader(file.subarray(QUIZ_FILE_PREFIX_BYTES, QUIZ_FILE_PREFIX_BYTES + prefix.headerBytes), file.length);
}

describe("the version-1 quiz-file fixture", () => {
  it("opens: the same quiz, a host note, a picture two questions share and a sound", () => {
    const result = read(bytes);
    if (!result.ok) throw new Error(result.reason);
    expect(result.file).toEqual(expected);
    expect(result.file.quiz.rounds[0]?.questions[0]?.note).toBe("Accept “colour bars” too.");
    expect(mediaUses(result.file.quiz, "m-picture")).toBe(2);
    const [picture, sound] = result.slices;
    expect([...bytes.subarray(picture?.start, (picture?.start ?? 0) + 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // a PNG
    expect(picture && picture.end - picture.start).toBe(17202);
    expect(sound).toMatchObject({ id: "m-sound", mime: "audio/mpeg", end: bytes.length });
  });

  it("is what this version writes for the same quiz, byte for byte — the format has not drifted", () => {
    const result = read(bytes);
    if (!result.ok) throw new Error(result.reason);
    const head = encodeQuizFileHead(result.file, result.slices.map((slice) => ({ id: slice.id, bytes: slice.end - slice.start })));
    const first = result.slices[0]?.start ?? bytes.length;
    expect(head.length).toBe(first);
    expect(Buffer.from(head).equals(Buffer.from(bytes.subarray(0, first)))).toBe(true);
  });

  it("a cut copy of it is refused as damaged", () => {
    expect(read(bytes.subarray(0, bytes.length - 100))).toEqual({ ok: false, reason: "damaged" });
  });
});
