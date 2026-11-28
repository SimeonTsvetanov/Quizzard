// A quiz written out as numbered lines for an assistant (guide.ts): the rounds and their questions, so it
// does not repeat one, and — for a check of the answers — each answer, what the host also accepts and the
// explanation the room is shown.
import type { Answer, Question, Quiz, Round } from "../model.ts";

/** One answer as words for a list of the quiz: the text, the right option, the accepted answers, the digit. */
function answerWords(answer: Answer): string {
  const field = (name: string): unknown => answer[name];
  const words = (value: unknown, fallback: string): string => (typeof value === "string" || typeof value === "number" ? String(value) : fallback);
  switch (answer.type) {
    case "open":
      return words(field("text"), "");
    case "trueFalse":
      return field("correct") === true ? "true" : "false";
    case "choice": {
      const options = (field("options") ?? []) as readonly { id: string; text: string }[];
      const correct = (field("correct") ?? []) as readonly string[];
      return options.map((option, index) => `${String(index + 1)}) ${option.text}${correct.includes(option.id) ? " (right)" : ""}`).join("; ");
    }
    case "list":
      return `accepted: ${((field("items") ?? []) as readonly string[]).join(", ")}`;
    case "digit":
      return words(field("digit"), "?");
    default:
      return "";
  }
}

/** The kind of a round as the list of the quiz names it. */
function roundKindWords(round: Round): string {
  return { standard: "", pyramid: " (Golden pyramid)", safe: " (Safe)", laugh: " (Make the quizmaster laugh — no questions)", task: " (free game — no questions)" }[round.kind] ?? "";
}

/** One line of text from a text that may have several. */
const oneLine = (text: string): string => text.replace(/\s+/g, " ").trim();

/** A question as lines for the check: the question (with what it shows that the assistant cannot see), the answer, what the host also accepts, the explanation. */
function checkLines(question: Question, index: number): string[] {
  const what: Readonly<Record<string, string>> = { picture: "a picture", audio: "a sound", video: "a video" };
  const shows = question.kind === "text" ? "" : ` [shows ${what[question.kind] ?? "a file"} you cannot see]`;
  return [
    `${String(index + 1)}. ${oneLine(question.prompt)}${shows} → ${answerWords(question.answer)}`,
    ...(question.note === undefined || question.note.trim() === "" ? [] : [`   host also accepts: ${oneLine(question.note)}`]),
    ...(question.explanation === undefined || question.explanation.trim() === "" ? [] : [`   explanation shown: ${oneLine(question.explanation)}`]),
  ];
}

/** The quiz as numbered lines: "Round 2 · Music", then "3. question" (with its answer and notes for a check). */
export function quizLines(quiz: Quiz, withAnswers: boolean): string {
  return quiz.rounds.map((round, roundIndex) => {
    const head = `Round ${String(roundIndex + 1)} · ${round.name}${roundKindWords(round)}`;
    const hasAnswers = round.kind !== "laugh" && round.kind !== "task";
    const lines = hasAnswers ? round.questions.flatMap((question, index) => (withAnswers ? checkLines(question, index) : [`${String(index + 1)}. ${oneLine(question.prompt)}`])) : [];
    return [head, ...lines].join("\n");
  }).join("\n\n");
}

