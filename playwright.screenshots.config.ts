import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config.ts";

// Only for `pnpm screenshots` (not part of the e2e suite).
// The pictures show the app people get: the production build (app/dist), not the e2e build with its
// probe and fixture cards — so the preview server runs without QUIZZARD_E2E.
export default defineConfig({
  ...base,
  testDir: "tests/screenshots",
  webServer: { command: "pnpm -F app preview --port 4173 --strictPort", port: 4173, reuseExistingServer: !process.env["CI"], env: {} },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
