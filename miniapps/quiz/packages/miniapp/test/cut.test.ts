// @vitest-environment jsdom
// When a picked clip must be cut before a quiz takes it (media/cut/can-cut.ts): only where the
// browser can re-encode, only a clip of the wanted type, and only when it is too big or in a format
// a quiz does not carry (Moni 2026-11-25: the limits check the result, not the file picked).
import { afterEach, describe, expect, it, vi } from "vitest";
import { CUT_SOURCE_MAX_BYTES, canCut, mustCut } from "../src/media/cut/can-cut.ts";
import { PICTURE_SOURCE_MAX_BYTES, importMedia } from "../src/media/import.ts";

const MB = 1024 * 1024;
const file = (name: string, type: string, size: number) => ({ name, type, size });

/** Stands for a browser's encoder: only its being a function is asked. */
const encoder = (): undefined => undefined;

function withEncoders(): void {
  vi.stubGlobal("AudioEncoder", encoder);
  vi.stubGlobal("VideoEncoder", encoder);
}

afterEach(() => { vi.unstubAllGlobals(); });

describe("cutting a picked clip", () => {
  it("is offered only where the browser can encode, and never for a picture", () => {
    expect(canCut("video")).toBe(false);
    expect(mustCut("video", file("long.mp4", "video/mp4", 126 * MB), "video/mp4")).toBe(false);
    withEncoders();
    expect(canCut("video")).toBe(true);
    expect(canCut("audio")).toBe(true);
    expect(canCut("image")).toBe(false);
  });

  it("a browser that encodes sound but not pictures cuts audio only", () => {
    vi.stubGlobal("AudioEncoder", encoder);
    expect(canCut("audio")).toBe(true);
    expect(canCut("video")).toBe(false);
  });

  it("a clip over its limit must be cut; one that fits needs nothing", () => {
    withEncoders();
    expect(mustCut("video", file("long.mp4", "video/mp4", 126 * MB), "video/mp4")).toBe(true);
    expect(mustCut("video", file("short.mp4", "video/mp4", 50 * MB), "video/mp4")).toBe(false);
    expect(mustCut("audio", file("book.mp3", "audio/mpeg", 31.5 * MB), "audio/mpeg")).toBe(true);
    expect(mustCut("audio", file("song.mp3", "audio/mpeg", 3 * MB), "audio/mpeg")).toBe(false);
  });

  it("a clip in a format a quiz does not carry must be cut, whatever its size (a phone's .mov, a .wav)", () => {
    withEncoders();
    expect(mustCut("video", file("IMG_0001.MOV", "video/quicktime", 8 * MB), "video/quicktime")).toBe(true);
    expect(mustCut("video", file("clip.webm", "", MB), "")).toBe(true);
    expect(mustCut("audio", file("take.wav", "audio/wav", 2 * MB), "audio/wav")).toBe(true);
  });

  it("a file of another kind, or one past what can be read at all, is left to the usual refusal", () => {
    withEncoders();
    expect(mustCut("video", file("notes.pdf", "application/pdf", MB), "application/pdf")).toBe(false);
    expect(mustCut("video", file("song.mp3", "audio/mpeg", MB), "audio/mpeg")).toBe(false);
    expect(mustCut("audio", file("film.mp4", "video/mp4", MB), "video/mp4")).toBe(false);
    expect(mustCut("video", file("film.mp4", "video/mp4", CUT_SOURCE_MAX_BYTES + 1), "video/mp4")).toBe(false);
  });
});

describe("a picture bigger than its limit", () => {
  const sized = (bytes: number): File => {
    const picture = new File(["x"], "photo.jpg", { type: "image/jpeg" });
    Object.defineProperty(picture, "size", { value: bytes });
    return picture;
  };
  const options = { type: "image" as const, usedBytes: 0, id: "m1", hasRoomFor: () => Promise.resolve(true) };

  it("is refused unread only past the ceiling for a picture to be scaled down (60 MB)", async () => {
    expect(await importMedia(sized(PICTURE_SOURCE_MAX_BYTES + 1), options)).toMatchObject({ ok: false, reason: "too-big" });
  });

  // Up to that ceiling a picture is opened to be scaled down: tests/e2e/quiz-media.spec.ts (AC4) picks one of 16 MB.

  it("the quiz's own room still counts", async () => {
    expect(await importMedia(sized(16 * MB), { ...options, usedBytes: 240 * MB })).toMatchObject({ ok: false, reason: "quiz-full" });
  });
});
