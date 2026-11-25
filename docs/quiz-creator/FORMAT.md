# Quiz file format (`.quizzard`)

The file "Save quiz file" writes and "Open a quiz file" reads (SPEC F10, AC7): one file with a quiz
and all the media its questions use. Writer and reader: `miniapps/quiz/packages/core/src/quiz-file.ts`
(pure) with `packages/miniapp/src/quizfile/` (Blobs). MIME type `application/x-quizzard`.

## Layout — container version 1

| Offset | Size | Content |
|---|---|---|
| 0 | 8 | Magic: ASCII `QUIZZARD` |
| 8 | 1 | Container version: `1` |
| 9 | 3 | Reserved, zero |
| 12 | 4 | `N` — length of the header in bytes, unsigned 32-bit, **big-endian** |
| 16 | `N` | Header: UTF-8 JSON (below) |
| 16 + `N` | … | The media files' bytes, one after another, in the order of `parts`; nothing between or after them |

Header:

```json
{ "container": 1, "app": "Quizzard", "file": { "format": "quizzard-quiz", "version": 1, "quiz": {}, "media": [] }, "parts": [{ "id": "m1", "bytes": 12345 }] }
```

- `file` is the same versioned `QuizFile` every stored quiz is (SPEC §3.1); its `media` lists exactly
  the files that follow, and each entry's `bytes` equals its part's `bytes`.
- Optional fields of version 1 added on 2026-11-25 (older code keeps them and ignores them): a question's
  `answerMedia: { id }` — a picture shown with its answer; a round's `data` for the kinds `laugh`
  (`first`, `second`: the two prizes) and `task` (`points`: the most a team can get), whole numbers 0–20;
  the answer type `none` (`{ "type": "none" }`) of those kinds' one question.
- `parts` gives the order and the exact size of each media file. The file's total size must be
  `16 + N + Σ parts.bytes`.

## Two versions

- **Container version** (byte 8 and `container`): the bytes around the quiz. A higher one than the
  reader knows → "made with a newer Quizzard".
- **Quiz version** (`file.version`): the quiz model. Opened through core `open()`: a newer one is
  refused whole, an older one is migrated step by step (`migrate.ts`). Fields a reader does not know
  are kept.

## Reading rules

Refused with its reason (`QuizFileFailure`): not the magic → `not-a-quiz`; a later container or quiz
version → `newer`; a header that is not JSON, parts that do not match `file.media`, a size that does
not add up (a cut download) → `damaged`; a quiz the schema refuses → `invalid`; a media file of a
type this version does not take, over its own limit, or a quiz over the whole limit (SPEC §5) →
`media-format`, `media-too-big`, `quiz-too-big`. A header longer than 64 MiB is `damaged`.

## Why this container

- **Nothing is base64-ed and nothing is read into memory.** The writer joins the head and the stored
  media Blobs as parts of one Blob; the reader cuts each media file out with `Blob.slice`. A quiz
  with 250 MB of media is a 250 MB file and saves and opens without holding it in memory — on a
  phone too. (JSON with base64 inside would be a third larger and one string in memory.)
- **No library and no compression step.** Media (JPEG, MP3, MP4) is already compressed; a ZIP writer
  and reader would be code to carry and to trust for no gain.
- **The quiz inside is the ordinary quiz JSON**, so validation and migrations are the ones every
  stored quiz already goes through.

## Compatibility

`core/test/fixtures/quiz-file/v1/fixture-night.quizzard` (with its expected quiz next to it) is kept
for good: `player/test/quiz-file-fixture.test.ts` opens it and checks this version still writes the
same bytes; `tests/e2e/quiz-media.spec.ts` opens it through the app. A format change adds a
container version (or a quiz version with a migration) and a new fixture; the old ones stay.

## Special rounds in quiz version 1 (2026-11-24)

The Golden pyramid and the Safe (SPEC §10) needed no new version: only optional fields and new
open-string values, which every version-1 reader keeps.

| Where | Field | Values |
|---|---|---|
| `Round.kind` | (open string) | `"pyramid"`, `"safe"` |
| `Round.data` | optional object, checked by the round kind | Safe: `{ "bonus": 3 }` (a number ≥ 0; absent = 3) |
| `Answer.type` | (open string) | `"list"` — `{ "items": ["Ohio", "Iowa"] }`; `"digit"` — `{ "digit": 7 }` (absent until picked) |
| `Question.points` | as before | Pyramid question *n* has `{ "value": n }` (question 1 takes the round's 1) |

An older Quizzard opens such a quiz, keeps the rounds untouched, plays none of their screens and shows
their questions as "not supported in this version". `core/test/fixtures/v1/special-rounds.quiz.json` is
kept for good next to `sample.quiz.json`.
