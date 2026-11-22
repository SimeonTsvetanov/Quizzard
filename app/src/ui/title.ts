import { app } from "../config.ts";
import { t } from "../i18n/index.ts";

/**
 * Sets the window title of the installed app to the bare name (the tab keeps "{name} — {tagline}"
 * from index.html). No title rotation (PLAN §2); route titles come with PLAN T-05.
 */
export function initTitle(): void {
  if (matchMedia("(display-mode: standalone)").matches) document.title = app.name;
}

/** While a task runs: "45% · App"; when done in a background tab: "✓ Done · App". */
export function setTitleProgress(percent: number | "done"): void {
  if (percent === "done") document.title = document.hidden ? t("shell.progress.done", { name: app.name }) : app.name;
  else document.title = `${String(Math.round(percent))}% · ${app.name}`;
}
