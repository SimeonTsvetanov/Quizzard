// Keys inside a mini-app's storage area (PLAN §1.4). Pure: the app's storage module reads and
// writes; this decides which short pref keys a mini-app may use under its `StorageArea.prefix`.

/** Longest short pref key a mini-app may pass to `context.storage.prefs`. */
export const MAX_PREF_KEY_LENGTH = 64;

/**
 * Letters and digits, with `-`, `_` or `.` only between them. No `:` — it separates the segments of
 * `<id>:v1:<key>`, so a key with it could pose as a nested namespace or another schema version
 * (`v2:state`) that the area's own storage module treats as its own; no `/`, `\`, spaces or
 * control characters either.
 */
const PREF_KEY = /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/;

/**
 * Returns whether `key` may name a preference inside a storage area, where the shell stores it as
 * `area.prefix + key`.
 * @param key - the short key a mini-app passes, e.g. `"theme"`
 */
export function isPrefKey(key: string): boolean {
  return key.length <= MAX_PREF_KEY_LENGTH && PREF_KEY.test(key);
}
