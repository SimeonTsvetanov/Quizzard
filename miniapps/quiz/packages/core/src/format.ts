// The two constants that name the quiz format. Apart from model.ts (which builds the Zod schemas)
// so the export assembler and the player can read them without loading Zod.

/** The `format` field of every quiz file: tells a quiz apart from any other JSON. */
export const QUIZ_FORMAT = "quizzard-quiz";
/** The format version this code writes; older files are migrated up to it, newer ones refused. */
export const QUIZ_VERSION = 1;
