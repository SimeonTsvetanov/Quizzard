// Light / dark / system theme: applies `data-theme`, updates theme-color meta and the toolbar icon.
import { prefs } from "../storage/index.ts";
import { icon, type IconName } from "./icons.ts";
import { t } from "../i18n/index.ts";

/** The user's theme choice; "system" follows the OS setting. */
export type Theme = "system" | "light" | "dark";
const ORDER: readonly Theme[] = ["system", "light", "dark"];
const META = { light: "#F5F5F7", dark: "#000000" } as const;
/** Toolbar icon per theme choice. */
const THEME_ICONS = { system: "monitor", light: "sun", dark: "moon" } as const satisfies Record<Theme, IconName>;

/** Returns the saved theme choice ("system" when none or invalid). */
export const getTheme = (): Theme => {
  const v = prefs.get<string>("theme", "system");
  return v === "light" || v === "dark" ? v : "system";
};

/** Fired on `document` after every {@link applyTheme}; mini-app theme signals listen to it. */
export const THEME_CHANGE_EVENT = "theme:change";
/** The OS colour scheme; "system" follows it. */
export const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

/** Returns the theme on screen: the saved choice, or the OS setting for "system". */
export function resolvedTheme(theme: Theme = getTheme()): "light" | "dark" {
  if (theme !== "system") return theme;
  return matchMedia(DARK_SCHEME_QUERY).matches ? "dark" : "light";
}

/** Applies Light / Dark / System; `save` remembers it per device (theme-init.js reads the same key). */
export function applyTheme(theme: Theme, save = false): void {
  if (save) {
    if (theme === "system") prefs.remove("theme");
    else prefs.set("theme", theme);
  }
  if (theme === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
  const dark = resolvedTheme(theme) === "dark";
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => { m.content = dark ? META.dark : META.light; });
  const button = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
  if (button) {
    button.replaceChildren(icon(THEME_ICONS[theme]));
    button.setAttribute("aria-label", t("shell.theme.toggle", { theme: t(`shell.theme.${theme}`) }));
  }
  document.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

/** Applies the saved theme and wires the toolbar toggle (system → light → dark). */
export function initTheme(): void {
  applyTheme(getTheme());
  document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => {
    applyTheme(ORDER[(ORDER.indexOf(getTheme()) + 1) % ORDER.length] ?? "system", true);
  });
}
