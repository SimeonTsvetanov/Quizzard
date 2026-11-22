import { app } from "../config.ts";
import { t } from "../i18n/index.ts";

/** Title of the Home screen, captured by {@link initTitle}. */
let homeTitle = "";

/**
 * Sets the window title of the installed app to the bare name (the tab keeps "{name} — {tagline}"
 * from index.html, the search title) and remembers it as the Home title. No title rotation (PLAN §2).
 */
export function initTitle(): void {
  if (matchMedia("(display-mode: standalone)").matches) document.title = app.name;
  homeTitle = document.title;
}

/**
 * Sets the title of the screen on show: Home's title, or `<part> — {name}` inside a mini-app
 * (PLAN §1.1 item 6).
 * @param part - the mini-app's name or its own part (`context.shell.setTitle`); `null` = Home
 */
export function setScreenTitle(part: string | null): void {
  document.title = part === null ? homeTitle : `${part} — ${app.name}`;
}

/** While a task runs: "45% · App"; when done in a background tab: "✓ Done · App". */
export function setTitleProgress(percent: number | "done"): void {
  if (percent === "done") document.title = document.hidden ? t("shell.progress.done", { name: app.name }) : app.name;
  else document.title = `${String(Math.round(percent))}% · ${app.name}`;
}
