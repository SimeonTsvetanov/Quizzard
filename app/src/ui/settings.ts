import { app } from "../config.ts";
import { dataAreas, miniAppName, type DataArea } from "../miniapps/registry.ts";
import { areaSize, clearArea, planArea, readArea, type AreaImport } from "../storage/areas.ts";
import { clearAll, estimate, exportAll, importAll, isPersisted, requestPersist } from "../storage/index.ts";
import { getLanguage, LANG_NAMES, setLanguage, t } from "../i18n/index.ts";
import { formatBytes, h } from "./dom.ts";
import { openDialog } from "./dialog.ts";
import { confirmAction } from "./confirm.ts";
import { applyTheme, getTheme, type Theme } from "./theme.ts";
import { showToast } from "./toast.ts";

/** iOS-style grouped section: small title above a card (design → ui-patterns §12). */
const group = (title: string, ...content: Node[]): HTMLElement =>
  h("section", { class: "group" }, h("h3", { class: "group-title" }, title), h("div", { class: "group-card" }, ...content));
/** Label left, value right; wraps under each other when narrow. */
const row = (label: string, value: HTMLElement): HTMLElement => h("div", { class: "row" }, h("span", { class: "row-label" }, label), value);

function segmented(name: string, legend: string, options: readonly { value: string; label: string; lang?: string }[], current: string, onPick: (v: string) => void): HTMLFieldSetElement {
  const set = h("fieldset", { class: "segmented" }, h("legend", { class: "visually-hidden" }, legend));
  for (const o of options) {
    const input = h("input", { type: "radio", name, value: o.value, id: `${name}-${o.value}` });
    input.checked = current === o.value;
    input.addEventListener("change", () => { onPick(o.value); });
    set.append(h("label", { for: `${name}-${o.value}`, ...(o.lang ? { lang: o.lang } : {}) }, input, o.label));
  }
  return set;
}

/** Import error code → message (codes come from storage `importAll`). */
function importErrorMessage(code: string): string {
  switch (code) {
    case "NOT_THIS_APP": return t("shell.settings.importWrongApp", { name: app.name });
    case "IMPORT_TOO_BIG": return t("shell.settings.importTooBig");
    default: return t("shell.settings.importFailed");
  }
}

/** Import button + its hidden file input; restoring overwrites data, so it confirms first. */
function importButton(): [HTMLButtonElement, HTMLInputElement] {
  const file = h("input", { type: "file", accept: "application/json,.json", hidden: "" });
  const button = h("button", { class: "button", type: "button" }, t("shell.settings.import"));
  button.addEventListener("click", () => { file.click(); });
  file.addEventListener("change", () => {
    const picked = file.files?.[0];
    file.value = "";
    if (!picked) return;
    void confirmAction({
      title: t("shell.settings.importTitle"), message: t("app.data.importMessage", { name: app.name, file: picked.name }),
      confirm: t("shell.settings.importConfirm"),
    }).then((confirmed) => {
      if (!confirmed) return;
      const areas = dataAreas();
      // The open mini-app leaves first (it saves on its way out) and comes back with the imported data.
      document.dispatchEvent(new Event("app:data-clearing"));
      const planTool = (id: string, data: unknown): AreaImport | null => {
        const target = areas.find((candidate) => candidate.id === id && candidate.entry !== undefined);
        return target === undefined ? null : planArea(target.area, data);
      };
      importAll(picked, planTool).then((count) => { showToast({ message: t("shell.settings.imported", { count }) }); }, (e: unknown) => {
        showToast({ message: importErrorMessage(e instanceof Error ? e.message : "") });
      }).finally(() => { document.dispatchEvent(new Event("app:data-cleared")); });
    });
  });
  return [button, file];
}

/** The row's name: the mini-app's, or "Quizzard settings" for the shell's own area. */
const areaName = (item: DataArea): string => (item.entry === undefined ? t("app.data.shell", { name: app.name }) : miniAppName(item.entry));

/**
 * Deletes saved data, always after a confirm: one mini-app's area, or everything when `only` is absent.
 * The open mini-app is unmounted around it (router/screen.ts), so it cannot save its old state again.
 */
function confirmClear(only?: DataArea): void {
  const texts = only === undefined
    ? { title: t("shell.settings.clearTitle"), message: t("app.data.clearAllMessage", { name: app.name }) }
    : { title: t("app.data.clearOneTitle", { tool: areaName(only) }), message: t("app.data.clearOneMessage", { tool: areaName(only) }) };
  void confirmAction({ ...texts, confirm: t("shell.settings.clearConfirm") }).then(async (confirmed) => {
    if (!confirmed) return;
    document.dispatchEvent(new Event("app:data-clearing"));
    try {
      for (const item of only === undefined ? dataAreas() : [only]) if (item.entry !== undefined) clearArea(item.area);
      if (only === undefined) await clearAll();
      showToast({ message: only === undefined ? t("shell.settings.cleared") : t("app.data.clearedOne", { tool: areaName(only) }) });
    } catch {
      showToast({ message: t("shell.settings.clearFailed") }); // e.g. storage blocked by the browser
    } finally {
      document.dispatchEvent(new Event("app:data-cleared"));
    }
    // The sizes changed: show the sheet again when it is still the one on screen.
    if (document.querySelector('dialog[data-dialog="settings"][open]')) openSettings();
  });
}

/** One row per storage area: name, size and — for a mini-app with saved data — its own Clear. */
function dataRows(): HTMLElement[] {
  return dataAreas().map((item) => {
    const size = areaSize(item.area);
    const value = h("span", { class: "row-value" }, size === 0 ? t("app.data.empty") : formatBytes(size));
    const line = h("div", { class: "row row--action", "data-area": item.id }, h("span", { class: "row-label" }, areaName(item)), value);
    if (item.entry !== undefined && size > 0) {
      const clear = h("button", { class: "row-button", type: "button", "aria-label": t("app.data.clearOneLabel", { tool: areaName(item) }) }, t("app.data.clearOne"));
      clear.addEventListener("click", () => { confirmClear(item); });
      line.append(clear);
    }
    return line;
  });
}

/** "Delete all data" — quiet style (never the loudest button), always confirmed. */
function clearButton(): HTMLButtonElement {
  const button = h("button", { class: "button button--destructive", type: "button" }, t("shell.settings.clear"));
  button.addEventListener("click", () => { confirmClear(); });
  return button;
}

/** Opens the Settings sheet: theme, language, saved data per tool, storage (usage, keep, export/import) and delete-all. */
export function openSettings(): void {
  const theme = segmented("theme", t("shell.theme.label"),
    (["system", "light", "dark"] as const satisfies readonly Theme[]).map((v) => ({ value: v, label: t(`shell.theme.${v}`) })),
    getTheme(), (v) => { applyTheme(v as Theme, true); });
  // Language picker only when the app ships more than one language (app-shell rule 9).
  const language = segmented("lang", t("shell.language.label"),
    app.languages.map((l) => ({ value: l, label: LANG_NAMES[l], lang: l })),
    getLanguage(), (v) => { setLanguage(v as (typeof app.languages)[number]); openSettings(); });

  const used = h("span", { class: "row-value" }, "…");
  const kept = h("span", { class: "row-value" }, "…");
  void estimate().then((e) => { used.textContent = e ? formatBytes(e.usage) : t("shell.settings.usedNA"); });
  void isPersisted().then((ok) => { kept.textContent = ok ? t("shell.settings.keptYes") : t("shell.settings.keptNo"); });

  const keep = h("button", { class: "button", type: "button" }, t("shell.settings.keep"));
  keep.addEventListener("click", () => {
    void requestPersist().then((ok) => {
      kept.textContent = ok ? t("shell.settings.keptYes") : t("shell.settings.keptNo");
      if (!ok) showToast({ message: t("shell.settings.keptDenied") });
    });
  });
  const exportBtn = h("button", { class: "button", type: "button" }, t("shell.settings.export"));
  exportBtn.addEventListener("click", () => {
    const tools = Object.fromEntries(dataAreas().filter((item) => item.entry !== undefined).map((item) => [item.id, readArea(item.area)]));
    const a = h("a", { href: URL.createObjectURL(exportAll(tools)), download: `${app.id}-data-${new Date().toISOString().slice(0, 10)}.json` });
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); }, 1000);
  });
  const [importBtn, file] = importButton();
  const clear = clearButton();

  openDialog("settings", t("shell.settings.title"), [
    group(t("shell.theme.label"), theme),
    ...(app.languages.length > 1 ? [group(t("shell.language.label"), language)] : []),
    group(t("app.data.title"), ...dataRows()),
    h("p", { class: "group-note" }, t("app.data.note")),
    group(t("shell.settings.storage"),
      row(t("shell.settings.usedLabel"), used),
      row(t("shell.settings.keptLabel"), kept),
      h("div", { class: "button-stack" }, keep, exportBtn, importBtn), file),
    h("p", { class: "group-note" }, t("shell.settings.hint")),
    group(t("shell.settings.danger"), h("div", { class: "button-stack" }, clear)),
  ]);
}
