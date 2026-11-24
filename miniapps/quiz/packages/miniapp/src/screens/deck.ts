// Everything a quiz's own screens need — the quiz with its rounds, the editor, the preview, Play —
// and the UI halves of the registries they draw with (lazy: the creator opens on the library, which
// needs none of it; this chunk is fetched while the library is on show and awaited when a quiz opens).
// Screens are looked up by the route, never switched on.
import type { Quiz } from "@simeonts/quizzard-quiz-core";
import { answerUis } from "../answers-ui/index.ts";
import type { Route } from "../app/routes.ts";
import type { App } from "../app/state.ts";
import { kindUis } from "../kinds-ui/index.ts";
import { type UiRegistries, createUiRegistries } from "../ui-registry.ts";
import { editorScreen } from "./editor.ts";
import { playScreen } from "./play.ts";
import { previewScreen } from "./preview.ts";
import { quizScreen } from "./quiz.ts";

/** The screen of each route that shows a quiz. */
export type DeckScreens = Readonly<Record<Exclude<Route["screen"], "library">, (app: App, quiz: Quiz) => HTMLElement>>;

/** The screens, by route. */
export const SCREENS: DeckScreens = {
  quiz: quizScreen,
  round: quizScreen,
  editor: editorScreen,
  preview: previewScreen,
  play: playScreen,
};

/** The UI registries: every kind and answer type this version can draw and edit. */
export const UI: UiRegistries = createUiRegistries(kindUis, answerUis);
