# AGENTS.md — Quizzard

The Quiz Toolkit — a free suite of tools for quiz and game nights by Simeon "Moni" Tsvetanov: one
GitHub Pages PWA (Level 1 shell, no framework) that hosts mini-apps (Teams, Scores, Answer sheet, Quiz
creator) behind a `mount` contract; all of their code and data live in this repo. Live at `/Quizzard/` (capital Q ≠ id `quizzard`).

## Read first
1. `STATUS.md` (current task, next step). 2. `docs/SPEC.md` + `docs/PLAN.md` (§1 architecture, §3 tasks).
3. `docs/DECISIONS.md`. 4. `app.config.ts` — the single source for name, texts, FAQ, SEO, manifest, `basePath`.

## Rules
- Talk to Moni in **Bulgarian**; every file, commit and issue in **English**.
- Follow the forge plugin (`forge` + `forge-standards`). Cloud session without the plugin: read
  `simeonts-microapp-forge/plugins/*/skills/*/SKILL.md` for the area, then only the chapters it
  points to; agents are in `plugins/*/agents/*.md`.
- Run `pnpm verify` before saying "done"; keep working while it fails. Never weaken a lint rule or a test.
- The Pages path comes only from `app.config.basePath` (Vite, generate, Playwright); storage keys use
  `app.id` (`quizzard:v1:*`). Never derive one from the other.
- Not in v1 (PLAN §2): MCP, embed mode, title rotation, API/n8n, Dexie/OPFS in the shell. The share target is in since
  2026-11-28, for "Make a quiz with AI" only (DECISIONS).
- Moni corrects/dislikes something → apply it and add an entry to `LEARNINGS.md`.
- Decisions → `docs/DECISIONS.md` (date · decision · reason) the same day. Update `STATUS.md` (≤ 30 lines).
- Never hand-edit generated files (`pnpm generate`): `app/public/*.txt|xml|html`, policy pages,
  `tokens.css`, `og-image.png`, `app/src/generated/` (all git-ignored) and the root `LICENSE` (committed).
  Edit `app.config.ts`, `content/legal/*.md`, `design/tokens.css` or `scripts/*.ts` instead.

## Where things are
```
packages/core   @simeonts/quizzard-core (private, pure logic + tests; contract/registry/route from T-04)
app/            PWA shell (Vite, Level 1): src/ui (shell helpers), storage/ (prefs only), i18n/ (en, bg), styles/
content/legal   Terms/Privacy/AI notice/… sources      design/   tokens.css (forge)
scripts/        generate.ts, seo.ts, accent.ts, licenses.ts, check-docs.ts, page-assets/
tests/e2e       Playwright (base URL from basePath)    docs/     SPEC, PLAN, DECISIONS, ASSETS (dev)
brand/          logo, icons, palette research (source for T-03/T-18)
miniapps/teams  Teams (was TeamSync): packages/core + packages/miniapp are workspace packages; tests/e2e/miniapp runs as
                Playwright projects `teams*`. Quizzard's own code since 2026-11-23 — edit it here
miniapps/scores Scores (was GG Counter; React + Tailwind, isolated CSS): the same, projects `scores*` (per-project metadata)
miniapps/sheet  Answer sheet (written here, Level 1): packages/miniapp only (src/core = pure logic); linted and type-checked
                with the shell; e2e in tests/e2e/sheet-host.spec.ts
miniapps/quiz   Quiz creator (written here, Level 1; docs/quiz-creator/SPEC.md + PLAN.md): packages/core (pure model, registries:
                question kinds, answer types, round kinds standard | pyramid | safe | laugh | task; migrations), packages/player (the
                stage: state machine game/, views/, render/ slide in cqi, ui/; also built into the exported one-file quiz, whose
                standalone.ts keeps its game in localStorage) and packages/miniapp (storage/ = IndexedDB `quizzard-quiz`, the only
                creator code that touches storage; kinds-ui/ + answers-ui/; media/ = import, cut/ = the cut window with
                Mediabunny, loaded lazily; screens/); e2e in tests/e2e/quiz-*.spec.ts
```

## Mini-apps (in this repo since 2026-11-23, DECISIONS)
- Teams and Scores started as copies of TeamSync 1.0.4 (`0dab352`) and GG Counter 1.2.5 (`88a825a`). Nothing is pulled
  from those repos any more: no submodule, no Dependabot bump. A fix wanted in both places is made twice.
- Their data is Quizzard's own: `quizzard-teams:v1:*`, `quizzard-scores:v1:*`, `quizzard-sheet:v1:*`. Never read or write the standalone
  sites' keys (`teamsync-random-team-generator:v1:*`, `gg-counter:v1:*`, `gg-counter/state`, `gg-counter-theme`).
- Package names are unchanged (`@simeonts/teamsync-random-team-generator-miniapp`, `gg-counter-miniapp`, their cores).
- Vitest runs their unit tests (`miniapps/*/packages/*/test`). ESLint, Prettier and `tsc` still skip `miniapps/teams`
  and `miniapps/scores` (open: bring them under the shell's lint and typecheck; `miniapps/sheet` already is); `tsc` reads only a package's `miniapp.d.ts` and its light
  modules (`meta`, `help`, `host-api`, `vite-preset`). A mini-app's `core` is built to `dist/` first (`pnpm dev`, `pnpm build`).
- a11y: `node …/a11y-check.mjs http://localhost:4173/Quizzard/ --screens "$(node scripts/a11y-screens.ts)"`
  (`"scope": "miniapp"` scenarios, opened from Home — a hash URL would not reload between them).

## Commands
`pnpm i` · `pnpm dev` · `pnpm generate` · `pnpm verify` (generate+lint+typecheck+test+docs:check+build+size) · `pnpm e2e` (after `pnpm build`; `vite preview` at `http://localhost:4173/Quizzard/`) · `pnpm docs:images` CI: a push to `main` runs `verify`, then Deploy; five-browser e2e on pull requests and manual runs of `ci.yml`.
