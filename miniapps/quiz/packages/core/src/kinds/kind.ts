// The pure part of a question kind (SPEC §3.2). The creator and the player register the matching UI
// part (form, slide renderer) under the same id in their own registries.
import { z } from "zod";
import type { MediaType, Question, QuestionData } from "../model.ts";
import type { RegistryEntry } from "../registry.ts";

/** A question kind's registry entry: what it stores, what it starts with and how it reads in a list. */
export interface QuestionKind extends RegistryEntry {
  /** The media a question of this kind carries, or `null` for none — tells the editor which picker to show. */
  readonly mediaType: MediaType | null;
  /** Validates `question.data` of this kind (an absent `data` is checked as `{}`). */
  readonly dataSchema: z.ZodType;
  /** The `data` of a new question of this kind; `undefined` when the kind stores nothing of its own. */
  defaultData(): QuestionData | undefined;
  /** One line that names the question in lists and for screen readers. */
  summary(question: Question): string;
  /** Whether the question has everything this kind needs to be played. */
  isComplete(question: Question): boolean;
}

/** The first line of the question text — what the version-1 kinds show in lists. */
function firstLine(question: Question): string {
  return question.prompt.trim().split("\n")[0] ?? "";
}

/**
 * Builds a version-1 kind: text with or without one media file, no data of its own.
 * @param id - the `kind` string stored in the quiz
 * @param mediaType - the file the kind needs, or `null`
 */
export function defineBasicKind(id: string, mediaType: MediaType | null): QuestionKind {
  return {
    id,
    mediaType,
    dataSchema: z.looseObject({}),
    defaultData: () => undefined,
    summary: firstLine,
    isComplete: (question) => (mediaType === null ? question.prompt.trim() !== "" : question.media !== undefined),
  };
}
