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
    test/                unit + property tests; fixtures/v1/*.json (kept for good, AC8)
  packages/miniapp/    @simeonts/quizzard-quiz-miniapp — the creator behind the mount contract
    src/storage/         IndexedDB (quizzes, media); the only code that touches storage
    src/kinds-ui/        per kind: editor part + slide renderer (registered next to core's entry)
    src/answers-ui/      per answer type: editor part + slide/reveal renderer
    src/screens/         library, quiz, round, editor, preview — one module each, a tiny router inside the tool
    src/render/slide.ts  the shared slide renderer (thumbnail, preview, and later the player)
    src/i18n, src/dom, src/styles (one file per component, `quiz-` prefix)
  packages/player/     (slice 2) the played quiz, built into one template file
```

Rules that keep it extendable:
1. **Nothing switches on `kind` or `type` outside the registries.** Screens ask the registry (label, icon, form,
   renderer). AC10 is a test: a fake kind registered in the test appears in the picker, edits, renders and saves.
2. **Core never imports UI; UI never touches storage except through `storage/`; the player imports only core + render.**
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

## 4. Definition of done (every task)
`pnpm verify` green; the Chromium e2e suites green locally; screenshots looked at on 360, 412, 800 and 1280 px in
light and dark, EN and BG; no `infinite` animation, no backdrop blur on repeated items; docs and CHANGELOG updated;
then push to main (deploys in ~3 minutes) and a check of the live site.
