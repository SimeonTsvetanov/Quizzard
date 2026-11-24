// Help of the quiz creator per language (contract `HelpSection`): Quizzard's Help dialog loads it
// lazily (`MiniAppEntry.help`). UI labels are quoted exactly as in i18n/en.ts and i18n/bg.ts.
import type { HelpSection } from "./contract.ts";

/** Help texts in every language the body translates. */
export interface QuizHelp {
  readonly en: HelpSection;
  readonly bg: HelpSection;
}

/** Quick-start steps, every feature and the FAQ; both languages keep the same number of items (help.test.ts). */
export const help: QuizHelp = {
  en: {
    steps: [
      "Tap “New quiz”, type its name and tap “Create quiz”.",
      "Tap “Add round”. A round has a name and, in “Round settings”, the time and points every question in it gets.",
      "Tap “Add question”, choose its kind — “Text”, “Picture”, “Audio” or “Video” — type the question, add the file if it has one, and choose how it is answered: “Open answer”, “Multiple choice” or “True / false”.",
      "Tap “Done” to go back to the round, or “Add another” to go straight on to the next question. Each question is a small slide; tap one to change it.",
      "Tap “Preview” to see the questions as they will be played, and “Show answer” to see the reveal.",
      "Tap “Play” to run the whole quiz right here: teams, the timer, the answers, score entry, the leaderboard and the podium.",
      "Tap “Export” (its full name is “Export to play”) to save the quiz as one file. Open that file on the computer connected to the TV or projector — it plays without internet.",
    ],
    features: [
      { name: "Your quizzes", text: "Every quiz you make is a card in “Your quizzes” with its rounds, questions, play time and size. The buttons on the card rename it, make a copy or delete it." },
      { name: "Rounds", text: "A quiz can have up to 20 rounds. A round's card and a question's card have the same row of buttons: a handle to drag the card to another place, arrows that move it one place, duplicate, delete and “More” — preview, “Play from here”, to the top or the bottom and, for a question, “Move to round…”." },
      { name: "Time and points", text: "A question takes the time and points of its round and shows “From the round”. Change them in the question and it keeps its own; “Back to the round's” takes them back." },
      { name: "Points with a note", text: "Points are a number, a note for the teams such as “1 for the band, 2 with the song”, or both. The note is shown on the slide." },
      { name: "Multiple choice", text: "2 to 8 options. Tick every correct one — several may be correct." },
      { name: "Explanation", text: "A line shown together with the answer: a fact, a source or a story." },
      { name: "Pictures", text: "“Choose a picture” takes JPEG, PNG, WebP or GIF up to 15 MB from your device; on a computer you can also drop or paste one. A large photo is scaled down to 1920 px and saved again without the camera's notes (such as the place). A picture is always shown whole, in its own shape; a tap on it, or Z while playing, shows it large." },
      { name: "Audio and video", text: "Audio is MP3 or M4A up to 15 MB, video is MP4 (H.264 + AAC) up to 50 MB; a quiz holds up to 250 MB of media, and the quiz shows how much it has. A file is tried when you add it and refused with the reason if it cannot be played. While playing, a clip never starts by itself: press P or its play button. On a question with a clip the timer waits — it starts when the clip ends, or when you start it." },
      { name: "Host note", text: "“Host note (optional)” is a line for you alone — which answers to accept, how to say a name. It is shown in the editor and on the host panel, never on the stage." },
      { name: "Quiz file", text: "“Save quiz file” saves the quiz with all its media as one .quizzard file — to send to another person or device and keep editing there, and as your backup. “Open a quiz file” adds such a file to your quizzes. If the quiz is already there unchanged, nothing is added; if yours differs, you choose “Replace” or “Keep both”." },
      { name: "Black screen and break", text: "B, or “Black screen”, turns the stage black until you press it again or go on. The menu starts a break of 5, 10 or 15 minutes that counts down on the stage. The timer and the clip wait meanwhile." },
      { name: "Apply to all", text: "In “Round settings”, “Apply time and points to all questions” takes every question of the round back to the round's time and points. It says how many questions change first, and “Undo” brings their own values back." },
      { name: "Long rounds", text: "“Cards” shows every question as a small slide; “List” shows one short row per question, so a round of fifty fits a few screens. The choice is remembered on this device. In the editor the arrows next to the title go to the previous and the next question, and “In round” moves the question to another round." },
      { name: "Not finished", text: "A question without a text, a file or an answer is marked “Not finished”; the round and the quiz say how many there are. “Play” and “Export” ask first while some are unfinished: the list leads to each of them, and “Play anyway” or “Export anyway” goes on." },
      { name: "Print answers", text: "Under “Quiz file and printing”, “Print answers” prints a sheet for the host: every question with its answer, explanation, host note and points, a round to a page." },
      { name: "Keys in the editor", text: "Ctrl + Enter (⌘ + Enter on a Mac) is “Add another”. Alt + ↑ and Alt + ↓ go to the previous and the next question. In “Multiple choice”, Enter goes to the next option and adds one after the last. On a card's handle the arrow keys move the card." },
      { name: "Saved by itself", text: "There is no Save button. Every change is stored on this device a moment after you make it, and “Saved” appears at the top." },
      { name: "Playing a quiz", text: "The game goes title, teams, then for each round: the rules, the questions with their timer, the answers one by one, score entry and the leaderboard — and ends with the podium. A question's timer starts by itself and the next question follows when time is up; the menu switches that off, and can add a soft sound when time is up. The stage shows where you are as “3/10”, and the screen stays awake while you play." },
      { name: "Keys while playing", text: "Space, → or Page Down goes on, ← or Page Up goes back (a presentation clicker sends the Page keys), T starts or pauses the timer, R restarts it, P plays or pauses the clip, Z zooms the picture, B is the black screen, M opens the menu — with every screen as a tile to jump to — S the scores and F full screen. The same buttons are under the stage." },
      { name: "Audience window", text: "“Open audience window” shows the stage alone in a second window for the TV or projector. Your own window becomes the host panel: what the room sees, what comes next, the answer and your host note before anything is revealed, the timer, the clip's play and pause, and score entry — with the same row of buttons under it as under the stage. Sound and video play in the audience window; if the browser wants a tap there first, it shows “Tap to play”." },
      { name: "Scores and ties", text: "After each round you enter every team's points; the points of each question and their notes are shown next to it. “Scores” lets you correct any round. If first place is shared at the end, name the winner or add tiebreak points." },
      { name: "A game continues", text: "The game is saved as you play. Close the page or reload it and it continues where it was — in Quizzard and in the exported file. “Start the game again” in the menu asks first, clears the scores and keeps the team names; “Undo” brings the game back for a few seconds. Removing a team that has points asks first too." },
    ],
    faq: [
      { q: "Where are my quizzes kept?", a: "Only in this browser on your device. Nothing is uploaded. Settings → Your data shows how much space they take and can clear them." },
      { q: "Which pictures, audio and video can I add?", a: "Pictures: JPEG, PNG, WebP or GIF up to 15 MB. Audio: MP3 or M4A up to 15 MB. Video: MP4 with H.264 picture and AAC sound up to 50 MB. A quiz holds up to 250 MB of media. A file of another kind or over the limit is refused with a message that says why. iPhone photos in HEIC must be saved as JPEG first. The files stay on your device; use only files you have the right to use." },
      { q: "Why does the timer not start on an audio or video question?", a: "It waits for the clip. Press P (or the play button) to play it; when the clip ends the timer starts by itself, and T starts it at any time." },
      { q: "How do I play the quiz on a TV?", a: "Tap “Export to play” and copy the saved file to the computer connected to the TV or projector. Open it in a browser and press F for full screen. Nothing is loaded from the internet. With two screens, use “Open audience window” and drag that window to the TV." },
      { q: "Does the exported file change when I edit the quiz?", a: "No. The file is a copy of the quiz as it was when you exported it, with its own player inside. Export again after you change the quiz." },
      { q: "I deleted a question by mistake. Can I get it back?", a: "Yes, for a few seconds: tap “Undo” on the message that appears. The same goes for a deleted round or quiz." },
      { q: "Are my quizzes in “Export my data”?", a: "No. That file holds the settings and the other tools' data. A quiz travels as its own file: “Save quiz file” on the quiz, “Open a quiz file” in your quizzes." },
      { q: "What is the difference between “Export to play” and “Save quiz file”?", a: "“Export to play” makes an .html file that only plays the quiz, in any browser, without Quizzard. “Save quiz file” makes a .quizzard file that Quizzard opens again for editing. Large quizzes with video make large files: the size is shown, and over 100 MB the export asks first." },
    ],
  },
  bg: {
    steps: [
      "Докоснете „Нов куиз“, напишете името му и докоснете „Създай куиза“.",
      "Докоснете „Добави рунд“. Рундът има име, а в „Настройки на рунда“ са времето и точките за всеки въпрос в него.",
      "Докоснете „Добави въпрос“, изберете вида му — „Текст“, „Снимка“, „Аудио“ или „Видео“ — напишете въпроса, добавете файла, ако има такъв, и изберете как се отговаря: „Отворен отговор“, „Избор от няколко“ или „Вярно / невярно“.",
      "Докоснете „Готово“, за да се върнете към рунда, или „Добави още един“, за да продължите направо със следващия въпрос. Всеки въпрос е малък слайд; докоснете го, за да го промените.",
      "Докоснете „Преглед“, за да видите въпросите така, както ще се играят, и „Покажи отговора“ за разкриването.",
      "Докоснете „Играй“, за да изиграете целия куиз тук: отбори, таймер, отговори, въвеждане на точки, класиране и подиум.",
      "Докоснете „Експорт“ (пълното му име е „Експорт за игра“), за да запазите куиза като един файл. Отворете файла на компютъра, свързан с телевизора или проектора — играе се без интернет.",
    ],
    features: [
      { name: "Вашите куизове", text: "Всеки куиз е карта във „Вашите куизове“ с рундовете, въпросите, времето за игра и размера му. Бутоните на картата го преименуват, правят копие или го изтриват." },
      { name: "Рундове", text: "Един куиз може да има до 20 рунда. Картата на рунда и картата на въпроса имат един и същ ред бутони: дръжка за влачене на картата на друго място, стрелки, които я местят с едно място, копие, изтриване и „Още“ — преглед, „Играй оттук“, най-горе или най-долу, а за въпрос и „Премести в рунд…“." },
      { name: "Време и точки", text: "Въпросът взима времето и точките на рунда си и показва „От рунда“. Сменете ги във въпроса и той пази своите; „Обратно към рунда“ ги връща." },
      { name: "Точки с бележка", text: "Точките са число, бележка за отборите като „1 за групата, 2 с песента“ или и двете. Бележката се показва на слайда." },
      { name: "Избор от няколко", text: "От 2 до 8 възможности. Отбележете всяка вярна — може да са няколко." },
      { name: "Обяснение", text: "Ред, който се показва заедно с отговора: факт, източник или история." },
      { name: "Снимки", text: "„Избери снимка“ приема JPEG, PNG, WebP или GIF до 15 MB от устройството Ви; на компютър може и да я пуснете или поставите. Голяма снимка се смалява до 1920 px и се запазва отново без бележките на камерата (например мястото). Снимката винаги се показва цяла, в собствената си форма; докосване върху нея или Z по време на игра я показва голяма." },
      { name: "Аудио и видео", text: "Аудиото е MP3 или M4A до 15 MB, видеото е MP4 (H.264 + AAC) до 50 MB; един куиз побира до 250 MB медия и показва колко има. Файлът се пробва при добавяне и се отказва с причината, ако не може да се пусне. По време на игра клипът никога не тръгва сам: натиснете P или бутона му. При въпрос с клип таймерът изчаква — тръгва, щом клипът свърши или когато го пуснете Вие." },
      { name: "Бележка за водещия", text: "„Бележка за водещия (по желание)“ е ред само за Вас — кои отговори се приемат, как се произнася име. Показва се в редактора и в панела на водещия, никога на сцената." },
      { name: "Файл на куиза", text: "„Запази файл на куиза“ запазва куиза с цялата му медия като един файл .quizzard — за изпращане до друг човек или устройство, където редактирането продължава, и като резервно копие. „Отвори файл на куиз“ добавя такъв файл към куизовете Ви. Ако куизът вече е там непроменен, нищо не се добавя; ако Вашият е различен, избирате „Замени“ или „Запази и двете“." },
      { name: "Черен екран и почивка", text: "B или „Черен екран“ прави сцената черна, докато не го натиснете пак или не продължите. От менюто се пуска почивка от 5, 10 или 15 минути, която се отброява на сцената. Таймерът и клипът изчакват през това време." },
      { name: "Приложи за всички", text: "В „Настройки на рунда“ „Приложи времето и точките за всички въпроси“ връща всеки въпрос от рунда към времето и точките на рунда. Преди това казва колко въпроса ще се променят, а „Отмени“ връща собствените им стойности." },
      { name: "Дълги рундове", text: "„Карти“ показва всеки въпрос като малък слайд; „Списък“ показва по един къс ред на въпрос, така че рунд с петдесет въпроса се побира на няколко екрана. Изборът се помни на това устройство. В редактора стрелките до заглавието водят към предишния и следващия въпрос, а „В рунд“ мести въпроса в друг рунд." },
      { name: "Недовършени въпроси", text: "Въпрос без текст, файл или отговор е отбелязан с „Недовършен“; рундът и куизът казват колко са. „Играй“ и „Експорт“ първо питат, докато има недовършени: списъкът води към всеки от тях, а „Играй въпреки това“ или „Експортирай въпреки това“ продължава." },
      { name: "Отпечатване на отговорите", text: "Под „Файл и печат“ „Отпечатай отговорите“ печата лист за водещия: всеки въпрос с отговора, обяснението, бележката за водещия и точките, по един рунд на страница." },
      { name: "Клавиши в редактора", text: "Ctrl + Enter (⌘ + Enter на Mac) е „Добави още един“. Alt + ↑ и Alt + ↓ водят към предишния и следващия въпрос. При „Избор от няколко“ Enter отива на следващата възможност и добавя нова след последната. Върху дръжката на карта стрелките местят картата." },
      { name: "Запазва се само", text: "Няма бутон за запазване. Всяка промяна се пази на това устройство миг след като я направите, а горе се появява „Запазено“." },
      { name: "Игра на куиз", text: "Играта върви така: заглавие, отбори, после за всеки рунд — правилата, въпросите с таймер, отговорите един по един, въвеждане на точки и класиране, а накрая подиум. Таймерът на въпроса тръгва сам и следващият въпрос идва, щом времето изтече; менюто изключва това и може да добави тих звук, когато времето изтече. Сцената показва докъде сте като „3/10“, а екранът не заспива, докато играете." },
      { name: "Клавиши по време на игра", text: "Интервал, → или Page Down продължава, ← или Page Up връща назад (дистанционното за презентации праща клавишите Page), T пуска или спира таймера, R го пуска отначало, P пуска или спира клипа, Z увеличава снимката, B е черният екран, M отваря менюто — с всеки екран като плочка, към която да скочите — S показва точките, а F — цял екран. Същите бутони са под сцената." },
      { name: "Прозорец за публиката", text: "„Отвори прозорец за публиката“ показва само сцената във втори прозорец за телевизора или проектора. Вашият прозорец става панел на водещия: какво вижда залата, какво следва, отговорът и бележката Ви, преди нещо да е показано, таймерът, пускането и паузата на клипа и въвеждането на точки — със същия ред бутони под него като под сцената. Звукът и видеото вървят в прозореца за публиката; ако браузърът иска първо докосване там, той показва „Докоснете, за да тръгне“." },
      { name: "Точки и равенство", text: "След всеки рунд въвеждате точките на всеки отбор; до тях са точките на всеки въпрос и бележките към тях. От „Точки“ се поправя всеки рунд. Ако първото място накрая е поделено, посочете победителя или добавете точки от допълнителен въпрос." },
      { name: "Играта продължава", text: "Играта се запазва, докато играете. Затворете или презаредете страницата и тя продължава оттам, докъдето е стигнала — в Quizzard и в експортирания файл. „Започни играта отначало“ в менюто първо пита, изчиства точките и пази имената на отборите; „Отмени“ връща играта за няколко секунди. Премахването на отбор с точки също първо пита." },
    ],
    faq: [
      { q: "Къде се пазят куизовете ми?", a: "Само в този браузър на Вашето устройство. Нищо не се качва. Настройки → Вашите данни показва колко място заемат и може да ги изчисти." },
      { q: "Какви снимки, аудио и видео мога да добавя?", a: "Снимки: JPEG, PNG, WebP или GIF до 15 MB. Аудио: MP3 или M4A до 15 MB. Видео: MP4 с картина H.264 и звук AAC до 50 MB. Един куиз побира до 250 MB медия. Файл от друг вид или над лимита се отказва със съобщение, което казва защо. Снимките от iPhone във формат HEIC първо трябва да се запазят като JPEG. Файловете остават на устройството Ви; използвайте само файлове, които имате право да използвате." },
      { q: "Защо таймерът не тръгва при въпрос с аудио или видео?", a: "Изчаква клипа. Натиснете P (или бутона за пускане), за да го пуснете; щом клипът свърши, таймерът тръгва сам, а T го пуска по всяко време." },
      { q: "Как да пусна куиза на телевизор?", a: "Докоснете „Експорт за игра“ и копирайте запазения файл на компютъра, свързан с телевизора или проектора. Отворете го в браузър и натиснете F за цял екран. Нищо не се зарежда от интернет. При два екрана използвайте „Отвори прозорец за публиката“ и преместете този прозорец на телевизора." },
      { q: "Променя ли се експортираният файл, когато редактирам куиза?", a: "Не. Файлът е копие на куиза, какъвто е бил при експорта, със собствен плейър вътре. Експортирайте отново, след като промените куиза." },
      { q: "Изтрих въпрос по грешка. Мога ли да го върна?", a: "Да, за няколко секунди: докоснете „Отмени“ в съобщението, което се появява. Същото важи за изтрит рунд или куиз." },
      { q: "Куизовете ми влизат ли в „Експортирай данните ми“?", a: "Не. Този файл съдържа настройките и данните на другите инструменти. Куизът се пренася като собствен файл: „Запази файл на куиза“ в куиза, „Отвори файл на куиз“ във Вашите куизове." },
      { q: "Каква е разликата между „Експорт за игра“ и „Запази файл на куиза“?", a: "„Експорт за игра“ прави файл .html, който само пуска куиза — във всеки браузър, без Quizzard. „Запази файл на куиза“ прави файл .quizzard, който Quizzard отваря отново за редактиране. Големите куизове с видео правят големи файлове: размерът се показва, а над 100 MB експортът първо пита." },
    ],
  },
};

// eslint-disable-next-line no-restricted-syntax -- because the contract's `MiniAppEntry.help` reads the module's default export
export default help;
