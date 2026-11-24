// The only file that lists the round kinds the slide draws in their own way (SPEC §10). A round kind
// without an entry (standard, or one from a later Quizzard) is drawn as a standard round.
import type { SlideRound } from "../registry.ts";
import { pyramidRoundSlide } from "./pyramid.ts";
import { safeRoundSlide } from "./safe.ts";

export { pyramidFigure, tierState } from "./pyramid.ts";
export { dialAngle, vaultState } from "./safe.ts";
export { vaultFigure } from "./vault.ts";

/** Every special round kind the slide has parts for. */
export const roundSlides: readonly SlideRound[] = [pyramidRoundSlide, safeRoundSlide];
