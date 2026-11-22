// The shell's mini-app registry (PLAN §1.4): the only file a new mini-app changes. Home order;
// validated by registry.test.ts and at start in development and the e2e build (main.ts).
import { validateRegistry, type MiniAppEntry, type RegistryError, type StorageArea } from "@simeonts/quizzard-core";
import { ATTRIBUTION_NAME_PARAM, ATTRIBUTION_URL_PARAM, TEAMS_PARAM } from "@simeonts/teamsync-random-team-generator-miniapp/host-api";
import { meta as teamsMeta } from "@simeonts/teamsync-random-team-generator-miniapp/meta";
import { meta as scoresMeta } from "gg-counter-miniapp/meta";
import { app } from "../config.ts";
import { getLanguage } from "../i18n/index.ts";
import { e2eEntries } from "./e2e-entries.ts";

/** The shell's own storage area (`quizzard:v1:`); no mini-app area may overlap it. */
export const SHELL_STORAGE_AREA: StorageArea = { prefix: `${app.id}:v1:` };

/**
 * Mini-apps shipped to users, in registry order. A vendored mini-app's line takes its package's own
 * `meta` (id, names, tagline, icon path, languages, storage area — one source, PLAN §1.1 item 2) and
 * loads its body and Help lazily; its storage area is the standalone site's real keys (F7) — for GG
 * Counter its prefix plus its two pre-forge keys. The "coming" card stays hand-written until its code
 * lands.
 */
const SHIPPED: readonly MiniAppEntry[] = [
  {
    meta: teamsMeta,
    load: () => import("@simeonts/teamsync-random-team-generator-miniapp"),
    help: () => import("@simeonts/teamsync-random-team-generator-miniapp/help"),
  },
  {
    meta: scoresMeta,
    load: () => import("gg-counter-miniapp"),
    help: () => import("gg-counter-miniapp/help"),
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

/**
 * The launch parameters Quizzard passes on to a mini-app (`context.query`), from each package's
 * host API; the rest of a route's query stays out. TeamSync's `shared` (Android share target) and
 * embed mode belong to its standalone site (PLAN §2: none in Quizzard v1), so `#/teams?shared=…`
 * never fills its list. GG Counter's screen reads no launch parameter (its host-api lists none), so
 * `scores` gets an empty query. A mini-app without a line here gets the whole query.
 */
const LAUNCH_PARAMS: Readonly<Partial<Record<string, readonly string[]>>> = { teams: [TEAMS_PARAM], scores: [] };

/**
 * Parameters Quizzard adds on its own (never read from the address): Teams names the app in the last
 * line of copied and shared teams, so inside Quizzard that line says Quizzard and links here
 * (TeamSync host API; DECISIONS 2026-11-22).
 */
const HOST_PARAMS: Readonly<Partial<Record<string, readonly (readonly [string, string])[]>>> = {
  teams: [[ATTRIBUTION_NAME_PARAM, app.name], [ATTRIBUTION_URL_PARAM, app.url]],
};

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

/**
 * Returns the launch parameters of a route that the mini-app takes from Quizzard.
 * @param entry - the registry line
 * @param query - the query of the route (`#/<id>?…`)
 * @returns a new object; only the parameters listed for the mini-app, all of them when none are listed
 */
export function launchQuery(entry: MiniAppEntry, query: URLSearchParams): URLSearchParams {
  const allowed = LAUNCH_PARAMS[entry.meta.id];
  const fromRoute = allowed === undefined ? new URLSearchParams(query) : new URLSearchParams([...query].filter(([name]) => allowed.includes(name)));
  // Set by Quizzard itself, after the filter: a link can never supply or change them.
  for (const [name, value] of HOST_PARAMS[entry.meta.id] ?? []) fromRoute.set(name, value);
  return fromRoute;
}
