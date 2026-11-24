// The Lucide icons (ISC) of the slide and the player: inline SVG, stroke 1.75, currentColor,
// aria-hidden. Only the marks drawn here are bundled into the exported page.
import {
  ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Coffee, Crown, Eye, ImageOff, Lightbulb, ListOrdered, Maximize, Menu, Minus, MonitorOff, MonitorUp, Music, Pause,
  Play, Plus, RotateCcw, Star, Timer, Trophy, Users, X, ZoomIn, ZoomOut, createElement, type IconNode,
} from "lucide";

const ICONS = {
  audience: MonitorUp, audio: Music, black: MonitorOff, break: Coffee, check: Check, crown: Crown, down: ArrowDown, eye: Eye, fullscreen: Maximize, hint: Lightbulb,
  left: ChevronLeft, menu: Menu, minus: Minus, missing: ImageOff, pause: Pause, play: Play, plus: Plus, points: Star, reset: RotateCcw, right: ChevronRight,
  scores: ListOrdered, teams: Users, time: Timer, trophy: Trophy, up: ArrowUp, x: X, zoom: ZoomIn, zoomOut: ZoomOut,
} satisfies Record<string, IconNode>;

/** A mark the slide or the player can draw. */
export type StageIcon = keyof typeof ICONS;

/**
 * Returns the SVG element of an icon.
 * @param name - the mark
 * @param size - width and height in px (20 by default); the slide sizes its marks through CSS instead
 */
export function icon(name: StageIcon, size = 20): SVGElement {
  return createElement(ICONS[name], { width: size, height: size, "stroke-width": 1.75, "aria-hidden": "true" });
}
