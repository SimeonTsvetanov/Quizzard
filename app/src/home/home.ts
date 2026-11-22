// The Home launcher (SPEC F1, PLAN T-07): one card per registry entry in the static list of
// app/index.html — a link for a ready mini-app, a quiet "Soon" card for a coming one — with the
// last used mini-app first. router/screen.ts renders it on every Home show and on a language change.
import { routeHref, type MiniAppEntry } from "@simeonts/quizzard-core";
import { t } from "../i18n/index.ts";
import { miniAppName, miniAppTagline } from "../miniapps/registry.ts";
import { prefs } from "../storage/index.ts";
import { h } from "../ui/dom.ts";
import { orderForHome } from "./order.ts";

/** Shell pref (`quizzard:v1:last-app`) with the id of the mini-app opened last. */
const LAST_USED_KEY = "last-app";
/** Drawn size of a mark in CSS px; the `<img>` carries it so nothing moves while it loads. */
const MARK_ICON_SIZE = "28";

/** The launcher as screen.ts uses it. */
export interface Home {
  /** Renders the cards in Home order and ends the list's busy state; keeps focus on a re-rendered card. */
  render(): void;
  /**
   * Returns the card of the mini-app last opened from a card and forgets it — where focus goes back
   * to on return (accessibility §3, "the trigger"); `null` when the mini-app was not opened from Home.
   */
  takeReturnFocus(): HTMLElement | null;
}

/**
 * Remembers the mini-app on show as the last used one (Home lists it first).
 * @param id - the mini-app's registry id
 */
export function rememberLastUsed(id: string): void {
  prefs.set(LAST_USED_KEY, id);
}

/**
 * Creates the launcher over the list element; nothing is rendered before `render()`.
 * @param list - the `<ul data-launcher>` of app/index.html (starts with `aria-busy="true"`)
 * @param entries - the registry
 */
export function createHome(list: HTMLElement, entries: readonly MiniAppEntry[]): Home {
  let openedId: string | null = null;
  list.addEventListener("click", (event) => {
    const card = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-card]") : null;
    if (card?.matches(":any-link") === true) openedId = card.dataset["card"] ?? null;
  });
  const cardOf = (id: string): HTMLElement | null => list.querySelector<HTMLElement>(`[data-card="${CSS.escape(id)}"]`);
  return {
    render() {
      const focused = document.activeElement instanceof HTMLElement && list.contains(document.activeElement) ? document.activeElement.dataset["card"] : undefined;
      list.replaceChildren(...orderForHome(entries, lastUsedId()).map((entry) => h("li", { class: "launcher-item" }, card(entry))));
      list.removeAttribute("aria-busy");
      if (focused !== undefined) cardOf(focused)?.focus();
    },
    takeReturnFocus() {
      const id = openedId;
      openedId = null;
      return id === null ? null : cardOf(id);
    },
  };
}

/** The saved last-used id; anything else in storage (hand-edited, older shape) counts as none. */
function lastUsedId(): string | null {
  const value = prefs.get<unknown>(LAST_USED_KEY, null);
  return typeof value === "string" ? value : null;
}

function card(entry: MiniAppEntry): HTMLElement {
  return entry.meta.status === "ready" ? readyCard(entry) : comingCard(entry);
}

/**
 * The whole card is one link (one tap target). Its name is its visible text — name, then tagline —
 * so the label people see is in the name (WCAG 2.5.3); the visual "Open" is left out.
 */
function readyCard(entry: MiniAppEntry): HTMLElement {
  const { id } = entry.meta;
  return h(
    "a",
    { class: "launcher-card", "data-card": id, href: routeHref({ kind: "miniapp", id, query: new URLSearchParams() }) },
    mark(entry),
    texts(entry),
    h("span", { class: "launcher-action", "aria-hidden": "true" }, t("app.home.open")),
  );
}

/**
 * Same shape, not a link and not focusable: the visible "Soon" is decoration, the hidden "Coming
 * soon" is what a screen reader says — never a disabled-looking control.
 */
function comingCard(entry: MiniAppEntry): HTMLElement {
  return h(
    "div",
    { class: "launcher-card", "data-card": entry.meta.id, "data-state": "coming" },
    mark(entry),
    texts(entry),
    h("span", { class: "launcher-soon", "aria-hidden": "true" }, t("app.home.soon")),
    h("span", { class: "visually-hidden" }, t("app.home.comingSoon")),
  );
}

function mark(entry: MiniAppEntry): HTMLElement {
  return h(
    "span",
    { class: "launcher-mark" },
    h("img", { src: entry.meta.icon, alt: "", width: MARK_ICON_SIZE, height: MARK_ICON_SIZE, decoding: "async" }),
  );
}

function texts(entry: MiniAppEntry): HTMLElement {
  return h(
    "span",
    { class: "launcher-text" },
    h("span", { class: "launcher-name" }, miniAppName(entry)),
    h("span", { class: "launcher-tagline" }, miniAppTagline(entry)),
  );
}
