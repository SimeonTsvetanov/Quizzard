// The body's Lucide icons (ISC): inline SVG, stroke 1.75, currentColor, aria-hidden. Only the marks
// the creator shows are bundled.
import {
  ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpToLine, Check, ChevronLeft, ChevronRight, CircleQuestionMark, Copy, Download, Eye, FileDown, Ellipsis, FolderOpen, GalleryVerticalEnd, GripVertical, Image, Layers, LayoutGrid, Lightbulb, List, Printer, Search,
  Dices, Hash, Laugh, ListChecks, Minus, Music, Pyramid, Vault, Pencil, PenLine, Play, Plus, Replace, RotateCcw, Scissors, Share2, SlidersHorizontal, Star, Timer, ToggleLeft, Trash2, TriangleAlert, Type, Video,
  X, createElement, type IconNode,
} from "lucide";

const ICONS = {
  alert: TriangleAlert, audio: Music, bottom: ArrowDownToLine, cards: LayoutGrid, check: Check, choice: ListChecks, copy: Copy, deck: GalleryVerticalEnd, down: ArrowDown, download: Download,
  cut: Scissors, laugh: Laugh, task: Dices, eye: Eye, file: FileDown, folder: FolderOpen, grip: GripVertical, list: List, more: Ellipsis, print: Printer, round: Layers, search: Search, top: ArrowUpToLine, replace: Replace, share: Share2, hint: Lightbulb, left: ChevronLeft, minus: Minus, open: PenLine, pencil: Pencil, picture: Image, play: Play, plus: Plus, points: Star, reset: RotateCcw,
  right: ChevronRight, settings: SlidersHorizontal, text: Type, time: Timer, trash: Trash2, trueFalse: ToggleLeft, unknown: CircleQuestionMark,
  up: ArrowUp, video: Video, x: X, digit: Hash, pyramid: Pyramid, safe: Vault, standard: Layers,
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
