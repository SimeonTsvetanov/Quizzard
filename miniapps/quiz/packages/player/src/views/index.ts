// The only file that lists the views. `fallbackView` stands in for a screen without one (a round
// kind from a later Quizzard), so the game still moves through it.
import { type Registry, createRegistry } from "@simeonts/quizzard-quiz-core/play";
import { answerView, answersView, codeView } from "./answers.ts";
import { boardView } from "./board.ts";
import type { ViewEntry } from "./context.ts";
import { finalView } from "./final.ts";
import { heading, viewRoot } from "./parts.ts";
import { pyramidView } from "./pyramid.ts";
import { questionView } from "./question.ts";
import { rulesView } from "./rules.ts";
import { scoreView, tallyView } from "./score.ts";
import { teamsView } from "./teams.ts";
import { tieView } from "./tie.ts";
import { titleView } from "./title.ts";

/** A fresh registry with every view of this version. */
export function createViews(): Registry<ViewEntry> {
  return createRegistry<ViewEntry>([titleView, teamsView, rulesView, questionView, pyramidView, answersView, answerView, codeView, scoreView, tallyView, boardView, tieView, finalView]);
}

/** Shown for a screen this version has no view for: the quiz's name, so the stage is never blank. */
export const fallbackView: ViewEntry = {
  id: "",
  stage: ({ env }) => ({ element: viewRoot("fallback", heading(env.file.quiz.name)) }),
};
