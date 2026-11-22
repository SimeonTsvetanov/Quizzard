/**
 * @simeonts/quizzard-core — the app's pure logic. No DOM, no framework, no I/O.
 * Public entry: the mini-app contract, registry validation and the hash route parser.
 */
export {
  CONTRACT_VERSION,
  type HelpSection,
  type Lang,
  type MiniAppContext,
  type MiniAppEntry,
  type MiniAppMeta,
  type MiniAppModule,
  type Signal,
  type StorageArea,
  type Text,
  type Unmount,
  type Unsubscribe,
} from "./contract.js";
export { RESERVED_IDS, validateRegistry, type RegistryError, type RegistryErrorCode, type RegistryResult } from "./registry.js";
export {
  MAX_HASH_LENGTH,
  isRouteSlug,
  parseRoute,
  routeHref,
  type DialogRoute,
  type HomeRoute,
  type MiniAppRoute,
  type ParsedRoute,
  type Route,
  type UnknownRoute,
} from "./route.js";
export { MAX_PREF_KEY_LENGTH, isPrefKey } from "./storage-area.js";
