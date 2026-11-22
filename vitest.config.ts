import { defineConfig } from "vitest/config";

export default defineConfig({
  // Tests import the workspace core from source (its package exports point to dist/, built later).
  resolve: { alias: { "@simeonts/quizzard-core": new URL("./packages/core/src/index.ts", import.meta.url).pathname } },
  test: {
    // Every test starts clean: spies/mocks, vi.stubGlobal and vi.stubEnv are undone after each test.
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    include: ["packages/*/test/**/*.test.ts", "app/src/**/*.test.ts", "scripts/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["packages/core/src/**"],
      thresholds: { lines: 90 },
    },
  },
});
