// The shell's mini-app registry (PLAN §1.4): the only file a new mini-app changes. Home order;
// validated by registry.test.ts and at start in development and the e2e build (main.ts).
import { validateRegistry, type MiniAppEntry, type RegistryError, type StorageArea } from "@simeonts/quizzard-core";
import { app } from "../config.ts";
import { getLanguage } from "../i18n/index.ts";
import { e2eEntries } from "./e2e-entries.ts";

/** The shell's own storage area (`quizzard:v1:`); no mini-app area may overlap it. */
export const SHELL_STORAGE_AREA: StorageArea = { prefix: `${app.id}:v1:` };

/** Mini-apps shipped to users. The "teams", "scores" and "quiz" cards come with T-07/T-10/T-12. */
const SHIPPED: readonly MiniAppEntry[] = [];

/** Every registered mini-app; the e2e build adds the routing probe (see e2e-entries.ts). */
export const miniApps: readonly MiniAppEntry[] = [...SHIPPED, ...e2eEntries];

/**
 * Lists every problem of a registry (`validateRegistry` against the shell's storage area).
 * @param entries - the registry to check; the app's own by default
 * @returns no items when the registry is valid
 */
export function registryErrors(entries: readonly MiniAppEntry[] = miniApps): readonly RegistryError[] {
  const result = validateRegistry(entries, SHELL_STORAGE_AREA);
  return result.ok ? [] : result.errors;
}

/** Ids of the mini-apps that can be opened (a "coming" card has nothing to load). */
export function openableIds(entries: readonly MiniAppEntry[] = miniApps): readonly string[] {
  return entries.filter((entry) => entry.meta.status === "ready").map((entry) => entry.meta.id);
}

/**
 * Returns a mini-app's name in the UI language, English when it has no translation.
 * @param entry - the registry line
 */
export function miniAppName(entry: MiniAppEntry): string {
  return entry.meta.name[getLanguage()] ?? entry.meta.name.en;
}
