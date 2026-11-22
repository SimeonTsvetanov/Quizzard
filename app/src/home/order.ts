// Card order of the Home launcher (SPEC F1): the mini-app used last comes first, then the other
// ready ones in registry order, then every "coming" card. Pure, so home.ts only renders it.
import type { MiniAppEntry } from "@simeonts/quizzard-core";

/**
 * Returns the registry in Home order; the input is not changed.
 * @param entries - the registry lines in registry order
 * @param lastUsedId - id of the mini-app opened last (saved pref), `null` when none; an id that is
 *   unknown or belongs to a "coming" entry changes nothing
 * @returns the same entries: ready ones (last used first, then registry order), then coming ones
 */
export function orderForHome(entries: readonly MiniAppEntry[], lastUsedId: string | null): MiniAppEntry[] {
  const ready = entries.filter((entry) => entry.meta.status === "ready");
  const coming = entries.filter((entry) => entry.meta.status === "coming");
  const lastUsed = ready.find((entry) => entry.meta.id === lastUsedId);
  if (lastUsed === undefined) return [...ready, ...coming];
  return [lastUsed, ...ready.filter((entry) => entry !== lastUsed), ...coming];
}
