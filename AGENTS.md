# AGENTS.md — Quizzard

The Quiz Toolkit — a free suite of tools for quiz and game nights by Simeon "Moni" Tsvetanov: one
GitHub Pages PWA (Level 1 shell, no framework) that hosts mini-apps (TeamSync = Teams, GG Counter =
Scores, later a quiz creator) behind a `mount` contract. Live at `/Quizzard/` (capital Q ≠ id `quizzard`).

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
- Not in v1 (PLAN §2): MCP, embed mode, share target, title rotation, API/n8n, Dexie/OPFS in the shell.
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
vendor/teamsync git submodule (TeamSync repo, pinned commit): its packages/core + packages/miniapp are workspace
                packages; tests/e2e/miniapp runs as Playwright projects `teams*`. Never edit — change it upstream
```

## Mini-apps from other repos (git submodules, PLAN §1.1 item 2)
- Clone with `git clone --recurse-submodules`, or run `git submodule update --init` in an existing clone
  (without it `pnpm i` and the build fail: the workspace has no `vendor/*/packages`).
- Bump a pin only to a released commit of that repo: `git -C vendor/teamsync fetch && git -C vendor/teamsync
  checkout <commit>`, then `pnpm i`, `pnpm verify`, `pnpm e2e` (its suite runs in the `teams*` projects), and commit
  `vendor/teamsync` with `pnpm-lock.yaml`. Dependabot (`gitsubmodule`) opens a PR when its default branch moves.
- lint, Prettier, Vitest and `tsc` skip `vendor/`; `tsc` reads only a package's `miniapp.d.ts` and its light modules
  (`meta`, `help`, `host-api`, `vite-preset`). A vendored `core` is built to `dist/` first (`pnpm dev` and `pnpm build` do it).

## Commands
`pnpm i` · `pnpm dev` · `pnpm generate` · `pnpm verify` (generate+lint+typecheck+test+docs:check+build) ·
`pnpm e2e` (after `pnpm build`; `vite preview` at `http://localhost:4173/Quizzard/`) · `pnpm docs:images`
