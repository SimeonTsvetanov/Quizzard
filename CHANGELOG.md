# Changelog

All notable user-facing changes. Format: Keep a Changelog · SemVer.

## [Unreleased]

## [0.8.0] - 2026-11-23
### Added
- Long-press the installed app's icon to open Teams, Scores or Answer sheet directly.
- Quizzard offers to install itself when you are back on the home screen after a tool saved something —
  never on top of a tool.
- Help answers "Can my data disappear on an iPhone?" and how to keep it.
### Changed
- Answer sheet: the number at the end of a line is what the line brings. Type 6 and the line counts as
  right with 6 points; a wrong line shows 0.
- Answer sheet: a new line appears only when you tap "Add an answer" (or press Enter on the last line) —
  no empty line that is always there.
- Answer sheet: the rounds moved into the top bar next to the total, so more answers fit on the screen;
  "Delete round" is always at the bottom of a round.
- Search engines and AI assistants now get an accurate description of all three tools and ten questions
  with answers.
### Fixed
- Terms said Export covers only Quizzard's settings; it covers the tools' data too. The privacy notice
  now describes the last line of shared teams exactly.
- Import refuses a file that is too large before writing anything, and never writes outside a tool's
  own data.

## [0.7.0] - 2026-11-23
### Added
- Answer sheet: each round can say what a right answer gives ("A right answer gives" — 1 by default, for
  example 2 for a double round). Every line of the round follows; a question you change by hand keeps
  its own points and gets a green edge.
### Changed
- Answer sheet: tapping ✓ or ✗ no longer adds an empty line under the last one; a new line appears only
  when you write an answer (or press Enter on an empty line you left unanswered).
- Answer sheet is now one app screen instead of a long page: the total stays at the top, the rounds are
  numbers with their points (tap one to open it, + for the next round), and only the questions of the
  open round scroll. "Clear game" moved to the eraser at the top.

## [0.6.0] - 2026-11-23
### Added
- Answer sheet: a new tool for your team's scribe. Write the answers of each round on your phone instead
  of paper, tap ✓ or ✗ when they are read out and see the round's points and the total at once. A right
  answer gives 1 point; change it for any question (0.5, 2 …) and add bonus points to a round. The game
  stays on your device until you clear it.

## [0.5.0] - 2026-11-23
### Changed
- Teams and Scores now keep their data only inside Quizzard, separate from the TeamSync and GG Counter
  sites: clearing or changing something here never touches those apps, and the other way round. A list
  or game you saved before this version is still in TeamSync or GG Counter; in Quizzard, Teams and
  Scores start empty.

## [0.4.0] - 2026-11-22
### Added
- Help has a section for Teams and one for Scores — steps, features and questions; inside a tool its
  section comes first.
- Settings → Your data shows what Teams, Scores and Quizzard have saved, with a Clear for each tool.
  Export my data and Import data now carry the tools' data too.
- About lists the open-source projects the tools are built with.
### Changed
- Sharing the leaderboard from Scores ends with a link to Quizzard, and Share app says "Quizzard".
- Clear my data deletes the tools' data too and says so before you confirm.
### Fixed
- A note such as "Teams copied ✓" no longer stays on top of the menu you open right after it.
- Report a problem no longer mentions an email it never asks for, and the error screen no longer offers
  a "Send error report" button that could not send.

## [0.3.0] - 2026-11-22
### Added
- Scores: keep score on game night inside Quizzard — players, +/− and custom amounts, the last changes
  and their history, medals for the top three, and sharing the leaderboard. It is GG Counter, so a game
  saved there shows up here in the same browser, and the other way round.
- In Teams, copied and shared teams now end with a link to Quizzard.
### Fixed
- A notice such as "Ready to work offline" no longer replaces a message that has a button (for example
  Undo after Clear); it waits its turn.

## [0.2.0] - 2026-11-22
### Added
- Teams: make fair random teams in seconds inside Quizzard. It is TeamSync, so the names you saved there
  are here too, in the same browser.

## [0.1.0] - 2026-11-22
### Added
- The new Quizzard: a home screen with a card for each tool, light and dark themes, English and
  Bulgarian, and it works offline once installed. It replaces the 2025 version of Quizzard.
