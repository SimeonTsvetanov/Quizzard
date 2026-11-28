// The four AI jobs (screens/ai/window.ts is their window): make a quiz, add rounds to a quiz, add questions
// to a standard round, check a quiz's answers. Each builds its prompt from the person's choices and the
// quiz as it is, and takes the assistant's answer: read (core draft/), checked, its pictures fetched
// (ai/pictures.ts) — then the quiz is made or changed, with Undo, or what must be fixed is listed.
import { type MediaEntry, type Question, type Quiz, type Round, findQuestion, usedMediaBytes, withMedia } from "@simeonts/quizzard-quiz-core";
import { type CheckItem, type DraftIssue, type PendingPicture, type QuizWishes, addQuestionsPrompt, addRoundsPrompt, checkPrompt, fromDraft, newQuizPrompt, questionsFromDraft, readCheck, readPasted, roundsFromDraft } from "@simeonts/quizzard-quiz-core/draft";
import type { App } from "../../app/state.ts";
import { labelButton } from "../../dom/controls.ts";
import { h } from "../../dom/h.ts";
import { offerUndo } from "../common.ts";
import { givenRules } from "../round-rules.ts";
import { wishForm } from "./form.ts";
import { fetchPictures } from "./pictures.ts";
import type { AiJob, AiWindow } from "./window.ts";

/** The words for what a draft leaves out. */
function draftOptions(app: App): { now: string; language: string; quizName: string; roundName: (n: number) => string } {
  return { now: new Date().toISOString(), language: app.lang, quizName: app.t("library.newName"), roundName: (n) => app.t("round.defaultName", { n }) };
}

/** Reads the pasted text as a draft; says why not when it cannot. */
function pasted(app: App, window: AiWindow): Readonly<Record<string, unknown>> | undefined {
  const read = readPasted(window.field.value);
  if (read.ok) return read.draft;
  const words = { empty: "ai.empty", "no-json": "ai.noJson", broken: "ai.broken", "too-long": "ai.tooLong" } as const;
  window.say(app.t(words[read.reason]), true);
  window.field.focus();
  return undefined;
}

/** Fetches the pictures a draft named; `undefined` when it could not (the window says why). */
async function pictures(app: App, window: AiWindow, list: readonly PendingPicture[], usedBytes: number): Promise<{ readonly entries: readonly MediaEntry[]; readonly files: ReadonlyMap<string, Blob>; readonly issues: readonly DraftIssue[] } | undefined> {
  if (list.length === 0) return { entries: [], files: new Map(), issues: [] };
  const outcome = await fetchPictures(list, usedBytes, (done, count) => { window.say(app.t("ai.picturesLoading", { done, count })); });
  if (outcome.ok) {
    window.say("");
    return outcome;
  }
  const words = { offline: "ai.picturesOffline", busy: "ai.picturesBusy", space: "notSaved" } as const;
  window.say(app.t(words[outcome.reason]), true);
  return undefined;
}

/** The rules text every special round is given, in the language the quiz is played in, where it has none. */
async function withRules(app: App, rounds: readonly Round[], language: string): Promise<Round[]> {
  const lang = language === "bg" ? "bg" : "en";
  return Promise.all(rounds.map(async (round) => {
    if ((round.rules ?? "") !== "") return round;
    const rules = await givenRules(round, lang, app.env.registries);
    return rules === undefined ? round : { ...round, rules };
  }));
}

/** A name no quiz of the library has: the quiz's own, or "… 2", "… 3". */
function freeName(app: App, name: string): string {
  const lines = app.library === null || app.library === "error" ? [] : app.library;
  const taken = new Set(lines.map((line) => line.name));
  if (!taken.has(name)) return name;
  for (let n = 2; ; n += 1) {
    if (!taken.has(`${name} ${String(n)}`)) return `${name} ${String(n)}`;
  }
}

/** The refusal of a form that asks for nothing. */
function nothingChosen(app: App, wishes: QuizWishes): string | null {
  return wishes.rounds === 0 && wishes.specials.length === 0 ? app.t("ai.nothing") : null;
}

/** Stores a new quiz with its pictures and opens it. */
async function storeNew(app: App, window: AiWindow, quiz: Quiz, entries: readonly MediaEntry[], files: ReadonlyMap<string, Blob>, fixed: number): Promise<void> {
  const { t } = app;
  try {
    if (entries.length > 0) await app.store.bring({ quiz, media: entries }, files);
    else await app.store.put(quiz);
  } catch {
    window.say(t("notSaved"), true);
    return;
  }
  if (app.signal.aborted) return;
  app.context.storage.notifySaved();
  await window.close();
  app.context.shell.toast(`${t("ai.added", { name: quiz.name })}${fixed > 0 ? ` ${t("ai.adjusted", { count: fixed })}` : ""}`);
  app.go({ screen: "quiz", quiz: quiz.id }, "push", "[data-play-quiz]");
}

/**
 * "Make a quiz with AI".
 * @param app - the mounted creator
 * @param shared - text another app shared with Quizzard, put in the field at once
 */
export function newQuizJob(app: App, shared?: string): AiJob {
  const { t } = app;
  const form = wishForm(app, "quiz", app.lang === "bg" ? "bg" : "en", { rounds: 10, questions: 50 });
  return {
    title: t("ai.open"),
    intro: t("ai.intro"),
    form,
    prompt: () => newQuizPrompt(form.wishes()),
    refusal: () => nothingChosen(app, form.wishes()),
    make: t("ai.make"),
    ...(shared === undefined ? {} : { start: { text: shared, status: t("ai.shared") } }),
    async take(_text, window) {
      const draft = pasted(app, window);
      if (!draft) return;
      const result = fromDraft(draft, draftOptions(app), app.env);
      if (!result.quiz) {
        window.showProblems(result.issues);
        return;
      }
      const fetched = await pictures(app, window, result.pictures, 0);
      if (!fetched) return;
      if (fetched.issues.length > 0) {
        window.showProblems(fetched.issues);
        return;
      }
      const rounds = await withRules(app, result.quiz.rounds, result.quiz.language);
      await storeNew(app, window, { ...result.quiz, rounds, name: freeName(app, result.quiz.name) }, fetched.entries, fetched.files, result.issues.length);
    },
  };
}

/** Puts fetched pictures in the open quiz's storage and its media list; the quiz itself is changed by the caller. */
async function keepFiles(app: App, quizId: string, files: ReadonlyMap<string, Blob>): Promise<void> {
  for (const [id, blob] of files) {
    await app.store.putMedia(quizId, id, blob);
    app.media.add(id, blob);
  }
}

/**
 * "Write rounds with AI": new rounds after the quiz's own, with Undo.
 * @param app - the mounted creator
 * @param quiz - the open quiz
 */
export function addRoundsJob(app: App, quiz: Quiz): AiJob {
  const { t } = app;
  const language = quiz.language === "bg" ? "bg" : "en";
  const form = wishForm(app, "rounds", language, { rounds: 20 - quiz.rounds.length, questions: 50 });
  return {
    title: t("ai.addRounds"),
    intro: t("ai.introRounds", { name: quiz.name }),
    form,
    prompt: () => addRoundsPrompt(app.current?.quiz ?? quiz, { ...form.wishes(), language }),
    refusal: () => nothingChosen(app, form.wishes()),
    make: t("ai.makeRounds"),
    async take(_text, window) {
      const now = app.current;
      const draft = pasted(app, window);
      if (!draft || !now) return;
      const result = roundsFromDraft(draft, now.quiz, draftOptions(app), app.env);
      if (!result.rounds) {
        window.showProblems(result.issues);
        return;
      }
      const fetched = await pictures(app, window, result.pictures, usedMediaBytes(now.quiz, now.media));
      if (!fetched) return;
      if (fetched.issues.length > 0) {
        window.showProblems(fetched.issues);
        return;
      }
      const added = await withRules(app, result.rounds, now.quiz.language);
      await keepFiles(app, now.quiz.id, fetched.files);
      const latest = app.current;
      if (latest?.quiz.id !== now.quiz.id) return;
      app.change({ ...latest.quiz, rounds: [...latest.quiz.rounds, ...added] }, fetched.entries.reduce<readonly MediaEntry[]>((media, entry) => withMedia(media, entry), latest.media));
      await window.close();
      const ids = new Set(added.map((round) => round.id));
      app.draw(`[data-focus="round:${added[0]?.id ?? ""}"]`);
      offerUndo(app, t("ai.roundsAdded", { count: added.length }), (quizNow) => ({ ...quizNow, rounds: quizNow.rounds.filter((round) => !ids.has(round.id)) }), () => { app.draw("[data-add-round]"); });
    },
  };
}

/**
 * "Write questions with AI": new questions at the end of a standard round, with Undo.
 * @param app - the mounted creator
 * @param quiz - the open quiz
 * @param round - the round they are for
 */
export function addQuestionsJob(app: App, quiz: Quiz, round: Round): AiJob {
  const { t } = app;
  const language = quiz.language === "bg" ? "bg" : "en";
  const form = wishForm(app, "questions", language, { rounds: 0, questions: 50 - round.questions.length });
  const current = (): Round => app.current?.quiz.rounds.find((one) => one.id === round.id) ?? round;
  return {
    title: t("ai.addQuestions"),
    intro: t("ai.introQuestions", { name: round.name }),
    form,
    prompt: () => addQuestionsPrompt(app.current?.quiz ?? quiz, current(), { ...form.wishes(), language, rounds: 1 }),
    make: t("ai.makeQuestions"),
    async take(_text, window) {
      const now = app.current;
      const draft = pasted(app, window);
      if (!draft || !now) return;
      const result = questionsFromDraft(draft, current(), app.env);
      if (!result.questions) {
        window.showProblems(result.issues);
        return;
      }
      const fetched = await pictures(app, window, result.pictures, usedMediaBytes(now.quiz, now.media));
      if (!fetched) return;
      if (fetched.issues.length > 0) {
        window.showProblems(fetched.issues);
        return;
      }
      await keepFiles(app, now.quiz.id, fetched.files);
      const latest = app.current;
      if (latest?.quiz.id !== now.quiz.id) return;
      const added: readonly Question[] = result.questions;
      const ids = new Set(added.map((question) => question.id));
      const rounds = latest.quiz.rounds.map((one) => (one.id === round.id ? { ...one, questions: [...one.questions, ...added] } : one));
      app.change({ ...latest.quiz, rounds }, fetched.entries.reduce<readonly MediaEntry[]>((media, entry) => withMedia(media, entry), latest.media));
      await window.close();
      app.draw(`[data-focus="question:${added[0]?.id ?? ""}"]`);
      const restore = (quizNow: Quiz): Quiz => ({ ...quizNow, rounds: quizNow.rounds.map((one) => ({ ...one, questions: one.questions.filter((question) => !ids.has(question.id)) })) });
      offerUndo(app, t("ai.questionsAdded", { count: added.length }), restore, () => { app.draw("[data-add-question]"); });
    },
  };
}

/** One doubted question in the check's result: where, what is wrong, the suggestion, and the way to it. */
function finding(app: App, quiz: Quiz, item: CheckItem, close: () => Promise<void>): HTMLElement {
  const { t } = app;
  const parts: HTMLElement[] = [h("strong", { class: "quiz-ai-finding-place" }, t("ai.checkPlace", { round: item.round, question: item.question }))];
  if (item.found) parts.push(h("span", { class: "quiz-ai-finding-prompt" }, item.found.prompt));
  else parts.push(h("span", { class: "quiz-ai-finding-prompt" }, t("ai.checkMissing")));
  parts.push(h("p", { class: "quiz-ai-finding-problem" }, item.problem));
  if (item.suggestion !== "") parts.push(h("p", { class: "quiz-ai-text" }, t("ai.checkSuggestion", { text: item.suggestion })));
  const found = item.found;
  if (found && findQuestion(quiz, found.id)) {
    const open = labelButton("open", t("ai.checkOpen"), { class: "button", "data-ai-open-question": found.id });
    open.addEventListener("click", () => {
      void close().then(() => { app.go({ screen: "editor", quiz: quiz.id, question: found.id }); });
    });
    parts.push(open);
  }
  return h("li", { class: "quiz-ai-finding" }, ...parts);
}

/**
 * "Check the answers with AI": the assistant's doubts, each with the way to its question.
 * @param app - the mounted creator
 * @param quiz - the open quiz
 */
export function checkJob(app: App, quiz: Quiz): AiJob {
  const { t } = app;
  const language = app.lang === "bg" ? "bg" : "en";
  return {
    title: t("ai.check"),
    intro: t("ai.introCheck"),
    prompt: () => checkPrompt(app.current?.quiz ?? quiz, language),
    make: t("ai.makeCheck"),
    async take(text, window) {
      await Promise.resolve();
      const now = app.current?.quiz ?? quiz;
      const read = readCheck(text, now);
      if (!read.ok) {
        window.say(t(read.reason === "empty" ? "ai.empty" : "ai.noJson"), true);
        window.field.focus();
        return;
      }
      window.say("");
      if (read.items.length === 0) {
        window.showResult(h("div", {}, h("h3", { tabindex: "-1" }, t("ai.checkNone"))));
        return;
      }
      const list = h("ul", { class: "quiz-ai-findings" }, ...read.items.map((item) => finding(app, now, item, () => window.close())));
      window.showResult(h("div", { "data-ai-findings": "" }, h("h3", { tabindex: "-1" }, t("ai.checkFound", { count: read.items.length })), list));
    },
  };
}
