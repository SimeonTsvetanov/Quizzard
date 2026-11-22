import "@fontsource-variable/inter";
import "./styles/app.css"; // layer order, tokens, accent and every app style (design → css-architecture)
import { app } from "./config.ts";
import { hydrateIcons } from "./ui/icons.ts";
import { applyTheme, getTheme, initTheme } from "./ui/theme.ts";
import { initI18n } from "./i18n/index.ts";
import { shareApp } from "./ui/share.ts";
import { installErrorScreen, show as showErrorScreen } from "./ui/error-screen.ts";
import { initOfflineIndicator } from "./ui/offline.ts";
import { initTitle } from "./ui/title.ts";
import { openHelp } from "./ui/help.ts";
import { openSettings } from "./ui/settings.ts";
import { openAbout } from "./ui/about.ts";
import { maybeShowWhatsNew, openWhatsNew } from "./ui/whats-new.ts";
import { flushReportQueue, openReport } from "./ui/report.ts";
import { initInstall, openInstall, updateMenuLabel } from "./ui/install.ts";
import { initPwa } from "./pwa.ts";
import { relocateToasts } from "./ui/toast.ts";
import { trackKeyboardInset } from "./ui/keyboard-inset.ts";
import { miniApps, registryErrors } from "./miniapps/registry.ts";
import { startScreens } from "./router/screen.ts";

initI18n(); // first: every later module (incl. the error screen) uses t()
installErrorScreen();
hydrateIcons();
initTheme();
trackKeyboardInset(); // sheets stay above the on-screen keyboard (iOS Safari needs the measured inset)
initOfflineIndicator();
initTitle();
initInstall();
// Language switch: static HTML is re-translated by setLanguage(); refresh the JS-set labels too.
document.addEventListener("i18n:change", () => { applyTheme(getTheme()); updateMenuLabel(); });

// Footer: runtime year (never hard-coded) and version.
document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = String(new Date().getFullYear()); });
document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = app.version; });

// LinkedIn from app.config (the static link is the default; hidden if the app has none).
document.querySelectorAll<HTMLAnchorElement>("[data-author-linkedin]").forEach((a) => {
  if (app.author.linkedin) a.href = app.author.linkedin; else a.remove();
});

// Contact email rendered by JS only (anti-scraping, APP-STANDARD §7).
document.querySelectorAll<HTMLAnchorElement>("[data-contact]").forEach((a) => {
  a.href = `mailto:${app.contact.email}`;
  a.textContent = app.contact.email;
});

// Actions: menu items, header buttons and deep links (#help, #settings, …) share one table.
const menu = document.querySelector<HTMLDialogElement>("[data-menu]");
const actions: Record<string, () => void> = {
  help: openHelp, settings: openSettings, about: openAbout, "whats-new": openWhatsNew, report: openReport,
  install: openInstall, share: () => { void shareApp(); },
};
document.addEventListener("click", (e) => {
  const target = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-action]") : null;
  const name = target?.dataset["action"];
  if (!name || !Object.hasOwn(actions, name)) return;
  e.preventDefault();
  menu?.close();
  actions[name]?.();
});
const openFromHash = (): void => {
  const name = location.hash.slice(1);
  if (name !== "share" && Object.hasOwn(actions, name)) actions[name]?.();
};
window.addEventListener("hashchange", openFromHash);

// Screens: Home or one mini-app (#/<id>), header Back, title. Development and the e2e build check
// the registry first; production relies on registry.test.ts and ships without the validator.
const registryProblems = import.meta.env.DEV || import.meta.env.MODE === "e2e" ? registryErrors() : [];
if (registryProblems.length > 0) showErrorScreen(new Error(registryProblems.map(({ code, message }) => `${code}: ${message}`).join("\n")));
else startScreens(miniApps);
openFromHash(); // after the router: a #help launch opens over the Home it shows

document.querySelector("[data-menu-open]")?.addEventListener("click", () => {
  menu?.showModal();
  relocateToasts(); // a visible toast (e.g. the update offer) moves into the menu, not under it
});
document.querySelector("[data-menu-close]")?.addEventListener("click", () => { menu?.close(); });
// Light dismiss: a tap outside the menu closes it.
menu?.addEventListener("click", (e) => {
  const r = menu.getBoundingClientRect();
  if (e.target === menu && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) menu.close();
});

// Header shadow after scrolling (IntersectionObserver, no scroll listeners).
const header = document.querySelector<HTMLElement>("[data-header]");
const sentinel = document.querySelector("[data-sentinel]");
if (header && sentinel) {
  new IntersectionObserver(([entry]) => {
    header.toggleAttribute("data-scrolled", entry ? !entry.isIntersecting : false);
  }).observe(sentinel);
}

window.addEventListener("online", flushReportQueue);
flushReportQueue();
maybeShowWhatsNew();
initPwa();
// Launch splash: remove it once its fade-out ends (also after a timeout, belt and braces).
const splash = document.querySelector<HTMLElement>(".splash");
if (splash && document.documentElement.hasAttribute("data-splash")) {
  const end = (): void => { document.documentElement.removeAttribute("data-splash"); };
  splash.addEventListener("animationend", (e) => { if (e.animationName === "splash-out") end(); });
  setTimeout(end, 2500);
}
