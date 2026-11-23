# Quiz creator — brief (intake)

**Status:** intake, 2026-11-23. Moni's requirements as he described them, the first technical direction and the open
questions. Next: Moni sends the HTML quiz a friend made (the reference for the played quiz) → I read it in full →
`SPEC.md` for this mini-app → Moni approves → `PLAN.md` → build. Nothing is built before the SPEC is approved.

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

## 4. Open questions for Moni

- **O-1** The friend's HTML quiz: how is it played — one screen on a TV/projector, the host clicking through? Does
  it show answers at the end of a round? (Answer by sending the file; I will read it fully.)
- **O-2** Open answers: should the author type the correct answer (shown when answers are revealed), or is it only
  for the teams to write?
- **O-3** Besides the playable HTML, do you want a file to **move or back up a quiz** and keep editing it on
  another device? (My recommendation: yes.)
- **O-4** Multiple choice: one correct option, or can several be correct?
- **O-5** Time: does the timer run per question automatically, or does the host start it?
- **O-6** Media limits you are happy with, e.g. pictures up to 10 MB each (compressed on import), audio/video up to
  50 MB each, the whole quiz up to 300 MB?
