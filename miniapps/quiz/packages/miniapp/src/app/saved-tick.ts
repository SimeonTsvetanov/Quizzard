// "Saved" in the host's header: there is no Save button (PLAN §1.2 — saving is automatic), so a
// small tick says a change is on the device. A status region: screen readers hear "Saved" too.
import { h } from "../dom/h.ts";
import { icon } from "../dom/icons.ts";
import type { Translate } from "../i18n/translate.ts";
import type { SaveState } from "../storage/saver.ts";

/** The tick and its three moves. */
export interface SavedTick {
  show(state: SaveState): void;
  translate(t: Translate): void;
  remove(): void;
}

/**
 * Puts the tick into the host's header slot.
 * @param slot - `context.slots.headerActions`
 * @param translate - the translator of the language on show
 */
export function createSavedTick(slot: HTMLElement, translate: Translate): SavedTick {
  let t = translate;
  let state: SaveState = "idle";
  const words = h("span", { class: "quiz-saved-words" });
  const element = h("span", { class: "quiz-saved", role: "status", "data-saved": "idle" }, icon("check", 18), words);
  const render = (): void => {
    element.dataset["saved"] = state;
    // While a change is on its way the words stay as they were: nothing flickers at every key.
    if (state === "saved") words.textContent = t("saved");
    else if (state === "error") words.textContent = t("notSavedShort");
    else if (state === "idle") words.textContent = "";
  };
  slot.append(element);
  render();
  return {
    show(next) { state = next; render(); },
    translate(next) { t = next; render(); },
    remove() { element.remove(); },
  };
}
