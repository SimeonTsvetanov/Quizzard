// The round's settings strip (SPEC F2): default time and points, what a new question starts as,
// optional rules, and the round's own actions. Closed it is one line that says what the round gives;
// changing a value never rebuilds the strip, so the caret stays where it is.
import { RULES_MAX, type Quiz, type Round, freeAnswerTypes, roundMaxPoints, setRoundDefaults, setRoundRules, shapeOf } from "@simeonts/quizzard-quiz-core";
import { applyAllRow } from "./round-apply.ts";
import type { App } from "../app/state.ts";
import { chipPicker, labelButton, textField } from "../dom/controls.ts";
import { h } from "../dom/h.ts";
import { icon } from "../dom/icons.ts";
import { slideLabels } from "../format.ts";
import { pointsText } from "../render/slide.ts";
import { answerChoices, kindChoices } from "../ui-registry.ts";
import { copyRound, removeRound } from "./round-moves.ts";
import { specialPoints } from "./round-special.ts";
import { pointsFields, secondsField } from "./value-fields.ts";

/** The open round as it is in the quiz right now (the strip outlives many edits). */
function live(app: App, roundId: string): { quiz: Quiz; round: Round } | undefined {
  const quiz = app.current?.quiz;
  const round = quiz?.rounds.find((candidate) => candidate.id === roundId);
  return quiz && round ? { quiz, round } : undefined;
}

/** "30 s · 1 point" — what the closed strip says. */
function gist(app: App, round: Round): string {
  const labels = slideLabels(app.t, app.lang);
  // A special round's points are its whole: "60 s · 10 points".
  const points = shapeOf(round, app.env.registries) ? labels.points(roundMaxPoints(round)) : pointsText(round.defaults.points, labels);
  return `${labels.seconds(round.defaults.seconds)} · ${points}`;
}

/** The pickers of what a new question starts as. */
function defaultsPickers(app: App, round: Round, onChange: () => void): HTMLElement[] {
  const { t, env, ui } = app;
  const set = (change: { questionKind?: string; answerType?: string }): void => {
    const now = live(app, round.id);
    if (now && app.change(setRoundDefaults(now.quiz, round.id, change))) onChange();
  };
  const isFixed = shapeOf(round, env.registries) !== undefined;
  return [
    chipPicker({ legend: t("round.defaultKind"), name: "quiz-round-kind", options: kindChoices(env.registries.kinds.list().map((kind) => kind.id), ui, t), value: round.defaults.questionKind, soon: t("soon"), hint: t("kind.soonHint"), onPick: (id) => { set({ questionKind: id }); } }),
    // A special round answers every question one way: no picker (SPEC §10).
    ...(isFixed ? [] : [chipPicker({ legend: t("round.defaultAnswer"), name: "quiz-round-answer", options: answerChoices(freeAnswerTypes(env.registries), ui, t), value: round.defaults.answerType, soon: t("soon"), onPick: (id) => { set({ answerType: id }); } })]),
  ];
}

/**
 * Draws the settings strip of a round.
 * @param app - the mounted creator
 * @param round - the round as it is now
 * @param onChange - called after every change that the question cards show (time, points)
 */
export function roundSettings(app: App, round: Round, onChange: () => void): HTMLElement {
  const { t } = app;
  const summaryText = h("span", { class: "quiz-settings-gist", "data-round-gist": "" }, gist(app, round));
  const changed = (): void => {
    const now = live(app, round.id);
    if (now) summaryText.textContent = gist(app, now.round);
    onChange();
  };
  const edit = (change: (quiz: Quiz) => Quiz): void => {
    const now = live(app, round.id);
    if (now && app.change(change(now.quiz))) changed();
  };
  const time = secondsField(app, t("round.time"), round.defaults.seconds, (seconds) => { edit((quiz) => setRoundDefaults(quiz, round.id, { seconds })); });
  const points = pointsFields(app, t("round.points"), round.defaults.points, (value) => { edit((quiz) => setRoundDefaults(quiz, round.id, { points: value })); });
  const rules = textField({ label: t("round.rules"), value: round.rules ?? "", max: RULES_MAX, rows: 2, placeholder: t("round.rulesPlaceholder"), onInput: (value) => { edit((quiz) => setRoundRules(quiz, round.id, value)); } });
  const copy = labelButton("copy", t("round.duplicate"), { class: "button", "data-duplicate-round": "" });
  copy.addEventListener("click", () => { copyRound(app, round.id); });
  const trash = labelButton("trash", t("round.delete"), { class: "button button--destructive", "data-delete-round": "" });
  trash.addEventListener("click", () => { void removeRound(app, round.id); });
  const strip = h("details", { class: "quiz-settings quiz-panel", "data-round-settings": "" },
    h("summary", { class: "quiz-settings-summary" }, icon("settings", 20), h("span", { class: "quiz-settings-name" }, t("round.settings")), summaryText),
    h("div", { class: "quiz-settings-body" },
      h("div", { class: "quiz-group" }, h("span", { class: "quiz-label" }, t("round.time")), time.element),
      ...(specialPoints(app, round, changed) ?? [h("div", { class: "quiz-group" }, h("span", { class: "quiz-label" }, t("round.points")), points.element, h("p", { class: "quiz-hint" }, t("points.hint")))]),
      applyAllRow(app, round.id, () => gist(app, live(app, round.id)?.round ?? round), changed),
      ...defaultsPickers(app, round, changed),
      rules,
      h("div", { class: "quiz-settings-actions" }, copy, trash)));
  strip.open = app.view.isSettingsOpen;
  strip.addEventListener("toggle", () => { app.view.isSettingsOpen = strip.open; });
  return strip;
}
