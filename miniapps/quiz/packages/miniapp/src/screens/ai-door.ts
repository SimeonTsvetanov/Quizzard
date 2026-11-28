// The buttons that open an AI window (screens/ai/, loaded with the first press): in the library, in a
// quiz and in a standard round. Small and eager; the windows themselves are not.
import type { App } from "../app/state.ts";
import { labelButton } from "../dom/controls.ts";
import type { TextKey } from "../i18n/translate.ts";
import { takeSharedText } from "../storage/shared.ts";
import type { AiKind } from "./ai/index.ts";

/**
 * Opens an AI window, loading it first; says so when it cannot be loaded (offline before it was cached).
 * @param app - the mounted creator
 * @param kind - which job
 * @param options - the round for new questions; text shared from another app
 */
export function openAiLazily(app: App, kind: AiKind, options: { readonly roundId?: string; readonly shared?: string } = {}): void {
  void import("./ai/index.ts").then(({ openAi }) => { if (!app.signal.aborted) openAi(app, kind, options); }).catch(() => {
    if (!app.signal.aborted) app.context.shell.toast(app.t("ai.notLoaded"), { tone: "error" });
  });
}

/**
 * Opens "Make a quiz with AI" with the text another app shared (storage/shared.ts).
 * @param app - the mounted creator
 */
export async function takeShared(app: App): Promise<void> {
  const text = await takeSharedText();
  if (text.trim() !== "" && !app.signal.aborted) openAiLazily(app, "quiz", { shared: text });
}

/** The words of each AI button. */
const LABELS: Readonly<Record<AiKind, TextKey>> = { quiz: "ai.open", rounds: "ai.addRounds", questions: "ai.addQuestions", check: "ai.check" };

/**
 * A button that opens an AI window: the AI mark and its words, quiet beside the screen's main button.
 * @param app - the mounted creator
 * @param kind - which job
 * @param roundId - the round, for new questions
 */
export function aiButton(app: App, kind: AiKind, roundId?: string): HTMLButtonElement {
  const button = labelButton("ai", app.t(LABELS[kind]), { class: "button quiz-ai-open", [`data-ai-open-${kind}`]: "" });
  button.addEventListener("click", () => { openAiLazily(app, kind, roundId === undefined ? {} : { roundId }); });
  return button;
}
