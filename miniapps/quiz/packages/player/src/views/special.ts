// What the special rounds (SPEC §10) add to the player's own screens, by round kind: the picture and
// the short rules of the round's opening, the lines of the points guide, the words of the score
// entry and what stands under the round's list of answers (the Safe's code). The views ask this
// registry by the round's kind and never switch on it; a standard round has no entry.
import { type Registry, type RegistryEntry, type Round, createRegistry, laughPrizes, pyramidAsks, safeBonus, safeCode, taskPoints } from "@simeonts/quizzard-quiz-core/play";
import { h } from "../render/h.ts";
import { pyramidFigure } from "../render/rounds/pyramid.ts";
import { vaultFigure } from "../render/rounds/vault.ts";
import type { PlayEnv } from "./context.ts";

/** One line of the points guide: what, and what it is worth. */
export interface GuideLine {
  readonly label: string;
  readonly text: string;
}

/** The words of a team's score entry. */
export interface EntryWords {
  readonly label: string;
  readonly less: string;
  readonly more: string;
}

/** A special round kind in the player. */
export interface RoundStage extends RegistryEntry {
  /** The picture of the round's opening: how it scores, with a short animation. */
  figure(env: PlayEnv, round: Round): HTMLElement;
  /** The rules in short lines beside the picture. */
  rules(env: PlayEnv, round: Round): readonly string[];
  /** The points guide's lines. */
  guide(env: PlayEnv, round: Round): readonly GuideLine[];
  /** The score entry's words when the host enters something else than points; left out = points. */
  entry?(env: PlayEnv, team: string): EntryWords;
  /** What stands under the round's list of answers; left out = nothing. */
  recap?(env: PlayEnv, round: Round): HTMLElement | null;
}

/** The Golden pyramid: its tiers build up one after the other, each with how many answers it asks for. */
const pyramidStage: RoundStage = {
  id: "pyramid",
  figure: (env, round) => {
    const count = round.questions.length;
    const figure = pyramidFigure(count, () => "intro", env.t("special.pyramidName"));
    figure.querySelectorAll<HTMLElement>(".quiz-pyramid-tier").forEach((tier, index) => {
      tier.setAttribute("data-label", env.t("special.tier", { count: pyramidAsks(index) }));
      tier.style.setProperty("--qp-tier", String(index));
    });
    return figure;
  },
  rules: (env) => [env.t("special.perAnswer"), env.t("special.overRule")],
  guide: (env, round) => [
    ...round.questions.map((_, index) => ({ label: env.t("special.guideQuestion", { n: index + 1, count: pyramidAsks(index) }), text: env.t("special.allPoints", { points: env.labels.points(pyramidAsks(index)) }) })),
    { label: env.t("special.guideOver"), text: env.labels.points(0) },
  ],
};

/** The Safe: its code windows click to green one after the other, then the bonus. */
const safeStage: RoundStage = {
  id: "safe",
  figure: (env, round) => {
    const windows = round.questions.map(() => ({ state: "setting" as const, text: "✓" }));
    return vaultFigure({ windows, dial: { from: 0, to: 0, isTurning: false }, door: "closed", label: env.t("special.safeName") });
  },
  rules: (env, round) => [env.t("special.oneDigitEach"), env.t("special.perDigit"), env.t("special.bonus", { count: round.questions.length, bonus: env.number(safeBonus(round)) })],
  guide: (env, round) => [
    { label: env.t("special.guideDigit"), text: env.labels.points(1) },
    { label: env.t("special.guideAll", { count: round.questions.length }), text: env.t("special.guideBonus", { n: env.number(safeBonus(round)) }) },
  ],
  entry: (env, team) => ({ label: env.t("special.digits", { team }), less: env.t("special.digitLess", { team }), more: env.t("special.digitMore", { team }) }),
  recap: (env, round) => {
    const digits = safeCode(round).map((digit) => h("span", { class: "qp-code-digit" }, digit === null ? "?" : String(digit)));
    return h("p", { class: "qp-code", "data-safe-code": "" }, h("span", { class: "qp-code-label" }, env.t("special.code")), h("span", { class: "qp-code-digits" }, ...digits));
  },
};

/** A prize as the opening shows it: a medal with its place (or a star) and what it is worth. */
function prize(mark: string, text: string, place: string): HTMLElement {
  return h("div", { class: "qp-prize", "data-prize": place }, h("span", { class: "qp-prize-mark" }, mark), h("span", { class: "qp-prize-text" }, text));
}

/** "Make the quizmaster laugh": two medals — the funniest team's prize and the runner-up's. */
const laughStage: RoundStage = {
  id: "laugh",
  figure: (env, round) => {
    const { first, second } = laughPrizes(round);
    return h("div", { class: "qp-prizes" }, prize("1", env.labels.points(first), "first"), prize("2", env.labels.points(second), "second"));
  },
  rules: (env) => [env.t("task.laughEvery"), env.t("task.laughTell"), env.t("task.laughTwo"), env.t("task.laughOnly")],
  guide: (env, round) => [
    { label: env.t("task.first"), text: env.labels.points(laughPrizes(round).first) },
    { label: env.t("task.second"), text: env.labels.points(laughPrizes(round).second) },
    { label: env.t("task.others"), text: env.labels.points(0) },
  ],
};

/** The free game: what a team can win, as one star. */
const taskStage: RoundStage = {
  id: "task",
  figure: (env, round) => h("div", { class: "qp-prizes" }, prize("★", env.t("special.allPoints", { points: env.labels.points(taskPoints(round)) }), "first")),
  rules: (env) => [env.t("task.freeScreen"), env.t("task.freeHost")],
  guide: (env, round) => [{ label: env.t("task.freeGuide"), text: env.t("special.allPoints", { points: env.labels.points(taskPoints(round)) }) }],
};

/** The player's special round kinds. */
export const roundStages: Registry<RoundStage> = createRegistry<RoundStage>([pyramidStage, safeStage, laughStage, taskStage]);
