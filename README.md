<div align="center">

<img src="brand/quizzard-logo.svg" alt="Quizzard wizard logo" width="140" height="140" />

# Quizzard

### The Quiz Toolkit

Free tools for pub quizzes and game nights — **random teams**, a **score keeper** and a **team answer sheet**.<br />
Works offline, needs no account, and everything you enter stays on your device.

<p>
  <a href="https://simeontsvetanov.github.io/Quizzard/"><img src="https://img.shields.io/badge/Open_the_app-00804F?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Open the app" /></a>
</p>

<p>
  <a href="https://github.com/SimeonTsvetanov/Quizzard/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/SimeonTsvetanov/Quizzard/ci.yml?branch=main&style=flat-square&label=tests&logo=github" alt="Test status" /></a>
  <a href="CHANGELOG.md"><img src="https://img.shields.io/github/package-json/v/SimeonTsvetanov/Quizzard?style=flat-square&label=version&color=00804F" alt="Version" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/licence-MIT-00804F?style=flat-square" alt="MIT licence" /></a>
  <img src="https://img.shields.io/badge/PWA-installable-00804F?style=flat-square&logo=pwa&logoColor=white" alt="Installable web app" />
  <img src="https://img.shields.io/badge/offline-yes-00804F?style=flat-square" alt="Works offline" />
  <img src="https://img.shields.io/badge/languages-EN_%C2%B7_BG-00804F?style=flat-square" alt="English and Bulgarian" />
</p>

<a href="https://simeontsvetanov.github.io/Quizzard/">App</a> ·
<a href="docs/index.md">User guide</a> ·
<a href="CHANGELOG.md">What changed</a> ·
<a href="https://github.com/SimeonTsvetanov/Quizzard/issues/new">Report a problem</a>

<br /><br />

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/home-dark.png" />
  <img src="docs/images/home-light.png" alt="Quizzard home screen with the cards Teams, Scores, Answer sheet and Quiz creator" width="300" />
</picture>

</div>

## What is in the toolkit

<table>
<tr>
<td width="33%" valign="top" align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/teams-result-dark.png" />
  <img src="docs/images/teams-result-light.png" alt="Teams tool showing two random teams made from a list of names" width="240" />
</picture>

### Teams

Paste the names, pick how many teams, tap once. Every split is equally likely and team sizes differ by at most one. Copy or share the result to any chat.

</td>
<td width="33%" valign="top" align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/scores-game-dark.png" />
  <img src="docs/images/scores-game-light.png" alt="Scores tool with players, their points and a leaderboard with medals" width="240" />
</picture>

### Scores

Keep score for any game: add players, tap + or −, or add any amount. A leaderboard with medals, a history of every change, and a shareable result.

</td>
<td width="33%" valign="top" align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/answer-sheet-dark.png" />
  <img src="docs/images/answer-sheet-light.png" alt="Answer sheet tool with a round of answers marked right or wrong and the running total" width="240" />
</picture>

### Answer sheet

Your team's sheet at a pub quiz, instead of paper. Write the answers of each round, tap ✓ or ✗ when they are read out, and see the round and the total at once.

</td>
</tr>
</table>

**Next:** a quiz creator — build a quiz night and take it with you as a single file. It is planned, not built yet.

## Why people use it

| | |
|---|---|
| **Free** | No price, no ads, no "pro" tier. Open source under MIT. |
| **Private** | No account, no tracking, no cookies. What you type never leaves the browser unless you share it yourself. |
| **Offline** | After the first visit it works without a connection — also in a basement pub. |
| **An app, not a web page** | Install it on Android, iPhone or a computer; each tool is one screen made for a phone held in one hand. |
| **Two languages** | English and Bulgarian, switched in Settings. |
| **Light and dark** | Follows the device, or pick one. |

## Use it

<!-- forge:usage:start -->
- **Browser:** https://simeontsvetanov.github.io/Quizzard/
- **For AI agents:** [llms.txt](https://simeontsvetanov.github.io/Quizzard/llms.txt) · [llms-full.txt](https://simeontsvetanov.github.io/Quizzard/llms-full.txt)
<!-- forge:usage:end -->

**Install it as an app**

- **Android / Chrome / Edge:** open the menu and choose **Install app**.
- **iPhone / iPad:** tap Share, then **Add to Home Screen**.
- **Computer:** use the install icon in the address bar.

Long-press the installed icon to jump straight to Teams, Scores or Answer sheet.

## Guide

The user guide lives in [`docs/`](docs/index.md) and is mirrored to the repository's Wiki on every release.

- [Make random teams](docs/how-to/make-teams.md)
- [Keep score](docs/how-to/keep-score.md)
- [Use the answer sheet](docs/how-to/use-the-answer-sheet.md)
- [Install the app](docs/how-to/install-the-app.md)
- [Back up and move your data](docs/how-to/back-up-and-move-your-data.md)
- [Settings](docs/reference/settings.md) · [Limits](docs/reference/limits.md) · [Privacy and your data](docs/about/privacy-and-data.md)

## How it is built

One installable web app (the *shell*) that hosts small tools (*mini-apps*) behind a tiny contract: each tool exports `mount(element, context)` and gets the shell's language, theme, messages, sharing and its own storage area. A tool's code is downloaded only when it is opened, then kept for offline use.

```mermaid
flowchart LR
  subgraph Shell["Shell — no framework"]
    Home["Home · menu · Help · Settings"]
    SW["Service worker · offline"]
  end
  Home -->|"#/teams"| Teams["Teams<br/>plain TypeScript"]
  Home -->|"#/scores"| Scores["Scores<br/>React"]
  Home -->|"#/sheet"| Sheet["Answer sheet<br/>plain TypeScript"]
  Home -.->|planned| Quiz["Quiz creator"]
  Teams --- T[("quizzard-teams")]
  Scores --- S[("quizzard-scores")]
  Sheet --- A[("quizzard-sheet")]
```

- **TypeScript, strict.** Vite, pnpm workspace, no backend, hosted on GitHub Pages.
- **Each tool owns its data.** Separate storage areas in the browser; Settings shows, exports, imports and clears them per tool.
- **Tested where it matters.** Unit and property tests for the logic, and browser tests of every flow on Chromium, Firefox and WebKit, desktop and phone sizes, on every push.
- **Accessible by default.** WCAG 2.2 AA checks run in the browser tests; 44 px touch targets; keyboard and screen-reader paths.
- **Strict Content Security Policy,** pinned GitHub Actions, CodeQL, and a supply-chain policy for dependencies.

```
app/              the shell: Home, menu, dialogs, router, service worker
packages/core/    the mini-app contract, registry and route parser (pure logic)
miniapps/teams/   Teams        miniapps/scores/   Scores        miniapps/sheet/   Answer sheet
content/legal/    Terms, Privacy and the other policy texts
docs/             user guide (mirrored to the Wiki) + SPEC, PLAN, DECISIONS
tests/e2e/        browser tests of the shell and of each tool
```

More detail: [ARCHITECTURE](docs/ARCHITECTURE.md) · [SPEC](docs/SPEC.md) · [DECISIONS](docs/DECISIONS.md).

## Development

```bash
pnpm install
pnpm dev        # http://localhost:5173/Quizzard/
pnpm verify     # generate + lint + typecheck + unit tests + docs check + build + size budgets
pnpm e2e        # browser tests against the production build
```

Node 24 and pnpm (via Corepack). Contributor notes for people and coding agents are in [AGENTS.md](AGENTS.md).

## Privacy

Runs in your browser — what you enter never leaves your device. No accounts, no tracking, no cookies.
Details: [Privacy](https://simeontsvetanov.github.io/Quizzard/privacy/) · [Security policy](SECURITY.md).

## Support

Free and open source. If it helped your quiz night, you can [buy me a coffee ☕](https://buymeacoffee.com/simeontsvetanov).

## Licence

MIT — see [LICENSE](LICENSE). Made by [Simeon Tsvetanov](https://github.com/SimeonTsvetanov) in Bulgaria.
