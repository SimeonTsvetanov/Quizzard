# Changelog

All notable user-facing changes. Format: Keep a Changelog · SemVer.

## [Unreleased]

## [0.14.0] - 2026-11-23
### Changed
- A bolder look everywhere. Each tool has its own colour — Teams emerald, Scores gold, Answer sheet blue —
  on its home tile and through its whole screen.
- New fonts: Unbounded for headings and the big numbers, Manrope for text, both with Cyrillic.
- Home: the wizard greets you, the tiles carry their tool's colour and icon, the lights behind them drift
  slowly and a few stars twinkle.
- Answer sheet: its top bar is a banner in the tool's colour.
### Fixed
- Going back from a tool closes into the tile you opened, not into the top one: the tiles keep their order
  while the app is open, and the tool used last moves to the top the next time you open Quizzard.

## [0.13.0] - 2026-11-23
### Changed
- A new home screen: a greeting, the tools as tiles that rise in one after another, the tool you used last
  on top as a wide card, and a soft glow in the app's colours behind them.
- Opening a tool grows out of its tile, and going back shrinks into it again.
### Fixed
- "Ready to work offline ✓" no longer cuts another note short when it arrives at the same moment.

## [0.12.0] - 2026-11-23
### Added
- A small icon for the browser tab — the wizard's hat with a star — that stays readable at tab size.
- Each long-press shortcut (Teams, Scores, Answer sheet) has its own icon.
- The install window in Chrome and Edge shows pictures of the app.
### Changed
- The icon of the installed app sits on the wizard's cream background.

## [0.11.0] - 2026-11-23
### Changed
- The small notes ("Copied ✓", "Round 2 deleted · Undo") no longer linger: a plain note goes after about
  2.5 seconds, one with Undo after 5, and either goes at once when you tap anywhere else.
- Updated the libraries the tools are built with (React, Radix, i18next, Lucide icons).

## [0.10.0] - 2026-11-23
### Added
- Answer sheet: remove a line you added — tap the red minus next to "Add an answer", then the minus on
  the line. Undo brings it back.
- Answer sheet: a game can have up to 1,000 rounds. When the round numbers no longer fit, swipe them
  sideways or use the arrows at the ends; the plus for the next round is always in view.
### Changed
- Answer sheet: tidier layout — the round's result, "A right answer gives", every line's points and the
  bonus sit under one another in one column, with the same spacing throughout.

## [0.9.0] - 2026-11-23
### Added
- Help, Settings, About and the other windows opened from the menu have a Back arrow to the menu, and
  closing them returns to the open menu instead of the screen under it.
- A user guide: how to make teams, keep score, use the answer sheet, install the app and back up your
  data, with pictures in the light and the dark theme.
### Changed
- Teams: its Help no longer describes things only the separate TeamSync site has.

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
