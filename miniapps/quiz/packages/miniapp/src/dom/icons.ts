// The body's Lucide icons (ISC): inline SVG, stroke 1.75, currentColor, aria-hidden. Only the marks
// the creator shows are bundled.
import {
  ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, CircleQuestionMark, Copy, Download, Eye, FileDown, FolderOpen, GalleryVerticalEnd, Image, Lightbulb,
  ListChecks, Minus, Music, Pencil, PenLine, Play, Plus, Replace, RotateCcw, Share2, SlidersHorizontal, Star, Timer, ToggleLeft, Trash2, TriangleAlert, Type, Video,
  X, createElement, type IconNode,
} from "lucide";

const ICONS = {
  alert: TriangleAlert, audio: Music, check: Check, choice: ListChecks, copy: Copy, deck: GalleryVerticalEnd, down: ArrowDown, download: Download,
  eye: Eye, file: FileDown, folder: FolderOpen, replace: Replace, share: Share2, hint: Lightbulb, left: ChevronLeft, minus: Minus, open: PenLine, pencil: Pencil, picture: Image, play: Play, plus: Plus, points: Star, reset: RotateCcw,
  right: ChevronRight, settings: SlidersHorizontal, text: Type, time: Timer, trash: Trash2, trueFalse: ToggleLeft, unknown: CircleQuestionMark,
  up: ArrowUp, video: Video, x: X,
} satisfies Record<string, IconNode>;

/** A mark the body can draw. */
export type IconName = keyof typeof ICONS;

/**
 * Returns the SVG element of an icon.
 * @param name - the mark
 * @param size - width and height in px (20 by default); the slide passes `1em` sized marks through CSS instead
 */
export function icon(name: IconName, size = 20): SVGElement {
  return createElement(ICONS[name], { width: size, height: size, "stroke-width": 1.75, "aria-hidden": "true" });
}
