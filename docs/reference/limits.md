# Limits

This page lists the limits of each tool and of import. Each limit is the same in English and in Български.

## Teams

| Limit | Value |
|---|---|
| Names in one list | 1,000 |
| Characters in a name | 100 |
| Teams | 2 to 10, and no more teams than names |
| Names needed | At least 2 |

Other rules:

- Spaces at the start and the end of a name are removed, and blank lines are ignored.
- Two people can have the same name.
- Team sizes differ by at most one person. The bigger teams come first.
- Every possible split is equally likely. Quizzard uses your device's secure random numbers.
- Quizzard saves the list of names and the number of teams on this device. It doesn't save the teams themselves.

## Scores

| Limit | Value |
|---|---|
| Players in one game | 50 |
| Characters in a name | 40. Spaces at the start and the end don't count, and a simple emoji counts as one character. |
| Score | -999,999 to 999,999 |
| Changes kept for each player | 50. Older changes are added together as **Earlier points**. |

Other rules:

- A blank name adds nobody. If the game has 50 players, or the name is too long, Quizzard shows the reason under the field.
- When a change would take a score past a limit, Quizzard keeps the score and shows a message under the card or the field.
- Two players can have the same name.
- The leaderboard ranks players by score, highest first. Players with the same score share a place and stay in the order you added them. Medals show places 1 to 3.
- Selections of **+** or **−** for the same player within 3 seconds count as one change in the list of changes.

## Answer sheet

| Limit | Value |
|---|---|
| Rounds in one game | 1,000 |
| Answers in one round | 60 |
| Characters in an answer | 120 |
| Characters in a round name | 40 |
| Points of one question or of the bonus | -999 to 999, with at most two decimals |

Other rules:

- A round starts at 1 point for each right answer. Change it in the **A right answer gives** field.
- A line that has its own points shows a green edge. A line you enter `0` for is marked wrong.
- A round always has at least one line, and a game always has at least one round.
- At 1,000 rounds, Quizzard shows "A game can have up to 1000 rounds."
- If your browser can't save the game, Quizzard says "This browser did not save the game. It stays on screen until you close the page."

## Quiz creator

| Limit | Value |
|---|---|
| Rounds in a quiz | 20 |
| Questions in a round | 50 |
| Options of a **Multiple choice** question | 2 to 8; one or several can be correct |
| Characters in a quiz name | 80 |
| Characters in a round name | 60 |
| Characters in a question | 500 |
| Characters in an open answer | 300 |
| Characters in an option | 120 |
| Characters in an explanation or a host note | 500 each |
| Characters in a round's rules | 600 |
| Characters in a points note | 80 |
| Time for a question | 5 to 600 seconds; a new round starts at 30 |
| Points for a question | 0 to 100; a new round starts at 1 |
| Picture | JPEG, PNG, WebP or GIF, up to 15 MB. A picture wider or taller than 1,920 px is scaled down. |
| Audio | MP3 or M4A, up to 15 MB |
| Video | MP4 (H.264 + AAC), up to 50 MB |
| Pictures, audio and video of one quiz | 250 MB together |
| Teams in a game | 2 to 12; a game starts with 4 |
| Characters in a team name | 40 |
| Points of a team in one round | 0 to 999 |

Other rules:

- Sizes are shown in MB of 1,024 × 1,024 bytes, the same unit as the limits.
- A file of another kind, a file over its limit, or a clip your browser can't play is refused with a message that names the file and the limit. Nothing is saved then.
- At a limit, the button that adds more is replaced by the reason, for example "20 rounds at most — this quiz is full."
- An export over 100 MB asks first: large files may not open on a phone.
- **Play** and **Export** ask first while questions are not finished.
- The search field in **Your quizzes** shows from 6 quizzes.

## Import

| Limit | Value |
|---|---|
| Size of an export file | 50 MB |
| Data of all tools in one file | About 3 MB |

A file over a limit is refused before Quizzard writes anything. A real export is far smaller.

## Related

- [Make teams](../how-to/make-teams.md)
- [Keep score](../how-to/keep-score.md)
- [Use the answer sheet](../how-to/use-the-answer-sheet.md)
- [Make a quiz](../how-to/make-a-quiz.md)
- [Quizzard user documentation](../index.md)
