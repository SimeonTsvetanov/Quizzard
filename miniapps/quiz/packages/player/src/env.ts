// Builds what stays the same for a whole game (views/context.ts `PlayEnv`): the quiz, its language's
// words, the registries and the way to make a move.
import type { QuizFile } from "@simeonts/quizzard-quiz-core/play";
import type { GameAction } from "./game/state.ts";
import { type Lang, type Translate, createTranslator, playerLang } from "./i18n/translate.ts";
import { answerSlides } from "./render/answers/index.ts";
import { kindSlides } from "./render/kinds/index.ts";
import { type SlideLabels, createStageRegistries } from "./render/registry.ts";
import type { PlayEnv } from "./views/context.ts";
import { createViews } from "./views/index.ts";

/**
 * A number as people write it in a language (a decimal comma in Bulgarian).
 * @param value - the number
 * @param lang - the language
 */
export function numberText(value: number, lang: Lang): string {
  return new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(value);
}

/**
 * The words of a slide in the player's language.
 * @param t - the translator
 * @param lang - the language, for the numbers
 */
export function stageLabels(t: Translate, lang: Lang): SlideLabels {
  return {
    trueText: t("slide.true"),
    falseText: t("slide.false"),
    seconds: (count) => t("unit.seconds", { n: numberText(count, lang) }),
    points: (count) => t("unit.points", { count, n: numberText(count, lang) }),
    emptyPrompt: t("slide.emptyPrompt"),
    emptyAnswer: t("slide.emptyAnswer"),
    answer: t("slide.answer"),
    unsupported: t("slide.unsupported"),
    round: t("round.word"),
    of: (now, total) => t("count.of", { n: now, total }),
    media: { missing: t("media.missing"), zoom: t("media.zoom"), zoomKey: "Z", play: t("media.play"), pause: t("media.pause"), restart: t("media.restart"), tapToPlay: t("media.tap") },
  };
}

/** Inputs of {@link createEnv}. */
export interface EnvOptions {
  readonly file: QuizFile;
  readonly dispatch: (action: GameAction) => void;
  readonly mediaUrl?: ((id: string) => string | null) | undefined;
}

/**
 * The fixed parts of a game of a quiz, in the quiz's language (English when the player lacks it).
 * @param options - the quiz, how a move is made and where its media files are
 */
export function createEnv({ file, dispatch, mediaUrl }: EnvOptions): PlayEnv {
  const lang = playerLang(file.quiz.language);
  const t = createTranslator(lang);
  const entries = new Map(file.media.map((entry) => [entry.id, entry]));
  return {
    file,
    entryOf: (id) => entries.get(id),
    lang,
    t,
    labels: stageLabels(t, lang),
    parts: createStageRegistries(kindSlides, answerSlides),
    views: createViews(),
    dispatch,
    number: (value) => numberText(value, lang),
    ...(mediaUrl ? { mediaUrl } : {}),
  };
}
