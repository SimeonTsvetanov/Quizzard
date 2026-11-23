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
      (error: unknown) => `error: ${String(error).replaceAll("\n", " / ").slice(0, 700)}`,
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

/** Home's parts, switched off one after another (cumulative), then three of them alone. */
const VARIANTS: readonly (readonly [string, readonly string[]])[] = [
  ["baseline", []],
  ["- lights", [".home::before { display: none !important; }"]],
  ["- lights - stars", [".home::after { display: none !important; }"]],
  [
    "- … - tile ghost and sweep",
    [".launcher-item > *::before, .launcher-item > *::after { display: none !important; }"],
  ],
  ["- … - icon masks", [".launcher-mark::before { display: none !important; }"]],
  [
    "- … - header blur",
    [".app-header { -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }"],
  ],
  ["- … - wordmark", ["[data-wordmark] { display: none !important; }"]],
  [
    "- … - tile gradients and shadows",
    [".launcher-item > * { background: gray !important; box-shadow: none !important; }"],
  ],
  ["- … - web fonts", ["* { font-family: sans-serif !important; }"]],
];
const ALONE: readonly (readonly [string, string])[] = [
  ["only lights off", ".home::before { display: none !important; }"],
  ["only stars off", ".home::after { display: none !important; }"],
  [
    "only header blur off",
    ".app-header { -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }",
  ],
  [
    "only tile pseudo-elements and masks off",
    ".launcher-item > *::before, .launcher-item > *::after, .launcher-mark::before { display: none !important; }",
  ],
];

/** Adds rules through the CSSOM (the page's CSP blocks inline style elements) and keeps something moving. */
async function apply(page: Page, rules: readonly string[]): Promise<void> {
  await page.evaluate((list) => {
    let sheet = (window as unknown as { diagSheet?: CSSStyleSheet }).diagSheet;
    if (!sheet) {
      sheet = new CSSStyleSheet();
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      (window as unknown as { diagSheet?: CSSStyleSheet }).diagSheet = sheet;
    }
    for (const rule of list) sheet.insertRule(rule, sheet.cssRules.length);
    // A repaint on every frame: without one an idle page draws nothing and every variant looks fast.
    const wizard = document.querySelector(".launcher-wizard");
    if (wizard?.getAnimations().every((one) => one.id !== "diag") === true) {
      wizard.animate([{ transform: "rotate(-4deg)" }, { transform: "rotate(4deg)" }], {
        duration: 400,
        iterations: Infinity,
        direction: "alternate",
        id: "diag",
      });
    }
  }, rules);
}

test("frames: which part of Home is slow", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("./");
  await page.waitForTimeout(1500);
  for (const [label, rules] of VARIANTS) {
    await apply(page, rules);
    await measure(page, `Home ${label}`);
  }
  for (const [label, rule] of ALONE) {
    await page.goto("./");
    await page.waitForTimeout(1500);
    await apply(page, [rule]);
    await measure(page, `Home ${label}`);
  }
});

/** What the page looks like to a click on the menu button: the element hit there and every running animation. */
async function probe(page: Page, label: string): Promise<void> {
  const state = await Promise.race([
    page.evaluate(() => {
      const button = document.querySelector("[data-menu-open]");
      const box = button?.getBoundingClientRect();
      const hit = box
        ? document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
        : null;
      const animations = document.documentElement.getAnimations({ subtree: true }).map((one) => {
        const effect = one.effect instanceof KeyframeEffect ? one.effect : null;
        const name = one instanceof CSSAnimation ? one.animationName : "other";
        return `${name}@${effect?.pseudoElement ?? effect?.target?.nodeName ?? "?"}:${one.playState}`;
      });
      return {
        hit: hit ? `${hit.nodeName}.${hit.className}` : "none",
        hitIsButton: hit !== null && button !== null && (hit === button || button.contains(hit)),
        animations,
        tool: document.documentElement.dataset["tool"] ?? "",
        mounted: document.querySelector("[data-miniapp]") !== null,
      };
    }),
    new Promise<"STALLED">((resolve) => {
      setTimeout(() => {
        resolve("STALLED");
      }, 12_000);
    }),
  ]);
  console.warn(`PROBE ${test.info().project.name} | ${label} | ${JSON.stringify(state)}`);
}

const FLOWS: readonly (readonly [string, readonly string[], boolean])[] = [
  ["as shipped", [], false],
  ["reduced motion (no morph)", [], true],
  ["no glow behind the tool", [".outlet::before { display: none !important; }"], false],
  ["no web fonts", ["* { font-family: sans-serif !important; }"], false],
  [
    "no Home lights, stars, tile layers",
    [
      ".home::before, .home::after, .launcher-item > *::before, .launcher-item > *::after { display: none !important; }",
    ],
    false,
  ],
];

for (const [label, rules, isReduced] of FLOWS) {
  test(`click after the morph: ${label}`, async ({ page }) => {
    test.setTimeout(120_000);
    if (isReduced) await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("./");
    await page.waitForTimeout(1500);
    if (rules.length > 0) {
      await page.evaluate((list) => {
        const sheet = new CSSStyleSheet();
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
        for (const rule of list) sheet.insertRule(rule, sheet.cssRules.length);
      }, rules);
    }
    await step(`${label}: open Scores`, () =>
      page.locator('[data-card="scores"]').click({ timeout: 10_000 }),
    );
    await probe(page, `${label}: right after`);
    await page.waitForTimeout(4000);
    await probe(page, `${label}: 4 s later`);
    await step(`${label}: menu click`, () =>
      page.locator("[data-menu-open]").click({ timeout: 8000 }),
    );
    await probe(page, `${label}: after the menu click`);
  });
}
