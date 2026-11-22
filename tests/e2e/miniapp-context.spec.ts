import { expect, test, type Page } from "@playwright/test";

// Shell services for mini-apps (PLAN T-06), proved from the mini-app's side with the probe
// (app/test/fixtures/probe-services.ts, e2e build only): language and theme signals, toast,
// confirm, share, prefs and the header slot; and what the shell releases at unmount. The update
// offer that waits while a mini-app is busy is in pwa.spec.ts (it needs a service worker).
// Service workers are blocked: their "Ready to work offline" toast would replace the probe's.
test.use({ serviceWorkers: "block" });

/** The probe's counters on `window.quizzardProbe` this file reads. */
interface ProbeCounters {
  readonly signalFires: number;
  readonly unmounts: number;
}

const probe = (page: Page) => page.locator('[data-miniapp="probe"] [data-probe]');
const out = (page: Page, name: string) => probe(page).locator(`[data-probe-${name}]`);
const control = (page: Page, name: string) => probe(page).getByRole("button", { name, exact: true });
const slot = (page: Page) => page.locator("[data-header-slot]");
const back = (page: Page) => page.getByRole("banner").getByRole("button", { name: "Back to Home" });

const counters = async (page: Page): Promise<ProbeCounters> => {
  const value: unknown = await page.evaluate((): unknown => Reflect.get(window, "quizzardProbe"));
  if (typeof value !== "object" || value === null) throw new Error("the probe has not loaded");
  return value as ProbeCounters; // because the probe's own module writes exactly this shape
};

/** Opens the probe by deep link and waits for its service panel. */
async function openProbe(page: Page): Promise<void> {
  await page.goto("./#/probe");
  await expect(out(page, "lang")).toBeVisible();
}

/** Picks a Settings option (radio `<name>-<value>`) the way a person does: menu → Settings. */
async function pickSetting(page: Page, name: "lang" | "theme", value: string): Promise<void> {
  await page.locator("[data-menu-open]").click();
  await page.locator('[data-menu] [data-action="settings"]').click();
  const settings = page.locator('dialog[data-dialog="settings"][open]');
  await settings.locator(`label[for="${name}-${value}"]`).click();
  await expect(settings.locator(`#${name}-${value}`)).toBeChecked();
  await page.keyboard.press("Escape");
  await expect(settings).toHaveCount(0);
}

test("language and theme changes reach the mini-app; after unmount nothing fires and the slot is gone", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await openProbe(page);
  await expect(out(page, "lang")).toHaveText("en");
  await expect(out(page, "theme")).toHaveText("light");

  await pickSetting(page, "lang", "bg");
  await expect(out(page, "lang")).toHaveText("bg");
  await expect(page.locator('[data-miniapp="probe"]')).toHaveAttribute("lang", "bg");
  await pickSetting(page, "theme", "dark");
  await expect(out(page, "theme")).toHaveText("dark");
  await pickSetting(page, "theme", "system");
  await expect(out(page, "theme")).toHaveText("light");
  await page.emulateMedia({ colorScheme: "dark" }); // "system" follows the OS: a resolved change
  await expect(out(page, "theme")).toHaveText("dark");
  await expect.poll(async () => (await counters(page)).signalFires).toBe(4); // bg, dark, light, dark

  await page.locator("[data-back]").click(); // labelled in Bulgarian now
  await expect(probe(page)).toHaveCount(0);
  await expect.poll(async () => (await counters(page)).unmounts).toBe(1);
  await expect(slot(page)).toHaveCount(0);
  // The probe never unsubscribed: only the shell's release keeps these from reaching it.
  await pickSetting(page, "lang", "en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await pickSetting(page, "theme", "light");
  await page.emulateMedia({ colorScheme: "light" });
  expect((await counters(page)).signalFires).toBe(4);
});

test("toast: the mini-app's text is shown as text, its action runs, an error toast is an alert", async ({ page }) => {
  await openProbe(page);
  await control(page, "Toast").click();
  const toast = page.locator(".toast").filter({ hasText: "<b>Probe</b> toast" });
  await expect(toast).toBeVisible();
  await expect(toast.locator("b")).toHaveCount(0);
  await toast.getByRole("button", { name: "Act" }).click();
  await expect(out(page, "action")).toHaveText("acted");
  await control(page, "Error toast").click();
  await expect(page.getByRole("alert").filter({ hasText: "Probe failed" })).toBeVisible();
});

test("confirm: the shell's alert resolves true on the action, false on Cancel, Escape and the backdrop", async ({ page }) => {
  await openProbe(page);
  const alert = page.getByRole("alertdialog", { name: "Reset the probe?" });
  const answer = async (act: () => Promise<void>, expected: string): Promise<void> => {
    await control(page, "Confirm").click();
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Probe <i>text</i>"); // text, never HTML
    await expect(alert.getByRole("button", { name: "Cancel" })).toBeFocused(); // the safe default
    await act();
    await expect(out(page, "confirm")).toHaveText(expected);
    await expect(alert).toHaveCount(0);
  };
  await answer(() => alert.getByRole("button", { name: "Reset" }).click(), "true");
  await answer(() => alert.getByRole("button", { name: "Cancel" }).click(), "false");
  await answer(() => page.keyboard.press("Escape"), "false");
  await answer(() => page.mouse.click(2, 2), "false"); // the dimmed backdrop
});

test("share: the device sheet → shared, its cancel → cancelled; the fallback sheet → copied or cancelled", async ({ page }) => {
  await openProbe(page);
  const share = async (expected: string): Promise<void> => {
    await control(page, "Share").click();
    await expect(out(page, "share")).toHaveText(expected);
  };
  await page.evaluate(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: () => Promise.resolve() });
  });
  await share("shared");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: () => Promise.reject(new DOMException("closed", "AbortError")) });
  });
  await share("cancelled");

  // No device sheet: the shell's WhatsApp + Copy sheet.
  await page.evaluate(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.resolve() } });
  });
  const sheet = page.locator('dialog[data-dialog="share"][open]');
  await control(page, "Share").click();
  await sheet.getByRole("button", { name: "Copy" }).click();
  await expect(out(page, "share")).toHaveText("copied");
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await control(page, "Share").click();
  await expect(sheet).toBeVisible();
  await expect(out(page, "share")).toHaveText("pending");
  await page.keyboard.press("Escape");
  await expect(out(page, "share")).toHaveText("cancelled");
});

test("prefs: a short key is stored under the mini-app's prefix; a key that could escape it is rejected", async ({ page }) => {
  await openProbe(page);
  await control(page, "Save pref").click();
  await expect(out(page, "pref")).toHaveText("quizzard-probe:v1:color=green saved:true");
  const stored = await page.evaluate(() => ({
    raw: localStorage.getItem("quizzard-probe:v1:color"),
    shell: localStorage.getItem("quizzard:v1:color"),
  }));
  expect(stored).toEqual({ raw: '"green"', shell: null });
  await control(page, "Bad key").click();
  await expect(out(page, "pref")).toHaveText("rejected");
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.includes("escape")))).toEqual([]);
});

test.describe("header slot at 320 px", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test("four mini-app buttons scroll inside the slot: same header height, logo and menu stay on screen", async ({ page }) => {
    await page.goto("./");
    const header = page.locator("[data-header]");
    await expect(page.locator("[data-launcher]")).not.toHaveAttribute("aria-busy", "true");
    const homeHeight = (await header.boundingBox())?.height;
    await openProbe(page);
    const buttons = slot(page).getByRole("button", { name: /^Probe action \d$/ });
    await expect(buttons).toHaveCount(4);
    // In the shell's header, before the menu button.
    expect(await page.evaluate(() => {
      const slotElement = document.querySelector("[data-header-slot]");
      const menu = document.querySelector("[data-menu-open]");
      return slotElement !== null && menu !== null && slotElement.parentElement === menu.parentElement
        && (slotElement.compareDocumentPosition(menu) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    })).toBe(true);
    expect((await header.boundingBox())?.height).toBe(homeHeight);
    for (const selector of ["[data-home-link] img", "[data-menu-open]", "[data-back]"]) {
      const box = await page.locator(selector).boundingBox();
      expect(box, selector).not.toBeNull();
      expect(box?.x ?? -1, selector).toBeGreaterThanOrEqual(0);
      expect((box?.x ?? 0) + (box?.width ?? 0), selector).toBeLessThanOrEqual(320);
    }
    expect(await slot(page).evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
    // Every button is reachable: keyboard focus scrolls it into the slot's view (never entirely
    // hidden, WCAG 2.4.11) and a tap reaches it; the page never scrolls sideways.
    for (const index of [1, 2, 3, 4]) {
      const button = buttons.nth(index - 1);
      await button.focus();
      await expect(button).toBeFocused();
      await expect(button).toBeInViewport();
      await button.click({ trial: true });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

    await back(page).click();
    await expect(slot(page)).toHaveCount(0);
    expect((await header.boundingBox())?.height).toBe(homeHeight);
  });
});
