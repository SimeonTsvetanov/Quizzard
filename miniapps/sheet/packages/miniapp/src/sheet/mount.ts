// Mounts the answer sheet and handles what people do on it: writing answers, marking them, changing
// what a round or one question gives, bonus points, moving between rounds, a new round, "Delete round"
// and "Clear game" (in the host's header). Level 1: one delegated listener per event type; typing
// never rebuilds the screen, so the caret and the keyboard stay where they are.
// Parts: state.ts (model + saving), view.ts (drawing).
import type { MiniAppContext, Unmount } from "../contract.ts";
import { LIMITS, addLine, blankGame, blankRound, isBlankGame, parseGame, parsePoints, typePoints, type Game, type Question, type Round } from "../core/game.ts";
import { icon } from "../dom/icons.ts";
import { h } from "../dom/h.ts";
import { createTranslator } from "../i18n/translate.ts";
import { SAVE_KEY, saveNow, saveSoon, type Sheet } from "./state.ts";
import { currentRound, labelRow, points, refresh, render, rowElement, showMark, showWorth } from "./view.ts";

/** A question an event is about. */
interface QuestionTarget {
  readonly round: Round;
  readonly row: HTMLElement;
  readonly list: HTMLElement;
  readonly question: Question;
  readonly index: number;
}

function questionOf(sheet: Sheet, element: Element): QuestionTarget | null {
  const row = element.closest<HTMLElement>(".sheet-row");
  const round = currentRound(sheet);
  const list = row?.parentElement;
  if (row === null || round === undefined || !(list instanceof HTMLElement)) return null;
  const index = [...list.children].indexOf(row);
  const question = round.questions[index];
  return question === undefined ? null : { round, row, list, question, index };
}

const answerOf = (row: Element | null | undefined): HTMLInputElement | null => row?.querySelector<HTMLInputElement>(".sheet-answer") ?? null;

/** After a change to the round: every row's number, labels and points follow the model. */
function syncRows(sheet: Sheet, round: Round): void {
  const list = sheet.host.querySelector<HTMLElement>("[data-questions]");
  if (list === null) return;
  [...list.children].forEach((row, index) => {
    const question = round.questions[index];
    if (!(row instanceof HTMLElement) || question === undefined) return;
    labelRow(sheet, row, index);
    showMark(row, question.mark);
    showWorth(sheet, row, round, question);
  });
}

/** Adds a line at the end of the round and puts the caret in it ("+" or Enter on the last line). */
function appendLine(sheet: Sheet, round: Round): void {
  const list = sheet.host.querySelector<HTMLElement>("[data-questions]");
  const line = addLine(round);
  if (list === null || line === null) return;
  const row = rowElement(sheet, round, line, round.questions.length - 1);
  list.append(row);
  answerOf(row)?.focus({ preventScroll: true });
  row.scrollIntoView({ block: "nearest" });
  changed(sheet);
}

function changed(sheet: Sheet): void {
  refresh(sheet);
  saveSoon(sheet);
}

function onInput(sheet: Sheet, field: HTMLInputElement): void {
  const round = currentRound(sheet);
  if (round === undefined) return;
  if (field.matches(".sheet-answer")) {
    const target = questionOf(sheet, field);
    if (target === null) return;
    target.question.text = field.value.slice(0, LIMITS.answer);
  } else if (field.matches("[data-round-name]")) round.name = field.value.trim().slice(0, LIMITS.name);
  else if (field.matches("[data-bonus]")) {
    const value = field.value.trim() === "" ? 0 : parsePoints(field.value);
    if (value !== null) round.bonus = value; // a half-typed "-" keeps the last good value
  } else if (field.matches("[data-round-worth]")) {
    const value = parsePoints(field.value);
    if (value !== null) round.points = value;
  } else if (field.matches("[data-worth]")) {
    // The number at the end of a line is what the line brings: typing one makes the line count.
    const target = questionOf(sheet, field);
    const value = parsePoints(field.value);
    if (target === null || value === null) return;
    typePoints(round, target.question, value);
  } else return;
  syncRows(sheet, round);
  changed(sheet);
}

/** Leaving a points field: what is shown is always what counts. */
function onPointsDone(sheet: Sheet, field: HTMLInputElement): void {
  const round = currentRound(sheet);
  if (round === undefined) return;
  if (field.matches("[data-bonus]")) field.value = round.bonus === 0 ? "" : points(sheet, round.bonus);
  else if (field.matches("[data-round-worth]")) field.value = points(sheet, round.points);
  else syncRows(sheet, round);
}

function onMark(sheet: Sheet, button: HTMLElement): void {
  const target = questionOf(sheet, button);
  const mark = button.dataset["markButton"];
  if (target === null || (mark !== "right" && mark !== "wrong")) return;
  target.question.mark = target.question.mark === mark ? "none" : mark; // a second tap takes the mark back
  showMark(target.row, target.question.mark);
  syncRows(sheet, target.round);
  changed(sheet);
}

function onAnswerKey(sheet: Sheet, field: HTMLInputElement, event: KeyboardEvent): void {
  const target = questionOf(sheet, field);
  if (target === null || event.isComposing) return;
  if (event.key === "Enter") {
    event.preventDefault();
    const next = answerOf(target.row.nextElementSibling);
    if (next === null) {
      appendLine(sheet, target.round); // Enter on the last line = "+"
      return;
    }
    next.focus();
    next.scrollIntoView({ block: "nearest" });
    return;
  }
  // Backspace on an untouched line removes it, like in a text editor; one line always stays.
  const isUntouched = field.value === "" && target.question.mark === "none";
  if (event.key !== "Backspace" || !isUntouched || target.round.questions.length < 2) return;
  event.preventDefault();
  target.round.questions.splice(target.index, 1);
  const neighbour = target.row.previousElementSibling ?? target.row.nextElementSibling;
  target.row.remove();
  syncRows(sheet, target.round);
  answerOf(neighbour)?.focus();
  changed(sheet);
}

/** Puts the focus on the open round's tab (after a redraw took the focused element away). */
function focusTab(sheet: Sheet): void {
  sheet.host.querySelector<HTMLElement>('[data-tab][aria-current="true"]')?.focus({ preventScroll: true });
}

/** Shows another round. */
function openRound(sheet: Sheet, index: number, focusAnswer: boolean): void {
  if (sheet.saveTimer !== undefined) saveNow(sheet);
  sheet.open = Math.max(0, Math.min(index, sheet.game.rounds.length - 1));
  render(sheet);
  if (focusAnswer) answerOf(sheet.host.querySelector(".sheet-row"))?.focus({ preventScroll: true });
  else focusTab(sheet); // the screen was redrawn: focus stays on the round's tab, not on <body>
}

function newRound(sheet: Sheet): void {
  if (sheet.game.rounds.length >= LIMITS.rounds) {
    sheet.context.shell.toast(sheet.t("roundsFull", { max: LIMITS.rounds }));
    return;
  }
  sheet.game.rounds.push(blankRound()); // every round starts at 1 point per right answer
  openRound(sheet, sheet.game.rounds.length - 1, true);
  saveSoon(sheet);
}

/** Replaces the whole game (clear, delete, undo) and shows it. */
function replaceGame(sheet: Sheet, game: Game, open: number): void {
  sheet.game = game;
  sheet.open = Math.max(0, Math.min(open, game.rounds.length - 1));
  render(sheet);
  focusTab(sheet);
  saveNow(sheet);
}

function undoable(sheet: Sheet, message: string, before: Game, openBefore: number): void {
  sheet.context.shell.toast(message, { action: { label: sheet.t("undo"), run: () => { replaceGame(sheet, before, openBefore); } } });
}

function deleteRound(sheet: Sheet): void {
  const before = structuredClone(sheet.game);
  const after = structuredClone(sheet.game);
  const index = sheet.open;
  after.rounds.splice(index, 1);
  if (after.rounds.length === 0) after.rounds.push(blankRound()); // the only round: it starts again empty
  replaceGame(sheet, after, index);
  undoable(sheet, sheet.t("roundDeleted", { n: index + 1 }), before, index);
}

async function clearGame(sheet: Sheet): Promise<void> {
  const isConfirmed = await sheet.context.shell.confirm({ title: sheet.t("clearTitle"), text: sheet.t("clearText"), confirm: sheet.t("clearConfirm"), cancel: sheet.t("cancel"), danger: true });
  if (!isConfirmed || sheet.signal.aborted) return;
  const before = structuredClone(sheet.game);
  const openBefore = sheet.open;
  replaceGame(sheet, blankGame(), 0);
  undoable(sheet, sheet.t("cleared"), before, openBefore);
}

function onClick(sheet: Sheet, element: Element): void {
  const mark = element.closest<HTMLElement>("[data-mark-button]");
  const tab = element.closest<HTMLElement>("[data-tab]");
  if (mark) onMark(sheet, mark);
  else if (tab) openRound(sheet, Number(tab.dataset["tab"]), false);
  else if (element.closest("[data-new-round]")) newRound(sheet);
  else if (element.closest("[data-add-line]")) {
    const round = currentRound(sheet);
    if (round) appendLine(sheet, round);
  }
  else if (element.closest("[data-round-delete]")) deleteRound(sheet);
}

function wire(sheet: Sheet): void {
  const { host, signal } = sheet;
  host.addEventListener("input", (event) => { if (event.target instanceof HTMLInputElement) onInput(sheet, event.target); }, { signal });
  host.addEventListener("click", (event) => { if (event.target instanceof Element) onClick(sheet, event.target); }, { signal });
  host.addEventListener("keydown", (event) => {
    const field = event.target;
    if (!(field instanceof HTMLInputElement)) return;
    if (field.matches(".sheet-answer")) onAnswerKey(sheet, field, event);
    else if (event.key === "Enter") field.blur(); // points, bonus, name: Enter = done
  }, { signal });
  host.addEventListener("focusin", (event) => {
    const field = event.target;
    if (field instanceof HTMLInputElement && field.matches(".sheet-points")) field.select(); // typing replaces the number
  }, { signal });
  host.addEventListener("focusout", (event) => {
    const field = event.target;
    if (field instanceof HTMLInputElement && field.matches(".sheet-points")) onPointsDone(sheet, field);
  }, { signal });
  sheet.clearButton?.addEventListener("click", () => { void clearGame(sheet); }, { signal });
  // The last typing survives closing the tab or switching apps.
  const flush = (): void => { if (sheet.saveTimer !== undefined) saveNow(sheet); };
  window.addEventListener("pagehide", flush, { signal });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); }, { signal });
}

/**
 * Mounts the answer sheet into `element`.
 * @param element - an empty element of the host
 * @param context - the host's services; the sheet is stored under `game` in the mini-app's own area,
 * and "Clear game" goes into the host's header slot
 * @returns the unmount: writes a pending save, removes every listener and empties `element` and the slot
 */
export function mountSheet(element: HTMLElement, context: MiniAppContext): Unmount {
  const controller = new AbortController();
  const lang = context.language.get();
  const game = parseGame(context.storage.prefs.get<unknown>(SAVE_KEY, null));
  const clearButton = h("button", { type: "button", class: "icon-button", "data-sheet-clear": "" });
  clearButton.append(icon("eraser"));
  context.slots.headerActions.append(clearButton);
  const sheet: Sheet = {
    host: element, context, signal: controller.signal, lang, t: createTranslator(lang),
    game, open: game.rounds.length - 1, clearButton, saveTimer: undefined, hasWarned: false,
  };
  render(sheet);
  wire(sheet);
  context.shell.setBusy(!isBlankGame(game));
  const stopLanguage = context.language.subscribe((next) => {
    sheet.lang = next;
    sheet.t = createTranslator(next);
    render(sheet);
  });
  return () => {
    if (controller.signal.aborted) return;
    if (sheet.saveTimer !== undefined) saveNow(sheet);
    controller.abort();
    stopLanguage();
    context.shell.setBusy(false);
    clearButton.remove();
    element.replaceChildren();
  };
}
