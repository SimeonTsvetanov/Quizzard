# Quiz creator — research: second screen and ideas from similar products

**Checked:** 2026-11-23 (every URL below was read on that day). **Status:** research only, nothing decided.
**Question (Moni):** when the quiz is played from a phone, can the game be on the TV while the phone is the
control screen (next/back, timer, team scores, answer early)? And a presenter view on a laptop?

How to read this: a sentence with a URL is what that source says. **"Inference"** marks our own conclusion,
**"To test"** marks something no official source settles and that needs a real device. Support versions come from
MDN's compatibility data (the JSON behind MDN's tables), where Edge follows Chrome and Safari iOS follows Safari.

## Short answer

1. **Laptop + projector: yes, and it fits the single HTML file.** Open a second window with `window.open`, talk
   to it with `postMessage`; the host drags it to the projector and presses F. No API with weak support needed.
2. **Phone + TV, one device: no web page can show one thing on the phone and another on a mirrored TV.**
   Mirroring (AirPlay, Android cast, HDMI) copies the phone screen. The only web API that renders a second page
   on a TV from a phone is the Presentation API: Chrome only (not Safari, not Firefox), https only, and its
   receiver page starts with empty storage and no service worker, so it cannot be an offline file.
3. **Phone as remote for another device that drives the TV** (laptop, second phone, TV browser): needs a channel
   between two devices. Without any server the only option is WebRTC with the handshake carried by QR codes in
   both directions — possible, clumsy. With a tiny relay it is easy, but that is a backend (not version 1).
4. **What everybody can do today with zero build:** mirror the phone and play. So the cheapest win is a player
   that is good under mirroring: answer hidden until reveal, score entry that looks fine on the TV, large targets.

## Part A — options

### A1. Presentation API

- **What:** lets a page show web content on "projectors and network-connected televisions", wired (HDMI, DVI) or
  wireless (DLNA, Chromecast, AirPlay, Miracast). — https://developer.mozilla.org/en-US/docs/Web/API/Presentation_API
- **Two modes** (same page): **1-UA** — "both pages are loaded by the same user agent" and the "rendering result
  of the receiver page will be sent to the presentation device"; **2-UA** — "the receiver page is loaded directly
  on the presentation device". The spec says the same: in 1-UA the controlling browser renders the presentation
  and sends graphics and audio to the display; in 2-UA it "acts as a proxy that requests the presentation display
  to load and render the presentation page itself". — https://www.w3.org/TR/presentation-api/ (Candidate
  Recommendation Draft, 12 February 2025)
- **So: phone renders and streams, or the TV loads the URL?** Both exist. In Chrome: "Presentation of any https
  URL is supported through streaming of offscreen tabs" (1-UA; listed screens: Chromecast, Hangouts, Cast for
  Education), and `cast:` / `dial:` URLs start an app on the device (2-UA, Chrome 63). —
  https://www.w3.org/wiki/Second_Screen/Implementation_Status (last changed 30 October 2018; the page itself warns
  the data is unverified and may be outdated). A Cast app the TV loads itself must be a registered receiver: an
  https URL "that the Google Cast device should request", a $5 developer registration, and publishing. —
  https://developers.google.com/cast/docs/registration
- **Support (MDN data):** `PresentationRequest` Chrome 47 (Chrome Android and Edge follow), Firefox no, Safari
  no (macOS and iOS), Android WebView no; `PresentationReceiver` Chrome 59; flagged experimental. —
  https://github.com/mdn/browser-compat-data/blob/main/api/PresentationRequest.json and `…/PresentationReceiver.json`
  Chrome history: Chromecast on Android from Chrome 48, on desktop from Chrome 52 (W3C wiki above); wired/wireless
  **secondary attached displays** from Chrome 66 on ChromeOS, Linux and Windows, "Mac support will come later";
  "mirrored displays are not in the list". — https://developer.chrome.com/blog/present-web-pages-to-secondary-attached-displays
  Chrome Android for an arbitrary https page (1-UA to a Chromecast): **not stated** by any current official page. **To test.**
- **https / gesture / URL:** secure context only (MDN; the interfaces are `[SecureContext]` in the spec; Chromium
  61 removed it from insecure contexts — W3C wiki). The presentation URL must be "a potentially trustworthy URL",
  otherwise `SecurityError`; `start()` needs transient activation, i.e. a tap (spec). `file:` counts as
  potentially trustworthy on paper (https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts), but
  whether Chrome offers a display for a `file://` receiver is **not stated — to test**; a 2-UA device can never
  load a file that lives on the phone (inference).
- **Offline:** effectively no. The spec requires the receiving page to start with a **new empty** cookie store,
  local/session storage, IndexedDB, **service worker registrations and Cache objects**, all permissions "denied",
  no modal dialogs, no navigation away (spec §6.6.1). So the receiver cannot read the quiz from Quizzard's storage
  and cannot come from the service worker cache: it is fetched from the network, and the quiz (with media) must be
  sent to it through `PresentationConnection.send()` (strings, Blob, ArrayBuffer — Chrome blog above).
- **User steps:** tap "Present" → pick the display in the browser's picker → the receiver page appears there.
- **Fit:** hosted PWA only, Chrome only, online at the start, extra work to stream media to the receiver. Good
  as an optional extra for "Android phone + Chromecast" and "Chrome laptop + second display"; not a base.

### A2. Remote Playback API

- **What:** "extends the HTMLMediaElement to enable the control of media played on a remote device" (TVs,
  projectors, speakers; HDMI/DVI, Chromecast, AirPlay). — https://developer.mozilla.org/en-US/docs/Web/API/Remote_Playback_API
  The spec's scope is the same and it adds that a page may prefer a `PresentationRequest` "to present a complete
  document"; `prompt()` needs transient activation; some sources are "not a URL that can be passed to a remote
  playback device". — https://www.w3.org/TR/remote-playback/ (Candidate Recommendation Draft, 30 April 2024)
- **Support (MDN data):** Chrome Android 56, Chrome desktop 121, Safari 13.1 (iOS follows), Firefox no. —
  https://github.com/mdn/browser-compat-data/blob/main/api/RemotePlayback.json
- **Fit:** it sends **one `<video>`/`<audio>`**, not a page. It does not give a game screen plus a control screen.
  Idea, **to test only, no source supports it:** draw the game on a canvas, feed `canvas.captureStream()` to a
  `<video>` and send that video by AirPlay/Cast — the spec's own caveat about unsupported sources applies, and
  embedded blob media are not URLs a TV can fetch. Do not plan on it.

### A3. Laptop presenter view: `window.open` + messaging, Window Management API

- **`window.open`:** must be "in direct response to user input", one gesture per call, returns `null` when
  blocked; `popup` asks for a minimal window; a window of another origin cannot be read or written. —
  https://developer.mozilla.org/en-US/docs/Web/API/Window/open
- **`postMessage`:** works between any two windows that hold a reference (`window.open()` result,
  `window.opener`), across origins; "dispatching a message to a page at a `file:` URL currently requires that the
  `targetOrigin` argument be `"*"`". — https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
- **`BroadcastChannel`:** windows, tabs, frames and workers "on the same origin" (exactly: the same storage
  partition); Baseline since March 2022 (Chrome 54, Firefox 38, Safari 15.4). —
  https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API ; the HTML standard matches the receivers
  by storage key — https://html.spec.whatwg.org/multipage/web-messaging.html
- **`file://` rules:** "Modern browsers usually treat the origin of files loaded using the `file:///` scheme as
  opaque origins"; the URL standard leaves it to the browser, and some treat same-folder files as same-origin.
  Web Storage and IndexedDB "are separated by origin". — https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy
  **Inference:** for the exported file, `BroadcastChannel` and `storage` events between two windows are not
  guaranteed (they depend on how each browser treats a file origin). The dependable channel is **`postMessage`
  with `"*"` over the opener reference**, accepting only messages whose `event.source` is the known window. The
  audience window can be the same file opened with `#audience`, or `about:blank` filled by the host. **To test**
  in Chromium, Firefox and WebKit from disk, plus what survives a reload of either window (the reference is lost
  when the host window reloads — inference).
- **Window Management API:** "Slideshow apps that want to show speaker notes on the internal primary screen and
  the presentation on an external projector" is its first use case; `getScreenDetails()`, `screen.isExtended`,
  `requestFullscreen({ screen })`; secure context; permission `window-management`; experimental. —
  https://developer.mozilla.org/en-US/docs/Web/API/Window_Management_API Chrome 100 shows a prompt asking whether
  the site may "open and place windows"; plain `window.open()` "is unfortunately unaware of additional screens". —
  https://developer.chrome.com/docs/capabilities/web-apis/window-management Support (MDN data): Chrome 100
  desktop (Edge follows), Chrome Android no, Firefox no, Safari no. —
  https://github.com/mdn/browser-compat-data/blob/main/api/ScreenDetails.json
- **Fit:** base = `window.open` + `postMessage` (every desktop browser, offline, works in the file). Window
  Management = optional "Put it on the projector" button in Chrome/Edge; elsewhere the host drags the window.
- **Phones:** MDN does not say what `window.open` does on mobile (**not stated**); a phone shows one tab at a
  time, so a second window does not give a second screen there (inference).

### A4. Mirroring and casting by the OS or the browser

| Way | What the source says | URL |
|---|---|---|
| Chrome desktop "Cast tab" | More → Cast, save and share → Cast. Needs a Google Cast device on the same Wi-Fi. The tab shows on the computer **and** the TV; sound only on the TV. "Cast screen" on Mac, Windows, Chromebook. Android/iOS: not stated | https://support.google.com/chrome/answer/3228332 |
| Android "Cast my screen" | Google Home app → hold the device tile → Cast → Cast my screen (or "Cast one app"); Android 8.0+, same Wi-Fi. iPhone: not stated | https://support.google.com/chromecast/answer/6059461 |
| iPhone/iPad AirPlay mirroring | Control Center → Screen Mirroring → pick Apple TV / AirPlay TV / Mac; same Wi-Fi | https://support.apple.com/en-us/102661 |
| Samsung DeX | Desktop-style workspace on a TV/monitor by HDMI cable or wirelessly (TVs with Miracast); the phone becomes a touchpad or keyboard; only listed Galaxy models. Whether the phone can run another app meanwhile: not stated | https://www.samsung.com/us/apps/dex/ |
| Android connected displays | "the phone's state remains unchanged, and a blank desktop session starts on the connected display. The device and the display act as two individual systems". Which phones/versions: not stated on the page | https://developer.android.com/develop/ui/compose/layouts/adaptive/support-connected-displays |
| iPad / iPhone by cable | Apple's guide says a display shows "the iPad screen"; the pages on moving an app to an external display and on iPhone adapters could not be read by the tool — **not verified** | https://support.apple.com/guide/ipad/connect-to-a-display-with-a-cable-ipadf1276cde/ipados |

- **What the page controls:** nothing. Starting a mirror is a system or browser action; no API lets a page start
  it, detect it, or draw different content on the mirror. `screen.isExtended` only reports **extended** screens,
  only in desktop Chrome/Edge, and Chrome's display picker says "mirrored displays are not in the list" (URLs in
  A1/A3). We found no CSS media feature for "external display" in MDN (**none found**, not proof of absence).
- **Different content on TV and phone from one phone:** only where the system gives a real second desktop (DeX,
  Android connected displays, some iPads) and the browser can put a window there. **Inference + to test:** with
  DeX or a connected display, a second Chrome window with the audience view on the TV and the control view on the
  phone should work through A3's `window.open`/`postMessage`. It is a setup for few people; document, do not build for it.

### A5. Two devices on one Wi-Fi without a server

- **WebRTC data channel:** supported everywhere (`RTCDataChannel`: Chrome 24, Firefox 22, Safari 11 —
  https://github.com/mdn/browser-compat-data/blob/main/api/RTCDataChannel.json). MDN: a connection "requires the
  use of a signaling server", yet "WebRTC doesn't specify a transport mechanism for the signaling information.
  You can use anything you like, from WebSocket to fetch() to carrier pigeons". —
  https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling
  **Inference:** the offer and the answer can travel as QR codes: TV device shows QR 1 → phone scans it (camera)
  and shows QR 2 → the TV device must **scan QR 2 with its own camera**. Limits: both sides need a camera (a
  smart TV or a laptop with the lid away from the host is a problem), two scans per session and again after a
  reload, SDP text makes dense QR codes, and with no STUN server it only works when both are on the same network
  and the router lets clients talk (guest Wi-Fi often does not). **To test** from `file://` on phones.
- **Web Bluetooth:** "connect and interact with Bluetooth Low Energy peripherals"; the page describes only the
  client side (a remote GATT server), nothing about a page acting as a peripheral. Chrome only (Chrome Android
  56, desktop 70 partial; Firefox no, Safari no). Two web pages cannot find each other with it (inference). —
  https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API
- **Web NFC:** reads and writes NDEF **tags**; phone-to-phone is not mentioned; Chrome Android 89 only. —
  https://developer.mozilla.org/en-US/docs/Web/API/Web_NFC_API
- **Local network:** a public https page needs the user's Local Network Access permission to call local
  addresses (prompt from Chrome 142), and something must be listening there — a browser page cannot be a server. —
  https://developer.chrome.com/blog/local-network-access
- **Impossible without a server (summary):** one device discovering another; joining by a short code or one
  QR scan; reconnecting by itself after a reload; anything across different networks. All of these need at least
  a signalling relay. That is the "phone remote" every product in Part B has — and each of them has a backend.

### A6. Document Picture-in-Picture

- **What:** "an always-on-top window that can be populated with arbitrary HTML content"; secure context; one per
  tab; cannot be navigated or positioned by the site; "never outlives the opening window". —
  https://developer.mozilla.org/en-US/docs/Web/API/Document_Picture-in-Picture_API Needs a user gesture; Chrome
  116, desktop only. — https://developer.chrome.com/docs/web-platform/document-picture-in-picture
  Support (MDN data): Chrome 116 desktop (Edge follows), Firefox 151, Chrome Android **no**, Safari **no**. —
  https://github.com/mdn/browser-compat-data/blob/main/api/DocumentPictureInPicture.json
- **Fit:** not on phones at all. On a laptop with **Chrome "Cast tab"** the TV shows only the tab, so a PiP
  control panel floating on the laptop would stay private (inference; **to test**). It is a small optional extra
  for Chrome/Edge; the A3 two-window view covers the same need in every browser.

### Recommendation (most people, least friction first)

| Setup | What to tell the host | Build in the exported HTML file | Only in the hosted PWA (https) |
|---|---|---|---|
| **(a) Laptop + projector/TV** (HDMI or wireless display, extended) | "Open audience window", drag it to the projector, press F | **Presenter view:** host window (current slide, next slide, answer, host note, timer, score entry) + audience window, `window.open` + `postMessage`. Works offline, all desktop browsers. Fallback = today's single window | "Put on the projector" via Window Management (Chrome/Edge); Presentation API to a second display or Chromecast (Chrome) |
| **(b) Android phone + Chromecast / Android TV** | Google Home → Cast my screen, turn the phone sideways | **Mirror-friendly player** (below). Nothing else is possible from a file | "Present on TV" with the Presentation API in Chrome — real two-screen mode, online, Chrome only, **to test first** on a real Chromecast (1-UA from Android, media transfer) |
| **(c) iPhone + Apple TV / AirPlay TV** | Control Center → Screen Mirroring | **Mirror-friendly player.** Safari has no Presentation API, no Window Management, no Document PiP | Nothing more. A true remote needs a second device + a relay (A5) |
| **(d) Phone + TV by HDMI/USB-C or any mirroring** | Plug in; the TV copies the phone | **Mirror-friendly player.** DeX / connected-display users may get two windows (to test) | The same |

**Mirror-friendly player (inference, the part that helps (b), (c), (d) and costs little):** the TV shows exactly
the phone, so (1) the answer never appears before "reveal" — "see the answer early" becomes **press-and-hold to
peek** in a small corner the host can cover, or is simply left out when mirroring; (2) **score entry is a show
screen**: big team rows with − / + and number pad, readable from the room, instead of a form; (3) controls sit
in a thin bottom bar with 44 px targets and fade while the timer runs; (4) landscape layout that fills 16:9;
(5) a wake lock so the phone does not sleep (not researched here — check `engineering`/`pwa` before use).

**Order to build:** 1) mirror-friendly player (S, in the file, everyone) → 2) laptop presenter view (M, in the
file) → 3) spike: Presentation API from Chrome Android to a Chromecast in the hosted PWA (S to test; M–L to build)
→ 4) later, if a backend is ever allowed: phone remote by QR + relay (what Mentimeter and AhaSlides do).

**Open points to test before any promise:** how a phone opens the exported `.html` at all (Chrome Android shows
files through `content://`, iOS through Files/Quick Look — not researched, decisive for "play from a phone");
`postMessage` between two `file://` windows in three engines; Presentation API on Android with a real Chromecast.

## Part B — what similar products do

Kahoot's settings page (403) and kwizzbit.com (firewall page) refused automated access; other pages were used.
Vendor pages describe their own product — claims are theirs.

| Product | What is worth copying (creator or host) | Source |
|---|---|---|
| **Kahoot** | Duplicate a question with one icon; drag to reorder; **import from a spreadsheet template** (text multiple-choice only, no images); **question bank** — reuse questions from your other quizzes; **combine quizzes** into one; start from templates | https://support.kahoot.com/hc/en-us/articles/115002884788-How-to-make-a-kahoot · https://support.kahoot.com/hc/en-us/articles/115002812547-How-to-import-questions-from-a-spreadsheet-to-your-kahoot · https://kahoot.com/blog/2019/11/05/create-new-kahoots-faster-than-ever/ |
| **Wayground (Quizizz)** | **One time limit for all questions at once**; drag handle to reorder; spreadsheet import with a review step where unwanted rows are deleted before adding; Paper Mode — questions on the projector, no player devices | https://help.wayground.com/support/solutions/articles/158000405146-can-i-edit-the-time-for-all-the-questions-in-an-assessment-quiz-at-once- · https://help.wayground.com/support/solutions/articles/158000405147-how-do-i-change-the-order-of-my-questions-flashcards- · https://help.wayground.com/support/solutions/articles/158000404696-create-an-assessment-quiz · https://wayground.com/home/solutions/paper-mode-on-quizizz |
| **Slides With Friends** | Runs like a slide deck with arrow keys; **live soundboard**; hold answers until an **answer summary slide** shows them together; results as CSV; ready-made trivia decks to edit | https://slideswith.com/live-trivia-quizzes |
| **Crowdpurr** | CSV import **and export** of questions (edit in a spreadsheet, re-import; template file); **teams entered by the host before the event**, can add a missed team at the door; single-key toggles on the host view ("Show Team Rankings (T)") | https://intercom.help/crowdpurr/en/articles/10524880-importing-questions-from-a-spreadsheet · https://intercom.help/crowdpurr/en/articles/10524943-team-trivia-explained |
| **AhaSlides** | **Phone remote** by QR code or link: next/previous, **jump to a slide**, preview of current and next slide, private notes; the show keeps running if the remote drops and it can reconnect; another person can take over. Leaderboard is a slide placed anywhere; timer 0 = untimed; 5 s "read the question" countdown before answering | https://help.ahaslides.com/portal/en/kb/articles/remote-control · https://ahaslides.com/features/presentation-remote-control/ · https://docs2.ahaslides.com/slides/quiz |
| **Mentimeter** | **Mentimote**: phone as remote; a Notes tab shows the slide's **presenter notes the audience cannot see**; default sounds on quiz slides | https://help.mentimeter.com/en/articles/2233579-mentimote-our-presentation-remote · https://help.mentimeter.com/en/articles/4909863-add-speaker-notes-to-your-slides |
| **Google Slides** | Presenter view with speaker notes (key S); **B = black screen**, L = laser pointer; choose the monitor before starting; presents to a TV by Chromecast or AirPlay | https://support.google.com/docs/answer/1696787 |
| **PowerPoint** | Presenter view: notes only on the laptop, **next-slide preview**, **see all slides and jump**, zoom into a slide, black/unblack, **swap displays** button when the views land on the wrong screens | https://support.microsoft.com/en-us/office/start-the-presentation-and-see-your-notes-in-presenter-view-4de90e28-487e-435c-9401-eb49a3801257 |
| **SpeedQuizzing** | Optional "LiveScreen" shows scoreboard, questions, answers and pictures on a projector/TV while the host works on the laptop; fixed **quiz pack shape** (3 rounds × 20 + a "Nearest Wins" bonus) with a **nearest-number tiebreak**; runs offline on a local hub | https://www.speedquizzing.com/docs-pro/faqs/ |
| **QuizXpress** | **Import questions from Excel** combined with slide templates; score overviews, mini games and rounds arranged in any order; sound speed/pitch effects for "what's that sound" questions | https://www.quizxpress.com/features/ |
| **Leaderboarded (Keep the Score)** | Standalone trivia leaderboard: points **per round per team**, re-ranks as points are added, themes/logo/colours; advises laptop → HDMI → full screen | https://leaderboarded.com/blog/posts/trivia-night-leaderboard/ |
| **Trivia Anywhere, Quizado** (search summaries only, pages not opened) | Presenter view on the big screen with team totals rolling up; Quizado suggests keeping paper answer sheets as a backup | https://www.triviaanywhere.com/trivia-hosting-software · https://quizado.com/how-to-run-pub-quiz |

Not found in any source read: half-time break timer, printing answer sheets, undo during play, autosave
indicator — these come from Moni's brief and common pub-quiz practice, not from a competitor page.

### Top 15 ideas for Quizzard

Effort S/M/L. "v1" = fits version 1 (hand-made quizzes, no backend, no accounts).

| # | Idea | Effort | v1? |
|---|---|---|---|
| 1 | **Mirror-friendly player:** answer hidden until reveal, big show-style score entry, thin control bar, landscape 16:9 — makes "phone + mirroring" good for everyone | S | Yes |
| 2 | **Host note per question** (pronunciation, accepted answers, a fun fact) — shown only in the presenter view / on hold-to-peek, never on the audience screen | S | Yes (one optional field in the format now, even if shown later) |
| 3 | **Laptop presenter view:** host window with current + next slide, answer, host note, timer, scores; audience window on the projector (`window.open` + `postMessage`) | M | Yes, after Q-06; could be 1.1 |
| 4 | **Jump list:** "see all slides" grid to jump to any question, not only to a round | S | Yes |
| 5 | **Black screen key (B)** and a **break screen with a countdown** (5/10/15 min) between rounds | S | Yes |
| 6 | **Change time or points for a whole round / the whole quiz at once** ("apply to all questions", keeps or resets per-question overrides) | S | Yes (F5 already has the model) |
| 7 | **Paste or import questions from a spreadsheet/CSV** with a template and a review step before adding (text questions; media added after) | M | Yes, no backend needed; after the first release |
| 8 | **Reuse questions:** "Add from another quiz" picker (a local question bank over the library) and **merge two quizzes** | M | Yes, later slice |
| 9 | **Teams prepared before the night** (names saved in the quiz or picked from the Teams tool), add a late team mid-game | S | Yes |
| 10 | **Scores per round, editable afterwards:** a table team × round, fix a typo in an earlier round, leaderboard re-ranks; Undo for the last entry | M | Yes (state already saved per game) |
| 11 | **Sounds:** timer tick for the last seconds, time-up, reveal, podium fanfare; one mute key; a small soundboard later | S–M | Yes for the basic set (embedded, small); soundboard later |
| 12 | **Clicker support:** presentation remotes send Page Up / Page Down / B — map them to back / next / black so a cheap clicker runs the quiz | S | Yes |
| 13 | **Print pack:** answer sheets per round for teams and a host sheet with answers and notes (print stylesheet from the creator) | M | Yes, no backend; after the player |
| 14 | **"Read first" countdown and untimed questions:** time 0 = no timer; optional few seconds before the timer starts | S | Yes |
| 15 | **Phone as a real remote / "Present on TV":** Presentation API in the hosted PWA (Chrome + Chromecast) now as an experiment; QR remote for any device only with a relay | L | No — online or a backend; keep the player's commands as messages so it can be added |

Also worth keeping from the list above, lower priority: nearest-number tiebreak question (planned as a later
kind), round templates (a "standard pub quiz" skeleton: N rounds × M questions), export of final results as CSV,
"swap screens" button in the presenter view.

**One design rule that keeps all doors open (inference):** make the player a small state machine driven by
**commands** (`next`, `back`, `timer`, `reveal`, `score`) and rendering **views** (`audience`, `host`) from one
state. Keys, on-screen buttons, a second window, a clicker, the Presentation API and a future remote then all
send the same commands — none of them needs a change in the quiz format.
