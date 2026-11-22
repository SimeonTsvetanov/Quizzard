# DECISIONS — Quizzard

Format: date · decision · reason.

- 2026-11-22 · Clean slate: the 2025 code (React + MUI, 32,000 lines) is archived in branch `legacy-2025` and not reused; the repo and the URL `/Quizzard/` stay. · Moni: "clean the old repo and recreate it, everything new". Forge flow rule 10 (migrate, not rewrite) is waived by him for this repo: old saved quizzes are not migrated.
- 2026-11-22 · v1 scope = suite shell + TeamSync + GG Counter as mini-apps + the path for a quiz creator; quiz creation, AI and the knowledge part come later as their own SPECs. · Moni 2026-11-22.
- 2026-11-22 · Architecture: one PWA (one manifest, one service worker), mini-apps as lazy modules behind a `mount` contract; the standalone sites of TeamSync and GG Counter stay live at their URLs. · forge `docs/RESEARCH-QUIZZARD-2026-11-22.md` §2 (nested PWAs are discouraged by web.dev; a hub of links shows a URL bar on phones).
- 2026-11-22 · Logo = variant A (the wizard as he was, three stars on the hat); a friendlier face was drawn and rejected. · Moni: "definitely A", "three for luck".
- 2026-11-22 · Tagline: "The Quiz Toolkit" (for now). · Moni.
- 2026-11-22 · Install (maskable) icon background: cream `#F3E9CF`. · Moni.
- 2026-11-22 · Contact email: the same as GG Counter. · Moni.
- 2026-11-22 · The friend's `quiz-maker` code is not used; the quiz format is Moni's own design and will be redesigned with the quiz creator. · Moni.
- 2026-11-22 · Palette **C · Emerald**: accent `#00804F` (light, white text 5.00:1), `#34D399` in the dark theme with near-black text; highlight = the logo gold `#F9D45C` (a fill with dark text, never text on light); neutrals = the forge greys; semantic colours from `brand/PALETTE-RESEARCH.md`. · Moni picked C from the three mock-ups. Consequence: success sits next to the accent hue, so "success/correct" always carries an icon or text, never colour alone — to settle before the quiz creator shows right/wrong answers.
- 2026-11-22 · Everything else in the look is the forge design system unchanged, as in TeamSync and GG Counter: tokens, sheets and dialogs, motion tokens and the short animations, frosted header, phone-first layout. Only the accent and the brand files are Quizzard's own. · Moni: "as in our apps — the animations stay, the modal windows, everything as we have done it".
