// The only file that lists the built-in round kinds. Free of Zod: the creator's registries
// (registries.ts) and the player (play.ts) both build their round registry here.
import { type Registry, createRegistry } from "../registry.ts";
import type { RoundKind } from "./round-kind.ts";
import { pyramidRound } from "./pyramid.ts";
import { safeRound } from "./safe.ts";
import { standardRound } from "./standard.ts";

/** A fresh registry with the built-in round kinds (standard first: a new round is one unless another is chosen). */
export function createRoundKinds(): Registry<RoundKind> {
  return createRegistry<RoundKind>([standardRound, pyramidRound, safeRound]);
}
