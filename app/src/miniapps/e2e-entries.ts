// Mini-apps only the e2e build registers: none here. The e2e build (app/test/vite.e2e.config.ts)
// swaps this module for app/test/fixtures/probe-entry.ts, so the shell source never imports test
// code and the production bundle never contains it.
import type { MiniAppEntry } from "@simeonts/quizzard-core";

/** Registry lines added after the shipped mini-apps; empty outside the e2e build. */
export const e2eEntries: readonly MiniAppEntry[] = [];
