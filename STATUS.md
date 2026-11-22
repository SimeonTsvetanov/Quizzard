# STATUS — Quizzard

**Updated:** 2026-11-22 · **Phase:** 3 Build — M1 live 2026-11-22 (T-01–T-08 done); M2 TeamSync in progress (TS-01 next)

## Done
- Old code in branch `legacy-2025`; `main` + `gh-pages` still serve the 2025 site until T-08.
- Spec and plan approved by Moni (2026-11-22). Brand in `brand/` (logo A, palette C Emerald).
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

## Next
- T-10 add TeamSync (submodule at its 1.0.3 commit) → T-11 its e2e inside Quizzard → GG-01…03 → T-12/T-13.

## Blockers / open
- Browsers still on the June 2025 `sw.js` worker are not reached by the take-over (a self-removing `sw.js` is not built).
- The 2025 page had a `google-site-verification` meta tag: carry the token into `app.config.ts` seo in T-20, or Search Console verification is lost.
- Known flake: `csp.spec` "every shell dialog" timed out once under full parallel load (1 of ~38 runs; 25/25 alone) — watch in CI.
- A leftover `vite preview` on port 4173 makes e2e test the wrong build (reuseExistingServer): kill it first.
- e2e run on Chromium + mobile Chrome only (Playwright's pinned Firefox/WebKit are not installed in the cloud session).
