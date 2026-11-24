// The quiz file (SPEC F10, AC7; docs/quiz-creator/FORMAT.md): write → read gives the same quiz and
// the same bytes of every media file; anything cut, changed or over the limits is refused with its
// reason. The version-1 fixture kept in the repo (fixtures/quiz-file/v1) is opened by the creator's
// own reader in miniapp/test/quiz-file.test.ts — it needs files and Blobs, which the core has not.
import { describe, expect, it } from "vitest";
import * as core from "../src/index.ts";
import sample from "./fixtures/v1/sample.quiz.json" with { type: "json" };

// The core is checked without DOM or Node types (it uses neither); the tests need these two.
declare const TextEncoder: new () => { encode(text: string): Uint8Array };
declare const TextDecoder: new () => { decode(bytes: Uint8Array): string };

const MB = 1024 * 1024;
const text = (value: string): Uint8Array => new TextEncoder().encode(value);

/** A whole quiz file as bytes: the head and each media file after it. */
function build(file: core.QuizFile, blobs: Readonly<Record<string, Uint8Array>>): Uint8Array {
  const parts = file.media.map((entry) => ({ id: entry.id, bytes: blobs[entry.id]?.length ?? 0 }));
  const head = core.encodeQuizFileHead(file, parts);
  const all = new Uint8Array(head.length + parts.reduce((sum, part) => sum + part.bytes, 0));
  all.set(head, 0);
  let at = head.length;
  for (const part of parts) {
    all.set(blobs[part.id] ?? new Uint8Array(), at);
    at += part.bytes;
  }
  return all;
}

/** Reads a whole quiz file the way the creator does: prefix, then header, then slices. */
function read(bytes: Uint8Array, totalBytes = bytes.length): core.QuizFileRead {
  const prefix = core.readQuizFilePrefix(bytes.subarray(0, core.QUIZ_FILE_PREFIX_BYTES));
  if (!prefix.ok) return prefix;
  const start = core.QUIZ_FILE_PREFIX_BYTES;
  return core.readQuizFileHeader(bytes.subarray(start, start + prefix.headerBytes), totalBytes);
}

/** The quiz of the sample with real sizes for its three media files. */
function sized(): { file: core.QuizFile; blobs: Record<string, Uint8Array> } {
  const opened = core.open(JSON.parse(JSON.stringify(sample)));
  if (!opened.ok) throw new Error("sample");
  const blobs: Record<string, Uint8Array> = { "m-image": text("picture bytes ÿ"), "m-audio": text("audio"), "m-video": new Uint8Array([0, 255, 1, 254, 2]) };
  const media = opened.file.media.map((entry) => ({ ...entry, bytes: blobs[entry.id]?.length ?? 0 }));
  return { file: { ...opened.file, media }, blobs };
}

/** A copy of a built file whose header JSON went through `change`. */
function withHeader(bytes: Uint8Array, change: (header: Record<string, unknown>) => void): Uint8Array {
  const length = new DataView(bytes.buffer).getUint32(12, false);
  const header = JSON.parse(new TextDecoder().decode(bytes.subarray(16, 16 + length))) as Record<string, unknown>;
  change(header);
  const encoded = text(JSON.stringify(header));
  const out = new Uint8Array(16 + encoded.length + (bytes.length - 16 - length));
  out.set(bytes.subarray(0, 16), 0);
  new DataView(out.buffer).setUint32(12, encoded.length, false);
  out.set(encoded, 16);
  out.set(bytes.subarray(16 + length), 16 + encoded.length);
  return out;
}

describe("quiz file: write → read", () => {
  it("gives back the same quiz and the bytes of every file, in order", () => {
    const { file, blobs } = sized();
    const bytes = build(file, blobs);
    const result = read(bytes);
    if (!result.ok) throw new Error(result.reason);
    expect(result.file).toEqual(file);
    expect(result.slices.map((slice) => slice.id)).toEqual(["m-image", "m-audio", "m-video"]);
    for (const slice of result.slices) expect([...bytes.subarray(slice.start, slice.end)]).toEqual([...(blobs[slice.id] ?? [])]);
    expect(result.slices.at(-1)?.end).toBe(bytes.length);
    expect(result.slices.map((slice) => slice.mime)).toEqual(file.media.map((entry) => entry.mime));
  });

  it("starts with the magic, the container version and the header's length", () => {
    const { file, blobs } = sized();
    const bytes = build(file, blobs);
    expect(new TextDecoder().decode(bytes.subarray(0, 8))).toBe("QUIZZARD");
    expect([...bytes.subarray(8, 12)]).toEqual([1, 0, 0, 0]);
    const length = new DataView(bytes.buffer).getUint32(12, false);
    expect(JSON.parse(new TextDecoder().decode(bytes.subarray(16, 16 + length)))).toMatchObject({ container: 1, app: "Quizzard", file: { format: "quizzard-quiz", version: 1 }, parts: [{ id: "m-image", bytes: 16 }, { id: "m-audio", bytes: 5 }, { id: "m-video", bytes: 5 }] });
  });

  it("a quiz without media is a head alone; texts in any script survive", () => {
    const quiz = core.renameQuiz(core.createQuiz({ name: "x", language: "bg", now: "2026-11-24T00:00:00.000Z" }), "Куиз 🎉 </script> “ü”");
    const bytes = build(core.toFile(quiz), {});
    const result = read(bytes);
    expect(result).toMatchObject({ ok: true, slices: [], file: { quiz: { name: "Куиз 🎉 </script> “ü”" } } });
  });

  it("writes the real size of each file into its entry, and refuses parts that are not the quiz's files", () => {
    const { file, blobs } = sized();
    const loose = { ...file, media: file.media.map((entry) => ({ ...entry, bytes: 1 })) };
    const result = read(build(loose, blobs));
    expect(result.ok && result.file.media.map((entry) => entry.bytes)).toEqual([16, 5, 5]);
    expect(() => core.encodeQuizFileHead(file, [])).toThrow(RangeError);
    expect(() => core.encodeQuizFileHead(file, [{ id: "m-image", bytes: 1 }, { id: "m-image", bytes: 1 }, { id: "m-video", bytes: 1 }])).toThrow(RangeError);
    expect(() => core.encodeQuizFileHead(file, [{ id: "m-image", bytes: 1 }, { id: "m-audio", bytes: 1 }, { id: "other", bytes: 1 }])).toThrow(RangeError);
  });
});

describe("quiz file: what is refused", () => {
  const { file, blobs } = sized();
  const good = build(file, blobs);

  it("not a quiz file: too short, another magic, a plain JSON quiz, an HTML export", () => {
    for (const bytes of [new Uint8Array(), text("QUIZZARD"), text("PK\u0003\u0004 a zip file, 16+ bytes long"), text(JSON.stringify(sample)), text("<!doctype html><html>…</html>")]) {
      expect(read(bytes)).toEqual({ ok: false, reason: "not-a-quiz" });
    }
  });

  it("newer: a later container version, or a later quiz version inside", () => {
    const later = good.slice();
    later[8] = 2;
    expect(read(later)).toEqual({ ok: false, reason: "newer" });
    expect(read(withHeader(good, (header) => { header["container"] = 2; }))).toEqual({ ok: false, reason: "newer" });
    expect(read(withHeader(good, (header) => { (header["file"] as Record<string, unknown>)["version"] = 2; }))).toEqual({ ok: false, reason: "newer" });
  });

  it("damaged: cut off, bytes left over, a broken header, parts that do not match", () => {
    expect(read(good.subarray(0, good.length - 1))).toEqual({ ok: false, reason: "damaged" });
    expect(read(good, good.length + 3)).toEqual({ ok: false, reason: "damaged" });
    expect(read(good.subarray(0, 40), 40)).toEqual({ ok: false, reason: "damaged" });
    const zero = good.slice();
    zero[8] = 0;
    expect(read(zero)).toEqual({ ok: false, reason: "damaged" });
    const huge = good.slice();
    new DataView(huge.buffer).setUint32(12, 0xffffffff, false);
    expect(read(huge)).toEqual({ ok: false, reason: "damaged" });
    const empty = good.slice();
    new DataView(empty.buffer).setUint32(12, 0, false);
    expect(read(empty)).toEqual({ ok: false, reason: "damaged" });
    const garbled = good.slice();
    garbled[20] = 0xff; // not UTF-8 any more
    expect(read(garbled)).toEqual({ ok: false, reason: "damaged" });
    for (const change of [
      (header: Record<string, unknown>) => { header["parts"] = "none"; },
      (header: Record<string, unknown>) => { header["parts"] = []; },
      (header: Record<string, unknown>) => { header["parts"] = [{ id: "m-image", bytes: 16 }, { id: "m-image", bytes: 5 }, { id: "m-video", bytes: 5 }]; },
      (header: Record<string, unknown>) => { header["parts"] = [{ id: "m-image", bytes: 16 }, { id: "m-audio", bytes: 5 }, { id: "ghost", bytes: 5 }]; },
      (header: Record<string, unknown>) => { header["parts"] = [{ id: "m-image", bytes: 15 }, { id: "m-audio", bytes: 6 }, { id: "m-video", bytes: 5 }]; },
      (header: Record<string, unknown>) => { header["parts"] = [{ id: "m-image", bytes: -1 }, { id: "m-audio", bytes: 5 }, { id: "m-video", bytes: 5 }]; },
      (header: Record<string, unknown>) => { header["parts"] = [null, 1, "x"]; },
      (header: Record<string, unknown>) => { Reflect.deleteProperty(header, "container"); },
      (header: Record<string, unknown>) => { header["file"] = { format: "something-else" }; },
    ]) expect(read(withHeader(good, change))).toEqual({ ok: false, reason: "damaged" });
    expect(read(withHeader(good, (header) => { Reflect.deleteProperty((header["file"] as Record<string, unknown>)["quiz"] as object, "name"); }))).toEqual({ ok: false, reason: "invalid" });
  });

  it("media this version does not take: another format, a file over its limit, a quiz over the whole limit — with the entry named", () => {
    const svg = withHeader(good, (header) => { Object.assign((header["file"] as { media: object[] }).media[0] ?? {}, { mime: "image/svg+xml" }); });
    expect(read(svg)).toMatchObject({ ok: false, reason: "media-format", entry: { id: "m-image" } });
    const big = (id: string, bytes: number) => (header: Record<string, unknown>): void => {
      for (const entry of (header["file"] as { media: { id: string; bytes: number }[] }).media) if (entry.id === id) entry.bytes = bytes;
      for (const part of header["parts"] as { id: string; bytes: number }[]) if (part.id === id) part.bytes = bytes;
    };
    const tooBig = withHeader(good, big("m-audio", 15 * MB + 1));
    expect(read(tooBig, tooBig.length + 15 * MB + 1 - 5)).toMatchObject({ ok: false, reason: "media-too-big", entry: { id: "m-audio" } });
    // Six videos of 50 MB: each is allowed, together they pass the quiz's 250 MB.
    const many = withHeader(good, (header) => {
      const inner = header["file"] as { media: Record<string, unknown>[] };
      inner.media = Array.from({ length: 6 }, (_, index) => ({ id: `v${String(index)}`, type: "video", mime: "video/mp4", name: "v.mp4", bytes: 50 * MB }));
      header["parts"] = inner.media.map((entry) => ({ id: entry["id"], bytes: 50 * MB }));
    });
    const headBytes = many.length - 26;
    expect(read(many.subarray(0, headBytes), headBytes + 6 * 50 * MB)).toMatchObject({ ok: false, reason: "quiz-too-big", entry: { id: "v5" } });
  });
});

describe("isSameQuizFile", () => {
  it("is true for the same content whatever the order of the media list, false after any change", () => {
    const { file } = sized();
    expect(core.isSameQuizFile(file, JSON.parse(JSON.stringify(file)) as core.QuizFile)).toBe(true);
    expect(core.isSameQuizFile(file, { ...file, media: [...file.media].reverse() })).toBe(true);
    expect(core.isSameQuizFile(file, { ...file, quiz: core.renameQuiz(file.quiz, "Other") })).toBe(false);
    expect(core.isSameQuizFile(file, { ...file, media: file.media.slice(1) })).toBe(false);
  });
});
