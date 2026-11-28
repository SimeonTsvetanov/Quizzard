// What the AI jobs (ai/jobs.ts, ai/check.ts) share when they take an assistant's answer: reading the pasted
// text, fetching the pictures it names, the rules text of special rounds, a free quiz name, and keeping the
// fetched files. A job that is stopped (its window closed) changes nothing.
import type { MediaEntry, Round } from "@simeonts/quizzard-quiz-core";
import { type DraftIssue, type PendingPicture, readPasted } from "@simeonts/quizzard-quiz-core/draft";
import type { App } from "../../app/state.ts";
import { givenRules } from "../round-rules.ts";
import { fetchPictures } from "./pictures.ts";
import type { AiWindow } from "./window.ts";

/** Fetched pictures: their descriptions, their files and the names Commons does not have. */
export interface Fetched {
  readonly entries: readonly MediaEntry[];
  readonly files: ReadonlyMap<string, Blob>;
  readonly issues: readonly DraftIssue[];
}

/** The words for what a draft leaves out. */
export function draftOptions(app: App): { now: string; language: string; quizName: string; roundName: (n: number) => string } {
  return { now: new Date().toISOString(), language: app.lang, quizName: app.t("library.newName"), roundName: (n) => app.t("round.defaultName", { n }) };
}

/** Reads the pasted text as a draft; says why not when it cannot. */
export function pasted(app: App, window: AiWindow): Readonly<Record<string, unknown>> | undefined {
  const read = readPasted(window.field.value);
  if (read.ok) return read.draft;
  const words = { empty: "ai.empty", "no-json": "ai.noJson", broken: "ai.broken", "too-long": "ai.tooLong" } as const;
  window.say(app.t(words[read.reason]), true);
  window.field.focus();
  return undefined;
}

/** Fetches the pictures a draft named; `undefined` when it could not (the window says why) or the window was closed. */
export async function pictures(app: App, window: AiWindow, list: readonly PendingPicture[], usedBytes: number): Promise<Fetched | undefined> {
  if (list.length === 0) return { entries: [], files: new Map(), issues: [] };
  const outcome = await fetchPictures(list, usedBytes, window.signal, (done, count) => { window.say(app.t("ai.picturesLoading", { done, count })); });
  if (window.signal.aborted) return undefined;
  if (outcome.ok) {
    window.say("");
    return outcome;
  }
  if (outcome.reason === "stopped") return undefined;
  const words = { offline: "ai.picturesOffline", busy: "ai.picturesBusy", space: "notSaved" } as const;
  window.say(app.t(words[outcome.reason]), true);
  return undefined;
}

/** The rules text every special round is given, in the language the quiz is played in, where it has none. */
export async function withRules(app: App, rounds: readonly Round[], language: string): Promise<Round[]> {
  const lang = language === "bg" ? "bg" : "en";
  return Promise.all(rounds.map(async (round) => {
    if ((round.rules ?? "") !== "") return round;
    const rules = await givenRules(round, lang, app.env.registries);
    return rules === undefined ? round : { ...round, rules };
  }));
}

/** A name no quiz of the library has: the quiz's own, or "… 2", "… 3". */
export function freeName(app: App, name: string): string {
  const lines = app.library === null || app.library === "error" ? [] : app.library;
  const taken = new Set(lines.map((line) => line.name));
  if (!taken.has(name)) return name;
  for (let n = 2; ; n += 1) {
    if (!taken.has(`${name} ${String(n)}`)) return `${name} ${String(n)}`;
  }
}

/** Puts fetched pictures in the open quiz's storage and its media list; the quiz itself is changed by the caller. */
export async function keepFiles(app: App, quizId: string, files: ReadonlyMap<string, Blob>): Promise<void> {
  for (const [id, blob] of files) {
    await app.store.putMedia(quizId, id, blob);
    app.media.add(id, blob);
  }
}

/** The media list with the fetched pictures added. */
export function withFetched(media: readonly MediaEntry[], fetched: Fetched, add: (list: readonly MediaEntry[], entry: MediaEntry) => readonly MediaEntry[]): readonly MediaEntry[] {
  return fetched.entries.reduce<readonly MediaEntry[]>((list, entry) => add(list, entry), media);
}
