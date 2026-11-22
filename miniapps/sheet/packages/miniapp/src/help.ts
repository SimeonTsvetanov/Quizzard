// Help of the Answer sheet per language (contract `HelpSection`): Quizzard's Help dialog loads it
// lazily (`MiniAppEntry.help`). UI labels are quoted exactly as in i18n/en.ts and i18n/bg.ts.
import type { HelpSection } from "./contract.ts";

/** Help texts in every language the body translates. */
export interface SheetHelp {
  readonly en: HelpSection;
  readonly bg: HelpSection;
}

/** Quick-start steps, every feature and the FAQ; both languages keep the same number of items (help.test.ts). */
export const help: SheetHelp = {
  en: {
    steps: [
      "Write your team's answer on the first line. Press Enter (or tap the next line) for the next question.",
      "When the answers are read out, tap ✓ for a right answer or ✗ for a wrong one.",
      "The round's points are on the right of its title and the total of the whole game stays at the top.",
      "Tap “New round” when the next round starts.",
    ],
    features: [
      { name: "No set-up", text: "You never say how many questions a round has: a new empty line appears as soon as you write on the last one." },
      { name: "Different points per question", text: "Every right answer gives 1 point. If a question is worth more or less, change the number at the end of its line, for example 2 or 0.5." },
      { name: "Bonus points", text: "“Bonus points” under a round adds extra points to it, or takes some away with a minus, for example −1." },
      { name: "Round names", text: "A round can have a name such as “History”; it is optional." },
      { name: "Earlier rounds", text: "Tap a round's title to open it again and fix an answer, a mark or the points; the total follows at once." },
      { name: "Saved on this device", text: "The game stays in this browser until you tap “Clear game”, also when you close the app or lose the connection." },
    ],
    faq: [
      { q: "How do I remove a line I added by mistake?", a: "Delete its text and press Backspace once more on the empty line." },
      { q: "How do I start a new game?", a: "Tap “Clear game” at the bottom and confirm. “Undo” brings the game back for a few seconds." },
      { q: "Can the other teams see my sheet?", a: "No. It is stored only in this browser on your device and is not sent anywhere." },
    ],
  },
  bg: {
    steps: [
      "Напишете отговора на отбора на първия ред. Натиснете Enter (или докоснете следващия ред) за следващия въпрос.",
      "Когато прочетат отговорите, докоснете ✓ за верен отговор или ✗ за грешен.",
      "Точките от рунда са вдясно от заглавието му, а общият резултат от цялата игра стои най-горе.",
      "Докоснете „Нов рунд“, когато започне следващият рунд.",
    ],
    features: [
      { name: "Без настройване", text: "Не казвате колко въпроса има в рунда: нов празен ред се появява, щом пишете на последния." },
      { name: "Различни точки за въпрос", text: "Всеки верен отговор дава 1 точка. Ако въпрос носи повече или по-малко, сменете числото в края на реда му, например 2 или 0,5." },
      { name: "Бонус точки", text: "„Бонус точки“ под рунда добавя допълнителни точки към него или отнема с минус, например −1." },
      { name: "Имена на рундове", text: "Рундът може да има име, например „История“; не е задължително." },
      { name: "Предишни рундове", text: "Докоснете заглавието на рунд, за да го отворите пак и да поправите отговор, отметка или точки; общият резултат се обновява веднага." },
      { name: "Запазено на това устройство", text: "Играта остава в този браузър, докато не докоснете „Изчисти играта“, дори да затворите приложението или да няма връзка." },
    ],
    faq: [
      { q: "Как да махна ред, добавен по грешка?", a: "Изтрийте текста му и натиснете Backspace още веднъж на празния ред." },
      { q: "Как да започна нова игра?", a: "Докоснете „Изчисти играта“ най-долу и потвърдете. „Отмени“ връща играта за няколко секунди." },
      { q: "Виждат ли другите отбори моя лист?", a: "Не. Той се пази само в този браузър на Вашето устройство и не се изпраща никъде." },
    ],
  },
};

// eslint-disable-next-line no-restricted-syntax -- because the contract's `MiniAppEntry.help` reads the module's default export
export default help;
