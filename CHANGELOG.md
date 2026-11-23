# Changelog

All notable user-facing changes. Format: Keep a Changelog · SemVer.

## [Unreleased]

## [0.16.3] - 2026-11-23
### Changed
- The animated background is everywhere now: behind Scores too, and on the Terms, Privacy, Contact and other
  pages and the "page not found" page. Settings → Background → Simple still turns it off everywhere.
- Light theme: the sun's beams are stronger and reach all the way down, over the mountains.

## [0.16.2] - 2026-11-23
### Changed
- Light theme: the sun is calmer and more grown-up — soft beams of uneven width that drift across each other
  like light through haze, a bright core with a wide glow and a faint lens halo, instead of drawn stripes.

## [0.16.1] - 2026-11-23
### Changed
- Opening and closing a tool is smoother: nothing else moves while the tile grows into the tool, and the tool
  appears sooner.
- Answer sheet: the button that removes answers shows a bin instead of a bare line.
- The Terms, Privacy, Contact and other pages use the app's fonts, with the text on a see-through card over the
  app's glow.
- A new "page not found": the wizard stands in for the zero of 404 — "This page vanished in a puff of smoke".
  It follows the app's language.

## [0.16.0] - 2026-11-23
### Added
- A new animated background: a starry night sky that drifts slowly in the dark theme, soft mountains under a
  turning sun in the light theme. Settings → Background → Simple brings back the quiet look with one tap.

## [0.15.1] - 2026-11-23
### Changed
- On phones and in the installed app the home screen has no top bar: just the menu button, beside the wizard and
  the greeting. Inside a tool the bar with Back stays.
- The name QUIZZARD sits at the bottom of the home screen there.
### Fixed
- The opening animation: the name no longer grows past its size and then snaps small — it flies to its place
  at the size it keeps.
- Switching screens very quickly no longer shows "Something went wrong".

## [0.15.0] - 2026-11-23
### Added
- A new opening: the wizard and the name QUIZZARD appear, then the wizard flies into the header and the name
  to its place under the tools (in the footer on a computer). Each time you come back to the home screen the
  letters of the name arrive again and it breathes softly a few times.
### Changed
- Glass: the menu, Settings, Help and the other windows are see-through panels over a softly blurred page, with the app's colour
  in their titles, icons and chosen options.
- Teams, Scores and Answer sheet have a bolder look inside: glass panels, the display font, clearer buttons
  and short animations.
- On a computer the home tiles share each row evenly, and in Scores "Add Player" and "Leaderboard" are as wide
  as the player cards.

## [0.14.1] - 2026-11-23
### Changed
- Answer sheet: **Delete round** asks first when the round has answers or points. An empty round still goes at
  once, and Undo is offered either way.
### Fixed
- Home no longer keeps the processor busy: the lights and stars behind the tiles stand still, and the wizard
  greets you with a short bob and then rests. Better for the battery on a long quiz night.

## [0.14.0] - 2026-11-23
### Changed
- A bolder look everywhere. Each tool has its own colour — Teams emerald, Scores gold, Answer sheet blue —
  on its home tile and through its whole screen.
- New fonts: Unbounded for headings and the big numbers, Manrope for text, both with Cyrillic.
- Home: the wizard greets you, the tiles carry their tool's colour and icon, over soft lights
  and a few stars.
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
