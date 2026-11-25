// Reads the library again. In `app/`, not with the library's screen: the quiz-file code that the
// screen loads lazily needs it too, and would otherwise import the screen back (an import cycle).
import type { App } from "./state.ts";

/** Reads the library again and draws it; a browser that refuses storage gets the error state. */
export async function loadLibrary(app: App, focus?: string): Promise<void> {
  app.library = await app.store.list().catch(() => "error" as const);
  if (!app.signal.aborted && app.route.screen === "library") app.draw(focus);
}
