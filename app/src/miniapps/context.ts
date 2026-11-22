// The context a mounted mini-app gets (contract `MiniAppContext`, PLAN §1.2). T-05 wires what the
// router needs — language, query, navigation, title; T-06 replaces every `notYet` member below
// with the real shell service (toast, confirm, share, busy, header slot, prefs, theme changes).
import type { Lang, MiniAppContext, MiniAppEntry, Signal } from "@simeonts/quizzard-core";
import { getLanguage } from "../i18n/index.ts";
import { getTheme } from "../ui/theme.ts";
import type { Navigation } from "../router/router.ts";

/** Inputs of {@link createMiniAppContext}. */
export interface ContextOptions {
  readonly entry: MiniAppEntry;
  readonly query: URLSearchParams;
  readonly navigation: Navigation;
  /** Sets the title part of this mount; ignored by the caller once the mount is replaced. */
  readonly setTitle: (part: string | null) => void;
}

/**
 * Builds the context of one mount.
 * @returns a context whose T-06 members throw `Error("T-06: …")`, so no test passes on a stub
 */
export function createMiniAppContext({ entry, query, navigation, setTitle }: ContextOptions): MiniAppContext {
  return {
    host: "quizzard",
    language: languageSignal(),
    theme: { get: resolvedTheme, subscribe: () => notYet("theme.subscribe") },
    query: new URLSearchParams(query), // a copy: the mini-app cannot change the router's route
    shell: {
      toast: () => notYet("shell.toast"),
      confirm: () => notYet("shell.confirm"),
      share: () => notYet("shell.share"),
      setTitle,
      setBusy: () => notYet("shell.setBusy"),
    },
    navigation: { home: () => { navigation.home(); }, open: (id) => { navigation.open(id); } },
    slots: { get headerActions(): HTMLElement { return notYet("slots.headerActions"); } },
    storage: {
      area: entry.meta.storage,
      prefs: { get: () => notYet("storage.prefs"), set: () => notYet("storage.prefs"), remove: () => notYet("storage.prefs") },
      notifySaved: () => notYet("storage.notifySaved"),
    },
  };
}

/** The UI language; `i18n:change` (fired by `setLanguage`) is the change event. */
function languageSignal(): Signal<Lang> {
  return {
    get: getLanguage,
    subscribe(listener) {
      const onChange = (): void => { listener(getLanguage()); };
      document.addEventListener("i18n:change", onChange);
      return () => { document.removeEventListener("i18n:change", onChange); };
    },
  };
}

/** The theme on screen: the saved choice, or the OS setting for "system". */
function resolvedTheme(): "light" | "dark" {
  const theme = getTheme();
  if (theme !== "system") return theme;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** A context member that T-06 builds; calling it before then is a bug in the caller. */
function notYet(member: string): never {
  throw new Error(`T-06: context.${member} is not implemented yet`);
}
