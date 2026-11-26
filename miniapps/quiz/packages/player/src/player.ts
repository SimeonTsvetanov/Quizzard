// The host's player: holds the game, makes its moves with the reducer, saves it after every move,
// draws it — as the stage with its control bar, or, once an audience window is open, as the host
// panel while the stage is sent to that window through a channel. The same code runs inside the
// creator ("Play") and in the exported page.
import { type Channel, createChannel, forAudience } from "./channel.ts";
import { createEnv } from "./env.ts";
import { createGame } from "./game/create.ts";
import { restore, toSaved } from "./game/save.ts";
import type { GameAction, GameState } from "./game/state.ts";
import { needsTicks, step } from "./game/step.ts";
import { type Translate, createTranslator, playerLang } from "./i18n/translate.ts";
import { h } from "./render/h.ts";
import { type Bar, createBar } from "./ui/bar.ts";
import { type Commands, listenKeys, shaped, toggleFullscreen } from "./ui/commands.ts";
import { type Overlay, openDialog } from "./ui/dialog.ts";
import { guarded } from "./ui/guards.ts";
import { menuContent } from "./ui/menu.ts";
import { type Panel, createPanel } from "./ui/panel.ts";
import { createScoreboard } from "./ui/scoreboard.ts";
import { type Stage, createStage, showsAllParts } from "./ui/stage.ts";
import { type Music, createMusic } from "./ui/music.ts";
import { playTimeUp, ranOut } from "./ui/sound.ts";
import { offerRestart } from "./ui/resume.ts";
import { type UndoStrip, createUndoStrip } from "./ui/undo.ts";
import { keepAwake } from "./ui/wake.ts";
import type { PlayEnv } from "./views/context.ts";
import type { AudienceLink, GameStorage, InnerOptions, InnerPlayer } from "./player-types.ts";

export type * from "./player-types.ts";

/** How often the clock ticks while a timer runs. */
const TICK_MS = 200;
/** A running timer is saved this often, so a reload loses at most this much of it. */
const SAVE_EVERY_MS = 1000;

/** An open audience window with its channel and the panel that replaced the stage. */
interface Presenter {
  readonly link: AudienceLink;
  readonly channel: Channel;
  readonly panel: Panel;
  /** Stops listening to the audience's window. */
  readonly off: () => void;
}

/** One running player: its fixed parts and what changes while it runs. */
interface Session {
  readonly options: InnerOptions;
  readonly t: Translate;
  readonly env: PlayEnv;
  readonly stage: Stage;
  readonly bar: Bar;
  readonly commands: Commands;
  readonly undo: UndoStrip;
  readonly music: Music;
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
  session.music.update(state);
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
  if (next.lang !== before.lang && next.lang !== undefined) session.options.onLang?.(next.lang);
}

/** Puts a whole game back (Undo of "Start the game again"): storage, the audience window and the screen follow. */
function replace(session: Session, state: GameState): void {
  session.state = state;
  save(session);
  session.presenter?.channel.send({ kind: "state", state });
  draw(session);
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
  draw(session); // the layout of the mode the bar is now part of: a button in a hidden bar cannot take the focus
  if (focused instanceof HTMLElement && session.bar.element.contains(focused)) focused.focus();
}

function stopPresenting(session: Session): void {
  const { presenter } = session;
  if (!presenter) return;
  session.presenter = null;
  presenter.off();
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
  const { options } = session;
  const link = options.openAudience?.() ?? null;
  if (link === null) {
    options.notify?.(session.t("menu.popupBlocked"));
    return;
  }
  // From here on the audience's window is the one that plays: a clip playing in this window stops.
  move(session, { type: "media", command: "pause" });
  attach(session, link, createChannel(link.transport));
}

/** Makes an open audience window this player's: the host panel takes the stage's place and the window gets the game. */
function attach(session: Session, link: AudienceLink, channel: Channel): void {
  const { options, env, commands } = session;
  const panel = createPanel(env, commands);
  const file = forAudience(options.file);
  const off = channel.on((message) => {
    if (message.kind === "hello") channel.send({ kind: "init", file, state: session.state });
    if (message.kind === "action") move(session, message.action);
    if (message.kind === "bye") stopPresenting(session);
  });
  options.root.append(panel.element);
  session.presenter = { link, channel, panel, off };
  moveBar(session, panel.element, null); // the same bar, now under the host panel
  // A window handed on from the player before (a language change) is told the quiz again, in the new language.
  if (options.resume) channel.send({ kind: "init", file, state: session.state });
}

/** The game moved to the first screen of a question or a round; unchanged when the id names neither. */
function startAt(state: GameState, id: string | undefined): GameState {
  if (id === undefined) return state;
  const byQuestion = state.screens.findIndex((screen) => screen.questionId === id);
  const index = byQuestion === -1 ? state.screens.findIndex((screen) => screen.roundId === id) : byQuestion;
  return index === -1 ? state : step(state, { type: "jump", index });
}

/** Builds a session: the game (a saved one continued), the stage, the bar and the commands they share. */
function createSession(options: InnerOptions): Session {
  const { root, file } = options;
  const t = createTranslator(playerLang(file.quiz.language));
  const undo = createUndoStrip(t("undo.action"));
  const commands: Commands = {
    // Moves that lose something ask first or offer Undo (ui/guards.ts); the audience's own reports go straight to `move`.
    // The host panel shows every part of a screen at once, like a wide stage.
    dispatch: (action) => { dispatch(shaped(action, session.presenter !== null || showsAllParts(session.stage.element))); },
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
  const env = createEnv({ file, dispatch: commands.dispatch, mediaUrl: options.mediaUrl, homeUrl: options.homeUrl });
  const fresh = createGame(file, { teamName: (n) => t("teamName", { n }) });
  const dispatch = guarded({ root, env, undo, getState: () => session.state, move: (action) => { move(session, action); }, replace: (state) => { replace(session, state); } });
  const session: Session = {
    options, t, env, commands, undo,
    stage: createStage(env, { canEdit: true, isLive: true }),
    bar: createBar(t, commands),
    music: createMusic(options.mediaUrl),
    // A player that takes another's place goes on with its game as it is — never through storage, which
    // keeps neither a running timer nor a break and may not be there at all (an exported page).
    state: options.resume?.state ?? startAt(restore(fresh, readSaved(options.storage)), options.startAt),
    overlay: null,
    presenter: null,
    lastSave: performance.now(),
  };
  return session;
}

/** Marks the root as the host's player and puts the stage, the bar and the undo strip in it. */
function fill(session: Session): void {
  const { root } = session.options;
  root.classList.add("qp-player");
  root.setAttribute("data-role", "host");
  root.lang = session.env.lang;
  root.toggleAttribute("data-no-audience", !session.options.openAudience);
  root.replaceChildren(h("div", { class: "qp-stage-box" }, session.stage.element), session.bar.element, session.undo.element);
}

/**
 * Starts the host's player in an element.
 * @param options - the element, the quiz and the page's services
 */
export function startPlayer(options: InnerOptions): InnerPlayer {
  const { root } = options;
  const session = createSession(options);
  const controller = new AbortController();
  let lastTick = performance.now();
  fill(session);
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
  if (options.resume?.presenter) attach(session, options.resume.presenter.link, options.resume.presenter.channel);
  if (options.resume) session.bar.element.querySelector<HTMLElement>('[data-control="menu"]')?.focus(); // the menu the language was picked in is gone
  else offerRestart({ state: session.state, saved: readSaved(options.storage), undo: session.undo, t: session.t, dispatch: session.commands.dispatch });
  /** Stops everything the player runs; what is on the page is left to the caller. */
  const halt = (): void => {
    save(session);
    controller.abort();
    window.clearInterval(ticker);
    session.overlay?.close();
    session.undo.clear();
    session.music.destroy();
  };
  return {
    getState: () => session.state,
    dispatch: session.commands.dispatch,
    isPresenting: () => session.presenter !== null,
    present: () => { if (!session.presenter) startPresenting(session); },
    handOver() {
      halt();
      const { presenter } = session;
      session.presenter = null;
      presenter?.off();
      presenter?.panel.destroy();
      session.stage.destroy();
      root.replaceChildren(); // full screen and the root's own marks stay: the next player is about to fill it
      return { state: session.state, presenter: presenter ? { link: presenter.link, channel: presenter.channel } : null };
    },
    destroy() {
      if (controller.signal.aborted) return;
      halt();
      stopPresenting(session);
      session.stage.destroy();
      if (document.fullscreenElement === root) void document.exitFullscreen().catch(() => undefined);
      root.replaceChildren();
      root.classList.remove("qp-player");
      for (const name of ["data-role", "data-mode", "data-no-audience"]) root.removeAttribute(name);
    },
  };
}
