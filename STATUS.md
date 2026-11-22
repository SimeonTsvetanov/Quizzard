# STATUS — Quizzard

**Updated:** 2026-11-22 · **Phase:** 3 Build — M1 in progress (T-01, T-02 done; next T-03)

## Done
- Old code in branch `legacy-2025`; `main` + `gh-pages` still serve the 2025 site until T-08.
- Spec and plan approved by Moni (2026-11-22). Brand in `brand/` (logo A, palette C Emerald).
- T-01 scaffold from the forge template, `basePath` `/Quizzard/`.
- T-02 take-over: worker served as `service-worker.js`, 2025 caches deleted, manifest identity `/Quizzard/` as `manifest.json`.

## Next
- T-03 accent + logo → T-04 core contract → T-05 router/outlet → T-06 context → T-07 Home → T-08 first deploy.

## Blockers / open
- **Before T-08 (Moni):** repo Settings → Pages → Source must be "GitHub Actions" (today almost certainly branch `gh-pages`).
- Browsers still on the June 2025 `sw.js` worker are not reached by the take-over (a self-removing `sw.js` is not built).
- The 2025 page had a `google-site-verification` meta tag: carry the token into `app.config.ts` seo in T-20, or Search Console verification is lost.
- e2e run on Chromium + mobile Chrome only (Playwright's pinned Firefox/WebKit are not installed in the cloud session).
