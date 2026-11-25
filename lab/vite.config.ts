// The lab is built after the app (package.json: it depends on `app`, so `pnpm -r build` orders it)
// into app/dist/lab/: it is deployed with the site, but the service worker was written before it
// existed, so it is never part of the offline copy, and no page links to it.
import { defineConfig } from "vite";
import { app } from "../app.config.ts";

export default defineConfig({
  base: `${app.basePath}lab/`,
  build: { outDir: "../app/dist/lab", emptyOutDir: true, target: "es2022" },
});
