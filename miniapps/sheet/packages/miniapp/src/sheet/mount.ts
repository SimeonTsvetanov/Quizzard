// Mounts the answer sheet and handles what people do on it: writing answers, marking them, changing
// points and bonus, opening rounds, "New round", "Delete round" and "Clear game". Level 1: one
// delegated listener per event type; typing never rebuilds the screen, so the caret and the keyboard
// stay where they are. Parts: state.ts (model + saving), view.ts (drawing).
import type { MiniAppContext, Unmount } from "../contract.ts";
import { LIMITS, blankGame, blankRound, isBlankGame, keepBlankLine, parseGame, parsePoints, type Game, type Question, type Round } from "../core/game.ts";
import { createTranslator } from "../i18n/translate.ts";
import { SAVE_KEY, saveNow, saveSoon, type Sheet } from "./state.ts";
import { labelRow, points, refresh, render, rowElement, showMark } from "./view.ts";

interface RowTarget {
  readonly section: HTMLElement;
  readonly round: Round;
  readonly roundIndex: number;
}

interface QuestionTarget extends RowTarget {
  readonly row: HTMLElement;
  readonly list: HTMLElement;
  readonly question: Question;
  readonly index: number;
}

function roundOf(sheet: Sheet, element: Element): RowTarget | null {
  const section = element.closest<HTMLElement>("[data-round]");
  if (section === null) return null;
  const roundIndex = Number(section.dataset["round"]);
  const round = sheet.game.rounds[roundIndex];
  return round === undefined ? null : { section, round, roundIndex };
}

function questionOf(sheet: Sheet, element: Element): QuestionTarget | null {
  const row = element.closest<HTMLElement>(".sheet-row");
  const target = roundOf(sheet, element);
  const list = row?.parentElement;
  if (row === null || target === null || !(list instanceof HTMLElement)) return null;
  const index = [...list.children].indexOf(row);
  const question = target.round.questions[index];
  return question === undefined ? null : { ...target, row, list, question, index };
}

const answerOf = (row: Element | null | undefined): HTMLInputElement | null => row?.querySelector<HTMLInputElement>(".sheet-answer") ?? null;

/** After a change to a round's questions: one blank line at the end, rows and numbers in step. */
function syncRows(sheet: Sheet, target: RowTarget, list: HTMLElement): void {
  keepBlankLine(target.round);
  const { questions } = target.round;
  while (list.children.length > questions.length) list.lastElementChild?.remove();
  for (let index = list.children.length; index < questions.length; index += 1) {
    const question = questions[index];
    if (question) list.append(rowElement(sheet, question, index));
  }
  [...list.children].forEach((row, index) => { if (row instanceof HTMLElement) labelRow(sheet, row, index); });
}

function changed(sheet: Sheet): void {
  refresh(sheet);
  saveSoon(sheet);
}

function onInput(sheet: Sheet, field: HTMLInputElement): void {
  if (field.matches(".sheet-answer")) {
    const target = questionOf(sheet, field);
    if (target === null) return;
    target.question.text = field.value.slice(0, LIMITS.answer);
    syncRows(sheet, target, target.list);
  } else if (field.matches("[data-round-name]")) {
    const target = roundOf(sheet, field);
    if (target === null) return;
    target.round.name = field.value.trim().slice(0, LIMITS.name);
  } else if (field.matches("[data-bonus]")) {
    const target = roundOf(sheet, field);
    if (target === null) return;
    const value = field.value.trim() === "" ? 0 : parsePoints(field.value);
    if (value !== null) target.round.bonus = value; // a half-typed "-" keeps the last good value
  } else if (field.matches(".sheet-points")) {
    const target = questionOf(sheet, field);
    const value = parsePoints(field.value);
    if (target === null || value === null) return;
    target.question.points = value;
    syncRows(sheet, target, target.list);
  } else return;
  changed(sheet);
}

/** Leaving a points field: what is shown is always what counts. */
function onPointsDone(sheet: Sheet, field: HTMLInputElement): void {
  if (field.matches("[data-bonus]")) {
    const target = roundOf(sheet, field);
    if (target) field.value = target.round.bonus === 0 ? "" : points(sheet, target.round.bonus);
    return;
  }
  const target = questionOf(sheet, field);
  if (target) field.value = points(sheet, target.question.points);
}

function onMark(sheet: Sheet, button: HTMLElement): void {
  const target = questionOf(sheet, button);
  const mark = button.dataset["markButton"];
  if (target === null || (mark !== "right" && mark !== "wrong")) return;
  target.question.mark = target.question.mark === mark ? "none" : mark; // a second tap takes the mark back
  showMark(target.row, target.question.mark);
  syncRows(sheet, target, target.list);
  changed(sheet);
}

function onAnswerKey(sheet: Sheet, field: HTMLInputElement, event: KeyboardEvent): void {
  const target = questionOf(sheet, field);
  if (target === null || event.isComposing) return;
  if (event.key === "Enter") {
    event.preventDefault();
    answerOf(target.row.nextElementSibling)?.focus();
    return;
  }
  const isLast = target.index === target.round.questions.length - 1;
  if (event.key !== "Backspace" || field.value !== "" || isLast || target.question.mark !== "none") return;
  // Backspace on an empty line removes the line, like in a text editor.
  event.preventDefault();
  target.round.questions.splice(target.index, 1);
  const neighbour = target.row.previousElementSibling ?? target.row.nextElementSibling;
  target.row.remove();
  syncRows(sheet, target, target.list);
  answerOf(neighbour)?.focus();
  changed(sheet);
}

function openRound(sheet: Sheet, index: number, focusAnswer: boolean): void {
  sheet.open = index;
  refresh(sheet);
  if (!focusAnswer) return;
  const section = sheet.host.querySelector<HTMLElement>(`[data-round="${String(index)}"]`);
  const rows = section?.querySelectorAll(".sheet-row");
  answerOf(rows?.[rows.length - 1])?.focus({ preventScroll: true });
  section?.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

function newRound(sheet: Sheet): void {
  if (sheet.game.rounds.length >= LIMITS.rounds) {
    sheet.context.shell.toast(sheet.t("roundsFull", { max: LIMITS.rounds }));
    return;
  }
  sheet.game.rounds.push(blankRound());
  render(sheet);
  openRound(sheet, sheet.game.rounds.length - 1, true);
  saveSoon(sheet);
}

/** Replaces the whole game (clear, delete, undo) and shows it. */
function replaceGame(sheet: Sheet, game: Game, open: number): void {
  sheet.game = game;
  sheet.open = Math.min(open, game.rounds.length - 1);
  render(sheet);
  saveNow(sheet);
}

function undoable(sheet: Sheet, message: string, before: Game, openBefore: number): void {
  sheet.context.shell.toast(message, { action: { label: sheet.t("undo"), run: () => { replaceGame(sheet, before, openBefore); } } });
}

function deleteRound(sheet: Sheet, button: Element): void {
  const target = roundOf(sheet, button);
  if (target === null || sheet.game.rounds.length < 2) return;
  const before = structuredClone(sheet.game);
  const after = structuredClone(sheet.game);
  after.rounds.splice(target.roundIndex, 1);
  const openBefore = sheet.open;
  replaceGame(sheet, after, target.roundIndex);
  undoable(sheet, sheet.t("roundDeleted", { n: target.roundIndex + 1 }), before, openBefore);
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
  const toggle = element.closest("[data-round-toggle]");
  const remove = element.closest("[data-round-delete]");
  if (mark) onMark(sheet, mark);
  else if (toggle) {
    const target = roundOf(sheet, toggle);
    if (target) openRound(sheet, sheet.open === target.roundIndex ? -1 : target.roundIndex, false);
  } else if (element.closest("[data-new-round]")) newRound(sheet);
  else if (remove) deleteRound(sheet, remove);
  else if (element.closest("[data-clear]")) void clearGame(sheet);
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
  // The last typing survives closing the tab or switching apps.
  const flush = (): void => { if (sheet.saveTimer !== undefined) saveNow(sheet); };
  window.addEventListener("pagehide", flush, { signal });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); }, { signal });
}

/**
 * Mounts the answer sheet into `element`.
 * @param element - an empty element of the host
 * @param context - the host's services; the sheet is stored under `game` in the mini-app's own area
 * @returns the unmount: writes a pending save, removes every listener and empties `element`
 */
export function mountSheet(element: HTMLElement, context: MiniAppContext): Unmount {
  const controller = new AbortController();
  const lang = context.language.get();
  const game = parseGame(context.storage.prefs.get<unknown>(SAVE_KEY, null));
  const sheet: Sheet = {
    host: element, context, signal: controller.signal, lang, t: createTranslator(lang),
    game, open: game.rounds.length - 1, saveTimer: undefined, hasWarned: false,
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
    element.replaceChildren();
  };
}

