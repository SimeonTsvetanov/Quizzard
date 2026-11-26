# Quiz creator — SPEC

**Status:** approved by Moni 2026-11-23. Sources: `BRIEF.md` (his requirements, the reference quiz) and
his answers of 2026-11-23. After approval: `PLAN.md` (tasks), then build. Mini-app id `quiz`, route `#/quiz`.

## 1. Purpose

Today Moni's group builds quiz nights by hand in PowerPoint — slow and painful. The quiz creator makes it **very
easy to collect questions into a quiz** on a phone or a computer and to **export one HTML file** that a host plays
on a TV or projector: questions with a timer, answers, team scores, leaderboard, podium — like the reference quiz.

The leading rule of the design: **modular and forward-compatible**. New question kinds, round kinds and looks are
added later without touching what exists, and **a quiz made today opens and plays in every later version**.

## 2. Scope of version 1

| # | Feature |
|---|---|
| F1 | **Library:** a list of quizzes (name, rounds, questions, size, last changed); create, open, rename, duplicate, delete (confirm + Undo). |
| F2 | **Rounds:** add, rename, reorder, delete. Round settings: name, default **time** per question, default **points**, default **question kind** and **answer type** for new questions, optional rules text shown before the round. |
| F3 | **Questions:** add, edit, duplicate, reorder, move to another round, delete. Adding asks the **kind** first (preselected from the round's default): **text, picture, audio, video**. |
| F4 | **Answer types** for every kind: **open** (answer text), **multiple choice** (2–8 options, **one or several correct**), **true / false**. Every question also has an optional **explanation** shown with the answer. |
| F5 | **Time and points per question:** taken from the round unless changed for this question; the question remembers its own values. |
| F6 | **Points as number + note:** points are a number (for adding up) and an optional **free text** shown to the teams, e.g. "1 for the band, 2 with the song". The note may stand alone. |
| F7 | **Media from the device:** the system file picker; the file is stored with the quiz on the device. Formats and limits: §5. A file that is too big or of the wrong format gets a clear message saying what is allowed. |
| F8 | **Preview:** every question is a small slide-like card in its round; tapping it opens a full preview drawn by the same code as the exported player. |
| F9 | **Export to play:** one **HTML file** (the player, §6) with the quiz and all its files inside; works offline, nothing is loaded from the internet. |
| F10 | **Quiz file:** export and import of a quiz as one file to **send to another person or device and keep editing** (and as a backup). Opening a quiz file someone sent you adds it to your library. |
| F11 | **Player:** title → teams → per round: rules → questions with the timer → answers revealed one by one → score entry → leaderboard → … → podium, tiebreak when level. Details: §6. |
| F12 | **English and Bulgarian**, light and dark, phone and desktop, same look as the other tools (the `quiz` violet accent). Help section and user docs. |

**Not in version 1** (designed for, built later): special question and round kinds (hints,
wheel … — Golden pyramid and Safe came in §10); themed looks of the player; trimming or shrinking audio/video inside Quizzard; making a quiz with AI;
online sharing; several people editing one quiz.

## 3. Architecture — how it stays extendable

### 3.1 Data model (version 1 of the format)

```ts
QuizFile   { format: "quizzard-quiz", version: 1, quiz: Quiz, media: MediaEntry[] }
Quiz       { id, name, createdAt, updatedAt, language, rounds: Round[], settings: { teams: number } }
Round      { id, kind: "standard", name, rules?: string,
             defaults: { seconds: number, points: Points, questionKind: string, answerType: string },
             questions: Question[] }
Question   { id, kind: "text" | "picture" | "audio" | "video" | …, prompt: string,
             media?: MediaRef, answer: Answer, explanation?: string,
             seconds?: number, points?: Points }           // set only when different from the round
Answer     { type: "open", text: string }
         | { type: "choice", options: { id, text }[], correct: id[] }   // one or several
         | { type: "trueFalse", correct: boolean }
Points     { value: number, note?: string }
MediaRef   { id }        MediaEntry { id, type: "image"|"audio"|"video", mime, name, bytes, width?, height?, seconds? }
```

`kind` and `type` are **open strings**, not a closed list: the code that handles each lives in a registry.

### 3.2 Registries (the modular part)

| Registry | An entry provides | Version 1 entries |
|---|---|---|
| **Question kinds** | data schema + defaults, the editor form, the preview/player renderer, which media it needs | text, picture, audio, video |
| **Answer types** | schema, the editor part, how it shows on the question screen and at the reveal | open, choice, trueFalse |
| **Round kinds** | which screens the round produces in the player (rules, questions, answers, score) | standard |
| **Player looks** | a stylesheet over the same markup | default |

Adding "golden pyramid" later = one new entry (its schema, its form, its renderer) and nothing else changes. The
creator's lists, the preview, the export and the player all go through the registries.

### 3.3 Old quizzes keep working

- Every saved quiz and every quiz file carries `version`. Opening runs **migrations** `1 → 2 → …` (pure functions,
  each with tests and a saved sample file of the older version kept in the repo).
- A file from a **newer** Quizzard than the one opening it is refused with a clear message ("update Quizzard"),
  never half-read.
- A question whose **kind is unknown** to this version is kept untouched and shown as "not supported in this
  version" — never dropped, so saving does not lose it.
- **An exported HTML never changes:** it contains the player of the day it was made, so it plays the same for good.

### 3.4 Code layout (`miniapps/quiz/`)

- `packages/core` — the model, validation (Zod), migrations, the registries' pure parts, limits, the quiz-file
  format, the export assembler. No DOM; unit and property tests.
- `packages/player` — the played quiz: its own small bundle (no framework), built into one template file.
- `packages/miniapp` — the creator's screens behind the Quizzard `mount` contract; no framework (Level 1), like the
  Answer sheet. Storage only through its storage module.

### 3.5 Storage

- Quizzes and media in **IndexedDB** (database of the area `quizzard-quiz:v1`); media as files (Blobs), apart from
  the quiz data, so a list opens fast. localStorage cannot hold media. Where the browser refuses a Blob in
  IndexedDB (WebKit in a private window) the same file is kept as its bytes and type (DECISIONS 2026-11-24).
- Shown in Settings → Your data with its size; Clear deletes it; the app-wide Export/Import does **not** include
  media (too large) — quizzes travel as quiz files (F10). Persistent storage is requested with the first media file.
- Before adding a file the free space is checked; "not enough space" is a clear message, never a silent failure.

## 4. Screens of the creator

1. **Library** — quiz cards, "New quiz", "Open a quiz file".
2. **Quiz** — name, its rounds as a list with question counts and total time; "Add round"; "Preview", "Export to
   play", "Save quiz file".
3. **Round** — settings on top, question cards (slide previews) below, "Add question".
4. **Question editor** — kind → text → media (if the kind has one) → answer type and answers → points and time
   (showing "from the round" until changed) → explanation. Saves as you type; Undo for deletes.
5. **Preview** — the question as it will be played, in the player's own rendering.

One screen per step, no long scrolling forms; every control reachable with one hand on a phone.

## 5. Media: formats and limits

Checked against MDN's media guides (2026-11-23): MP4 with H.264 video and AAC audio is "a broadly-supported
combination — by every major browser"; MP3 and AAC-in-MP4 are the audio formats MDN states all major browsers
play; JPEG, PNG, GIF, SVG and WebP are listed for all versions of Chrome, Edge, Firefox, Opera and Safari.

| | Accepted in version 1 | Limit | On import |
|---|---|---|---|
| Picture | JPEG, PNG, WebP, GIF | 15 MB as picked | Large photos are scaled down to 1920 px on the long side and re-saved (JPEG/WebP); never stretched or cropped |
| Audio | MP3, M4A (AAC) | 15 MB each | Kept as is |
| Video | MP4 (H.264 + AAC) | 50 MB each | Kept as is; the codec is checked by trying to play it |
| Whole quiz | | 250 MB of media | The quiz screen shows the size used |

- Not accepted in version 1: HEIC photos (iPhone's own format — the picker usually converts them; if not, the
  message says so), WAV, OGG, MOV, WebM, SVG (can carry scripts).
- **Why these numbers:** inside the HTML every file becomes text about one third larger and is held in memory while
  playing; 250 MB of media is a ~335 MB file, the most a laptop browser opens comfortably. They are constants in
  `core` and easy to change after real use.
- A refused file's message names the file, its size or format, and the limit. Later: a Quizzard tool to shrink or
  trim audio and video, linked from that message (not in version 1).

## 6. The player (the exported HTML)

- **One file:** the player's code and styles, the quiz as data, each media file embedded and turned back into a
  playable file when the page opens. No network. Strict Content-Security-Policy inside the file.
- **Flow** (after the reference quiz): title → team names (2–12, default 4) → per round: rules → each question
  (kind renderer: text on top, media below — pictures fit the space with their own shape, audio/video with
  play/pause — then the options) with the **timer** (question's seconds; runs by itself and moves on; the host can
  pause, restart, go back) → "Answers" → reveal one by one with the explanation → **score entry** per team (number;
  the points note is shown) → **leaderboard** → … → **podium**; **tiebreak** when the first place is shared (the
  host picks the winner or adds points — closest-number questions are a later kind).
- **Control:** on-screen buttons and keys (Space next, ← back, T timer, M menu, S scores, F full screen); a menu to
  jump to any round. Game state (teams, scores, position) is saved in the browser: a reload continues.
- **Scales like a slide** to the projector; usable on a phone too. English or Bulgarian by the quiz's language.

## 7. Acceptance criteria

| # | Criterion |
|---|---|
| AC1 | A quiz with 3 rounds and one question of every kind × every answer type is made on a phone (390 px) with no page that needs sideways scrolling; it survives a reload and an app restart. |
| AC2 | A question shows the round's time and points until changed; after a change it keeps its own when the round's defaults change. |
| AC3 | Points accept a number, a note, or both; the note appears on the question in the player and at score entry. |
| AC4 | A picture of any shape is shown whole, undistorted, in the preview and the player (portrait, landscape, panorama). |
| AC5 | A file over the limit or of another format is refused with a message naming the file and the limit; nothing is saved from it. |
| AC6 | "Export to play" gives one HTML file that opens from disk with no network (checked with the network off) and plays every question, including audio and video, in Chromium, Firefox and WebKit. |
| AC7 | "Save quiz file" on one device and "Open a quiz file" on another gives the same quiz, media included; opening it twice does not duplicate media. |
| AC8 | A version-1 sample file kept in the repo opens in every later version (migration test); a file of a newer version is refused with a message; an unknown question kind is kept through open → save. |
| AC9 | The player runs a whole game: teams, timer with auto-advance, reveal, score entry, leaderboard, podium, tie handling; a reload in the middle continues where it was. |
| AC10 | Adding a new question kind in a test (a fake "kind") needs no change outside its own registry entry. |
| AC11 | Accessibility AA (contrast, 44 px targets, keyboard, screen-reader names) in the creator; reduced motion respected in both. Size: the creator's code ≤ 75 KB gzip on first open (60 KB until 2026-11-26); the player template ≤ 80 KB gzip without media. |

## 8. Risks

| Risk | Answer |
|---|---|
| Scope — the 2025 attempt stopped at "too complex" | Build in slices that are each usable: (1) model + library + text questions + preview, (2) the player and export, (3) pictures, (4) audio and video, (5) quiz files. |
| Device storage is cleared (iPhone, weeks unused, not installed) | Persistent storage request, the size shown, quiz files as backup, a hint to save a quiz file after big edits. |
| A huge HTML does not open on a phone | Limits (§5), the size shown before export, a warning above 100 MB. |
| A video's codec is not playable | Tried on import; refused with a message naming MP4 (H.264 + AAC). |
| Copyright of pictures, music, clips | The author's own responsibility: one line in Terms; files never leave the device except in files the author exports. Legal review before release. |

## 9. Decisions taken with Moni (2026-11-23)

1. The player has the whole game: teams, scores, leaderboard, podium, tiebreak.
2. Version 1 is hand-made quizzes with the user's own files; making quizzes with AI is a later feature.
3. Audio and video are accepted in one safe format each with size limits and clear errors; shrinking/trimming is a later tool.
4. A quiz can be sent to another person and opened on their phone (quiz file).
5. Multiple choice may have several correct options; points are a number and/or free text.
6. Above all: easy and fast to collect questions; modular so that new kinds are added later and old quizzes keep working.

## 10. Special rounds: Golden pyramid and Safe (2026-11-24)

Moni's request of 2026-11-24 — the first round kinds after `standard` (§3.2: one registry entry each). Both
are created ready-made, played with the same flow (rules → questions → "Answers" → reveals → score entry →
leaderboard) and scored by the host per team per round, as every round (teams write on paper).

### 10.1 Rules

| | Golden pyramid (`pyramid`) | Safe (`safe`) |
|---|---|---|
| Questions | exactly 4 | exactly 5 |
| What a team writes | question *n* asks for *n* answers (1, 2, 3, 4) | one digit 0–9 per question: the five digits are the safe's code |
| Points | 1 per answer that is in the question's list of **accepted answers**, at most *n* — 10 in all | 1 per right digit; all 5 right adds the **bonus** (default 3, 0–20 in the round's settings) on top: 5 + 3 = 8 |
| Over-answering | a team that writes more answers than asked scores 0 for that question | — |
| Answer type (fixed) | `list`: accepted answers, at least *n* for question *n*, more allowed (e.g. 50 US states) | `digit`: one digit 0–9 |
| Order | fixed: the position decides how many answers a question asks for | the questions may be reordered |
| Default time | 60 s per question | 45 s per question |

Question kinds text, picture, audio and video stay available in both. Questions cannot be added, deleted,
duplicated or moved into or out of a special round: those controls are not shown, and where a control is
expected a line says why ("A Golden pyramid round has exactly 4 questions").

### 10.2 Format (still version 1 — optional fields only)

- `Round.kind`: `"pyramid"` or `"safe"`; `Round.data` (new, optional, validated by the round kind): Safe
  `{ bonus: number }`. Pyramid question *n* stores `points: { value: n }` (question 1 takes the round's 1), so
  every reader adds the right numbers; the creator does not offer points in a special round.
- New answer types: `{ type: "list", items: string[] }` and `{ type: "digit", digit?: number }` (absent = not
  chosen yet). They are offered only in the round kind that fixes them.
- An older Quizzard keeps such a quiz untouched: the round kind is unknown (no screens, the player passes over
  it), its questions show as "not supported in this version" — nothing is lost on save (§3.3).
- Saved games do not change: a round's points per team stay one number. The Safe's entry is "digits right
  0–5"; the stored points are the digits plus the bonus at 5, so totals, the leaderboard, the Scores dialog,
  saved games and Undo need nothing new.

### 10.3 Screens

- **Creator.** "Add round" opens a chooser with three cards — Standard, Golden pyramid, Safe — each with its
  icon and one sentence. A special round arrives with its questions, points, answer type, default rules text
  (EN or BG by the quiz's language, editable) and time. Its card and pane carry a badge with the kind's icon
  and accent (gold pyramid, steel-and-brass safe). Settings: time and rules as usual; points as a fixed line
  ("1 point per correct answer · 10 in all"); Safe: the bonus. Editor: Pyramid — "Accepted answers", a list
  with the counter "asks for 3 · 7 accepted" (fewer than asked = not finished); Safe — ten big digit buttons.
- **Player.** The rules screen shows a small animated explanation (pyramid tiers 1-2-3-4; five code windows
  filling up and the bonus). Question and answer slides of a special round carry the round's picture on the
  side of a wide slide (on top, smaller, on an upright one); the question text keeps its own area.
  - Pyramid: four tiers of gold blocks (1, 2, 3, 4). The current question's tier glows; earlier tiers are
    filled. Before the reveal the answer area shows *n* numbered lines and "Write 3 answers — more than 3
    scores 0". At the reveal the tier's blocks flip one by one and the accepted answers appear as gold tiles:
    the first 12, then "+N more" (the host panel and the printed answers have the whole list).
  - Safe: a vault door with a dial (0–9), five lamps and five code windows. The current window glows; at each
    reveal the dial turns to the digit and it clicks into its window; the code so far stays on later slides;
    after the fifth digit the bolts slide back and the door swings open on the gold.
  - Score entry: Pyramid — a stepper 0–10; Safe — digits right 0–5, at 5 "5 + 3 bonus = 8". The points guide
    says the kind's rule. The round's answer list (score screen, break) shows Pyramid's accepted answers
    shortened ("Ohio, Iowa, Utah … +47") and Safe's digits with the whole code under them.
- Reduced motion: no turning, flipping or swinging; every state change is still visible at once. Animations
  are CSS (finite) and SVG drawn by the player's own code: they work in the exported page under its CSP.

### 10.4 Acceptance criteria

| # | Criterion |
|---|---|
| SR1 | "Add round" → Golden pyramid gives a round of 4 questions (points 1–4, `list`, rules text, 60 s); → Safe gives 5 questions (`digit`, bonus 3, rules, 45 s). |
| SR2 | In a special round there is no way to add, delete, duplicate or move a question in or out, nor to change its answer type or points; Pyramid questions do not move, Safe questions do. |
| SR3 | A Pyramid question with fewer accepted answers than it asks for, and a Safe question without a digit, count as not finished. |
| SR4 | The player plays both rounds start to end in the app, the audience window and the exported page; a reload keeps the game; the Safe's 5 digits store 5 + bonus points. |
| SR5 | A quiz with special rounds survives the quiz file round trip; a version-1 file without them opens as before. |
| SR6 | Phone 390 × 844 and 1280 × 800 / 1920 × 1080, light and dark, EN and BG: no clipped text, AA contrast, the question text never under the pyramid or the vault, also with a 500-character question. |
