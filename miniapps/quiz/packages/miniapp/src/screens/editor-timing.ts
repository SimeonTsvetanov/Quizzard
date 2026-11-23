// "Time and points" of one question (SPEC F5, AC2): each shows the round's value with the tag "from
// the round" until it is changed here; then the question keeps its own and a button leads back to
// the round's. The tag and the button share one line, so nothing moves when they swap.
import { type Question, type Quiz, type Round, effectivePoints, effectiveSeconds, findQuestion, setQuestionPoints, setQuestionSeconds } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { h } from "../dom/h.ts";
import { icon } from "../dom/icons.ts";
import { slideLabels } from "../format.ts";
import { pointsText } from "../render/slide.ts";
import { pointsFields, secondsField } from "./value-fields.ts";

/** The line under a value: "from the round", or the way back to the round's value. */
interface Origin {
  readonly element: HTMLElement;
  show(isOwn: boolean, roundValue: string): void;
}

function origin(app: App, hook: string, onReset: () => void): Origin {
  const tag = h("span", { class: "quiz-from-round", [`data-${hook}-from-round`]: "" }, app.t("timing.fromRound"));
  const words = h("span", {});
  const reset = h("button", { type: "button", class: "quiz-reset", [`data-${hook}-reset`]: "" }, icon("reset", 16), words);
  reset.addEventListener("click", onReset);
  return {
    element: h("div", { class: "quiz-origin" }, tag, reset),
    show(isOwn, roundValue) {
      tag.hidden = isOwn;
      reset.hidden = !isOwn;
      words.textContent = app.t("timing.useRound", { value: roundValue });
    },
  };
}

/**
 * Draws the time and points of a question.
 * @param app - the mounted creator
 * @param questionId - the question being edited
 * @param onChange - called after every change, to redraw the live preview
 */
export function timingFields(app: App, questionId: string, onChange: () => void): HTMLElement {
  const { t } = app;
  const labels = slideLabels(t, app.lang);
  const place = (): { quiz: Quiz; round: Round; question: Question } | undefined => {
    const quiz = app.current?.quiz;
    const found = quiz ? findQuestion(quiz, questionId) : undefined;
    return quiz && found ? { quiz, round: found.round, question: found.question } : undefined;
  };
  const start = place();
  if (!start) return h("div");
  const edit = (change: (quiz: Quiz) => Quiz): void => {
    const now = place();
    if (now && app.change(change(now.quiz))) onChange();
    sync();
  };
  const time = secondsField(app, t("timing.time"), effectiveSeconds(start.round, start.question), (seconds) => { edit((quiz) => setQuestionSeconds(quiz, questionId, seconds)); });
  const points = pointsFields(app, t("timing.points"), effectivePoints(start.round, start.question), (value) => { edit((quiz) => setQuestionPoints(quiz, questionId, value)); });
  const timeOrigin = origin(app, "time", () => {
    edit((quiz) => setQuestionSeconds(quiz, questionId, undefined));
    const now = place();
    if (now) time.set(now.round.defaults.seconds);
  });
  const pointsOrigin = origin(app, "points", () => {
    edit((quiz) => setQuestionPoints(quiz, questionId, undefined));
    const now = place();
    if (now) points.set(now.round.defaults.points);
  });
  function sync(): void {
    const now = place();
    if (!now) return;
    timeOrigin.show(now.question.seconds !== undefined, labels.seconds(now.round.defaults.seconds));
    pointsOrigin.show(now.question.points !== undefined, pointsText(now.round.defaults.points, labels));
  }
  sync();
  return h("div", { class: "quiz-timing" },
    h("div", { class: "quiz-group", "data-timing": "time" }, h("span", { class: "quiz-label" }, t("timing.time")), time.element, timeOrigin.element),
    h("div", { class: "quiz-group", "data-timing": "points" }, h("span", { class: "quiz-label" }, t("timing.points")), points.element, pointsOrigin.element, h("p", { class: "quiz-hint" }, t("points.hint"))));
}
