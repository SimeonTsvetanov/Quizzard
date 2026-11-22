# SPEC — Quizzard

> Status: **approved 2026-11-22 by Moni** · Phase 0–1 output (flow). Facts and numbers only.
> Background and sources: forge `docs/RESEARCH-QUIZZARD-2026-11-22.md`.

## 1. Problem and users
- Problem: a quiz-night host needs several small tools (make teams, keep score, later build and run the quiz) and
  today they are separate apps with separate looks.
- Who uses it: hosts and players of pub quizzes and board-game nights, on a phone or a laptop, often offline.
- Example: the host opens Quizzard → taps "Teams" → pastes 12 names → gets 3 teams → taps "Scores" → tracks points
  for those teams during the night — without leaving the app.

## 2. Reuse
- **TeamSync** (`teamsync-random-team-generator`, Level 1, core `teamsync-core`) and **GG Counter** (`gg-counter`,
  Level 2 React, core `gg-counter-core`): both become mini-apps of Quizzard. One source of truth per mini-app; the
  standalone sites at `/teamsync-random-team-generator/` and `/GG-counter/` stay live and unchanged for their users.
- Old Quizzard (branch `legacy-2025`, 32,000 lines React + MUI): **not reused**; clean slate (DECISIONS 2026-11-22).

## 3. Features (each testable, linked to an acceptance criterion)
| ID | Feature | Acceptance |
|---|---|---|
| F1 | **Home = launcher:** a card per mini-app (logo mark, name, one line), opened with one tap; the last used mini-app is offered first | AC1 |
| F2 | **Mini-app contract:** every mini-app is a module with `meta` (id, name, tagline, icon, languages), `mount(element, context)` → `unmount()`, and its own storage namespace; the shell knows nothing else about it (works for no-framework and React mini-apps) | AC2, AC6 |
| F3 | **TeamSync inside Quizzard**, same behaviour as the standalone app, in Quizzard's look | AC2 |
| F4 | **GG Counter inside Quizzard**, same behaviour as the standalone app, in Quizzard's look | AC2 |
| F5 | **Each mini-app has its own address** (`#/teams`, `#/scores`): deep link, browser Back returns to Home, manifest `shortcuts` open it directly, the page title names it | AC3 |
| F6 | **One shell for all:** header, menu, Settings (theme, language, data), Help, What's new, About, Report, Install, legal pages — once; a mini-app adds its own Help section and Settings rows through the contract | AC4 |
| F7 | **Shared data on the same device:** inside Quizzard a mini-app reads and writes the same saved data as its standalone site in the same browser (same origin, same keys) | AC5 |
| F8 | **"Clear my data" is scoped:** per mini-app, or everything of Quizzard; never touches another app's keys | AC5 |
| F9 | **Add a mini-app fast:** `pnpm new:miniapp <id>` creates the module, test and registry line; the new card appears on Home | AC6 |
| F10 | **Path for the quiz creator:** a "Quiz creator — coming" card and a reserved route; the contract already covers what it will need (own storage namespace incl. IndexedDB/OPFS, own Settings/Help, lazy code) | AC6 |
| F11 | **Brand:** the wizard logo (variant A, three stars), tagline "The Quiz Toolkit", palette from DECISIONS, cream install icon | AC7 |
| F12 | **Offline PWA** with update prompt; mini-app code is saved for offline use in the background on the first visit and runs only when the mini-app is opened (PLAN §1.1 item 7) | AC8 |
| F13 | **English + Bulgarian**; a mini-app without a language falls back to English | AC4 |
| F14 | **Nothing is lost on the way in:** every behaviour of the standalone apps works inside Quizzard — in GG Counter the last-scored tint, the last-changes line and history sheet with remove/restore, medals, the motion (card in/out, score roll, reorder), the field that stays above the keyboard, the choice dialogs, share text; in TeamSync its flows, share and remembered names | AC2 |
| F15 | **Storage that lasts and is visible:** each mini-app has its own storage area (prefs keys with its prefix; its own IndexedDB database / OPFS folder when it needs one); Quizzard asks the browser for persistent storage after the first saved data; Settings → Data shows the space used per mini-app and the space left (Storage API estimate), and warns before the quota is near | AC9 |
| F16 | **Answer sheet** (added 2026-11-23, Moni): a team's own sheet during a quiz instead of paper — rounds; in a round one line per question (write the answer, the next line appears by itself, Enter moves to it), each line marked right or wrong, 1 point per right answer by default and the points of any question changeable (e.g. 0.5, 2); bonus points per round (also negative); the round's result on its card and the running total always in view; earlier rounds fold and can be reopened and fixed; Clear game with Undo; its own storage area `quizzard-sheet:v1:`; EN + BG | AC10 |

## 4. Usage modes
- Hosting type: **standard** (static GitHub Pages, everything in the browser).
- Modes: browser · installed PWA. Embed, API, n8n and MCP: not in v1 (TeamSync keeps its own MCP package).
- URL: `https://simeontsvetanov.github.io/Quizzard/` (same as today) · routes `#/`, `#/teams`, `#/scores`, `#/quiz` (reserved).

## 5. Data and storage
- Shell: prefs only (`quizzard:v1:theme|lang|last-app|last-seen-version`).
- Mini-apps: their own keys inside Quizzard (`quizzard-teams:v1:*`, `quizzard-scores:v1:*`), separate from the standalone sites (changed 2026-11-23, DECISIONS).
- Data of the old Quizzard (its localStorage/IndexedDB): not read, not migrated, not deleted (DECISIONS).
- Export/import: per mini-app, as each already has.
- Space: the 5 MiB `localStorage` cap is shared by every app on the origin, so anything large (future quizzes, media) goes to IndexedDB/OPFS in the mini-app's own database; persistence requested (F15); Safari's 7-day eviction for non-installed sites is explained in Help.

## 6. UI
- Shell: decided in PLAN (forge template Level 1 is the default; mini-apps bring their own framework lazily).
- Languages EN (default) + BG · accent Emerald `#00804F` / dark `#34D399`, highlight gold `#F9D45C` (DECISIONS 2026-11-22) · special screens: Home launcher.
- Look and behaviour = the forge design system as in TeamSync and GG Counter (sheets, dialogs, motion, header); nothing app-specific besides the accent and the brand.
- Idea, not in v1: animated mini-wizard around the menu (`brand/README.md`).

## 7. Limits and performance
- Home (shell only) first-load JS ≤ 60 KB gzip; a mini-app's code loads only when opened (GG Counter ≤ 125 KB as today).
- LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms on the forge lab profile; works at 320 px width; installable.
- Up to 12 mini-app cards on Home without a layout change.

## 8. Legal, privacy, AI
- AI features: none in v1 (Variant A). The future quiz creator gets its own AI/legal review.
- Privacy: nothing leaves the device; one privacy page covering the shell and both mini-apps; contact email: the same
  as GG Counter (confirmed by Moni 2026-11-22) · ads/analytics: off.

## 9. Acceptance criteria (Moni's "it works")
- AC1: on a phone, Home shows the cards; one tap opens a mini-app in under 1 s on a repeat visit.
- AC2: the e2e suites of TeamSync and GG Counter (their user flows) pass against the mini-apps inside Quizzard.
- AC3: `…/Quizzard/#/scores` opens GG Counter directly; Back goes to Home; the installed app's shortcut does the same.
- AC4: menu, Settings, Help, legal pages exist once, in EN and BG; each mini-app's Help section appears there.
- AC5: a game saved at `/GG-counter/` is NOT shown in Quizzard → Scores and is never changed by it (separate data since
  2026-11-23); clearing Teams in Quizzard leaves the Scores game intact.
- AC6: `pnpm new:miniapp demo` + `pnpm verify` is green and "demo" is on Home, with no change to shell files besides the registry.
- AC7: logo, tagline, palette and install icon match `brand/`; a11y-check 0 FAIL in both themes.
- AC9: Settings → Data lists Teams, Scores and Quizzard with their sizes and the free space; after the first save `navigator.storage.persisted()` is requested (result shown); a mini-app's clear button changes only its own size.
- AC8: offline after one visit: Home and every mini-app opened before still work; a new version waits for "Reload".
- AC10: in Answer sheet, three right answers worth 1, 0.5 and 2 with a bonus of 1 show 4.5 for the round and in the total; a new round folds
  the first one to its result; after a reload the game is the same; Clear game empties it and Undo restores it; Bulgarian shows 4,5.

## 10. Risks
| Risk | Mitigation |
|---|---|
| Scope grows again (the 2025 attempt stopped at "too complex") | v1 = shell + two existing mini-apps only; quiz creator is a separate SPEC |
| Two looks: mini-apps were styled for their own accent | mini-apps read colours only from tokens; Quizzard supplies its tokens (GG Counter already does since T-12) |
| One source for two deploy targets (Quizzard + standalone) | decided in PLAN: mini-app packages live in this monorepo and the old repos build from them, or the reverse — one direction only |
| Shared origin: a bug in one app can read or clear another's data | namespaced keys, scoped clear (F8), e2e that checks foreign keys are untouched |
| React (GG Counter) inside a no-framework shell | the contract is `mount/unmount`; React is in the mini-app's lazy chunk |
| Old Quizzard users lose their old quizzes | accepted by Moni (clean slate); code and site history stay in `legacy-2025` |
| iOS: installed Quizzard has storage separate from installed GG Counter | documented in Help; export/import moves a game |

## 11. Deferred decisions
| Decision | Who/when |
|---|---|
| Shell level (1 or 2) and where mini-app source lives | PLAN |
| Bulgarian tagline | with the texts task |
| Simplified mark for 16–24 px | icons task |
| Quiz creator, AI through MCP, animated mini-wizard | later SPECs |
