# Quiz creator — PLAN

**Approved by Moni 2026-11-23** ("go"; SPEC.md). Built in five slices, each usable on its own and shipped when
green. Reference implementation for conventions: `miniapps/sheet` (Level 1, no framework, scoped CSS, i18n, tests).

## 1. Design

### 1.1 Idea: "the quiz as a deck of cards"
A quiz is a **deck**: rounds are stacks, questions are cards. The creator always shows where you are in the deck
and one clear next step. The look is Quizzard's own (glass panels, Unbounded for titles and numbers, Manrope for
text) in the tool's **violet** (`toolAccents.quiz`), with one small colour per question kind so a round reads at a
glance: text = violet, picture = emerald, audio = gold, video = blue (the other tools' accents, as chips and card
edges only — never as text on a tint).

### 1.2 Screens
| Screen | Phone (< 700 px) | Tablet / desktop (≥ 700 px) |
|---|---|---|
| **Library** | One column of quiz cards (name, rounds · questions · minutes, last changed), a wide "New quiz" button on top; empty state = the wizard with one line and the button | Card grid (auto-fill, min 16 rem); same actions in a top row |
| **Quiz** | Header card: name (edit in place), totals (rounds, questions, play time), actions (Preview · Export · ⋯). Rounds as stacked cards, each with its number, name, counts and the kind dots of its questions; "Add round" at the end | Two panes: rounds list (left, 20 rem) and the open round (right) — no page change to move between rounds |
| **Round** | Collapsible settings strip (name, time, points, defaults) and the question cards in one column; a floating "Add question" button above the thumb | Question cards in a grid of slide thumbnails (16:9), settings in a strip above |
| **Question editor** | Full-screen sheet, steps top to bottom: kind chips → question text → media → answer type → answers → points & time → explanation; a sticky bar with "Done" and the live mini preview behind a "Preview" switch | Dialog in two columns: the form (left), the live preview slide (right), always in view |
| **Preview** | Full screen, the player's own rendering, swipe or arrows between questions | Same, in a 16:9 stage |

- **One-hand rule (phone):** primary actions sit in the lower half; nothing needs sideways scrolling; lists scroll,
  the frame does not (as the Answer sheet).
- **Question card (thumbnail):** a 16:9 mini slide drawn by the same renderer as the player, scaled; under it the
  number, the kind chip, time and points (only when they differ from the round's they show in the accent).
- **Motion (finite, composited):** cards deal in with a short stagger on first view; a new card pops; reorder slides.
  None with reduced motion. No backdrop blur on repeated cards.
- **Feedback:** saving is automatic ("Saved" tick in the header, no Save button); deletes confirm when they lose
  work and offer Undo; limits explain themselves at the control ("8 options at most").
- **Empty and error states** are designed, not blank: no quizzes, no rounds, no questions, storage full, file refused.

### 1.3 Accessibility and languages
Every control has a name; cards are buttons/links with the question text as their name; reorder also by buttons
("Move up/down"), not drag only; focus returns to the card after the editor closes; 44 px targets; AA contrast in
light and dark; English and Bulgarian from the first slice.

## 2. Code architecture (extends SPEC §3)

```
miniapps/quiz/
  packages/core/       @simeonts/quizzard-quiz-core — no DOM
    src/model.ts         types + Zod schemas of QuizFile v1 (open `kind`/`type` strings + per-kind payload)
    src/registry.ts      createRegistry<T>(): register / get / list / has — used for all four registries
    src/kinds/           one file per question kind: schema, defaults, summary(), mediaType
    src/answers/         one file per answer type: schema, defaults, isComplete(), revealText()
    src/rounds/          round kinds: screens(round) → the ordered player screens
    src/migrate.ts       migrations[] + open(file): newer → refuse, older → migrate, unknown kind → keep
    src/limits.ts        every number of SPEC §5 and the model limits (names, counts)
    src/ops.ts           pure edits: addRound, moveQuestion, effectiveSeconds/Points, duplicate, totals …
    src/ids.ts           id generation (injectable for tests)
    src/export.ts        "Export to play": template + quiz + media → one HTML page (pure); the hand check the player reads with
    src/play.ts          the entry the player imports: no Zod (answers/shapes.ts, effective.ts, rounds/kinds.ts, format.ts)
    test/                unit + property tests; fixtures/v1/*.json (kept for good, AC8)
  packages/player/     @simeonts/quizzard-quiz-player — the played quiz (slice 2); imports core's `play` entry only (no Zod)
    src/render/          the shared slide renderer + the slide parts of kinds and answer types (`…-player/render`:
                         the creator's thumbnails, live preview and Preview draw with it too)
    src/game/            the pure state machine: screens from `screensOf`, `step(state, action)`, scores, saved game
    src/views/           one view per screen name, in a registry (stage + host-panel part)
    src/ui/              stage (scales like a slide), dial, control bar, host panel, menu, scores dialog
    src/channel.ts       host window ↔ audience window (a `Transport`: today `postMessage`)
    src/standalone.ts    entry of the exported page; build.ts → dist/template.html (one file, strict CSP)
  packages/miniapp/    @simeonts/quizzard-quiz-miniapp — the creator behind the mount contract
    src/storage/         IndexedDB (quizzes, media) and the saved game; the only code that touches storage
    src/kinds-ui/        per kind: editor part (+ the player's slide part, registered next to core's entry)
    src/answers-ui/      per answer type: editor part (+ the player's slide part)
    src/screens/         library, quiz, round, editor, preview, play — one module each, a tiny router inside the tool
    src/play/, export/   lazy: the player in the app ("Play", audience window) and "Export to play"
    src/i18n, src/dom, src/styles (one file per component, `quiz-` prefix; the player's is `qp-`)
```

Rules that keep it extendable:
1. **Nothing switches on `kind` or `type` outside the registries.** Screens ask the registry (label, icon, form,
   renderer). AC10 is a test: a fake kind registered in the test appears in the picker, edits, renders and saves.
2. **Core never imports UI; UI never touches storage except through `storage/`; the player imports only core's
   `play` entry and its own files; the creator loads the player lazily and only its `render` up front.**
3. **Data in, data out:** `ops.ts` functions return new quizzes (no mutation), so Undo is "keep the previous value".
4. **Every stored object carries `version`;** reading goes through `migrate.open()` only.
5. **Per-kind payload** lives under the question (`question.data`) and is validated by that kind's schema; unknown
   kinds pass through as opaque JSON.

## 3. Slices and tasks

### Slice 1 — the creator with text questions (ships as 0.17.0)
- **Q-01 core:** model + schemas, registry, kinds (text; picture/audio/video declared with `mediaType`, usable
  from slice 3/4), answers (open, choice with several correct, trueFalse), round kind `standard`, ops, limits,
  migrate with the v1 fixture, tests (≥ 90 % lines; property tests for ops; AC2, AC3 logic, AC8, AC10).
- **Q-02 storage:** IndexedDB `quizzard-quiz` (stores `quizzes`, `media`), list/get/put/delete, size per quiz;
  registered in the shell's data areas (Settings shows and clears it); tests with fake-indexeddb.
- **Q-03 creator UI:** library, quiz, round, editor, preview for text questions on phone, tablet, desktop; i18n
  EN + BG; Help section; registry entry `quiz` becomes `ready`; route `#/quiz`.
- **Q-04 tests and docs:** e2e flows (AC1 for text, AC2, AC3, limits, reload), axe, size budget in
  `scripts/size-check.ts`, user docs page "Make a quiz" with generated screenshots, CHANGELOG, DECISIONS.

### Slice 2 — play (0.18.0)
- **Q-05 player:** `packages/player` (stage that scales like a slide, timer dial, auto-advance, reveal, teams,
  score entry, leaderboard, podium, tie), saved game state; **Q-06 export:** one HTML with strict CSP; e2e opens the
  exported file from disk with the network off in three engines (AC6, AC9).

### Slice 3 — pictures (0.19.0)
- **Q-07:** picker, validation, downscale to 1920 px, storage of blobs, picture kind UI, embedded in the export (AC4, AC5).

### Slice 4 — audio and video (0.20.0)
- **Q-08:** MP3/M4A and MP4 with the playability check, limits and messages, players in preview and export.

### Slice 5 — quiz files (0.21.0)
- **Q-09:** save / open a quiz file with media, de-duplication, share target for the file (AC7); legal lines; release notes.

### Slice 6 — special rounds: Golden pyramid and Safe (SPEC §10, 2026-11-24)
- **SR-01 core:** round kinds `pyramid` and `safe` (fixed count, fixed answer type, order, points by
  position, bonus in `Round.data`, the score entry's mapping), answer types `list` and `digit`, `addRound` with a
  kind, guards in the question ops, completeness per position, fixtures and unit tests.
- **SR-02 player:** the round's art on the slide (`render/rounds/`), the pyramid's answer area, the rules
  intro, score entry and Scores dialog through the kind's mapping, the answer list and the code, styles with
  reduced motion; unit tests.
- **SR-03 creator:** the kind chooser, badges and accents, settings (fixed points line, bonus), editor parts
  (accepted answers with the counter, digit picker), hidden controls with their reasons, EN + BG.
- **SR-04 checks and docs:** e2e (create, edit, play both kinds; walk places), screenshots, user docs (make a
  quiz, play a quiz, limits), Help, CHANGELOG, DECISIONS.

### Slice 7 — cut and shrink a clip while adding it (trial in `lab/`, Moni 2026-11-25)
Shipped in 0.23.0 (media/cut/): Chromium checked; reports from an iPhone and an Android phone are still open. Not built: "play from – to" where the browser cannot encode.
- **The limits check the result, not the file picked.** A video or sound over its limit (50 MB / 15 MB) is taken in, not refused:
  the question says what is wrong ("the file is too big" or "this format cannot be used") and that it must be changed, and
  the button that changes it ("Cut and shrink") is the accented one. The question is not finished until the file fits.
  A picture is already scaled down on the way in; one that is still too big gets the same message.
- A file that fits needs nothing: cutting stays an offer, never a step.
- The trim bar of the trial as it is (frames or loudness along one track, a handle at each end, Play for the kept part).
- Where the browser cannot encode: the part to keep is only remembered and played ("from – to"), and a file over the limit is
  refused with that reason, as today.
- A file that is still over the limit after a cut says so and offers a shorter part or a lower quality.
- Open: where an oversize original is kept until it is cut (memory only, never IndexedDB or the 250 MB of the quiz), and the
  largest file a phone can take in at all — to be measured.
- Mediabunny is loaded only when the bar opens; the CSP and the offline copy are checked with it; the original stays until the
  new file is confirmed.

## 4. Definition of done (every task)
`pnpm verify` green; the Chromium e2e suites green locally; screenshots looked at on 360, 412, 800 and 1280 px in
light and dark, EN and BG; no `infinite` animation, no backdrop blur on repeated items; docs and CHANGELOG updated;
then push to main (deploys in ~3 minutes) and a check of the live site.
