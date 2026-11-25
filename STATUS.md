# STATUS — Quizzard

**Updated:** 2026-11-25 · **Phase:** 3 Build — v0.27.0 (Scores: a colour for each player's name): Teams, Scores, Answer sheet and the Quiz creator (make, play, export, presenter view, media, quiz files; UX pass with one control bar, n/total counters, drag, search, print) live in this repo with their own data; next T-17…T-25

## Done
- Old code in branch `legacy-2025`. Spec and plan approved by Moni (2026-11-22). Brand in `brand/` (logo A, palette C Emerald).
- T-01 scaffold from the forge template, `basePath` `/Quizzard/`.
- T-02 take-over: worker served as `service-worker.js`, 2025 caches deleted, manifest identity `/Quizzard/` as `manifest.json`.
- T-03 Emerald accent pair with a build-time contrast check, gold highlight token, wizard logo in the header (31.8 KB static SVG).
- T-04 core: mini-app contract, registry validation, route parser (82 tests, 97.5 % lines).
- T-05 hash router, outlet (load/mount/unmount, error screen), Back button, titles; probe mini-app only in the e2e build (`app/test/dist`).
- T-07 Home launcher: three "coming" cards (Teams, Scores, Quiz creator), last used first, Home JS 39.7 KB gzip of 60, size-check in verify.
- T-08 first deploy: CI green on 5 browsers (4th run), Deploy succeeded (Pages source was already GitHub Actions); live smoke on a phone profile: 3 cards, worker `service-worker.js`, Help opens, offline reload works, no console errors.
- T-06 shell services for mini-apps (signals, toast/confirm/share, busy gate, header slot, namespaced prefs); manifest colours black (Moni).
- TS-01/TS-02 (TeamSync repo): team screen as `packages/miniapp`, e2e split, 1.0.3 pushed (deploy waits for its CI).
- T-09 mini-app CSS transform (layer `miniapp`, scope prefix, isolated reset, global-name collisions) + token check.
- T-10/T-11 TeamSync at `#/teams` from submodule `vendor/teamsync` (f93c769 = 1.0.3): Home JS 44.7 KB, teams 30.8 KB; its e2e suite green in `teams` + `teams-mobile` (WebKit/Firefox only in CI).
- T-12/T-13 GG Counter at `#/scores` from submodule `vendor/gg-counter` (a6745fb = 1.2.4), isolated CSS (Tailwind under Vite 8), header buttons in the slot, toasts inside its dialogs: Home 45.4 KB, Scores first open 92.3 KB of 125; its suite 74/76 in `scores` + `scores-mobile` (motion/keyboard ×5 green), scores-host.spec green ×5.

## Next
- 0.22.0 (2026-11-24): special rounds Golden pyramid and Safe (quiz-creator SPEC §10, PLAN slice 6), the stage in the Home look with the Quizzard logo, docs refresh. Checked in Chromium only; WebKit/Firefox and real phones not yet.
- Quiz creator: slices 1–5 + UX pass shipped (0.17.0–0.20.0). Fixes for the red five-browser run 45430916307 are on the branch (DECISIONS 2026-11-24: media as bytes where Blobs are refused, Home arrow/CLS, sky still under dialogs, 8 shards, traces uploaded); WebKit and Firefox are unproven until the next manual run — read its `e2e-results-*` artifacts first. Then: a large-file test (100–250 MB), Cast experiment, restore the e2e gate before 1.0.0, move the learnings into the forge.
- Open after the move in: ESLint/Prettier/`tsc` still skip `miniapps/`; standalone-only code left in the two packages (theme storage, `./module` entry, standalone host in tests) can go.
- Open from T-15: quota warning and `notifySaved` → persist. Then T-17 (new:miniapp + quiz card), T-18 icons, T-19 texts (Bulgarian tagline), T-20 SEO, T-21 shortcuts, T-22 a11y, T-23 perf/security, T-24 user docs, T-25 release 1.0.0.
- Open review findings 2, 4, 6–10, 13, 14 (progress/2026-11-22.md); two flaky tests, then `--fail-on-flaky-tests` back.
- Waiting on Moni: phone check of Teams/Scores and the black navigation bar; Bulgarian tagline.
