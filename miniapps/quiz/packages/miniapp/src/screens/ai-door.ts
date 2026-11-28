// The buttons that open an AI window (screens/ai/, loaded with the first press): in the library, in a
// quiz and in a standard round. Small and eager; the windows themselves are not. One window at a time.
import type { App } from "../app/state.ts";
import { labelButton } from "../dom/controls.ts";
import type { TextKey } from "../i18n/translate.ts";
import { readLastJob } from "../storage/ai-prefs.ts";
import { forgetSharedText, readSharedText } from "../storage/shared.ts";
import type { AiKind } from "./ai/index.ts";

/** An AI window is open or on its way: a second press opens nothing. Kept here, the eager side, so it holds while the code loads. */
let isOpening = false;

/**
 * Opens an AI window, loading it first; says so when it cannot be loaded (offline before it was cached).
 * @param app - the mounted creator
 * @param kind - which job
 * @param options - the round for new questions; text shared from another app
 * @returns whether a window opened
 */
export async function openAiLazily(app: App, kind: AiKind, options: { readonly roundId?: string; readonly shared?: string } = {}): Promise<boolean> {
  if (isOpening || app.host.querySelector("[data-ai-dialog]")) return false;
  isOpening = true;
  try {
    const { openAi } = await import("./ai/index.ts");
    return !app.signal.aborted && openAi(app, kind, options);
  } catch {
    if (!app.signal.aborted) app.context.shell.toast(app.t("ai.notLoaded"), { tone: "error" });
    return false;
  } finally {
    isOpening = false;
  }
}

/**
 * Opens the job a prompt was last given for (storage/ai-prefs.ts) with the text another app shared
 * (storage/shared.ts) — its quiz or round first; a new quiz when that is gone. The text is forgotten once shown.
 * @param app - the mounted creator
 */
export async function takeShared(app: App): Promise<void> {
  const text = await readSharedText();
  if (text.trim() === "" || app.signal.aborted) return;
  const last = readLastJob(app.context.storage.prefs);
  let kind: AiKind = "quiz";
  if (last.kind !== "quiz" && last.quizId !== undefined) {
    const route = last.kind === "questions" && last.roundId !== undefined ? { screen: "round", quiz: last.quizId, round: last.roundId } as const : { screen: "quiz", quiz: last.quizId } as const;
    // The window opens once the quiz's screen is drawn (a draw clears the area, an open window with it); its quiz
    // or round gone, the screen falls back to the library and the answer goes to a new quiz instead.
    app.go(route, "push");
    await app.shown();
    if (app.current?.quiz.id === last.quizId && app.route.screen !== "library") kind = last.kind;
  }
  const options = last.roundId === undefined ? { shared: text } : { shared: text, roundId: last.roundId };
  const isShown = (await openAiLazily(app, kind, options)) || (kind !== "quiz" && (await openAiLazily(app, "quiz", { shared: text })));
  if (isShown) await forgetSharedText();
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
  button.addEventListener("click", () => { void openAiLazily(app, kind, roundId === undefined ? {} : { roundId }); });
  return button;
}
