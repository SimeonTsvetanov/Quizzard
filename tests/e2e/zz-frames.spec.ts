import { test, type Page } from "@playwright/test";

// Diagnostics, not a check (2026-11-23): WebKit on CI stops producing frames in a few flows and this repo cannot run
// WebKit locally. Each step logs how many frames the page drew in one second, its longest gap between two frames and
// the animations still running, so the CI log shows where the page stalls. It never fails; remove it once the cause
// is fixed and recorded in docs/DECISIONS.md.
test.use({ serviceWorkers: "block" });

interface Frames {
  readonly frames: number;
  readonly longestGapMs: number;
  readonly running: readonly string[];
}

/** One second of frames, or "STALLED" when the page does not answer within 12 s. */
async function measure(page: Page, label: string): Promise<void> {
  const started = Date.now();
  const result = await Promise.race([
    page.evaluate(
      (): Promise<Frames> =>
        new Promise((resolve) => {
          const start = performance.now();
          let last = start;
          let frames = 0;
          let longest = 0;
          const tick = (now: number): void => {
            frames += 1;
            longest = Math.max(longest, now - last);
            last = now;
            if (now - start < 1000) {
              requestAnimationFrame(tick);
              return;
            }
            const running = document
              .getAnimations()
              .filter((one) => one.playState === "running")
              .map((one) => {
                if (one instanceof CSSAnimation) return one.animationName;
                return one instanceof CSSTransition
                  ? `transition:${one.transitionProperty}`
                  : "script";
              });
            resolve({ frames, longestGapMs: Math.round(longest), running });
          };
          requestAnimationFrame(tick);
        }),
    ),
    new Promise<"STALLED">((resolve) => {
      setTimeout(() => {
        resolve("STALLED");
      }, 12_000);
    }),
  ]);
  const project = test.info().project.name;
  console.warn(
    `FRAMES ${project} | ${label} | ${JSON.stringify(result)} | took ${String(Date.now() - started)} ms`,
  );
}

/** A step that may hang: logged instead of failing the run. */
async function step(label: string, action: () => Promise<unknown>): Promise<void> {
  const started = Date.now();
  const outcome = await Promise.race([
    action().then(
      () => "ok",
      (error: unknown) => `error: ${String(error).slice(0, 160)}`,
    ),
    new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve("TIMED OUT after 12 s");
      }, 12_000);
    }),
  ]);
  console.warn(
    `STEP ${test.info().project.name} | ${label} | ${outcome} | ${String(Date.now() - started)} ms`,
  );
}

test("frames: Home, a tool, the menu, Settings, a language change", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("./");
  await measure(page, "Home at load");
  await page.waitForTimeout(2500);
  await measure(page, "Home after 2.5 s");
  await step("open Scores from its tile", () =>
    page.locator('[data-card="scores"]').click({ timeout: 10_000 }),
  );
  await measure(page, "Scores just opened");
  await page.waitForTimeout(2000);
  await measure(page, "Scores after 2 s");
  for (const round of [1, 2, 3]) {
    await step(`menu open ${String(round)}`, () =>
      page.locator("[data-menu-open]").click({ timeout: 10_000 }),
    );
    await measure(page, `menu open ${String(round)}`);
    await step(`settings open ${String(round)}`, () =>
      page.locator('[data-menu] [data-action="settings"]').click({ timeout: 10_000 }),
    );
    await measure(page, `settings open ${String(round)}`);
    const value = ["lang-bg", "lang-en", "theme-dark"][round - 1] ?? "theme-dark";
    await step(`pick ${value}`, () =>
      page
        .locator(`dialog[data-dialog="settings"][open] label[for="${value}"]`)
        .click({ timeout: 10_000 }),
    );
    await measure(page, `picked ${value}`);
    await step("Escape (settings)", () => page.keyboard.press("Escape"));
    await measure(page, `settings closed ${String(round)}`);
    await step("Escape (menu)", () => page.keyboard.press("Escape"));
    await measure(page, `menu closed ${String(round)}`);
  }
  await step("back to Home", () => page.locator("[data-back]").click({ timeout: 10_000 }));
  await measure(page, "Home again");
  await page.waitForTimeout(2500);
  await measure(page, "Home again after 2.5 s");
});
