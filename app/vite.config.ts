import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { app as config, type AppConfig } from "../app.config.ts";
import { OG_IMAGE, escapeHtml, ogImageAlt, ogImageUrl, siteVerificationTag, structuredData } from "../scripts/seo.ts";
import { SW_HANDOVER_FILE, swHandoverScript } from "../scripts/sw-handover.ts";
import { mergeMiniAppPresets, type MiniAppPackage, type ShellStyles } from "./build/miniapp-presets.ts";

const app: AppConfig = config;

// GitHub Pages path from app.config (differs from the id: "/Quizzard/"); dev, build and preview use it.
const BASE = app.basePath;

const fromHere = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

/** Mini-app packages and their folders; their CSS is scoped at build time (PLAN §1.3). TeamSync joins in T-10. */
const MINIAPP_PACKAGES: readonly MiniAppPackage[] = [];

/** The shell's stylesheets (global names) and token files (what mini-app CSS may use), for the mini-app CSS plugin. */
export const SHELL_STYLES: ShellStyles = {
  paths: [fromHere("./src/styles"), fromHere("../design/tokens.css"), fromHere("./src/generated/accent.css")],
  tokenFiles: [fromHere("../design/tokens.css"), fromHere("./src/generated/accent.css")],
  projectRoot: fromHere(".."),
};

const miniApps = mergeMiniAppPresets(MINIAPP_PACKAGES, SHELL_STYLES);

// Manifest screenshots for the richer install dialog (Chrome/Edge) — made by `pnpm screenshots`
// (tests/screenshots) before a release and committed; skipped until they exist.
const shot = (file: string, sizes: string, formFactor: "narrow" | "wide", label: string) =>
  existsSync(new URL(`./public/screenshots/${file}`, import.meta.url)) ? [{ src: `screenshots/${file}`, sizes, type: "image/png", form_factor: formFactor, label }] : [];
const screenshots = [
  ...shot("narrow.png", "780x1688", "narrow", `${app.name} on a phone`),
  ...shot("wide.png", "1280x800", "wide", `${app.name} on a computer`),
];

/** Fills %APP_*% placeholders, the head tags and the JSON-LD block in index.html from app.config.ts (seo-geo §2–§5). */
function appHtml(): Plugin {
  const verification = siteVerificationTag(app);
  const origin = (u: string | null | undefined): string => (u ? new URL(u).origin : "");
  const connect = ["'self'", origin(app.feedback.webhook)].filter(Boolean).join(" ");
  // One English URL per app: no hreflang or ?lang= alternates (DECISIONS 2026-11-06); other UI
  // languages are client-side translations only.
  return {
    name: "forge-app-html",
    transformIndexHtml(html, ctx) {
      // Vite's dev server injects inline <style> tags; allow them ONLY in dev. Production keeps style-src 'self'.
      const dev = ctx.server !== undefined;
      // Replacer functions everywhere config text goes in: "$&", "$'" in a string would be expanded.
      return html
        .replace("style-src 'self'", dev ? "style-src 'self' 'unsafe-inline'" : "style-src 'self'")
        // Least privilege: WebAssembly compilation only for apps that ship .wasm (security §1).
        .replace("script-src 'self'", () => (app.csp?.wasm ? "script-src 'self' 'wasm-unsafe-eval'" : "script-src 'self'"))
        .replaceAll("%APP_NAME%", () => escapeHtml(app.name))
        .replaceAll("%APP_TAGLINE%", () => escapeHtml(app.tagline))
        .replaceAll("%APP_DESCRIPTION%", () => escapeHtml(app.description))
        .replaceAll("%APP_URL%", () => app.url)
        .replaceAll("%APP_REPO%", () => app.repo)
        .replaceAll("%APP_OG_IMAGE_ALT%", () => escapeHtml(ogImageAlt(app)))
        .replaceAll("%OG_IMAGE_WIDTH%", () => String(OG_IMAGE.width))
        .replaceAll("%OG_IMAGE_HEIGHT%", () => String(OG_IMAGE.height))
        .replaceAll("%OG_IMAGE_TYPE%", () => OG_IMAGE.type)
        .replaceAll("%OG_IMAGE_URL%", () => ogImageUrl(app))
        .replace(/^ *%APP_SITE_VERIFICATION%\n/m, () => verification ? `    ${verification}\n` : "") // no empty line when unset
        .replaceAll("%APP_MORE_TOOLS%", () => app.moreTools.replaceAll("&", "&amp;"))
        .replaceAll("%APP_LANG%", () => app.languages[0] ?? "en")
        .replaceAll("%APP_VERSION%", () => escapeHtml(app.version)) // no-JS footer too; = package.json (generate.ts checks)
        .replaceAll("%BUILD_YEAR%", () => String(new Date().getFullYear()))
        .replace("%APP_JSONLD%", () => JSON.stringify(structuredData(app)).replace(/</g, "\\u003c")) // never "</script>" inside the block
        .replace("connect-src 'self'", () => `connect-src ${connect}`)
        .replace("%APP_STEPS%", () => app.help.steps.map((t) => `<li>${escapeHtml(t)}</li>`).join(""))
        .replace("%APP_FAQ%", () => app.faq.map((f) => `<details><summary>${escapeHtml(f.q)}</summary><p>${escapeHtml(f.a)}</p></details>`).join(""));
    },
  };
}

/**
 * Makes `vite preview` answer like GitHub Pages: an unknown path gets 404.html with status 404
 * instead of Vite's index.html fallback, so e2e sees production's online behaviour (pwa §4, §9).
 */
function pagesNotFound(): Plugin {
  return {
    name: "forge-pages-404",
    configurePreviewServer(server) {
      const dist = resolve(server.config.root, server.config.build.outDir);
      server.middlewares.use((req, res, next) => {
        const path = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
        if (!path.startsWith(BASE)) { next(); return; }
        const file = join(dist, path.slice(BASE.length));
        if (existsSync(file) && (!statSync(file).isDirectory() || existsSync(join(file, "index.html")))) { next(); return; }
        res.statusCode = 404;
        res.setHeader("content-type", "text/html; charset=utf-8");
        res.end(readFileSync(join(dist, "404.html")));
      });
    },
  };
}

/** Emits sw-handover.js next to the service worker, which imports it (scripts/sw-handover.ts, PLAN T-02). */
function swHandover(): Plugin {
  return {
    name: "quizzard-sw-handover",
    apply: "build",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: SW_HANDOVER_FILE, source: swHandoverScript(app) });
    },
  };
}

/** Cookie with which tests/e2e/legacy-2025.spec.ts asks `vite preview` for the 2025 site. */
const LEGACY_SITE_COOKIE = /(?:^|;\s*)e2e-legacy-2025=1(?:;|$)/;
/** The 2025 files the take-over e2e needs, by path below BASE (tests/e2e/fixtures/legacy-2025/). */
const LEGACY_SITE_FILES = new Map([
  ["", "index.html"], ["index.html", "index.html"], ["service-worker.js", "service-worker.js"], ["manifest.json", "manifest.json"],
]);
const LEGACY_SITE_TYPES: Record<string, string> = { html: "text/html", js: "text/javascript", json: "application/json" };

/**
 * `vite preview` only (GitHub Pages never runs it): with the cookie `e2e-legacy-2025=1` the page, the
 * service worker and the manifest are the 2025 site's, so the e2e test can install the real 2025
 * worker on this origin and path, then "deploy" this build by dropping the cookie (Playwright cannot
 * intercept a service worker's own script request).
 */
function previewLegacySite(): Plugin {
  const fixtures = new URL("../tests/e2e/fixtures/legacy-2025/", import.meta.url);
  return {
    name: "quizzard-preview-legacy-2025",
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split("?")[0] ?? "";
        const file = path.startsWith(BASE) ? LEGACY_SITE_FILES.get(path.slice(BASE.length)) : undefined;
        if (file === undefined || !LEGACY_SITE_COOKIE.test(req.headers.cookie ?? "")) { next(); return; }
        res.setHeader("content-type", `${LEGACY_SITE_TYPES[file.slice(file.lastIndexOf(".") + 1)] ?? "text/plain"}; charset=utf-8`);
        res.setHeader("cache-control", "no-cache");
        res.end(readFileSync(new URL(file, fixtures)));
      });
    },
  };
}

/** Cookie with which tests/e2e/pwa.spec.ts asks `vite preview` for the next deploy's worker. */
const NEXT_DEPLOY_COOKIE = /(?:^|;\s*)e2e-next-deploy=(\w+)/;

/**
 * `vite preview` only (GitHub Pages never runs it): with the cookie `e2e-next-deploy=<id>` the service
 * worker gets a comment added, so the browser sees a new version — how the e2e makes an update wait
 * for Reload (Playwright cannot intercept a service worker's own script request).
 */
function previewNextDeploy(): Plugin {
  return {
    name: "quizzard-preview-next-deploy",
    configurePreviewServer(server) {
      const script = join(resolve(server.config.root, server.config.build.outDir), "service-worker.js");
      server.middlewares.use((req, res, next) => {
        const deploy = NEXT_DEPLOY_COOKIE.exec(req.headers.cookie ?? "")?.[1];
        if (deploy === undefined || req.url?.split("?")[0] !== `${BASE}service-worker.js`) { next(); return; }
        res.setHeader("content-type", "text/javascript; charset=utf-8");
        res.setHeader("cache-control", "no-cache");
        res.end(`${readFileSync(script, "utf8")}\n// e2e next deploy ${deploy}\n`);
      });
    },
  };
}

/**
 * The e2e build (test/vite.e2e.config.ts, part of `pnpm build`) goes to `app/test/dist`; `vite preview`
 * serves it when QUIZZARD_E2E=1 (playwright.config.ts). `app/dist` — what deploy.yml uploads — never
 * contains test code.
 */
const outDir = process.env["QUIZZARD_E2E"] === "1" ? "test/dist" : "dist";

export default defineConfig({
  base: BASE,
  build: { target: "es2024", outDir },
  resolve: { alias: miniApps.alias },
  plugins: [
    ...miniApps.plugins,
    appHtml(),
    previewLegacySite(),
    previewNextDeploy(),
    pagesNotFound(),
    swHandover(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      // The 2025 site's URLs (DECISIONS 2026-11-22 T-02): installed copies update the worker and
      // re-read the manifest at the URLs they know; a renamed worker would leave theirs running.
      filename: "service-worker.js",
      manifestFilename: "manifest.json",
      // No includeAssets: globPatterns below already match every public file worth precaching.
      // injectThemeColor off: index.html has two media theme-color metas (light/dark); a third
      // media-less one would override both (pwa → pwa §2).
      pwaAssets: { config: true, overrideManifestIcons: true, injectThemeColor: false },
      manifest: {
        // id = start_url = the identity Chrome computed for the 2025 manifest (it had no id): the
        // installed app updates in place instead of becoming a second app (DECISIONS T-02).
        id: BASE, name: app.name, short_name: app.name, description: app.description,
        lang: app.languages[0] ?? "en", start_url: BASE, scope: BASE, display: "standalone",
        background_color: "#000000", theme_color: "#000000", orientation: "any",
        categories: [...app.categories],
        launch_handler: { client_mode: ["navigate-existing", "auto"] },
        ...(screenshots.length ? { screenshots } : {}),
        // Long-press the app icon → jump straight to a task (app.config.shortcuts). Each shortcut
        // needs a 96 px icon (pwa §2); pwa-96x96.png comes from pwa-assets.config.ts.
        ...(app.shortcuts?.length
          ? { shortcuts: app.shortcuts.map((s) => ({ name: s.name, url: s.url, icons: [{ src: "pwa-96x96.png", sizes: "96x96", type: "image/png" }] })) }
          : {}),
      },
      workbox: {
        cacheId: app.id,
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2,wasm,txt,json}"],
        globIgnores: [
          // Inter: precache only latin + cyrillic; other subsets still load on demand (unicode-range).
          "**/inter-{latin-ext,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2",
          // Install-dialog screenshots and the social image are never needed offline (pwa §3).
          "screenshots/**",
          "og-image.png",
          // Loaded by the worker itself (importScripts); the browser keeps it with the worker.
          SW_HANDOVER_FILE,
          // The plugin precaches the manifest itself; matched by "json" above it would be listed twice
          // with different revisions, and Workbox then fails to start its precache.
          "manifest.json",
        ],
        cleanupOutdatedCaches: true,
        // Takes over from the 2025 worker at once and deletes its caches (scripts/sw-handover.ts).
        importScripts: [SW_HANDOVER_FILE],
        // Any query (?lang=, ?teams=) still matches the precached page.
        ignoreURLParametersMatching: [/.*/],
        // No navigateFallback (vite-plugin-pwa defaults it to index.html): Workbox would answer
        // every non-precached navigation with it, online too (sitemap.xml showed our page).
        navigateFallback: null,
        // Instead: precached pages are served first (the precache route wins); any other
        // navigation goes to the network (GitHub Pages sends its real file or 404) and only when
        // that fails, i.e. offline, our 404 page answers in its offline variant — never the
        // browser's dinosaur (pwa §4, DECISIONS 2026-11-07).
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkOnly",
            options: { precacheFallback: { fallbackURL: `${BASE}404.html` } },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
