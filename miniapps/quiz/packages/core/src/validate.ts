// Is this value a version-1 quiz file? The envelope is checked by model.ts; what belongs to a kind
// or an answer type is checked by its registry entry. A kind or type that is not registered is NOT
// an error: its payload is kept as opaque data (SPEC §3.3), so a quiz from a Quizzard that knows
// more kinds opens here and loses nothing when it is saved again.
import { type Question, type QuizFile, quizFileSchema } from "./model.ts";
import { type Registries, defaultRegistries } from "./registries.ts";

/**
 * Whether the payloads of a question fit its kind and its answer type — where those are registered.
 * @param question - a question whose envelope is already valid
 * @param registries - the kinds and answer types this version knows
 */
export function isValidQuestion(question: Question, registries: Registries = defaultRegistries): boolean {
  const kind = registries.kinds.get(question.kind);
  if (kind && !kind.dataSchema.safeParse(question.data ?? {}).success) return false;
  const answer = registries.answers.get(question.answer.type);
  if (answer && !answer.schema.safeParse(question.answer).success) return false;
  return true;
}

/** Whether no id repeats — the ops find rounds and questions by id. */
function areUnique(ids: readonly string[]): boolean {
  return new Set(ids).size === ids.length;
}

/**
 * Whether a value is a valid version-1 quiz file. No limits are checked here (limits.ts explains why).
 * The value itself is what callers keep: nothing is copied, stripped or defaulted.
 * @param value - parsed JSON or a stored record
 * @param registries - the kinds and answer types this version knows
 */
export function isQuizFile(value: unknown, registries: Registries = defaultRegistries): value is QuizFile {
  if (!quizFileSchema.safeParse(value).success) return false;
  // Safe: the schema has no transforms, so the value has exactly the shape it was checked for.
  const file = value as QuizFile;
  const rounds = file.quiz.rounds;
  const questions = rounds.flatMap((round) => round.questions);
  if (!areUnique(rounds.map((round) => round.id)) || !areUnique(questions.map((question) => question.id))) return false;
  if (!areUnique(file.media.map((entry) => entry.id))) return false;
  return questions.every((question) => isValidQuestion(question, registries));
}
