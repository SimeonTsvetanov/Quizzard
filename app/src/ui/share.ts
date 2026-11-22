import { app } from "../config.ts";
import { showToast } from "./toast.ts";
import { t, text } from "../i18n/index.ts";
import { h } from "./dom.ts";
import { icon } from "./icons.ts";
import { openDialog } from "./dialog.ts";

/**
 * How a share ended: the device's sheet or WhatsApp took it, it was copied, the person closed the
 * sheet without a choice, or even copying failed (the text then stays in a toast to copy by hand).
 */
export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

/** Options of {@link shareText}. */
export interface ShareOptions {
  /** Title for the device's share sheet; default the app name. */
  readonly title?: string;
  /** A link shared with the text; the fallback appends it on its own line. */
  readonly url?: string;
}

/** Copies `value`; when the clipboard refuses, the value stays on screen to copy by hand. */
async function copy(value: string): Promise<"copied" | "failed"> {
  try {
    await navigator.clipboard.writeText(value);
    showToast({ message: t("shell.copied") });
    return "copied";
  } catch {
    // because the person still gets the text: a persistent toast shows it for manual copying
    showToast({ message: value, persistent: true });
    return "failed";
  }
}

/** The WhatsApp + Copy sheet; resolves with the first choice, or "cancelled" when closed without one. */
function shareFallback(message: string): Promise<ShareResult> {
  return new Promise((resolve) => {
    let result: ShareResult | null = null;
    const settle = (value: ShareResult): void => {
      if (result !== null) return;
      result = value;
      resolve(value);
    };
    const wa = h("a", { class: "button button--primary", href: `https://wa.me/?text=${encodeURIComponent(message)}`, target: "_blank", rel: "noopener" }, icon("message"), "WhatsApp");
    wa.addEventListener("click", () => { settle("shared"); });
    const cp = h("button", { class: "button", type: "button" }, icon("copy"), t("shell.copy"));
    let copying: Promise<void> = Promise.resolve();
    cp.addEventListener("click", () => { copying = copy(message).then(settle); });
    const dialog = openDialog("share", t("shell.shareTitle"), [h("div", { class: "button-stack" }, wa, cp)], { compact: true });
    // A Copy still writing settles first; only a sheet closed with no choice is "cancelled".
    dialog.addEventListener("close", () => { void copying.then(() => { settle("cancelled"); }); });
  });
}

/**
 * ONE Share button for everything (app-shell → app-shell §8): the device's own share sheet
 * (WhatsApp, Viber, Messages … are in it). Where there is none (most desktops) or it fails, a
 * small sheet offers WhatsApp (wa.me) + Copy. Cancelling the native sheet is silent.
 * @returns how the share ended (also what `context.shell.share` gives a mini-app)
 */
export async function shareText(message: string, { title = app.name, url }: ShareOptions = {}): Promise<ShareResult> {
  const withLink = url === undefined ? message : `${message}\n${url}`;
  if (typeof navigator.share !== "function") return shareFallback(withLink);
  try {
    await navigator.share(url === undefined ? { title, text: message } : { title, text: message, url });
    return "shared";
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    return shareFallback(withLink);
  }
}

/** Share app (header + menu): tagline + link through the same single Share flow. */
export async function shareApp(): Promise<void> {
  await shareText(`${text().tagline} — ${app.url}`);
}
