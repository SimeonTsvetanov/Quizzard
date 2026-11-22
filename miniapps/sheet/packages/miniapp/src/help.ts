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
      "The round's points are on the right of its name and the total of the whole game stays at the top.",
      "Tap + next to the round numbers when the next round starts. Tap a number to go back to that round.",
    ],
    features: [
      { name: "No set-up", text: "You never say how many questions a round has: a new empty line appears as soon as you write on the last one." },
      { name: "Points of a round", text: "Every right answer gives 1 point. If a whole round gives something else, change the number after “A right answer gives”, for example 2; every line of that round follows." },
      { name: "Different points for one question", text: "If only one question is worth more or less, change the number at the end of its line, for example 0.5. It gets a green edge and keeps its own points." },
      { name: "Bonus points", text: "“Bonus points” under a round adds extra points to it, or takes some away with a minus, for example −1." },
      { name: "Round names", text: "A round can have a name such as “History”; it is optional." },
      { name: "Earlier rounds", text: "Each round is a number at the top with its points under it. Tap it to open that round and fix an answer, a mark or the points; the total follows at once." },
      { name: "Saved on this device", text: "The game stays in this browser until you clear it, also when you close the app or lose the connection." },
    ],
    faq: [
      { q: "How do I remove a line I added by mistake?", a: "Delete its text and press Backspace once more on the empty line." },
      { q: "How do I start a new game?", a: "Tap the eraser at the top (“Clear game”) and confirm. “Undo” brings the game back for a few seconds." },
      { q: "Can the other teams see my sheet?", a: "No. It is stored only in this browser on your device and is not sent anywhere." },
    ],
  },
  bg: {
    steps: [
      "Напишете отговора на отбора на първия ред. Натиснете Enter (или докоснете следващия ред) за следващия въпрос.",
      "Когато прочетат отговорите, докоснете ✓ за верен отговор или ✗ за грешен.",
      "Точките от рунда са вдясно от името му, а общият резултат от цялата игра стои най-горе.",
      "Докоснете + до номерата на рундовете, когато започне следващият рунд. Докоснете номер, за да се върнете към този рунд.",
    ],
    features: [
      { name: "Без настройване", text: "Не казвате колко въпроса има в рунда: нов празен ред се появява, щом пишете на последния." },
      { name: "Точки на рунда", text: "Всеки верен отговор дава 1 точка. Ако цял рунд дава друго, сменете числото след „Верен отговор дава“, например 2; всички редове на рунда го следват." },
      { name: "Различни точки за един въпрос", text: "Ако само един въпрос носи повече или по-малко, сменете числото в края на реда му, например 0,5. То получава зелен кант и пази своите точки." },
      { name: "Бонус точки", text: "„Бонус точки“ под рунда добавя допълнителни точки към него или отнема с минус, например −1." },
      { name: "Имена на рундове", text: "Рундът може да има име, например „История“; не е задължително." },
      { name: "Предишни рундове", text: "Всеки рунд е номер най-горе с точките му отдолу. Докоснете го, за да отворите този рунд и да поправите отговор, отметка или точки; общият резултат се обновява веднага." },
      { name: "Запазено на това устройство", text: "Играта остава в този браузър, докато не я изчистите, дори да затворите приложението или да няма връзка." },
    ],
    faq: [
      { q: "Как да махна ред, добавен по грешка?", a: "Изтрийте текста му и натиснете Backspace още веднъж на празния ред." },
      { q: "Как да започна нова игра?", a: "Докоснете гумичката най-горе („Изчисти играта“) и потвърдете. „Отмени“ връща играта за няколко секунди." },
      { q: "Виждат ли другите отбори моя лист?", a: "Не. Той се пази само в този браузър на Вашето устройство и не се изпраща никъде." },
    ],
  },
};

// eslint-disable-next-line no-restricted-syntax -- because the contract's `MiniAppEntry.help` reads the module's default export
export default help;
