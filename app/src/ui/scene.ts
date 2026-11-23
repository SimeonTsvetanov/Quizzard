// The animated background behind every screen (styles/components/scene.css): a starry sky that drifts slowly
// upwards in the dark theme, soft mountains under a turning sun in the light one. Settings → Background switches
// between it and the simple glow ("Simple"); theme-init.js applies the saved choice before the first paint.
import { prefs } from "../storage/index.ts";
import { buildScene } from "./scene-dom.ts";

/** The background choice: the animated scene, or the simple glow of 0.14. */
export type Backdrop = "scene" | "simple";

const KEY = "backdrop";
/** Returns the saved choice; the scene unless the user picked "simple". */
export function getBackdrop(): Backdrop {
  return prefs.get<string>(KEY, "scene") === "simple" ? "simple" : "scene";
}

/** Applies a choice; `save` remembers it on this device (theme-init.js reads the same key). */
export function applyBackdrop(choice: Backdrop, save = false): void {
  if (save) {
    if (choice === "scene") prefs.remove(KEY);
    else prefs.set(KEY, choice);
  }
  document.documentElement.setAttribute("data-backdrop", choice);
  if (choice === "scene" && !document.querySelector(".scene")) buildScene();
}

/** Applies the saved choice at start-up. */
export function initBackdrop(): void {
  applyBackdrop(getBackdrop());
}
