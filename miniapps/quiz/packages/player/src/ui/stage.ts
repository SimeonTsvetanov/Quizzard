// The stage: what the room sees. It fills the box it is given and scales like a slide — the canvas
// has a fixed design size (1600 × 900 on a 16:9 screen; wider, taller or, on an upright phone,
// narrower with larger type) and is scaled as a whole to the box, so every screen keeps its
// proportions on a projector, a laptop or a phone. It shows the view of the game's screen (looked
// up in the views registry), the timer dial and the cue between questions.
import { CUE_MS, type GameState } from "../game/state.ts";
import { h } from "../render/h.ts";
import { contextOf, type DrawnView, type PlayEnv } from "../views/context.ts";
import { fallbackView } from "../views/index.ts";
import { createDial } from "./dial.ts";

/** The canvas of a box: its design size and which layout it gets. */
export interface Design {
  readonly width: number;
  readonly height: number;
  /** `wide` = the slide layout; `tall` = an upright screen: one column, larger type. */
  readonly shape: "wide" | "tall";
}

const WIDE_HEIGHT = 900;
const WIDE_WIDTH = 1600;
/** Below this width-to-height ratio the box is laid out as an upright screen. */
const TALL_BELOW = 1.2;
const TALL_WIDTH = 820;
const SQUARE_WIDTH = 1300;
const PHONE_RATIO = 0.75;

/**
 * The design size of a box: 1600 × 900 at 16:9, wider or taller as the box is, and for an upright
 * box a narrower canvas, so the type is larger against the screen.
 * @param width - the box's width in px
 * @param height - the box's height in px
 */
export function designOf(width: number, height: number): Design {
  const ratio = width > 0 && height > 0 ? width / height : WIDE_WIDTH / WIDE_HEIGHT;
  if (ratio >= TALL_BELOW) {
    const designWidth = Math.max(WIDE_WIDTH, WIDE_HEIGHT * ratio);
    return { width: designWidth, height: designWidth / ratio, shape: "wide" };
  }
  const between = Math.min(1, Math.max(0, (ratio - PHONE_RATIO) / (TALL_BELOW - PHONE_RATIO)));
  const designWidth = TALL_WIDTH + between * (SQUARE_WIDTH - TALL_WIDTH);
  return { width: designWidth, height: designWidth / ratio, shape: "tall" };
}

/** A stage. */
export interface Stage {
  readonly element: HTMLElement;
  /** Shows a game: draws its screen's view, or brings the one on show up to date. */
  show(state: GameState): void;
  destroy(): void;
}

/** Inputs of {@link createStage}. */
export interface StageOptions {
  /** `true` = the views carry their controls (the host plays in this window). */
  readonly canEdit: boolean;
  /** `false` = a small preview: no dial, no cue, nothing focusable. */
  readonly isLive: boolean;
}

/** The cue between questions: "Time is up" and, when the game moves on by itself, what comes. */
function showCue(cue: HTMLElement, env: PlayEnv, state: GameState): void {
  const { status, cueMs } = state.timer;
  const isShown = status === "cue" || status === "done";
  cue.hidden = !isShown;
  if (!isShown) return;
  const comes = (state.screens[state.index + 1]?.seconds ?? 0) > 0 ? env.t("stage.nextCue") : env.t("stage.endCue");
  cue.firstElementChild?.replaceChildren(status === "cue" ? `${env.t("stage.timeUp")} · ${comes}` : env.t("stage.timeUp"));
  cue.style.setProperty("--qp-cue", String(status === "cue" ? 1 - cueMs / CUE_MS : 0));
  cue.setAttribute("data-status", status);
}

/** Below this scale a 44 px control takes so much of the canvas that the views switch to their compact layouts. */
const COMPACT_BELOW = 0.46;

/** Fits the canvas to its box. */
function fit(element: HTMLElement, canvas: HTMLElement): void {
  const { width, height } = element.getBoundingClientRect();
  if (width === 0 || height === 0) return;
  const design = designOf(width, height);
  const scale = width / design.width;
  canvas.style.width = `${String(design.width)}px`;
  canvas.style.height = `${String(design.height)}px`;
  canvas.style.transform = `scale(${String(scale)})`;
  // A control on the stage is never smaller than 44 px on the real screen.
  canvas.style.setProperty("--qp-touch", `${String(Math.ceil(44 / scale))}px`);
  element.setAttribute("data-shape", design.shape);
  element.toggleAttribute("data-compact", scale < COMPACT_BELOW);
}

/**
 * Creates a stage.
 * @param env - the game's fixed parts
 * @param options - whether it carries controls and whether it is the live one
 */
export function createStage(env: PlayEnv, { canEdit, isLive }: StageOptions): Stage {
  const cue = h("div", { class: "qp-cue", role: "status" }, h("span", { class: "qp-cue-text" }), h("span", { class: "qp-cue-bar", "aria-hidden": "true" }));
  cue.hidden = true;
  const canvas = h("div", { class: "qp-canvas" });
  const element = h("div", { class: "qp-stage", role: "region", "aria-label": env.t("stage.label"), "data-stage": isLive ? "live" : "preview" }, canvas);
  if (!isLive) element.inert = true;
  const dial = isLive ? createDial(env.t) : null;
  let drawn: { key: string; index: number; view: DrawnView } | null = null;
  const observer = new ResizeObserver(() => {
    fit(element, canvas);
    drawn?.view.layout?.();
  });
  observer.observe(element);
  return {
    element,
    show(state) {
      const context = contextOf(env, state, { canEdit, clock: dial && (state.screens[state.index]?.seconds ?? 0) > 0 ? dial.element : null });
      const entry = env.views.get(context.screen.screen) ?? fallbackView;
      const key = `${String(state.index)}:${String(state.step)}:${entry.structure?.(state) ?? ""}`;
      dial?.update(state.timer);
      if (drawn?.key === key) {
        drawn.view.sync?.(state);
      } else {
        const focused = element.contains(document.activeElement) ? document.activeElement?.getAttribute("data-focus") : null;
        const view = entry.stage(context);
        // Only a new screen comes in with its entrance; a redraw of the same one does not replay it.
        view.element.toggleAttribute("data-enter", drawn?.index !== state.index);
        canvas.replaceChildren(view.element, cue);
        if (focused != null) canvas.querySelector<HTMLElement>(`[data-focus="${CSS.escape(focused)}"]`)?.focus();
        drawn = { key, index: state.index, view };
        fit(element, canvas);
        view.layout?.();
      }
      if (isLive) showCue(cue, env, state);
    },
    destroy() { observer.disconnect(); },
  };
}
