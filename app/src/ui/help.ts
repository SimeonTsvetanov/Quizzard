import type { HelpSection, MiniAppEntry } from "@simeonts/quizzard-core";
import { app } from "../config.ts";
import { getLanguage, t, text } from "../i18n/index.ts";
import { miniAppName, miniApps } from "../miniapps/registry.ts";
import { copyBlock, h } from "./dom.ts";
import { openDialog } from "./dialog.ts";

/** One Help category = a <details> section; only categories that apply are shown (APP-STANDARD §3). */
function section(title: string, ...content: Node[]): HTMLDetailsElement {
  return h("details", { class: "help-section" }, h("summary", {}, title), h("div", {}, ...content));
}
const p = (s: string): HTMLParagraphElement => h("p", {}, s);
const list = (items: readonly string[], ordered = false): HTMLElement =>
  h(ordered ? "ol" : "ul", {}, ...items.map((i) => h("li", {}, i)));

/** A mini-app's own Help (steps, features, FAQ) as one section; English when it has no translation. */
function toolSection(entry: MiniAppEntry, help: HelpSection): HTMLDetailsElement {
  const part = section(t("app.help.tool", { tool: miniAppName(entry) }),
    h("h3", {}, t("shell.help.quickStart")), list(help.steps, true),
    ...(help.features.length ? [h("h3", {}, t("shell.help.features")), ...help.features.map((f) => h("p", {}, h("strong", {}, `${f.name}: `), f.text))] : []),
    ...(help.faq.length ? [h("h3", {}, t("shell.help.faq")), ...help.faq.map((f) => h("div", { class: "faq" }, h("strong", {}, f.q), p(f.a)))] : []));
  part.dataset["helpTool"] = entry.meta.id;
  return part;
}

/**
 * Adds a section per mini-app after `anchor` once its Help chunk has loaded (precached, so also
 * offline); the section of the mini-app on screen goes first and opens. A chunk that fails to load
 * leaves its section out.
 */
function addToolSections(dialog: HTMLDialogElement, anchor: HTMLElement, isWide: boolean): void {
  // The mini-app on screen (the address may already be the dialog link #help).
  const onScreen = document.querySelector<HTMLElement>("[data-outlet]:not([hidden]) [data-miniapp]")?.dataset["miniapp"];
  const entries = miniApps.filter((entry) => entry.meta.status === "ready" && entry.help !== undefined);
  const load = async (entry: MiniAppEntry): Promise<({ readonly en: HelpSection } & Partial<Record<string, HelpSection>>) | undefined> => {
    try {
      return (await entry.help?.())?.default;
    } catch {
      return undefined; // offline before the chunk was cached: Help opens without this section
    }
  };
  void Promise.all(entries.map(load)).then((loaded) => {
    if (!dialog.isConnected) return; // closed or replaced meanwhile
    const language = getLanguage();
    let last = anchor;
    entries.forEach((entry, index) => {
      const help = loaded[index];
      if (help === undefined) return;
      const part = toolSection(entry, help[language] ?? help.en);
      if (isWide) part.open = true;
      if (entry.meta.id === onScreen) {
        part.open = true;
        if (!isWide) dialog.querySelectorAll<HTMLDetailsElement>("details.help-section[open]").forEach((other) => { other.open = false; });
        dialog.querySelector(".help-section")?.before(part);
      } else {
        last.after(part);
        last = part;
      }
    });
  });
}

export function openHelp(): void {
  const m = app.modes;
  const at = text();
  const service: Node[] = [];
  const params = m.urlParams;
  if (params.length) {
    service.push(h("h3", {}, t("shell.help.urlParams")),
      h("table", {}, h("thead", {}, h("tr", {}, ...[t("shell.help.colName"), t("shell.help.colValues"), t("shell.help.colDefault"), t("shell.help.colMeaning")].map((c) => h("th", {}, c)))),
        h("tbody", {}, ...params.map((u) => h("tr", {}, h("td", {}, u.name), h("td", {}, u.values), h("td", {}, u.default), h("td", {}, u.meaning))))),
      copyBlock(`${app.url}?${params.map((u) => `${u.name}=${u.default}`).join("&")}`));
  }
  service.push(h("h3", {}, t("shell.help.agents")), p(t("shell.help.agentsText", { a: `${app.url}llms.txt`, b: `${app.url}llms-full.txt` })));

  const sections = [
    section(t("shell.help.whatItDoes"), p(at.description)),
    section(t("shell.help.quickStart"), list(at.help.steps, true)),
    ...(at.help.features.length ? [section(t("shell.help.features"), ...at.help.features.map((f) => h("p", {}, h("strong", {}, `${f.name}: `), f.text)))] : []),
    section(t("shell.help.install"), list([t("shell.help.installAndroid"), t("shell.help.installIOS"), t("shell.help.installDesktop")])),
    section(t("shell.help.service"), ...service),
    section(t("shell.help.privacy"), p(t("shell.help.privacyText")), h("p", {}, h("a", { href: "./privacy/" }, t("shell.help.privacyLink")))),
    section(t("shell.help.limits"), list([
      ...(app.limits.maxFileMB ? [t("shell.help.maxFile", { mb: app.limits.maxFileMB })] : []),
      ...(app.limits.maxItems ? [t("shell.help.maxItems", { n: app.limits.maxItems })] : []),
      t("shell.help.offline"),
      t("shell.help.problem"),
    ])),
    section(t("shell.help.faq"), ...at.faq.map((f) => h("div", { class: "faq" }, h("strong", {}, f.q), p(f.a)))),
    section(t("shell.help.contact"), h("p", {}, h("a", { href: "#report" }, t("shell.menu.report")), " · ", h("a", { href: app.support.buyMeACoffee, target: "_blank", rel: "noopener" }, t("shell.help.coffee")))),
  ];
  sections[0]?.setAttribute("open", "");
  const wide = matchMedia("(min-width: 900px)").matches;
  if (wide) sections.forEach((s) => { s.open = true; });
  const dialog = openDialog("help", t("shell.help.title"), sections);
  const quickStart = sections[1];
  if (quickStart) addToolSections(dialog, quickStart, wide);
}
