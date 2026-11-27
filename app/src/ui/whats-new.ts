import { app } from "../config.ts";
import changelog from "../generated/changelog.json";
import { prefs } from "../storage/index.ts";
import { h } from "./dom.ts";
import { openDialog } from "./dialog.ts";
import { t } from "../i18n/index.ts";

/** A changelog line: what stands between two `**` is strong, the rest is plain text. */
function line(text: string): HTMLElement {
  return h("li", {}, ...text.split("**").map((part, index) => (index % 2 === 1 ? h("strong", {}, part) : part)));
}

export function openWhatsNew(): void {
  prefs.set("last-seen-version", app.version);
  openDialog("whats-new", t("shell.whatsNew.title"), changelog.map((v) =>
    h("section", {}, h("h3", {}, `${v.version}${v.date ? ` · ${v.date}` : ""}`), h("ul", {}, ...v.items.map(line)))));
}

/** Shown once automatically after an update (not on the very first visit). */
export function maybeShowWhatsNew(): void {
  const seen = prefs.get<string | null>("last-seen-version", null);
  if (seen === null) { prefs.set("last-seen-version", app.version); return; }
  if (seen !== app.version) openWhatsNew();
}
