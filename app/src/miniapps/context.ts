// The context a mounted mini-app gets (contract `MiniAppContext`, PLAN §1.2): thin adapters over the
// shell's own language, theme, toast, confirm, share, busy state, header and storage. The outlet
// releases it when the mini-app unmounts — subscriptions, busy flag and header slot go with it.
import { isPrefKey, type Lang, type MiniAppContext, type MiniAppEntry, type StorageArea } from "@simeonts/quizzard-core";
import { getLanguage } from "../i18n/index.ts";
import { DARK_SCHEME_QUERY, THEME_CHANGE_EVENT, resolvedTheme } from "../ui/theme.ts";
import { showToast, type ToastOptions } from "../ui/toast.ts";
import { confirmAction, type ConfirmOptions } from "../ui/confirm.ts";
import { shareText } from "../ui/share.ts";
import { h } from "../ui/dom.ts";
import { noteSuccessForInstall } from "../ui/install.ts";
import { setBusy } from "../state.ts";
import { createPrefs } from "../storage/index.ts";
import { noteDataSaved } from "../storage/persist.ts";
import type { Navigation } from "../router/router.ts";
import { anyWatch, createScope, eventWatch, watchedSignal, type SubscriptionScope } from "./signals.ts";

/** Inputs of {@link createMiniAppContext}. */
export interface ContextOptions {
  readonly entry: MiniAppEntry;
  readonly query: URLSearchParams;
  readonly navigation: Navigation;
  /** Sets the title part of this mount; ignored by the caller once the mount is replaced. */
  readonly setTitle: (part: string | null) => void;
  /** The header's action group; the mini-app's slot goes first in it, before the shell's buttons. */
  readonly headerActions: HTMLElement;
}

/** A context and the shell's handle to end it. */
export interface MountedContext {
  readonly context: MiniAppContext;
  /**
   * Ends the mount's services: every subscription stops (also those the mini-app forgot), its busy
   * flag clears (a pending update offer appears) and the header slot is emptied and removed.
   * Safe to call more than once.
   */
  readonly release: () => void;
}

/** Event `setLanguage()` fires on `document` (i18n/index.ts). */
const LANGUAGE_CHANGE_EVENT = "i18n:change";

/**
 * Builds the context of one mount.
 * @returns the context and its `release`, which the outlet calls after the mini-app's unmount
 */
export function createMiniAppContext(options: ContextOptions): MountedContext {
  const { entry, navigation } = options;
  const scope = createScope();
  const busyOwner = Symbol(entry.meta.id);
  let isReleased = false;
  const slot = h("div", { class: "header-slot", "data-header-slot": entry.meta.id });
  options.headerActions.prepend(slot);
  const context: MiniAppContext = {
    host: "quizzard",
    ...signals(entry, scope),
    query: new URLSearchParams(options.query), // a copy: the mini-app cannot change the router's route
    shell: {
      toast: (message, toastOptions) => { showToast(toToast(message, toastOptions)); },
      confirm: (confirmOptions) => confirmAction(toConfirm(confirmOptions)),
      share: ({ text, title, url }) => shareText(text, { ...(title === undefined ? {} : { title }), ...(url === undefined ? {} : { url }) }),
      setTitle: options.setTitle,
      setBusy: (isBusy) => { if (!isReleased) setBusy(busyOwner, isBusy); },
    },
    navigation: { home: () => { navigation.home(); }, open: (id) => { navigation.open(id); } },
    slots: { headerActions: slot },
    storage: {
      area: entry.meta.storage,
      prefs: areaPrefs(entry.meta.storage),
      notifySaved: () => {
        noteDataSaved();
        noteSuccessForInstall();
      },
    },
  };
  const release = (): void => {
    if (isReleased) return;
    isReleased = true;
    scope.release();
    setBusy(busyOwner, false);
    slot.replaceChildren();
    slot.remove();
  };
  return { context, release };
}

/** The language and theme signals of one mount, both owned by `scope`. */
function signals(entry: MiniAppEntry, scope: SubscriptionScope): Pick<MiniAppContext, "language" | "theme"> {
  return {
    language: watchedSignal({
      read: () => miniAppLanguage(getLanguage(), entry.meta.languages),
      watch: eventWatch(document, LANGUAGE_CHANGE_EVENT),
      scope,
    }),
    // Resolved: with the "system" setting an OS scheme change is a change too.
    theme: watchedSignal({
      read: () => resolvedTheme(),
      watch: anyWatch(eventWatch(document, THEME_CHANGE_EVENT), eventWatch(matchMedia(DARK_SCHEME_QUERY), "change")),
      scope,
    }),
  };
}

/** The UI language when the mini-app translates it, else English (SPEC F13). */
function miniAppLanguage(language: Lang, supported: readonly Lang[]): Lang {
  return supported.includes(language) ? language : "en";
}

type ToastArguments = Parameters<MiniAppContext["shell"]["toast"]>;

function toToast(message: string, options: ToastArguments[1]): ToastOptions {
  const action = options?.action;
  return {
    message,
    ...(options?.tone === undefined ? {} : { tone: options.tone }),
    // A wrapper, so the shell never keeps the mini-app's object (it may change it later).
    ...(action === undefined ? {} : { action: { label: action.label, run: () => { action.run(); } } }),
  };
}

function toConfirm({ title, text, confirm, cancel, danger }: Parameters<MiniAppContext["shell"]["confirm"]>[0]): ConfirmOptions {
  return {
    title,
    confirm,
    ...(text === undefined ? {} : { message: text }),
    ...(cancel === undefined ? {} : { cancel }),
    ...(danger === undefined ? {} : { danger }),
  };
}

/**
 * The mini-app's prefs: short keys stored as `area.prefix + key` through the shell's storage module.
 * @throws {@link RangeError} `PREF_KEY_INVALID` for a key that could leave or blur the area
 * (`isPrefKey`) — a mini-app bug, never silently written elsewhere
 */
function areaPrefs(area: StorageArea): MiniAppContext["storage"]["prefs"] {
  const prefs = createPrefs(area.prefix);
  const checked = (key: string): string => {
    if (!isPrefKey(key)) throw new RangeError(`PREF_KEY_INVALID: ${JSON.stringify(key)} is not a pref key (letters, digits, inner - _ .; ≤ 64)`);
    return key;
  };
  return {
    get: (key, fallback) => prefs.get(checked(key), fallback),
    set: (key, value) => prefs.set(checked(key), value),
    remove: (key) => { prefs.remove(checked(key)); },
  };
}
