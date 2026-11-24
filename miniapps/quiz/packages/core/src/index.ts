/**
 * @simeonts/quizzard-quiz-core — the quiz creator's pure logic: the quiz format and its validation,
 * the registries of question kinds, answer types and round kinds, migrations, limits and the edits.
 * No DOM, no storage, no clock.
 *
 * Zod and CSP: the schemas are created when this module loads. The page that loads it must have run
 * `config({ jitless: true })` on the same Zod instance first (the shell's `zod-setup.ts`; the player
 * needs its own), because Zod otherwise probes `new Function`, which the Content-Security-Policy
 * blocks. So this package never configures Zod itself and stays on the repo's one Zod version.
 */
export * from "./answers/answer-type.ts";
export * from "./answers/choice.ts";
export * from "./answers/open.ts";
export * from "./answers/true-false.ts";
export * from "./effective.ts";
export * from "./export.ts";
export * from "./ids.ts";
export * from "./kinds/audio.ts";
export * from "./kinds/kind.ts";
export * from "./kinds/picture.ts";
export * from "./kinds/text.ts";
export * from "./kinds/video.ts";
export * from "./limits.ts";
export * from "./migrate.ts";
export * from "./model.ts";
export * from "./ops.ts";
export * from "./question-ops.ts";
export * from "./registries.ts";
export * from "./registry.ts";
export * from "./rounds/kinds.ts";
export * from "./rounds/round-kind.ts";
export * from "./rounds/standard.ts";
export * from "./validate.ts";
