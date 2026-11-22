// Real shapes of saved games (the GG Counter formats Scores still reads: version 1, no version, version 2).

// The GG Counter site's keys on the same address: another app's now, never read or written by Scores.
export const STATE_KEY = "gg-counter/state";
export const THEME_KEY = "gg-counter-theme";
export const GG_COUNTER_STATE_KEY = "gg-counter:v1:state";

// Scores' own keys inside Quizzard (packages/miniapp/src/storage/keys.ts).
export const NEW_STATE_KEY = "quizzard-scores:v1:state";
export const NEW_THEME_KEY = "quizzard-scores:v1:theme"; // JSON: "\"light\"" | "\"dark\""; removed for "system"

/** Version 1 — what every current user has. */
export const V1_STATE = {
  players: [
    { id: "a1", name: "Ana", score: 34, createdAt: "2025-12-01T19:00:00.000Z" },
    { id: "b2", name: "Boris", score: 27, createdAt: "2025-12-01T19:00:05.000Z" },
    { id: "c3", name: "Чен", score: -3, createdAt: "2025-12-01T19:00:09.000Z" },
  ],
  lastUpdated: "2025-12-01T21:30:00.000Z",
  version: 1,
};

/** No version field (older builds): players are kept. */
export const V0_STATE = { players: V1_STATE.players.slice(0, 2), lastUpdated: "2025-11-01T10:00:00.000Z" };

/** Entries with wrong field types are dropped, valid ones kept; a numeric string score is accepted. */
export const DIRTY_STATE = {
  players: [{ id: "x", name: "Valid", score: "12", createdAt: "2025-12-01T19:00:00.000Z" }, { id: 7, name: "NoId" }],
  version: 1,
};

/**
 * A `null` entry among the players. The pre-forge app's loader threw on it and showed (then saved) an
 * empty game; since PLAN T-04 the entry is dropped and the valid players survive.
 */
export const NULL_ENTRY_STATE = { players: [V1_STATE.players[0], null], version: 1 };

/** {@link V1_STATE} as GG Counter 1.1 reads it: the same players and scores, empty histories, version 2. */
export const V1_STATE_READ = {
  ...V1_STATE,
  players: V1_STATE.players.map((player) => ({ ...player, history: [] })),
  version: 2,
};

/**
 * Version 2 (GG Counter 1.1, SPEC 1.1 F15) — each player has a score history; `score` stays the total,
 * so Ana's base is 34 − (4 + 12) = 18 and Boris's 27 − (−1) = 28.
 */
export const V2_STATE = {
  players: [
    {
      ...V1_STATE.players[0],
      history: [
        { id: "e1", delta: 4, at: "2025-12-01T21:00:00.000Z" },
        { id: "e2", delta: 12, at: "2025-12-01T21:10:00.000Z" },
      ],
    },
    { ...V1_STATE.players[1], history: [{ id: "e3", delta: -1, at: "2025-12-01T21:20:00.000Z" }] },
    { ...V1_STATE.players[2], history: [] },
  ],
  lastUpdated: "2025-12-01T21:30:00.000Z",
  version: 2,
};
