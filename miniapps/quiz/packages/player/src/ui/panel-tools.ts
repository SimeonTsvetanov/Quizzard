// The host panel's own tools: the timer with its buttons, and every team's points per round as
// fields (the scores table of ui/scoreboard.ts), so the host starts the time and corrects a number
// without leaving the panel (Moni 2026-11-25).
import { roundIds } from "../game/scores.ts";
import { BREAK_MINUTES } from "../game/state.ts";
import { h } from "../render/h.ts";
import type { PlayEnv } from "../views/context.ts";
import { barButton, setFace } from "./bar.ts";
import type { Commands } from "./commands.ts";
import type { PanelCard } from "./panel-media.ts";
import { createScoreboard, type Scoreboard } from "./scoreboard.ts";

/** The timer as the host reads it: m:ss. */
function clockText(leftMs: number): string {
  const seconds = Math.ceil(leftMs / 1000);
  return `${String(Math.floor(seconds / 60))}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * Creates the timer card: the time left, start or pause, and from the start.
 * @param env - the game's fixed parts
 * @param commands - what its buttons do
 */
export function createTimerCard(env: PlayEnv, commands: Commands): PanelCard {
  const { t } = env;
  const clock = h("p", { class: "qp-host-clock", "data-host-clock": "" });
  const toggle = barButton("play", t("control.start"), () => { commands.dispatch({ type: "timerToggle" }); }, { "data-control": "host-timer", "data-words": "" });
  const reset = barButton("reset", t("control.reset"), () => { commands.dispatch({ type: "timerReset" }); }, { "data-control": "host-reset" });
  const buttons = h("div", { class: "qp-bar-group" }, toggle, reset);
  const element = h("section", { class: "qp-card", "data-card": "timer" }, h("h3", { class: "qp-card-title" }, t("host.timer")), clock, buttons);
  return {
    element,
    update(state) {
      const hasTimer = state.timer.totalMs > 0;
      const isRunning = state.timer.status === "running" || state.timer.status === "cue";
      clock.textContent = hasTimer ? clockText(state.timer.leftMs) : t("host.noTimer");
      clock.setAttribute("data-status", hasTimer ? state.timer.status : "none");
      buttons.hidden = !hasTimer;
      setFace(toggle, isRunning ? "pause" : "play", t(isRunning ? "control.pause" : "control.start"));
    },
  };
}

/**
 * Creates the break card: start a break of 5, 10 or 15 minutes at any time; while one runs, its time,
 * pause or resume, and end it.
 * @param env - the game's fixed parts
 * @param commands - what its buttons do
 */
export function createBreakCard(env: PlayEnv, commands: Commands): PanelCard {
  const { t } = env;
  const starts = h("div", { class: "qp-bar-group qp-host-breaks" }, ...BREAK_MINUTES.map((minutes) =>
    barButton("break", t("break.minutes", { n: minutes }), () => { commands.dispatch({ type: "break", minutes }); }, { "data-host-break": String(minutes), "data-words": "" })));
  const clock = h("p", { class: "qp-host-clock", "data-host-break-clock": "" });
  const toggle = barButton("pause", t("host.breakPause"), () => { commands.dispatch({ type: "breakToggle" }); }, { "data-host-break": "toggle", "data-words": "" });
  const end = barButton("x", t("menu.breakEnd"), () => { commands.dispatch({ type: "uncover" }); }, { "data-host-break": "end", "data-words": "" });
  const running = h("div", { class: "qp-bar-group" }, toggle, end);
  const element = h("section", { class: "qp-card", "data-card": "break" }, h("h3", { class: "qp-card-title" }, t("break.title")), clock, starts, running);
  return {
    element,
    update(state) {
      const cover = state.curtain?.kind === "break" ? state.curtain : null;
      const isPaused = cover?.paused === true;
      starts.hidden = cover !== null;
      running.hidden = cover === null;
      clock.hidden = cover === null;
      if (cover === null) return;
      clock.textContent = clockText(cover.leftMs);
      clock.setAttribute("data-status", isPaused ? "paused" : "running");
      toggle.hidden = cover.leftMs === 0;
      setFace(toggle, isPaused ? "play" : "pause", t(isPaused ? "host.breakResume" : "host.breakPause"));
    },
  };
}

/**
 * Creates the scores card: the table is built again when the teams or the rounds change, and
 * brought up to date otherwise — a field the host is typing in keeps what is typed.
 * @param env - the game's fixed parts
 */
export function createScoresCard(env: PlayEnv): PanelCard {
  const { t } = env;
  const element = h("section", { class: "qp-card qp-host-scores", "data-card": "scores" }, h("h3", { class: "qp-card-title" }, t("scores.title")));
  let drawn: { key: string; board: Scoreboard } | null = null;
  return {
    element,
    update(state) {
      const key = JSON.stringify([state.teams.map((team) => [team.id, team.name]), roundIds(state)]);
      element.hidden = state.teams.length === 0;
      if (drawn?.key === key) {
        drawn.board.sync(state);
        return;
      }
      drawn?.board.element.remove();
      const board = createScoreboard(env, state);
      element.append(board.element);
      drawn = { key, board };
    },
  };
}
