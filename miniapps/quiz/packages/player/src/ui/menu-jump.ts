// "Go to" in the menu: every screen of the game as a grid of small tiles, grouped by round — the
// start, then per round its rules, its questions by number, the answers by number, score entry and
// the leaderboard, then the result. What stands on a tile comes from the screen's view (`tile`), so a
// later round kind's own screens appear here without a change. The screen the game is on is marked.
import type { GameScreen, GameState } from "../game/state.ts";
import { h } from "../render/h.ts";
import { icon } from "../render/icons.ts";
import { contextOf, type JumpTile, type PlayEnv } from "../views/context.ts";
import type { Commands } from "./commands.ts";

/** With more screens than this the rounds the game is not in are folded: the menu stays one screenful. */
const FOLD_ABOVE = 30;

/** One listed screen: where it is and what its tile says. */
interface Place {
  readonly index: number;
  readonly screen: GameScreen;
  readonly tile: JumpTile;
}

/** The screens that have a tile, with the game on each of them in turn to ask its view. */
function places(env: PlayEnv, state: GameState): readonly Place[] {
  return state.screens.flatMap((screen, index) => {
    const context = contextOf(env, { ...state, index, step: 0 }, { canEdit: false, clock: null });
    const tile = env.views.get(screen.screen)?.tile?.(context);
    return tile ? [{ index, screen, tile }] : [];
  });
}

/** Splits a list where the key changes: runs of neighbours with the same key. */
function runs<T>(items: readonly T[], keyOf: (item: T) => string): readonly (readonly T[])[] {
  const out: T[][] = [];
  let last: string | null = null;
  for (const item of items) {
    const key = keyOf(item);
    if (key === last) out.at(-1)?.push(item);
    else out.push([item]);
    last = key;
  }
  return out;
}

/** Inputs of {@link jumpGrid}. */
export interface JumpOptions {
  readonly env: PlayEnv;
  readonly state: GameState;
  readonly commands: Commands;
  /** Closes the menu after a choice. */
  readonly close: () => void;
}

function tileButton({ state, commands, close }: JumpOptions, place: Place): HTMLButtonElement {
  const isNumber = place.tile.group !== undefined;
  const ends: Readonly<Record<number, string>> = { 0: "start", [state.screens.length - 1]: "end" };
  const end = ends[place.index];
  const hooks = { "data-jump-index": String(place.index), "data-jump-screen": place.screen.screen, ...(end === undefined ? {} : { "data-jump": end }) };
  const button = h("button", { type: "button", class: "qp-tile", title: place.tile.name, ...hooks, ...(isNumber ? { "aria-label": place.tile.name } : { "data-wide": "" }) }, place.tile.mark);
  if (place.index === state.index) button.setAttribute("aria-current", "true");
  button.addEventListener("click", () => {
    commands.dispatch({ type: "jump", index: place.index });
    close();
  });
  return button;
}

/** The tiles of one part of the game: wide ones as they are, numbered ones in a row under their heading. */
function tiles(options: JumpOptions, list: readonly Place[]): HTMLElement {
  const rows = runs(list, (place) => place.tile.group ?? `#${String(place.index)}`).map((run) => {
    const group = run[0]?.tile.group;
    const buttons = run.map((place) => h("li", {}, tileButton(options, place)));
    if (group === undefined) return h("ul", { class: "qp-tiles" }, ...buttons);
    return h("div", { class: "qp-tile-run" }, h("span", { class: "qp-tile-label" }, group), h("ul", { class: "qp-tiles", "aria-label": group }, ...buttons));
  });
  return h("div", { class: "qp-tile-rows" }, ...rows);
}

/**
 * The grid of every screen.
 * @param options - the game, the commands and how to close the menu
 */
export function jumpGrid(options: JumpOptions): HTMLElement {
  const { env, state } = options;
  const rounds = env.file.quiz.rounds;
  const all = places(env, state);
  // A short game shows every screen at once; a long one only the round it is in.
  const isSmall = all.length <= FOLD_ABOVE;
  const parts = runs(all, (place) => place.screen.roundId ?? "").map((list) => {
    const roundId = list[0]?.screen.roundId;
    const round = rounds.find((candidate) => candidate.id === roundId);
    if (!round) return h("div", { class: "qp-jump-part" }, tiles(options, list));
    const isHere = state.screens[state.index]?.roundId === round.id;
    // The round's name is itself the way to its first screen.
    const name = h("button", { type: "button", class: "qp-jump-name", "data-jump-round": round.id }, `${String(rounds.filter((candidate) => candidate.questions.length > 0).indexOf(round) + 1)} · ${round.name}`);
    name.addEventListener("click", () => {
      options.commands.dispatch({ type: "jump", index: list[0]?.index ?? 0 });
      options.close();
    });
    // In a long game only the round it is in shows its screens; the others unfold on demand.
    const grid = tiles(options, list);
    const isOpen = isHere || isSmall;
    grid.hidden = !isOpen;
    const label = env.t("menu.screensOf", { round: round.name, count: list.length });
    const fold = h("button", { type: "button", class: "qp-jump-fold", "aria-expanded": String(isOpen), "aria-label": label, title: label, "data-jump-fold": round.id }, h("span", { "aria-hidden": "true" }, String(list.length)), icon("down", 18));
    fold.addEventListener("click", () => {
      grid.hidden = !grid.hidden;
      fold.setAttribute("aria-expanded", String(!grid.hidden));
    });
    return h("section", { class: "qp-jump-part", "data-jump-part": round.id, ...(isHere ? { "data-here": "" } : {}) }, h("h4", { class: "qp-jump-round" }, name, fold), grid);
  });
  return h("div", { class: "qp-jump", "data-jump-grid": "" }, ...parts);
}
