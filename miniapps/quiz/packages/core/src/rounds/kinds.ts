// The only file that lists the built-in round kinds. Free of Zod: the creator's registries
// (registries.ts) and the player (play.ts) both build their round registry here.
import { type Registry, createRegistry } from "../registry.ts";
import type { RoundKind } from "./round-kind.ts";
import { standardRound } from "./standard.ts";

/** A fresh registry with the version-1 round kinds. */
export function createRoundKinds(): Registry<RoundKind> {
  return createRegistry<RoundKind>([standardRound]);
}
