// "Add round" (SPEC §10): a sheet with one card per round kind — Standard, Golden pyramid, Safe — each
// with its icon and one sentence. A special round arrives ready-made: its questions, its answer type,
// its points and time, and its rules text in the quiz's language. Loaded with the first press.
import { addRoundOfKind, safeBonus } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import type { Lang } from "../contract.ts";
import { openSheet } from "../dom/sheet.ts";
import { createTranslator, loadLanguage } from "../i18n/translate.ts";
import { type RoundKindUi, roundKindUis } from "../round-kinds-ui.ts";
import { openRound } from "./round-moves.ts";

/** The quiz's language when the creator has its words, else the one on show. */
function quizLang(app: App, language: string): Lang {
  return language === "en" || language === "bg" ? language : app.lang;
}

/** Adds a round of a kind, named and with its rules in the quiz's language, and opens it. */
async function add(app: App, kind: RoundKindUi): Promise<void> {
  const before = app.current?.quiz;
  if (!before) return;
  const lang = quizLang(app, before.language);
  await loadLanguage(lang);
  const words = createTranslator(lang);
  const quiz = app.current?.quiz;
  if (!quiz || app.signal.aborted) return;
  const isFree = kind.fixed === undefined;
  const name = isFree ? app.t("round.defaultName", { n: quiz.rounds.length + 1 }) : words(kind.label);
  // The bonus a new Safe starts with is its kind's default: the core gives it to the round.
  const draft = addRoundOfKind(quiz, { kind: kind.id, name }, app.env);
  const added = draft.rounds.at(-1);
  if (draft === quiz || !added) return;
  const rules = kind.rules === undefined ? "" : words(kind.rules, { bonus: safeBonus(added) });
  const next = rules === "" ? draft : addRoundOfKind(quiz, { kind: kind.id, name, rules }, app.env);
  const round = next.rounds.at(-1);
  if (!app.change(next) || !round) return;
  // A standard round's name is the next thing to type; a special one opens on its questions.
  app.view.selectNext = isFree;
  openRound(app, round.id, isFree ? "[data-round-name]" : undefined);
}

/**
 * Opens the chooser of a new round's kind.
 * @param app - the mounted creator
 */
export function chooseRoundKind(app: App): void {
  const { t } = app;
  const kinds = app.env.registries.rounds.list().flatMap((entry) => {
    const face = roundKindUis.get(entry.id);
    return face ? [face] : [];
  });
  openSheet({
    host: app.host,
    title: t("roundKind.title"),
    text: t("roundKind.text"),
    closeLabel: t("menu.close"),
    items: kinds.map((kind) => ({
      label: t(kind.label),
      detail: t(kind.text),
      icon: kind.icon,
      isWrapped: true,
      hook: `data-pick-${kind.id}`,
      run: () => {
        void add(app, kind);
        return undefined;
      },
    })),
  });
}
