import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Cascade-layer order every app ships (design → css-architecture §1), plus Quizzard's last layer
 * `miniapp` (PLAN §1.3): every mini-app's CSS is wrapped in `miniapp.<id>`, so it beats shell CSS
 * whatever the specificity. The bundler may drop the `@layer a, b;` statement in app.css, and then
 * the FIRST `@layer x { … }` block of each name fixes the order — an import moved above tokens.css
 * would silently flip which rules win.
 */
const LAYER_ORDER = ["tokens", "base", "layout", "components", "utilities", "overrides", "miniapp"];

/** Full layer names (`a.b`) in the order the page's stylesheets first mention them (CSSOM, what the cascade uses). */
async function layerOrder(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const layerNames = (rule: CSSRule, prefix: string): string[] => {
      if (rule instanceof CSSLayerStatementRule)
        return rule.nameList.map((name) => `${prefix}${name}`);
      if (!(rule instanceof CSSLayerBlockRule)) return [];
      const name = `${prefix}${rule.name}`;
      return [name, ...Array.from(rule.cssRules).flatMap((child) => layerNames(child, `${name}.`))];
    };
    const rules = Array.from(document.styleSheets).flatMap((sheet) => Array.from(sheet.cssRules));
    return [...new Set(rules.flatMap((rule) => layerNames(rule, "")))];
  });
}

test("built CSS declares the cascade layers in the forge order, miniapp last", async ({ page }) => {
  await page.goto("./");
  expect(await layerOrder(page)).toEqual(LAYER_ORDER);
});

// The isolated-CSS probe (app/test/fixtures/css-probe/, e2e build only): its stylesheet is scoped by
// app/build/miniapp-css.ts under [data-miniapp="probe"] in "isolated" mode (reset sub-layer first).
test.describe("isolated mini-app CSS", () => {
  const scope = (page: Page): Locator => page.locator('[data-miniapp="probe"]');
  const part = (page: Page, name: string): Locator =>
    scope(page).locator(`[data-css-probe="${name}"]`);

  /** One computed value of the element `locator` points to. */
  async function computed(locator: Locator, property: string): Promise<string> {
    return locator.evaluate(
      (element, name) => getComputedStyle(element).getPropertyValue(name),
      property,
    );
  }

  /** What `var(<token>)` resolves to for `property` on a fresh element outside any mini-app. */
  async function resolved(
    page: Page,
    property: "color" | "background-color",
    token: string,
  ): Promise<string> {
    return page.evaluate(
      ([name, value]) => {
        const reference = document.createElement("p");
        // CSSOM, not a style attribute: allowed by style-src 'self'.
        reference.style.setProperty(name, value);
        document.body.append(reference);
        const result = getComputedStyle(reference).getPropertyValue(name);
        reference.remove();
        return result;
      },
      [property, `var(${token})`] as const,
    );
  }

  test.beforeEach(async ({ page }) => {
    await page.goto("./#/probe?css=isolated");
    await expect(part(page, "card")).toBeVisible();
  });

  test("the stylesheet arrives as a file in miniapp.probe, reset first, after the shell's layers", async ({
    page,
  }) => {
    expect(await layerOrder(page)).toEqual([
      ...LAYER_ORDER,
      "miniapp.probe",
      "miniapp.probe.reset",
      "miniapp.probe.base",
      "miniapp.probe.components",
    ]);
    // Strict CSP (style-src 'self'): a <link> to a same-origin file, never an inline <style>.
    expect(await page.locator("style").count()).toBe(0);
    await expect(page.locator('link[rel="stylesheet"][href*="css-probe"]')).toHaveCount(1);
  });

  test("a shell component class gets no shell styling inside the scope", async ({ page }) => {
    const properties = [
      "min-height",
      "padding-top",
      "border-top-left-radius",
      "background-color",
      "color",
      "font-weight",
      "box-shadow",
      "cursor",
    ];
    for (const property of properties) {
      expect(await computed(part(page, "shell-class"), property), property).toBe(
        await computed(part(page, "plain"), property),
      );
    }
    // Control: the same class outside the scope does get the shell's button (44 px target).
    const outside = await page.evaluate(() => {
      const button = document.createElement("button");
      button.className = "button";
      document.body.append(button);
      const minHeight = getComputedStyle(button).minHeight;
      button.remove();
      return minHeight;
    });
    expect(outside).not.toBe(await computed(part(page, "shell-class"), "min-height"));
  });

  test("an attribute-styled icon keeps its attributes but loses the shell's .toast > svg colour", async ({
    page,
  }) => {
    const icon = part(page, "icon");
    expect(await computed(icon, "width")).toBe("24px");
    expect(await computed(part(page, "circle"), "stroke-width")).toBe("3px");
    expect(await computed(part(page, "circle"), "fill")).toBe("none");
    expect(await computed(icon, "color")).toBe(await computed(part(page, "toast"), "color"));
    expect(await computed(icon, "color")).not.toBe(
      await resolved(page, "color", "--color-danger-text"),
    );
    // The toast paragraph itself is reset: no shell pill.
    expect(await computed(part(page, "toast"), "display")).toBe("block");
  });

  test("tokens resolve inside the scope; the mini-app's own token stays on the scope element", async ({
    page,
  }) => {
    const accent = await resolved(page, "background-color", "--color-accent");
    expect(accent).not.toBe("rgba(0, 0, 0, 0)");
    expect(await computed(part(page, "card"), "background-color")).toBe(accent);
    expect(await computed(scope(page), "--css-probe-gap")).not.toBe("");
    expect(await computed(page.locator("html"), "--css-probe-gap")).toBe("");
  });

  test("an unlayered mini-app rule beats a more specific one in its own sub-layer", async ({
    page,
  }) => {
    expect(await computed(part(page, "order"), "color")).toBe(
      await resolved(page, "color", "--color-success-text"),
    );
  });

  test("universal rules reach only the mini-app's elements", async ({ page }) => {
    expect(await computed(part(page, "order"), "text-underline-offset")).not.toBe("auto");
    expect(await computed(page.getByRole("banner"), "text-underline-offset")).toBe("auto");
  });

  test("[hidden] still hides and the mini-app's focus ring shows", async ({ page }) => {
    await expect(part(page, "hidden")).toBeHidden();
    const input = part(page, "focus");
    await input.focus();
    await expect(input).toBeFocused();
    expect(await computed(input, "outline-style")).toBe("solid");
    expect(await computed(input, "outline-color")).toBe(
      await resolved(page, "color", "--color-highlight"),
    );
  });
});
