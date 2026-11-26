// Music under a question (Moni 2026-11-26): a sound that plays while the question's time runs, so the
// teams can talk without the next table hearing them. A question may point at one audio file
// (`music`); several questions may share a file. Only a question whose own file is not a clip can have
// it — an audio or a video question already makes its own sound. The quiz may ask for music on every
// such question (`settings.music`): then the ones without are listed, and a playlist fills them in order.
import type { MediaEntry, Question, Quiz, Round } from "./model.ts";
import { without } from "./ops.ts";
import { type Registries, defaultRegistries } from "./registries.ts";

/** A question that could have music and has none, and where it is. */
export interface WithoutMusic {
  readonly round: Round;
  readonly question: Question;
  /** The round's index in the quiz. */
  readonly roundIndex: number;
  /** The question's index in its round. */
  readonly index: number;
}

/**
 * Whether a question can have music: its kind is known and its own file is not a clip.
 * @param question - the question
 * @param registries - the kinds this version knows
 */
export function canHaveMusic(question: Question, registries: Registries = defaultRegistries): boolean {
  const kind = registries.kinds.get(question.kind);
  return kind !== undefined && kind.mediaType !== "audio" && kind.mediaType !== "video";
}

/**
 * The description of a question's music, when the quiz carries it and it is a sound.
 * @param question - the question
 * @param media - the descriptions kept with the quiz
 */
export function musicOf(question: Question, media: readonly MediaEntry[]): MediaEntry | undefined {
  const id = question.music?.id;
  const entry = id === undefined ? undefined : media.find((candidate) => candidate.id === id);
  return entry?.type === "audio" ? entry : undefined;
}

/**
 * The questions that could have music and have none, in play order.
 * @param quiz - the quiz
 * @param registries - the kinds this version knows
 */
export function questionsWithoutMusic(quiz: Quiz, registries: Registries = defaultRegistries): readonly WithoutMusic[] {
  return quiz.rounds.flatMap((round, roundIndex) =>
    round.questions.flatMap((question, index) => (question.music === undefined && canHaveMusic(question, registries) ? [{ round, question, roundIndex, index }] : [])));
}

/**
 * Gives every question without music one of the songs, in play order; with fewer songs than
 * questions the songs start again from the first. A question that has music keeps it.
 * @param quiz - the quiz
 * @param songIds - the ids of the songs' files, in the order to hand them out
 * @param registries - the kinds this version knows
 */
export function assignMusic(quiz: Quiz, songIds: readonly string[], registries: Registries = defaultRegistries): Quiz {
  if (songIds.length === 0) return quiz;
  let given = 0;
  const rounds = quiz.rounds.map((round) => ({
    ...round,
    questions: round.questions.map((question) => {
      if (question.music !== undefined || !canHaveMusic(question, registries)) return question;
      const id = songIds[given % songIds.length] ?? "";
      given += 1;
      return { ...question, music: { id } };
    }),
  }));
  return given === 0 ? quiz : { ...quiz, rounds };
}

/**
 * Whether the quiz asks for music on every question that can have it.
 * @param quiz - the quiz
 */
export function wantsMusic(quiz: Quiz): boolean {
  return quiz.settings.music === true;
}

/**
 * Sets whether the quiz asks for music on every question that can have it.
 * @param quiz - the quiz
 * @param wanted - on or off
 */
export function setWantsMusic(quiz: Quiz, wanted: boolean): Quiz {
  if (wantsMusic(quiz) === wanted) return quiz;
  return { ...quiz, settings: wanted ? { ...quiz.settings, music: true } : without(quiz.settings, "music") };
}

/**
 * Takes the music off every question and stops asking for it.
 * @param quiz - the quiz
 */
export function clearMusic(quiz: Quiz): Quiz {
  const rounds = quiz.rounds.map((round) => ({ ...round, questions: round.questions.map((question) => without(question, "music")) }));
  return setWantsMusic({ ...quiz, rounds }, false);
}
