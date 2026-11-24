// The words of a refused file (AC5): which file, what it is — its format or its size — and what is
// allowed. Pure, so every refusal's wording is unit tested.
import { MEDIA_RULES, QUIZ_MEDIA_MAX_BYTES, type MediaType } from "@simeonts/quizzard-quiz-core";
import type { Lang } from "../contract.ts";
import { bytesText } from "../format.ts";
import type { Translate } from "../i18n/translate.ts";

/** What the message is made from (the lazy importer's `MediaRefusal` fits). */
export interface Refused {
  readonly reason: "format" | "too-big" | "quiz-full" | "unplayable" | "no-space";
  readonly type: MediaType;
  readonly name: string;
  readonly bytes: number;
  readonly mime: string;
}

/**
 * A file's format as people call it: the ending of its name in capitals ("HEIC", "WAV"), else the
 * second half of its MIME type, else nothing.
 * @param name - the file's name
 * @param mime - its MIME type
 */
export function formatName(name: string, mime: string): string {
  const ending = /\.([a-z0-9]{1,5})$/i.exec(name.trim())?.[1];
  if (ending !== undefined) return ending.toUpperCase();
  return (mime.split("/")[1] ?? "").replace(/^x-/, "").toUpperCase();
}

/**
 * The message for a refused file.
 * @param t - the translator
 * @param lang - the UI language, for the sizes
 * @param refused - the refusal
 * @param usedBytes - media the quiz already uses
 */
export function refusalText(t: Translate, lang: Lang, refused: Refused, usedBytes: number): string {
  const { type, name } = refused;
  const size = bytesText(refused.bytes, lang);
  const accepted = t(`media.formats.${type}`);
  const format = formatName(name, refused.mime);
  const texts: Readonly<Record<Refused["reason"], () => string>> = {
    // iPhones save photos as HEIC: the message says what to do about it.
    format: () => (/hei[cf]/i.test(`${refused.mime} ${format}`) ? t("media.refused.heic", { name, accepted }) : t(format === "" ? "media.refused.unknown" : "media.refused.format", { name, format, accepted })),
    "too-big": () => t("media.refused.tooBig", { name, size, limit: bytesText(MEDIA_RULES[type].maxBytes, lang) }),
    "quiz-full": () => t("media.refused.quizFull", { name, size, used: bytesText(usedBytes, lang), limit: bytesText(QUIZ_MEDIA_MAX_BYTES, lang) }),
    unplayable: () => t("media.refused.unplayable", { name, accepted }),
    "no-space": () => t("media.refused.noSpace", { name, size }),
  };
  return texts[refused.reason]();
}
