// Validates the shell's mini-app registry (PLAN §1.4): ids, contract version, status vs `load`
// and non-overlapping storage areas. Run by the app's registry test and at start in development.
import { CONTRACT_VERSION, type MiniAppEntry, type StorageArea } from "./contract.js";
import { isRouteSlug } from "./route.js";

/**
 * Ids a mini-app may not take: the shell's dialog and anchor hashes (`#help`, `#main` …) and
 * words that would read as shell routes. Keeps `#/<id>` and `#<dialog>` from ever being confused.
 */
export const RESERVED_IDS: readonly string[] = [
  "help", "settings", "about", "whats-new", "report", "install", "share", "main", "home", "shell",
];

/** Stable codes of `validateRegistry` errors. */
export type RegistryErrorCode =
  | "MINIAPP_ID_INVALID"
  | "MINIAPP_ID_RESERVED"
  | "MINIAPP_ID_DUPLICATE"
  | "MINIAPP_CONTRACT_VERSION"
  | "MINIAPP_STATUS_LOAD"
  | "STORAGE_AREA_INVALID"
  | "STORAGE_AREA_OVERLAP";

/** One registry problem; `message` names the mini-app(s) and what to change. */
export interface RegistryError {
  readonly code: RegistryErrorCode;
  readonly message: string;
}

/** `validateRegistry` result: the entries when valid, otherwise every problem found. */
export type RegistryResult =
  | { readonly ok: true; readonly value: readonly MiniAppEntry[] }
  | { readonly ok: false; readonly errors: readonly [RegistryError, ...RegistryError[]] };

/**
 * Checks the registry before the shell trusts it.
 * @param entries - the registry lines in Home order
 * @param shellArea - the shell's own storage area (`quizzard:v1:`), checked like a mini-app's
 * @returns `ok` with the same entries, or all errors at once so one run shows every fix
 */
export function validateRegistry(entries: readonly MiniAppEntry[], shellArea: StorageArea): RegistryResult {
  const errors = [...entries.flatMap(entryErrors), ...duplicateIdErrors(entries), ...storageErrors(entries, shellArea)];
  const [first, ...rest] = errors;
  return first === undefined ? { ok: true, value: entries } : { ok: false, errors: [first, ...rest] };
}

function entryErrors(entry: MiniAppEntry): RegistryError[] {
  const { id, status } = entry.meta;
  const errors: RegistryError[] = [];
  if (!isRouteSlug(id)) {
    errors.push(error("MINIAPP_ID_INVALID", `Mini-app id ${JSON.stringify(id)} must match ^[a-z][a-z0-9-]*$ (≤ 40 characters).`));
  } else if (RESERVED_IDS.includes(id)) {
    errors.push(error("MINIAPP_ID_RESERVED", `Mini-app id "${id}" is reserved by the shell; choose another id.`));
  }
  // Widened to number because a vendored mini-app may be built against another contract.
  const contract: number = entry.meta.contract;
  if (contract !== CONTRACT_VERSION) {
    errors.push(error("MINIAPP_CONTRACT_VERSION", `Mini-app "${id}" uses contract ${String(contract)}; this shell supports ${String(CONTRACT_VERSION)}.`));
  }
  if (status === "ready" && entry.load === undefined) {
    errors.push(error("MINIAPP_STATUS_LOAD", `Mini-app "${id}" is "ready" but has no load(); add it or mark it "coming".`));
  }
  if (status === "coming" && entry.load !== undefined) {
    errors.push(error("MINIAPP_STATUS_LOAD", `Mini-app "${id}" is "coming" but has load(); remove it or mark it "ready".`));
  }
  return errors;
}

function duplicateIdErrors(entries: readonly MiniAppEntry[]): RegistryError[] {
  const seen = new Set<string>();
  const reported = new Set<string>();
  for (const { meta } of entries) {
    if (seen.has(meta.id)) reported.add(meta.id);
    seen.add(meta.id);
  }
  return [...reported].map((id) => error("MINIAPP_ID_DUPLICATE", `Mini-app id "${id}" is used more than once; ids must be unique.`));
}

function storageErrors(entries: readonly MiniAppEntry[], shellArea: StorageArea): RegistryError[] {
  const owned: OwnedArea[] = [
    { owner: "the shell", area: shellArea },
    ...entries.map((entry) => ({ owner: `mini-app "${entry.meta.id}"`, area: entry.meta.storage })),
  ];
  const invalid = owned
    .filter(({ area }) => !isUsableArea(area))
    .map(({ owner }) => error("STORAGE_AREA_INVALID", `The storage area of ${owner} has an empty prefix, key, database or folder name.`));
  const overlaps = storageOverlaps(owned).map((message) => error("STORAGE_AREA_OVERLAP", message));
  return [...invalid, ...overlaps];
}

/** An empty prefix would own every key of the origin; empty names are typos. */
function isUsableArea(area: StorageArea): boolean {
  const names = [area.prefix, ...(area.extraKeys ?? []), ...(area.databases ?? [])];
  if (area.opfsDir !== undefined) names.push(area.opfsDir);
  return names.every((name) => name !== "");
}

/** A storage area with a readable owner name for messages. */
interface OwnedArea {
  readonly owner: string;
  readonly area: StorageArea;
}

/** Messages for every pair of areas that share a key, key prefix, database or OPFS folder. */
function storageOverlaps(owned: readonly OwnedArea[]): string[] {
  return owned.flatMap((a, index) => owned.slice(index + 1).flatMap((b) => pairOverlaps(a, b)));
}

function pairOverlaps(a: OwnedArea, b: OwnedArea): string[] {
  const between = `${a.owner} and ${b.owner}`;
  const messages: string[] = [];
  if (a.area.prefix.startsWith(b.area.prefix) || b.area.prefix.startsWith(a.area.prefix)) {
    messages.push(`Storage prefixes "${a.area.prefix}" and "${b.area.prefix}" of ${between} overlap; one must not start with the other.`);
  }
  for (const key of sharedKeys(a.area, b.area)) {
    messages.push(`Storage key "${key}" belongs to both ${between}; each key has one owner.`);
  }
  for (const name of intersect(a.area.databases ?? [], b.area.databases ?? [])) {
    messages.push(`IndexedDB database "${name}" is declared by both ${between}.`);
  }
  if (a.area.opfsDir !== undefined && a.area.opfsDir === b.area.opfsDir) {
    messages.push(`OPFS folder "${a.area.opfsDir}" is declared by both ${between}.`);
  }
  return messages;
}

/** Extra keys of one area that equal the other's extra keys or fall inside its prefix. */
function sharedKeys(a: StorageArea, b: StorageArea): string[] {
  const aKeys = a.extraKeys ?? [];
  const bKeys = b.extraKeys ?? [];
  const keys = [
    ...intersect(aKeys, bKeys),
    ...aKeys.filter((key) => key.startsWith(b.prefix)),
    ...bKeys.filter((key) => key.startsWith(a.prefix)),
  ];
  return [...new Set(keys)];
}

function intersect(a: readonly string[], b: readonly string[]): string[] {
  return [...new Set(a.filter((value) => b.includes(value)))];
}

function error(code: RegistryErrorCode, message: string): RegistryError {
  return { code, message };
}
