# Privacy and data

Quizzard keeps your names, players, scores and answers on your device and nowhere else. This page explains what it saves, where, and when anything leaves your device. The full legal text is the Privacy notice in the menu (**Menu** > **Privacy**).

## Everything stays on your device

Quizzard has no server of its own for your data, no accounts, no ads, no tracking, no cookies and no analytics. It loads nothing from other websites. Your names, players, scores and answers are never put in the page address. Only the number of teams can be, for example `#/teams?teams=4`. The author can't see, back up or recover your data. Use **Export my data** if you want a copy, and enter only names of people who are fine with it.

Quizzard keeps the following in your browser's local storage on this device:

- **Quizzard itself:** your theme, background and language, the tool you opened last, the last version whose changes you saw, when you last closed the offer to install, whether Quizzard already asked the browser to keep its data, and an unsent problem report draft.
- **Teams:** your last list of names, the number of teams, and a short code made from the last list you made teams from, with how many times in a row teams were made from it. The code is not the names.
- **Scores:** the players, their scores, when each player was added, and for each player the points and time of up to 50 recent changes.
- **Answer sheet:** each round's name, your answers, whether each is marked right or wrong, the points of each round and question, and the bonus points.
- **Quiz creator:** your quizzes (their rounds, questions, answers, explanations and host notes) and the pictures, audio and video you added to them, including each picture shown with an answer. These are kept in your browser's IndexedDB database on this device (`quizzard-quiz`), because they can be large. In local storage it keeps the game of each quiz you play (where the game is, the team names, the points, whether questions run by themselves, whether the time-up sound is on, and the language you picked in the player's menu), whether you look at a round as cards or as a list, and, for a moment, the last change that is not yet written to the database.

A photo is scaled down and saved again without the notes the camera wrote into it, such as the place it was taken. When you cut and shrink a clip, your browser makes the smaller file on your device; the clip is not uploaded, and only the cut file is kept.

An exported quiz keeps its game, with the same details, in the local storage of the browser that opens the file, if that browser allows it.

None of this is synced anywhere. **Settings** > **Your data** shows what each tool and Quizzard have saved, with a **Clear** for each tool.

## Separate from TeamSync and GG Counter

Teams and Scores started as the TeamSync and GG Counter sites, and those sites are on the same web address (`simeontsvetanov.github.io`). Quizzard keeps its data under its own names. It doesn't read, change or delete what those sites saved, and they don't see Quizzard's data. A list or game you saved there is still there, and Teams and Scores in Quizzard start empty. Data that the 2025 version of Quizzard saved in this browser isn't read, changed or deleted either.

Clearing this site's data in your browser removes everything on that address, including the data of those sites. **Clear my data** in Quizzard deletes only Quizzard's data.

## The offline copy

So Quizzard works without internet, your browser keeps a copy of the app's own files, not your data, in its Cache Storage. A service worker manages it. If you select **Keep data on this device** in **Settings**, Quizzard asks the browser to keep this site's storage permanent. Clearing this site's data in your browser removes the offline copy too.

## When data leaves your device

Data leaves your device only in the following cases, and only when you start them:

- **Share and Copy in Teams:** the teams (the names in each team) and a last line with a link to Quizzard go to the app you choose, to WhatsApp or to the clipboard. The number after "Quizzard" in that line only counts shuffles of the same list on this device.
- **Share in Scores:** the leaderboard (player names, scores, the date and time, and a link) goes the same way.
- **Share app:** the name and the link of Quizzard.
- **Report a problem:** **Open on GitHub** opens GitHub with the text you wrote in the page address, so GitHub receives it when the page opens. It becomes a public issue only when you submit it there. The technical details you leave ticked don't contain names, players, scores or answers.
- **Quiz files and exported quizzes:** **Save quiz file**, **Share** and **Export** in Quiz creator make a file with the quiz and its pictures, audio and video. The file goes where you save or send it; Quizzard uploads nothing. An exported quiz plays from that file alone and loads nothing from the internet. Its Quizzard logo is a link to the Quizzard website and opens it only when you select it.
- **Hosting:** Quizzard is hosted on GitHub Pages, which logs visitor IP addresses for security.

Once a text is shared, the app you chose and its privacy terms apply. Nothing is ever shared automatically.

## Can your data disappear?

Yes, in some cases. Clearing the site's data in your browser removes it. Safari on iPhone and iPad can also delete the data of a site that you haven't opened for 7 days, unless Quizzard is on your Home Screen. Use **Export my data** to keep a copy. Quizzes are not in that file: save each quiz with **Save quiz file** in **Quiz creator**.

## Related

- [Back up and move your data](../how-to/back-up-and-move-your-data.md)
- [Make a quiz](../how-to/make-a-quiz.md)
- [Install the app](../how-to/install-the-app.md)
- [Settings](../reference/settings.md)
- [Quizzard user documentation](../index.md)
