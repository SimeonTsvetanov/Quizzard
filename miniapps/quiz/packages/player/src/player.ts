// The host's player: holds the game, makes its moves with the reducer, saves it after every move,
// draws it — as the stage with its control bar, or, once an audience window is open, as the host
// panel while the stage is sent to that window through a channel. The same code runs inside the
// creator ("Play") and in the exported page.
import type { QuizFile } from "@simeonts/quizzard-quiz-core/play";
import { type Channel, type Transport, createChannel, forAudience } from "./channel.ts";
import { createEnv } from "./env.ts";
import { createGame } from "./game/create.ts";
import { restore, toSaved } from "./game/save.ts";
import type { GameAction, GameState } from "./game/state.ts";
import { step } from "./game/step.ts";
import { type Translate, createTranslator, playerLang } from "./i18n/translate.ts";
import { h } from "./render/h.ts";
import { type Bar, createBar } from "./ui/bar.ts";
import { type Commands, listenKeys, toggleFullscreen } from "./ui/commands.ts";
import { type Overlay, openDialog } from "./ui/dialog.ts";
import { guarded } from "./ui/guards.ts";
import { menuContent } from "./ui/menu.ts";
import { type Panel, createPanel } from "./ui/panel.ts";
import { createScoreboard } from "./ui/scoreboard.ts";
import { type Stage, createStage } from "./ui/stage.ts";
import { playTimeUp, ranOut } from "./ui/sound.ts";
import { type UndoStrip, createUndoStrip } from "./ui/undo.ts";
import { keepAwake } from "./ui/wake.ts";
import type { PlayEnv } from "./views/context.ts";

/** Where the game is kept between sessions; both calls may fail silently (a page opened from a file may have no storage). */
export interface GameStorage {
  load(): unknown;
  save(value: unknown): void;
}

/** An open audience window, as the player sees it. */
export interface AudienceLink {
  readonly transport: Transport;
  isClosed(): boolean;
  close(): void;
}

/** Inputs of {@link createPlayer}. */
export interface PlayerOptions {
  /** An empty element; the player fills it and takes it full screen on F. */
  readonly root: HTMLElement;
  readonly file: QuizFile;
  readonly storage?: GameStorage;
  /** Gives the address of a media file of the quiz, or `null`. */
  readonly mediaUrl?: (id: string) => string | null;
  /** Opens the audience window; `null` when the browser refused. Left out = no presenter mode here. */
  readonly openAudience?: () => AudienceLink | null;
  /** Leaves the player (in the app: back to the quiz). */
  readonly onExit?: () => void;
  /** The id of the round or question the game jumps to as it opens ("Play from here"); left out = where the game is. */
  readonly startAt?: string;
  /** Shows a short message to the host (the app's toast); the exported page uses its own line. */
  readonly notify?: (message: string) => void;
}

/** A running player. */
export interface Player {
  getState(): GameState;
  dispatch(action: GameAction): void;
  /** Saves the game, closes the audience window and removes every listener and timer. */
  destroy(): void;
}

/** How often the clock ticks while a timer runs. */
const TICK_MS = 200;
/** A running timer is saved this often, so a reload loses at most this much of it. */
const SAVE_EVERY_MS = 1000;

/** An open audience window with its channel and the panel that replaced the stage. */
interface Presenter {
  readonly link: AudienceLink;
  readonly channel: Channel;
  readonly panel: Panel;
}

/** One running player: its fixed parts and what changes while it runs. */
interface Session {
  readonly options: PlayerOptions;
  readonly t: Translate;
  readonly env: PlayEnv;
  readonly stage: Stage;
  readonly bar: Bar;
  readonly commands: Commands;
  readonly undo: UndoStrip;
  state: GameState;
  overlay: Overlay | null;
  presenter: Presenter | null;
  /** When the game was last written to storage (`performance.now()`). */
  lastSave: number;
}

function readSaved(storage: GameStorage | undefined): unknown {
  try {
    return storage?.load() ?? null;
  } catch {
    return null;
  }
}

function save(session: Session): void {
  session.lastSave = performance.now();
  try {
    session.options.storage?.save(toSaved(session.state));
  } catch {
    // No storage here (a page opened from a file, private browsing): the game still plays.
  }
}

function draw(session: Session): void {
  const { options, presenter, state } = session;
  options.root.setAttribute("data-mode", presenter ? "panel" : "stage");
  if (presenter) presenter.panel.update(state); else session.stage.show(state);
  session.bar.update(state, presenter !== null);
  session.overlay?.sync?.(state);
}

/** Makes a move: the reducer, then storage, the audience window and the screen. */
function move(session: Session, action: GameAction): void {
  const before = session.state;
  const next = step(before, action);
  if (next === before) return;
  if (next.sound === true && ranOut(before, next)) playTimeUp();
  const isMove = action.type !== "tick" || next.index !== session.state.index;
  session.state = next;
  if (isMove || performance.now() - session.lastSave >= SAVE_EVERY_MS) save(session);
  session.presenter?.channel.send({ kind: "state", state: next });
  draw(session);
}

/** Puts a whole game back (Undo of "Start the game again"): storage, the audience window and the screen follow. */
function replace(session: Session, state: GameState): void {
  session.state = state;
  save(session);
  session.presenter?.channel.send({ kind: "state", state });
  draw(session);
}

/** Whether time matters to the game right now: a running timer or cue, a playing clip, a break counting down. */
function needsTicks(state: GameState): boolean {
  if (state.curtain !== null) return state.curtain.kind === "break" && state.curtain.leftMs > 0;
  return state.timer.status === "running" || state.timer.status === "cue" || state.media.status === "playing";
}

/** What a dialog shows and how it follows the game. */
interface DialogContent {
  readonly content: readonly HTMLElement[];
  readonly sync?: (state: GameState) => void;
}

/** Opens a dialog — or, when that same dialog is open, closes it (its key pressed again). */
function toggleDialog(session: Session, name: string, title: string, build: (close: () => void) => DialogContent): void {
  const isSame = session.overlay?.name === name;
  session.overlay?.close();
  if (isSame) return;
  const built = build(() => session.overlay?.close());
  session.overlay = openDialog({ root: session.options.root, name, title, t: session.t, ...built, onClose: () => { session.overlay = null; } });
}

/** Moves the control bar to another place of the player; the button that had the focus keeps it (a moved element loses it). */
function moveBar(session: Session, parent: HTMLElement, before: HTMLElement | null): void {
  const focused = document.activeElement;
  parent.insertBefore(session.bar.element, before);
  if (focused instanceof HTMLElement && session.bar.element.contains(focused)) focused.focus();
}

function stopPresenting(session: Session): void {
  const { presenter } = session;
  if (!presenter) return;
  session.presenter = null;
  presenter.channel.close();
  presenter.link.close();
  presenter.panel.destroy();
  // The one control bar goes back under the stage.
  moveBar(session, session.options.root, session.undo.element);
  presenter.panel.element.remove();
  // The clip was playing in the window that is gone: it rests until the host plays it here.
  move(session, { type: "media", command: "pause" });
  draw(session);
}

function startPresenting(session: Session): void {
  const { options, env, commands } = session;
  const link = options.openAudience?.() ?? null;
  if (link === null) {
    options.notify?.(session.t("menu.popupBlocked"));
    return;
  }
  // From here on the audience's window is the one that plays: a clip playing in this window stops.
  move(session, { type: "media", command: "pause" });
  const channel = createChannel(link.transport);
  const panel = createPanel(env, commands);
  const file = forAudience(options.file);
  channel.on((message) => {
    if (message.kind === "hello") channel.send({ kind: "init", file, state: session.state });
    if (message.kind === "action") move(session, message.action);
    if (message.kind === "bye") stopPresenting(session);
  });
  options.root.append(panel.element);
  moveBar(session, panel.element, null); // the same bar, now under the host panel
  session.presenter = { link, channel, panel };
  draw(session);
}

/** The game moved to the first screen of a question or a round; unchanged when the id names neither. */
function startAt(state: GameState, id: string | undefined): GameState {
  if (id === undefined) return state;
  const byQuestion = state.screens.findIndex((screen) => screen.questionId === id);
  const index = byQuestion === -1 ? state.screens.findIndex((screen) => screen.roundId === id) : byQuestion;
  return index === -1 ? state : step(state, { type: "jump", index });
}

/** Builds a session: the game (a saved one continued), the stage, the bar and the commands they share. */
function createSession(options: PlayerOptions): Session {
  const { root, file } = options;
  const t = createTranslator(playerLang(file.quiz.language));
  const undo = createUndoStrip(t("undo.action"));
  const commands: Commands = {
    // Moves that lose something ask first or offer Undo (ui/guards.ts); the audience's own reports go straight to `move`.
    dispatch: (action) => { dispatch(action); },
    openMenu: () => {
      toggleDialog(session, "menu", t("menu.title"), (close) => ({ content: menuContent({ env, state: session.state, commands, isPresenting: session.presenter !== null, close }) }));
    },
    openScores: () => {
      toggleDialog(session, "scores", t("scores.title"), () => {
        const board = createScoreboard(env, session.state);
        return { content: [board.element], sync: board.sync };
      });
    },
    toggleFullscreen: () => { toggleFullscreen(root); },
    toggleAudience: () => { if (session.presenter) stopPresenting(session); else startPresenting(session); },
    exit: options.onExit ?? null,
  };
  const env = createEnv({ file, dispatch: commands.dispatch, mediaUrl: options.mediaUrl });
  const fresh = createGame(file, { teamName: (n) => t("teamName", { n }) });
  const dispatch = guarded({ root, env, undo, getState: () => session.state, move: (action) => { move(session, action); }, replace: (state) => { replace(session, state); } });
  const session: Session = {
    options, t, env, commands, undo,
    stage: createStage(env, { canEdit: true, isLive: true }),
    bar: createBar(t, commands),
    state: startAt(restore(fresh, readSaved(options.storage)), options.startAt),
    overlay: null,
    presenter: null,
    lastSave: performance.now(),
  };
  return session;
}

/**
 * Starts the host's player in an element.
 * @param options - the element, the quiz and the page's services
 */
export function createPlayer(options: PlayerOptions): Player {
  const { root } = options;
  const session = createSession(options);
  const controller = new AbortController();
  let lastTick = performance.now();
  root.classList.add("qp-player");
  root.setAttribute("data-role", "host");
  root.lang = session.env.lang;
  root.toggleAttribute("data-no-audience", !options.openAudience);
  root.replaceChildren(h("div", { class: "qp-stage-box" }, session.stage.element), session.bar.element, session.undo.element);
  listenKeys(session.commands, controller.signal);
  keepAwake(controller.signal); // the screen does not dim or lock in the middle of a game
  const ticker = window.setInterval(() => {
    const now = performance.now();
    const ms = now - lastTick;
    lastTick = now;
    if (session.presenter?.link.isClosed() === true) stopPresenting(session);
    if (needsTicks(session.state)) move(session, { type: "tick", ms });
  }, TICK_MS);
  window.addEventListener("pagehide", () => {
    save(session);
    session.presenter?.channel.send({ kind: "bye" });
  }, { signal: controller.signal });
  draw(session);
  return {
    getState: () => session.state,
    dispatch: session.commands.dispatch,
    destroy() {
      if (controller.signal.aborted) return;
      save(session);
      controller.abort();
      window.clearInterval(ticker);
      session.overlay?.close();
      session.undo.clear();
      stopPresenting(session);
      session.stage.destroy();
      if (document.fullscreenElement === root) void document.exitFullscreen().catch(() => undefined);
      root.replaceChildren();
      root.classList.remove("qp-player");
      for (const name of ["data-role", "data-mode", "data-no-audience"]) root.removeAttribute(name);
    },
  };
}
