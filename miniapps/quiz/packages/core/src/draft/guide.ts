// The guide an AI assistant reads before it writes a quiz for Quizzard: what to ask the person, the
// draft format with every limit, and how to hand the quiz over. Built from the same limits and round
// kinds the reader checks (convert.ts), so the text can never promise what the code refuses. It is the
// prompt the creator copies, and the site serves it as `ai.md` (scripts/generate.ts).
import * as limits from "../limits.ts";
import { PYRAMID_QUESTIONS } from "../rounds/pyramid.ts";
import { SAFE_QUESTIONS } from "../rounds/safe.ts";
import { LAUGH_FIRST_DEFAULT, LAUGH_SECOND_DEFAULT, TASK_POINTS_DEFAULT } from "../rounds/tasks.ts";

/** A small quiz in the draft format: one round of every kind. */
export const DRAFT_EXAMPLE = {
  name: "Friday quiz",
  language: "en",
  teams: 4,
  rounds: [
    {
      type: "standard",
      name: "Warm-up",
      seconds: 30,
      points: 1,
      questions: [
        { q: "Which river flows through Paris?", a: "The Seine", explanation: "It splits around two islands in the city centre." },
        { q: "What does the abbreviation WC stand for?", options: ["Water Closet", "World Cup", "Wash Corner", "West Coast"], correct: 1 },
        { q: "The Great Wall of China is visible from the Moon.", a: false },
        { q: "Name the band and the song.", a: "Queen — Bohemian Rhapsody", points: 2, pointsNote: "1 for the band, 1 for the song", seconds: 45 },
      ],
    },
    {
      type: "pyramid",
      name: "Golden pyramid",
      questions: [
        { q: "Name the largest planet.", accepted: ["Jupiter"] },
        { q: "Name 2 primary colours of light.", accepted: ["Red", "Green", "Blue"] },
        { q: "Name 3 noble gases.", accepted: ["Helium", "Neon", "Argon", "Krypton", "Xenon", "Radon"] },
        { q: "Name 4 oceans.", accepted: ["Pacific", "Atlantic", "Indian", "Arctic", "Southern"] },
      ],
    },
    {
      type: "safe",
      name: "Safe",
      bonus: 3,
      questions: [
        { q: "How many sides does a triangle have?", digit: 3 },
        { q: "How many strings does a violin have?", digit: 4 },
        { q: "How many rings are on the Olympic flag?", digit: 5 },
        { q: "How many legs does an insect have?", digit: 6 },
        { q: "How many colours are in a rainbow?", digit: 7 },
      ],
    },
    { type: "laugh", name: "Make the quizmaster laugh", seconds: 300, first: 3, second: 1 },
  ],
} as const;

/** The guide's sections, in order. */
function sections(): readonly string[] {
  const l = limits;
  return [
    "# How to make a quiz for Quizzard",
    "You are helping a person make a quiz for Quizzard, a free quiz app (https://simeontsvetanov.github.io/Quizzard/). You write the quiz as JSON in the format below; the person pastes it into Quizzard, which checks it and turns it into a quiz they can edit, play on a big screen and export.",
    "## 1. Ask first",
    "Talk to the person in their own language. Before you write anything, ask these in ONE short message, and offer a sensible default for each so they can just say \"go\":",
    `- What is the quiz about, and who plays (friends, colleagues, children)? How hard?\n- Its name, and the language of the questions (English or Bulgarian).\n- How many rounds and how many questions per round (at most ${String(l.MAX_ROUNDS)} rounds, ${String(l.MAX_QUESTIONS_PER_ROUND)} questions a round; 5–10 a round plays well).\n- Which special rounds, if any: Golden pyramid, Safe, Make the quizmaster laugh, a free game.\n- Seconds per question (default ${String(l.DEFAULT_SECONDS)}) and points per question (default ${String(l.DEFAULT_POINTS)}).\n- Open answers, multiple choice, true / false, or a mix?`,
    "## 2. The format",
    "One JSON object. Text questions only: no pictures, audio or video (the person adds those in Quizzard). Leave out anything you do not need — every field except the ones marked required has a default.",
    `\`\`\`json\n${JSON.stringify(DRAFT_EXAMPLE, null, 2)}\n\`\`\``,
    "### The quiz",
    `- \`name\` (required): up to ${String(l.QUIZ_NAME_MAX)} characters.\n- \`language\`: \`"en"\` or \`"bg"\` — the language of the player's own words (buttons, "Answer", "Scores").\n- \`teams\`: ${String(l.MIN_TEAMS)}–${String(l.MAX_TEAMS)}, default ${String(l.DEFAULT_TEAMS)}; the host can change it when the game starts.\n- \`rounds\` (required): 1–${String(l.MAX_ROUNDS)} rounds, played in this order.`,
    "### Every round",
    `- \`type\`: \`"standard"\` (default), \`"pyramid"\`, \`"safe"\`, \`"laugh"\` or \`"task"\`.\n- \`name\` (required): up to ${String(l.ROUND_NAME_MAX)} characters.\n- \`seconds\`: time per question, ${String(l.MIN_SECONDS)}–${String(l.MAX_SECONDS)}.\n- \`rules\`: optional text shown before the round, up to ${String(l.RULES_MAX)} characters. Leave it out for special rounds: Quizzard writes their rules itself, in the quiz's language.`,
    "### Round type `standard`",
    `Any mix of questions, 1–${String(l.MAX_QUESTIONS_PER_ROUND)}. \`points\` on the round is what each question is worth (0–${String(l.MAX_POINTS)}, default ${String(l.DEFAULT_POINTS)}). Each question has \`q\` (required, up to ${String(l.PROMPT_MAX)} characters) and ONE of these answers:`,
    `- Open answer: \`"a": "The Seine"\` (up to ${String(l.ANSWER_TEXT_MAX)} characters).\n- Multiple choice: \`"options": [...]\` with ${String(l.MIN_OPTIONS)}–${String(l.MAX_OPTIONS)} texts (up to ${String(l.OPTION_TEXT_MAX)} characters each) and \`"correct"\`: the number of the right option, the first being 1 — or a list of numbers when several are right.\n- True / false: \`"a": true\` or \`"a": false\` (the JSON values, not words in quotes).`,
    `Optional on any question: \`explanation\` (shown with the answer, up to ${String(l.EXPLANATION_MAX)} characters — a fact or a source makes a quiz better), \`note\` (only the host sees it: which answers to accept, up to ${String(l.HOST_NOTE_MAX)}), \`seconds\` and \`points\` when this question differs from its round, \`pointsNote\` (how it is scored, up to ${String(l.POINTS_NOTE_MAX)}).`,
    "### Round type `pyramid` — Golden pyramid",
    `Exactly ${String(PYRAMID_QUESTIONS)} questions. Question 1 asks for 1 answer, question 2 for 2, question 3 for 3, question 4 for 4; a team gets 1 point for every answer that is on the question's list, and 0 for the question if it writes more answers than asked. Each question has \`q\` and \`accepted\`: the list of every answer you accept (at least as many as the question asks for, up to ${String(l.LIST_ITEMS_MAX)}). Say the number in the question: "Name 3 noble gases." Default time: 60 seconds a question.`,
    "### Round type `safe` — Safe",
    `Exactly ${String(SAFE_QUESTIONS)} questions; the answer to each is ONE digit, 0–9, and the five digits are the code of a safe. Each question has \`q\` and \`digit\`. 1 point per right digit; all five right add \`bonus\` (${String(l.SAFE_BONUS_MIN)}–${String(l.SAFE_BONUS_MAX)}, default ${String(l.SAFE_BONUS_DEFAULT)}). Write questions whose answer really is a single digit: a count, the last digit of a year, the result of a small sum. Default time: 45 seconds a question.`,
    "### Round type `laugh` — Make the quizmaster laugh",
    `No questions. Every team thinks up a joke and tells it; the host picks the two funniest. Fields: \`seconds\` (default 300, in steps of 30), \`first\` and \`second\` — the two prizes (0–${String(l.ROUND_VALUE_MAX)}, default ${String(LAUGH_FIRST_DEFAULT)} and ${String(LAUGH_SECOND_DEFAULT)}), and an optional \`text\` with an extra condition ("the joke must be about the birthday girl").`,
    "### Round type `task` — free game",
    `No questions: one screen with a task the teams do — draw, build, sing — and the host gives the points. Fields: \`text\` (required: the task, up to ${String(l.PROMPT_MAX)} characters), \`seconds\` (default 180, in steps of 30) and \`points\` — the most a team can get (0–${String(l.ROUND_VALUE_MAX)}, default ${String(TASK_POINTS_DEFAULT)}).`,
    "## 3. Write good questions",
    "- Every fact must be true and checkable. If you are not sure of an answer, do not use the question.\n- One clear right answer per question; put accepted variants in `note` for the host.\n- Short questions read well on a big screen: aim for under 150 characters.\n- Mix easy and hard, and do not repeat a topic inside a round.\n- Wrong options of a multiple-choice question must be plausible, and the right one must not always be in the same place.",
    "## 4. Hand it over",
    "- Answer with the quiz as ONE ```json code block and nothing after it except this line: \"Copy the block, open Quizzard → Quiz creator → Make a quiz with AI, and paste it there.\"\n- A long quiz may come in several messages: the first block is the quiz with its first rounds, every later block is a list of the next rounds (`[ { round }, { round } ]`). The person pastes them all together.\n- If the person sends you a message that starts with \"Quizzard could not take the quiz\", fix exactly what it lists and send the whole corrected quiz again.\n- Do not invent fields. Do not add ids. Do not wrap the JSON in any other object.",
  ];
}

/** The guide as Markdown. */
export function draftGuide(): string {
  return `${sections().join("\n\n")}\n`;
}
