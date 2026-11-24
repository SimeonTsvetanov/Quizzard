// Media and quiz files in the creator (slices 3–5), the parts that need no browser: the files of a
// quiz in the library (stored, replaced in one step, deleted only when asked), the room check, the
// words of a refused file, the base64 pieces of an export and the quiz file written and read back
// through Blobs.
import { IDBFactory, IDBKeyRange } from "fake-indexeddb";
import { beforeEach, describe, expect, it } from "vitest";
import {
  type MediaEntry, type Quiz, addQuestion, addRound, createQuiz, createRegistries, editQuestion, extractEmbedded, readEmbeddedQuiz, sequentialIds, EXPORT_DATA_MARK,
} from "@simeonts/quizzard-quiz-core";
import { base64Pieces, bytesToBase64 } from "../src/export/encode.ts";
import { buildExport, estimateExport } from "../src/export/run.ts";
import { createTranslator } from "../src/i18n/translate.ts";
import { formatName, refusalText } from "../src/media/refusal-text.ts";
import { createMediaUrls } from "../src/media/urls.ts";
import { refusedText } from "../src/quizfile/open.ts";
import { readQuizFile } from "../src/quizfile/read.ts";
import { buildQuizFile } from "../src/quizfile/write.ts";
import { hasRoomFor, keepOnDevice } from "../src/storage/space.ts";
import { createQuizStore, type QuizStore } from "../src/storage/store.ts";

const MB = 1024 * 1024;
const registries = createRegistries();
const env = { ids: sequentialIds("q"), registries };
const bytes = (blob: Blob): Promise<number[]> => blob.arrayBuffer().then((buffer) => [...new Uint8Array(buffer)]);
const picture = new Blob([new Uint8Array([1, 2, 3, 250, 251, 252, 0])], { type: "image/png" });
const sound = new Blob([new Uint8Array(1000).map((_, index) => index % 251)], { type: "audio/mpeg" });
const MEDIA: readonly MediaEntry[] = [
  { id: "pic", type: "image", mime: "image/png", name: "cat.png", bytes: picture.size, width: 4, height: 3 },
  { id: "song", type: "audio", mime: "audio/mpeg", name: "song.mp3", bytes: sound.size, seconds: 2 },
];

/** A quiz with two questions: the first shows `pic`, the second plays `song`. */
function quizWithMedia(name = "Media night"): Quiz {
  let quiz = addRound(createQuiz({ name, language: "en", now: "2026-11-24T10:00:00.000Z" }, env), "Round 1", env);
  const roundId = quiz.rounds[0]?.id ?? "";
  quiz = addQuestion(addQuestion(quiz, roundId, { kind: "picture" }, env), roundId, { kind: "audio" }, env);
  const [first, second] = quiz.rounds[0]?.questions ?? [];
  return editQuestion(editQuestion(quiz, first?.id ?? "", { media: { id: "pic" }, note: "for the host" }), second?.id ?? "", { media: { id: "song" } });
}

describe("the media files of a quiz in the library", () => {
  let store: QuizStore;
  beforeEach(() => { store = createQuizStore({ factory: new IDBFactory(), keyRange: IDBKeyRange, env }); });

  it("stores, reads and deletes files per quiz", async () => {
    await store.putMedia("a", "pic", picture);
    await store.putMedia("a", "song", sound);
    await store.putMedia("b", "pic", sound);
    const files = await store.media("a");
    expect([...files.keys()].sort()).toEqual(["pic", "song"]);
    expect(await bytes(files.get("pic") ?? new Blob())).toEqual([1, 2, 3, 250, 251, 252, 0]);
    expect(files.get("pic")?.type).toBe("image/png");
    await store.deleteMedia("a", ["pic", "not-there"]);
    expect([...(await store.media("a")).keys()]).toEqual(["song"]);
    expect([...(await store.media("b")).keys()]).toEqual(["pic"]);
    expect((await store.media("nobody")).size).toBe(0);
  });

  it("bring writes a quiz with its files in one step and replaces what it had: twice is the same as once (AC7)", async () => {
    const quiz = quizWithMedia();
    const files = new Map([["pic", picture], ["song", sound]]);
    await store.putMedia(quiz.id, "left-over", sound);
    await store.bring({ quiz, media: MEDIA }, files);
    await store.bring({ quiz, media: MEDIA }, files);
    expect([...(await store.media(quiz.id)).keys()].sort()).toEqual(["pic", "song"]);
    const loaded = await store.get(quiz.id);
    expect(loaded).toEqual({ ok: true, quiz, media: MEDIA });
    expect((await store.list()).map((line) => line.name)).toEqual(["Media night"]);
  });

  it("deleting a quiz deletes its files; bring puts both back (Undo); a duplicate has copies of its own", async () => {
    const quiz = quizWithMedia();
    await store.bring({ quiz, media: MEDIA }, new Map([["pic", picture], ["song", sound]]));
    const copy = await store.duplicate(quiz.id, "Copy");
    const held = await store.media(quiz.id);
    await store.delete(quiz.id);
    expect((await store.media(quiz.id)).size).toBe(0);
    expect([...(await store.media(copy?.id ?? "")).keys()].sort()).toEqual(["pic", "song"]);
    await store.bring({ quiz, media: MEDIA }, held);
    expect(await bytes((await store.media(quiz.id)).get("pic") ?? new Blob())).toEqual([1, 2, 3, 250, 251, 252, 0]);
  });
});

describe("the addresses of the open quiz's files", () => {
  it("holds one quiz at a time and gives each file an address and its bytes", () => {
    const urls = createMediaUrls();
    expect(urls.quizId).toBeNull();
    urls.hold("a", new Map([["pic", picture]]));
    expect(urls.quizId).toBe("a");
    expect(urls.url("pic")).toMatch(/^blob:/);
    expect(urls.blob("pic")).toBe(picture);
    expect(urls.url("song")).toBeNull();
    urls.add("song", sound);
    expect(urls.url("song")).toMatch(/^blob:/);
    urls.hold("b", new Map());
    expect([urls.url("pic"), urls.blob("song"), urls.quizId]).toEqual([null, undefined, "b"]);
    urls.release();
    expect(urls.quizId).toBeNull();
  });
});

describe("room on the device", () => {
  const storage = (usage: number | undefined, quota: number | undefined) => ({ estimate: () => Promise.resolve({ ...(usage === undefined ? {} : { usage }), ...(quota === undefined ? {} : { quota }) }) });

  it("says no only when the browser knows there is not enough", async () => {
    expect(await hasRoomFor(10 * MB, storage(0, 100 * MB))).toBe(true);
    expect(await hasRoomFor(10 * MB, storage(95 * MB, 100 * MB))).toBe(false);
    expect(await hasRoomFor(10 * MB, storage(89 * MB, 100 * MB))).toBe(false); // the headroom
    expect(await hasRoomFor(10 * MB, storage(undefined, undefined))).toBe(true);
    expect(await hasRoomFor(10 * MB, undefined)).toBe(true);
    expect(await hasRoomFor(10 * MB, { estimate: () => Promise.reject(new Error("blocked")) })).toBe(true);
  });

  it("asks the browser to keep the storage unless it already does", async () => {
    let asked = 0;
    const persist = (): Promise<boolean> => { asked += 1; return Promise.resolve(true); };
    expect(await keepOnDevice({ ...storage(0, 1), persist, persisted: () => Promise.resolve(true) })).toBe(true);
    expect(asked).toBe(0);
    expect(await keepOnDevice({ ...storage(0, 1), persist, persisted: () => Promise.resolve(false) })).toBe(true);
    expect(asked).toBe(1);
    expect(await keepOnDevice(storage(0, 1))).toBe(false);
    expect(await keepOnDevice({ ...storage(0, 1), persist: () => Promise.reject(new Error("no")) })).toBe(false);
  });
});

describe("AC5: the message of a refused file names the file, what it is and the limit", () => {
  const t = createTranslator("en");
  const refused = (reason: Parameters<typeof refusalText>[2]["reason"], more: Partial<Parameters<typeof refusalText>[2]> = {}) => refusalText(t, "en", { reason, type: "image", name: "holiday.jpg", bytes: 16.4 * 1e6, mime: "image/jpeg", ...more }, 240 * 1e6);

  it("too big, quiz full, wrong format, unplayable, no space", () => {
    expect(refused("too-big")).toBe("“holiday.jpg” is 16.4 MB. The most for one file of this kind is 15.7 MB.");
    expect(refused("too-big", { type: "video", name: "clip.mp4" })).toContain("52.4 MB");
    expect(refused("quiz-full")).toBe("“holiday.jpg” (16.4 MB) does not fit: this quiz already has 240 MB of media and the most is 262.1 MB.");
    expect(refused("format", { name: "notes.txt", mime: "text/plain" })).toBe("“notes.txt” is a TXT file. A picture must be JPEG, PNG, WebP or GIF.");
    expect(refused("format", { type: "audio", name: "song.wav", mime: "audio/wav" })).toBe("“song.wav” is a WAV file. Audio must be MP3 or M4A (AAC).");
    expect(refused("format", { type: "video", name: "clip.mov", mime: "video/quicktime" })).toBe("“clip.mov” is a MOV file. A video must be MP4 with H.264 picture and AAC sound.");
    expect(refused("format", { name: "IMG_0001.HEIC", mime: "image/heic" })).toContain("HEIC photo");
    expect(refused("format", { name: "strange", mime: "" })).toBe("“strange” is not a file that can be used here. A picture must be JPEG, PNG, WebP or GIF.");
    expect(refused("unplayable", { type: "video", name: "clip.mp4" })).toBe("“clip.mp4” cannot be opened in this browser. A video must be MP4 with H.264 picture and AAC sound.");
    expect(refused("no-space")).toContain("not enough free space on this device for “holiday.jpg” (16.4 MB)");
  });

  it("in Bulgarian too, and the format's name comes from the ending or the type", () => {
    expect(refusalText(createTranslator("bg"), "bg", { reason: "too-big", type: "image", name: "море.jpg", bytes: 16.4 * 1e6, mime: "image/jpeg" }, 0)).toBe("„море.jpg“ е 16,4 MB. Най-много за един файл от този вид е 15,7 MB.");
    expect([formatName("a.JPeG", ""), formatName("noending", "audio/x-wav"), formatName("noending", ""), formatName("archive.tar.gz", "")]).toEqual(["JPEG", "WAV", "", "GZ"]);
  });

  it("a quiz file's refusals name the file too", () => {
    const app = { t, lang: "en" as const };
    expect(refusedText(app, "x.html", { ok: false, reason: "not-a-quiz" })).toContain("“x.html” is not a Quizzard quiz file");
    expect(refusedText(app, "x.quizzard", { ok: false, reason: "newer" })).toContain("newer Quizzard");
    expect(refusedText(app, "x.quizzard", { ok: false, reason: "damaged" })).toBe(refusedText(app, "x.quizzard", { ok: false, reason: "invalid" }));
    expect(refusedText(app, "x.quizzard", { ok: false, reason: "media-too-big", entry: { ...MEDIA[1], id: "s", type: "audio", mime: "audio/mpeg", name: "long.mp3", bytes: 1 } })).toBe("“x.quizzard” cannot be opened: its file “long.mp3” is over the limit of 15.7 MB.");
    expect(refusedText(app, "x.quizzard", { ok: false, reason: "media-format", entry: { id: "s", type: "image", mime: "image/svg+xml", name: "logo.svg", bytes: 1 } })).toContain("“logo.svg”");
    expect(refusedText(app, "x.quizzard", { ok: false, reason: "quiz-too-big" })).toContain("262.1 MB");
  });
});

describe("the export's base64 pieces", () => {
  it("bytesToBase64 is base64", () => {
    expect(bytesToBase64(new Uint8Array())).toBe("");
    expect(bytesToBase64(new TextEncoder().encode("hello"))).toBe("aGVsbG8=");
    const big = new Uint8Array(100_000).map((_, index) => (index * 7) % 256);
    expect(bytesToBase64(big)).toBe(Buffer.from(big).toString("base64"));
  });

  it("the pieces of a file joined are the base64 of the whole file, whatever the slice size", async () => {
    const all = Buffer.from(await sound.arrayBuffer()).toString("base64");
    for (const chunk of [3, 300, 999, 3000]) {
      const pieces: string[] = [];
      for await (const piece of base64Pieces(sound, chunk)) pieces.push(piece);
      expect(pieces.join("")).toBe(all);
      expect(pieces).toHaveLength(Math.ceil(sound.size / chunk));
    }
  });

  it("buildExport writes the quiz and every file into the page and reports its progress", async () => {
    const template = `<!doctype html><title>t</title>${EXPORT_DATA_MARK}<script>run()</script>`;
    const quiz = quizWithMedia();
    const files = new Map([["pic", picture], ["song", sound]]);
    const progress: number[] = [];
    const page = await buildExport(template, quiz, MEDIA, { blobOf: (id) => files.get(id), onProgress: (share) => progress.push(share) });
    const html = await page.text();
    expect(page.type).toBe("text/html");
    const embedded = extractEmbedded(html);
    expect(readEmbeddedQuiz(embedded.quiz ?? "")?.quiz).toEqual(quiz);
    expect(embedded.media.map((entry) => [entry.id, entry.mime])).toEqual([["pic", "image/png"], ["song", "audio/mpeg"]]);
    expect([...Buffer.from(embedded.media[0]?.base64 ?? "", "base64")]).toEqual([1, 2, 3, 250, 251, 252, 0]);
    expect(Buffer.from(embedded.media[1]?.base64 ?? "", "base64").equals(Buffer.from(await sound.arrayBuffer()))).toBe(true);
    expect(progress.at(-1)).toBe(1);
    expect(Math.abs(estimateExport(template.length, quiz, MEDIA) - page.size)).toBeLessThan(400);
    await expect(buildExport(template, quiz, MEDIA, { blobOf: () => undefined })).rejects.toThrow(/not on this device/);
  });
});

describe("AC7: the quiz file written and read back through Blobs", () => {
  const files = new Map([["pic", picture], ["song", sound]]);

  it("gives the same quiz, host note included, and the same bytes of every file", async () => {
    const quiz = quizWithMedia("Pub: night?");
    const file = buildQuizFile(quiz, [...MEDIA, { id: "unused", type: "image", mime: "image/png", name: "old.png", bytes: 9 }], (id) => files.get(id), "quiz");
    expect(file?.name).toBe("Pub night.quizzard");
    expect(file?.type).toBe("application/x-quizzard");
    const read = await readQuizFile(file ?? new Blob(), registries);
    if (!read.ok) throw new Error(read.reason);
    expect(read.stored).toEqual({ quiz, media: MEDIA });
    expect(read.stored.quiz.rounds[0]?.questions[0]?.note).toBe("for the host");
    expect(read.mediaBytes).toBe(picture.size + sound.size);
    expect(read.files.get("pic")?.type).toBe("image/png");
    expect(await bytes(read.files.get("pic") ?? new Blob())).toEqual(await bytes(picture));
    expect(await bytes(read.files.get("song") ?? new Blob())).toEqual(await bytes(sound));
  });

  it("is not built when a file of the quiz is missing; a cut or foreign file is refused", async () => {
    const quiz = quizWithMedia();
    expect(buildQuizFile(quiz, MEDIA, (id) => (id === "pic" ? picture : undefined), "quiz")).toBeNull();
    const file = buildQuizFile(quiz, MEDIA, (id) => files.get(id), "quiz") ?? new Blob();
    expect(await readQuizFile(file.slice(0, file.size - 10), registries)).toEqual({ ok: false, reason: "damaged" });
    expect(await readQuizFile(file.slice(0, 40), registries)).toEqual({ ok: false, reason: "damaged" });
    expect(await readQuizFile(new Blob(["<!doctype html><html></html>"]), registries)).toEqual({ ok: false, reason: "not-a-quiz" });
    expect(await readQuizFile(new Blob([]), registries)).toEqual({ ok: false, reason: "not-a-quiz" });
  });
});
