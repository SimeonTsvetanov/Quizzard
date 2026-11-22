/**
 * src/ui/error-screen.ts — the in-app "Something went wrong" screen (APP-STANDARD §15.1 item 8)
 * and the same view inside the mini-app outlet (miniapps/outlet.ts: "Try again", "Back to Home").
 * Level 1: call installErrorScreen() once in main.ts. Styled by styles/components/error-screen.css
 * (tokens only). No innerHTML with data. Technical details stay English (they go into reports).
 */
import { app } from "../config.ts";
import { sendErrorReport } from "./feedback.ts"; // POSTs { type: "crash", … } to the feedback webhook
import { t } from "../i18n/index.ts"; // initialised synchronously before this screen can appear

let shown = false;

/** One button of an error view. */
export interface ErrorAction {
  readonly label: string;
  readonly isPrimary: boolean;
  readonly run: () => void;
}

/** Inputs of {@link errorViewParts}. */
export interface ErrorViewOptions {
  readonly error: Error;
  readonly title: string;
  readonly text: string;
  /** Buttons before "Copy details", the first one usually primary. */
  readonly actions: readonly HTMLButtonElement[];
  /** `id` of the heading, unique on the page (the root's `aria-labelledby`). */
  readonly headingId: string;
  /** Nodes between the buttons and the technical details (e.g. the report status line). */
  readonly extra?: readonly Node[];
}

/** Registers global handlers; the screen appears only for unexpected errors. */
export function installErrorScreen(): void {
  window.addEventListener("error", (e) => {
    show(e.error instanceof Error ? e.error : new Error(e.message));
  });
  window.addEventListener("unhandledrejection", (e) => {
    show(toError(e.reason));
  });
}

/**
 * Converts anything thrown into an `Error` (a rejected promise may carry any value).
 * @param reason - the thrown or rejected value
 */
export function toError(reason: unknown): Error {
  return reason instanceof Error ? reason : new Error(String(reason));
}

/** Shows the full-screen error view. Exported for error boundaries and manual use. */
export function show(error: Error, lastAction = getLastAction()): void {
  if (shown) return;
  shown = true;
  const status = el("p", { className: "es-status", "aria-live": "polite" });
  const report = errorButton({ label: t("shell.error.send"), isPrimary: false, run: () => {
    // aria-disabled, not disabled: a disabled button drops keyboard focus to <body> (accessibility §3).
    if (report.getAttribute("aria-disabled") === "true") return;
    report.setAttribute("aria-disabled", "true");
    status.textContent = t("shell.error.sending");
    sendErrorReport({ message: error.message, stack: error.stack ?? "", lastAction }).then(
      ({ issue }) => { status.textContent = t("shell.error.sent", { issue }); },
      () => {
        status.textContent = t("shell.error.failed");
        report.removeAttribute("aria-disabled");
      },
    );
  } });
  const reload = errorButton({ label: t("shell.error.reload"), isPrimary: true, run: () => { location.reload(); } });
  const root = el("main", { className: "es es--screen", role: "alert", "aria-labelledby": "es-title" });
  const { nodes, heading } = errorViewParts({
    error, title: t("shell.error.title"), text: t("shell.error.text"), actions: [reload, report], headingId: "es-title", extra: [status],
  }, lastAction);
  root.append(...nodes);
  document.body.append(root);
  document.title = t("shell.error.docTitle", { name: app.name });
  heading.focus();
}

/**
 * Builds the parts of an error view (icon, heading, text, error name, buttons + "Copy details",
 * technical details) for the caller to place in its own root element.
 * @param options - texts, buttons and heading id
 * @param lastAction - the last user action recorded for reports
 * @returns the nodes in order and the heading (`tabindex="-1"`, to receive focus)
 */
export function errorViewParts(options: ErrorViewOptions, lastAction = getLastAction()): { readonly nodes: readonly Node[]; readonly heading: HTMLHeadingElement } {
  const { error, title, text, actions, headingId, extra = [] } = options;
  const details = errorDetails(error, lastAction);
  const icon = el("div", { className: "es-icon", "aria-hidden": "true" });
  icon.textContent = "!";
  const heading = el("h1", { className: "es-title", id: headingId, tabIndex: -1 });
  heading.textContent = title;
  const paragraph = el("p", { className: "es-text" });
  paragraph.textContent = text;
  const chip = el("p", { className: "es-chip" });
  chip.textContent = error.name === "Error" ? t("shell.error.unexpected") : error.name;
  const copy = errorButton({ label: t("shell.error.copy"), isPrimary: false, run: () => {
    navigator.clipboard.writeText(details).then(
      () => { copy.textContent = t("shell.error.copied"); },
      () => { copy.textContent = t("shell.error.selectText"); },
    ).finally(() => {
      setTimeout(() => { copy.textContent = t("shell.error.copy"); }, 2000);
    });
  } });
  const buttons = el("div", { className: "es-actions button-stack" });
  buttons.append(...actions, copy);
  const disclosure = el("details", { className: "es-details" });
  const summary = el("summary");
  summary.textContent = t("shell.error.details");
  const pre = el("pre");
  pre.textContent = details;
  disclosure.append(summary, pre);
  return { nodes: [icon, heading, paragraph, chip, buttons, ...extra, disclosure], heading };
}

/**
 * Creates a button of an error view.
 * @param action - label, emphasis and what a click does
 */
export function errorButton({ label, isPrimary, run }: ErrorAction): HTMLButtonElement {
  const button = el("button", { className: isPrimary ? "button button--primary" : "button", type: "button" });
  button.textContent = label;
  button.addEventListener("click", run);
  return button;
}

function errorDetails(error: Error, lastAction: string): string {
  return [
    `${app.name} ${app.version}`,
    `Error: ${error.name}: ${error.message}`,
    `Last action: ${lastAction}`,
    `Browser: ${navigator.userAgent}`,
    `Display: ${matchMedia("(display-mode: standalone)").matches ? "standalone" : "browser"}`,
    `Time: ${new Date().toISOString()}`,
    "",
    error.stack ?? "(no stack)",
  ].join("\n");
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, string | number> = {}): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "className") node.className = String(v);
    else if (k === "tabIndex") node.tabIndex = Number(v);
    else node.setAttribute(k, String(v));
  }
  return node;
}

function getLastAction(): string {
  return document.documentElement.dataset["lastAction"] ?? "unknown";
}
