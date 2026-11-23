// The pure part of a round kind (SPEC §3.2): which screens the round produces in the player.
import type { Round } from "../model.ts";
import type { RegistryEntry } from "../registry.ts";

/**
 * One step of the played quiz. `screen` is an open string like `kind`: a later round kind may add its
 * own screens (a wheel, a hint) and register their renderer in the player.
 */
export interface PlayerScreen {
  readonly screen: string;
  readonly roundId: string;
  /** The question shown or revealed, on the screens that have one. */
  readonly questionId?: string;
}

/** A round kind's registry entry. */
export interface RoundKind extends RegistryEntry {
  /** The round's screens in the order the host plays them. */
  screens(round: Round): readonly PlayerScreen[];
}
