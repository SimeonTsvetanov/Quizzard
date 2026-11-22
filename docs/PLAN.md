# PLAN — Quizzard

> Status: **draft** · Phase 2 output. Based on SPEC approved 2026-11-22.
> Task ids: `T-` = this repo · `TS-` = repo `teamsync-random-team-generator` · `GG-` = repo `gg-counter`.

## 1. Architecture

### 1.1 Decisions (one line of reason each)
1. **Shell = forge template Level 1** (no framework, TypeScript, Vite, vite-plugin-pwa). React + react-dom alone is about the whole 60 KB Home budget; the contract is `mount/unmount`, so React (GG Counter, later the quiz creator) lives only in a mini-app's lazy chunk.
2. **One source per mini-app, in the repo that owns its standalone site; Quizzard consumes it as a pinned git submodule** (`vendor/teamsync`, `vendor/gg-counter`). Each app repo gets a workspace package `packages/miniapp` (the "body"); its `app/` stays as the standalone shell and mounts the same package through the same contract. Quizzard's pnpm workspace includes `vendor/*/packages/core` and `vendor/*/packages/miniapp` only. A mini-app with no standalone site (demo, quiz creator) lives in `miniapps/<id>/` in this repo, same package shape.
   - Rejected (a) move the apps here: a Pages project site deploys only from its own repo, so the old repos would need Quizzard's source back through a git link anyway — same link, opposite direction, plus moving CHANGELOG, user docs, legal sources, e2e, TeamSync's npm `core`/`mcp` publish.
   - Rejected git-dependency packages: `workspace:` deps inside the apps do not resolve, and the apps' e2e files would not be on disk (AC2 needs them).
   - Rejected (c) npm: a release + 24 h `minimumReleaseAge` per change, and Tailwind source CSS needs a prebuild.
   - Rejected (d) vendored bundle: a copy, not a source; no shared tokens, no e2e.
3. **Type boundary:** each `packages/miniapp/package.json` exports `"."` → `{ "types": "./miniapp.d.ts", "default": "./src/index.ts" }` and `"./meta"` (light, eager). Quizzard's `tsc` reads only the 3-line `.d.ts`; Vite bundles the source. So the apps' TypeScript version and settings never meet Quizzard's.
4. **Contract source = `packages/core/src/contract.ts` here** (types only). App repos carry a verbatim copy (`packages/miniapp/src/contract.ts`); `scripts/contract-sync.test.ts` fails when a vendored copy differs; `meta.contract: 1` is checked at mount.
5. **Mini-apps never touch `<html>`, `<body>`, `document.title`, the service worker or keys outside their storage area**; theme, language, title and toasts come from `context`. Overlays (Radix portals) render inside the mount element; the shell guarantees the outlet has no `transform`, `filter`, `contain` or clipping ancestor.
6. **Routing:** hash routes `#/`, `#/teams`, `#/scores`, `#/quiz` (reserved, "coming" card). `#/…` = route; the template's `#help`, `#settings` stay dialog links on Home. Launch directly on a mini-app route (deep link, manifest shortcut) seeds Home below it (`history.replaceState("#/")` + `pushState`, marked in `history.state`), so Back always lands on Home; the header shows a Back button inside a mini-app. Title: `<Mini-app> — Quizzard`. Manifest `shortcuts`: `./#/teams`, `./#/scores`.
7. **Offline:** every mini-app chunk is **precached** (hashed JS/CSS in the Workbox manifest). Reason: runtime-cached hashed chunks break after a deploy (the waiting old shell asks for files Pages no longer has). Code still executes only when opened, so the Home first-load budget is unaffected. A mini-app may opt out later (`precache: false` → CacheFirst runtime cache) when it is heavy. Update = template prompt; `context.shell.setBusy(true)` delays the offer.
8. **Storage:** mini-apps keep their existing storage modules and keys. `meta.storage` declares the area (prefix, legacy keys, IndexedDB names, OPFS folder); the shell computes usage and clears from that declaration alone. Shell prefs: `quizzard:v1:theme|lang|last-app|last-seen-version|persist-asked`.

### 1.2 The contract (`packages/core/src/contract.ts`)
```ts
export type Lang = "en" | "bg";
export type Text = { readonly en: string } & Partial<Record<Lang, string>>;
export type Unsubscribe = () => void;
export type Unmount = () => void;
export interface Signal<T> { get(): T; subscribe(listener: (value: T) => void): Unsubscribe }

export interface StorageArea {
  readonly prefix: string;                  // localStorage prefix, e.g. "gg-counter:v1:"
  readonly extraKeys?: readonly string[];   // own keys outside the prefix (pre-forge keys)
  readonly databases?: readonly string[];   // own IndexedDB database names
  readonly opfsDir?: string;                // own folder under the OPFS root
}
export interface MiniAppMeta {              // eager, tiny, no imports besides the icon
  readonly contract: 1;
  readonly id: string;                      // route "#/<id>", [data-miniapp="<id>"], shortcut
  readonly name: Text; readonly tagline: Text;
  readonly icon: string;                    // URL of an SVG mark
  readonly languages: readonly Lang[];      // a missing language falls back to English
  readonly status: "ready" | "coming";      // "coming" = card + reserved route, nothing to load
  readonly storage: StorageArea;
}
export interface HelpSection {
  readonly steps: readonly string[];
  readonly features: readonly { readonly name: string; readonly text: string }[];
  readonly faq: readonly { readonly q: string; readonly a: string }[];
}
export interface MiniAppContext {
  readonly host: "quizzard" | "standalone";
  readonly language: Signal<Lang>;
  readonly theme: Signal<"light" | "dark">; // resolved; the shell owns color-scheme on <html>
  readonly query: URLSearchParams;          // launch parameters, e.g. ?teams=4
  readonly shell: {
    toast(message: string, options?: { tone?: "info" | "error"; action?: { label: string; run(): void } }): void;
    confirm(options: { title: string; text?: string; confirm: string; cancel?: string; danger?: boolean }): Promise<boolean>;
    share(data: { title?: string; text: string; url?: string }): Promise<"shared" | "copied" | "cancelled" | "failed">;
    setTitle(part: string | null): void;
    setBusy(isBusy: boolean): void;         // no update offer while true
  };
  readonly navigation: { home(): void; open(id: string): void };
  readonly slots: { readonly headerActions: HTMLElement };
  readonly storage: {
    readonly area: StorageArea;
    readonly prefs: { get<T>(key: string, fallback: T): T; set(key: string, value: unknown): boolean; remove(key: string): void };
    notifySaved(): void;                    // first call → the shell asks for persistent storage once
  };
}
export interface MiniAppModule {            // the lazy chunk's default export
  mount(element: HTMLElement, context: MiniAppContext): Unmount | Promise<Unmount>;
  mountSettings?(element: HTMLElement, context: MiniAppContext): Unmount; // own Settings rows (export/import …)
}
export interface MiniAppEntry {             // one registry line
  readonly meta: MiniAppMeta;
  readonly load?: () => Promise<{ default: MiniAppModule }>;
  readonly help?: () => Promise<{ default: { readonly en: HelpSection } & Partial<Record<Lang, HelpSection>> }>;
}
```
- Texts: a mini-app owns its dictionaries and translates its own subtree (its own i18next instance); only `meta.name/tagline` and `help` reach the shell.
- Data cleared while a mini-app is open: the shell unmounts and mounts it again.

### 1.3 CSS isolation and theming
- Tokens: Quizzard's `design/tokens.css` + generated accent (`#00804F` light / `#34D399` dark, new token `--color-highlight: #F9D45C`). A mini-app entry CSS **never** imports `tokens.css`, the accent or fonts; it may declare extra tokens on its root (GG: `--text-score`, `--z-modal`). `scripts/check-miniapp-tokens.ts` fails on a `var(--x)` nobody defines and on a literal colour.
- Layer order (shell `app.css`): `@layer tokens, base, layout, components, utilities, overrides, miniapp;` — mini-app CSS always wins over shell CSS, whatever the specificity.
- Build transform `app/build/miniapp-css.ts` (PostCSS, per mini-app package): (1) wraps the file in `@layer miniapp.<id>` (its own layers become sub-layers, Tailwind's too); (2) prefixes every selector with `:where([data-miniapp="<id>"])` (specificity unchanged); `html`, `body`, `:root` map to the scope root; (3) build error on a `@keyframes`/`@property` name the shell or another mini-app defines (fix = rename at the source).
- Two modes, set in the mini-app's build preset: **shared** (TeamSync: Level 1, uses the shell's forge components on purpose, adds only its `teams-*` CSS) and **isolated** (GG Counter: first sub-layer `reset` = `:where([data-miniapp="scores"]) * { all: revert }`, so no shell `.button`/`.card` rule leaks in; then its preflight, theme, base, components, utilities).
- Load/unload: Vite adds the mini-app's `<link rel="stylesheet">` on first open (`style-src 'self'` holds, no inline styles); it stays loaded and is inert outside `[data-miniapp="<id>"]`. Only one mini-app is mounted at a time.
- Build presets: each mini-app package exports `vite-preset.ts` (`{ id, css: "shared" | "isolated", alias, plugins }`); `app/build/miniapp-presets.ts` merges them (GG: Tailwind plugin with explicit `@source`, alias `react-style-singleton` → its CSP stand-in).

### 1.4 Layers and paths
- **core** `packages/core` (`@simeonts/quizzard-core`, private, pure): `contract.ts`, `registry.ts` (validate entries: unique id, contract version, storage areas do not overlap), `route.ts` (`parseRoute`, `routeHref`), `storage-area.ts` (`ownsKey`, `areaUsage`, `clearArea` over a `Storage`-like), `usage.ts` (totals, quota warning ≥ 80 % or localStorage ≥ 4 MiB).
- **app** `app/src`: `main.ts` · `miniapps/registry.ts` (the only file a new mini-app changes) · `miniapps/outlet.ts` (load, mount, unmount, error screen) · `miniapps/context.ts` · `router/router.ts`, `router/history.ts` · `home/home.ts`, `styles/components/home.css` · `ui/settings-data.ts`, `ui/help-miniapps.ts` · `storage/areas.ts`, `storage/persist.ts` · `build/` (Vite-side helpers).
- **mcp / service:** none (SPEC §4).
- **scripts:** `new-miniapp.ts`, `size-check.ts`, `check-miniapp-tokens.ts`, `contract-sync.test.ts`. **tests:** `tests/e2e/*.spec.ts` (shell) + Playwright projects `teams` and `scores` whose `testDir` is `vendor/<app>/tests/e2e/miniapp`.

### 1.5 Refactor of each app (no user-visible change, same URL, same keys)
- **TeamSync:** `packages/miniapp` gets `teams/*`, `teams-*.css`, its texts, `screen.html` (the markup now in `app/index.html`; the standalone build injects it at a marker so the static HTML stays), `meta.ts`, `help.ts` (from `app.config.ts`). `mount` hydrates existing markup or renders it, and removes its listeners on unmount (`AbortController`). Toast, confirm, share come from `context`. Embed mode, share-target and the `?lang` parameter stay in the standalone shell.
- **GG Counter:** `packages/miniapp` gets the game screen (`players/`, `leaderboard/`, `session/` actions, `share/`, hooks, `lib/`, `components/ui/`, `storage/game|migrate|local-store`, body CSS + `theme.css`). `app/` keeps `ui/` (menu, shell dialogs, footer, PWA, legal), page-info, install banner, fonts, tokens, accent. The body reads language, theme, toast through a `Host` built from `context`; header actions render into `slots.headerActions`; Radix portals get a container inside the mount element; the keyboard inset and theme class go on the mount element; `migrateLegacyStorage()` runs in `mount`.

## 2. Standard parts used
| Part | Used | Note |
|---|---|---|
| App shell (header, menu, Settings, Help, About, What's new, Report, Install), error pages | yes | template; extended with router, Home, Back button, mini-app sections |
| Legal + policy pages | yes | one privacy page for the shell and both mini-apps (T-19) |
| i18n EN + BG | yes | shell texts; mini-apps bring their own |
| Storage module | prefs only | Dexie and OPFS files of the template removed from the shell; areas, usage and persist added |
| SEO files, llms.txt, sitemap | yes | one URL; hash routes are not indexed, the standalone sites stay the landing pages of their topics |
| PWA (manifest, service worker, update prompt, icons) | yes | + shortcuts, + take-over of the 2025 `service-worker.js` |
| `packages/mcp`, embed mode, share-target, title rotation, n8n/API/service | no | SPEC §4: not in v1 |

## 3. Tasks

### Milestone M1 — shell live at /Quizzard/ (proves AC1 with placeholder cards, AC3 routing and Back, part of AC7)
### T-01 · Scaffold from the forge template
- Goal: template files in the repo (id `quizzard`, name "Quizzard", tagline "The Quiz Toolkit"), `basePath: "/Quizzard/"` in `app.config.ts` used by Vite, generate and Playwright; `packages/mcp`, embed, share-target, Dexie/OPFS files removed; `brand/` and `docs/` kept
- Files: whole tree from `scaffold.mjs`; `app.config.ts`, `app/vite.config.ts`, `scripts/generate.ts`, `pnpm-workspace.yaml`, `AGENTS.md`, `STATUS.md`
- Reading list: flow → architecture §2, build §1–§2 · engineering → structure §1, §5
- Acceptance: `pnpm verify` green; `pnpm e2e` smoke green at `http://localhost:4173/Quizzard/`
- Depends on: —
### T-02 · Take over the 2025 site: service worker, manifest, CI and deploy
- Goal: installed and cached copies of the old site update in place: the new worker is served as `service-worker.js`, old caches are deleted, manifest identity decided from `legacy-2025` `public/manifest.json`; CI + deploy workflows run on `main`
- Files: `app/vite.config.ts`, `scripts/sw-handover.ts` (+ test), `.github/workflows/ci.yml`, `deploy.yml`, `docs/DECISIONS.md`
- Reading list: pwa → pwa §3, §5, §9, §11 · flow → migrate §1 · engineering → security §7
- Acceptance: e2e: a page controlled by a copy of the old worker gets the new app after one reload, no old cache left; CI green
- Depends on: T-01
### T-03 · Emerald accent, gold highlight, logo in the header
- Goal: accent pair `#00804F` / `#34D399` with the right on-accent text, token `--color-highlight`, wizard logo and wordmark in the header and splash
- Files: `app.config.ts`, `scripts/accent.ts` (+ test), `design/tokens.css`, `app/public/logo.svg`, `app/src/styles/components/header.css`
- Reading list: design → design-system §2–§3, §8 · growth → brand §5
- Acceptance: accent contrast test passes for both themes; forge `a11y-check` 0 FAIL light and dark on Home
- Depends on: T-01
### T-04 · Core: contract, registry validation, route parser
- Goal: `contract.ts` (§1.2), `validateRegistry`, `parseRoute`/`routeHref` as pure functions
- Files: `packages/core/src/contract.ts`, `registry.ts`, `route.ts`, `index.ts`, `packages/core/test/*.test.ts`
- Reading list: engineering → typescript, testing §3
- Acceptance: unit + fast-check tests pass; errors `MINIAPP_ID_DUPLICATE`, `MINIAPP_CONTRACT_VERSION`, `STORAGE_AREA_OVERLAP`; coverage ≥ 90 %
- Depends on: T-01
### T-05 · Router, outlet, Back, title
- Goal: hash router; outlet that loads, mounts and unmounts a registry entry; Home seeded under a direct launch; header Back button; title per route; error screen when a chunk fails
- Files: `app/src/router/router.ts`, `router/history.ts`, `miniapps/outlet.ts`, `miniapps/registry.ts`, `ui/title.ts`, `app/index.html`, `tests/e2e/routing.spec.ts`, `app/test/fixtures/probe-miniapp.ts`
- Reading list: engineering → frontend-level1 §2, §6 · app-shell → app-shell §2 · pwa → pwa-ios §6
- Acceptance: e2e: deep link to the probe route mounts it; Back shows Home; unmount leaves no node or listener; unknown route → Home
- Depends on: T-04
### T-06 · Shell services for mini-apps (context)
- Goal: `createContext(entry)`: language and theme signals, toast, confirm, share, setTitle, setBusy, navigation, header slot, namespaced prefs
- Files: `app/src/miniapps/context.ts`, `app/src/ui/toast.ts`, `ui/confirm.ts`, `ui/share.ts`, `pwa.ts`, `app/src/miniapps/context.test.ts`
- Reading list: engineering → frontend-level1 §2–§3 · design → ui-patterns §4, §6 · app-shell → i18n §2
- Acceptance: unit tests for signals and prefs prefix; e2e with the probe: language switch reaches it, confirm resolves, update offer waits while busy
- Depends on: T-05
### T-07 · Home launcher
- Goal: a card per registry entry (mark, name, one line), last used first, "coming" cards not clickable, grid that holds 12 cards from 320 px; placeholder entries `teams`, `scores`, `quiz` as "coming"
- Files: `app/src/home/home.ts`, `app/src/styles/components/home.css`, `app/src/i18n/en.ts`, `bg.ts`, `tests/e2e/home.spec.ts`
- Reading list: design → ui-patterns §7–§8, responsive-layout §1–§2, §6 · design → accessibility §1, §6
- Acceptance: e2e at 320 px and desktop; 12 fixture cards without overflow; CLS 0 on load; `scripts/size-check.ts` reports Home JS ≤ 60 KB gzip
- Depends on: T-05
### T-08 · First deploy (replaces the 2025 site)
- Goal: branch merged to `main`, Pages source = GitHub Actions, live checks. **Public action — ask Moni first**
- Files: `STATUS.md`, `CHANGELOG.md`, `docs/DECISIONS.md`
- Reading list: flow → build §3, §7, release §1 · pwa → pwa §9–§10
- Acceptance: `https://simeontsvetanov.github.io/Quizzard/` serves the new Home; old installed copy updates; `E2E_BASE_URL` smoke green
- Depends on: T-02, T-03, T-07

### Milestone M2 — TeamSync inside Quizzard (proves AC2 for TeamSync, AC3 `#/teams`)
### TS-01 · [teamsync] Body package behind the contract
- Goal: `packages/miniapp` (§1.5) with `mount` → `unmount`, `screen.html`, own texts, `meta.ts`, `help.ts`, `miniapp.d.ts`, `vite-preset.ts`; `app/` mounts it with a standalone context; no visible change
- Files: `packages/miniapp/**`, `app/src/main.ts`, `app/index.html`, `app/vite.config.ts`, `app/src/styles/app.css`
- Reading list: flow → migrate §1, §3 · engineering → structure §1–§2, frontend-level1 §2
- Acceptance: `pnpm verify` + `pnpm e2e` green unchanged; mount → unmount → mount works in a unit test; built `index.html` still has the static form
- Depends on: T-04
### TS-02 · [teamsync] e2e split and release
- Goal: `tests/e2e/miniapp/` (flows) and `tests/e2e/shell/` (standalone only); every `goto` through `tests/e2e/support/entry.ts` (`E2E_MINIAPP_HASH`); patch release, live site unchanged
- Files: `tests/e2e/**`, `playwright.config.ts`, `CHANGELOG.md`
- Reading list: engineering → testing §4, §6 · flow → release §1
- Acceptance: both folders green locally and against the live URL; tag pushed
- Depends on: TS-01
### T-09 · Mini-app CSS transform and checks
- Goal: `app/build/miniapp-css.ts` (§1.3: layer wrap, scope prefix, root mapping, collision errors, isolated reset) and `scripts/check-miniapp-tokens.ts`
- Files: `app/build/miniapp-css.ts`, `app/build/miniapp-css.test.ts`, `app/build/miniapp-presets.ts`, `scripts/check-miniapp-tokens.ts` (+ test), `app/src/styles/app.css`, `tests/e2e/css-layers.spec.ts`
- Reading list: design → css-architecture §1–§5 · engineering → security §1
- Acceptance: unit tests on fixture CSS (nesting, `@media`, `@layer`, `@keyframes`, Tailwind output); css-layers spec expects the new order
- Depends on: T-01
### T-10 · Add TeamSync as a mini-app
- Goal: submodule `vendor/teamsync` at the TS-02 tag, workspace globs, registry line, CI checkout with submodules, Dependabot `gitsubmodule`, contract-sync test; lint, format and `tsc` ignore `vendor/`
- Files: `.gitmodules`, `pnpm-workspace.yaml`, `app/src/miniapps/registry.ts`, `app/vite.config.ts`, `scripts/contract-sync.test.ts`, `.github/workflows/*.yml`, `.github/dependabot.yml`, `eslint.config.js`
- Reading list: engineering → structure §2, §6, security §5, §7 · flow → build §2
- Acceptance: `#/teams` shows TeamSync in Emerald; `pnpm verify` green; Home JS still ≤ 60 KB
- Depends on: T-06, T-09, TS-02
### T-11 · TeamSync e2e inside Quizzard
- Goal: Playwright project `teams` runs `vendor/teamsync/tests/e2e/miniapp` against `#/teams`; fix every difference in the shell or (via a TS task) in the body
- Files: `playwright.config.ts`, `tests/e2e/teams-host.spec.ts`, `package.json`
- Reading list: engineering → testing §4–§6 · design → accessibility §10
- Acceptance: project `teams` green on desktop and phone; names saved at the standalone URL appear in `#/teams` (same keys)
- Depends on: T-10

### Milestone M3 — GG Counter inside Quizzard (proves AC2 for GG Counter, F14, AC3 `#/scores`)
### GG-01 · [gg-counter] Host seam in the body
- Goal: the game screen takes language, theme, toast, title and the header-actions element from one `Host` object; the standalone shell supplies it; no visible change
- Files: `app/src/app.tsx`, `app/src/session/app-header.tsx`, `app/src/providers/*`, `app/src/i18n/*`, `app/src/ui/toast.tsx`, new `app/src/host.ts`
- Reading list: engineering → react §2, §6 · flow → migrate §1, §3
- Acceptance: `pnpm verify` (incl. e2e) green with no test changed
- Depends on: T-04
### GG-02 · [gg-counter] Body package
- Goal: `packages/miniapp` (§1.5): `mount` creates the React root, overlay container and extra tokens on the mount element, runs the storage migration; `meta.ts`, `help.ts`, `miniapp.d.ts`, `vite-preset.ts`; entry CSS without tokens, accent, fonts
- Files: `packages/miniapp/**`, `app/src/main.tsx`, `app/src/app.tsx`, `app/src/styles/app.css`, `app/vite.config.ts`, `eslint.config.js`
- Reading list: engineering → react §1, §6–§7, structure §1–§2 · design → css-architecture §1
- Acceptance: `pnpm verify` green; first-load JS ≤ 125 KB gzip; unmount leaves no node, listener or timer (unit test)
- Depends on: GG-01
### GG-03 · [gg-counter] e2e split and release
- Goal: `tests/e2e/miniapp/` (game, history, clear, keyboard, motion, storage of the game) and `tests/e2e/shell/`; entry helper; `tests/a11y/screens.json` usable with a start hash; patch release
- Files: `tests/e2e/**`, `tests/a11y/screens.json`, `playwright.config.ts`, `CHANGELOG.md`
- Reading list: engineering → testing §4, §6 · flow → release §1
- Acceptance: both folders green (`--repeat-each 5` for motion); live site unchanged; tag pushed
- Depends on: GG-02
### T-12 · Add GG Counter as an isolated mini-app
- Goal: submodule `vendor/gg-counter` at the GG-03 tag, preset merged (Tailwind, alias), registry line, one version of shared packages (`pnpm` overrides for i18next), size-check for the `scores` chunk
- Files: `.gitmodules`, `pnpm-workspace.yaml`, `app/src/miniapps/registry.ts`, `app/build/miniapp-presets.ts`, `scripts/size-check.ts`, `tests/e2e/csp.spec.ts`
- Reading list: engineering → react §6–§7, performance §4 · design → css-architecture §1–§2
- Acceptance: `#/scores` shows GG Counter in Emerald with no shell style inside it and no CSP violation; scores chunk ≤ 125 KB gzip; Home ≤ 60 KB
- Depends on: T-11, GG-03
### T-13 · GG Counter e2e and behaviour parity inside Quizzard
- Goal: Playwright project `scores` runs `vendor/gg-counter/tests/e2e/miniapp`; F14 list checked one by one (tint, last-changes line, history sheet, medals, motion, field above the keyboard, choice dialogs, share text)
- Files: `playwright.config.ts`, `tests/e2e/scores-host.spec.ts`, `tests/a11y/screens.json`
- Reading list: engineering → testing §4–§6 · design → accessibility §4, §8 · pwa → pwa-ios §5
- Acceptance: project `scores` green on desktop and phone, motion specs with `--repeat-each 5`; a11y-check 0 FAIL both themes
- Depends on: T-12

### Milestone M4 — shared shell parts (proves AC4 structure, AC5, AC6, AC9)
### T-14 · Storage areas in core
- Goal: `ownsKey`, `areaUsage` (UTF-16 bytes of own keys), `clearArea`, `totals`, `quotaWarning` — pure, over injected storage
- Files: `packages/core/src/storage-area.ts`, `usage.ts`, `packages/core/test/storage-area.test.ts`, `usage.test.ts`
- Reading list: engineering → browser-storage §2, §6, §10, testing §3
- Acceptance: property test: clearing area A never changes a key outside A; coverage ≥ 90 %
- Depends on: T-04
### T-15 · Settings → Data: sizes, free space, persistence, scoped clear
- Goal: rows for Teams, Scores, Quizzard with size, free space from `navigator.storage.estimate()`, persistence state, warning near the quota; clear per mini-app and "everything of Quizzard" with confirm; `notifySaved()` asks `navigator.storage.persist()` once; IndexedDB/OPFS areas measured (OPFS exact, IndexedDB "about")
- Files: `app/src/ui/settings-data.ts`, `app/src/storage/areas.ts`, `storage/persist.ts`, `app/src/styles/components/settings.css`, `tests/e2e/storage.spec.ts`; one-line `notifySaved` calls via TS/GG patch releases
- Reading list: engineering → browser-storage §3, §7 · design → ui-patterns §12 · design → ux-principles
- Acceptance: e2e AC5 (a game seeded under `gg-counter:v1:state` shows in Scores; clearing Teams leaves it and a foreign key) and AC9 (three rows, free space, persist requested after the first save, clear changes one size only)
- Depends on: T-13, T-14
### T-16 · Help and Settings contributions
- Goal: Help shows a section per mini-app from `entry.help` (lazy, English fallback); Settings shows each mini-app's `mountSettings` rows (GG export/import, TeamSync export/import)
- Files: `app/src/ui/help-miniapps.ts`, `ui/help.ts`, `ui/settings.ts`, `tests/e2e/shell.spec.ts`; `mountSettings` in both vendored packages (TS/GG patch releases)
- Reading list: app-shell → help-docs §1–§3, app-shell §4, i18n §2
- Acceptance: e2e: both Help sections in EN and BG; an exported GG game imports at the standalone URL
- Depends on: T-13
### T-17 · `pnpm new:miniapp <id>` and the quiz creator card
- Goal: generator writes `miniapps/<id>/` (package, `meta.ts`, `src/index.ts`, test) and one registry line; `quiz` entry as "coming" with the reserved route
- Files: `scripts/new-miniapp.ts` (+ test), `scripts/miniapp-template/**`, `app/src/miniapps/registry.ts`, `docs/ARCHITECTURE.md`
- Reading list: engineering → structure §5, typescript · flow → architecture §1
- Acceptance: CI job: `pnpm new:miniapp demo && pnpm verify` green in a copy, "demo" card on Home, `git diff --stat` shows only the registry among shell files (AC6)
- Depends on: T-10

### Milestone M5 — brand, texts, search, PWA (proves AC7, AC4 in EN + BG, AC8, AC3 shortcut)
### T-18 · Icons and images
- Goal: install icons (maskable on cream `#F3E9CF`), simplified mark for 16–24 px, favicon, og-image, 96 px shortcut icons, manifest screenshots
- Files: `app/public/logo.svg`, `app/pwa-assets.config.ts`, `app/public/**`, `docs/ASSETS.md`
- Reading list: pwa → icons-and-assets §2–§5, pwa-ios §2 · growth → brand §4
- Acceptance: icons match `brand/`; maskable safe zone check; manifest has no warning in Chrome
- Depends on: T-03
### T-19 · Texts EN + BG and legal pages
- Goal: every shell text in both languages, Bulgarian tagline (Moni decides), Help (install, storage on iPhone, Safari 7-day rule, shared data with the standalone sites), one privacy page for shell + mini-apps, terms, licences incl. the mini-apps' packages
- Files: `app.config.ts`, `app/src/i18n/en.ts`, `bg.ts`, `content/legal/*.md`, `scripts/licenses.ts`
- Reading list: app-shell → i18n §2, §5, help-docs §1–§2, legal-pages §2–§3, §5, §9 · pwa → pwa-ios §7
- Acceptance: i18n test (same keys in both); forge `compliance-check.mjs` passes; `legal-reviewer` checklist done
- Depends on: T-16
### T-20 · SEO, llms.txt and agent files
- Goal: head tags, JSON-LD, static Home content (mini-app list as real links), sitemap, robots, `llms.txt` with the mini-apps and deep links; no text copied from the standalone sites
- Files: `app.config.ts`, `scripts/seo.ts`, `scripts/generate.ts`, `app/index.html`
- Reading list: growth → seo-geo §2–§8, §10
- Acceptance: `scripts/seo.test.ts` green; `seo-specialist` checklist 0 FAIL; the page reads correctly with JavaScript off
- Depends on: T-19
### T-21 · PWA: shortcuts, offline, update
- Goal: manifest shortcuts for Teams and Scores; mini-app chunks in the precache with a size budget; offline and update e2e
- Files: `app/vite.config.ts`, `app.config.ts`, `tests/e2e/pwa.spec.ts`, `scripts/size-check.ts`
- Reading list: pwa → pwa §2–§5, §10, pwa-ios §1, §7
- Acceptance: e2e AC8 (offline: Home, `#/teams`, `#/scores` work; a new version waits for "Reload"), AC3 (shortcut URL opens Scores, Back → Home); `pwa-auditor` checklist 0 FAIL
- Depends on: T-13, T-18

### Milestone M6 — checks and release (re-proves AC1–AC9 on the live site)
### T-22 · Accessibility and layout sweep
- Goal: a11y-check on Home, both mini-apps, Settings → Data and Help in both themes; 320 px and desktop screenshots
- Files: `tests/a11y/screens.json`, `tests/e2e/*.spec.ts`, CSS fixes
- Reading list: design → accessibility §10, responsive-layout §9 · engineering → testing §5
- Acceptance: 0 FAIL in both themes (AC7); no horizontal scroll at 320 px
- Depends on: T-21
### T-23 · Performance, security and licences
- Goal: budgets (Home ≤ 60 KB, scores ≤ 125 KB), LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms on the lab profile, repeat-visit open < 1 s (AC1); `security-auditor` checklist, CodeQL, pinned submodules, licence report
- Files: `lighthouserc.json`, `scripts/size-check.ts`, `SECURITY.md`, `.github/workflows/ci.yml`
- Reading list: engineering → performance §4–§6, security §1–§2, §5–§6, §10
- Acceptance: all budgets in CI; 0 open high findings
- Depends on: T-22
### T-24 · User docs
- Goal: English user docs (start, Teams, Scores, your data, install) with generated light + dark images
- Files: `docs/index.md`, `docs/how-to/*.md`, `docs/reference/*.md`, `tests/docs/shots.ts`
- Reading list: engineering → user-docs §1–§7
- Acceptance: `pnpm docs:check` green; labels match `app/src/i18n/en.ts`
- Depends on: T-19
### T-25 · Release v1.0.0
- Goal: CHANGELOG, `service.json`, tag, deploy, live checks on Quizzard and on both standalone sites. **Public action — ask Moni first**
- Files: `CHANGELOG.md`, `service.json`, `STATUS.md`, `README.md`
- Reading list: flow → release §1–§2, learn
- Acceptance: every AC checked on the live URL and noted in `progress/`; standalone sites unchanged (their e2e green against live)
- Depends on: T-23, T-24

## 4. Open points
1. **Direction of the source link** differs from the research note (§1.1 item 2) — Moni to confirm.
2. **Precache of mini-app chunks** (§1.1 item 7): SPEC F12 says "loaded on first open". Precaching downloads them in the background on the first visit; say so in the SPEC or switch to a runtime cache.
3. **Tailwind under Quizzard's Vite 8** while GG Counter builds with Vite 5: not verified. Fallback: GG's package precompiles its CSS with the Tailwind CLI, or GG moves to the template's toolchain first (one more GG task).
4. **Contract copies vs an npm types package:** copies + a sync test now; publish when a third consumer appears.
5. **Per-database IndexedDB size** has no browser API; shown as "about". Matters only from the quiz creator on.
6. **2025 manifest identity:** decided in T-02 after reading `legacy-2025` `public/manifest.json`.
7. **Clear in Quizzard removes the whole prefix**, so also the standalone site's saved theme and language of that app — same as its own "Clear my data"; wording to confirm.
8. **GG Counter header behaviour** (compact actions when the leaderboard is off screen) moves into the shell's header slot; if a characterization test cannot pass unchanged, it needs a DECISIONS entry.
9. **Teams → Scores hand-off** (the SPEC example) is not a v1 feature; `navigation.open(id)` carries no payload yet.
10. **TeamSync's `modal.css` and `sheet.css` differ from the template:** upstream to the forge or carry as scoped overrides (TS-01).
11. **Forge tooling** (`structure-check`, the single-hex `accent.ts`) does not know `vendor/`, `miniapps/` or a light/dark accent pair → forge update through the learn step.
12. **Submodules need both app repos to be public** and reachable from CI and cloud sessions — to confirm.
13. **Home budget:** the template's current first-load size was not measured; T-07 adds the check, and i18next is the first thing to cut if it fails.
