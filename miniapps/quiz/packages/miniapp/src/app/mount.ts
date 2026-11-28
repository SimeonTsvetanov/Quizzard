// Mounts the quiz creator: builds the state of one mount, shows the screen the history entry names,
// follows Back/Forward, saves a moment after every change (and at once when the page goes away) and
// shows the "Saved" tick in the host's header. Screens are looked up by the route, never switched on.
import { type Quiz, defaultEnv, findQuestion, findRound } from "@simeonts/quizzard-quiz-core";
import type { MiniAppContext, Unmount } from "../contract.ts";
import { createTranslator, loadLanguage } from "../i18n/translate.ts";
import { createMediaUrls } from "../media/urls.ts";
import { meta } from "../meta.ts";
import type * as Deck from "../screens/deck.ts";
import { libraryScreen } from "../screens/library.ts";
import { loadLibrary } from "./library-load.ts";
import { keepUnsaved, restoreUnsaved } from "../storage/rescue.ts";
import { createSaver } from "../storage/saver.ts";
import { createQuizStore } from "../storage/store.ts";
import { createUiRegistries } from "../ui-registry.ts";
import { openQuiz } from "./open-quiz.ts";
import { AUDIENCE_PARAM, LIBRARY, SHARED_PARAM, createNavigator, type Route } from "./routes.ts";
import { takeShared } from "../screens/ai-door.ts";
import { createSavedTick } from "./saved-tick.ts";
import type { App } from "./state.ts";

let deckModule: Promise<typeof Deck> | null = null;

/**
 * Loads the screens of a quiz (screens/deck.ts) once and gives them to the mounted creator. The
 * library asks for them as soon as it is drawn, so opening a quiz rarely waits.
 * @returns `false` when they could not be loaded (offline before the app was ever cached)
 */
async function loadDeck(app: App): Promise<boolean> {
  if (app.screens !== null) return true;
  deckModule ??= import("../screens/deck.ts");
  try {
    const deck = await deckModule;
    app.ui = deck.UI;
    app.screens = deck.SCREENS;
    return true;
  } catch {
    deckModule = null; // the next try asks the network again
    return false;
  }
}

/**
 * The route a quiz can really show: a round or question that is gone (deleted, then Forward) leads to the quiz.
 * @param route - the route asked for
 * @param quiz - the quiz it names
 */
export function settle(route: Route, quiz: Quiz): Route {
  if (route.screen === "round" && !findRound(quiz, route.round)) return { screen: "quiz", quiz: quiz.id };
  if ((route.screen === "editor" || route.screen === "preview") && !findQuestion(quiz, route.question)) return { screen: "quiz", quiz: quiz.id };
  return route;
}

/**
 * Where the focus returns after a move back up: the card that opened the screen just left
 * (PLAN §1.3: "focus returns to the card after the editor closes"); `null` = the screen's title.
 * @param from - the screen left
 * @param to - the screen shown now
 */
export function returnFocus(from: Route, to: Route): string | null {
  if (to.screen === "library" && from.screen !== "library") return `[data-focus="quiz:${from.quiz}"]`;
  if ((to.screen === "round" || to.screen === "quiz") && (from.screen === "editor" || from.screen === "preview")) return `[data-focus="question:${from.question}"]`;
  if (to.screen === "quiz" && from.screen === "round") return `[data-focus="round:${from.round}"]`;
  if (from.screen === "play" && to.screen !== "library") return '[data-focus="play"]';
  return null;
}

/**
 * Puts the focus on the title of the screen on show — the first one a person can see: on a phone the
 * quiz's own title is hidden while one of its rounds is open, and a hidden element cannot take the focus.
 */
function focusTitle(app: App): void {
  const titles = [...app.host.querySelectorAll<HTMLElement>("[data-screen-title]")];
  (titles.find((title) => title.getClientRects().length > 0) ?? titles[0])?.focus();
}

/** Stops what the screen on show started, before another one replaces it. */
function leave(app: App): void {
  const { cleanup } = app.view;
  app.view.cleanup = null;
  cleanup?.();
}

function draw(app: App, focus?: string): void {
  leave(app);
  const quiz = app.current?.quiz;
  const screen = app.route.screen === "library" || !quiz || !app.screens ? libraryScreen(app) : app.screens[app.route.screen](app, quiz);
  screen.toggleAttribute("data-entering", app.view.isEntering);
  app.view.isEntering = false;
  app.host.replaceChildren(screen);
  if (focus === undefined) return;
  const target = app.host.querySelector<HTMLElement>(focus);
  target?.focus();
  if (app.view.selectNext && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) target.select();
  app.view.selectNext = false;
}

/** One mount's "which show is the newest": a slow load for a screen already left is dropped. */
interface Shows {
  count: number;
}

/** Shows a route: loads what it needs, draws it and puts the focus where a person expects it. */
async function show(app: App, shows: Shows, route: Route, focus: string | null | undefined): Promise<void> {
  shows.count += 1;
  const mine = shows.count;
  const isStale = (): boolean => app.signal.aborted || mine !== shows.count;
  let target = route;
  if (route.screen !== "library") {
    const [isOpen, isLoaded] = await Promise.all([openQuiz(app, route.quiz), loadDeck(app)]);
    if (isStale()) return;
    if (!isOpen || !isLoaded) {
      app.context.shell.toast(app.t(isOpen ? "quiz.notLoaded" : "quiz.gone"), isOpen ? { tone: "error" } : {});
      app.nav.replace(LIBRARY);
      target = LIBRARY;
    } else if (app.current) {
      target = settle(route, app.current.quiz);
      if (target !== route) app.nav.replace(target);
    }
  }
  app.route = target;
  app.view.isEntering = true;
  app.context.shell.setTitle(target.screen === "library" || !app.current || app.current.quiz.name.trim() === "" ? null : app.current.quiz.name);
  const wanted = focus === undefined ? undefined : (focus ?? "[data-screen-title]");
  if (target.screen !== "library") {
    draw(app, wanted);
    if (wanted !== undefined && !app.host.contains(document.activeElement)) focusTitle(app);
    return;
  }
  await app.saver.flush(); // the list must show the last change
  if (isStale()) return;
  app.current = null;
  app.media.release();
  await loadLibrary(app, wanted);
  void loadDeck(app); // while the library is read: a quiz then opens without a wait
  if (wanted !== undefined && !isStale() && !app.host.contains(document.activeElement)) focusTitle(app);
}

/** Builds the state of one mount; its moves are filled in by {@link mountQuiz}. */
function createApp(element: HTMLElement, context: MiniAppContext, signal: AbortSignal, shows: Shows): App {
  const lang = context.language.get();
  const store = createQuizStore();
  const tick = createSavedTick(context.slots.headerActions, createTranslator(lang));
  let hasToldShell = false;
  const saver = createSaver({
    store,
    onState: (state) => {
      tick.show(state);
      if (state === "saved") keepUnsaved(context.storage.prefs, null);
      if (state === "error") context.shell.toast(app.t("notSaved"), { tone: "error" });
      if (state !== "saved" || hasToldShell) return;
      hasToldShell = true;
      context.storage.notifySaved(); // the shell asks the browser once to keep this site's data
    },
  });
  const app: App = {
    host: element, context, signal, store, saver, media: createMediaUrls(), env: defaultEnv, ui: createUiRegistries(), screens: null, lang, t: createTranslator(lang),
    nav: createNavigator({ hash: `#/${meta.id}`, signal, onTraverse: (route) => { void show(app, shows, route, returnFocus(app.route, route)); } }),
    view: { lastRound: null, isSettingsOpen: false, showsQuestions: false, isNaming: false, query: "", renaming: null, isLiveOpen: false, isRevealed: false, drafts: new Map(), isEntering: false, cleanup: null, exported: null, swept: new Set(), isMoreOpen: false, stickyFor: null, selectNext: false, hasAskedToKeep: false },
    route: LIBRARY, library: null, current: null,
    draw: (focus) => { draw(app, focus); },
    go(route, mode = "push", focus = null) {
      if (mode === "push") app.nav.push(route); else app.nav.replace(route);
      window.scrollTo({ top: 0 });
      void show(app, shows, route, focus);
    },
    change(next, media) {
      if (app.current === null || (next === app.current.quiz && media === undefined)) return false;
      app.current = { quiz: next, media: media ?? app.current.media };
      saver.soon(next, app.current.media);
      return true;
    },
  };
  context.language.subscribe((next) => {
    void loadLanguage(next).then(() => {
      if (signal.aborted || context.language.get() !== next) return;
      app.lang = next;
      app.t = createTranslator(next);
      tick.translate(app.t);
      // The player speaks the quiz's own language: a game in progress is not restarted for the app's.
      if (app.route.screen !== "play") draw(app);
    });
  });
  signal.addEventListener("abort", () => {
    leave(app);
    tick.remove();
    app.media.release();
  });
  return app;
}

/**
 * Mounts the quiz creator into `element`.
 * @param element - an empty element of the host
 * @param context - the host's services; quizzes live in the mini-app's own IndexedDB database
 * @returns the unmount: writes a pending save, closes the database, removes every listener and empties `element`
 */
export function mountQuiz(element: HTMLElement, context: MiniAppContext): Unmount | Promise<Unmount> {
  // Opened by a playing quiz as its audience window: the stage alone (play/audience.ts).
  if (context.query.has(AUDIENCE_PARAM) && window.opener !== null) {
    return import("../play/audience.ts").then(({ mountAudience }) => mountAudience(element, context) ?? mountCreator(element, context));
  }
  // The language on show is ready before the first screen is drawn.
  return loadLanguage(context.language.get()).then(() => mountCreator(element, context));
}

/** Mounts the creator itself: the library and the screens of a quiz. */
function mountCreator(element: HTMLElement, context: MiniAppContext): Unmount {
  const controller = new AbortController();
  const { signal } = controller;
  const shows: Shows = { count: 0 };
  const app = createApp(element, context, signal, shows);
  const { prefs } = context.storage;
  // The last typing survives closing the tab or switching apps: kept at once where a closing page
  // cannot lose it (storage/rescue.ts), and written to the library if the page lives long enough.
  const flush = (): void => {
    const unsaved = app.saver.unsaved();
    if (unsaved !== null) keepUnsaved(prefs, unsaved);
    void app.saver.flush();
  };
  window.addEventListener("pagehide", flush, { signal });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); }, { signal });
  draw(app); // the library's frame at once; its lines follow from storage
  void restoreUnsaved(prefs, app.store, app.env.registries).catch(() => undefined).then(() => show(app, shows, app.nav.route(), undefined)).then(() => {
    // Opened by the system's share sheet (an installed app on Android): the shared text goes to "Make a quiz with AI".
    if (context.query.has(SHARED_PARAM)) void takeShared(app);
  });
  return () => {
    if (signal.aborted) return;
    controller.abort();
    // The shell may be about to clear the area: the pending write lands first, then the database is let go.
    void app.saver.flush().finally(() => { app.store.close(); });
    element.replaceChildren();
  };
}
