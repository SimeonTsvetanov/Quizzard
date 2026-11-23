import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config.ts";

// Only for `pnpm docs:images` (not part of the e2e suite) — engineering → user-docs §6.
// The pictures show the app people get: the preview serves the production build (app/dist), not the
// e2e build with its probe and fixture cards (so no QUIZZARD_E2E in the server's environment).
export default defineConfig({
  ...base,
  testDir: "tests/docs",
  webServer: { command: "pnpm -F app preview --port 4173 --strictPort", port: 4173, reuseExistingServer: !process.env["CI"], env: {} },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
