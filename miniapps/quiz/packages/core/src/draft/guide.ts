// What an AI assistant reads before it writes for Quizzard: the draft format with every limit, how to
// write good questions, how to name pictures, and how to hand the result over. Built from the same
// limits and round kinds the reader checks (convert.ts), so the text never promises what the code
// refuses. `draftGuide` is the whole guide (the site serves it as `ai.md`, scripts/generate.ts); the
// creator copies a prompt made for one job — a new quiz, more rounds, more questions, a check of the
// answers — with what the person chose in its form.
import type { Quiz, Round } from "../model.ts";
import { DRAFT_EXAMPLE } from "./example.ts";
import { quizLines } from "./quiz-lines.ts";

export { DRAFT_EXAMPLE } from "./example.ts";
import * as limits from "../limits.ts";
import { PYRAMID_QUESTIONS } from "../rounds/pyramid.ts";
import { SAFE_QUESTIONS } from "../rounds/safe.ts";
import { LAUGH_FIRST_DEFAULT, LAUGH_SECOND_DEFAULT, TASK_POINTS_DEFAULT } from "../rounds/tasks.ts";



/** The kinds of answer a person may ask for in a standard round. */
export type AnswerChoice = "open" | "choice" | "trueFalse";
/** The special rounds a person may ask for. */
export type SpecialChoice = "pyramid" | "safe" | "laugh" | "task";
/** Who plays. */
export type AudienceChoice = "friends" | "colleagues" | "family" | "children" | "teens" | "experts";
/** How hard the questions are. */
export type DifficultyChoice = "easy" | "medium" | "hard" | "mixed";

/** What the person chose in the creator's form before the prompt is copied. */
export interface QuizWishes {
  /** What the quiz is about; `""` = the assistant chooses varied general knowledge. */
  readonly topic: string;
  readonly audience: AudienceChoice;
  readonly difficulty: DifficultyChoice;
  /** The quiz's name; `""` = the assistant thinks of one. */
  readonly name: string;
  readonly language: "en" | "bg";
  /** Standard rounds, and questions in each (for more questions: the number of questions). */
  readonly rounds: number;
  readonly perRound: number;
  readonly answers: readonly AnswerChoice[];
  readonly seconds: number;
  readonly points: number;
  readonly specials: readonly SpecialChoice[];
  /** Questions may have pictures from Wikimedia Commons. */
  readonly pictures: boolean;
  /** Anything else the person wants, in their own words. */
  readonly extra: string;
  /** The language the person reads Quizzard in (its buttons; the assistant talks to them in it); the questions' language when not said. */
  readonly ui?: "en" | "bg";
}

/** What the result of a prompt is: a whole quiz, rounds to add, questions to add. */
type Target = "quiz" | "rounds" | "questions";

/** The languages' names, for the assistant. */
export const LANGUAGE_NAMES = { en: "English", bg: "Bulgarian" } as const;
const AUDIENCE_WORDS: Readonly<Record<AudienceChoice, string>> = { friends: "friends", colleagues: "colleagues at work", family: "a family, adults and children together", children: "children of about 8 to 12", teens: "teenagers", experts: "keen quiz players who like it hard" };
const ANSWER_WORDS: Readonly<Record<AnswerChoice, string>> = { open: "open answers", choice: "multiple choice", trueFalse: "true / false" };
const SPECIAL_WORDS: Readonly<Record<SpecialChoice, string>> = { pyramid: "Golden pyramid", safe: "Safe", laugh: "Make the quizmaster laugh", task: "a free game" };

/** The words of the creator's buttons the hand-over line names, in the language the person reads. */
export const BUTTONS = {
  en: { open: "Make a quiz with AI", paste: "Paste", quiz: "Make the quiz", rounds: "Add the rounds", questions: "Add the questions", check: "Show the results" },
  bg: { open: "Направи куиз с ИИ", paste: "Постави", quiz: "Направи куиза", rounds: "Добави рундовете", questions: "Добави въпросите", check: "Покажи резултата" },
} as const;

/** The phrase the creator's message about problems starts with, in both languages. */
const PROBLEMS_HEAD = "\"Quizzard could not take the quiz\" (\"Quizzard не можа да приеме куиза\")";

const l = limits;

/** "The format": what one round, one question and every special round look like. */
function questionSections(): readonly string[] {
  return [
    "### Every question",
    `\`q\` (required): the question, up to ${String(l.PROMPT_MAX)} characters. Optional: \`explanation\` (shown with the answer, up to ${String(l.EXPLANATION_MAX)} characters — a fact or a source makes a quiz better) and \`note\` (only the host sees it: which other answers to accept, up to ${String(l.HOST_NOTE_MAX)}). Nothing is checked by a machine while playing: the teams write on paper and the host decides what is right, so name the variants in \`note\`.`,
    "### Answers of a standard round",
    `Each question has ONE of these answers:\n- Open answer: \`"a": "The Seine"\` (up to ${String(l.ANSWER_TEXT_MAX)} characters).\n- Multiple choice: \`"options": [...]\` with ${String(l.MIN_OPTIONS)}–${String(l.MAX_OPTIONS)} texts (up to ${String(l.OPTION_TEXT_MAX)} characters each) and \`"correct"\`: the NUMBER of the right option, counted from 1 and written without quotes — or a list of numbers when several are right. \`"options": ["World Cup", "Water Closet"], "correct": 2\` marks "Water Closet".\n- True / false: \`"a": true\` or \`"a": false\`. Write the statement in \`q\`; the screen shows the two choices itself.`,
    `A question that differs from its round may have its own \`seconds\` and \`points\`, and \`pointsNote\` (how it is scored, up to ${String(l.POINTS_NOTE_MAX)} characters).`,
  ];
}

/** The section of one special round. */
const SPECIAL_SECTIONS: Readonly<Record<SpecialChoice, readonly string[]>> = {
  pyramid: [
    "### Round type `pyramid` — Golden pyramid",
    `Exactly ${String(PYRAMID_QUESTIONS)} questions, shown together on one screen. Question 1 asks for 1 answer, question 2 for 2, question 3 for 3, question 4 for 4; a team gets 1 point for every answer that is on the question's list, and 0 for the question if it writes more answers than asked. Each question has \`q\` and \`accepted\`: every DIFFERENT answer that counts (at least as many as the question asks for, up to ${String(l.LIST_ITEMS_MAX)}; not two spellings of one answer — put those in \`note\`). Say the number in the question: "Name 3 noble gases." The points are fixed: do not write \`points\`. \`seconds\` is per question (default 60) and the four are added up into one timer.`,
  ],
  safe: [
    "### Round type `safe` — Safe",
    `Exactly ${String(SAFE_QUESTIONS)} questions; the answer to each is ONE digit, 0–9, and the five digits are the code of a safe (a digit may repeat). Each question has \`q\` and \`digit\`. 1 point per right digit — do not write \`points\`; all five right add \`bonus\` (${String(l.SAFE_BONUS_MIN)}–${String(l.SAFE_BONUS_MAX)}, default ${String(l.SAFE_BONUS_DEFAULT)}). Write questions whose answer really is a single digit: a count, the last digit of a year, the result of a small sum. \`seconds\` per question, default 45.`,
  ],
  laugh: [
    "### Round type `laugh` — Make the quizmaster laugh",
    `No \`questions\` and no \`points\`. Every team thinks up a joke and tells it; the host picks the two funniest. Fields: \`seconds\` (30–${String(l.MAX_SECONDS)} in steps of 30, default 300), \`first\` and \`second\` — the two prizes (0–${String(l.ROUND_VALUE_MAX)}, default ${String(LAUGH_FIRST_DEFAULT)} and ${String(LAUGH_SECOND_DEFAULT)}), and an optional \`text\` with an extra condition, up to ${String(l.PROMPT_MAX)} characters ("the joke must be about the birthday girl").`,
  ],
  task: [
    "### Round type `task` — free game",
    `No \`questions\`: one screen with a task the teams do — draw, build, sing — and the host gives the points. Fields: \`text\` (required: the task, up to ${String(l.PROMPT_MAX)} characters), \`seconds\` (30–${String(l.MAX_SECONDS)} in steps of 30, default 180) and \`points\` — the most a team can get (0–${String(l.ROUND_VALUE_MAX)}, default ${String(TASK_POINTS_DEFAULT)}).`,
  ],
};

/** The fields of a quiz and of every round. */
function roundSections(target: Target): readonly string[] {
  const quiz = [
    "### The quiz",
    `- \`name\` (required): up to ${String(l.QUIZ_NAME_MAX)} characters.\n- \`language\`: \`"en"\` or \`"bg"\` — the language of the player's own words (buttons, "Answer", "Scores") and of the rules Quizzard writes for special rounds. Always set it to the language of your questions.\n- \`teams\`: ${String(l.MIN_TEAMS)}–${String(l.MAX_TEAMS)}, default ${String(l.DEFAULT_TEAMS)}; the host can change it when the game starts.\n- \`rounds\` (required): 1–${String(l.MAX_ROUNDS)} rounds, played in this order.`,
  ];
  const round = [
    "### Every round",
    `- \`type\`: \`"standard"\` (default), \`"pyramid"\`, \`"safe"\`, \`"laugh"\` or \`"task"\`.\n- \`name\` (required): up to ${String(l.ROUND_NAME_MAX)} characters, in the quiz's language ("Golden pyramid" / "Златна пирамида").\n- \`seconds\`: the time, see each type for its default.\n- \`rules\`: optional text shown before the round, up to ${String(l.RULES_MAX)} characters. Leave it out for special rounds: Quizzard writes their rules itself.`,
    "### Round type `standard`",
    `1–${String(l.MAX_QUESTIONS_PER_ROUND)} questions of any mix. On the round: \`seconds\` per question (${String(l.MIN_SECONDS)}–${String(l.MAX_SECONDS)}, default ${String(l.DEFAULT_SECONDS)}) and \`points\` per question (0–${String(l.MAX_POINTS)}, default ${String(l.DEFAULT_POINTS)}).`,
  ];
  return target === "quiz" ? [...quiz, ...round] : round;
}

/** "Pictures": the only source, how a file is named, and that a name is never made up. */
function pictureSection(): readonly string[] {
  return [
    "## Pictures",
    "Questions may have pictures. A picture is a file of Wikimedia Commons — no other website.",
    "- `\"picture\": \"File:Name.jpg\"` shows it with the question (\"Which city is this?\"); `\"answerPicture\": \"File:Name.jpg\"` shows it with the answer. A picture question still needs its text in `q`.",
    "- Use ONLY a file you have opened in this conversation: search commons.wikimedia.org, open the file's own page (https://commons.wikimedia.org/wiki/File:Name.jpg), make sure the page exists and shows the picture, and copy its exact name. NEVER invent, guess, complete, translate or remember a file name. Quizzard downloads every file before it takes the quiz and refuses names that do not exist.",
    "- If you cannot open web pages, write the questions without pictures and say so in the one line after the code block.",
    "- Choose pictures that make the question clear: landmarks, flags, maps, animals, plants, objects, artworks, well-known public figures in their public role. No private people and no pictures of children.",
    "- Pictures go only on questions of standard and Safe rounds (a Golden pyramid shows its questions as text; Make the quizmaster laugh and a free game have none).",
    "- At most one picture with the question and one with the answer; about one question in three with a picture is enough unless the person asks for more.",
    "- Quizzard shows each picture's author and licence by itself: do not write them.",
  ];
}

/** "Write good questions". */
function qualitySection(): readonly string[] {
  return [
    "## Write good questions",
    "- Every fact must be true and checkable. If you are not sure of an answer, do not use the question.\n- One clear right answer per question.\n- Short questions read well on a big screen: aim for under 150 characters.\n- Mix easy and hard, and do not ask two questions about the same thing in one round.\n- Wrong options of a multiple-choice question must be plausible, and the right one must not always be in the same place.",
  ];
}

/** The line after the code block, naming the creator's buttons in the person's language (both when it is not known). */
function handOverLine(target: Target, language: "en" | "bg" | undefined): string {
  const words = (lang: "en" | "bg"): string => `"${BUTTONS[lang].paste}" and "${BUTTONS[lang][target]}"`;
  const open = target === "quiz" ? `, choose Quiz creator, then "${BUTTONS.en.open}" (in Bulgarian: "${BUTTONS.bg.open}")` : "";
  const buttons = language === undefined ? `${words("en")} (in Bulgarian: ${words("bg")})` : words(language);
  return `After it, write only one short line in the person's language: press Copy on the block, go back to Quizzard${open}, press ${buttons}. No summary, no list of the questions, no other code block.`;
}

/** "Hand it over": one code block that holds exactly what is pasted. */
function handOverSection(target: Target, language?: "en" | "bg"): readonly string[] {
  const shape = { quiz: "the WHOLE quiz as one object", rounds: "ALL the new rounds as one LIST: `[ { round }, { round } ]`", questions: "ALL the new questions as one object: `{ \"questions\": [ { question }, … ] }`" }[target];
  const long = target === "quiz"
    ? "- A quiz too long for one answer: the first block is the quiz object with its first rounds; every later block — in the same message or the next ones — is a LIST of the following whole rounds: `[ { round }, { round } ]`. Never cut a round in two. Put only \"Part 1 of 3\" on the line before each block, and tell the person to copy each one and press Paste for each, in order."
    : "- Too long for one answer: send more blocks of the same shape, each with only \"Part 1 of 2\" on the line before it, and tell the person to copy each one and press Paste for each, in order.";
  return [
    "## Hand it over",
    `- Put ${shape} in ONE \`\`\`json code block, and nothing else in that block. Chat apps show a Copy button on a code block: that button is how the person takes it, so the block must hold exactly what they paste.\n- Write nothing before the block. ${handOverLine(target, language)}\n${long}\n- If the person sends a message that starts with ${PROBLEMS_HEAD}, fix exactly what it lists and send ALL of it again, not only the changed part.\n- Do not invent fields. Do not add ids. Do not wrap the JSON in any other object.`,
  ];
}

/** An example of the result: a standard round and only the special rounds that may be in it. */
function exampleOf(target: Target, specials: readonly SpecialChoice[]): string {
  const rounds = DRAFT_EXAMPLE.rounds.filter((round) => round.type === "standard" || (specials as readonly string[]).includes(round.type));
  const value = { quiz: { ...DRAFT_EXAMPLE, rounds }, rounds, questions: { questions: DRAFT_EXAMPLE.rounds[0].questions.slice(0, 4) } }[target];
  return `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;
}

/** "The format", for a result of one shape, with the special rounds it may hold. */
function formatSections(target: Target, specials: readonly SpecialChoice[]): readonly string[] {
  const what = { quiz: "One JSON object", rounds: "One JSON list of rounds", questions: "One JSON object with a \"questions\" list" }[target];
  return [
    "## The format",
    `${what}. Text in any language and script; quotes inside a text are escaped as JSON asks (\\"). All numbers are whole numbers. Leave out anything you do not need — every field not marked required has a default.`,
    exampleOf(target, specials),
    ...(target === "questions" ? [] : roundSections(target)),
    ...questionSections(),
    ...(target === "questions" ? [] : specials.flatMap((special) => SPECIAL_SECTIONS[special])),
  ];
}

const ALL_SPECIALS: readonly SpecialChoice[] = ["pyramid", "safe", "laugh", "task"];

/** "Ask first": what the assistant asks when nobody chose anything yet (the guide on the site). */
function askSection(): readonly string[] {
  return [
    "## Ask first",
    "Talk to the person in their own language. Before you write anything, ask these in ONE short message, and offer a sensible default for each. If the person already told you, or says \"go\", do not ask again: use the defaults.",
    `- What is the quiz about, and who plays (friends, colleagues, children)? How hard?\n- Its name, and the language of the questions (English or Bulgarian).\n- How many rounds and how many questions per round (at most ${String(l.MAX_ROUNDS)} rounds, ${String(l.MAX_QUESTIONS_PER_ROUND)} questions a round; 5–10 a round plays well). A round may have a theme.\n- Which special rounds, if any: Golden pyramid, Safe, Make the quizmaster laugh, a free game.\n- Seconds per question (default ${String(l.DEFAULT_SECONDS)}) and points per question (default ${String(l.DEFAULT_POINTS)}).\n- Open answers, multiple choice, true / false, or a mix?\n- Pictures? Only if you can open web pages (see Pictures).`,
  ];
}

/**
 * The whole guide, for an assistant that starts with no choices made (the site's `ai.md`).
 * @returns Markdown
 */
export function draftGuide(): string {
  return `${[
    "# How to make a quiz for Quizzard",
    "You are helping a person make a quiz for Quizzard, a free quiz app (https://simeontsvetanov.github.io/Quizzard/). You write the quiz as JSON in the format below; the person pastes it into Quizzard, which checks it and turns it into a quiz they can edit, play on a big screen and export.",
    ...askSection(),
    ...formatSections("quiz", ALL_SPECIALS),
    ...pictureSection(),
    ...qualitySection(),
    ...handOverSection("quiz"),
  ].join("\n\n")}\n`;
}

/** The person's choices as lines of the prompt. */
function wishLines(wishes: QuizWishes, target: Target): readonly string[] {
  const topic = wishes.topic.trim() === "" ? "your choice: varied general knowledge" : wishes.topic.trim();
  const answers = wishes.answers.length === 0 ? ANSWER_WORDS.open : wishes.answers.map((one) => ANSWER_WORDS[one]).join(", ");
  const each = `${String(wishes.seconds)} seconds and ${String(wishes.points)} point${wishes.points === 1 ? "" : "s"} a question; answers: ${answers}${wishes.answers.length > 1 ? " (mix them)" : ""}`;
  const standard = target === "questions"
    ? `- ${String(wishes.perRound)} new questions; answers: ${answers}${wishes.answers.length > 1 ? " (mix them)" : ""}`
    : `- ${wishes.rounds === 0 ? "No standard rounds" : `${String(wishes.rounds)} standard round${wishes.rounds === 1 ? "" : "s"} of ${String(wishes.perRound)} questions each, ${each}`}`;
  const where = wishes.specials.includes("laugh") ? "place them where they play best; Make the quizmaster laugh works well last" : "place them where they play best";
  const specials = target === "questions" ? [] : [`- Special rounds: ${wishes.specials.length === 0 ? "none — write no special round" : `${wishes.specials.map((one) => SPECIAL_WORDS[one]).join(", ")} (${where})`}`];
  return [
    `- Topic: ${topic}`,
    `- Players: ${AUDIENCE_WORDS[wishes.audience]}; difficulty: ${wishes.difficulty}`,
    ...(target === "quiz" ? [`- Name of the quiz: ${wishes.name.trim() === "" ? "think of a short, fun one" : wishes.name.trim()}`] : []),
    `- Language of the questions: ${LANGUAGE_NAMES[wishes.language]} ("${wishes.language}")`,
    standard,
    ...specials,
    `- Pictures: ${wishes.pictures ? "yes — follow the section Pictures" : "no"}`,
    ...(wishes.extra.trim() === "" ? [] : [`- More wishes, in the person's words: ${wishes.extra.trim()}`]),
  ];
}

/** "What the person chose": the form's answers, and that nothing is asked again. */
function wishSection(wishes: QuizWishes, target: Target): readonly string[] {
  const what = { quiz: "the quiz", rounds: "the new rounds", questions: "the new questions" }[target];
  return [
    "## What the person chose",
    `The person already chose these in Quizzard. Do not ask about them: write ${what} now. Talk to the person in ${LANGUAGE_NAMES[wishes.ui ?? wishes.language]}.`,
    wishLines(wishes, target).join("\n"),
  ];
}

/**
 * The prompt for a new quiz with the person's choices.
 * @param wishes - what the person chose in the form
 */
export function newQuizPrompt(wishes: QuizWishes): string {
  return `${[
    "# Make a quiz for Quizzard",
    "You are making a quiz for a person who uses Quizzard, a free quiz app. You write it as JSON in the format below; the person pastes it into Quizzard, which checks it and turns it into a quiz they can edit and play on a big screen.",
    ...wishSection(wishes, "quiz"),
    ...formatSections("quiz", wishes.specials),
    ...(wishes.pictures ? pictureSection() : []),
    ...qualitySection(),
    ...handOverSection("quiz", wishes.ui ?? wishes.language),
  ].join("\n\n")}\n`;
}

/**
 * The prompt for rounds to add to a quiz: its rounds so far (no question twice), the person's choices.
 * @param quiz - the quiz the rounds are for
 * @param wishes - what the person chose in the form
 */
export function addRoundsPrompt(quiz: Quiz, wishes: QuizWishes): string {
  return `${[
    "# Add rounds to a Quizzard quiz",
    `You are adding rounds to the quiz "${quiz.name}" made in Quizzard, a free quiz app. You write only the new rounds, as JSON in the format below; the person pastes them into Quizzard, which adds them after the rounds it has.`,
    ...wishSection(wishes, "rounds"),
    "## The quiz so far",
    `It has ${String(quiz.rounds.length)} of at most ${String(l.MAX_ROUNDS)} rounds: write at most ${String(l.MAX_ROUNDS - quiz.rounds.length)} new rounds. Do not repeat a question it already has.\n\n${quizLines(quiz, false)}`,
    ...formatSections("rounds", wishes.specials),
    ...(wishes.pictures ? pictureSection() : []),
    ...qualitySection(),
    ...handOverSection("rounds", wishes.ui ?? wishes.language),
  ].join("\n\n")}\n`;
}

/**
 * The prompt for questions to add to a standard round: the round's questions so far, the person's choices.
 * @param quiz - the quiz
 * @param round - the round the questions are for
 * @param wishes - what the person chose in the form
 */
export function addQuestionsPrompt(quiz: Quiz, round: Round, wishes: QuizWishes): string {
  const own = round.questions.map((question, index) => `${String(index + 1)}. ${question.prompt.replace(/\s+/g, " ").trim()}`).join("\n");
  return `${[
    "# Add questions to a Quizzard round",
    `You are adding questions to the round "${round.name}" of the quiz "${quiz.name}" made in Quizzard, a free quiz app. Its questions get ${String(round.defaults.seconds)} seconds and ${String(round.defaults.points.value)} point(s) each unless one says otherwise. You write only the new questions, as JSON in the format below; the person pastes them into Quizzard, which adds them at the end of the round.`,
    ...wishSection(wishes, "questions"),
    "## The round so far",
    `Do not repeat a question it already has${own === "" ? " (it has none yet)" : ""}.${own === "" ? "" : `\n\n${own}`}`,
    ...formatSections("questions", []),
    ...(wishes.pictures ? pictureSection() : []),
    ...qualitySection(),
    ...handOverSection("questions", wishes.ui ?? wishes.language),
  ].join("\n\n")}\n`;
}
