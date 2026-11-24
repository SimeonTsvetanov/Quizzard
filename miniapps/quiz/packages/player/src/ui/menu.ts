// The menu (M): jump to the start, any round or the result; whether questions run by themselves;
// the tools; starting again; and the keys.
import { roundStart } from "../game/create.ts";
import type { GameState } from "../game/state.ts";
import { h } from "../render/h.ts";
import { icon, type StageIcon } from "../render/icons.ts";
import type { PlayEnv } from "../views/context.ts";
import type { Commands } from "./commands.ts";

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

/** "Go to": the start, every round that has questions, the result. The place the game is in is marked. */
function jumpList({ env, state, commands, close }: MenuOptions): HTMLElement {
  const here = state.screens[state.index];
  const go = (index: number): void => {
    commands.dispatch({ type: "jump", index });
    close();
  };
  const rounds = env.file.quiz.rounds.filter((round) => roundStart(state, round.id) !== -1).map((round, index) => {
    const button = menuButton(null, `${String(index + 1)} · ${round.name}`, () => { go(roundStart(state, round.id)); }, { "data-jump-round": round.id });
    if (here?.roundId === round.id) button.setAttribute("aria-current", "true");
    return h("li", {}, button);
  });
  return h("ol", { class: "qp-menu-list" },
    h("li", {}, menuButton(null, env.t("menu.start"), () => { go(0); }, { "data-jump": "start" })),
    ...rounds,
    h("li", {}, menuButton(null, env.t("menu.end"), () => { go(state.screens.length - 1); }, { "data-jump": "end" })));
}

/** The switch "Questions run by themselves". */
function autoSwitch({ env, state, commands }: MenuOptions): HTMLElement {
  const box = h("input", { type: "checkbox", class: "qp-switch-box", "data-auto": "" });
  box.checked = state.auto;
  box.addEventListener("change", () => { commands.dispatch({ type: "setAuto", value: box.checked }); });
  return h("div", { class: "qp-menu-option" }, h("label", { class: "qp-switch" }, box, h("span", {}, env.t("menu.auto"))), h("p", { class: "qp-menu-note" }, env.t("menu.autoHint")));
}

/** "Start the game again": the first press asks, the second does it. */
function restartButton({ env, commands, close }: MenuOptions): HTMLButtonElement {
  let isAsked = false;
  const button = menuButton("reset", env.t("menu.restart"), () => {
    if (!isAsked) {
      isAsked = true;
      button.setAttribute("data-danger", "");
      button.lastElementChild?.replaceChildren(env.t("menu.restartConfirm"));
      return;
    }
    commands.dispatch({ type: "restart" });
    close();
  }, { "data-restart": "" });
  return button;
}

const KEY_LINES: readonly (readonly [string, "menu.keyNext" | "menu.keyBack" | "menu.keyTimer" | "menu.keyReset" | "menu.keyMenu" | "menu.keyScores" | "menu.keyFull"])[] = [
  ["Space  →", "menu.keyNext"], ["←", "menu.keyBack"], ["T", "menu.keyTimer"], ["R", "menu.keyReset"], ["M", "menu.keyMenu"], ["S", "menu.keyScores"], ["F", "menu.keyFull"],
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
    menuButton("fullscreen", env.t("control.fullscreen"), then(commands.toggleFullscreen), { "data-menu": "fullscreen" }),
    restartButton(options));
  if (commands.exit) tools.append(menuButton("x", env.t("control.exit"), then(commands.exit), { "data-menu": "exit" }));
  const keys = h("dl", { class: "qp-keys" }, ...KEY_LINES.flatMap(([key, label]) => [h("dt", {}, h("kbd", {}, key)), h("dd", {}, env.t(label))]));
  return [section(env.t("menu.jump"), jumpList(options)), autoSwitch(options), tools, section(env.t("menu.keys"), keys)];
}
