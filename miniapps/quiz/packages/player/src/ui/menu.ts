// The menu (M): every screen as a grid to jump to; whether questions run by themselves; the black
// screen and a break; the tools; the keys; and, apart at the end, starting again.
import { BREAK_MINUTES, type GameState } from "../game/state.ts";
import { h } from "../render/h.ts";
import { icon, type StageIcon } from "../render/icons.ts";
import type { PlayEnv } from "../views/context.ts";
import type { Commands } from "./commands.ts";
import { jumpGrid } from "./menu-jump.ts";

/** What the menu needs. */
export interface MenuOptions {
  readonly env: PlayEnv;
  readonly state: GameState;
  readonly commands: Commands;
  readonly isPresenting: boolean;
  /** Closes the menu (after a choice). */
  readonly close: () => void;
}

function section(title: string, ...children: HTMLElement[]): HTMLElement {
  return h("section", { class: "qp-menu-section" }, h("h3", { class: "qp-menu-heading" }, title), ...children);
}

function menuButton(name: StageIcon | null, label: string, run: () => void, props: Readonly<Record<string, string>> = {}): HTMLButtonElement {
  const button = h("button", { type: "button", class: "qp-menu-button", ...props });
  if (name !== null) button.append(icon(name, 20));
  button.append(h("span", {}, label));
  button.addEventListener("click", run);
  return button;
}

/** The black screen and a break: what the room sees while nothing is asked. */
function pauses({ env, state, commands, close }: MenuOptions): HTMLElement {
  const then = (run: () => void) => (): void => {
    run();
    close();
  };
  const black = menuButton("black", env.t("control.black"), then(() => { commands.dispatch({ type: "black" }); }), { "data-menu": "black", "aria-pressed": String(state.curtain?.kind === "black") });
  const breaks = BREAK_MINUTES.map((minutes) => menuButton("break", env.t("menu.breakMinutes", { n: minutes }), then(() => { commands.dispatch({ type: "break", minutes }); }), { "data-break": String(minutes) }));
  const row = h("div", { class: "qp-menu-tools" }, black, ...breaks);
  if (state.curtain?.kind === "break") row.append(menuButton("x", env.t("menu.breakEnd"), then(() => { commands.dispatch({ type: "uncover" }); }), { "data-break": "end" }));
  return section(env.t("menu.pause"), row, h("p", { class: "qp-menu-note" }, env.t("menu.pauseHint")));
}

/** The switch "Questions run by themselves". */
function autoSwitch({ env, state, commands }: MenuOptions): HTMLElement {
  const box = h("input", { type: "checkbox", class: "qp-switch-box", "data-auto": "" });
  box.checked = state.auto;
  box.addEventListener("change", () => { commands.dispatch({ type: "setAuto", value: box.checked }); });
  return h("div", { class: "qp-menu-option" }, h("label", { class: "qp-switch" }, box, h("span", {}, env.t("menu.auto"))), h("p", { class: "qp-menu-note" }, env.t("menu.autoHint")));
}

/** The switch "Sound when time is up" — off unless the host turns it on. */
function soundSwitch({ env, state, commands }: MenuOptions): HTMLElement {
  const box = h("input", { type: "checkbox", class: "qp-switch-box", "data-sound": "" });
  box.checked = state.sound === true;
  box.addEventListener("change", () => { commands.dispatch({ type: "setSound", value: box.checked }); });
  return h("div", { class: "qp-menu-option" }, h("label", { class: "qp-switch" }, box, h("span", {}, env.t("menu.sound"))), h("p", { class: "qp-menu-note" }, env.t("menu.soundHint")));
}

/** "Start the game again", in a part of its own at the end: it asks before any points are cleared (ui/guards.ts). */
function restartSection({ env, commands, close }: MenuOptions): HTMLElement {
  const button = menuButton("reset", env.t("menu.restart"), () => {
    close();
    commands.dispatch({ type: "restart" });
  }, { "data-restart": "", "data-danger": "" });
  return h("section", { class: "qp-menu-section qp-menu-end" }, button, h("p", { class: "qp-menu-note" }, env.t("menu.restartHint")));
}

const KEY_LINES: readonly (readonly [string, "menu.keyNext" | "menu.keyBack" | "menu.keyTimer" | "menu.keyReset" | "menu.keyClip" | "menu.keyZoom" | "menu.keyBlack" | "menu.keyMenu" | "menu.keyScores" | "menu.keyFull"])[] = [
  ["Space  →  PgDn", "menu.keyNext"], ["←  PgUp", "menu.keyBack"], ["T", "menu.keyTimer"], ["R", "menu.keyReset"], ["P", "menu.keyClip"], ["Z", "menu.keyZoom"], ["B", "menu.keyBlack"],
  ["M", "menu.keyMenu"], ["S", "menu.keyScores"], ["F", "menu.keyFull"],
];

/**
 * The content of the menu dialog.
 * @param options - the game, the commands and how to close the menu
 */
export function menuContent(options: MenuOptions): readonly HTMLElement[] {
  const { env, commands, close, isPresenting } = options;
  const then = (run: () => void) => (): void => {
    close();
    run();
  };
  const tools = h("div", { class: "qp-menu-tools" },
    menuButton("scores", env.t("control.scores"), then(commands.openScores), { "data-menu": "scores" }),
    menuButton("audience", env.t(isPresenting ? "control.closeAudience" : "control.audience"), then(commands.toggleAudience), { "data-menu": "audience" }),
    menuButton("fullscreen", env.t("control.fullscreen"), then(commands.toggleFullscreen), { "data-menu": "fullscreen" }));
  if (commands.exit) tools.append(menuButton("x", env.t("control.exit"), then(commands.exit), { "data-menu": "exit" }));
  const keys = h("dl", { class: "qp-keys" }, ...KEY_LINES.flatMap(([key, label]) => [h("dt", {}, h("kbd", {}, key)), h("dd", {}, env.t(label))]));
  return [section(env.t("menu.jump"), jumpGrid(options)), autoSwitch(options), soundSwitch(options), pauses(options), tools, section(env.t("menu.keys"), keys), restartSection(options)];
}
