# STATUS — Quizzard

**Updated:** 2026-11-22 · **Phase:** 3 Build — M1–M3 done 2026-11-22: shell, Teams (TeamSync 1.0.3) and Scores (GG Counter 1.2.4) inside; next M4 (T-14…T-17)

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
- Commit T-12/T-13; GG patch: `tests/e2e/support/host.ts` `QUIZZARD.copyWithoutShareSheet` closes the sheet after Copy (AC5 fails until then), then bump the pin → T-14/T-15.

## Blockers / open
- Browsers still on the June 2025 `sw.js` worker are not reached by the take-over (a self-removing `sw.js` is not built).
- The 2025 page had a `google-site-verification` meta tag: carry the token into `app.config.ts` seo in T-20, or Search Console verification is lost.
- Known flake: `csp.spec` "every shell dialog" timed out once under full parallel load (1 of ~38 runs; 25/25 alone) — watch in CI.
- A leftover `vite preview` on port 4173 makes e2e test the wrong build (reuseExistingServer): kill it first.
- e2e run on Chromium + mobile Chrome only (Playwright's pinned Firefox/WebKit are not installed in the cloud session).
- Settings → "Clear my data" still clears only `quizzard:v1:*`; Teams' names and Scores' game stay until T-15 (scoped clear); privacy text is T-19.
- third-party-licenses.txt lacks the licence text of 8 GG packages without a LICENSE file (Radix helpers, cva, react-remove-scroll-bar) — `pnpm generate` warns; T-19 (GG ships the texts in scripts/page-assets/licenses/).
