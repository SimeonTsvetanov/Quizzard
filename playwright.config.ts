import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";
import { app } from "./app.config.ts";

// e2e runs in CI (and locally with `pnpm e2e`) against `vite preview` with the real base path
// (app.config.basePath, "/Quizzard/" — not the id).

/**
 * The browsers and devices every suite runs on (engineering → testing §4); the shell's projects
 * keep the device names, a mini-app suite's projects add its prefix.
 */
const DEVICES = [
  { name: "chromium", device: devices["Desktop Chrome"] },
  { name: "webkit", device: devices["Desktop Safari"] },
  { name: "firefox", device: devices["Desktop Firefox"] },
  { name: "mobile-chrome", device: devices["Pixel 7"] },
  { name: "mobile-safari", device: devices["iPhone 15"] },
] as const;

/** Project names of the Teams suite per device: `teams` (desktop Chrome), `teams-mobile` (Pixel 7) … */
const TEAMS_PROJECT_NAMES: Readonly<Record<(typeof DEVICES)[number]["name"], string>> = {
  chromium: "teams",
  webkit: "teams-webkit",
  firefox: "teams-firefox",
  "mobile-chrome": "teams-mobile",
  "mobile-safari": "teams-mobile-safari",
};

/** Project names of the Scores suite per device: `scores` (desktop Chrome), `scores-mobile` (Pixel 7) … */
const SCORES_PROJECT_NAMES: Readonly<Record<(typeof DEVICES)[number]["name"], string>> = {
  chromium: "scores",
  webkit: "scores-webkit",
  firefox: "scores-firefox",
  "mobile-chrome": "scores-mobile",
  "mobile-safari": "scores-mobile-safari",
};

/**
 * TeamSync's own screen flows (PLAN T-11, SPEC AC2), unedited from the submodule; they open the
 * screen through their support/entry.ts and find host UI through support/host.ts. Absolute, so a
 * config that imports this one resolves the same folder.
 */
const TEAMS_SUITE = fileURLToPath(new URL("./vendor/teamsync/tests/e2e/miniapp", import.meta.url));

/**
 * GG Counter's own screen flows (PLAN T-13, SPEC AC2, F14), unedited from the submodule; its helpers
 * (support/entry.ts, support/host.ts) take the host and the route from each project's `metadata`.
 */
const SCORES_SUITE = fileURLToPath(new URL("./vendor/gg-counter/tests/e2e/miniapp", import.meta.url));

/** What GG Counter's helpers read per project (`metadata.host`, `metadata.miniappHash`). */
const SCORES_METADATA = { host: "quizzard", miniappHash: "#/scores" } as const;

// TeamSync's vendored helpers read only these environment variables (no per-project metadata), at
// import time in every worker: the route of the screen and which host UI to look in. GG Counter's
// helpers read the project's metadata first and fall back to these only without it, so the `scores*`
// projects (which always set it) never see `#/teams`; shell specs read neither.
process.env["E2E_MINIAPP_HASH"] ??= "#/teams";
process.env["E2E_HOST"] ??= "quizzard";

export default defineConfig({
  testDir: "tests/e2e",
  // CI: no stray test.only, 2 retries + a trace of the first retry; `--fail-on-flaky-tests` turns a pass-on-retry red (testing §4).
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  use: { trace: "on-first-retry", baseURL: `http://localhost:4173${app.basePath}` },
  // QUIZZARD_E2E=1: preview serves app/test/dist — the same app plus the routing probe mini-app
  // (app/vite.config.ts); `pnpm build` writes both, app/dist stays production-only.
  webServer: { command: "pnpm -F app preview --port 4173 --strictPort", port: 4173, reuseExistingServer: !process.env["CI"], env: { QUIZZARD_E2E: "1" } },
  projects: [
    ...DEVICES.map(({ name, device }) => ({ name, use: { ...device } })),
    ...DEVICES.map(({ name, device }) => ({ name: TEAMS_PROJECT_NAMES[name], testDir: TEAMS_SUITE, use: { ...device } })),
    ...DEVICES.map(({ name, device }) => ({ name: SCORES_PROJECT_NAMES[name], testDir: SCORES_SUITE, metadata: SCORES_METADATA, use: { ...device } })),
  ],
});
