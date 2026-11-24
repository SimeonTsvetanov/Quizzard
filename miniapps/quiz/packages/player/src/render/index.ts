/**
 * `@simeonts/quizzard-quiz-player/render` — the slide and the drawn halves of kinds and answer types:
 * the code the creator and the player share. It imports the core's `play` entry only (no Zod) and
 * nothing of the player's game, views or windows, so the creator's first open stays small.
 */
export * from "./answers/choice.ts";
export * from "./answers/index.ts";
export * from "./answers/open.ts";
export * from "./answers/true-false.ts";
export * from "./kinds/index.ts";
export * from "./local-media.ts";
export * from "./registry.ts";
export * from "./slide.ts";
