// The e2e build (`vite build --config test/vite.e2e.config.ts`, run by `pnpm build`): app/vite.config.ts
// plus the routing probe, in mode "e2e" (main.ts validates the registry then), written to app/test/dist.
// tests/e2e run against it (playwright.config.ts); app/dist stays production-only.
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig, type Plugin } from "vite";
import base from "../vite.config.ts";

/** Swaps src/miniapps/e2e-entries.ts (no entries) for the probe's registry line. */
function probeEntries(): Plugin {
  const shipped = fileURLToPath(new URL("../src/miniapps/e2e-entries.ts", import.meta.url));
  const probe = fileURLToPath(new URL("./fixtures/probe-entry.ts", import.meta.url));
  return {
    name: "quizzard-e2e-probe",
    enforce: "pre",
    async resolveId(source, importer, options) {
      if (!source.endsWith("/e2e-entries.ts")) return null;
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      return resolved?.id === shipped ? probe : null;
    },
  };
}

export default defineConfig(mergeConfig(base, { mode: "e2e", build: { outDir: "test/dist" }, plugins: [probeEntries()] }));
