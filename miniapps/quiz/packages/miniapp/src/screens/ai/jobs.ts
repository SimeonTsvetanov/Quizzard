// Three of the AI jobs (screens/ai/window.ts is their window; the fourth, the check, is ai/check.ts): make a
// quiz, add rounds to a quiz, add questions to a standard round. Each builds its prompt from the person's
// choices and the quiz as it is, and takes the assistant's answer: read (core draft/), checked, its pictures
// fetched (ai/pictures.ts) — then the quiz is made or changed, with Undo, or what must be fixed is listed.
// A job whose window was closed, or whose quiz or round is gone meanwhile, changes nothing.
import { type MediaEntry, type Question, type Quiz, type Round, usedMediaBytes, withMedia } from "@simeonts/quizzard-quiz-core";
import { type QuizWishes, addQuestionsPrompt, addRoundsPrompt, fromDraft, newQuizPrompt, questionsFromDraft, roundsFromDraft } from "@simeonts/quizzard-quiz-core/draft";
import type { App } from "../../app/state.ts";
import { offerUndo } from "../common.ts";
import { wishForm } from "./form.ts";
import { draftOptions, freeName, keepFiles, pasted, pictures, withFetched, withRules } from "./take.ts";
import type { AiJob, AiWindow } from "./window.ts";

/** Most rounds in a quiz and questions in a round (core model limits). */
const MAX_ROUNDS = 20;
const MAX_QUESTIONS = 50;

/** The refusal of a form that asks for nothing. */
function nothingChosen(app: App, wishes: QuizWishes): string | null {
  return wishes.rounds === 0 && wishes.specials.length === 0 ? app.t("ai.nothing") : null;
}

/** Stores a new quiz with its pictures and opens it. */
async function storeNew(app: App, window: AiWindow, quiz: Quiz, entries: readonly MediaEntry[], files: ReadonlyMap<string, Blob>, fixed: number): Promise<void> {
  const { t } = app;
  if (window.signal.aborted) return;
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
 * @param say - the window's status line
 */
export function newQuizJob(app: App, say: AiWindow["say"]): AiJob {
  const { t } = app;
  const form = wishForm(app, "quiz", app.lang === "bg" ? "bg" : "en", { rounds: 10, questions: MAX_QUESTIONS }, say);
  return {
    title: t("ai.open"),
    intro: t("ai.intro"),
    target: "quiz",
    form,
    prompt: () => newQuizPrompt(form.wishes()),
    refusal: () => nothingChosen(app, form.wishes()),
    last: { kind: "quiz" },
    make: t("ai.make"),
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

/** The open quiz, when it is still the one a job is for; else the window says it changed. */
function stillOpen(app: App, window: AiWindow, quizId: string, roundId?: string): NonNullable<App["current"]> | undefined {
  if (window.signal.aborted) return undefined;
  const latest = app.current;
  if (latest?.quiz.id === quizId && (roundId === undefined || latest.quiz.rounds.some((round) => round.id === roundId))) return latest;
  window.say(app.t("ai.gone"), true);
  return undefined;
}

/**
 * "Write rounds with AI": new rounds after the quiz's own, with Undo.
 * @param app - the mounted creator
 * @param quiz - the open quiz
 * @param say - the window's status line
 */
export function addRoundsJob(app: App, quiz: Quiz, say: AiWindow["say"]): AiJob {
  const { t } = app;
  const language = quiz.language === "bg" ? "bg" : "en";
  const room = (): number => MAX_ROUNDS - (app.current?.quiz ?? quiz).rounds.length;
  const form = wishForm(app, "rounds", language, { rounds: room(), questions: MAX_QUESTIONS }, say);
  return {
    title: t("ai.addRounds"),
    intro: t("ai.introRounds", { name: quiz.name }),
    target: "rounds",
    form,
    prompt: () => addRoundsPrompt(app.current?.quiz ?? quiz, { ...form.wishes(), language }),
    refusal: () => {
      const wishes = form.wishes();
      const left = room();
      if (left <= 0) return t("ai.quizFull", { max: MAX_ROUNDS });
      return wishes.rounds + wishes.specials.length > left ? t("ai.fewerRounds", { room: left }) : nothingChosen(app, wishes);
    },
    last: { kind: "rounds", quizId: quiz.id },
    make: t("ai.makeRounds"),
    async take(_text, window) {
      const now = stillOpen(app, window, quiz.id);
      const draft = now && pasted(app, window);
      if (!now || !draft) return;
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
      if (!stillOpen(app, window, quiz.id)) return;
      await keepFiles(app, quiz.id, fetched.files);
      const latest = stillOpen(app, window, quiz.id);
      if (!latest) return;
      app.change({ ...latest.quiz, rounds: [...latest.quiz.rounds, ...added] }, withFetched(latest.media, fetched, withMedia));
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
 * @param say - the window's status line
 */
export function addQuestionsJob(app: App, quiz: Quiz, round: Round, say: AiWindow["say"]): AiJob {
  const { t } = app;
  const language = quiz.language === "bg" ? "bg" : "en";
  const current = (): Round => app.current?.quiz.rounds.find((one) => one.id === round.id) ?? round;
  const form = wishForm(app, "questions", language, { rounds: 0, questions: MAX_QUESTIONS - round.questions.length }, say);
  return {
    title: t("ai.addQuestions"),
    intro: t("ai.introQuestions", { name: round.name }),
    target: "questions",
    form,
    prompt: () => addQuestionsPrompt(app.current?.quiz ?? quiz, current(), { ...form.wishes(), language, rounds: 1 }),
    refusal: () => (current().questions.length >= MAX_QUESTIONS ? t("ai.roundFull", { max: MAX_QUESTIONS }) : null),
    last: { kind: "questions", quizId: quiz.id, roundId: round.id },
    make: t("ai.makeQuestions"),
    async take(_text, window) {
      const now = stillOpen(app, window, quiz.id, round.id);
      const draft = now && pasted(app, window);
      if (!now || !draft) return;
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
      if (!stillOpen(app, window, quiz.id, round.id)) return;
      await keepFiles(app, quiz.id, fetched.files);
      const latest = stillOpen(app, window, quiz.id, round.id);
      if (!latest) return;
      const added: readonly Question[] = result.questions;
      const ids = new Set(added.map((question) => question.id));
      const rounds = latest.quiz.rounds.map((one) => (one.id === round.id ? { ...one, questions: [...one.questions, ...added] } : one));
      app.change({ ...latest.quiz, rounds }, withFetched(latest.media, fetched, withMedia));
      await window.close();
      app.draw(`[data-focus="question:${added[0]?.id ?? ""}"]`);
      const restore = (quizNow: Quiz): Quiz => ({ ...quizNow, rounds: quizNow.rounds.map((one) => ({ ...one, questions: one.questions.filter((question) => !ids.has(question.id)) })) });
      offerUndo(app, t("ai.questionsAdded", { count: added.length }), restore, () => { app.draw("[data-add-question]"); });
    },
  };
}
