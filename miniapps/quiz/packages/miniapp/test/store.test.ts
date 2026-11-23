// The quiz library over IndexedDB (Q-02), on fake-indexeddb: every test gets a database of its own.
import { IDBFactory, IDBKeyRange } from "fake-indexeddb";
import { beforeEach, describe, expect, it } from "vitest";
import { QUIZ_FORMAT, QUIZ_VERSION, addQuestion, addRound, createQuiz, createRegistries, editQuestion, sequentialIds, toFile, type Env, type Quiz } from "@simeonts/quizzard-quiz-core";
import { DB_NAME, MEDIA, QUIZZES, finished, openDb, promised } from "../src/storage/db.ts";
import { createQuizStore, type QuizStore } from "../src/storage/store.ts";

const CREATED = "2026-11-23T10:00:00.000Z";

let factory: IDBFactory;
let env: Env;
let clock: string[];
let store: QuizStore;

/** A quiz with one round and `questions` text questions. */
function quizWith(name: string, questions: number): Quiz {
  let quiz = addRound(createQuiz({ name, language: "en", now: CREATED }, env), "Round 1", env);
  const roundId = quiz.rounds[0]?.id ?? "";
  for (let n = 0; n < questions; n += 1) quiz = addQuestion(quiz, roundId, {}, env);
  return quiz;
}

/** Writes a raw record or a media blob straight into a store, past the library's API. */
async function putRaw(storeName: string, value: unknown): Promise<void> {
  const database = await openDb(factory);
  const transaction = database.transaction(storeName, "readwrite");
  transaction.objectStore(storeName).put(value);
  await finished(transaction);
  database.close();
}

async function allOf(storeName: string): Promise<unknown[]> {
  const database = await openDb(factory);
  const all = await promised<unknown[]>(database.transaction(storeName).objectStore(storeName).getAll());
  database.close();
  return all;
}

beforeEach(() => {
  factory = new IDBFactory();
  env = { ids: sequentialIds("q"), registries: createRegistries() };
  clock = ["2026-11-23T11:00:00.000Z", "2026-11-23T12:00:00.000Z", "2026-11-23T13:00:00.000Z"];
  store = createQuizStore({ factory, keyRange: IDBKeyRange, env, now: () => clock.shift() ?? "2026-11-23T23:00:00.000Z" });
});

describe("the database", () => {
  it("is the area's database with the stores `quizzes` and `media`", async () => {
    const database = await openDb(factory);
    expect(database.name).toBe(DB_NAME);
    expect(DB_NAME).toBe("quizzard-quiz");
    expect([...database.objectStoreNames]).toEqual([MEDIA, QUIZZES]);
    database.close();
  });
});

describe("put and get", () => {
  it("stores a quiz as its versioned quiz file and stamps the time of the change", async () => {
    const quiz = quizWith("Pub night", 2);
    const stored = await store.put(quiz);
    expect(stored.updatedAt).toBe("2026-11-23T11:00:00.000Z");
    expect(stored.createdAt).toBe(CREATED);
    const [record] = await allOf(QUIZZES);
    expect(record).toMatchObject({ format: QUIZ_FORMAT, version: QUIZ_VERSION, media: [], quiz: { id: quiz.id, name: "Pub night" } });
    const loaded = await store.get(quiz.id);
    expect(loaded).toEqual({ ok: true, quiz: stored, media: [] });
  });

  it("a second put replaces the first: one record per quiz", async () => {
    const quiz = quizWith("Pub night", 1);
    await store.put(quiz);
    const questionId = quiz.rounds[0]?.questions[0]?.id ?? "";
    await store.put(editQuestion(quiz, questionId, { prompt: "Capital of France?" }));
    expect(await allOf(QUIZZES)).toHaveLength(1);
    const loaded = await store.get(quiz.id);
    expect(loaded.ok && loaded.quiz.rounds[0]?.questions[0]?.prompt).toBe("Capital of France?");
    expect(loaded.ok && loaded.quiz.updatedAt).toBe("2026-11-23T12:00:00.000Z");
  });

  it("an id that is not stored is `missing`", async () => {
    expect(await store.get("nope")).toEqual({ ok: false, reason: "missing" });
  });

  it("reads only through core open(): a quiz from a newer Quizzard is refused, a damaged record is invalid", async () => {
    await putRaw(QUIZZES, { ...toFile(quizWith("Future", 0)), version: QUIZ_VERSION + 1 });
    await putRaw(QUIZZES, { format: QUIZ_FORMAT, version: 1, quiz: { id: "broken", name: "Broken" }, media: [] });
    expect(await store.get("q1")).toEqual({ ok: false, reason: "newer" });
    expect(await store.get("broken")).toEqual({ ok: false, reason: "invalid" });
  });

  it("keeps a question of an unknown kind untouched through get → put (SPEC §3.3)", async () => {
    const quiz = quizWith("Mixed", 1);
    const round = quiz.rounds[0];
    const alien = { id: "alien", kind: "golden-pyramid", prompt: "?", answer: { type: "ladder", steps: [1, 2, 3] }, data: { tiers: 4 } };
    await putRaw(QUIZZES, toFile({ ...quiz, rounds: round ? [{ ...round, questions: [...round.questions, alien] }] : [] }));
    const loaded = await store.get(quiz.id);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    await store.put(loaded.quiz, loaded.media);
    const again = await store.get(quiz.id);
    expect(again.ok && again.quiz.rounds[0]?.questions[1]).toEqual(alien);
  });
});

describe("list", () => {
  it("is empty at first", async () => {
    expect(await store.list()).toEqual([]);
  });

  it("gives id, name, counts, play time, last change and size — last changed first", async () => {
    const first = await store.put(quizWith("First", 3));
    const second = await store.put(quizWith("Second", 0));
    const lines = await store.list();
    expect(lines.map((line) => line.name)).toEqual(["Second", "First"]);
    expect(lines[1]).toMatchObject({ id: first.id, name: "First", rounds: 1, questions: 3, seconds: 90, updatedAt: "2026-11-23T11:00:00.000Z" });
    expect(lines[0]).toMatchObject({ id: second.id, rounds: 1, questions: 0, seconds: 0 });
    expect(lines[1]?.bytes).toBe(new TextEncoder().encode(JSON.stringify(toFile(first))).length);
    expect(lines[1]?.bytes).toBeGreaterThan(lines[0]?.bytes ?? Infinity);
  });

  it("adds the size of the media files to the quiz data", async () => {
    const quiz = quizWith("With a picture", 1);
    const media = [{ id: "m1", type: "image" as const, mime: "image/png", name: "cat.png", bytes: 5000 }];
    const stored = await store.put(quiz, media);
    const [line] = await store.list();
    expect(line?.bytes).toBe(new TextEncoder().encode(JSON.stringify(toFile(stored, media))).length + 5000);
  });

  it("never drops a quiz it cannot open: it is listed with the reason", async () => {
    await putRaw(QUIZZES, { ...toFile(quizWith("From the future", 2)), version: QUIZ_VERSION + 1 });
    const [line] = await store.list();
    expect(line).toMatchObject({ id: "q1", name: "From the future", problem: "newer", rounds: 0, questions: 0 });
  });
});

describe("delete, restore, duplicate", () => {
  it("delete removes the quiz and only its media files", async () => {
    const mine = await store.put(quizWith("Mine", 1));
    const other = await store.put(quizWith("Other", 1));
    await putRaw(MEDIA, { quizId: mine.id, id: "m1", blob: "bytes-1" });
    await putRaw(MEDIA, { quizId: other.id, id: "m1", blob: "bytes-2" });
    await store.delete(mine.id);
    expect((await store.list()).map((line) => line.name)).toEqual(["Other"]);
    expect(await allOf(MEDIA)).toEqual([{ quizId: other.id, id: "m1", blob: "bytes-2" }]);
    expect(await store.get(mine.id)).toEqual({ ok: false, reason: "missing" });
  });

  it("restore writes a deleted quiz back exactly as it was (Undo): no new time", async () => {
    const stored = await store.put(quizWith("Pub night", 2));
    const before = await store.get(stored.id);
    await store.delete(stored.id);
    if (before.ok) await store.restore(before);
    expect(await store.get(stored.id)).toEqual(before);
  });

  it("duplicate makes a second quiz with new ids, the given name, the same content and copies of its files", async () => {
    const original = await store.put(quizWith("Pub night", 2));
    await putRaw(MEDIA, { quizId: original.id, id: "m1", blob: "bytes" });
    const copy = await store.duplicate(original.id, "Pub night (copy)");
    expect(copy?.name).toBe("Pub night (copy)");
    expect(copy?.id).not.toBe(original.id);
    expect(copy?.createdAt).toBe("2026-11-23T12:00:00.000Z");
    const copiedIds = copy?.rounds.flatMap((round) => [round.id, ...round.questions.map((question) => question.id)]) ?? [];
    const originalIds = original.rounds.flatMap((round) => [round.id, ...round.questions.map((question) => question.id)]);
    expect(copiedIds).toHaveLength(3);
    expect(copiedIds.some((id) => originalIds.includes(id))).toBe(false);
    expect((await store.list()).map((line) => [line.name, line.questions])).toEqual([["Pub night (copy)", 2], ["Pub night", 2]]);
    expect(await allOf(MEDIA)).toHaveLength(2);
  });

  it("duplicate of a quiz that is not there does nothing", async () => {
    expect(await store.duplicate("nope", "Copy")).toBeUndefined();
    expect(await store.list()).toEqual([]);
  });
});

describe("close", () => {
  it("lets the database go, so the shell can delete it; the next call opens it again", async () => {
    const stored = await store.put(quizWith("Pub night", 0));
    store.close();
    await promised(factory.deleteDatabase(DB_NAME));
    expect(await store.list()).toEqual([]);
    expect(await store.get(stored.id)).toEqual({ ok: false, reason: "missing" });
  });

  it("gives way to a delete even while it is open (versionchange)", async () => {
    await store.put(quizWith("Pub night", 0));
    await promised(factory.deleteDatabase(DB_NAME));
    expect(await store.list()).toEqual([]);
  });
});
