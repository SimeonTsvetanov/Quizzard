# Quiz creator — brief (intake)

**Status:** intake, 2026-11-23. Moni's requirements as he described them, what the reference quiz does (§5), the first
technical direction and the open questions. Next: Moni answers §4 → `SPEC.md` for this mini-app → Moni approves →
`PLAN.md` → build. Nothing is built before the SPEC is approved.

## 1. What Moni asked for (his words, structured)

### Quizzes
- **QC-1** Many quizzes, not one: create, keep, open, rename, delete. Each quiz has a **name**; the list shows every
  quiz saved in the app.
- **QC-2** A quiz can be **exported** (the playable HTML, §Play) — and, by my reading, also moved or backed up
  (see open question O-3).

### Rounds
- **QC-3** A new quiz starts empty; you **add rounds**.
- **QC-4** A round has **settings**: name, **default points** per question, **default time** per question, and the
  **default question type** for new questions.
- **QC-5** There are no "round types" for now — a round is a name, its defaults and its list of questions. (Later
  there may be special rounds, see QC-14.)

### Questions
- **QC-6** Adding a question first asks **what kind** it is: **text**, **picture**, **audio** or **video**.
- **QC-7** Every kind can be answered as an **open answer** (people write it), **multiple choice** (A, B, C, D … as
  many options as the author adds) or **true / false**.
- **QC-8** A question takes the round's defaults, and **can override points and time** for itself only; the
  question keeps its own values once set.
- **QC-9** Picture, audio and video questions: the author **picks the file from the device** (the system file
  picker); the file is stored with the quiz on the device.
- **QC-10** Pictures are **never stretched or cropped**: they keep their own shape and fit the space. Layout when
  played: **question text on top, the picture below, the answer options under it**.
- **QC-11** After a question is made there is a **preview**, like a PowerPoint slide thumbnail: click it to see how
  the question will look.

### Play
- **QC-12** **Export** builds **one HTML file** from a ready-made template (like the friend's quiz): rounds,
  questions, pictures, audio, video, times and points all inside it, so it plays on its own.
- **QC-13** The played quiz uses each question's own time and points.

### Growth
- **QC-14** Must scale: new question kinds later (e.g. **"golden pyramid"**), new styles, possibly special rounds.
  Everything is built as objects / classes so a new kind is added in one place.

## 2. First technical direction (to be confirmed in the SPEC)

- **Model.** `Quiz { id, name, createdAt, updatedAt, rounds[] }` → `Round { id, name, defaults: { points, timeSeconds,
  questionKind }, questions[] }` → `Question { id, kind, prompt, media?, answer, points?, timeSeconds? }` where
  `points`/`timeSeconds` are set only when they differ from the round (QC-8). `answer` is one of `open { accepted[] }`,
  `choice { options[], correct }`, `trueFalse { correct }`. `media` is a reference `{ id, type, mime, name, width?,
  height?, duration? }` to a file stored apart from the quiz.
- **One registry of question kinds** (QC-14). Each kind registers: its data schema and validation, its defaults, its
  editor form, its preview card and its renderer in the exported HTML. Text, picture, audio and video are four
  entries; "golden pyramid" later is one more entry, with no change elsewhere. The same for answer types.
- **Storage.** Quiz data in IndexedDB; media files as Blobs in IndexedDB (or OPFS for large video), in the
  creator's own area (`quizzard-quiz:v1`), shown in Settings → Your data with its size; persistent storage asked on
  the first file. localStorage is far too small for media.
- **Export to one HTML file** (QC-12): the template is a complete page; the quiz is written into it as data, and
  every media file is embedded (base64) and turned back into a playable file when the page opens. Works offline,
  from a phone or a laptop, no server.
- **Editable copy** (O-3): a separate "quiz file" export/import to move a quiz to another device or keep a backup —
  the exported HTML is for playing, not for editing.
- **UI.** A list of quizzes → a quiz with its rounds → a round with its question cards (previews) → a question
  editor. Same look as the other tools (glass panels, display font, the tool's own colour — `quiz` already has a
  violet accent in `app.config.ts`).

## 3. Facts to keep in mind (checked or to check)

- **File size.** Embedding turns every file into text about 1/3 larger; videos make the HTML large. A quiz with
  several minutes of video can reach hundreds of MB — phones may refuse to open or share such a file. The SPEC sets
  limits (size per file and per quiz) and warns before export; options are to compress pictures on import and to
  advise short clips.
- **Device storage.** Browsers give a site a share of free disk; iPhone may clear a site's data after weeks without
  use unless the app is installed. Backups (O-3) matter here.
- **Formats.** Video/audio must play in the browsers that will show the quiz (MP4/H.264 + AAC, MP3/M4A are the safe
  choices; check against the template).
- **Rights.** The author adds their own pictures and clips; Terms/Privacy get a line that the files stay on the
  device and are the author's responsibility (legal review in the SPEC).

## 5. The reference quiz — "Quiz – Part 15" (read in full, 2026-11-23)

The last quiz Moni's group played (8.5 MB, one HTML file; kept outside the repo: it is a friend's work with photos of
unknown licence — only this summary is committed).

**How it is built.** One page: ~900 lines of CSS (a themed look, here "vault"), a fixed stage, and one script with the
quiz as data — `const DATA = { title, subtitle, tagline, theme, autoplay, farewell, tiebreak[], rounds: { r1…r9 } }`
— plus `const IMG = { "file.jpg": "data:image/jpeg;base64,…" }` (30 JPEGs, 6 MB) and four fonts embedded (100 KB).
No audio or video is embedded; nothing is loaded from the internet.

**The data.** A round: `title`, `seconds`, `points` (a sentence, e.g. "+2 for right, −1 for wrong"), optional `rules[]`,
`subtitle`, `theme`, `score_hint`. A question (`items[]`): `q`, `a` (the answer shown at the reveal), and by `kind`:
none = open answer, `tf` true/false, `mc` with `options[]` (A–D), `xy` either/or; `image`; `expl`/`sub` (a line under
the answer); `hints[]` for the audio-video round; `parts[]` for the golden pyramid (1 + 2 + 3 + 4 answers).

**How it plays** (a host at a laptop, the page on a TV or projector):
title → team names (4 by default) → for each round: rules → the questions one by one with the timer (a dial in the
header; it runs by itself and moves to the next question when time is up, with a short "next" cue; the host can pause,
go back, open the menu) → "answers" title → the answers revealed one by one ("Покажи") → **score entry** per team →
**leaderboard** with bars → … → final **podium** → **tiebreak** (closest number) when teams are level. Keyboard:
Space next, ← back, T timer, M menu, S board, F full screen. Sounds are generated in the page (no files). The game
state (teams, scores, position) is saved in the browser, so a reload continues the game.

**What it means for us.**
- It answers O-1, O-2 and O-5: projector + host; every question has an answer text (also open ones) and an optional
  explanation; the timer runs per question and the round plays itself.
- Its rounds are wired by name in the code (`r1`/`r3` = text, `r2` = pictures, `r4` = audio-video …) — a new round
  means editing the engine. Ours is driven by the data: each question kind and each round's answer screen come from the
  registry (§2), so the order and kinds are free.
- The export is the same idea — one page with the data and the files inside — so the player is our own template in
  this repo, built and tested like the tools; the creator fills it in.
- To carry over from it: the stage layout that scales with the projector, the timer dial, the auto-advance cue, the
  answer reveal, score entry + leaderboard + podium + tiebreak, keyboard control, saved game state. Its themed looks,
  the special rounds (wheel, cipher, vault, envelopes …) are later kinds in the registry.

## 4. Open questions for Moni

- **O-1** ~~How is it played?~~ Answered by the reference (§5): projector + host, answers after each round.
- **O-2** ~~Answer text for open questions?~~ Yes — every question has an answer and an optional explanation (§5).
- **O-3** Besides the playable HTML, do you want a file to **move or back up a quiz** and keep editing it on
  another device? (My recommendation: yes.)
- **O-4** Multiple choice: one correct option, or can several be correct?
- **O-5** ~~Timer?~~ Per question, runs by itself, the round plays on its own; the host can pause (§5).
- **O-7** The game part: should our player also do teams, score entry, leaderboard, podium and tiebreak like the
  reference — or only questions and answers, with scores kept in Scores?
- **O-8** Real audio and video files: the reference plays music outside the page (hints + pictures only). Do you
  want the files inside the quiz, as you described — yes is my reading.
- **O-6** Media limits you are happy with, e.g. pictures up to 10 MB each (compressed on import), audio/video up to
  50 MB each, the whole quiz up to 300 MB?
