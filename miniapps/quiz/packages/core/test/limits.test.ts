import { describe, expect, it } from "vitest";
import * as core from "../src/index.ts";

const MB = 1024 * 1024;

describe("limits (SPEC §5)", () => {
  it("has the numbers of the SPEC", () => {
    expect(core.PICTURE_MAX_BYTES).toBe(15 * MB);
    expect(core.AUDIO_MAX_BYTES).toBe(15 * MB);
    expect(core.VIDEO_MAX_BYTES).toBe(50 * MB);
    expect(core.QUIZ_MEDIA_MAX_BYTES).toBe(250 * MB);
    expect(core.EXPORT_WARN_BYTES).toBe(100 * MB);
    expect(core.PICTURE_MAX_EDGE_PX).toBe(1920);
    expect([core.MIN_OPTIONS, core.MAX_OPTIONS]).toEqual([2, 8]);
    expect([core.MIN_TEAMS, core.MAX_TEAMS, core.DEFAULT_TEAMS]).toEqual([2, 12, 4]);
  });

  it("accepts exactly the formats of the SPEC", () => {
    expect(core.MEDIA_RULES.image.mimes).toEqual(["image/jpeg", "image/png", "image/webp", "image/gif"]);
    expect(core.MEDIA_RULES.audio.mimes).toEqual(["audio/mpeg", "audio/mp4", "audio/x-m4a"]);
    expect(core.MEDIA_RULES.video.mimes).toEqual(["video/mp4"]);
  });
});

describe("checkMedia", () => {
  it("accepts a file of an allowed format within the limit", () => {
    expect(core.checkMedia({ type: "image", mime: "IMAGE/JPEG", bytes: 15 * MB })).toEqual({ ok: true });
    expect(core.checkMedia({ type: "video", mime: "video/mp4", bytes: 50 * MB })).toEqual({ ok: true });
  });

  it("refuses another format and names the rule", () => {
    for (const mime of ["image/heic", "image/svg+xml"]) {
      expect(core.checkMedia({ type: "image", mime, bytes: 10 })).toEqual({ ok: false, reason: "format", rule: core.MEDIA_RULES.image });
    }
    expect(core.checkMedia({ type: "audio", mime: "audio/wav", bytes: 10 })).toMatchObject({ ok: false, reason: "format" });
    expect(core.checkMedia({ type: "video", mime: "video/webm", bytes: 10 })).toMatchObject({ ok: false, reason: "format" });
  });

  it("refuses a file over its limit", () => {
    expect(core.checkMedia({ type: "audio", mime: "audio/mpeg", bytes: 15 * MB + 1 })).toEqual({ ok: false, reason: "too-big", rule: core.MEDIA_RULES.audio });
  });

  it("refuses a file that would take the quiz over 250 MB", () => {
    expect(core.checkMedia({ type: "video", mime: "video/mp4", bytes: 10 * MB }, 240 * MB)).toEqual({ ok: true });
    expect(core.checkMedia({ type: "video", mime: "video/mp4", bytes: 10 * MB }, 240 * MB + 1)).toMatchObject({ ok: false, reason: "quiz-full" });
  });
});

describe("clamp and cut", () => {
  it("clamp keeps a number in range and turns a non-number into the minimum", () => {
    expect(core.clamp(5, 1, 10)).toBe(5);
    expect(core.clamp(-5, 1, 10)).toBe(1);
    expect(core.clamp(50, 1, 10)).toBe(10);
    expect(core.clamp(Number.NaN, 1, 10)).toBe(1);
    expect(core.clamp(Number.POSITIVE_INFINITY, 1, 10)).toBe(1);
  });

  it("cut counts characters, not UTF-16 units", () => {
    expect(core.cut("abc", 5)).toBe("abc");
    expect(core.cut("Здравей", 3)).toBe("Здр");
    expect(core.cut("🎵🎵🎵", 2)).toBe("🎵🎵");
    expect(core.cut("👨‍👩‍👧‍👦👨‍👩‍👧‍👦", 1)).toBe("👨‍👩‍👧‍👦");
  });
});

describe("AC3: points are a number, a note, or both", () => {
  it("a number alone", () => {
    expect(core.makePoints(2)).toEqual({ value: 2 });
  });

  it("a note alone has the value 0", () => {
    expect(core.makePoints(undefined, "1 for the band, 2 with the song")).toEqual({ value: 0, note: "1 for the band, 2 with the song" });
  });

  it("both, the note trimmed; an empty note is left out", () => {
    expect(core.makePoints(1.5, "  half each ")).toEqual({ value: 1.5, note: "half each" });
    expect(core.makePoints(1, "   ")).toEqual({ value: 1 });
    expect("note" in core.makePoints(1, "")).toBe(false);
  });

  it("a negative or broken number becomes 0", () => {
    expect(core.makePoints(-3)).toEqual({ value: 0 });
    expect(core.makePoints(Number.NaN, "x")).toEqual({ value: 0, note: "x" });
  });

  it("samePoints compares the number and the note", () => {
    expect(core.samePoints({ value: 1 }, { value: 1 })).toBe(true);
    expect(core.samePoints({ value: 1 }, { value: 1, note: "" })).toBe(true);
    expect(core.samePoints({ value: 1 }, { value: 2 })).toBe(false);
    expect(core.samePoints({ value: 1, note: "a" }, { value: 1 })).toBe(false);
  });

  it("the schema accepts all three shapes and refuses a negative value", () => {
    for (const points of [{ value: 2 }, { value: 0, note: "note only" }, { value: 1, note: "both" }]) {
      expect(core.pointsSchema.safeParse(points).success).toBe(true);
    }
    expect(core.pointsSchema.safeParse({ value: -1 }).success).toBe(false);
    expect(core.pointsSchema.safeParse({ note: "no value" }).success).toBe(false);
  });
});
