// The question asked before a quiz with unfinished questions is played or exported (lazy: loaded
// when it is first needed): the unfinished questions as a list — each opens its editor — with
// "Cancel" first and the way on ("Play anyway", "Export anyway").
import type { Unfinished } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { openSheet } from "../dom/sheet.ts";
import type { Launch } from "./launch.ts";

/** The longest list shown; the rest is said as a number. */
const MAX_LISTED = 12;

/**
 * Asks whether to go on with unfinished questions.
 * @param app - the mounted creator
 * @param list - the unfinished questions, in play order
 * @param what - playing or exporting
 * @param go - called when the person goes on anyway
 */
export function askUnfinished(app: App, list: readonly Unfinished[], what: Launch, go: () => void): void {
  const { t } = app;
  const quizId = app.current?.quiz.id ?? "";
  const summary = (item: Unfinished): string => app.env.registries.kinds.get(item.question.kind)?.summary(item.question) ?? "";
  const items = list.slice(0, MAX_LISTED).map((item) => ({
    label: t("unfinished.where", { round: item.round.name, n: item.index + 1 }),
    detail: summary(item) === "" ? t("unfinished.empty") : summary(item),
    icon: "open" as const,
    hook: "data-unfinished-item",
    run: (): undefined => {
      app.view.drafts.clear();
      app.go({ screen: "editor", quiz: quizId, question: item.question.id });
      return undefined;
    },
  }));
  const more = list.length > MAX_LISTED ? ` ${t("unfinished.more", { count: list.length - MAX_LISTED })}` : "";
  openSheet({
    host: app.host,
    title: t("unfinished.title", { count: list.length }),
    text: `${t(`unfinished.text.${what}`)}${more}`,
    items,
    closeLabel: t("menu.close"),
    actions: [
      { label: t("cancel"), hook: "data-unfinished-cancel", run: () => undefined },
      { label: t(`unfinished.go.${what}`), hook: "data-unfinished-go", isPrimary: true, run: () => { go(); return undefined; } },
    ],
  });
}
