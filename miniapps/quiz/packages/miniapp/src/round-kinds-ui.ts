// The round kinds' faces in the creator (SPEC §10): name, icon, one sentence for the chooser, the rules
// text a new round of the kind starts with, why its questions are fixed and how its points read. The
// screens look a kind up here by its id and never switch on it; a kind without an entry is shown by
// its id, as a question kind is.
import { type Registry, type RegistryEntry, type Round, createRegistry } from "@simeonts/quizzard-quiz-core";
import type { App } from "./app/state.ts";
import { h } from "./dom/h.ts";
import { type IconName, icon } from "./dom/icons.ts";
import type { TextKey } from "./i18n/translate.ts";

/** A round kind in the creator. */
export interface RoundKindUi extends RegistryEntry {
  readonly label: TextKey;
  /** One sentence for the chooser. */
  readonly text: TextKey;
  readonly icon: IconName;
  /** The rules text a new round starts with, in the quiz's language; `{{bonus}}` is filled in. */
  readonly rules?: TextKey;
  /** Why the round's questions cannot be added, removed or moved: said where those controls would be. */
  readonly fixed?: TextKey;
  /** How the round's points read, in place of the points fields. */
  readonly points?: TextKey;
  /** The whole numbers the kind keeps in the round's own data (a prize, the most points), each a stepper in the round's settings. */
  readonly values?: readonly { readonly key: string; readonly label: TextKey }[];
}

/** The creator's round kinds, in the chooser's order. */
export const roundKindUis: Registry<RoundKindUi> = createRegistry<RoundKindUi>([
  { id: "standard", label: "roundKind.standard", text: "roundKind.standardText", icon: "standard" },
  { id: "pyramid", label: "roundKind.pyramid", text: "roundKind.pyramidText", icon: "pyramid", rules: "roundKind.pyramidRules", fixed: "roundKind.pyramidFixed", points: "roundKind.pyramidPoints" },
  { id: "safe", label: "roundKind.safe", text: "roundKind.safeText", icon: "safe", rules: "roundKind.safeRules", fixed: "roundKind.safeFixed", points: "roundKind.safePoints" },
  { id: "laugh", label: "roundKind.laugh", text: "roundKind.laughText", icon: "laugh", rules: "roundKind.laughRules", fixed: "roundKind.laughFixed", points: "roundKind.laughPoints", values: [{ key: "first", label: "roundKind.laughFirst" }, { key: "second", label: "roundKind.laughSecond" }] },
  { id: "task", label: "roundKind.task", text: "roundKind.taskText", icon: "task", rules: "roundKind.taskRules", fixed: "roundKind.taskFixed", points: "roundKind.taskPoints", values: [{ key: "points", label: "roundKind.taskMost" }] },
]);

/**
 * A round kind's name in the UI language; the id itself for a kind without a face.
 * @param app - gives the translator
 * @param kind - the round kind's id
 */
export function roundKindName(app: Pick<App, "t">, kind: string): string {
  const entry = roundKindUis.get(kind);
  return entry ? app.t(entry.label) : kind;
}

/**
 * The badge of a special round: its icon and name in its accent; nothing for a standard round.
 * @param app - gives the translator
 * @param round - the round
 */
export function kindBadge(app: Pick<App, "t">, round: Round): HTMLElement | null {
  const entry = roundKindUis.get(round.kind);
  if (entry?.fixed === undefined) return null;
  return h("span", { class: "quiz-round-kind", "data-round-kind": round.kind }, icon(entry.icon, 16), h("span", {}, app.t(entry.label)));
}
