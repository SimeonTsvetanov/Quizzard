// How numbers, times and sizes read in the creator. Pure, so they are unit tested; the words come
// from the translator, the number formats from `Intl` in the UI language.
import type { Lang } from "./contract.ts";
import type { Translate } from "./i18n/translate.ts";
import type { SlideLabels } from "./ui-registry.ts";

/**
 * Play time in whole minutes, rounded up — "about how long is this round".
 * @param seconds - the timers' time
 */
export function wholeMinutes(seconds: number): number {
  return Math.ceil(Math.max(0, seconds) / 60);
}

/**
 * A number as people write it in the language (a decimal comma in Bulgarian).
 * @param value - the number
 * @param lang - the UI language
 */
export function numberText(value: number, lang: Lang): string {
  return new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(value);
}

/**
 * Reads a number someone typed, with a dot or a comma; `null` for anything else.
 * @param text - the field's value
 */
export function parseNumber(text: string): number | null {
  const cleaned = text.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  return Number(cleaned);
}

/** 1024-based, like core's limits (15 MB = 15 × 1024 × 1024 bytes): a limit reads as the round number it is. */
const BYTE_UNITS = [["megabyte", 1024 * 1024], ["kilobyte", 1024]] as const;

/**
 * A size on the device, like the shell's Settings writes it: "1.2 MB", "3 kB".
 * @param bytes - the size
 * @param lang - the UI language
 */
export function bytesText(bytes: number, lang: Lang): string {
  const [unit, size] = BYTE_UNITS.find(([, unitSize]) => bytes >= unitSize) ?? BYTE_UNITS[1];
  return new Intl.NumberFormat(lang, { style: "unit", unit, maximumFractionDigits: 1 }).format(bytes / size);
}

/**
 * When a quiz was last changed: the time for today, else the date.
 * @param iso - the stored time (ISO 8601); anything unreadable gives ""
 * @param lang - the UI language
 * @param now - the current time (tests pass their own)
 */
export function changedText(iso: string, lang: Lang, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const isToday = date.toDateString() === now.toDateString();
  return new Intl.DateTimeFormat(lang, isToday ? { hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short", year: "numeric" }).format(date);
}

/**
 * A stored time as a date with its time of day, e.g. "23 Nov 2026, 14:05" — two of them can be compared.
 * @param iso - the stored time (ISO 8601); anything unreadable gives ""
 * @param lang - the UI language
 */
export function dateTimeText(iso: string, lang: Lang): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(lang, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

/**
 * The words of a slide in the UI language.
 * @param t - the translator
 * @param lang - the UI language, for the numbers
 */
export function slideLabels(t: Translate, lang: Lang): SlideLabels {
  return {
    trueText: t("trueFalse.true"),
    falseText: t("trueFalse.false"),
    seconds: (count) => t("unit.seconds", { n: numberText(count, lang) }),
    points: (count) => t("unit.points", { count, n: numberText(count, lang) }),
    emptyPrompt: t("slide.emptyPrompt"),
    emptyAnswer: t("slide.emptyAnswer"),
    answer: t("slide.answer"),
    unsupported: t("slide.unsupported"),
    round: t("slide.round"),
    of: (now, total) => t("slide.of", { n: now, total }),
    media: { missing: t("slide.noFile"), zoom: t("slide.zoom"), play: t("slide.play"), pause: t("slide.pause"), restart: t("slide.restart"), tapToPlay: t("slide.tap") },
    special: {
      write: (count) => t("slide.write", { count }),
      over: (count) => t("slide.over", { count }),
      accepted: t("slide.accepted"),
      more: (count) => t("slide.more", { n: numberText(count, lang) }),
      oneDigit: t("slide.oneDigit"),
      codeDigit: (n) => t("slide.codeDigit", { n }),
      pyramid: (n, total) => t("slide.pyramid", { n, total }),
      safe: (n, total) => t("slide.safe", { n, total }),
    },
  };
}
