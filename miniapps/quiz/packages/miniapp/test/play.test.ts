// Slice 2 in the creator: the Play screen in the history, the game kept per quiz in the mini-app's
// storage area, and the creator's kind and answer entries built on the player's slide parts.
import { describe, expect, it } from "vitest";
import { answerSlides, audioKindSlide, kindSlides, textKindSlide } from "@simeonts/quizzard-quiz-player/render";
import { answerUis } from "../src/answers-ui/index.ts";
import { returnFocus, settle } from "../src/app/mount.ts";
import { AUDIENCE_PARAM, ROUTE_KEY, readRoute, type Route } from "../src/app/routes.ts";
import type { MiniAppContext } from "../src/contract.ts";
import { kindUis } from "../src/kinds-ui/index.ts";
import { meta } from "../src/meta.ts";
import { gameKey, gameStorage, takeGame } from "../src/storage/game.ts";
import { answerUi, kindUi } from "../src/ui-registry.ts";

/** The host's preferences over a plain map, as the shell gives them: keys relative to the area. */
function fakePrefs(): { prefs: MiniAppContext["storage"]["prefs"]; data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    prefs: {
      get: <T>(key: string, fallback: T): T => (data.has(key) ? (JSON.parse(data.get(key) ?? "null") as T) : fallback),
      set: (key, value) => {
        data.set(key, JSON.stringify(value));
        return true;
      },
      remove: (key) => { data.delete(key); },
    },
  };
}

describe("the Play screen's route", () => {
  it("is a history entry of the quiz like the other screens", () => {
    const route: Route = { screen: "play", quiz: "q1" };
    expect(readRoute({ [ROUTE_KEY]: route })).toEqual(route);
    expect(readRoute({ [ROUTE_KEY]: { screen: "play" } })).toEqual({ screen: "library" });
  });

  it("needs nothing but its quiz, so it is never settled to another screen", () => {
    const route: Route = { screen: "play", quiz: "q1" };
    expect(settle(route, { id: "q1", name: "", createdAt: "", updatedAt: "", language: "en", rounds: [], settings: { teams: 4 } })).toBe(route);
  });

  it("leaving it puts the focus back on the Play button", () => {
    expect(returnFocus({ screen: "play", quiz: "q1" }, { screen: "quiz", quiz: "q1" })).toBe('[data-focus="play"]');
    expect(returnFocus({ screen: "play", quiz: "q1" }, { screen: "round", quiz: "q1", round: "r1" })).toBe('[data-focus="play"]');
    expect(returnFocus({ screen: "play", quiz: "q1" }, { screen: "library" })).toBe('[data-focus="quiz:q1"]');
  });

  it("the audience window's launch parameter is the one the shell lets through (app registry)", () => {
    expect(AUDIENCE_PARAM).toBe("audience");
  });
});

describe("the game of a quiz in the app", () => {
  it("is one value per quiz inside the mini-app's own storage area", () => {
    const { prefs, data } = fakePrefs();
    const storage = gameStorage(prefs, "quiz-1");
    expect(storage.load()).toBeNull();
    storage.save({ v: 1, index: 4 });
    gameStorage(prefs, "quiz-2").save({ v: 1, index: 9 });
    expect(storage.load()).toEqual({ v: 1, index: 4 });
    expect([...data.keys()]).toEqual(["game.quiz-1", "game.quiz-2"]);
    // Relative keys: the shell puts the area's prefix in front, so Settings counts and clears them.
    expect(meta.storage.prefix).toBe("quizzard-quiz:v1:");
  });

  it("goes with its quiz when the quiz is deleted, and comes back with Undo", () => {
    const { prefs, data } = fakePrefs();
    gameStorage(prefs, "quiz-1").save({ v: 1, index: 4 });
    const taken = takeGame(prefs, "quiz-1");
    expect(data.size).toBe(0);
    taken.putBack();
    expect(gameStorage(prefs, "quiz-1").load()).toEqual({ v: 1, index: 4 });
    const none = takeGame(prefs, "quiz-2"); // a quiz that was never played
    none.putBack();
    expect([...data.keys()]).toEqual(["game.quiz-1"]);
  });

  it("its key is always one the host accepts (letters, digits, inner - _ . and at most 64): a UUID as it is, anything else hashed", () => {
    const hostAccepts = (key: string): boolean => key.length <= 64 && /^[A-Za-z0-9]([A-Za-z0-9._-]*[A-Za-z0-9])?$/.test(key);
    const uuid = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b";
    expect(gameKey(uuid)).toBe(`game.${uuid}`);
    const odd = ["", "a b", "quiz:1", "../x", "ключ", "x".repeat(200), "-start", "end-", "a/b"];
    for (const id of [uuid, "q", ...odd]) expect(hostAccepts(gameKey(id)), id).toBe(true);
    expect(new Set(odd.map(gameKey)).size).toBe(odd.length);
    expect(gameKey("a b")).toBe(gameKey("a b"));
  });
});

describe("creator entries on the player's slide parts", () => {
  it("every kind and answer type draws its slide with the player's own part — one renderer for thumbnail, preview and play", () => {
    const text = kindUis.find((entry) => entry.id === "text");
    expect(text?.parts?.slide).toBe(textKindSlide.parts?.slide);
    expect(text?.tone).toBe(textKindSlide.tone);
    const slides = new Map(answerSlides.map((entry) => [entry.id, entry.parts?.slide]));
    expect(answerUis.map((entry) => entry.id)).toEqual(answerSlides.map((entry) => entry.id));
    for (const entry of answerUis) expect(entry.parts?.slide).toBe(slides.get(entry.id));
    expect(kindUis.map((entry) => entry.id)).toEqual(kindSlides.map((entry) => entry.id));
  });

  it("a kind is usable only when the slide can draw it AND the creator has its editor", () => {
    const face = { label: "kind.audio", icon: "audio" } as const;
    const editor = (): null => null;
    const undrawn = { id: audioKindSlide.id, tone: audioKindSlide.tone }; // a kind the slide knows by name only
    expect(kindUi(undrawn, face).parts).toBeUndefined(); // neither yet
    expect(kindUi(undrawn, face, editor).parts).toBeUndefined(); // an editor, but nothing draws it
    expect(kindUi(textKindSlide, face).parts).toBeUndefined(); // drawn, but no editor
    expect(kindUi(audioKindSlide, face).parts).toBeUndefined(); // the audio clip is drawn; without an editor it is still "soon"
    const ready = kindUi({ ...undrawn, parts: { slide: () => null } }, face, editor);
    expect(ready.parts?.editor).toBe(editor);
    expect(ready).toMatchObject({ id: "audio", tone: "audio", label: "kind.audio", icon: "audio" });
  });

  it("an answer type without a slide part is listed without parts", () => {
    const made = answerUi({ id: "closest" }, { label: "answer.open", icon: "open" }, () => document.createElement("div"));
    expect(made.parts).toBeUndefined();
    expect(made.id).toBe("closest");
  });
});

describe("Help names the player's own buttons as the player shows them", () => {
  it("in both languages", async () => {
    const { help } = await import("../src/help.ts");
    const player = { en: (await import("../../player/src/i18n/en.ts")).en, bg: (await import("../../player/src/i18n/bg.ts")).bg };
    for (const label of [player.en.control.audience, player.en.control.scores, player.en.menu.restart]) expect(JSON.stringify(help.en)).toContain(`“${label}”`);
    for (const label of [player.bg.control.audience, player.bg.control.scores, player.bg.menu.restart]) expect(JSON.stringify(help.bg)).toContain(`„${label}“`);
  });
});
