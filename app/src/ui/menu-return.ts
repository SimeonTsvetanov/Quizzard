// A dialog opened from the menu leads back to the menu (Moni 2026-11-23): it gets a Back arrow at
// the start of its header, and closing it — Back, ✕, Escape or a tap outside — shows the menu again
// with the focus on the item that opened it, instead of dropping the person two steps back.
import { t } from "../i18n/index.ts";
import { h } from "./dom.ts";
import { icon } from "./icons.ts";

/** The open sheet dialog, if any (dialog.ts opens at most one). */
const openSheet = (): HTMLDialogElement | null => document.querySelector<HTMLDialogElement>("dialog.sheet[open]");

/** Puts the Back arrow first in the sheet's header; it closes through the sheet's own ✕ (same guards). */
function addBackButton(sheet: HTMLDialogElement): void {
  const head = sheet.querySelector(".sheet-head");
  const close = head?.querySelector<HTMLButtonElement>("button.icon-button");
  if (!head || !close || head.querySelector("[data-menu-back]")) return;
  const back = h("button", { class: "icon-button sheet-back", type: "button", "data-menu-back": "", "aria-label": t("shell.menu.backToMenu"), title: t("shell.menu.backToMenu") });
  back.append(icon("back"));
  back.addEventListener("click", () => { close.click(); });
  head.prepend(back);
}

/**
 * Makes the sheet that a menu item just opened return to the menu when it closes.
 * @param item - the menu item that opened it; gets the focus when the menu is shown again
 * @param showMenu - opens the menu
 * @remarks A sheet may replace itself while open (Settings redraws after a language change or a
 * clear): the replacement inherits the return. When no sheet opened (Share app, Install on a
 * browser that shows its own prompt) nothing happens.
 */
export function returnToMenuAfter(item: HTMLElement, showMenu: () => void): void {
  const arm = (): void => {
    const sheet = openSheet();
    if (sheet === null) return;
    addBackButton(sheet);
    sheet.addEventListener("close", () => {
      // A new sheet took its place (redraw or another deep link): follow that one.
      if (openSheet() !== null) {
        arm();
        return;
      }
      showMenu();
      item.focus({ preventScroll: true });
    }, { once: true });
  };
  arm();
}
