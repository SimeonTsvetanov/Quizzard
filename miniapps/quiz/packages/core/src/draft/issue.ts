// What is wrong with a draft (draft.ts), said so an assistant can fix it by itself: where, which rule, and
// the numbers of the rule. `error` stops the quiz from being made; `fixed` was put right while reading
// (a text cut to its longest length, a number brought into its range) and is only reported.

/** Every rule a draft can break. */
export type DraftCode =
  | "not-object"
  | "wrong-type"
  | "no-rounds"
  | "too-many-rounds"
  | "unknown-round-type"
  | "no-questions"
  | "too-many-questions"
  | "wrong-count"
  | "question-no-text"
  | "answer-missing"
  | "options-count"
  | "option-empty"
  | "correct-missing"
  | "correct-unknown"
  | "accepted-too-few"
  | "digit-invalid"
  | "task-no-text"
  | "name-missing"
  | "list-too-long"
  | "field-ignored"
  | "text-too-long"
  | "number-out-of-range"
  | "language-unknown";

/** Numbers and words of a broken rule, for its message. */
export type IssueValues = Readonly<Record<string, string | number>>;

/** One thing wrong with a draft. */
export interface DraftIssue {
  /** `error`: the quiz cannot be made until it is fixed. `fixed`: put right while reading. */
  readonly level: "error" | "fixed";
  /** Where, as a path into the draft: `rounds[2].questions[0].options`. Places count from 0. */
  readonly path: string;
  readonly code: DraftCode;
  /** `round` and `question` (counted from 1, when the issue is inside one) and the rule's own numbers. */
  readonly values: IssueValues;
}

/** The rule and how to fix it, in English, with `{name}` where a value goes. */
const TEXTS: Readonly<Record<DraftCode, string>> = {
  "not-object": "The quiz must be one JSON object with a \"rounds\" list.",
  "wrong-type": "This must be {expected}.",
  "no-rounds": "The quiz has no rounds. Add at least one round to \"rounds\".",
  "too-many-rounds": "A quiz has at most {max} rounds; this one has {found}. Remove or merge rounds.",
  "unknown-round-type": "Unknown round type \"{type}\". Use one of: {allowed}.",
  "no-questions": "This round has no questions. Add at least one question to \"questions\".",
  "too-many-questions": "A round has at most {max} questions; this one has {found}. Split it into two rounds.",
  "wrong-count": "A \"{type}\" round has exactly {expected} questions; this one has {found}.",
  "question-no-text": "The question has no text. Put the question in \"q\".",
  "answer-missing": "The question has no answer. Give \"a\" (a text, or true / false), or \"options\" with \"correct\".",
  "options-count": "A multiple-choice question has {min} to {max} options; this one has {found}.",
  "option-empty": "Option {option} is empty. Every option needs a text.",
  "correct-missing": "No option is marked as right. Set \"correct\" to the number of the right option (the first is 1), or a list of numbers.",
  "correct-unknown": "\"correct\" is \"{value}\", which does not name one option. Write the option's number without quotes (the first option is 1).",
  "accepted-too-few": "Question {question} of a Golden pyramid asks for {needed} answers, so \"accepted\" must list at least {needed}; it lists {found}.",
  "digit-invalid": "A Safe question is answered with one digit. Set \"digit\" to a whole number from 0 to 9.",
  "task-no-text": "A free game needs its task. Put what the teams must do in \"text\".",
  "name-missing": "The name was missing; \"{used}\" was used.",
  "list-too-long": "The list had more than {max} entries; only the first {max} were kept.",
  "field-ignored": "\"{field}\" is not used in a \"{type}\" round and was left out.",
  "text-too-long": "The text was longer than {max} characters and was cut. Shorten it.",
  "number-out-of-range": "{value} is not allowed here (whole numbers from {min} to {max}, in steps of {step}); {used} was used.",
  "language-unknown": "Language \"{value}\" is not supported; \"{used}\" was used. Use \"en\" or \"bg\".",
};

/** "Round 3, question 2: " — where an issue is, for a person and for an assistant. */
function placeOf(values: IssueValues): string {
  const round = values["round"];
  const question = values["question"];
  if (round === undefined) return "";
  return question === undefined ? `Round ${String(round)}: ` : `Round ${String(round)}, question ${String(question)}: `;
}

/**
 * An issue as one English sentence that names the place, the rule and the fix.
 * @param issue - the issue
 */
export function issueText(issue: DraftIssue): string {
  const text = TEXTS[issue.code].replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = issue.values[name];
    return value === undefined ? placeholder : String(value);
  });
  return `${placeOf(issue.values)}${text} (${issue.path === "" ? "quiz" : issue.path})`;
}

/**
 * The message a person sends back to their assistant: every error, then what to do.
 * @param issues - what {@link DraftIssue} the reading found
 */
export function issuesForAssistant(issues: readonly DraftIssue[]): string {
  const errors = issues.filter((issue) => issue.level === "error");
  if (errors.length === 0) return "";
  return ["Quizzard could not take the quiz. Fix these problems and send the whole quiz again (in several code blocks if it is long, as before):", ...errors.map((issue) => `- ${issueText(issue)}`)].join("\n");
}
