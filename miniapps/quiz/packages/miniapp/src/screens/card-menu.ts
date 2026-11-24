// A card's "More" list (lazy: loaded with the first press, with the sheet it is shown in): what can
// be done with a question or a round besides the buttons on its card — preview, play from here, to
// the top or the bottom, to another round. A compact row has no buttons of its own, so its list also
// carries move up/down, duplicate and delete.
import type { Question, Quiz, Round } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { type SheetItem, openSheet } from "../dom/sheet.ts";
import { questionName } from "./common.ts";

/** What a question's list can do; the card gives the moves. */
export interface QuestionMenuOptions {
  readonly quiz: Quiz;
  readonly round: Round;
  readonly question: Question;
  readonly index: number;
  /** The row has no buttons of its own: the list carries them. */
  readonly isCompact: boolean;
  readonly move: (to: number) => void;
  readonly moveToRound: (roundId: string) => void;
  readonly duplicate: () => void;
  readonly remove: () => void;
  readonly preview: () => void;
  readonly playFrom: () => void;
}

/** What a round's list can do. */
export interface RoundMenuOptions {
  readonly quiz: Quiz;
  readonly round: Round;
  readonly index: number;
  readonly move: (to: number) => void;
  /** `null` for a round without questions: there is nothing to show or play. */
  readonly preview: (() => void) | null;
  readonly playFrom: (() => void) | null;
}

/** A line's action that closes the sheet when done. */
const run = (action: () => void) => (): undefined => {
  action();
  return undefined;
};

/** "To the top" and "To the bottom", each only where it changes something. */
function ends(app: App, index: number, last: number, move: (to: number) => void): SheetItem[] {
  const { t } = app;
  return [
    { label: t("menu.top"), icon: "top", hook: "data-move-top", isOff: index === 0, run: run(() => { move(0); }) },
    { label: t("menu.bottom"), icon: "bottom", hook: "data-move-bottom", isOff: index === last, run: run(() => { move(last); }) },
  ];
}

/** The rounds of the quiz as a list to pick from; the question's own round is marked and cannot be chosen. */
function roundItems(options: QuestionMenuOptions): SheetItem[] {
  return options.quiz.rounds.map((round, index) => ({
    label: `${String(index + 1)}. ${round.name}`,
    hook: "data-pick-round",
    isCurrent: round === options.round,
    isOff: round === options.round,
    run: run(() => { options.moveToRound(round.id); }),
  }));
}

/**
 * Opens the list of a question.
 * @param app - the mounted creator
 * @param options - the question, its place and its moves
 */
export function openQuestionMenu(app: App, options: QuestionMenuOptions): void {
  const { t } = app;
  const { index, round, quiz } = options;
  const n = index + 1;
  const last = round.questions.length - 1;
  const items: SheetItem[] = [
    { label: t("menu.preview"), icon: "eye", hook: "data-preview", run: run(options.preview) },
    { label: t("menu.playFrom"), icon: "play", hook: "data-play-from", run: run(options.playFrom) },
  ];
  if (options.isCompact) {
    items.push(
      { label: t("menu.up"), icon: "up", hook: "data-move-up", isOff: index === 0, run: run(() => { options.move(index - 1); }) },
      { label: t("menu.down"), icon: "down", hook: "data-move-down", isOff: index === last, run: run(() => { options.move(index + 1); }) });
  }
  items.push(...ends(app, index, last, options.move));
  const sheet = openSheet({ host: app.host, title: questionName(app, options.question, n), items: [], closeLabel: t("menu.close") });
  if (quiz.rounds.length > 1) {
    items.push({
      label: t("menu.toRound"), icon: "round", hook: "data-move-round-menu",
      run: () => {
        sheet.show({ title: t("menu.pickRound", { n }), items: roundItems(options) });
        return "stay";
      },
    });
  }
  if (options.isCompact) {
    items.push(
      { label: t("menu.duplicate"), icon: "copy", hook: "data-duplicate", run: run(options.duplicate) },
      { label: t("menu.delete"), icon: "trash", hook: "data-delete", isDanger: true, run: run(options.remove) });
  }
  sheet.show({ title: questionName(app, options.question, n), items });
}

/**
 * Opens the list of a round.
 * @param app - the mounted creator
 * @param options - the round, its place and its moves
 */
export function openRoundMenu(app: App, options: RoundMenuOptions): void {
  const { t } = app;
  const { index, quiz, round, preview, playFrom } = options;
  const items: SheetItem[] = [
    { label: t("menu.previewRound"), icon: "eye", hook: "data-preview", isOff: preview === null, run: run(() => { preview?.(); }) },
    { label: t("menu.playRound"), icon: "play", hook: "data-play-from", isOff: playFrom === null, run: run(() => { playFrom?.(); }) },
    ...ends(app, index, quiz.rounds.length - 1, options.move),
  ];
  openSheet({ host: app.host, title: t("round.title", { n: index + 1, name: round.name }), items, closeLabel: t("menu.close") });
}
