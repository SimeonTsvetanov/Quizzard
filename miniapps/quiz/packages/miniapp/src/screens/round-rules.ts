// The rules text a special round starts with names its numbers — the Safe's bonus, the two prizes and the
// time of "Make the quizmaster laugh", the most points of a free game. It is the host's text to change, but
// while it is still the text the round was given, it follows those numbers (Moni 2026-11-26: the stage said
// "3 points for first place" after the prize was set to 4). A text the host rewrote is left alone.
import { type Quiz, type Registries, type Round, laughPrizes, safeBonus, setRoundRules, shapeOf, taskPoints } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import type { Lang } from "../contract.ts";
import { type TextKey, type Translate, createTranslator, loadLanguage } from "../i18n/translate.ts";
import { roundKindUis } from "../round-kinds-ui.ts";

const LANGS: readonly Lang[] = ["en", "bg"];
/** The numbers a rules text may name; each stands in the pattern as "any number". */
const NAMES = ["bonus", "first", "second", "points", "minutes"] as const;

/** Stands where a number goes while the pattern is built: three signs no rules text has in a row. */
const MARK = "§¤§";

/** The numbers of a round, as its rules text names them. */
function valuesOf(round: Round, lang: Lang): Record<(typeof NAMES)[number], string | number> {
  return { bonus: safeBonus(round), ...laughPrizes(round), points: taskPoints(round), minutes: (round.defaults.seconds / 60).toLocaleString(lang, { maximumFractionDigits: 1 }) };
}

/**
 * The rules text a special round is given, with the round's own numbers, in a language; `undefined` for a
 * round whose kind has none (a standard round).
 * @param round - the round
 * @param lang - the language the quiz is played in
 * @param registries - the round kinds
 */
export async function givenRules(round: Round, lang: Lang, registries: Registries): Promise<string | undefined> {
  const key = shapeOf(round, registries) ? roundKindUis.get(round.kind)?.rules : undefined;
  if (key === undefined) return undefined;
  await loadLanguage(lang);
  return createTranslator(lang)(key, valuesOf(round, lang));
}

/** Whether a text is the kind's rules text in a language, with any numbers in it. */
function isGiven(text: string, key: TextKey, words: Translate): boolean {
  // Each number is written as a mark no text has, the rest is taken literally, then the marks become "a number".
  const marked = words(key, Object.fromEntries(NAMES.map((name, index) => [name, `${MARK}${String(index)}${MARK}`])));
  const pattern = marked.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replaceAll(new RegExp(`${MARK}\\d${MARK}`, "g"), "\\d+(?:[.,]\\d+)?");
  return new RegExp(`^${pattern}$`, "u").test(text.trim());
}

/**
 * The quiz with every special round's untouched rules text brought in step with the round's numbers.
 * @param app - the mounted creator
 * @param quiz - the quiz
 * @returns the same quiz when nothing had to change
 */
export async function withFreshRules(app: App, quiz: Quiz): Promise<Quiz> {
  await Promise.all(LANGS.map(loadLanguage));
  let next = quiz;
  for (const round of quiz.rounds) {
    const key = shapeOf(round, app.env.registries) ? roundKindUis.get(round.kind)?.rules : undefined;
    const text = round.rules ?? "";
    if (key === undefined || text.trim() === "") continue;
    for (const lang of LANGS) {
      const words = createTranslator(lang);
      if (!isGiven(text, key, words)) continue;
      const fresh = words(key, valuesOf(round, lang));
      if (fresh !== text) next = setRoundRules(next, round.id, fresh);
      break;
    }
  }
  return next;
}

/**
 * Brings the open quiz's given rules texts in step and shows the open round's new text in its field.
 * @param app - the mounted creator
 * @param roundId - the round whose settings are on screen
 */
export async function syncRules(app: App, roundId: string): Promise<void> {
  const before = app.current?.quiz;
  if (!before) return;
  const next = await withFreshRules(app, before);
  if (app.signal.aborted || app.current?.quiz !== before || next === before || !app.change(next)) return;
  const text = next.rounds.find((round) => round.id === roundId)?.rules;
  const field = app.host.querySelector<HTMLTextAreaElement>(`[data-round="${CSS.escape(roundId)}"] [data-round-rules]`);
  if (field && text !== undefined) field.value = text;
}
