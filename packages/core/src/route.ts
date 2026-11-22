// Hash routes of the shell (PLAN §1.1 item 6): `#/` = Home, `#/<id>?…` = a mini-app, `#<name>` =
// a shell dialog link or in-page anchor. Used by the app's router; pure, never throws on input.
// `URLSearchParams` is a WHATWG global (browsers, Node), not part of the ES lib core compiles with.
/// <reference lib="dom" />

/** Longest hash the parser reads; longer input is `unknown` (limits on everything). */
export const MAX_HASH_LENGTH = 2048;

/** A mini-app id or dialog name: a lower-case kebab slug that starts with a letter. */
const SLUG_PATTERN = /^[a-z][a-z0-9-]*$/;
/** Longest mini-app id or dialog name. */
const MAX_SLUG_LENGTH = 40;

/** The Home screen (`#/` or no hash). */
export interface HomeRoute {
  readonly kind: "home";
}
/** A mini-app screen; `query` carries its launch parameters (`#/teams?teams=4`). */
export interface MiniAppRoute {
  readonly kind: "miniapp";
  readonly id: string;
  readonly query: URLSearchParams;
}
/**
 * A bare `#<name>` fragment: a shell dialog link (`#help`, `#settings`) or an in-page anchor
 * (the skip link `#main`). The shell opens it when it is one of its dialogs and otherwise keeps
 * the current screen, so following an anchor never leaves a mini-app.
 */
export interface DialogRoute {
  readonly kind: "dialog";
  readonly name: string;
}
/** Every route a link can point to (`routeHref` input). */
export type Route = HomeRoute | MiniAppRoute | DialogRoute;
/** Anything else (unknown id, extra path, hostile text): the router goes Home. */
export interface UnknownRoute {
  readonly kind: "unknown";
}
/** Result of `parseRoute`. */
export type ParsedRoute = Route | UnknownRoute;

const UNKNOWN: UnknownRoute = { kind: "unknown" };

/**
 * Tells whether a text is a valid mini-app id or dialog name (`^[a-z][a-z0-9-]*$`, ≤ 40 chars).
 * @param value - the candidate id
 * @returns `true` when it can be used as a route segment as is
 */
export function isRouteSlug(value: string): boolean {
  return value.length <= MAX_SLUG_LENGTH && SLUG_PATTERN.test(value);
}

/**
 * Parses `location.hash` into a route.
 * @param hash - the hash with or without its leading `#`
 * @param knownIds - ids of the registered mini-apps; no other id is ever returned
 * @returns the route; `unknown` for anything that is not exactly one of the known forms
 * @example parseRoute("#/teams?teams=4", ["teams"]) // { kind: "miniapp", id: "teams", query }
 */
export function parseRoute(hash: string, knownIds: readonly string[]): ParsedRoute {
  if (hash.length > MAX_HASH_LENGTH) return UNKNOWN;
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  if (fragment === "") return { kind: "home" };
  if (!fragment.startsWith("/")) {
    return isRouteSlug(fragment) ? { kind: "dialog", name: fragment } : UNKNOWN;
  }
  const queryStart = fragment.indexOf("?");
  const path = queryStart === -1 ? fragment.slice(1) : fragment.slice(1, queryStart);
  // The id is compared as written, never percent-decoded, so `%2F`, `..` or encoded letters
  // cannot reach a mini-app or a path outside the registry.
  if (path === "") return { kind: "home" };
  if (!isRouteSlug(path) || !knownIds.includes(path)) return UNKNOWN;
  const query = new URLSearchParams(queryStart === -1 ? "" : fragment.slice(queryStart + 1));
  return { kind: "miniapp", id: path, query };
}

/**
 * Builds the hash for a route; the inverse of `parseRoute`.
 * @param route - the target; its id or name must pass `isRouteSlug`
 * @returns the hash including `#`, e.g. `"#/teams?teams=4"`
 * @throws {@link Error} when the id or name is not a route slug (a programming error)
 */
export function routeHref(route: Route): string {
  switch (route.kind) {
    case "home":
      return "#/";
    case "miniapp": {
      assertSlug(route.id);
      const query = route.query.toString();
      return query === "" ? `#/${route.id}` : `#/${route.id}?${query}`;
    }
    case "dialog":
      assertSlug(route.name);
      return `#${route.name}`;
    default:
      return assertNever(route);
  }
}

function assertSlug(value: string): void {
  if (!isRouteSlug(value)) throw new Error(`Not a route slug: ${JSON.stringify(value.slice(0, MAX_SLUG_LENGTH))}`);
}

function assertNever(value: never): never {
  throw new Error(`Unexpected route: ${JSON.stringify(value)}`);
}
