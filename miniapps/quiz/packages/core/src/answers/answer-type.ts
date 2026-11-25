// The pure part of an answer type (SPEC §3.2); its editor and reveal renderer are registered by the UI.
import type { z } from "zod";
import type { IdSource } from "../ids.ts";
import type { Answer } from "../model.ts";
import type { RegistryEntry } from "../registry.ts";

/** Words the core cannot know (it has no i18n): passed in by whoever shows a reveal. */
export interface RevealLabels {
  readonly trueText: string;
  readonly falseText: string;
}

/** An answer type's registry entry: its schema, its empty answer and how it reads. */
export interface AnswerType extends RegistryEntry {
  /** Validates a whole answer object of this type. */
  readonly schema: z.ZodType;
  /** The answer of a new question of this type. */
  defaults(ids: IdSource): Answer;
  /** Whether the author has filled in enough for the question to be played. */
  isComplete(answer: Answer): boolean;
  /** `false` = nothing is revealed (a task): no explanation, no picture with the answer, no "Show answer". Left out = it reveals. */
  readonly reveals?: false;
  /** The correct answer as one line of text, for the reveal and for lists. */
  revealText(answer: Answer, labels: RevealLabels): string;
}
