// The probe's shell-service panel (PLAN T-06, tests/e2e/miniapp-context.spec.ts): one control per
// context service, its result in a `data-probe-*` output, and four buttons in the header slot. The
// language and theme subscriptions are never unsubscribed on purpose: the shell must release them.
import type { MiniAppContext } from "@simeonts/quizzard-core";

/** The probe's pref key and value; the e2e reads the raw key from localStorage. */
const PREF_KEY = "color";
const PREF_VALUE = "green";
/** Buttons the probe puts in the header slot (the 320 px overflow test needs four). */
const HEADER_BUTTONS = 4;

/** What the panel counts on `window.quizzardProbe`. */
export interface ServiceCounters {
  /** Calls of the probe's language and theme listeners. */
  signalFires: number;
}

/**
 * Renders the service panel into `root` and the header buttons into the header slot.
 * @returns nothing to undo: the shell empties the slot and ends the subscriptions at unmount
 */
export function renderServices(root: HTMLElement, context: MiniAppContext, counters: ServiceCounters): void {
  const output = (name: string, value = ""): HTMLOutputElement => {
    const element = document.createElement("output");
    element.dataset[name] = "";
    element.textContent = value;
    return element;
  };
  const lang = output("probeLang", context.language.get());
  const theme = output("probeTheme", context.theme.get());
  context.language.subscribe((value) => { counters.signalFires += 1; lang.textContent = value; });
  context.theme.subscribe((value) => { counters.signalFires += 1; theme.textContent = value; });
  const results = { confirm: output("probeConfirm"), share: output("probeShare"), pref: output("probePref"), action: output("probeAction") };
  root.append(lang, theme, ...Object.values(results), ...controls(context, results));
  for (let index = 1; index <= HEADER_BUTTONS; index += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "icon-button";
    button.textContent = String(index);
    button.setAttribute("aria-label", `Probe action ${String(index)}`);
    context.slots.headerActions.append(button);
  }
}

/** Outputs the controls write to. */
interface Results {
  readonly confirm: HTMLOutputElement;
  readonly share: HTMLOutputElement;
  readonly pref: HTMLOutputElement;
  readonly action: HTMLOutputElement;
}

function controls(context: MiniAppContext, results: Results): HTMLButtonElement[] {
  const { shell, storage } = context;
  return [
    button("Toast", () => {
      // Markup on purpose: the shell must show it as text.
      shell.toast("<b>Probe</b> toast", { action: { label: "Act", run: () => { results.action.textContent = "acted"; } } });
    }),
    button("Error toast", () => { shell.toast("Probe failed", { tone: "error" }); }),
    button("Confirm", () => {
      results.confirm.textContent = "pending";
      void shell.confirm({ title: "Reset the probe?", text: "Probe <i>text</i>", confirm: "Reset" }).then((answer) => {
        results.confirm.textContent = String(answer);
      });
    }),
    button("Share", () => {
      results.share.textContent = "pending";
      void shell.share({ title: "Probe", text: "Probe share", url: "https://example.test/" }).then((result) => {
        results.share.textContent = result;
      });
    }),
    button("Busy on", () => { shell.setBusy(true); }),
    button("Busy off", () => { shell.setBusy(false); }),
    button("Save pref", () => {
      const isSaved = storage.prefs.set(PREF_KEY, PREF_VALUE);
      storage.notifySaved();
      results.pref.textContent = `${storage.area.prefix}${PREF_KEY}=${storage.prefs.get(PREF_KEY, "")} saved:${String(isSaved)}`;
    }),
    button("Bad key", () => {
      try {
        storage.prefs.set("../escape", 1);
        results.pref.textContent = "accepted";
      } catch (error: unknown) {
        results.pref.textContent = error instanceof RangeError ? "rejected" : "other error";
      }
    }),
  ];
}

function button(label: string, onClick: () => void): HTMLButtonElement {
  const element = document.createElement("button");
  element.type = "button";
  element.textContent = label;
  element.addEventListener("click", onClick);
  return element;
}
