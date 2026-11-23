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
      "Tap “New quiz” and give it a name.",
      "Tap “Add round”. A round has a name and, in “Round settings”, the time and points every question in it gets.",
      "Tap “Add question”, type the question and choose how it is answered: “Open answer”, “Multiple choice” or “True / false”.",
      "Tap “Done” to go back to the round. Each question is a small slide; tap one to change it.",
      "Tap “Preview” to see the questions as they will be played, and “Show answer” to see the reveal.",
    ],
    features: [
      { name: "Your quizzes", text: "Every quiz you make is a card in “Your quizzes” with its rounds, questions, play time and size. The buttons on the card rename it, make a copy or delete it." },
      { name: "Rounds", text: "A quiz can have up to 20 rounds. The arrows on a round move it up or down; “Duplicate round” and “Delete round” are in “Round settings”." },
      { name: "Time and points", text: "A question takes the time and points of its round and shows “From the round”. Change them in the question and it keeps its own; “Back to the round's” takes them back." },
      { name: "Points with a note", text: "Points are a number, a note for the teams such as “1 for the band, 2 with the song”, or both. The note is shown on the slide." },
      { name: "Multiple choice", text: "2 to 8 options. Tick every correct one — several may be correct." },
      { name: "Explanation", text: "A line shown together with the answer: a fact, a source or a story." },
      { name: "Saved by itself", text: "There is no Save button. Every change is stored on this device a moment after you make it, and “Saved” appears at the top." },
    ],
    faq: [
      { q: "Where are my quizzes kept?", a: "Only in this browser on your device. Nothing is uploaded. Settings → Your data shows how much space they take and can clear them." },
      { q: "Can I add pictures, audio or video?", a: "Not yet. Those kinds are marked “Soon” and arrive in the next versions; text questions with all three answer types work today." },
      { q: "How do I play the quiz on a TV?", a: "“Export to play” is on its way: it will make one file that plays on a TV or projector with a timer, answers and scores. Until then “Preview” shows every question as it will look." },
      { q: "I deleted a question by mistake. Can I get it back?", a: "Yes, for a few seconds: tap “Undo” on the message that appears. The same goes for a deleted round or quiz." },
      { q: "Are my quizzes in “Export my data”?", a: "No. That file holds the settings and the other tools' data. Quizzes will travel as their own quiz files in a later version." },
    ],
  },
  bg: {
    steps: [
      "Докоснете „Нов куиз“ и му дайте име.",
      "Докоснете „Добави рунд“. Рундът има име, а в „Настройки на рунда“ са времето и точките за всеки въпрос в него.",
      "Докоснете „Добави въпрос“, напишете въпроса и изберете как се отговаря: „Отворен отговор“, „Избор от няколко“ или „Вярно / невярно“.",
      "Докоснете „Готово“, за да се върнете към рунда. Всеки въпрос е малък слайд; докоснете го, за да го промените.",
      "Докоснете „Преглед“, за да видите въпросите така, както ще се играят, и „Покажи отговора“ за разкриването.",
    ],
    features: [
      { name: "Вашите куизове", text: "Всеки куиз е карта във „Вашите куизове“ с рундовете, въпросите, времето за игра и размера му. Бутоните на картата го преименуват, правят копие или го изтриват." },
      { name: "Рундове", text: "Един куиз може да има до 20 рунда. Стрелките на рунда го местят нагоре или надолу; „Направи копие на рунда“ и „Изтрий рунда“ са в „Настройки на рунда“." },
      { name: "Време и точки", text: "Въпросът взима времето и точките на рунда си и показва „От рунда“. Сменете ги във въпроса и той пази своите; „Обратно към рунда“ ги връща." },
      { name: "Точки с бележка", text: "Точките са число, бележка за отборите като „1 за групата, 2 с песента“ или и двете. Бележката се показва на слайда." },
      { name: "Избор от няколко", text: "От 2 до 8 възможности. Отбележете всяка вярна — може да са няколко." },
      { name: "Обяснение", text: "Ред, който се показва заедно с отговора: факт, източник или история." },
      { name: "Запазва се само", text: "Няма бутон за запазване. Всяка промяна се пази на това устройство миг след като я направите, а горе се появява „Запазено“." },
    ],
    faq: [
      { q: "Къде се пазят куизовете ми?", a: "Само в този браузър на Вашето устройство. Нищо не се качва. Настройки → Вашите данни показва колко място заемат и може да ги изчисти." },
      { q: "Мога ли да добавя снимки, аудио или видео?", a: "Още не. Тези видове са отбелязани със „Скоро“ и идват в следващите версии; текстовите въпроси с трите вида отговор работят още сега." },
      { q: "Как да пусна куиза на телевизор?", a: "„Експорт за игра“ предстои: ще прави един файл, който се играе на телевизор или проектор с таймер, отговори и точки. Дотогава „Преглед“ показва всеки въпрос така, както ще изглежда." },
      { q: "Изтрих въпрос по грешка. Мога ли да го върна?", a: "Да, за няколко секунди: докоснете „Отмени“ в съобщението, което се появява. Същото важи за изтрит рунд или куиз." },
      { q: "Куизовете ми влизат ли в „Експортирай данните ми“?", a: "Не. Този файл съдържа настройките и данните на другите инструменти. Куизовете ще се пренасят като собствени файлове в следваща версия." },
    ],
  },
};

// eslint-disable-next-line no-restricted-syntax -- because the contract's `MiniAppEntry.help` reads the module's default export
export default help;
