// What is wrong with a draft (convert.ts), said so an assistant can fix it by itself: where, which rule,
// and the numbers of the rule. `error` stops the quiz from being made; `fixed` was put right while reading
// (a text cut to its longest length, a number brought into its range) and is only reported. The words come
// in English and Bulgarian: the person reads them in the app's language and sends the same words on to
// their assistant, which reads either.

/** Every rule a draft can break. */
export type DraftCode =
  | "not-object"
  | "wrong-type"
  | "no-rounds"
  | "too-many-rounds"
  | "rounds-room"
  | "unknown-round-type"
  | "no-questions"
  | "too-many-questions"
  | "questions-room"
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
  | "picture-not-commons"
  | "picture-not-found"
  | "picture-not-image"
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

/** The languages the messages come in. */
export type IssueLang = "en" | "bg";

/** The words of a language: each rule with `{name}` where a value goes, the places and the message's first line. */
interface IssueWords {
  readonly rules: Readonly<Record<DraftCode, string>>;
  readonly round: string;
  readonly question: string;
  /** The message's first line — the same in every job, the prompts name it — and what to send again, per job. */
  readonly head: string;
  readonly again: Readonly<Record<IssueTarget, string>>;
}

/** What the assistant was asked for: a whole quiz, rounds to add, questions to add. */
export type IssueTarget = "quiz" | "rounds" | "questions";

const EN: IssueWords = {
  round: "Round {round}",
  question: "question {question}",
  head: "Quizzard could not take the quiz.",
  again: {
    quiz: "Fix these problems and send the whole quiz again (in several code blocks if it is long, as before):",
    rounds: "Fix these problems and send ALL the new rounds again, as one list in one code block — not the quiz's own rounds:",
    questions: "Fix these problems and send ALL the new questions again, as { \"questions\": [ … ] } in one code block:",
  },
  rules: {
    "not-object": "The quiz must be one JSON object with a \"rounds\" list.",
    "wrong-type": "This must be {expected}.",
    "no-rounds": "The quiz has no rounds. Add at least one round to \"rounds\".",
    "too-many-rounds": "Rounds in a quiz: at most {max}; this one has {found}. Remove or merge rounds.",
    "rounds-room": "New rounds that still fit in the quiz: {room} (at most {max} in all); sent: {found}. Send fewer.",
    "unknown-round-type": "Unknown round type \"{type}\". Use one of: {allowed}.",
    "no-questions": "This round has no questions. Add at least one question to \"questions\".",
    "too-many-questions": "Questions in a round: at most {max}; this one has {found}. Split it into two rounds.",
    "questions-room": "New questions that still fit in the round: {room} (at most {max} in all); sent: {found}. Send fewer.",
    "wrong-count": "Questions in a \"{type}\" round: exactly {expected}; this one has {found}.",
    "question-no-text": "The question has no text. Put the question in \"q\".",
    "answer-missing": "The question has no answer. Give \"a\" (a text, or true / false), or \"options\" with \"correct\".",
    "options-count": "Options of a multiple-choice question: {min} to {max}; this one has {found}.",
    "option-empty": "Option {option} is empty. Every option needs a text.",
    "correct-missing": "No option is marked as right. Set \"correct\" to the number of the right option (the first is 1), or a list of numbers.",
    "correct-unknown": "\"correct\" is \"{value}\", which does not name one option. Write the option's number without quotes (the first option is 1).",
    "accepted-too-few": "Answers this Golden pyramid question asks for: {needed}, so \"accepted\" must list at least that many; it lists {found}.",
    "digit-invalid": "A Safe question is answered with one digit. Set \"digit\" to a whole number from 0 to 9.",
    "task-no-text": "A free game needs its task. Put what the teams must do in \"text\".",
    "picture-not-commons": "\"{value}\" is not a file of Wikimedia Commons. Give the exact file name from commons.wikimedia.org (\"File:….jpg\"), or leave the picture out.",
    "picture-not-found": "There is no file \"{title}\" on Wikimedia Commons. Open commons.wikimedia.org, find a picture that exists and copy its exact file name — never guess one. If you cannot open the site, leave the picture out.",
    "picture-not-image": "\"{title}\" on Wikimedia Commons is not a picture Quizzard can show. Choose a photo or a drawing (JPEG, PNG, WebP or GIF).",
    "name-missing": "The name was missing; \"{used}\" was used.",
    "list-too-long": "Entries a list may have: {max}; only the first {max} were kept.",
    "field-ignored": "\"{field}\" is not used in a \"{type}\" round and was left out.",
    "text-too-long": "The text was longer than {max} characters and was cut. Shorten it.",
    "number-out-of-range": "{value} is not allowed here (whole numbers from {min} to {max}, in steps of {step}); {used} was used.",
    "language-unknown": "Language \"{value}\" is not supported; \"{used}\" was used. Use \"en\" or \"bg\".",
  },
};

const BG: IssueWords = {
  round: "Рунд {round}",
  question: "въпрос {question}",
  head: "Quizzard не можа да приеме куиза.",
  again: {
    quiz: "Поправи тези проблеми и изпрати целия куиз отново (в няколко блока с код, ако е дълъг, както преди):",
    rounds: "Поправи тези проблеми и изпрати ВСИЧКИ нови рундове отново, като един списък в един блок с код — не рундовете, които куизът вече има:",
    questions: "Поправи тези проблеми и изпрати ВСИЧКИ нови въпроси отново, като { \"questions\": [ … ] } в един блок с код:",
  },
  rules: {
    "not-object": "Куизът трябва да е един JSON обект със списък \"rounds\".",
    "wrong-type": "Тук трябва да има {expected}.",
    "no-rounds": "Куизът няма рундове. Добави поне един рунд в \"rounds\".",
    "too-many-rounds": "Рундове в един куиз: най-много {max}; в този са {found}. Махни или слей рундове.",
    "rounds-room": "Нови рундове, които още се побират в куиза: {room} (най-много {max} общо); изпратени: {found}. Изпрати по-малко.",
    "unknown-round-type": "Непознат вид рунд \"{type}\". Използвай един от: {allowed}.",
    "no-questions": "Този рунд няма въпроси. Добави поне един въпрос в \"questions\".",
    "too-many-questions": "Въпроси в един рунд: най-много {max}; в този са {found}. Раздели го на два рунда.",
    "questions-room": "Нови въпроси, които още се побират в рунда: {room} (най-много {max} общо); изпратени: {found}. Изпрати по-малко.",
    "wrong-count": "Въпроси в рунд от вида \"{type}\": точно {expected}; в този са {found}.",
    "question-no-text": "Въпросът няма текст. Сложи въпроса в \"q\".",
    "answer-missing": "Въпросът няма отговор. Дай \"a\" (текст или true / false) или \"options\" с \"correct\".",
    "options-count": "Възможни отговори на въпрос с избор: от {min} до {max}; в този са {found}.",
    "option-empty": "Отговор {option} е празен. Всеки възможен отговор трябва да има текст.",
    "correct-missing": "Нито един отговор не е отбелязан като верен. Сложи в \"correct\" номера на верния отговор (първият е 1) или списък с номера.",
    "correct-unknown": "\"correct\" е \"{value}\", което не посочва един от отговорите. Напиши номера на отговора без кавички (първият е 1).",
    "accepted-too-few": "Отговори, които този въпрос от Златната пирамида иска: {needed}, затова \"accepted\" трябва да изброи поне толкова; изброява {found}.",
    "digit-invalid": "На въпрос от Сейфа се отговаря с една цифра. Сложи в \"digit\" цяло число от 0 до 9.",
    "task-no-text": "Свободната игра има нужда от задача. Напиши в \"text\" какво правят отборите.",
    "picture-not-commons": "\"{value}\" не е файл от Wikimedia Commons. Дай точното име на файла от commons.wikimedia.org (\"File:….jpg\") или махни снимката.",
    "picture-not-found": "В Wikimedia Commons няма файл \"{title}\". Отвори commons.wikimedia.org, намери снимка, която съществува, и копирай точното ѝ име — никога не го измисляй. Ако не можеш да отвориш сайта, махни снимката.",
    "picture-not-image": "\"{title}\" в Wikimedia Commons не е изображение, което Quizzard може да покаже. Избери снимка или рисунка (JPEG, PNG, WebP или GIF).",
    "name-missing": "Липсваше име; използвано е \"{used}\".",
    "list-too-long": "Записи, които един списък може да има: {max}; запазени са първите {max}.",
    "field-ignored": "\"{field}\" не се използва в рунд от вида \"{type}\" и е пропуснато.",
    "text-too-long": "Текстът беше по-дълъг от {max} знака и е съкратен. Скъси го.",
    "number-out-of-range": "{value} не е позволено тук (цели числа от {min} до {max}, през {step}); използвано е {used}.",
    "language-unknown": "Езикът \"{value}\" не се поддържа; използван е \"{used}\". Използвай \"en\" или \"bg\".",
  },
};

const WORDS: Readonly<Record<IssueLang, IssueWords>> = { en: EN, bg: BG };

/** Puts the values in place of `{name}`. */
function fill(text: string, values: IssueValues): string {
  return text.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = values[name];
    return value === undefined ? placeholder : String(value);
  });
}

/** "Round 3, question 2: " — where an issue is, for a person and for an assistant. */
function placeOf(values: IssueValues, words: IssueWords): string {
  const round = values["round"] === undefined ? "" : fill(words.round, values);
  const question = values["question"] === undefined ? "" : fill(words.question, values);
  const place = [round, question].filter((part) => part !== "").join(", ");
  return place === "" ? "" : `${place.charAt(0).toUpperCase()}${place.slice(1)}: `;
}

/**
 * An issue as one sentence that names the place, the rule and the fix.
 * @param issue - the issue
 * @param lang - the language of the words (English unless said)
 */
export function issueText(issue: DraftIssue, lang: IssueLang = "en"): string {
  const words = WORDS[lang];
  return `${placeOf(issue.values, words)}${fill(words.rules[issue.code], issue.values)} (${issue.path === "" ? "quiz" : issue.path})`;
}

/**
 * The message a person sends back to their assistant: every error, then what to do; `""` when nothing must be fixed.
 * @param issues - what the reading found
 * @param lang - the language of the words (English unless said)
 * @param target - what the assistant was asked for (a whole quiz unless said)
 */
export function issuesForAssistant(issues: readonly DraftIssue[], lang: IssueLang = "en", target: IssueTarget = "quiz"): string {
  const errors = issues.filter((issue) => issue.level === "error");
  if (errors.length === 0) return "";
  const words = WORDS[lang];
  return [`${words.head} ${words.again[target]}`, ...errors.map((issue) => `- ${issueText(issue, lang)}`)].join("\n");
}
