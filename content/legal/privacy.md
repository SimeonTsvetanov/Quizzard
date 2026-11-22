<!-- Template from APP-STANDARD §6 + legal-pages §2 (2026-11-07). Not legal advice. One bullet per layer the app really has; delete the {If …} parts that don't apply. compliance-check.mjs checks this text against app.config.ts and the code. -->

**Privacy** — Last updated: {date}

- **Who is responsible:** {App} is made by Simeon Tsvetanov, Bulgaria (contact: {email}). Data
  that stays on your device is under your control only; where data reaches us, the section
  "When data reaches us" below applies.
- **In the browser:** your files are processed entirely on your device. They are not uploaded.
- **Stored on your device only:** your settings (theme, language), which tips and prompts you
  already dismissed, an unsent problem report draft, {If feedback webhook:} a report waiting to
  be sent while you are offline (including your reply email, if you gave one), and {what the app
  saves, e.g. history / saved items / files} are kept in your browser's own storage on this device (local storage,
  IndexedDB, private file storage). They never leave your device and are not synced anywhere.
  You can see the space used, export, or delete them in **Settings → Storage**, or by clearing
  this site's data in your browser.
- **Offline copy:** so the app works without internet, your browser keeps an offline copy of the
  app's own files (not your data) in its Cache Storage, managed by a service worker. The app may
  also ask the browser to keep this site's storage persistent (`navigator.storage.persist()`),
  so it is not cleared automatically when space runs low. Clearing this site's data removes both.
- **No accounts, no ads, no tracking, no cookies, no analytics.**
- **{If API:}** when you or your tools call the API, the file is sent to our server, processed in
  memory to return the result, and not stored. Standard server logs (time, IP address, size,
  status — no file contents) are kept for {N} days for security, then deleted.
- **Problem reports:** if you send a report, its text and the diagnostics you leave ticked are
  posted as a **public** GitHub issue. An optional reply email is sent only to the author and is
  never published.
- **{If AI features:}** text you submit to {feature} is sent to {provider} to generate the result;
  see their privacy policy.
- **Hosting:** the site is hosted on GitHub Pages. GitHub logs visitor IP addresses for security
  purposes — see the GitHub Privacy Statement.

<!-- This block ships in every app: an email to the contact address already reaches us (legal-pages §2). Keep only the options that are true for the app. -->
**When data reaches us** (GDPR Art. 13)

- **Controller:** Simeon Tsvetanov, Bulgaria — {email}.
- **What and why (purpose):** {emails you send to the contact address (your message and address)
  — to answer you / problem reports sent through the app (text, ticked diagnostics, optional
  reply email) — to fix problems and answer you / API request logs — to keep the service
  secure / text sent to the AI feature — to generate the result}.
- **Legal basis:** {legitimate interest in answering the messages people send and in a secure,
  working service (Art. 6(1)(f)) / consent, by sending the report (Art. 6(1)(a))}.
- **Recipients:** {the provider of the contact mailbox (name it, e.g. Google) / GitHub (public
  issue) / n8n / VPS host / AI model provider}.
- **Transfers outside the EU:** {the mailbox provider, GitHub and … may process this data in the
  USA; safeguard: EU–US Data Privacy Framework / standard contractual clauses}.
- **Retention:** {emails: deleted at the latest one month after the conversation ends · webhook
  logs: N days · API logs: N days · rate-limit state: N days}. Public GitHub issues stay until
  you ask us to remove them.
- **Your rights:** access, rectification, erasure, restriction, objection, data portability and
  withdrawing consent at any time — write to {email}. You can also complain to the Commission
  for Personal Data Protection (КЗЛД), 2 Prof. Tsvetan Lazarov Blvd, 1592 Sofia, kzld@cpdp.bg.

- **Email to the contact address:** if you write to {email}, your message and address are used
  only to answer you. They are stored by the provider of that mailbox (see "Recipients" above),
  passed on to no one else, and deleted at the latest one month after the conversation ends.
- **Contact:** {email}
