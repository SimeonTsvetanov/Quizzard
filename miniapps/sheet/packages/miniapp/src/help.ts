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
      "Write your team's answer on the first line. Tap “Add an answer” (or press Enter) for the next question.",
      "When the answers are read out, tap ✓ for a right answer or ✗ for a wrong one.",
      "The round's points are on the right of its name and the total of the whole game is at the top right.",
      "Tap + next to the round numbers at the top when the next round starts. Tap a number to go back to that round.",
    ],
    features: [
      { name: "What a line brings", text: "The number at the end of each line is what that line brings: 0 for a wrong answer, the round's points for a right one. The numbers of the marked lines add up to the round." },
      { name: "Points of a round", text: "Every right answer gives 1 point. If a whole round gives something else, change the number after “A right answer gives”, for example 2; every line of that round follows." },
      { name: "Different points for one question", text: "Type the points at the end of a line, for example 6 or 0.5: the line counts as right with those points and gets a green edge. Typing 0 marks it wrong." },
      { name: "Bonus points", text: "“Bonus points” under a round adds extra points to it, or takes some away with a minus, for example −1." },
      { name: "Round names", text: "A round can have a name such as “History”; it is optional." },
      { name: "Earlier rounds", text: "Each round is a number at the top with its points under it. Tap it to open that round and fix an answer, a mark or the points; the total follows at once." },
      { name: "Saved on this device", text: "The game stays in this browser until you clear it, also when you close the app or lose the connection." },
    ],
    faq: [
      { q: "How do I remove a line I added by mistake?", a: "Tap the red − next to “Add an answer”, then the red − on the line, then “Done”. “Undo” brings a removed line back for a few seconds. On a keyboard, Backspace on an empty line removes it too." },
      { q: "I have more rounds than fit at the top. How do I reach them?", a: "Swipe the row of round numbers sideways, or tap the arrow at its end. The + for a new round is always there. A game can have up to 1,000 rounds." },
      { q: "How do I delete a round?", a: "Open the round and tap “Delete round” at the bottom. “Undo” brings it back for a few seconds." },
      { q: "How do I start a new game?", a: "Tap the eraser at the top (“Clear game”) and confirm. “Undo” brings the game back for a few seconds." },
      { q: "Can the other teams see my sheet?", a: "No. It is stored only in this browser on your device and is not sent anywhere." },
    ],
  },
  bg: {
    steps: [
      "Напишете отговора на отбора на първия ред. Докоснете „Добави отговор“ (или натиснете Enter) за следващия въпрос.",
      "Когато прочетат отговорите, докоснете ✓ за верен отговор или ✗ за грешен.",
      "Точките от рунда са вдясно от името му, а общият резултат от цялата игра е горе вдясно.",
      "Докоснете + до номерата на рундовете горе, когато започне следващият рунд. Докоснете номер, за да се върнете към този рунд.",
    ],
    features: [
      { name: "Какво носи един ред", text: "Числото в края на всеки ред е това, което редът носи: 0 за грешен отговор, точките на рунда за верен. Числата на отбелязаните редове дават сбора на рунда." },
      { name: "Точки на рунда", text: "Всеки верен отговор дава 1 точка. Ако цял рунд дава друго, сменете числото след „Верен отговор дава“, например 2; всички редове на рунда го следват." },
      { name: "Различни точки за един въпрос", text: "Напишете точките в края на реда, например 6 или 0,5: редът се брои за верен с тези точки и получава зелен кант. Ако напишете 0, редът става грешен." },
      { name: "Бонус точки", text: "„Бонус точки“ под рунда добавя допълнителни точки към него или отнема с минус, например −1." },
      { name: "Имена на рундове", text: "Рундът може да има име, например „История“; не е задължително." },
      { name: "Предишни рундове", text: "Всеки рунд е номер най-горе с точките му отдолу. Докоснете го, за да отворите този рунд и да поправите отговор, отметка или точки; общият резултат се обновява веднага." },
      { name: "Запазено на това устройство", text: "Играта остава в този браузър, докато не я изчистите, дори да затворите приложението или да няма връзка." },
    ],
    faq: [
      { q: "Как да махна ред, добавен по грешка?", a: "Докоснете червеното − до „Добави отговор“, после червеното − на реда, после „Готово“. „Отмени“ връща махнатия ред за няколко секунди. С клавиатура Backspace на празен ред също го маха." },
      { q: "Имам повече рундове, отколкото се събират горе. Как да стигна до тях?", a: "Плъзнете реда с номерата на рундовете настрани или докоснете стрелката в края му. Знакът + за нов рунд е винаги там. Една игра може да има до 1000 рунда." },
      { q: "Как да изтрия рунд?", a: "Отворете рунда и докоснете „Изтрий рунда“ най-долу. „Отмени“ го връща за няколко секунди." },
      { q: "Как да започна нова игра?", a: "Докоснете гумичката най-горе („Изчисти играта“) и потвърдете. „Отмени“ връща играта за няколко секунди." },
      { q: "Виждат ли другите отбори моя лист?", a: "Не. Той се пази само в този браузър на Вашето устройство и не се изпраща никъде." },
    ],
  },
};

// eslint-disable-next-line no-restricted-syntax -- because the contract's `MiniAppEntry.help` reads the module's default export
export default help;
