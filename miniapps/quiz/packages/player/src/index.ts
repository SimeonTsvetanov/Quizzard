/**
 * `@simeonts/quizzard-quiz-player` — the played quiz for a page that hosts it (the creator's "Play").
 * The exported page starts from standalone.ts instead; the slide alone is `./render`.
 */
export * from "./audience.ts";
export * from "./channel.ts";
export * from "./game/create.ts";
export * from "./game/kinds.ts";
export * from "./game/save.ts";
export * from "./game/scores.ts";
export * from "./game/state.ts";
export * from "./game/step.ts";
export type { AudienceLink, GameStorage, Player, PlayerOptions } from "./player-types.ts";
export { createPlayer } from "./play.ts";
export * from "./windows.ts";
