// @vitest-environment jsdom
// The router and the order of a traversal's events (UX review, CI item: WebKit). Engines differ in
// whether `popstate` or `hashchange` comes first, whether `hashchange` comes at all for entries
// written with pushState, and whether the address is already the new entry's when `popstate` fires.
// Whatever the order, the screen on show ends up the one the address names, and Back to Home works.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRouter, type ScreenRoute } from "./router.ts";

const name = (route: ScreenRoute): string => (route.kind === "home" ? "home" : route.id);
/** The screens the router of the running test showed (earlier tests' routers still listen: each keeps its own list). */
let shown: string[] = [];
const last = (): string | undefined => shown.at(-1);

/** A router on Home that has opened the quiz tool: entries [Home, #/quiz]. */
function openTool(): ReturnType<typeof createRouter> {
  history.replaceState(null, "", "/");
  const mine: string[] = [];
  shown = mine;
  const router = createRouter({ ids: ["quiz", "teams"], onScreen: (route) => { mine.push(name(route)); } });
  router.start();
  router.navigation.open("quiz");
  return router;
}

/** Puts the address on Home's entry the way a traversal does, without firing any event. */
function landOnHome(): void {
  history.replaceState({ quizzardScreen: { homeBelow: false } }, "", "/");
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe("a traversal from a tool to Home", () => {
  it("popstate first, then hashchange", () => {
    openTool();
    expect(last()).toBe("quiz");
    landOnHome();
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(last()).toBe("home");
    window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL: "http://localhost/#/quiz", newURL: "http://localhost/" }));
    vi.runAllTimers();
    expect(shown).toEqual(["home", "quiz", "home"]); // shown once
  });

  it("hashchange first, then popstate", () => {
    openTool();
    landOnHome();
    window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL: "http://localhost/#/quiz", newURL: "http://localhost/" }));
    expect(last()).toBe("home");
    window.dispatchEvent(new PopStateEvent("popstate"));
    vi.runAllTimers();
    expect(shown).toEqual(["home", "quiz", "home"]);
  });

  it("popstate alone, no hashchange", () => {
    openTool();
    landOnHome();
    window.dispatchEvent(new PopStateEvent("popstate"));
    vi.runAllTimers();
    expect(shown).toEqual(["home", "quiz", "home"]);
  });

  it("popstate before the address is the new entry's, and no hashchange after it: Home is shown once the traversal has landed", () => {
    openTool();
    window.dispatchEvent(new PopStateEvent("popstate")); // the address still says #/quiz
    expect(last()).toBe("quiz");
    landOnHome();
    vi.runAllTimers();
    expect(shown).toEqual(["home", "quiz", "home"]);
  });
});

describe("Back to Home after a traversal inside the tool", () => {
  it("a tool's own Back (same address, popstate only) leaves the header's Back working — in either order of a later traversal", () => {
    const router = openTool();
    history.pushState({ quizzardScreen: { homeBelow: true }, quizzardSub: 1 }, "", location.href); // the tool's own sub-screen
    const go = vi.spyOn(history, "go").mockImplementation(() => undefined);
    router.navigation.home();
    expect(go).toHaveBeenCalledWith(-2); // over the sub-screen and the tool's first entry
    router.navigation.home(); // a second tap while the traversal is under way does nothing
    expect(go).toHaveBeenCalledTimes(1);
    // The traversal lands inside the tool instead (the person pressed Forward): popstate only.
    window.dispatchEvent(new PopStateEvent("popstate"));
    vi.runAllTimers();
    router.navigation.home();
    expect(go).toHaveBeenCalledTimes(2); // not stuck
    go.mockRestore();
  });
});
