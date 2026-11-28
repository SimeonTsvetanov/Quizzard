// The prompt for "Check the answers with AI" (draft/check.ts reads its answer): every question with the
// answer the quiz takes as right, what to report and how to hand it back.
import type { Quiz } from "../model.ts";
import { BUTTONS, LANGUAGE_NAMES } from "./guide.ts";
import { quizLines } from "./quiz-lines.ts";

/**
 * The prompt for a check of a quiz's answers: every question with the answer the quiz takes as right.
 * @param quiz - the quiz
 * @param language - the language the assistant writes its findings in
 */
export function checkPrompt(quiz: Quiz, language: "en" | "bg"): string {
  const buttons = BUTTONS[language];
  return `${[
    "# Check the answers of a quiz",
    `You are checking the quiz "${quiz.name}", made in Quizzard, before it is played. Below is every question with the answer Quizzard will show as right. Check each one carefully, with a web search where you can.`,
    "## What to report",
    "Report a question only when: its answer is wrong or out of date; another answer is also right and is named neither in the answer nor in \"host also accepts\"; a multiple-choice question marks a wrong option as right or a right one as wrong; the question is unclear, misleading or has a mistake in it; its explanation states something wrong; a Golden pyramid list has a wrong answer or misses a common right one; a Safe answer is not the right digit. A question marked [shows … you cannot see] is about that picture, sound or video: judge only its words and its answer. Do not report style or taste.",
    "## Hand it over",
    `Answer with ONE \`\`\`json code block and nothing before it:\n\n\`\`\`json\n{ "check": [ { "round": 2, "question": 3, "problem": "…", "suggestion": "…" } ] }\n\`\`\`\n\n\`round\` and \`question\` are the numbers in the list below; for a problem with a whole round write \`"question": 0\`, and with the whole quiz \`"round": 0\`. Write \`problem\` (what is wrong, with the right fact) and \`suggestion\` (the corrected answer or question) in ${LANGUAGE_NAMES[language]}; a quote inside a text is escaped as JSON asks (\\"). If everything is right, send \`{ "check": [] }\`. After the block write one line in ${LANGUAGE_NAMES[language]}: press Copy on the block, go back to Quizzard, press "${buttons.paste}" and "${buttons.check}".`,
    `## The quiz: ${quiz.name}`,
    quizLines(quiz, true),
  ].join("\n\n")}\n`;
}
