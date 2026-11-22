<!-- From the forge template app-shell/templates/legal/privacy.md (legal-pages §2, 2026-11-07), filled for Quizzard on 2026-11-22 with the wording of GG Counter's and TeamSync's privacy texts where the facts are the same, and checked against the code the same day (where: docs/DECISIONS.md 2026-11-22 "Policy pages filled"). Not legal advice. One bullet per layer the app really has: no feedback webhook, no API, no AI features. {App} and {email} are filled by scripts/generate.ts from app.config.ts. -->

**Privacy** — Last updated: 23 November 2026

- **Who is responsible:** {App} is made by Simeon Tsvetanov, Bulgaria (contact: {email}). The
  names, players and scores you enter stay on your device and under your control only; where data
  reaches us, the section "When data reaches us" below applies.
- **In the browser:** {App} and its tools (Teams and Scores) run entirely on your device. Names,
  players and scores are not uploaded anywhere, and they are never put in the page address (only
  the number of teams can be, e.g. `#/teams?teams=4`). There is no server of our own, and the app
  loads nothing from other websites: no fonts, scripts, images or trackers from third parties.
- **Stored on your device only:** everything below is kept in your browser's local storage on this
  device. Nothing is kept in cookies, IndexedDB or the browser's private file storage.
  - **{App} itself:** your settings (theme and language), the tool you opened last, the last
    version whose "What's new" you saw, dismissed prompts (when you last closed the offer to
    install the app) and an unsent problem report draft (its type, title and text).
  - **Teams:** your last names list (so it is still there next time), the number of teams, and a
    short code made from the last list you made teams from (not the names themselves) with how
    many times in a row teams were made from it.
  - **Scores:** your game — player names, scores and when they were last changed, and for each
    player a history of their most recent score changes (the points of each change and when it was
    made, up to 50 per player).
  - **Answer sheet:** your team's game — each round's name, the answers you wrote, whether you
    marked each one right or wrong, the points of each question and the round's bonus points.
  - **Separate from the author's other apps:** {App} keeps its data under its own names. The
    TeamSync and GG Counter sites are on the same web address (`simeontsvetanov.github.io`), but
    {App} does not read, change or delete what they saved, and they do not see {App}'s data.
  - When part of a new version cannot load and the app reloads itself, this tab's session storage
    keeps the time of that reload until the tab is closed, so the app never reloads in a loop.
  - Data that the 2025 version of {App} saved in this browser is not read, changed or deleted.

  None of this leaves your device or is synced anywhere. **Settings → Your data** shows what
  each tool and {App} itself have saved, with a **Clear** for each tool; **Export my data** and
  **Import data** cover {App}'s settings and the tools' data in one file, and **Clear my data**
  deletes all of it. Clearing this site's data in your browser removes everything, including the
  data of the author's other apps on the same address.
- **Offline copy:** so {App} works without internet, your browser keeps an offline copy of the
  app's own files (not your data) in its Cache Storage, managed by a service worker. If you tap
  **Keep data on this device** in Settings → Storage, the app asks the browser to keep this site's
  storage persistent (`navigator.storage.persist()`), so it is not cleared automatically when space
  runs low. Clearing this site's data removes both.
- **Sharing and copying:** the text you share is made on your device and leaves it only when you
  share it. **Share** and **Copy** in Teams send the teams (the names in each team and a link to
  {App}); **Share** in Scores sends the leaderboard (player names, scores, the date and time, and
  a link to {App}); **Share app** sends the name and the link of {App}. The text goes to the app you
  choose in your device's share menu, to WhatsApp, or to the clipboard, and is then covered by that
  app's own privacy terms. Nothing is ever shared automatically.
- **No accounts, no ads, no tracking, no cookies, no analytics.**
- **Problem reports:** **Report a problem** never sends anything by itself. **Open on GitHub**
  opens GitHub's "new issue" page with your text filled in; the text is part of that page's
  address, so GitHub receives it when the page opens, and it becomes a **public** issue only when
  you submit it there (you need a free GitHub account; the GitHub Privacy Statement applies). If
  you leave the technical details ticked, the report also contains the app version, your browser's
  user agent (browser, version and operating system), the screen size, whether the app is
  installed, your browser's language and the time — not your names, players or scores (you can see
  and untick every detail before you send). The error screen sends nothing: **Copy details** copies
  the error message, where in the app's code it happened, the last action, the app version, your
  browser's user agent, whether the app is installed and the time to your clipboard.
- **Links to other sites:** links to GitHub, LinkedIn, WhatsApp and Buy Me a Coffee open those
  sites, which have their own privacy policies.
- **Hosting:** the site is hosted on GitHub Pages. GitHub logs visitor IP addresses for security
  purposes — see the GitHub Privacy Statement.

## When data reaches us (GDPR Art. 13)

This applies only to an email you send to the contact address and to a GitHub issue you submit.

- **Controller:** Simeon Tsvetanov, Bulgaria — {email}.
- **What and why (purpose):** your message, your email address and any technical details you
  included — to answer you and to fix the problem you report.
- **Legal basis:** legitimate interest in answering the messages people send and in keeping
  {App} working (Art. 6(1)(f) GDPR).
- **Recipients:** Google (provider of the contact mailbox); for issues, GitHub, which hosts and
  publishes them under its own privacy statement.
- **Transfers outside the EU:** Google and GitHub may process this data in the USA. Both state
  that they take part in the EU–US Data Privacy Framework (Commission adequacy decision of
  10 July 2023); see their privacy statements.
- **Retention:** emails are deleted at the latest one month after the conversation ends. Public
  GitHub issues stay public until we delete them; you can edit your text on GitHub at any time or
  ask us at {email} to delete the issue.
- **Your rights:** access, rectification, erasure, restriction, objection and data portability —
  write to {email}. You can also complain to the Commission for Personal Data Protection (КЗЛД),
  2 Prof. Tsvetan Lazarov Blvd, 1592 Sofia, kzld@cpdp.bg.

- **Contact:** {email}
