# STATUS — Quizzard

**Updated:** 2026-11-22 · **Phase:** 3 Build · T-01 done (scaffold from the forge template)

## Done
- Old code archived in branch `legacy-2025`; `main` still serves the old site until the new one is ready.
- Brand files in `brand/` (wizard logo variant A as SVG, icons); palette C · Emerald (DECISIONS).
- `docs/SPEC.md` and `docs/PLAN.md` approved by Moni 2026-11-22.
- T-01: forge template (forge 0.27.4 repo) scaffolded in; `basePath: "/Quizzard/"` drives Vite, generate
  and Playwright; MCP, embed, share target, title rotation, Dexie/OPFS removed (PLAN §2); EN + BG.

## Next
- T-02 take over the 2025 site (service worker, manifest identity, CI + deploy); T-03 Emerald accent + logo;
  T-04 core contract, registry, route parser.

## Blockers / open
- None. Work happens on branch `claude/eager-bardeen-t8t7b7`; nothing is pushed to `main` before the new app builds.
- Placeholders still open: Bulgarian tagline (T-19, Moni), `content/legal` placeholders (T-19), template logo (T-03).
