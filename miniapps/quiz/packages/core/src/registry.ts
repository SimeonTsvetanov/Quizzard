// The one registry implementation behind question kinds, answer types, round kinds and (later) player
// looks. Code asks a registry by id instead of switching on a name, so a new entry is the only change
// a new kind needs (PLAN §2 rule 1, AC10).

/** What every registry entry has: the open string stored in the quiz (`kind` or `type`). */
export interface RegistryEntry {
  readonly id: string;
}

/** A set of entries by id, in the order they were registered (the order pickers show them in). */
export interface Registry<T extends RegistryEntry> {
  /** Adds an entry; throws on a duplicate id, because a silent replace would change saved quizzes' meaning. */
  register(entry: T): void;
  /** The entry of this id, or `undefined` for an id this version does not know. */
  get(id: string): T | undefined;
  /** Whether this version knows the id. */
  has(id: string): boolean;
  /** Every entry, in registration order. */
  list(): readonly T[];
}

/**
 * Creates an empty registry, optionally filled with first entries.
 * @param entries - registered in this order
 */
export function createRegistry<T extends RegistryEntry>(entries: readonly T[] = []): Registry<T> {
  const byId = new Map<string, T>();
  const registry: Registry<T> = {
    register(entry) {
      if (byId.has(entry.id)) throw new Error(`Registry: "${entry.id}" is already registered`);
      byId.set(entry.id, entry);
    },
    get: (id) => byId.get(id),
    has: (id) => byId.has(id),
    list: () => [...byId.values()],
  };
  for (const entry of entries) registry.register(entry);
  return registry;
}
