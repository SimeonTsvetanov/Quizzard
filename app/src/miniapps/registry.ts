// The shell's mini-app registry (PLAN §1.4): the only file a new mini-app changes. Home order;
// validated by registry.test.ts and at start in development and the e2e build (main.ts).
import { validateRegistry, type MiniAppEntry, type RegistryError, type StorageArea } from "@simeonts/quizzard-core";
import { app } from "../config.ts";
import { getLanguage } from "../i18n/index.ts";
import { e2eEntries } from "./e2e-entries.ts";

/** The shell's own storage area (`quizzard:v1:`); no mini-app area may overlap it. */
export const SHELL_STORAGE_AREA: StorageArea = { prefix: `${app.id}:v1:` };

/**
 * Mini-apps shipped to users, in registry order. All three are "coming" cards until their code lands
 * (PLAN T-10 `teams`, T-12 `scores`); their storage areas are the real keys of the standalone apps
 * (F7): TeamSync's storage module prefix, GG Counter's prefix plus its two pre-forge keys.
 */
const SHIPPED: readonly MiniAppEntry[] = [
  {
    meta: {
      contract: 1,
      id: "teams",
      name: { en: "Teams", bg: "Отбори" },
      tagline: { en: "Fair random teams in seconds", bg: "Честни случайни отбори за секунди" },
      icon: "miniapps/teams.svg",
      languages: ["en", "bg"],
      status: "coming",
      storage: { prefix: "teamsync-random-team-generator:v1:" },
    },
  },
  {
    meta: {
      contract: 1,
      id: "scores",
      name: { en: "Scores", bg: "Точки" },
      tagline: { en: "Keep score on game night", bg: "Резултатът на игралната вечер" },
      icon: "miniapps/scores.svg",
      languages: ["en", "bg"],
      status: "coming",
      storage: { prefix: "gg-counter:v1:", extraKeys: ["gg-counter/state", "gg-counter-theme"] },
    },
  },
  {
    meta: {
      contract: 1,
      id: "quiz",
      name: { en: "Quiz creator", bg: "Създател на куизове" },
      tagline: { en: "Build your own quiz night", bg: "Подгответе своя куиз вечер" },
      icon: "miniapps/quiz.svg",
      languages: ["en", "bg"],
      status: "coming",
      storage: { prefix: "quizzard-quiz:v1:" },
    },
  },
];

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

/**
 * Returns a mini-app's one-line tagline in the UI language, English when it has no translation.
 * @param entry - the registry line
 */
export function miniAppTagline(entry: MiniAppEntry): string {
  return entry.meta.tagline[getLanguage()] ?? entry.meta.tagline.en;
}
