# Changelog

All notable user-facing changes. Format: Keep a Changelog · SemVer.

## [Unreleased]

## [0.35.1] - 2026-11-26
### Changed
- The quiz creator may load up to 75 KB of code on its first open (60 KB before): room for what was added this week.

## [0.35.0] - 2026-11-26
### Changed
- **Safe — the code is dialled as one sequence.** After "Answers", one press starts it: each digit's slide turns the dial, clicks the digit in and gives way to the next by itself, and the door opens after the fifth. Beside the vault the code stands as it grows — the digits found so far, the current one large, the rest as "?". The timer button pauses the sequence; a round with "Questions follow by themselves" off shows each digit with Next.
- **Safe with "Show the answers one by one" off** shows one slide with the whole code and the door opening, then the score entry.
- **A round with "Show the answers one by one" off keeps the "Answers" slide** after its last question — a stop you pass by hand, so the answers never come up by themselves — and the screen after it is headed "Answers and scores".

## [0.34.0] - 2026-11-26
### Added
- **Round settings — "Show the answers one by one".** On by default. Off: the round has no answer slides; all its answers show at once on the screen where the points are entered.
- **Round settings — "Questions follow by themselves".** On by default. Off: in this round a question's time running out brings nothing by itself; the host moves on with Next. The switch in the player's menu still turns it off for the whole game.
### Changed
- **Audio and video questions — the timer runs with the clip.** It starts when the clip starts. A clip longer than the time stops when the time is up; a shorter one ends and the timer runs on. When the time is up the game moves on by itself and, when the next question has a clip, plays it at once.

## [0.33.1] - 2026-11-26
### Fixed
- **A special round's rules text follows its numbers.** The text a Safe, "Make the quizmaster laugh" or a Free game starts with named the starting values for good ("3 points for first place, 1 for second", "5 minutes"); now it changes with the prizes, the bonus, the most points and the time — also in quizzes made earlier. A text you rewrote yourself is left as it is.

## [0.33.0] - 2026-11-26
### Changed
- **Golden pyramid — the four questions are on one screen.** While playing, the pyramid stands beside all four questions at once, each with how many answers it asks for, under one timer of their times added up (2 minutes each make 8). The music of the round plays on. The answers follow one by one as before.
### Added
- **Music in a break.** When the quiz has music, a break plays its songs one after the other from the first, and round again; pausing the break rests the music and it stops when the break ends. A quiz without music has a silent break.

## [0.32.0] - 2026-11-26
### Changed
- **While playing — an answer is one slide and one press.** "Next" shows the answer's slide with the question at the top, and about a second later the answer comes in by itself, then the text with it. There is no second press ("Show answer") on an answer any more.

## [0.31.1] - 2026-11-26
### Fixed
- **Music for the whole quiz:** the two pickers stand one under the other with their whole names — "Choose a folder of songs" and "Choose single songs" — instead of two buttons cut to "Songs…".

## [0.31.0] - 2026-11-26
### Added
- **Quiz creator — music under a question.** "Music while the time runs (optional)" in every question that is not audio or video, and in "Make the quizmaster laugh": a song that starts by itself with the question's timer and stops with it, and goes round when it is shorter. Added and cut like any audio clip.
- **Music for the whole quiz.** Under "Quiz file, printing and music", "Choose a folder of songs" or "Choose single songs" gives every question without music one of your songs, in the order of their names, starting again from the first when there are fewer songs than questions. Questions that have a song keep it; audio and video questions get none. While some questions have no music the quiz says how many, lists them ("Round 1 – question 3") and "Choose songs" fills them. "Remove the music" takes it off all questions, with Undo.

## [0.30.0] - 2026-11-26
### Changed
- **While playing — "Next" starts the clip first.** On a question with audio or video, and on an answer with a clip of its own, the first press of Next (the button, the forward arrow, Space or →) plays the clip and the button says "Play the clip"; the next press moves on. The clip's own play button works as before, and a clip that was already started is not started again.

## [0.29.1] - 2026-11-26
### Added
- **While playing: a forward arrow beside Back** in the control bar, on a computer and a tablet. The wide button in the middle stays as it is.
### Fixed
- **Quiz creator — a word of the answer is not broken over two lines.** An answer whose longest word does not fit its line ("Австрали" + "я") is drawn smaller until the word is whole; only a word too long even at the smallest size is still broken.

## [0.29.0] - 2026-11-26
### Added
- **Quiz creator — the file with the answer can be a clip.** "Picture, audio or video with the answer (optional)" takes a picture, an audio clip or a video; it is shown or played when the answer is revealed. A clip that is too long or too big opens the cut window, with the same limits as a question's clip.

## [0.28.2] - 2026-11-26
### Changed
- **Help and the user docs follow the app:** the laugh round without a question, the red mark of an unfinished question, texts that shrink to fit, times read in minutes, the Back arrow, and name colours in Scores (Help of Scores, limits, README).

## [0.28.1] - 2026-11-26
### Changed
- **Quiz creator — "Make the quizmaster laugh": the time is set in minutes,** in steps of half a minute (0.5 to 10 min), instead of seconds in steps of five. On every slide — in the creator and on the stage — a time of whole or half minutes reads as minutes ("5 min", "1.5 min"), not as seconds.

## [0.28.0] - 2026-11-25
### Changed
- **Quiz creator — "Make the quizmaster laugh" needs no question.** The round is ready as soon as it is added: its screen carries a built-in explanation in the language the quiz is played in, the opening says the rules in four lines, and the round shows "What the teams see" with one optional field for a text of your own. Time (5 minutes) and the two prizes (3 and 1) are in the round's settings. The round is never "not finished".
### Added
- **An unfinished question is marked on its card:** a red edge and a red light, next to the "Not finished" label.

## [0.27.3] - 2026-11-25
### Fixed
- **Quiz creator — a slide never cuts its text.** A long answer, question or text with the answer no longer ends in "…": the texts are drawn smaller until all of them fit — in the editor's preview, on the thumbnails, on the stage and in an exported quiz.

## [0.27.2] - 2026-11-25
### Changed
- **The Back arrow at the top goes one step back.** In the Quiz creator it leads from a question to its round, then to the quiz and to your quizzes, and only then Home (it used to jump Home from anywhere). The Quizzard logo still goes Home in one step.

## [0.27.1] - 2026-11-25
### Changed
- **Scores — name colours:** the text on a meeple colour is dark or light, whichever reads better; on a custom colour it is always white.

## [0.27.0] - 2026-11-25
### Added
- **Scores — a colour for each player's name.** A palette button beside the name (when you add a player and on every card) offers the seven Carcassonne meeple colours, any custom colour and "No colour". The colour fills the name field only; without one the field looks as before. It is saved with the game and travels with an exported game.

## [0.26.0] - 2026-11-25
### Fixed
- **Quiz creator, while playing — changing the language keeps the game as it is.** A break, a running timer and a playing clip go on, the audience window stays open (it used to close and open again), and a quiz played from an exported file no longer risks starting over.
- **The cut window** closes with the screen it was opened from and stops its work; it waits until the clip's length is known before "Cut and shrink" can be pressed; a browser that cannot write what a quiz carries gets the usual message instead of an empty window.
- **Removing or replacing the picture with an answer** offers Undo, like every other file.
- A round's prize that is missing in an older quiz shows the same number in the editor as on the stage.
- A picture over 60 MB is refused with the right limit in the message.
### Changed
- **Help, the FAQ and the texts for search engines and AI assistants** describe the Quiz creator as it is: five round kinds, cutting a clip, the picture with the answer, the host panel, the language while playing. The Help of Scores speaks of Scores, not of GG Counter.
- A cut clip is H.264 with AAC sound, or with Opus where the browser has no AAC (Firefox, Linux).
- The Privacy text names the cut on the device, the picture with an answer and what a saved game keeps.
### Removed
- The trial page for cutting clips (`/lab/`): the cut window in the editor took its place.

## [0.25.4] - 2026-11-25
### Fixed
- **Scores:** after you enter points in "Adjust score" the page goes back to its top by itself — on a phone the keyboard used to leave it scrolled down.

## [0.25.3] - 2026-11-25
### Fixed
- **Scores, on a phone:** the buttons at the top no longer slide under the menu button. The plus button left the header — the "Add Player" card is on the screen anyway — so Leaderboard and Clear session have room on every phone.

## [0.25.2] - 2026-11-25
### Fixed
- **Quiz creator, while playing — a long answer beside a picture no longer runs over the question and the text below.** A longer answer is set smaller and its part of the slide grows with it; no word is broken in the middle.
### Changed
- **The word "Answer" stands at the top of the answer screen**, beside the question's number, in the display face — not between the question and its answer.

## [0.25.1] - 2026-11-25
### Fixed
- **Quiz creator, while playing — the answer with a picture and a long text no longer overlaps.** The picture keeps its room, the answer stands beside it and the text under both; everything is drawn a little smaller until it fits.
- **The answer screen puts the weight where it belongs:** the question is small and quiet (the room has read it; its number is what matters), the answer and its picture are the largest things, and the text with the answer is small again.
- **The notes over the control bar** ("The game starts again · Undo", "Continuing your last game") go after 5 seconds instead of 10, and at once when you tap anywhere else.

## [0.25.0] - 2026-11-25
### Added
- **Quiz creator — a picture with the answer.** Every question can keep a picture that is shown when the answer is revealed, in place of the question's own picture or clip: "Picture with the answer (optional)" under the explanation.
### Fixed
- **Quiz creator:** a "Cut and shrink" button stood under every file field, also when there was nothing to cut (since 0.23.0). It now shows only for a file that must be cut.

## [0.24.0] - 2026-11-25
### Added
- **Quiz creator — two rounds without answers.** "Add round" now also offers:
  - **Make the quizmaster laugh:** every team has 5 minutes to think up a joke and tells it; the quizmaster picks the two funniest. First place wins 3 points and second place 1 — you can change both. Only two teams score.
  - **Free game:** one screen with your own task — draw, build, sing — with text and, if you like, a picture, a sound or a video, a timer and the most points a team can get (3 unless you change it).
- Both are played as: the rules with the prizes, the task with its timer, the points, the leaderboard. Nothing is revealed, so there is no "Answers" screen.
### Changed
- **While playing:** a timer over 99 seconds reads as a clock ("5:00"), and whole minutes are written as minutes ("5 min").

## [0.23.1] - 2026-11-25
### Fixed
- **Quiz creator, while playing — a long text with the answer is shown whole.** The explanation was cut after two lines. Now all of it is on the screen: a longer text is set smaller, the answer above it gives way, and it keeps clear of the Quizzard mark.
### Changed
- The text shown with the answer can be up to 700 characters (about 100 words), up from 500.

## [0.23.0] - 2026-11-25
### Added
- **Quiz creator — cut and shrink a video or a sound while adding it.** A clip that is too big for a quiz, or in a format a quiz does not carry (a phone's MOV, a WAV), is no longer refused: a window opens with the clip on one bar — frames of the video or the loudness of the sound — with a handle at each end. Move the handles to the part you want, play just that part, pick the picture size and the quality, and select "Cut and shrink". The new, smaller file goes on the question.
- **A clip that already fits can be cut too:** "Cut" stands next to "Replace". It is always up to you.
- If you close the window without cutting, the question says why the file is not in yet, and "Cut and shrink" is the highlighted button.
### Changed
- **Pictures over 15 MB are taken in** (up to 60 MB): a photo is scaled down to 1,920 px anyway, so its limit is checked on what is stored.
- Where a browser cannot re-encode (older Safari, Firefox on Android), big files are refused with the reason, as before.

## [0.22.5] - 2026-11-25
### Changed
- **Quiz creator, while playing — a long clip stops at the question's time.** A video or sound that is longer than the time set for its question plays from its start and stops when that time has played (30 seconds set, 30 seconds played). Play starts it again from the beginning. A shorter clip plays to its own end, and with the answer the clip is not limited.

## [0.22.4] - 2026-11-25
### Added
- **Quiz creator, host panel — a Break card:** start a break of 5, 10 or 15 minutes at any time, pause and resume its countdown, and end it. A paused break says "Paused" on the big screen.

## [0.22.3] - 2026-11-25
### Added
- **Quiz creator, while playing — Language in the menu:** English or Български for the stage, the buttons and the menu, whatever language the quiz was written in. The game stays where it is, and the choice is remembered for that quiz.

## [0.22.2] - 2026-11-25
### Fixed
- **"More free tools"** (footer and the 404 page) opened a GitHub search that found none of the apps. It now opens Quizzard's own page with Quizzard, TeamSync, GG Counter and PDF → PNG.

## [0.22.1] - 2026-11-25
### Added
- **Quiz creator, host panel:** start, pause and restart the timer from the Timer card, and see and correct every team's points per round in a Scores table right on the panel.
### Changed
- **Quiz creator, while playing:** the Scores and Menu windows and the host panel now have the look of the stage — deep violet, soft rows, gold numbers — instead of grey boxes.
### Fixed
- **Background:** on a very wide screen (wider than 2600 px) the stars stopped part of the way across; they now cover the whole screen.

## [0.22.0] - 2026-11-24
### Added
- **Quiz creator — two special rounds: Golden pyramid and Safe.** "Add round" asks for the kind. A
  Golden pyramid has 4 questions that ask for 1, 2, 3 and 4 answers (10 points); you list every answer
  that counts, as many as you like. A Safe has 5 questions answered with one digit each — the code of a
  safe; all five win a bonus (3 unless you change it). Both arrive ready to fill in, with their rules.
- **While playing:** a pyramid of gold blocks fills tier by tier and its blocks turn over at each answer;
  a vault door turns its dial to each digit and opens after the fifth. Each round opens with a short
  animated explanation of how it scores; at score entry of a Safe you count the right digits and the
  bonus is added for you.
- **The Quizzard logo on the stage:** large on the title and the final screen, small in a corner on the
  others. In an exported quiz it links to Quizzard, so whoever gets the file finds where to make their own.
### Changed
- **Quiz creator, while playing — a calmer, more polished stage** in the look of Quizzard's main screen: no
  more outlines around answers, chips, score rows and lists — soft fills and depth instead, a few stars over
  the stage, the same look in the menu, the scores table and the host panel.

- **Help, the FAQ, the README and the user guide** describe the Quiz creator as it is today: media, playing on a big screen, export, the special rounds, and "Check for updates" in the menu.

## [0.21.0] - 2026-11-24
### Added
- **Quiz creator, while playing — all answers of the round on one screen.** After the answers were shown one by
  one, the score screen lists them all, short ("1 — A: Caterpillar", "2 — True", "3 — A cow"). On a computer or
  TV the list stands beside the points entry; on a phone it comes first and "Next" brings the points.
- **A break from the score screen:** 5, 10 or 15 minutes. During the break the room sees the countdown, the
  standings so far and the answers of the round just played.
- **Pictures and video get the room:** they are as large as the slide allows — an upright picture or clip stands
  beside the question at full height. A button on the picture or clip (or the key Z) shows it over the whole
  stage; a video keeps playing. The host panel has the same button for the audience window.
### Fixed
- **Quiz creator in a private Safari window:** pictures, audio and video can be added and quiz files with media
  open (Safari does not store files the usual way there).
- **Quiz creator on a short phone:** the field you move to in the question editor no longer hides under the bar
  with "Done".
- **Home:** the arrow in "Open" no longer jumps when the font arrives; the animated background rests while the
  menu or a dialog is open.

## [0.20.4] - 2026-11-24
### Changed
- **Quiz creator on a computer:** "Add another" and "Done" stand right under the live preview of the question
  and stay in view while you fill in the form (they used to hang alone at the bottom of the page). Time and
  Points are on one level.

## [0.20.3] - 2026-11-24
### Added
- **Menu → Check for updates:** asks for a new version right away. If there is one, the app updates itself and
  reloads; if not, it tells you that you have the latest version.

## [0.20.2] - 2026-11-24
### Fixed
- **Scores on iPhone and iPad:** "Adjust score" opens the keyboard that has a minus, so points can be taken away
  (for example -8). Other phones keep the number pad.

## [0.20.1] - 2026-11-24
### Changed
- **Quiz creator, while playing:** when the answer is shown it is the large text in the middle of the screen; the
  question steps back to the top, smaller.
- A game you open again says "Continuing your last game" and offers "Start again" right there — it clears the
  points and goes back to the first screen (still in the menu as "Start the game again").
### Fixed
- An empty round no longer shows a plus sign that looked like a button; "Add question" is the one button.

## [0.20.0] - 2026-11-24
### Added
- **Quiz creator, easier to use.** A new quiz asks for its name first. Rounds and questions have the same row of
  buttons (move up, move down, copy, delete, more) and can be dragged into place; a question can be moved to
  another round. Long rounds can be shown as a compact list, and a search finds a question in any quiz.
- **While playing:** the stage shows where you are — question "1/10" and "Round 1/3", with the total dimmer.
  The control bar is the same on the stage and on the host's panel: Back on the left, a wide Next in the middle,
  the tools on the right, each with a name when you point at it.
- Play from any question, a sound when the time runs out (can be turned off), the screen stays awake during a
  game, and a printable answer sheet for the host.
- Before a game starts you are told which questions are unfinished (no text or no answer).
- User guides: "Make a quiz" and "Play a quiz".
### Changed
- Removing a picture, audio or video, a team or the scores can be undone or asks first; opening a quiz file over
  an existing quiz asks before it replaces anything.
- File limits are shown the way your device counts them (15 MB, 50 MB, 250 MB).
### Fixed
- Back from the quiz library always returns to Home (it could stay on the page in Safari).
- Twelve teams fit on a small phone; a long points note is no longer cut on the stage.

## [0.19.0] - 2026-11-24
### Added
- **Quiz creator: pictures, audio and video.** Add a file from your device to a question — pick it, drop it or
  paste it. Pictures are never stretched or cropped; large photos are made smaller automatically. Audio (MP3,
  M4A) and video (MP4) play on the stage with their own controls, and the timer waits for the clip. A file that
  is too big or of another format is refused with a message that says why.
- **Quiz files:** "Save quiz file" makes one file with the quiz and everything in it; "Open a quiz file" adds a
  quiz someone sent you. Share it straight from the phone where the phone allows it.
- **For the host:** a private note per question (only you see it), a black screen (key B), a break timer of 5,
  10 or 15 minutes, a grid to jump to any screen, and clicker keys (Page Up / Page Down).
- "Apply time and points to all questions" in a round's settings.

## [0.18.0] - 2026-11-24
### Added
- **Quiz creator: play your quiz.** "Play" runs it in the app, and "Export to play" saves it as one file that
  opens on any computer without the internet. The game has it all: team names, each question with a timer that
  moves on by itself, answers revealed one by one with the explanation, points per team after every round, a
  leaderboard that shows who moved up or down, a tie-break and a podium. A game you leave continues where it was.
- **Presenter view:** open the audience window on the projector and keep the control panel for yourself —
  what is on the big screen, what comes next, the answer in advance, the timer and the points.
- Keys while playing: Space or → next, ← back, T timer, R restart the timer, M menu, S scores, F full screen.

## [0.17.0] - 2026-11-23
### Added
- **Quiz creator** (first part): make your own quizzes. A library of quizzes, rounds with their own default
  time and points, and text questions answered as an open answer, multiple choice (one or several correct
  options) or true / false. Every question can have its own time and points — a number, a note such as
  "1 for the band, 2 with the song", or both — and an explanation shown with the answer. Each question is a
  small slide, and Preview shows the quiz as it will look. Everything is saved on your device as you type.
- Coming next in the Quiz creator: playing the quiz on a big screen (export), pictures, audio and video.

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
